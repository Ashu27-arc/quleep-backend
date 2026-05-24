require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const modelRoutes = require('./src/routes/modelRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allows cross-origin asset loading for locally saved models
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Local Uploads Statically (Fallback storage mechanism)
const publicDir = path.join(__dirname, 'public');
app.use('/uploads', express.static(path.join(publicDir, 'uploads')));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);

// Healthy check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  
  const statusCode = err.name === 'ValidationError' ? 400 : 500;
  res.status(statusCode).json({
    message: err.message || 'An internal server error occurred',
  });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
