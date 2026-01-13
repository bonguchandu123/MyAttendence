import express from 'express';
import {
  getAllSubjects,
  getSubjectsByBranchSemester,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getEnrolledStudents,
  getSubjectStats,
  bulkCreateSubjects,
  copySubjects,
} from '../controllers/subjectController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all subjects (accessible by all authenticated users)
router.get('/', getAllSubjects);

// Get subjects by branch and semester
router.get('/branch/:branch/semester/:semester', getSubjectsByBranchSemester);

// Get single subject
router.get('/:id', getSubjectById);

// Get enrolled students (admin and teacher)
router.get('/:id/students', authorize('admin', 'teacher'), getEnrolledStudents);

// Get subject stats (admin and teacher)
router.get('/:id/stats', authorize('admin', 'teacher'), getSubjectStats);

// Admin only routes
router.post('/', authorize('admin'), createSubject);
router.put('/:id', authorize('admin'), updateSubject);
router.delete('/:id', authorize('admin'), deleteSubject);
router.post('/bulk', authorize('admin'), bulkCreateSubjects);
router.post('/copy', authorize('admin'), copySubjects);

export default router;