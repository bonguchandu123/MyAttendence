import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Subject from '../models/Subject.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Private (Student)
export const getDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const student = req.user;

  // Get all subjects for this student's branch and semester
  const subjects = await Subject.find({
    branch: student.branch,
    semester: student.semester,
    isActive: true,
  });

  // Get attendance for each subject
  const subjectsWithAttendance = await Promise.all(
    subjects.map(async (subject) => {
      const attendanceData = await Attendance.getStudentSubjectAttendance(
        studentId,
        subject._id
      );

      return {
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        totalClasses: attendanceData.totalClasses,
        attendedClasses: attendanceData.attendedClasses,
        percentage: attendanceData.percentage,
        lastClass: attendanceData.records[0]
          ? {
              date: attendanceData.records[0].date,
              day: attendanceData.records[0].day,
              time: `${attendanceData.records[0].periods[0]?.startTime || ''} - ${
                attendanceData.records[0].periods[0]?.endTime || ''
              }`,
            }
          : null,
      };
    })
  );

  // Calculate overall attendance
  let totalClasses = 0;
  let totalAttended = 0;

  subjectsWithAttendance.forEach((subject) => {
    totalClasses += subject.totalClasses;
    totalAttended += subject.attendedClasses;
  });

  const overallAttendance =
    totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      student: {
        rollNumber: student.rollNumber,
        email: student.email,
        branch: student.branch,
        semester: student.semester,
        year: student.year,
        academicYear: student.academicYear,
      },
      overallAttendance,
      targetAttendance: 75,
      totalClasses,
      attendedClasses: totalAttended,
      subjects: subjectsWithAttendance,
    },
  });
});

// @desc    Get all subjects for student
// @route   GET /api/student/subjects
// @access  Private (Student)
export const getAllSubjects = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const student = req.user;

  // Get all subjects for this student's branch and semester
  const subjects = await Subject.find({
    branch: student.branch,
    semester: student.semester,
    isActive: true,
  }).sort({ subjectName: 1 });

  // Get attendance for each subject
  const subjectsWithAttendance = await Promise.all(
    subjects.map(async (subject) => {
      const attendanceData = await Attendance.getStudentSubjectAttendance(
        studentId,
        subject._id
      );

      return {
        _id: subject._id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        credits: subject.credits,
        type: subject.type,
        totalClasses: attendanceData.totalClasses,
        attendedClasses: attendanceData.attendedClasses,
        percentage: attendanceData.percentage,
        lastClass: attendanceData.records[0]
          ? {
              date: attendanceData.records[0].date,
              day: attendanceData.records[0].day,
              time: `${attendanceData.records[0].periods[0]?.startTime || ''} - ${
                attendanceData.records[0].periods[0]?.endTime || ''
              }`,
            }
          : null,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: subjectsWithAttendance.length,
    data: subjectsWithAttendance,
  });
});

// @desc    Get subject details with attendance
// @route   GET /api/student/subjects/:subjectId
// @access  Private (Student)
export const getSubjectDetails = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { subjectId } = req.params;

  // Get subject
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  // Get attendance data
  const attendanceData = await Attendance.getStudentSubjectAttendance(
    studentId,
    subjectId
  );

  // Get monthly breakdown
  const monthlyBreakdown = await Attendance.getMonthlyBreakdown(studentId, subjectId);

  res.status(200).json({
    success: true,
    data: {
      subject: {
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        credits: subject.credits,
        type: subject.type,
      },
      attendance: {
        percentage: attendanceData.percentage,
        totalClasses: attendanceData.totalClasses,
        attendedClasses: attendanceData.attendedClasses,
        absentClasses: attendanceData.totalClasses - attendanceData.attendedClasses,
      },
      monthlyBreakdown,
    },
  });
});

// @desc    Get detailed attendance history
// @route   GET /api/student/attendance/history/:subjectId
// @access  Private (Student)
export const getAttendanceHistory = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { subjectId } = req.params;
  const { month } = req.query; // Optional filter by month (e.g., "January 2026")

  let query = {
    student: studentId,
    subject: subjectId,
  };

  // Filter by month if provided
  if (month) {
    const [monthName, year] = month.split(' ');
    const monthIndex = new Date(Date.parse(monthName + ' 1, 2000')).getMonth();
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

    query.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const attendanceRecords = await Attendance.find(query)
    .populate('subject', 'subjectCode subjectName')
    .sort({ date: -1 });

  // Group by month
  const groupedByMonth = {};

  attendanceRecords.forEach((record) => {
    const monthYear = new Date(record.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    if (!groupedByMonth[monthYear]) {
      groupedByMonth[monthYear] = [];
    }

    // Add each period as a separate entry
    record.periods.forEach((period) => {
      groupedByMonth[monthYear].push({
        date: record.date,
        day: record.day,
        period: `Period ${period.periodNumber}`,
        time: `${period.startTime} - ${period.endTime}`,
        status: period.status,
      });
    });
  });

  res.status(200).json({
    success: true,
    data: groupedByMonth,
  });
});

