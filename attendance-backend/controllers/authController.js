import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import { generateToken } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// @desc    Login user (Admin/Student/Teacher)
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Check in Admin
  let user = await Admin.findOne({ email }).select('+password');
  let role = 'admin';

  // Check in Student
  if (!user) {
    user = await Student.findOne({ email }).select('+password');
    role = 'student';
  }

  // Check in Teacher
  if (!user) {
    user = await Teacher.findOne({ email }).select('+password');
    role = 'teacher';
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated',
    });
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if teacher is approved
  if (role === 'teacher' && !user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending admin approval',
      isApproved: false,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  }

  // Generate token
  const token = generateToken(user._id, role);

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      role,
      ...(role === 'student' && {
        rollNumber: user.rollNumber,
        branch: user.branch,
        semester: user.semester,
        year: user.year,
        academicYear: user.academicYear,
        notificationSettings: user.notificationSettings,
      }),
      ...(role === 'teacher' && {
        name: user.name,
        phone: user.phone,
        department: user.department,
        isApproved: user.isApproved,
        assignments: user.assignments,
      }),
      ...(role === 'admin' && {
        email: user.email,
      }),
    },
  });
});

// @desc    Register teacher
// @route   POST /api/auth/register/teacher
// @access  Public
export const registerTeacher = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, phone, department } = req.body;

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  // Check if email is valid GVPCE email
  if (!email.endsWith('@gvpce.ac.in')) {
    return res.status(400).json({
      success: false,
      message: 'Please use a valid GVPCE email (@gvpce.ac.in)',
    });
  }

  // Check if teacher already exists
  const existingTeacher = await Teacher.findOne({ email });
  if (existingTeacher) {
    return res.status(400).json({
      success: false,
      message: 'Teacher with this email already exists',
    });
  }

  // Create teacher
  const teacher = await Teacher.create({
    name,
    email,
    password,
    phone,
    department,
    isApproved: false, // Requires admin approval
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful! Your account is pending admin approval.',
    teacher: {
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      department: teacher.department,
      isApproved: teacher.isApproved,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  const role = req.userRole;

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      role,
      ...(role === 'student' && {
        rollNumber: user.rollNumber,
        branch: user.branch,
        semester: user.semester,
        year: user.year,
        academicYear: user.academicYear,
        notificationSettings: user.notificationSettings,
      }),
      ...(role === 'teacher' && {
        name: user.name,
        phone: user.phone,
        department: user.department,
        isApproved: user.isApproved,
        assignments: user.assignments,
      }),
    },
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: 'New passwords do not match',
    });
  }

  // Get user with password
  let user;
  if (req.userRole === 'admin') {
    user = await Admin.findById(req.user._id).select('+password');
  } else if (req.userRole === 'student') {
    user = await Student.findById(req.user._id).select('+password');
  } else if (req.userRole === 'teacher') {
    user = await Teacher.findById(req.user._id).select('+password');
  }

  // Check current password
  const isPasswordMatch = await user.comparePassword(currentPassword);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

// @desc    Check teacher approval status
// @route   GET /api/auth/teacher/approval-status
// @access  Private (Teacher only)
export const checkApprovalStatus = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.user._id);

  res.status(200).json({
    success: true,
    isApproved: teacher.isApproved,
    message: teacher.isApproved
      ? 'Your account is approved'
      : 'Your account is pending admin approval',
  });
});