const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.upvoteReport = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Get user ID from request object
  
      // Convert id to an integer
      const reportId = parseInt(id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: "Invalid suggestion ID" });
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