// =====================================================
// routes/attendanceRoutes.js
// =====================================================
import express from 'express';
import {
  // Teacher functions (WITH AUTO-NOTIFICATIONS)
  markAttendance,
  sendLowAttendanceAlerts,
  getTeacherAttendanceHistory,
  getAttendanceForEdit,

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
// TEACHER ROUTES
// =====================================================

// Mark attendance — auto sends notifications
router.post(
  '/mark',
  authorize('teacher', 'admin'),
  checkTeacherApproval,
  markAttendance
);

// Send low attendance alerts manually
router.post(
  '/low-attendance-alerts',
  authorize('teacher', 'admin'),
  checkTeacherApproval,
  sendLowAttendanceAlerts
);

// ✅ Teacher attendance history — MUST be before /:id
router.get(
  '/history',
  authorize('teacher', 'admin'),
  checkTeacherApproval,
  getTeacherAttendanceHistory
);

// ✅ Get existing attendance for editing — MUST be before /:id
router.get(
  '/edit/:attendanceId',
  authorize('teacher', 'admin'),
  checkTeacherApproval,
  getAttendanceForEdit
);

// =====================================================
// ADMIN ROUTES — static paths first
// =====================================================

router.get('/', authorize('admin'), getAllAttendance);
router.get('/records', authorize('admin'), getAllAttendanceRecords);
router.get('/stats', authorize('admin'), getAttendanceStats);
router.get('/low-attendance', authorize('admin'), getLowAttendanceStudents);
router.get('/summary', authorize('admin'), getAttendanceSummary);
router.get('/export/csv', authorize('admin'), exportAttendanceCSV);
router.get('/export/summary-csv', authorize('admin'), exportAttendanceSummaryCSV);
router.get('/date/:date', authorize('admin'), getAttendanceByDate);

// =====================================================
// SHARED ROUTES (Admin + Teacher)
// =====================================================

router.get(
  '/subject/:subjectId',
  authorize('admin', 'teacher'),
  getAttendanceBySubject
);

// =====================================================
// SHARED ROUTES (Admin + Student)
// =====================================================

router.get(
  '/student/:studentId',
  authorize('admin', 'student'),
  getAttendanceByStudent
);

// =====================================================
// WILDCARD ROUTES — always last
// =====================================================

router.put('/:id', authorize('admin', 'teacher'), updateAttendance);
router.delete('/:id', authorize('admin'), deleteAttendance);

export default router;