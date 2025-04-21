const { PrismaClient } = require("@prisma/client");
const { notificationService } = require('../services/notificationService');
const prisma = new PrismaClient();

const notificationController = {
  /**
   * Get all notifications for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id || req.user.user_id;
      
      // Optional query parameters for pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Optional filter for read/unread notifications
      const filterIsRead = req.query.isRead !== undefined ? 
        { isRead: req.query.isRead === 'true' } : {};
      
      const notifications = await prisma.notification.findMany({
        where: {
          userId: userId,
          ...filterIsRead
        },
        include: {
          report: {
            select: { report_id: true, title: true, status: true }
          },
          suggestion: {
            select: { id: true, title: true, status: true }
          },
          comment: {
            select: { id: true, text: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });
      
      // Get total count for pagination
      const totalCount = await prisma.notification.count({
        where: {
          userId: userId,
          ...filterIsRead
        }
      });
      
      return res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
        error: error.message
      });
    }
  },
  
  /**
   * Mark a notification as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markAsRead(req, res) {
    try {
      console.log("Request params:", req.params);
    console.log("Notification ID from params:", req.params.notificationId);
    
    const notificationId = parseInt(req.params.notificationId);
    console.log("Parsed notification ID:", notificationId);

      
if (isNaN(notificationId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid notification ID format"
  });
}
      const userId = req.user.id || req.user.user_id;
      
      // Ensure notification belongs to the authenticated user
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }

      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found"
        });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: This notification doesn't belong to you"
        });
      }
      
      
      // Update notification
      const updatedNotification = await prisma.notification.update({
        where: { id: parseInt(notificationId) },
        data: { isRead: true }
      });
      
      // Get updated unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });
      
      return res.status(200).json({
        success: true,
        data: updatedNotification,
        unreadCount
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update notification",
        error: error.message
      });
    }
  },
  
  /**
   * Mark all notifications as read for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id || req.user.user_id;
      
      // Update all unread notifications
      const { count } = await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: { isRead: true }
      });
      
      return res.status(200).json({
        success: true,
        message: `Marked ${count} notifications as read`,
        unreadCount: 0
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update notifications",
        error: error.message
      });
    }
  },
  
  /**
   * Delete a notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteNotification(req, res) {
    try {
      // Changed from notificationId to id to match the route parameter
      const { id } = req.params;  // This was the issue - it should be 'id' not 'notificationId'
      const userId = req.user.id || req.user.user_id;
      
      // Ensure notification belongs to the authenticated user
      const notification = await prisma.notification.findUnique({
        where: { id: parseInt(id) }  // Use 'id' here
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found"
        });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: This notification doesn't belong to you"
        });
      }
      
      // Delete notification
      await prisma.notification.delete({
        where: { id: parseInt(id) }  // Use 'id' here
      });
      
      // Get updated unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });
      
      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
        unreadCount
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete notification",
        error: error.message
      });
    }
  },

  /**
   * Get count of unread notifications for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id || req.user.user_id;
      
      const unreadCount = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });
      
      return res.status(200).json({
        success: true,
        unreadCount
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get unread notification count",
        error: error.message
      });
    }
  }
};

module.exports = notificationController;