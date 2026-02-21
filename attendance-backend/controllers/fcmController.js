import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Admin from '../models/Admin.js';
import Schedule from '../models/Schedule.js';
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
    const userId = req.user._id;
    const userRole = req.userRole;

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
    const userId = req.user._id;
    const userRole = req.userRole;

    if (userRole === 'student') {
      user = await Student.findByIdAndUpdate(userId, { fcmToken: null }, { new: true });
    } else if (userRole === 'teacher') {
      user = await Teacher.findByIdAndUpdate(userId, { fcmToken: null }, { new: true });
    } else if (userRole === 'admin') {
      user = await Admin.findByIdAndUpdate(userId, { fcmToken: null }, { new: true });
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

    if (userRole === 'student' && !user.notificationSettings.notifications) {
      return res.status(400).json({
        success: false,
        message: 'User has disabled notifications',
      });
    }

    const message = {
      notification: { title, body },
      data: data || {},
      token: user.fcmToken,
    };

    const response = await messaging.send(message);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: { messageId: response },
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

    const tokens = users.map((user) => user.fcmToken);
    const message = {
      notification: { title, body },
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
export const sendNotificationToTopic = async (req, res) => {
  try {
    const { topic, title, body, data } = req.body;

    if (!topic || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'topic, title, and body are required',
      });
    }

    const formattedTopic = topic
      .replace(/^\/topics\//, '')
      .replace(/[^a-zA-Z0-9-_.~%]/g, '_');

    const message = {
      notification: { title, body },
      data: data || {},
      topic: formattedTopic,
    };

    const response = await messaging.send(message);

    res.status(200).json({
      success: true,
      message: `Notification sent to topic: ${formattedTopic}`,
      data: { messageId: response, topic: formattedTopic },
    });
  } catch (error) {
    console.error('❌ Send Topic Notification Error:', error);
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

    const students = await Student.find({
      branch: branch.toUpperCase(),
      semester: parseInt(semester),
      fcmToken: { $ne: null, $exists: true },
      'notificationSettings.notifications': true,
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found in this class with notifications enabled',
      });
    }

    const tokens = students.map((s) => s.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid FCM tokens found',
      });
    }

    const message = {
      notification: { title, body },
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
    console.error('❌ Send Class Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send class notification',
      error: error.message,
    });
  }
};

// =====================================================
// NEW: BRANCH-BASED STUDENT LOADER
// =====================================================

/**
 * @desc    Get students list by branch (and optionally semester) for notification targeting
 * @route   GET /api/fcm/students-by-branch?branch=CSE&semester=3
 * @access  Private (Admin/Teacher)
 *
 * Frontend flow:
 *  1. Admin/Teacher selects a branch (and optionally a semester)
 *  2. Call this endpoint → get the student list
 *  3. User ticks which students to notify
 *  4. Call POST /api/fcm/send-to-selected with the chosen IDs
 */
export const getStudentsByBranch = async (req, res) => {
  try {
    const { branch, semester } = req.query;

    if (!branch) {
      return res.status(400).json({
        success: false,
        message: 'branch query parameter is required',
      });
    }

    const query = {
      branch: branch.toUpperCase(),
      isActive: true,
    };

    if (semester) {
      query.semester = parseInt(semester);
    }

    const students = await Student.find(query)
      .select('_id rollNumber email branch semester notificationSettings fcmToken')
      .sort({ rollNumber: 1 })
      .lean();

    const studentList = students.map((s) => ({
      _id: s._id,
      rollNumber: s.rollNumber,
      email: s.email,
      branch: s.branch,
      semester: s.semester,
      // Tells the frontend whether notifications are possible for this student
      notificationsEnabled: s.notificationSettings?.notifications ?? false,
      hasToken: !!s.fcmToken,
    }));

    res.status(200).json({
      success: true,
      count: studentList.length,
      branch: branch.toUpperCase(),
      semester: semester ? parseInt(semester) : 'All',
      data: studentList,
    });
  } catch (error) {
    console.error('Get Students By Branch Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message,
    });
  }
};

// =====================================================
// NEW: SEND TO SELECTED STUDENTS (ADMIN / TEACHER)
// =====================================================

/**
 * @desc    Send a custom notification to a specific hand-picked list of students
 * @route   POST /api/fcm/send-to-selected
 * @access  Private (Admin/Teacher)
 *
 * Body:
 *   studentIds  – string[]   – array of Student _id values chosen by the sender
 *   title       – string     – push notification title
 *   body        – string     – push notification body
 *   data        – object?    – optional extra key/value payload sent with the push
 *
 * Example body:
 * {
 *   "studentIds": ["665abc...", "665def..."],
 *   "title": "Lab Cancelled",
 *   "body": "Tomorrow's Physics lab is cancelled. No need to come.",
 *   "data": { "type": "announcement" }
 * }
 */
