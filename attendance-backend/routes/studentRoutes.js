import express from 'express';
import {
  getDashboard,
  getAllSubjects,
  getSubjectDetails,
  getAttendanceHistory,
  getReports,
  updateNotificationSettings,
  getNotifications,
} from '../controllers/studentController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected and for students only
router.use(protect);
router.use(authorize('student'));

// Dashboard
router.get('/dashboard', getDashboard);

// Subjects
router.get('/subjects', getAllSubjects);
router.get('/subjects/:subjectId', getSubjectDetails);

// Attendance
router.get('/attendance/history/:subjectId', getAttendanceHistory);

// Reports
router.get('/reports', getReports);

// Notifications
router.get('/notifications', getNotifications);

// Settings
router.put('/settings/notifications', updateNotificationSettings);

export default router;