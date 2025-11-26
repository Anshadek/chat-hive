
import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';    
import { connectDB } from '../config/db.js';
import { initSocket } from '../socket/index.js';
dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// initialize sockets
initSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