export const sendToSelectedStudents = async (req, res) => {
  try {
    const { studentIds, title, body, data } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentIds must be a non-empty array',
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title and body are required',
      });
    }

    // Only fetch students who actually have a token and haven't opted out
    const students = await Student.find({
      _id: { $in: studentIds },
      fcmToken: { $ne: null, $exists: true },
      'notificationSettings.notifications': true,
    })
      .select('_id rollNumber email fcmToken')
      .lean();

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'None of the selected students have notifications enabled or FCM tokens registered',
      });
    }

    const tokens = students.map((s) => s.fcmToken);

    const message = {
      notification: { title, body },
      data: {
        type: 'custom_notification',
        title,
        message: body,
        ...(data || {}),
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    // Build a per-student result map for transparency
    const results = students.map((s, idx) => ({
      studentId: s._id,
      rollNumber: s.rollNumber,
      email: s.email,
      success: response.responses[idx]?.success ?? false,
      error: response.responses[idx]?.error?.message ?? null,
    }));

    console.log(
      `✅ Selected-student notification: ${response.successCount} sent, ${response.failureCount} failed`
    );

    res.status(200).json({
      success: true,
      message: `Notifications sent to ${response.successCount} out of ${students.length} selected students`,
      data: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        skippedCount: studentIds.length - students.length, // students without token / opted-out
        totalRequested: studentIds.length,
        results,
      },
    });
  } catch (error) {
    console.error('Send To Selected Students Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications to selected students',
      error: error.message,
    });
  }
};

// =====================================================
// NEW: TEACHER SENDS NOTIFICATION TO THEIR OWN CLASS
// =====================================================

/**
 * @desc    Teacher sends a custom notification to all students in one of their assigned classes
 * @route   POST /api/fcm/teacher/send-to-class
 * @access  Private (Teacher)
 *
 * Body:
 *   scheduleId  – string  – the Schedule _id (used to derive subject + branch + semester)
 *   title       – string
 *   body        – string
 *   type        – string? – e.g. "announcement" | "reminder" | "exam" | "general"
 *   data        – object? – optional extra payload
 *
 * Example body:
 * {
 *   "scheduleId": "665aaa...",
 *   "title": "Test Tomorrow",
 *   "body": "Unit test for Chapter 3 is scheduled for tomorrow. Please prepare.",
 *   "type": "exam"
 * }
 */
export const teacherSendToClass = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { scheduleId, title, body, type = 'general', data } = req.body;

    if (!scheduleId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'scheduleId, title, and body are required',
      });
    }

    // Fetch the schedule and verify it belongs to this teacher
    const schedule = await Schedule.findById(scheduleId).populate(
      'subject',
      'subjectCode subjectName'
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    if (schedule.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send notifications for this class',
      });
    }

    // Find all students in this class with valid tokens and notifications on
    const students = await Student.find({
      branch: schedule.branch,
      semester: schedule.semester,
      isActive: true,
      fcmToken: { $ne: null, $exists: true },
      'notificationSettings.notifications': true,
    })
      .select('_id rollNumber fcmToken')
      .lean();

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students in this class have notifications enabled',
      });
    }

    const tokens = students.map((s) => s.fcmToken);

    const message = {
      notification: { title, body },
      data: {
        type,
        subjectId: schedule.subject._id.toString(),
        subjectName: schedule.subject.subjectName,
        subjectCode: schedule.subject.subjectCode,
        branch: schedule.branch,
        semester: schedule.semester.toString(),
        title,
        message: body,
        ...(data || {}),
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    console.log(
      `📢 Teacher notification → ${schedule.subject.subjectName} [${schedule.branch} Sem ${schedule.semester}]: ` +
        `${response.successCount} sent, ${response.failureCount} failed`
    );

    res.status(200).json({
      success: true,
      message: `Notification sent to ${response.successCount} students in ${schedule.branch} - Semester ${schedule.semester}`,
      data: {
        subject: {
          _id: schedule.subject._id,
          subjectCode: schedule.subject.subjectCode,
          subjectName: schedule.subject.subjectName,
        },
        branch: schedule.branch,
        semester: schedule.semester,
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalStudents: students.length,
      },
    });
  } catch (error) {
    console.error('Teacher Send To Class Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send class notification',
      error: error.message,
    });
  }
};

// =====================================================
// NEW: TEACHER SENDS NOTIFICATION TO SELECTED STUDENTS
// =====================================================

