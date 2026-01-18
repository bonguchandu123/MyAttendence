
// =====================================================
// routes/attendanceRoutes.js - Updated with Teacher Routes
// =====================================================
import express from 'express';
import {
  // Teacher functions (WITH AUTO-NOTIFICATIONS)
  markAttendance,
  sendLowAttendanceAlerts,
  
  // Admin query functions
  getAllAttendance,
  getAllAttendanceRecords,
  getAttendanceByStudent,
  getAttendanceBySubject,
  getAttendanceByDate,
  getAttendanceStats,
  deleteAttendance,
  updateAttendance,
  getLowAttendanceStudents,
  getAttendanceSummary,
  exportAttendanceCSV,
  exportAttendanceSummaryCSV,
} from '../controllers/attendanceController.js';
import { protect, authorize, checkTeacherApproval } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// =====================================================
// TEACHER ROUTES (WITH AUTO-NOTIFICATIONS)
// =====================================================

// ✅ Mark attendance - AUTOMATICALLY sends notifications to students
router.post(
  '/mark',
  authorize('teacher', 'admin'),
  checkTeacherApproval,
  markAttendance
);

// ✅ Send low attendance alerts manually
router.post(
  '/low-attendance-alerts',
  authorize('teacher', 'admin'),
  checkTeacherApproval,
  sendLowAttendanceAlerts
);

// =====================================================
// ADMIN ROUTES
// =====================================================

router.get('/', authorize('admin'), getAllAttendance);
router.get('/records', authorize('admin'), getAllAttendanceRecords);
router.get('/stats', authorize('admin'), getAttendanceStats);
router.get('/low-attendance', authorize('admin'), getLowAttendanceStudents);
router.get('/summary', authorize('admin'), getAttendanceSummary);
router.get('/export/csv', authorize('admin'), exportAttendanceCSV);
router.get('/export/summary-csv', authorize('admin'), exportAttendanceSummaryCSV);
router.delete('/:id', authorize('admin'), deleteAttendance);
router.put('/:id', authorize('admin', 'teacher'), updateAttendance);

// Date-based attendance (admin only)
router.get('/date/:date', authorize('admin'), getAttendanceByDate);

// =====================================================
// SHARED ROUTES (Admin and Teacher)
// =====================================================

router.get(
  '/subject/:subjectId',
  authorize('admin', 'teacher'),
  getAttendanceBySubject
);

// =====================================================
// SHARED ROUTES (Admin and Student)
// =====================================================

router.get(
  '/student/:studentId',
  authorize('admin', 'student'),
  getAttendanceByStudent
);

export default router;