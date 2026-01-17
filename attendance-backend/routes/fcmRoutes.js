import express from 'express';
import {
  updateFCMToken,
  deleteFCMToken,
  sendNotificationToUser,
  sendNotificationToMultiple,
  sendNotificationToTopic,
  sendNotificationToClass,
} from '../controllers/fcmController.js';
import { authorize, protect } from '../middlewares/auth.js';


const router = express.Router();

// Token management routes (all authenticated users)
router.put('/token', protect, updateFCMToken);
router.delete('/token', protect, deleteFCMToken);

// Send notification routes (Admin and Teacher only)
router.post('/send-to-user', protect, authorize('admin', 'teacher'), sendNotificationToUser);
router.post('/send-to-multiple', protect, authorize('admin', 'teacher'), sendNotificationToMultiple);
router.post('/send-to-topic', protect, authorize('admin', 'teacher'), sendNotificationToTopic);
router.post('/send-to-class', protect, authorize('admin', 'teacher'), sendNotificationToClass);

export default router;