import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// @desc    Get all attendance records (Admin)
// @route   GET /api/attendance
// @access  Private (Admin)
export const getAllAttendance = asyncHandler(async (req, res) => {
  const { branch, semester, subject, date, student } = req.query;

  let query = {};

  if (subject) query.subject = subject;
  if (student) query.student = student;

  if (date) {
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'rollNumber email branch semester')
    .populate('subject', 'subjectCode subjectName')
    .populate('teacher', 'name email')
    .sort({ date: -1 });

  // Filter by branch/semester if provided
  let filteredAttendance = attendance;
  if (branch) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.student.branch === branch.toUpperCase()
    );
  }
  if (semester) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.student.semester === parseInt(semester)
    );
  }

  res.status(200).json({
    success: true,
    count: filteredAttendance.length,
    data: filteredAttendance,
  });
});

// @desc    Get attendance by student
// @route   GET /api/attendance/student/:studentId
// @access  Private (Admin/Student)
export const getAttendanceByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { subject } = req.query;

  // Check if student exists
  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  let query = { student: studentId };
  if (subject) query.subject = subject;

  const attendance = await Attendance.find(query)
    .populate('subject', 'subjectCode subjectName')
    .populate('teacher', 'name')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: attendance.length,
    student: {
      rollNumber: student.rollNumber,
      email: student.email,
      branch: student.branch,
      semester: student.semester,
    },
    data: attendance,
  });
});

// @desc    Get attendance by subject
// @route   GET /api/attendance/subject/:subjectId
// @access  Private (Admin/Teacher)
export const getAttendanceBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { date, student } = req.query;

  // Check if subject exists
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  let query = { subject: subjectId };

  if (student) query.student = student;

  if (date) {
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'rollNumber email branch semester')
    .populate('teacher', 'name email')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: attendance.length,
    subject: {
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      branch: subject.branch,
      semester: subject.semester,
    },
    data: attendance,
  });
});

// @desc    Get attendance by date
// @route   GET /api/attendance/date/:date
// @access  Private (Admin)
export const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { branch, semester, subject } = req.query;

  const attendanceDate = new Date(date);
  const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

  let query = {
    date: { $gte: startOfDay, $lte: endOfDay },
  };

  if (subject) query.subject = subject;

  const attendance = await Attendance.find(query)
    .populate('student', 'rollNumber email branch semester')
    .populate('subject', 'subjectCode subjectName')
    .populate('teacher', 'name email')
    .sort({ subject: 1 });

  // Filter by branch/semester if provided
  let filteredAttendance = attendance;
  if (branch) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.student.branch === branch.toUpperCase()
    );
  }
  if (semester) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.student.semester === parseInt(semester)
    );
  }

  res.status(200).json({
    success: true,
    count: filteredAttendance.length,
    date: attendanceDate,
    data: filteredAttendance,
  });
});

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private (Admin)
export const getAttendanceStats = asyncHandler(async (req, res) => {
  const { branch, semester, startDate, endDate } = req.query;

  let query = {};

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const attendance = await Attendance.find(query).populate(
    'student',
    'branch semester'
  );

  // Filter by branch/semester if provided
  let filteredAttendance = attendance;
  if (branch) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.student.branch === branch.toUpperCase()
    );
  }
  if (semester) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.student.semester === parseInt(semester)
    );
  }

  // Calculate statistics
  let totalClasses = 0;
  let presentCount = 0;
  let absentCount = 0;

  filteredAttendance.forEach((record) => {
    record.periods.forEach((period) => {
      totalClasses++;
      if (period.status === 'present') {
        presentCount++;
      } else {
        absentCount++;
      }
    });
  });

  const overallPercentage =
    totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalSessions: filteredAttendance.length,
      totalClasses,
      presentCount,
      absentCount,
      overallPercentage,
      filters: {
        branch: branch || 'All',
        semester: semester || 'All',
        startDate: startDate || 'Not specified',
        endDate: endDate || 'Not specified',
      },
    },
  });
});

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Admin)
export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'Attendance record not found',
    });
  }

  await attendance.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Attendance record deleted successfully',
    data: {},
  });
});

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Admin/Teacher)
export const updateAttendance = asyncHandler(async (req, res) => {
  let attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'Attendance record not found',
    });
  }

  const { periods } = req.body;

  if (periods) {
    attendance.periods = periods;
  }

  await attendance.save();

  attendance = await Attendance.findById(req.params.id)
    .populate('student', 'rollNumber email')
    .populate('subject', 'subjectCode subjectName')
    .populate('teacher', 'name');

  res.status(200).json({
    success: true,
    message: 'Attendance record updated successfully',
    data: attendance,
  });
});

