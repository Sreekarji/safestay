import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/auth.js';
import otpRoutes from './routes/otp.js';
import accommodationRoutes from './routes/accommodations.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';
import ownerRoutes from './routes/owner.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// Middleware
// ========================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// ========================
// Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SafeStay API is running',
    timestamp: new Date().toISOString(),
  });
});

// ========================
// Error handling middleware
// ========================
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File size too large. Maximum 5MB allowed.',
        code: 'UPLOAD_ERROR',
      });
      return;
    }
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'DATABASE_ERROR',
  });
});

// ========================
// Start server
// ========================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Configure Cloudinary
    configureCloudinary();

    // Start listening
    app.listen(PORT, () => {
      console.log(`
🚀 SafeStay API Server
━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API: http://localhost:${PORT}/api
━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
