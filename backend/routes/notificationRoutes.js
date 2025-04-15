const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware'); // Adjust import path as needed

// Notification routes
router.get('/notifications', authMiddleware.authenticateUser , notificationController.getUserNotifications);
router.put('/notifications/:id/read', authMiddleware.authenticateUser, notificationController.markAsRead);
router.put('/notifications/mark-all-read', authMiddleware.authenticateUser, notificationController.markAllAsRead);
router.delete('/notifications/:id', authMiddleware.authenticateUser, notificationController.deleteNotification);

module.exports = router;