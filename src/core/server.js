
import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';    
import { connectDB } from '../config/db.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
