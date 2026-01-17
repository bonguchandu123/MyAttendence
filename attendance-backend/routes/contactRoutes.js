import express from 'express';
import {
  submitContactForm,
  getContactSubmissions,
} from '../controllers/contactController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Submit contact form
router.post('/submit', protect, submitContactForm);

// Admin: get all submissions
router.get('/submissions', protect, authorize('admin'), getContactSubmissions);

export default router;
