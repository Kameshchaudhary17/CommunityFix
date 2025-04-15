const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.upvoteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Get user ID from request object
    
    // Convert id to an integer
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }
    
    // Check if user has already upvoted
    const existingUpvote = await prisma.upvote.findFirst({
      where: { userId, reportId },
    });
    
    if (existingUpvote) {
      // Remove upvote (undo upvote)
      await prisma.upvote.delete({
        where: { id: existingUpvote.id },
      });
      
      // Get the updated upvote count
      const upvoteCount = await prisma.upvote.count({ where: { reportId } });
      
      return res.status(200).json({
        message: "Upvote removed successfully",
        upvotes: upvoteCount
      });
    }
    
    // If no upvote exists, add a new one
    await prisma.upvote.create({
      data: {
        userId,
        reportId,
      },
    });
    
    // Get the report details to find the creator
    const report = await prisma.reports.findUnique({
      where: { report_id: reportId },
    });
    
    // Notify the report creator about the new upvote
    if (report && report.user_id !== userId) { // Don't notify if user upvoted their own report
      await prisma.notification.create({
        data: {
          userId: report.user_id,
          type: 'NEW_UPVOTE',
          content: `Someone upvoted your report: "${report.title}"`,
          isRead: false,
          reportId: reportId
        }
      });
      
      console.log(`Notification sent to user ${report.user_id} about upvote on report ${reportId}`);
    }
    
    // Get the updated upvote count
    const upvoteCount = await prisma.upvote.count({ where: { reportId } });
    
    res.status(200).json({
      message: "Report upvoted successfully",
      upvotes: upvoteCount
    });
  } catch (error) {
    console.error("Error upvoting/removing upvote:", error);
    res.status(500).json({ message: "Failed to process upvote", error: error.message });
  }
};

// Backend endpoint to get upvote count for a report
exports.getUpvoteCount = async (req, res) => {
  try {
    const { id } = req.params;
    const reportId = parseInt(id);
    const userId = req.user.id; // Get current user ID
    
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }
    
    // Count upvotes for this report
    const upvoteCount = await prisma.upvote.count({
      where: { reportId }
    });
    
    // Check if current user has upvoted
    const hasUserUpvoted = await prisma.upvote.findFirst({
      where: { userId, reportId }
    });
    
    res.status(200).json({
      upvotes: upvoteCount,
      hasUserUpvoted: !!hasUserUpvoted // Convert to boolean
    });
  } catch (error) {
    console.error("Error getting upvote status:", error);
    res.status(500).json({ message: "Failed to get upvote status", error: error.message });
  }
};