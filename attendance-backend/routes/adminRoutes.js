import express from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
  bulkPromoteStudents,
  getAllTeachers,
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  updateTeacher,
  deleteTeacher,
  assignSubjectToTeacher,
  removeAssignmentFromTeacher,
  getDashboardStats,
  getRecentActivity,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activity', getRecentActivity);

// ==================== STUDENT MANAGEMENT ====================
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.post('/students', createStudent);
router.post('/students/bulk', bulkCreateStudents);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.put('/students/bulk/promote', bulkPromoteStudents);

// ==================== TEACHER MANAGEMENT ====================
router.get('/teachers', getAllTeachers);
router.get('/teachers/pending', getPendingTeachers);
router.put('/teachers/:id/approve', approveTeacher);
router.put('/teachers/:id/reject', rejectTeacher);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);

// Teacher assignments
router.post('/teachers/:id/assignments', assignSubjectToTeacher);
router.delete(
  '/teachers/:teacherId/assignments/:assignmentId',
  removeAssignmentFromTeacher
);

export default router;