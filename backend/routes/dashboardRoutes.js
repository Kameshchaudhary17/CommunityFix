const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController')

router.get('/stats', authMiddleware.authenticateUser, authMiddleware.authorizeRoles('MUNICIPALITY', 'ADMIN'), dashboardController.getDashboardStats);
router.get('/activities', authMiddleware.authenticateUser, authMiddleware.authorizeRoles('MUNICIPALITY', 'ADMIN'), dashboardController.getDashboardActivities);



module.exports= router;