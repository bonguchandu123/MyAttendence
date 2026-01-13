import express from 'express';
import {
  login,
  registerTeacher,
  getMe,
  changePassword,
  checkApprovalStatus,
} from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register/teacher', registerTeacher);

// Protected routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// Teacher only routes
router.get(
  '/teacher/approval-status',
  protect,
  authorize('teacher'),
  checkApprovalStatus
);

export default router;