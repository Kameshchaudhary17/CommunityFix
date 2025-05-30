// controllers/suggestionController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notificationService } = require("../services/notificationService");

exports.createSuggestion = async (req, res) => {
  try {
    const { title, description, municipality, wardNumber } = req.body;
    const userId = req.user.id; // Get user ID from auth middleware
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    
    // Fetch user details from the database
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        municipality: true,
        wardNumber: true,
        user_name: true,
        user_email: true,
        user_id: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Use user's municipality and ward if not provided
    const finalMunicipality = municipality || user.municipality;
    const finalWardNumber = wardNumber || user.wardNumber;
    
    // Create the suggestion
    const suggestion = await prisma.suggestion.create({
      data: {
        title,
        description,
        municipality: finalMunicipality,
        wardNumber: finalWardNumber,
        userId,
      },
      include: {
        user: true, // Include user data in the response
      },
    });
    
    // Send notifications to municipality users
    try {
      // Find municipality users to notify
      const municipalityUsers = await prisma.users.findMany({
        where: {
          role: 'MUNICIPALITY',
          municipality: finalMunicipality,
          user_id: { not: userId }, // Exclude the creator
        },
      });
      
      // Use the existing notifyMunicipality function which handles creating notifications
      await notificationService.notifyMunicipality({
        municipality: finalMunicipality,
        wardNumber: finalWardNumber,
        type: 'NEW_SUGGESTION',
        title: suggestion.title,
        entityType: 'suggestion',
        entityId: suggestion.id,
        creatorId: userId
      });
      
      console.log(`Notifications sent to municipality users about new suggestion: ${title}`);
    } catch (notificationError) {
      // Log but don't fail the request if notification sending fails
      console.error('Error sending notifications:', notificationError);
    }
    
    res.status(201).json({
      success: true,
      message: "Suggestion created successfully",
      data: suggestion,
    });
  } catch (error) {
    console.error("Error creating suggestion:", error);
    res.status(500).json({ message: "Failed to create suggestion", error: error.message });
  }
};

exports.getUserSuggestions = async (req, res) => {
  try {
    const userId = req.user.id; // Get userId from authenticated user
    
    // Fetch suggestions where userId matches
    const suggestions = await prisma.suggestion.findMany({
      where: { userId: parseInt(userId) },
      include: {
        user: {
          select: {
            user_name: true,
            user_email: true,
            municipality: true,
            wardNumber: true,
            profilePicture: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                user_name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        upvotes: true,
        _count: {
          select: {
            upvotes: true,
            comments: true
          }
        }
      }
    });

    // Process suggestions to include hasUserUpvoted flag
    const processedSuggestions = suggestions.map(suggestion => {
      const hasUserUpvoted = suggestion.upvotes.some(upvote => upvote.userId === userId);
      
      return {
        ...suggestion,
        hasUserUpvoted
      };
    });

    res.status(200).json({ 
      suggestions: processedSuggestions
    });
  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions', error: error.message });
  }
};

exports.upvoteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const suggestionId = parseInt(id);
    if (isNaN(suggestionId)) {
      return res.status(400).json({ message: "Invalid suggestion ID" });
    }
    
    // Check if user has already upvoted
    const existingUpvote = await prisma.upvote.findFirst({
      where: { userId, suggestionId },
    });
    
    let hasUserUpvoted = false;
    
    if (existingUpvote) {
      // Remove upvote (undo upvote)
      await prisma.upvote.delete({
        where: { id: existingUpvote.id },
      });
      
      hasUserUpvoted = false;
    } else {
      // If no upvote exists, add a new one
      await prisma.upvote.create({
        data: {
          userId,
          suggestionId,
        },
      });
      
      hasUserUpvoted = true;
      
      // Notification code...
    }
    
    // Get the updated upvote count
    const upvoteCount = await prisma.upvote.count({ where: { suggestionId } });
    
    res.status(200).json({
      message: hasUserUpvoted ? "Suggestion upvoted successfully" : "Upvote removed successfully",
      upvotes: upvoteCount,
      hasUserUpvoted: hasUserUpvoted
    });
  } catch (error) {
    console.error("Error upvoting/removing upvote:", error);
    res.status(500).json({ message: "Failed to process upvote", error: error.message });
  }
};