// @desc    Get low attendance students
// @route   GET /api/attendance/low-attendance
// @access  Private (Admin)
export const getLowAttendanceStudents = asyncHandler(async (req, res) => {
  const { threshold = 75, branch, semester } = req.query;

  let studentQuery = { isActive: true };
  if (branch) studentQuery.branch = branch.toUpperCase();
  if (semester) studentQuery.semester = parseInt(semester);

  const students = await Student.find(studentQuery);

  const lowAttendanceStudents = [];

  for (const student of students) {
    // Get all subjects for this student
    const subjects = await Subject.find({
      branch: student.branch,
      semester: student.semester,
      isActive: true,
    });

    const studentSubjects = [];

    for (const subject of subjects) {
      const attendanceData = await Attendance.getStudentSubjectAttendance(
        student._id,
        subject._id
      );

      if (
        attendanceData.percentage < threshold &&
        attendanceData.totalClasses > 0
      ) {
        studentSubjects.push({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          percentage: attendanceData.percentage,
          totalClasses: attendanceData.totalClasses,
          attendedClasses: attendanceData.attendedClasses,
        });
      }
    }

    if (studentSubjects.length > 0) {
      lowAttendanceStudents.push({
        student: {
          _id: student._id,
          rollNumber: student.rollNumber,
          email: student.email,
          branch: student.branch,
          semester: student.semester,
        },
        subjects: studentSubjects,
      });
    }
  }

  res.status(200).json({
    success: true,
    count: lowAttendanceStudents.length,
    threshold: parseInt(threshold),
    data: lowAttendanceStudents,
  });
});

// @desc    Get attendance summary by branch and semester
// @route   GET /api/attendance/summary
// @access  Private (Admin)
export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { branch, semester } = req.query;

  if (!branch || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide branch and semester',
    });
  }

  // Get all students
  const students = await Student.find({
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    isActive: true,
  });

  // Get all subjects
  const subjects = await Subject.find({
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    isActive: true,
  });

  const summary = {
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    totalStudents: students.length,
    totalSubjects: subjects.length,
    subjectWise: [],
  };

  for (const subject of subjects) {
    let totalClasses = 0;
    let presentCount = 0;

    for (const student of students) {
      const attendanceData = await Attendance.getStudentSubjectAttendance(
        student._id,
        subject._id
      );

      totalClasses += attendanceData.totalClasses;
      presentCount += attendanceData.attendedClasses;
    }

    const percentage =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    summary.subjectWise.push({
      subject: {
        _id: subject._id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
      },
      totalClasses,
      presentCount,
      percentage,
    });
  }

  res.status(200).json({
    success: true,
    data: summary,
  });
});

export const getAllAttendanceRecords = asyncHandler(async (req, res) => {
  const { branch, semester, subject, date, page = 1, limit = 50 } = req.query;

  let query = {};

  if (subject) query.subject = subject;
  if (date) {
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'rollNumber email branch semester')
    .populate('subject', 'subjectCode subjectName branch semester')
    .populate('teacher', 'name email')
    .sort({ markedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Filter by branch/semester if provided
  let filteredAttendance = attendance;
  if (branch) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.subject.branch === branch.toUpperCase()
    );
  }
  if (semester) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.subject.semester === parseInt(semester)
    );
  }

  // Count total for pagination
  const totalQuery = { ...query };
  const total = await Attendance.countDocuments(totalQuery);

  // Group by session (date + subject + teacher)
  const groupedSessions = {};

  filteredAttendance.forEach((record) => {
    const sessionKey = `${record.date.toISOString().split('T')[0]}-${record.subject._id}-${record.teacher._id}`;

    if (!groupedSessions[sessionKey]) {
      groupedSessions[sessionKey] = {
        sessionId: sessionKey,
        date: record.date,
        day: record.day,
        subject: {
          _id: record.subject._id,
          subjectCode: record.subject.subjectCode,
          subjectName: record.subject.subjectName,
          branch: record.subject.branch,
          semester: record.subject.semester,
        },
        teacher: {
          _id: record.teacher._id,
          name: record.teacher.name,
          email: record.teacher.email,
        },
        markedAt: record.markedAt,
        periods: record.periods,
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        students: [],
      };
    }

    groupedSessions[sessionKey].totalStudents++;
    
    const hasPresent = record.periods.some(p => p.status === 'present');
    if (hasPresent) {
      groupedSessions[sessionKey].presentCount++;
    } else {
      groupedSessions[sessionKey].absentCount++;
    }

    groupedSessions[sessionKey].students.push({
      _id: record.student._id,
      rollNumber: record.student.rollNumber,
      email: record.student.email,
      branch: record.student.branch,
      semester: record.student.semester,
      periods: record.periods,
    });
  });

  const sessions = Object.values(groupedSessions);

  res.status(200).json({
    success: true,
    count: sessions.length,
    totalRecords: total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    data: sessions,
  });
});

