const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notificationService } = require("../services/notificationService");



const createReport = async (req, res) => {
  try {
    // Check authentication data
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User authentication failed" });
    }
    
    const {
      title,
      description,
      municipality,
      wardNumber,
      latitude,
      longitude
    } = req.body;
    
    // Validate input
    if (!title || !description || !municipality || !wardNumber) {
      return res.status(400).json({ error: "Please provide all required details." });
    }
    
    // Handle photo uploads - correctly access photos from req.files.photo
    let photos = [];
    
    if (req.files && req.files.photo && req.files.photo.length > 0) {
      photos = req.files.photo.map(file => {
        return file.path.replace(/^storage[\\\/]/, '');
      });
    }
    
    console.log("Creating report with data:", {
      title,
      description,
      municipality,
      wardNumber: Number(wardNumber),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      user_id: req.user.id,
      photo: photos.length > 0 ? photos : null
    });
    
    // Create report in database - Change 'photos' to 'photo' to match your schema
    const newReport = await prisma.reports.create({
      data: {
        title,
        description,
        municipality,
        wardNumber: Number(wardNumber),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        user_id: req.user.id,
        photo: photos.length > 0 ? JSON.stringify(photos) : null,  // Changed 'photos' to 'photo'
      }
    });
    
    // Send notifications to municipality users
    try {
      await notificationService.notifyMunicipality({
        municipality,
        wardNumber: Number(wardNumber),
        type: 'NEW_REPORT',
        title,
        entityType: 'report',
        entityId: newReport.report_id, // Change this line if your primary key is named differently
        creatorId: req.user.id
      });
      
      console.log(`Notifications sent to municipality users about new report: ${title}`);
    } catch (notificationError) {
      // Log but don't fail the request if notification sending fails
      console.error('Error sending notifications:', notificationError);
    }
    
    return res.status(201).json({
      message: "Report created successfully.",
      report: newReport
    });
  } catch (error) {
    console.error('Report creation error:', error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


const getAllReports = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    console.log("User ID:", userId);
    
    // Fetch user details to get municipality and wardNumber
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        municipality: true,
        wardNumber: true
      }
    });
    
    console.log("User Details:", user);
    
    if (!user || !user.municipality || user.wardNumber === null) {
      return res.status(403).json({ message: 'Access denied: Municipality and Ward Number are required' });
    }
    
    // Fetch reports based on the user's municipality and wardNumber
    const reports = await prisma.reports.findMany({
      where: {
        municipality: user.municipality,
        wardNumber: user.wardNumber
      },
      include: {
        user: {
          select: {
            user_name: true,
            user_email: true,
            contact: true,
            profilePicture: true,
            createdAt: true
          }
        }
      }
    });
    
    // Get upvote information for each report
    const reportsWithUpvotes = await Promise.all(reports.map(async (report) => {
      // Count upvotes for this report
      const upvoteCount = await prisma.upvote.count({
        where: { reportId: report.report_id } // Use report_id instead of id
      });
      
      // Check if current user has upvoted this report
      const hasUserUpvoted = await prisma.upvote.findFirst({
        where: { 
          userId: userId,
          reportId: report.report_id // Use report_id instead of id
        }
      });
      
      return {
        ...report,
        upvotes: upvoteCount,
        hasUserUpvoted: !!hasUserUpvoted
      };
    }));
    
    return res.status(200).json({ reports: reportsWithUpvotes });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Get report by ID
