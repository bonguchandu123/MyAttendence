import express from 'express';
import {
  getDashboard,
  getAllClasses,
  getWeeklySchedule,
  getStudentsForAttendance,
  markAttendance,
  getAttendanceReports,
  getClassAttendanceByDate,
  editAttendance,
  getAttendanceHistory,
} from '../controllers/teacherController.js';
import { protect, authorize, checkTeacherApproval } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected and for teachers only
router.use(protect);
router.use(authorize('teacher'));
router.use(checkTeacherApproval); // Check if teacher is approved

// Dashboard
router.get('/dashboard', getDashboard);

// Classes
router.get('/classes', getAllClasses);

// Schedule
router.get('/schedule/weekly', getWeeklySchedule);

// Attendance
router.get('/attendance/students/:scheduleId', getStudentsForAttendance);
router.post('/attendance/mark', markAttendance);
router.get('/attendance/class/:subjectId', getClassAttendanceByDate);
router.put('/attendance/edit', editAttendance); 
router.get('/attendance/history', getAttendanceHistory);

// Reports
router.get('/reports/:subjectId', getAttendanceReports);

export default router;