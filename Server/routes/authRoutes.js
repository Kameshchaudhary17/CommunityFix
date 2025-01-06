import express from'express';
import router from express.Router();
import { adminLogin } from '../controller/authController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

// Route: Admin Login
router.post('/login', adminLogin);

// Route: Protected Admin-Only Endpoint
router.get('/admin-dashboard', verifyToken, isAdmin, (req, res) => {
    res.status(200).json({ message: 'Welcome to the Admin Dashboard' });
});

export default router;