// @desc    Get overall reports and analytics
// @route   GET /api/student/reports
// @access  Private (Student)
export const getReports = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const student = req.user;

  // Get all subjects
  const subjects = await Subject.find({
    branch: student.branch,
    semester: student.semester,
    isActive: true,
  });

  // Get attendance for each subject
  const subjectWiseData = await Promise.all(
    subjects.map(async (subject) => {
      const attendanceData = await Attendance.getStudentSubjectAttendance(
        studentId,
        subject._id
      );

      return {
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        percentage: attendanceData.percentage,
        totalClasses: attendanceData.totalClasses,
        attendedClasses: attendanceData.attendedClasses,
        status:
          attendanceData.percentage >= 90
            ? 'excellent'
            : attendanceData.percentage >= 75
            ? 'good'
            : 'warning',
      };
    })
  );

  // Calculate overall stats
  let totalClasses = 0;
  let totalAttended = 0;
  let totalMissed = 0;

  subjectWiseData.forEach((subject) => {
    totalClasses += subject.totalClasses;
    totalAttended += subject.attendedClasses;
    totalMissed += subject.totalClasses - subject.attendedClasses;
  });

  const overallPercentage =
    totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  // Get attendance trend (last 4 months)
  const attendanceTrend = await getAttendanceTrend(studentId);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        overallPercentage,
        totalClasses,
        attended: totalAttended,
        missed: totalMissed,
      },
      subjectWise: subjectWiseData,
      trend: attendanceTrend,
    },
  });
});

// Helper function to get attendance trend
const getAttendanceTrend = async (studentId) => {
  const months = [];
  const now = new Date();

  // Get last 4 months
  for (let i = 3; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const records = await Attendance.find({
      student: studentId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    let totalClasses = 0;
    let attendedClasses = 0;

    records.forEach((record) => {
      totalClasses += record.periods.length;
      attendedClasses += record.periods.filter((p) => p.status === 'present').length;
    });

    const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

    months.push({
      month: monthName,
      percentage,
    });
  }

  return months;
};

// @desc    Update notification settings
// @route   PUT /api/student/settings/notifications
// @access  Private (Student)
export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);

  const { notifications, emailAlerts, darkMode } = req.body;

  if (notifications !== undefined) {
    student.notificationSettings.notifications = notifications;
  }
  if (emailAlerts !== undefined) {
    student.notificationSettings.emailAlerts = emailAlerts;
  }
  if (darkMode !== undefined) {
    student.notificationSettings.darkMode = darkMode;
  }

  await student.save();

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    notificationSettings: student.notificationSettings,
  });
});

// @desc    Get notifications
// @route   GET /api/student/notifications
// @access  Private (Student)
export const getNotifications = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const student = req.user;

  const notifications = [];

  // Get all subjects
  const subjects = await Subject.find({
    branch: student.branch,
    semester: student.semester,
    isActive: true,
  });

  // Check for low attendance
  for (const subject of subjects) {
    const attendanceData = await Attendance.getStudentSubjectAttendance(
      studentId,
      subject._id
    );

    if (attendanceData.percentage < 75 && attendanceData.totalClasses > 0) {
      notifications.push({
        type: 'warning',
        title: 'Low Attendance Alert',
        message: `${subject.subjectName} attendance dropped to ${attendanceData.percentage}%. Attend next classes to improve.`,
        date: new Date(),
        category: 'today',
      });
    }
  }

  // Get recent attendance marked (last 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recentAttendance = await Attendance.find({
    student: studentId,
    date: { $gte: threeDaysAgo },
  })
    .populate('subject', 'subjectName')
    .sort({ date: -1 })
    .limit(5);

  recentAttendance.forEach((record) => {
    const daysAgo = Math.floor((new Date() - new Date(record.date)) / (1000 * 60 * 60 * 24));
    const category = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : 'this_week';

    notifications.push({
      type: 'success',
      title: 'Attendance Marked',
      message: `You were marked present in ${record.subject.subjectName} (${new Date(
        record.date
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      date: record.date,
      category,
    });
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});