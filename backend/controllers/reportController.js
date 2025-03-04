const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new report
const createReport = async (req, res) => {
  const { 
    title, 
    description, 
    municipality, 
    wardNumber, 
    photo,
    latitude, 
    longitude 
  } = req.body;



  // Validate input
  if (!title || !description || !municipality || !wardNumber) {
    return res.status(400).json({ error: "Please provide all required details." });
  }

  try {
    // Assuming user ID is available from authentication middleware
    const userId = req.user.id;

    // Create report
    const newReport = await prisma.reports.create({
      data: {
        title,
        description,
        municipality,
        wardNumber: Number(wardNumber),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        user_id: userId,
        photo: req.file ? req.file.path : null // Assuming file upload middleware
      }
    });

    return res.status(201).json({
      message: "Report created successfully.",
      report: newReport
    });
  } catch (error) {
    console.error('Report creation error:', error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Get all reports
const getAllReports = async (req, res) => {
  try {
    // Fetch all reports without pagination or sorting
    const reports = await prisma.reports.findMany({
      include: {
        user: {
          select: {
            user_name: true,
            user_email: true
          }
        }
      }
    });

    return res.status(200).json({ reports });
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
            user_email: true
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
    longitude 
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

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  getUserReports
};