// Get all suggestions with filtering options
exports.getSuggestions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const userId = req.user?.id; // Ensure user ID is available

    // Fetch user details to get municipality and wardNumber
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { municipality: true, wardNumber: true, profilePicture: true}
    });

    if (!user || !user.municipality || !user.wardNumber) {
      return res.status(403).json({ message: 'Access denied: Municipality and Ward Number are required' });
    }

    // Build filter object based on user's municipality & wardNumber
    const filter = { 
      municipality: user.municipality, 
      wardNumber: user.wardNumber 
    };

    if (status && status !== 'all') {
      // Convert status to match the enum in the database (if needed)
      let dbStatus = status;
      if (status === 'submitted' || status === 'pending') {
        dbStatus = 'Pending';
      } else if (status === 'in progress') {
        dbStatus = 'IN_PROGRESS';
      } else if (status === 'approved') {
        dbStatus = 'APPROVED';
      } else if (status === 'rejected') {
        dbStatus = 'REJECTED';
      }
      filter.status = dbStatus;
    }

    // Add search functionality for title and description
    if (search) {
      filter.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination values
    const skip = (page - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count for pagination
    const totalCount = await prisma.suggestion.count({ where: filter });

    // Fetch suggestions with pagination
    const suggestions = await prisma.suggestion.findMany({
      where: filter,
      include: {
        user: {
          select: {
            user_name: true,
            user_email: true,
            municipality: true,
            wardNumber: true,
            profilePicture: true
          }
        },
        _count: {
          select: { 
            comments: true,
            upvotes: true
          }
        },
        // Include comments count for each suggestion
        comments: {
          select: {
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });

    // Check which suggestions the current user has upvoted
    const userUpvotes = userId ? await prisma.upvote.findMany({
      where: {
        userId,
        suggestionId: {
          in: suggestions.map(s => s.id)
        }
      },
      select: {
        suggestionId: true
      }
    }) : [];

    const upvotedSuggestionIds = new Set(userUpvotes.map(u => u.suggestionId));

    // Transform data to include comment count and upvote count
    const formattedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      commentsCount: suggestion._count.comments,
      upvoteCount: suggestion._count.upvotes,
      hasUserUpvoted: upvotedSuggestionIds.has(suggestion.id),
      _count: undefined,
      comments: undefined // Remove the comments array to reduce payload size
    }));

    res.status(200).json({
      suggestions: formattedSuggestions,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        itemsPerPage: take
      }
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions', error: error.message });
  }
};
// Get similar suggestions by municipality and ward
exports.getSimilarSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get the current suggestion to get its municipality and ward
    const currentSuggestion = await prisma.suggestion.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!currentSuggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    // Find similar suggestions in the same municipality and ward
    const similarSuggestions = await prisma.suggestion.findMany({
      where: {
        id: { not: parseInt(id) }, // Exclude the current suggestion
        municipality: currentSuggestion.municipality,
        wardNumber: currentSuggestion.wardNumber
      },
      include: {
        user: {
          select: {
            user_name: true
          }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { upvotes: 'desc' },
      take: 5
    });
    
    const formattedSimilarSuggestions = similarSuggestions.map(suggestion => ({
      ...suggestion,
      commentsCount: suggestion._count.comments,
      _count: undefined
    }));

    res.status(200).json({ similarSuggestions: formattedSimilarSuggestions });
  } catch (error) {
    console.error('Error fetching similar suggestions:', error);
    res.status(500).json({ message: 'Failed to fetch similar suggestions', error: error.message });
  }
};

// Get a single suggestion by ID
exports.getSuggestionById = async (req, res) => {
  try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(id)) {
          return res.status(400).json({ message: 'Invalid ID provided' });
      }

      const suggestion = await prisma.suggestion.findUnique({
          where: { id: parseInt(id) },
          include: {
              user: {
                  select: {
                      user_name: true,
                      user_email: true,
                      municipality: true,
                      wardNumber: true,
                      profilePicture: true
                  }
              },
              comments: {
                  include: {
                      user: {
                          select: {
                              user_name: true
                          }
                      }
                  },
                  orderBy: { createdAt: 'desc' }
              }
          }
      });

      if (!suggestion) {
          return res.status(404).json({ message: 'Suggestion not found' });
      }

      res.status(200).json({ suggestion });
  } catch (error) {
      console.error('Error fetching suggestion:', error);
      res.status(500).json({ message: 'Failed to fetch suggestion', error: error.message });
  }
};


// Update a suggestion
exports.updateSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const userId = req.user.id; // From auth middleware
    
    // Find the suggestion to check ownership
    const existingSuggestion = await prisma.suggestion.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true }
    });
    
    if (!existingSuggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    // Check if user is the owner or an admin
    if (existingSuggestion.userId !== userId && req.user.role !== 'MUNICIPALITY') {
      return res.status(403).json({ message: 'You do not have permission to update this suggestion' });
    }
    
    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    
    // Only admins can update status
    if (status && req.user.role === 'MUNICIPALITY') {
      updateData.status = status;
    }
    
    // Update the suggestion
    const updatedSuggestion = await prisma.suggestion.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            user_name: true,
            user_email: true,
          }
        }
      }
    });
    
    res.status(200).json({ 
      message: 'Suggestion updated successfully', 
      suggestion: updatedSuggestion 
    });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ message: 'Failed to update suggestion', error: error.message });
  }
};

// Delete a suggestion
exports.deleteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware
    
    // Find the suggestion to check ownership
    const existingSuggestion = await prisma.suggestion.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true }
    });
    
    if (!existingSuggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    // Check if user is the owner or an admin
    if (existingSuggestion.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You do not have permission to delete this suggestion' });
    }
    
    // Delete all comments related to the suggestion first (cascade delete alternative)
    await prisma.comment.deleteMany({
      where: { suggestionId: parseInt(id) }
    });
    
    // Delete the suggestion
    await prisma.suggestion.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ message: 'Failed to delete suggestion', error: error.message });
  }
};


exports.updateSuggestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Update request received:', { id, status, body: req.body });
    
    // Get valid status values from your enum
    const validStatuses = ['Pending', 'IN_PROGRESS', 'APPROVED', 'REJECTED'];
    
    // Validate status value
    if (!validStatuses.includes(status)) {
      console.log('Invalid status value:', status);
      return res.status(400).json({
        error: 'Invalid status value',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        receivedStatus: status
      });
    }
    
    // Get the suggestion to find its creator
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!suggestion) {
      return res.status(404).json({
        error: 'Suggestion not found',
        message: `Suggestion with ID ${id} does not exist`
      });
    }
    
    // Update suggestion status
    const updatedSuggestion = await prisma.suggestion.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    
    // Create notification for the suggestion owner
    await prisma.notification.create({
      data: {
        userId: suggestion.userId, 
        type: 'SUGGESTION_STATUS_CHANGED',
        content: `Your suggestion "${suggestion.title}" status has been updated to ${status}`,
        isRead: false,
        suggestionId: parseInt(id)
      }
    });
    
    return res.status(200).json({
      success: true,
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.error('Error updating suggestion status:', error);
    return res.status(500).json({
      error: 'Failed to update suggestion status',
      message: error.message
    });
  }
};

