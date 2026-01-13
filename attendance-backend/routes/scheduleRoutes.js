import express from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByTeacher,
  getSchedulesByClass,
  getTeacherWeeklySchedule,
  getTodaySchedules,
  checkScheduleConflict,
} from '../controllers/scheduleController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all schedules (admin only)
router.get('/', authorize('admin'), getAllSchedules);

// Get today's schedules (admin only)
router.get('/today', authorize('admin'), getTodaySchedules);

// Check schedule conflict (admin only)
router.post('/check-conflict', authorize('admin'), checkScheduleConflict);

// Get schedule by ID (admin and teacher)
router.get('/:id', authorize('admin', 'teacher'), getScheduleById);

// Get schedules by teacher (admin and teacher)
router.get(
  '/teacher/:teacherId',
  authorize('admin', 'teacher'),
  getSchedulesByTeacher
);

// Get teacher weekly schedule (admin and teacher)
router.get(
  '/teacher/:teacherId/weekly',
  authorize('admin', 'teacher'),
  getTeacherWeeklySchedule
);

// Get schedules by class (admin only)
router.get(
  '/class/:branch/:semester',
  authorize('admin'),
  getSchedulesByClass
);

// Create schedule (admin only)
router.post('/', authorize('admin'), createSchedule);

// Update schedule (admin only)
router.put('/:id', authorize('admin'), updateSchedule);

// Delete schedule (admin only)
router.delete('/:id', authorize('admin'), deleteSchedule);

export default router;