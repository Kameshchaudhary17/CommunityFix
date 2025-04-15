const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const { notificationService, setIOGetter } = require('./services/notificationService');
const routes = require('./routes/routes');
const prisma = new PrismaClient();

// Initialize the Express app
const app = express();

require('dotenv').config();

// Middleware to parse JSON body
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow these methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
    credentials: true,
  })
);

app.use(express.static('Storage'));

// using route
app.use("/api", routes);

// Create an HTTP server from the Express app
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Provide IO instance to the notification service
setIOGetter(() => io);

// Store active connections mapped to user IDs
const userSocketMap = new Map();
// Store socket IDs mapped to user IDs for quick lookup
const socketUserMap = new Map();

// Middleware for socket authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT payload:", decoded);
    
    // Get the user ID from the token - try different properties based on your JWT structure
    // Your JWT might have `id`, `user_id`, or something else instead of `userId`
    socket.userId = decoded.id || decoded.user_id;
    
    if (!socket.userId) {
      console.error("No user ID found in token:", decoded);
      return next(new Error("Authentication error: No user ID in token"));
    }
    
    // Get user details for room assignments
    const user = await prisma.users.findUnique({
      where: { user_id: socket.userId }, // This must match your Prisma model (user_id)
      select: { municipality: true, wardNumber: true, role: true }
    });
    
    if (user) {
      socket.userDetails = user;
      return next();
    } else {
      return next(new Error("Authentication error: User not found"));
    }
  } catch (error) {
    console.error("Socket authentication error:", error);
    return next(new Error(`Authentication error: ${error.message}`));
  }
});

// Setup connection event listener for new clients
io.on("connection", async (socket) => {
  const userId = socket.userId;
  const user = socket.userDetails;
  
  // Add this socket to the user's set of connections
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socket.id);
  socketUserMap.set(socket.id, userId);
  
  // Join user-specific room
  socket.join(`user:${userId}`);
  
  // Join municipality and ward rooms if applicable
  if (user.municipality) {
    socket.join(`municipality:${user.municipality}`);
    
    if (user.wardNumber) {
      socket.join(`ward:${user.municipality}:${user.wardNumber}`);
    }
  }
  
  // Join role-specific rooms
  socket.join(`role:${user.role}`);
  
  console.log(`User ${userId} connected with socket ${socket.id}`);
  
  // Send unread notifications count
  const unreadCount = await prisma.notification.count({
    where: {
      userId: userId,
      isRead: false
    }
  });
  
  // Emit the unread count to this specific socket
  socket.emit('unread_count', unreadCount);
  
  // Handle marking notifications as read
  socket.on('mark_notification_read', async (notificationId) => {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
      
      // Update unread count for this user
      const newUnreadCount = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });
      
      // Emit updated count to all of user's connected devices
      io.to(`user:${userId}`).emit('unread_count', newUnreadCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });
  
  // Handle marking all notifications as read
  socket.on('mark_all_read', async () => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: { isRead: true }
      });
      
      // Emit zero unread count to all of user's connected devices
      io.to(`user:${userId}`).emit('unread_count', 0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  });
  
  // Handle disconnect
  socket.on("disconnect", () => {
    // Remove this socket from user's connections
    if (userSocketMap.has(userId)) {
      userSocketMap.get(userId).delete(socket.id);
      
      // If no more active connections for this user, remove from map
      if (userSocketMap.get(userId).size === 0) {
        userSocketMap.delete(userId);
      }
    }
    
    // Remove from socket-to-user map
    socketUserMap.delete(socket.id);
    
    console.log(`User ${userId} disconnected (socket: ${socket.id})`);
  });
});

// Export the module for controllers to use
module.exports = { io };

// Start the HTTP server
httpServer.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
  console.log(`Socket.IO server initialized and ready for connections`);
});