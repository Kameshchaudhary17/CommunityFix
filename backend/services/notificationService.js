const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// This function will be set once the socket.io server is initialized
let getIO = null;

// Allow the server to set the IO instance after initialization
const setIOGetter = (ioGetter) => {
  getIO = ioGetter;
};

const notificationService = {
  /**
   * Creates a notification and sends it in real-time
   * @param {Object} params Notification parameters
   * @param {number} params.userId User ID who should receive the notification
   * @param {string} params.content Notification message content
   * @param {string} params.type NotificationType enum value
   * @param {Object} params.relatedIds Object containing any related entity IDs
   * @returns {Promise<Object>} Created notification object
   */
  async createNotification({ userId, content, type, relatedIds = {} }) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          content,
          type,
          reportId: relatedIds.reportId || null,
          suggestionId: relatedIds.suggestionId || null,
          commentId: relatedIds.commentId || null
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
        }
      });
      
      // If Socket.IO is available, send real-time notification
      if (getIO) {
        const io = getIO();
        
        // Send real-time notification to all user's connected devices
        io.to(`user:${userId}`).emit('new_notification', notification);
        
        // Update unread count
        const unreadCount = await prisma.notification.count({
          where: {
            userId,
            isRead: false
          }
        });
        
        io.to(`user:${userId}`).emit('unread_count', unreadCount);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
  
  /**
   * Notifies users in a municipality about a new report or suggestion
   * @param {Object} params Parameters
   * @param {string} params.municipality Municipality name
   * @param {number} params.wardNumber Ward number
   * @param {string} params.type NotificationType enum value
   * @param {string} params.title Title of report/suggestion
   * @param {string} params.entityType "report" or "suggestion"
   * @param {number} params.entityId ID of the report or suggestion
   * @param {number} params.creatorId User ID who created the entity (to exclude from notifications)
   */
  async notifyMunicipality({ municipality, wardNumber, type, title, entityType, entityId, creatorId }) {
    try {
      // Find municipality admin users to notify
      const municipalityAdmins = await prisma.users.findMany({
        where: {
          role: 'MUNICIPALITY',
          municipality: municipality,
          user_id: { not: creatorId } // Don't notify the creator
        }
      });
      
      // Create notifications for each admin
      const notificationPromises = municipalityAdmins.map(admin => {
        const content = `New ${entityType} in ${municipality}, Ward ${wardNumber}: "${title}"`;
        
        return this.createNotification({
          userId: admin.user_id,
          content,
          type,
          relatedIds: entityType === 'report' 
            ? { reportId: entityId } 
            : { suggestionId: entityId }
        });
      });
      
      await Promise.all(notificationPromises);
      
      // If Socket.IO is available, broadcast to municipality room
      if (getIO) {
        const io = getIO();
        
        // Broadcast to municipality room that new content was added (for live updates)
        io.to(`municipality:${municipality}`).emit(`new_${entityType}`, {
          id: entityId,
          title,
          municipality,
          wardNumber
        });
        
        // Also broadcast to ward-specific room
        io.to(`ward:${municipality}:${wardNumber}`).emit(`new_${entityType}`, {
          id: entityId,
          title,
          municipality,
          wardNumber
        });
      }
      
    } catch (error) {
      console.error(`Error notifying municipality about ${entityType}:`, error);
    }
  },
  
  /**
   * Broadcast when an entity's status changes
   * @param {Object} params Parameters
   * @param {string} params.entityType "report" or "suggestion"
   * @param {number} params.entityId Entity ID
   * @param {string} params.status New status
   * @param {number} params.userId User ID whose status changed (to notify)
   * @param {string} params.title Title of the entity
   */
  async notifyStatusChange({ entityType, entityId, status, userId, title }) {
    try {
      // Create notification for the user
      const content = `Your ${entityType} "${title}" status changed to ${status}`;
      
      await this.createNotification({
        userId,
        content,
        type: entityType === 'report' ? 'REPORT_STATUS_CHANGED' : 'SUGGESTION_STATUS_CHANGED',
        relatedIds: entityType === 'report' 
          ? { reportId: entityId } 
          : { suggestionId: entityId }
      });
      
      // If Socket.IO is available, broadcast to all connected clients
      if (getIO) {
        const io = getIO();
        
        // Broadcast to all connected clients for live updates
        io.emit(`${entityType}_status_changed`, {
          id: entityId,
          status
        });
      }
    } catch (error) {
      console.error('Error notifying status change:', error);
    }
  },
  
  /**
   * Notify about new comments
   * @param {Object} params Parameters
   * @param {number} params.commentId ID of the new comment
   * @param {number} params.suggestionId ID of the suggestion
   * @param {string} params.suggestionTitle Title of the suggestion
   * @param {number} params.commenterId ID of user who commented
   * @param {number} params.ownerId ID of suggestion owner
   */
  async notifyNewComment({ commentId, suggestionId, suggestionTitle, commenterId, ownerId }) {
    try {
      // Don't notify if the commenter is the owner
      if (commenterId === ownerId) {
        return;
      }
      
      const commenter = await prisma.users.findUnique({
        where: { user_id: commenterId },
        select: { user_name: true }
      });
      
      if (!commenter) {
        throw new Error('Commenter not found');
      }
      
      const content = `${commenter.user_name} commented on your suggestion "${suggestionTitle}"`;
      
      await this.createNotification({
        userId: ownerId,
        content,
        type: 'NEW_COMMENT',
        relatedIds: {
          suggestionId,
          commentId
        }
      });
      
    } catch (error) {
      console.error('Error notifying about new comment:', error);
    }
  }
};

module.exports = { notificationService, setIOGetter };