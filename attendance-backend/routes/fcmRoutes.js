import express from 'express';
import {
  updateFCMToken,
  deleteFCMToken,
  sendNotificationToUser,
  sendNotificationToMultiple,
  sendNotificationToTopic,
  sendNotificationToClass,
  // Branch-based student loader + selected send
  getStudentsByBranch,
  sendToSelectedStudents,
  // Teacher-only
  getTeacherClasses,
  teacherSendToClass,
  teacherSendToSelectedStudents,
  // NEW: Low attendance
  getLowAttendanceStudents,
  notifyLowAttendanceStudents,
} from '../controllers/fcmController.js';
import { authorize, protect } from '../middlewares/auth.js';

const router = express.Router();

// ─── Token Management (all authenticated users) ───────────────────────────────
router.put('/token',    protect, updateFCMToken);
router.delete('/token', protect, deleteFCMToken);

// ─── Admin / Teacher: existing send routes ────────────────────────────────────
router.post('/send-to-user',     protect, authorize('admin', 'teacher'), sendNotificationToUser);
router.post('/send-to-multiple', protect, authorize('admin', 'teacher'), sendNotificationToMultiple);
router.post('/send-to-topic',    protect, authorize('admin', 'teacher'), sendNotificationToTopic);
router.post('/send-to-class',    protect, authorize('admin', 'teacher'), sendNotificationToClass);

// ─── Admin / Teacher: branch-based student loader + selected send ─────────────
// GET  /api/fcm/students-by-branch?branch=CSE&semester=3
router.get('/students-by-branch',  protect, authorize('admin', 'teacher'), getStudentsByBranch);
// POST /api/fcm/send-to-selected   { studentIds[], title, body, data? }
router.post('/send-to-selected',   protect, authorize('admin', 'teacher'), sendToSelectedStudents);

// ─── NEW: Low attendance routes ───────────────────────────────────────────────
// GET  /api/fcm/low-attendance?branch=CSE&semester=5&threshold=75
//      Returns list of students below the threshold, with their low subjects,
//      reachable flag, etc. – used to populate the checklist UI.
router.get('/low-attendance',        protect, authorize('admin', 'teacher'), getLowAttendanceStudents);

// POST /api/fcm/low-attendance/notify
//      Body: { studentIds[], branch, semester, threshold?, title?, body?, usePerStudent? }
//      Sends push notifications to the selected low-attendance students.
//      usePerStudent=true  → each student gets a personalised message listing
//                            their specific low-attendance subjects
//      usePerStudent=false → single broadcast message to all selected students
router.post('/low-attendance/notify', protect, authorize('admin', 'teacher'), notifyLowAttendanceStudents);

// ─── Teacher-only: notification routes ───────────────────────────────────────
// GET  /api/fcm/teacher/my-classes
router.get('/teacher/my-classes',       protect, authorize('teacher'), getTeacherClasses);
// POST /api/fcm/teacher/send-to-class  { scheduleId, title, body, type?, data? }
router.post('/teacher/send-to-class',   protect, authorize('teacher'), teacherSendToClass);
// POST /api/fcm/teacher/send-to-selected { scheduleId, studentIds[], title, body, type?, data? }
router.post('/teacher/send-to-selected', protect, authorize('teacher'), teacherSendToSelectedStudents);

export default router;