/**
 * @desc    Teacher sends a custom notification to specific students (hand-picked from their class)
 * @route   POST /api/fcm/teacher/send-to-selected
 * @access  Private (Teacher)
 *
 * Body:
 *   scheduleId  – string    – used to verify teacher owns the class
 *   studentIds  – string[]  – subset of student _ids from that class
 *   title       – string
 *   body        – string
 *   type        – string?   – "announcement" | "reminder" | "exam" | "general"
 *   data        – object?
 *
 * Example body:
 * {
 *   "scheduleId": "665aaa...",
 *   "studentIds": ["665bbb...", "665ccc..."],
 *   "title": "Attendance Warning",
 *   "body": "Your attendance is critically low. Please meet me after class.",
 *   "type": "reminder"
 * }
 */
export const teacherSendToSelectedStudents = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { scheduleId, studentIds, title, body, type = 'general', data } = req.body;

    if (!scheduleId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'scheduleId and a non-empty studentIds array are required',
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title and body are required',
      });
    }

    // Verify the schedule belongs to this teacher
    const schedule = await Schedule.findById(scheduleId).populate(
      'subject',
      'subjectCode subjectName'
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    if (schedule.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send notifications for this class',
      });
    }

    // Fetch only the requested students who are in this class, have tokens, and have notifications on
    const students = await Student.find({
      _id: { $in: studentIds },
      branch: schedule.branch,
      semester: schedule.semester,
      isActive: true,
      fcmToken: { $ne: null, $exists: true },
      'notificationSettings.notifications': true,
    })
      .select('_id rollNumber email fcmToken')
      .lean();

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'None of the selected students have notifications enabled or belong to this class',
      });
    }

    const tokens = students.map((s) => s.fcmToken);

    const message = {
      notification: { title, body },
      data: {
        type,
        subjectId: schedule.subject._id.toString(),
        subjectName: schedule.subject.subjectName,
        subjectCode: schedule.subject.subjectCode,
        branch: schedule.branch,
        semester: schedule.semester.toString(),
        title,
        message: body,
        ...(data || {}),
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    // Per-student delivery details
    const results = students.map((s, idx) => ({
      studentId: s._id,
      rollNumber: s.rollNumber,
      email: s.email,
      success: response.responses[idx]?.success ?? false,
      error: response.responses[idx]?.error?.message ?? null,
    }));

    console.log(
      `📢 Teacher → selected students [${schedule.branch} Sem ${schedule.semester}]: ` +
        `${response.successCount} sent, ${response.failureCount} failed`
    );

    res.status(200).json({
      success: true,
      message: `Notification sent to ${response.successCount} out of ${students.length} selected students`,
      data: {
        subject: {
          _id: schedule.subject._id,
          subjectCode: schedule.subject.subjectCode,
          subjectName: schedule.subject.subjectName,
        },
        branch: schedule.branch,
        semester: schedule.semester,
        successCount: response.successCount,
        failureCount: response.failureCount,
        skippedCount: studentIds.length - students.length,
        totalRequested: studentIds.length,
        results,
      },
    });
  } catch (error) {
    console.error('Teacher Send To Selected Students Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications to selected students',
      error: error.message,
    });
  }
};

// =====================================================
// NEW: GET TEACHER'S OWN CLASSES (for notification dropdown)
// =====================================================

/**
 * @desc    Get all classes/schedules a teacher can send notifications for
 * @route   GET /api/fcm/teacher/my-classes
 * @access  Private (Teacher)
 *
 * Frontend uses this to populate the "Select a class" dropdown
 * before calling teacherSendToClass or teacherSendToSelectedStudents.
 */
export const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const schedules = await Schedule.find({ teacher: teacherId, isActive: true })
      .populate('subject', 'subjectCode subjectName')
      .lean();

    // Deduplicate by subject+branch+semester and count students
    const classMap = new Map();

    for (const schedule of schedules) {
      const key = `${schedule.subject._id}-${schedule.branch}-${schedule.semester}`;

      if (!classMap.has(key)) {
        const studentCount = await Student.countDocuments({
          branch: schedule.branch,
          semester: schedule.semester,
          isActive: true,
        });

        const reachableCount = await Student.countDocuments({
          branch: schedule.branch,
          semester: schedule.semester,
          isActive: true,
          fcmToken: { $ne: null, $exists: true },
          'notificationSettings.notifications': true,
        });

        classMap.set(key, {
          scheduleId: schedule._id, // use this when calling teacher send endpoints
          subject: {
            _id: schedule.subject._id,
            subjectCode: schedule.subject.subjectCode,
            subjectName: schedule.subject.subjectName,
          },
          branch: schedule.branch,
          semester: schedule.semester,
          className: `${schedule.branch} - Sem ${schedule.semester}`,
          studentCount,
          reachableCount, // students who will actually receive the push
        });
      }
    }

    const classes = Array.from(classMap.values());

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error('Get Teacher Classes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher classes',
      error: error.message,
    });
  }
};