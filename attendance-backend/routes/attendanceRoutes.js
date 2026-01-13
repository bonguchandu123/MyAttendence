import express from 'express';
import {
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
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), getAllAttendance);
router.get('/records', authorize('admin'), getAllAttendanceRecords);
router.get('/stats', authorize('admin'), getAttendanceStats);
router.get('/low-attendance', authorize('admin'), getLowAttendanceStudents);
router.get('/summary', authorize('admin'), getAttendanceSummary);
router.get('/export/csv', authorize('admin'), exportAttendanceCSV);
router.get('/export/summary-csv', authorize('admin'), exportAttendanceSummaryCSV);
router.delete('/:id', authorize('admin'), deleteAttendance);
router.put('/:id', authorize('admin', 'teacher'), updateAttendance);

// Admin and Teacher routes
router.get(
  '/subject/:subjectId',
  authorize('admin', 'teacher'),
  getAttendanceBySubject
);

// Admin and Student routes
router.get(
  '/student/:studentId',
  authorize('admin', 'student'),
  getAttendanceByStudent
);

// Date-based attendance (admin only)
router.get('/date/:date', authorize('admin'), getAttendanceByDate);

export default router;