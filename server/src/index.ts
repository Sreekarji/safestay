import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// Route imports
import authRoutes from './routes/auth.js';
import otpRoutes from './routes/otp.js';
import accommodationRoutes from './routes/accommodations.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/upload.js';
import ownerRoutes from './routes/owner.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/aiRoutes.js';

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
  origin: ['http://localhost:5173', 'http://localhost:5174'],
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
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SafeStay API is running',
    timestamp: new Date().toISOString(),
  });
});

// ========================
// 404 handler for undefined routes
// ========================
app.use(notFoundHandler);

// ========================
// Centralized error handling
// ========================
app.use(errorHandler);

// ========================
// Start server
// ========================
const startServer = async () => {
  try {
    // Connect to MongoDB (skip in DEMO_MODE if unavailable)
    if (process.env.DEMO_MODE !== 'true') {
      await connectDB();
      configureCloudinary();
    } else {
      console.log('⚠️  DEMO MODE: Skipping MongoDB connection');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`
🚀 SafeStay API Server
━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API: http://localhost:${PORT}/api

🔑 API Keys Status:
   MongoDB:    ${process.env.MONGO_URI ? '✅' : '❌'}
   JWT Secret: ${process.env.JWT_SECRET ? '✅' : '❌'}
   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌'}
   Email:      ${process.env.EMAIL_USER ? '✅' : '❌'}
   Mistral:    ${process.env.MISTRAL_API_KEY ? '✅' : '❌'}
   Groq:       ${process.env.GROQ_API_KEY ? '✅' : '❌'}
   Gemini:     ${process.env.GEMINI_API_KEY ? '✅' : '❌'}
   Sarvam AI:  ${process.env.SARVAM_API_KEY ? '✅' : '❌'}
   ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? '✅' : '❌'}
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
