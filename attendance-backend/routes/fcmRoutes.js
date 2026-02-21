import express from 'express';
import {
  updateFCMToken,
  deleteFCMToken,
  sendNotificationToUser,
  sendNotificationToMultiple,
  sendNotificationToTopic,
  sendNotificationToClass,
  // New
  getStudentsByBranch,
  sendToSelectedStudents,
  getTeacherClasses,
  teacherSendToClass,
  teacherSendToSelectedStudents,
} from '../controllers/fcmController.js';
import { authorize, protect } from '../middlewares/auth.js';

const router = express.Router();

// ─── Token Management (all authenticated users) ───────────────────────────────
router.put('/token', protect, updateFCMToken);
router.delete('/token', protect, deleteFCMToken);

// ─── Admin / Teacher: existing send routes ────────────────────────────────────
router.post('/send-to-user',     protect, authorize('admin', 'teacher'), sendNotificationToUser);
router.post('/send-to-multiple', protect, authorize('admin', 'teacher'), sendNotificationToMultiple);
router.post('/send-to-topic',    protect, authorize('admin', 'teacher'), sendNotificationToTopic);
router.post('/send-to-class',    protect, authorize('admin', 'teacher'), sendNotificationToClass);

// ─── Admin / Teacher: branch-based student loader + selected send ─────────────
// GET  /api/fcm/students-by-branch?branch=CSE&semester=3
//      → returns student list for the branch so frontend can render a checklist
router.get('/students-by-branch', protect, authorize('admin', 'teacher'), getStudentsByBranch);

// POST /api/fcm/send-to-selected
//      Body: { studentIds[], title, body, data? }
//      → admin sends to a hand-picked list of students
router.post('/send-to-selected', protect, authorize('admin', 'teacher'), sendToSelectedStudents);

// ─── Teacher-only: notification routes ───────────────────────────────────────
// GET  /api/fcm/teacher/my-classes
//      → returns teacher's classes with studentCount + reachableCount (for dropdown)
router.get('/teacher/my-classes', protect, authorize('teacher'), getTeacherClasses);

// POST /api/fcm/teacher/send-to-class
//      Body: { scheduleId, title, body, type?, data? }
//      → teacher sends to their entire class
router.post('/teacher/send-to-class', protect, authorize('teacher'), teacherSendToClass);

// POST /api/fcm/teacher/send-to-selected
//      Body: { scheduleId, studentIds[], title, body, type?, data? }
//      → teacher sends to specific students from their class
router.post('/teacher/send-to-selected', protect, authorize('teacher'), teacherSendToSelectedStudents);

export default router;