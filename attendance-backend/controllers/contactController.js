import { asyncHandler } from '../middlewares/errorHandler.js';
import Contact from '../models/Contact.js';

// @desc    Submit contact/support form
// @route   POST /api/contact/submit
// @access  Private
export const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, subject, category, message, priority } = req.body;

  // Validation
  if (!name || !email || !subject || !category || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  // Save to database
  const contact = await Contact.create({
    user: req.user?._id,
    userRole: req.userRole,
    name,
    email,
    subject,
    category,
    message,
    priority: priority || 'medium',
  });

  res.status(201).json({
    success: true,
    message:
      'Your message has been submitted successfully. We will get back to you within 24-48 hours.',
    data: {
      submittedAt: contact.submittedAt,
      category: contact.category,
      priority: contact.priority,
    },
  });
});

// @desc    Get contact form submissions (Admin only)
// @route   GET /api/contact/submissions
// @access  Private (Admin)
export const getContactSubmissions = asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  const submissions = await Contact.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Contact.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Contact submissions retrieved successfully',
    data: submissions,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
    },
  });
});
