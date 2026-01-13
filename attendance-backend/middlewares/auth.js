import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

// Generate JWT Token
export const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      let user;
      if (decoded.role === 'admin') {
        user = await Admin.findById(decoded.id).select('-password');
      } else if (decoded.role === 'student') {
        user = await Student.findById(decoded.id).select('-password');
      } else if (decoded.role === 'teacher') {
        user = await Teacher.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated',
        });
      }

      // Attach user to request
      req.user = user;
      req.userRole = decoded.role;

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.userRole}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if teacher is approved
export const checkTeacherApproval = async (req, res, next) => {
  if (req.userRole === 'teacher') {
    const teacher = await Teacher.findById(req.user._id);
    
    if (!teacher.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval',
        isApproved: false,
      });
    }
  }
  next();
};