// @desc    Export attendance records to CSV format
// @route   GET /api/attendance/export/csv
// @access  Private (Admin)
export const exportAttendanceCSV = asyncHandler(async (req, res) => {
  const { branch, semester, date, startDate, endDate } = req.query;

  let query = {};

  if (date) {
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  } else if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'rollNumber email branch semester')
    .populate('subject', 'subjectCode subjectName branch semester')
    .populate('teacher', 'name email')
    .sort({ date: -1, subject: 1 });

  // Filter by branch/semester if provided
  let filteredAttendance = attendance;
  if (branch) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.student.branch === branch.toUpperCase()
    );
  }
  if (semester) {
    filteredAttendance = filteredAttendance.filter(
      (att) => att.student.semester === parseInt(semester)
    );
  }

  // Generate CSV
  const csvRows = [];
  
  // Header
  csvRows.push([
    'Date',
    'Day',
    'Roll Number',
    'Student Email',
    'Branch',
    'Semester',
    'Subject Code',
    'Subject Name',
    'Teacher',
    'Periods',
    'Status',
    'Marked At'
  ].join(','));

  // Data rows
  filteredAttendance.forEach((record) => {
    const periods = record.periods.map(p => `P${p.periodNumber}`).join(';');
    const statuses = record.periods.map(p => p.status).join(';');
    
    csvRows.push([
      new Date(record.date).toLocaleDateString(),
      record.day,
      record.student.rollNumber,
      record.student.email,
      record.student.branch,
      record.student.semester,
      record.subject.subjectCode,
      record.subject.subjectName,
      record.teacher.name,
      periods,
      statuses,
      new Date(record.markedAt).toLocaleString()
    ].join(','));
  });

  const csv = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendance-export-${Date.now()}.csv`);
  res.status(200).send(csv);
});

// @desc    Export attendance summary to CSV
// @route   GET /api/attendance/export/summary-csv
// @access  Private (Admin)
export const exportAttendanceSummaryCSV = asyncHandler(async (req, res) => {
  const { branch, semester } = req.query;

  if (!branch || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide branch and semester',
    });
  }

  // Get all students
  const students = await Student.find({
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    isActive: true,
  }).sort({ rollNumber: 1 });

  // Get all subjects
  const subjects = await Subject.find({
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    isActive: true,
  });

  // Generate CSV
  const csvRows = [];
  
  // Header
  const header = ['Roll Number', 'Email'];
  subjects.forEach(subject => {
    header.push(`${subject.subjectCode} (%)`, `${subject.subjectCode} (Classes)`);
  });
  header.push('Overall %');
  csvRows.push(header.join(','));

  // Data rows
  for (const student of students) {
    const row = [student.rollNumber, student.email];
    
    let totalClasses = 0;
    let totalAttended = 0;

    for (const subject of subjects) {
      const attendanceData = await Attendance.getStudentSubjectAttendance(
        student._id,
        subject._id
      );

      row.push(
        attendanceData.percentage,
        `${attendanceData.attendedClasses}/${attendanceData.totalClasses}`
      );

      totalClasses += attendanceData.totalClasses;
      totalAttended += attendanceData.attendedClasses;
    }

    const overallPercentage = totalClasses > 0 
      ? Math.round((totalAttended / totalClasses) * 100) 
      : 0;
    
    row.push(overallPercentage);
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendance-summary-${branch}-sem${semester}-${Date.now()}.csv`);
  res.status(200).send(csv);
});