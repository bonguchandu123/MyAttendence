
// =====================================================
// server.js - Updated with Notification Service
// =====================================================
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import NotificationService from './services/notificationService.js';  // ✅ ADD THIS

// Import routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import fcmRoutes from './routes/fcmRoutes.js';

// Import models for initial setup
import Admin from './models/Admin.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GVPCE Attendance Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      student: '/api/student',
      teacher: '/api/teacher',
      subjects: '/api/subjects',
      attendance: '/api/attendance',
      schedules: '/api/schedules',
      admin: '/api/admin',
      contact: '/api/contact',
      fcm: '/api/fcm',
    },
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'Connected',
      notifications: 'Active',
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/fcm', fcmRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 GVPCE ATTENDANCE MANAGEMENT SYSTEM');
  console.log('='.repeat(60));
  console.log(`📡 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));

  // Create default admin if not exists
  try {
    const adminExists = await Admin.findOne({
      email: process.env.ADMIN_EMAIL || 'admin@gvpce.ac.in',
    });

    if (!adminExists) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL || 'admin@gvpce.ac.in',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      });
      console.log('\n✅ Default Admin Created Successfully');
      console.log('📧 Email:', process.env.ADMIN_EMAIL || 'admin@gvpce.ac.in');
      console.log('🔑 Password:', process.env.ADMIN_PASSWORD || 'admin123');
      console.log('⚠️  IMPORTANT: Change the default password after first login!');
      console.log('='.repeat(60));
    }
  } catch (error) {
    console.error('\n❌ Error creating default admin:', error.message);
  }

  // ✅ Initialize Notification Service
  console.log('\n📱 Initializing Notification Service...');
  console.log('-'.repeat(60));
  try {
    NotificationService.initializeScheduledJobs();
    console.log('✅ Notification Service Initialized Successfully');
    console.log('   📅 Daily Reminders: 7:30 AM (Mon-Fri)');
    console.log('   🔍 Low Attendance Check: 8:00 PM (Daily)');
    console.log('   📊 Weekly Summary: 7:00 PM (Sundays)');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error initializing notification service:', error.message);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`\n❌ Unhandled Rejection: ${err.message}`);
  console.error('Stack:', err.stack);
  // Close server & exit process
  server.close(() => {
    console.log('🔴 Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`\n❌ Uncaught Exception: ${err.message}`);
  console.error('Stack:', err.stack);
  // Close server & exit process
  server.close(() => {
    console.log('🔴 Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed. Process terminated!');
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed. Process terminated!');
  });
});

export default app;