import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Admin from '../models/Admin.js';
import { messaging } from '../config/firebase.js';

// @desc    Update FCM Token
// @route   PUT /api/fcm/token
// @access  Private (Student/Teacher/Admin)
export const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    let user;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Update token based on user role
    if (userRole === 'student') {
      user = await Student.findByIdAndUpdate(
        userId,
        { fcmToken },
        { new: true, runValidators: true }
      ).select('-password');
    } else if (userRole === 'teacher') {
      user = await Teacher.findByIdAndUpdate(
        userId,
        { fcmToken },
        { new: true, runValidators: true }
      ).select('-password');
    } else if (userRole === 'admin') {
      user = await Admin.findByIdAndUpdate(
        userId,
        { fcmToken },
        { new: true, runValidators: true }
      ).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token updated successfully',
      data: {
        userId: user._id,
        fcmToken: user.fcmToken,
      },
    });
  } catch (error) {
    console.error('Update FCM Token Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FCM token',
      error: error.message,
    });
  }
};

// @desc    Delete FCM Token (on logout)
// @route   DELETE /api/fcm/token
// @access  Private (Student/Teacher/Admin)
export const deleteFCMToken = async (req, res) => {
  try {
    let user;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Delete token based on user role
    if (userRole === 'student') {
      user = await Student.findByIdAndUpdate(
        userId,
        { fcmToken: null },
        { new: true }
      );
    } else if (userRole === 'teacher') {
      user = await Teacher.findByIdAndUpdate(
        userId,
        { fcmToken: null },
        { new: true }
      );
    } else if (userRole === 'admin') {
      user = await Admin.findByIdAndUpdate(
        userId,
        { fcmToken: null },
        { new: true }
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token deleted successfully',
    });
  } catch (error) {
    console.error('Delete FCM Token Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FCM token',
      error: error.message,
    });
  }
};

// @desc    Send notification to single user
// @route   POST /api/fcm/send-to-user
// @access  Private (Admin/Teacher)
export const sendNotificationToUser = async (req, res) => {
  try {
    const { userId, userRole, title, body, data } = req.body;

    if (!userId || !userRole || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'userId, userRole, title, and body are required',
      });
    }

    let user;
    if (userRole === 'student') {
      user = await Student.findById(userId);
    } else if (userRole === 'teacher') {
      user = await Teacher.findById(userId);
    }

    if (!user || !user.fcmToken) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no FCM token registered',
      });
    }

    // Check if user has notifications enabled
    if (userRole === 'student' && !user.notificationSettings.notifications) {
      return res.status(400).json({
        success: false,
        message: 'User has disabled notifications',
      });
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: user.fcmToken,
    };

    const response = await messaging.send(message);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        messageId: response,
      },
    });
  } catch (error) {
    console.error('Send Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    });
  }
};

// @desc    Send notification to multiple users
// @route   POST /api/fcm/send-to-multiple
// @access  Private (Admin/Teacher)
export const sendNotificationToMultiple = async (req, res) => {
  try {
    const { userIds, userRole, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || !userRole || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'userIds (array), userRole, title, and body are required',
      });
    }

    let users;
    if (userRole === 'student') {
      users = await Student.find({
        _id: { $in: userIds },
        fcmToken: { $ne: null },
        'notificationSettings.notifications': true,
      });
    } else if (userRole === 'teacher') {
      users = await Teacher.find({
        _id: { $in: userIds },
        fcmToken: { $ne: null },
      });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found with FCM tokens',
      });
    }

    const tokens = users.map(user => user.fcmToken);

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    res.status(200).json({
      success: true,
      message: 'Notifications sent successfully',
      data: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalUsers: users.length,
      },
    });
  } catch (error) {
    console.error('Send Multiple Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications',
      error: error.message,
    });
  }
};

// @desc    Send notification to topic
// @route   POST /api/fcm/send-to-topic
// @access  Private (Admin/Teacher)
// @desc    Send notification to topic
// @route   POST /api/fcm/send-to-topic
// @access  Private (Admin/Teacher)
export const sendNotificationToTopic = async (req, res) => {
  try {
    const { topic, title, body, data } = req.body;

    if (!topic || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'topic, title, and body are required',
      });
    }

    // Validate and format topic name
    const formattedTopic = topic.startsWith('/topics/') 
      ? topic 
      : `/topics/${topic.replace(/[^a-zA-Z0-9-_.~%]/g, '-')}`;

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic: formattedTopic,
    };

    const response = await messaging.send(message);

    res.status(200).json({
      success: true,
      message: `Notification sent to topic: ${formattedTopic}`,
      data: {
        messageId: response,
      },
    });
  } catch (error) {
    console.error('Send Topic Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send topic notification',
      error: error.message,
    });
  }
};

// @desc    Send notification to class (branch + semester)
// @route   POST /api/fcm/send-to-class
// @access  Private (Admin/Teacher)
export const sendNotificationToClass = async (req, res) => {
  try {
    const { branch, semester, title, body, data } = req.body;

    if (!branch || !semester || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'branch, semester, title, and body are required',
      });
    }

    // Find all students in the class with FCM tokens and notifications enabled
    const students = await Student.find({
      branch,
      semester,
      fcmToken: { $ne: null },
      'notificationSettings.notifications': true,
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found in this class with notifications enabled',
      });
    }

    const tokens = students.map(student => student.fcmToken);

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    res.status(200).json({
      success: true,
      message: `Notifications sent to ${branch} - Semester ${semester}`,
      data: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalStudents: students.length,
      },
    });
  } catch (error) {
    console.error('Send Class Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send class notification',
      error: error.message,
    });
  }
};