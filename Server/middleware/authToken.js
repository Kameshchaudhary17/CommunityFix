import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Middleware to verify token
export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add decoded token data to req
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }
};

// Middleware to check if the user is Main Admin
export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'main_admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};
