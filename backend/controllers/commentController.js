const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add comment to a suggestion
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id; // From auth middleware
    
    console.log(userId)
    
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    // Check if suggestion exists
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true // Include user details to get suggestion owner information
      }
    });
    
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        text,
        suggestionId: parseInt(id),
        userId
      },
      include: {
        user: {
          select: {
            user_name: true,
            profilePicture: true
          }
        }
      }
    });
    
    // Create notification for the suggestion owner (if not the comment author)
    if (suggestion.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: suggestion.userId,
          type: 'NEW_COMMENT',
          content: `${comment.user.user_name} commented on your suggestion: "${suggestion.title}"`,
          isRead: false,
          suggestionId: parseInt(id),
          commentId: comment.id
        }
      });
      
      console.log(`Notification sent to user ${suggestion.userId} about new comment on suggestion ${id}`);
    }
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};
  
exports.getComments = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate suggestion ID
      const suggestionId = parseInt(id);
      if (isNaN(suggestionId)) {
        return res.status(400).json({ message: "Invalid suggestion ID" });
      }
  
      // Check if suggestion exists
      const suggestion = await prisma.suggestion.findUnique({
        where: { id: suggestionId }
      });
      
      if (!suggestion) {
        return res.status(404).json({ message: 'Suggestion not found' });
      }
      
      // Get comments for the suggestion
      const comments = await prisma.comment.findMany({
        where: { suggestionId },
        include: {
          user: {
            select: {
              
              user_name: true,
              user_id: true,
              profilePicture: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.status(200).json({ 
        comments,
        suggestion: {
          id: suggestion.id,
          title: suggestion.title
        }
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
    }
  };
  
  // Delete a comment
  exports.deleteComment = async (req, res) => {
    try {
      const { suggestionId, commentId } = req.params;
      const userId = req.user.id; // From auth middleware
      
      console.log('Delete comment request:', { suggestionId, commentId, userId });
      
      // Validate parameters
      if (!suggestionId || !commentId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const parsedSuggestionId = parseInt(suggestionId);
      const parsedCommentId = parseInt(commentId);
      
      if (isNaN(parsedSuggestionId) || isNaN(parsedCommentId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Find the comment with suggestion relation
      const comment = await prisma.comment.findUnique({
        where: { id: parsedCommentId },
        include: {
          suggestion: {
            select: {
              userId: true, // suggestion owner ID
              title: true  // Get title for notification
            },
          },
          user: {
            select: {
              user_name: true // Get commenter's name
            }
          }
        },
      });
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.suggestionId !== parsedSuggestionId) {
        return res.status(400).json({ message: "Comment does not belong to this suggestion" });
      }
      
      const isCommentOwner = comment.userId === userId;
      const isSuggestionOwner = comment.suggestion.userId === userId;
      
      if (!isCommentOwner && !isSuggestionOwner) {
        return res.status(403).json({ message: "You do not have permission to delete this comment" });
      }
      
      // Delete the comment
      await prisma.comment.delete({
        where: { id: parsedCommentId },
      });
      
      // If suggestion owner deleted someone else's comment, notify the comment author
      if (isSuggestionOwner && !isCommentOwner) {
        await prisma.notification.create({
          data: {
            userId: comment.userId,
            type: 'COMMENT_DELETED', // You'll need to add this to your NotificationType enum
            content: `Your comment on the suggestion "${comment.suggestion.title}" was deleted by the suggestion owner`,
            isRead: false,
            suggestionId: parsedSuggestionId
          }
        });
        
        console.log(`Notification sent to user ${comment.userId} about deleted comment`);
      }
      
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment", error: error.message });
    }
  };
  
  