const getReportById = async (req, res) => {
  const { reportId } = req.params;


  try {
    const report = await prisma.reports.findUnique({
      where: { report_id: Number(reportId) },
      include: {
        user: {
          select: {
            user_name: true,
            user_email: true, 
            contact: true,
            createdAt: true
          }
        }
      }
    });

    

    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    return res.status(200).json(report);
  } catch (error) {
    console.error('Fetch report error:', error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Update report
const updateReport = async (req, res) => {
  const { id } = req.query;
  const { 
    title, 
    description, 
    municipality, 
    wardNumber, 
    latitude, 
    longitude,
  } = req.body;

  try {
    // Verify report exists and belongs to the user
    const existingReport = await prisma.reports.findUnique({
      where: { report_id: Number(id) }
    });

    if (!existingReport) {
      return res.status(404).json({ error: "Report not found." });
    }

    // Ensure user can only update their own reports
    if (existingReport.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this report." });
    }

    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (municipality) updateData.municipality = municipality;
    if (wardNumber) updateData.wardNumber = Number(wardNumber);
    if (latitude) updateData.latitude = Number(latitude);
    if (longitude) updateData.longitude = Number(longitude);
    
    // Handle photo update if file exists
    if (req.file) {
      updateData.photo = req.file.path;
    }

    // Update report
    const updatedReport = await prisma.reports.update({
      where: { report_id: Number(id) },
      data: updateData
    });

    return res.status(200).json({
      message: "Report updated successfully.",
      report: updatedReport
    });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Delete report
const deleteReport = async (req, res) => {
  const { id } = req.query;

  try {
    // Verify report exists and belongs to the user
    const existingReport = await prisma.reports.findUnique({
      where: { report_id: Number(id) }
    });

    if (!existingReport) {
      return res.status(404).json({ error: "Report not found." });
    }

    // Ensure user can only delete their own reports
    if (existingReport.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this report." });
    }

    // Delete report
    await prisma.reports.delete({
      where: { report_id: Number(id) }
    });

    return res.status(200).json({
      message: "Report deleted successfully."
    });
  } catch (error) {
    console.error('Delete report error:', error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Get reports by current user
const getUserReports = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  try {
    // Prepare pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch user's reports
    const reports = await prisma.reports.findMany({
      where: { user_id: req.user.id },
      skip,
      take: limitNum,
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Count total user reports
    const totalReports = await prisma.reports.count({ 
      where: { user_id: req.user.id } 
    });

    return res.status(200).json({
      reports,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalReports / limitNum),
        totalReports
      }
    });
  } catch (error) {
    console.error('Fetch user reports error:', error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Controller function to get a single user report by ID
const getSingleUserReports = async (req, res) => {
  try {
    // Fetch all reports that belong to the user
    const reports = await prisma.reports.findMany({
      where: { 
        user_id: req.user.id  // Match all reports of the user
      },
      include: {
        user: {
          select: {
            user_name: true,
            user_email: true,
            contact: true,
            profilePicture: true,
          }
        }
      }
    });

    return res.status(200).json({ reports });
  } catch (error) {
    console.error('Fetch user reports error:', error);
    return res.status(500).json({ error: "Internal server error." });
  }
};


const updateReportStatus = async (req, res) => {
  try {
    // Get reportId from params or body
    const reportId = req.params.reportId || req.body.report_id;
    
    if (!reportId) {
      return res.status(400).json({ message: 'Report ID is required' });
    }
    
    // Get status from request body
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status value
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Status must be PENDING, IN_PROGRESS, or COMPLETED'
      });
    }
    
    // Convert reportId to integer (important for Prisma)
    const reportIdInt = parseInt(reportId, 10);
    
    if (isNaN(reportIdInt)) {
      return res.status(400).json({ message: 'Report ID must be a valid number' });
    }
    
    // First check if the report exists
    const existingReport = await prisma.reports.findUnique({
      where: { report_id: reportIdInt },
      include: { user: true } // Include user to get the report creator's info for notification
    });
    
    if (!existingReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update the report status
    const updatedReport = await prisma.reports.update({
      where: { report_id: reportIdInt },
      data: { status }
    });
    
    // Create notification for the report owner
    await prisma.notification.create({  // Changed from notifications to notification
      data: {
        userId: existingReport.user_id, // Changed from userId to user_id
        type: 'REPORT_STATUS_CHANGED',
        content: `Your report has been updated to ${status}`,
        isRead: false,
        reportId: reportIdInt
      }
    });
    
    // Return success response
    return res.status(200).json({
      message: 'Report status updated successfully',
      data: updatedReport
    });
    
  } catch (error) {
    console.error('Error updating report status:', error);
    
    // Provide more detailed error information
    return res.status(500).json({
      message: 'An error occurred while updating the report status',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



module.exports = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  getUserReports,
  getSingleUserReports,
  updateReportStatus
};