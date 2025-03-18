const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const routes = require('./routes/routes')
// Initialize the Express app
const app = express();

// Middleware to parse JSON body
app.use(express.json());

app.use(
  cors({
    origin: 'http://localhost:5173', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow these methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
    credentials: true,
  })
);

app.use(express.static('Storage'))

// using route
app.use("/api", routes);

// Create an HTTP server from the Express app
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(httpServer);

// Variable to keep track of the number of connected users
let onlineUsers = 0;

// Setup connection event listener for new clients
io.on("connection", (socket) => {
  onlineUsers++; // Increment the count of online users
  console.log(
    `A user connected: ${socket.id}. Total online users: ${onlineUsers}`
  );

  // Setup a disconnect listener for the connected client
  socket.on("disconnect", () => {
    onlineUsers--; // Decrement the count of online users
    console.log(
      `A user disconnected: ${socket.id}. Total online users: ${onlineUsers}`
    );
  });
});


// Start the HTTP server listening for requests
httpServer.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
