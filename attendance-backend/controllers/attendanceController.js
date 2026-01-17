import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// @desc    Get all attendance records (Admin) - OPTIMIZED
// @route   GET /api/attendance
// @access  Private (Admin)
export const getAllAttendance = asyncHandler(async (req, res) => {
  const { branch, semester, subject, date, student } = req.query;

  let query = {};

  if (subject) query.subject = subject;
  if (student) query.student = student;

  // Add branch/semester to query using aggregation match
  if (branch || semester) {
    const studentQuery = { isActive: true };
    if (branch) studentQuery.branch = branch.toUpperCase();
    if (semester) studentQuery.semester = parseInt(semester);
    
    const matchingStudents = await Student.find(studentQuery).select('_id').lean();
    query.student = { $in: matchingStudents.map(s => s._id) };
  }

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
    .sort({ date: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance,
  });
});

// @desc    Get attendance by student - OPTIMIZED
// @route   GET /api/attendance/student/:studentId
// @access  Private (Admin/Student)
export const getAttendanceByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { subject } = req.query;

  // Check if student exists
  const student = await Student.findById(studentId).select('rollNumber email branch semester').lean();
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
    .sort({ date: -1 })
    .lean();

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

// @desc    Get attendance by subject - OPTIMIZED
// @route   GET /api/attendance/subject/:subjectId
// @access  Private (Admin/Teacher)
export const getAttendanceBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { date, student } = req.query;

  // Check if subject exists
  const subject = await Subject.findById(subjectId).select('subjectCode subjectName branch semester').lean();
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
    .sort({ date: -1 })
    .lean();

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

// @desc    Get attendance by date - OPTIMIZED
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

  // Add branch/semester to query
  if (branch || semester) {
    const studentQuery = { isActive: true };
    if (branch) studentQuery.branch = branch.toUpperCase();
    if (semester) studentQuery.semester = parseInt(semester);
    
    const matchingStudents = await Student.find(studentQuery).select('_id').lean();
    query.student = { $in: matchingStudents.map(s => s._id) };
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'rollNumber email branch semester')
    .populate('subject', 'subjectCode subjectName')
    .populate('teacher', 'name email')
    .sort({ subject: 1 })
    .lean();

  res.status(200).json({
    success: true,
    count: attendance.length,
    date: attendanceDate,
    data: attendance,
  });
});

// @desc    Get attendance statistics - OPTIMIZED
// @route   GET /api/attendance/stats
// @access  Private (Admin)
export const getAttendanceStats = asyncHandler(async (req, res) => {
  const { branch, semester, startDate, endDate } = req.query;

  let matchStage = {};

  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Build aggregation pipeline
  const pipeline = [
    { $match: matchStage },
  ];

  // Add student filter if branch/semester specified
  if (branch || semester) {
    const studentQuery = { isActive: true };
    if (branch) studentQuery.branch = branch.toUpperCase();
    if (semester) studentQuery.semester = parseInt(semester);
    
    const matchingStudents = await Student.find(studentQuery).select('_id').lean();
    pipeline[0].$match.student = { $in: matchingStudents.map(s => s._id) };
  }

  pipeline.push(
    { $unwind: '$periods' },
    {
      $group: {
        _id: null,
        totalSessions: { $addToSet: '$_id' },
        totalClasses: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$periods.status', 'present'] }, 1, 0] }
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$periods.status', 'absent'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        totalSessions: { $size: '$totalSessions' },
        totalClasses: 1,
        presentCount: 1,
        absentCount: 1,
        overallPercentage: {
          $cond: [
            { $gt: ['$totalClasses', 0] },
            { $round: [{ $multiply: [{ $divide: ['$presentCount', '$totalClasses'] }, 100] }, 0] },
            0
          ]
        }
      }
    }
  );

  const result = await Attendance.aggregate(pipeline);

  const stats = result[0] || {
    totalSessions: 0,
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    overallPercentage: 0
  };

  res.status(200).json({
    success: true,
    data: {
      ...stats,
      filters: {
        branch: branch || 'All',
        semester: semester || 'All',
        startDate: startDate || 'Not specified',
        endDate: endDate || 'Not specified',
      },
    },
  });
});

// @desc    Delete attendance record - OPTIMIZED
// @route   DELETE /api/attendance/:id
// @access  Private (Admin)
export const deleteAttendance = asyncHandler(async (req, res) => {
  const result = await Attendance.findByIdAndDelete(req.params.id);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Attendance record not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Attendance record deleted successfully',
    data: {},
  });
});

// @desc    Update attendance record - OPTIMIZED
// @route   PUT /api/attendance/:id
// @access  Private (Admin/Teacher)
export const updateAttendance = asyncHandler(async (req, res) => {
  const { periods } = req.body;

  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { periods },
    { new: true, runValidators: true }
  )
    .populate('student', 'rollNumber email')
    .populate('subject', 'subjectCode subjectName')
    .populate('teacher', 'name')
    .lean();

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'Attendance record not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Attendance record updated successfully',
    data: attendance,
  });
});

// @desc    Get low attendance students - HIGHLY OPTIMIZED
// @route   GET /api/attendance/low-attendance
// @access  Private (Admin)
export const getLowAttendanceStudents = asyncHandler(async (req, res) => {
  const { threshold = 75, branch, semester } = req.query;

  let studentQuery = { isActive: true };
  if (branch) studentQuery.branch = branch.toUpperCase();
  if (semester) studentQuery.semester = parseInt(semester);

  const students = await Student.find(studentQuery).select('rollNumber email branch semester').lean();

  let subjectQuery = { isActive: true };
  if (branch) subjectQuery.branch = branch.toUpperCase();
  if (semester) subjectQuery.semester = parseInt(semester);

  const subjects = await Subject.find(subjectQuery).select('subjectCode subjectName').lean();

  // Bulk fetch all attendance data in one query
  const studentIds = students.map(s => s._id);
  const subjectIds = subjects.map(s => s._id);

  const attendanceData = await Attendance.aggregate([
    {
      $match: {
        student: { $in: studentIds },
        subject: { $in: subjectIds }
      }
    },
    { $unwind: '$periods' },
    {
      $group: {
        _id: {
          student: '$student',
          subject: '$subject'
        },
        totalClasses: { $sum: 1 },
        attendedClasses: {
          $sum: { $cond: [{ $eq: ['$periods.status', 'present'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        student: '$_id.student',
        subject: '$_id.subject',
        totalClasses: 1,
        attendedClasses: 1,
        percentage: {
          $cond: [
            { $gt: ['$totalClasses', 0] },
            { $round: [{ $multiply: [{ $divide: ['$attendedClasses', '$totalClasses'] }, 100] }, 2] },
            0
          ]
        }
      }
    },
    {
      $match: {
        percentage: { $lt: parseInt(threshold) },
        totalClasses: { $gt: 0 }
      }
    }
  ]);

  // Create lookup maps
  const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));
  const studentMap = new Map(students.map(s => [s._id.toString(), s]));

  // Group by student
  const studentAttendanceMap = new Map();

  attendanceData.forEach(record => {
    const studentId = record.student.toString();
    const subjectId = record.subject.toString();

    if (!studentAttendanceMap.has(studentId)) {
      studentAttendanceMap.set(studentId, []);
    }

    const subject = subjectMap.get(subjectId);
    if (subject) {
      studentAttendanceMap.get(studentId).push({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        percentage: record.percentage,
        totalClasses: record.totalClasses,
        attendedClasses: record.attendedClasses,
      });
    }
  });

  // Build response
  const lowAttendanceStudents = [];
  studentAttendanceMap.forEach((subjects, studentId) => {
    const student = studentMap.get(studentId);
    if (student && subjects.length > 0) {
      lowAttendanceStudents.push({
        student: {
          _id: student._id,
          rollNumber: student.rollNumber,
          email: student.email,
          branch: student.branch,
          semester: student.semester,
        },
        subjects
      });
    }
  });

  res.status(200).json({
    success: true,
    count: lowAttendanceStudents.length,
    threshold: parseInt(threshold),
    data: lowAttendanceStudents,
  });
});

// @desc    Get attendance summary by branch and semester - HIGHLY OPTIMIZED
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

  const [students, subjects] = await Promise.all([
    Student.find({
      branch: branch.toUpperCase(),
      semester: parseInt(semester),
      isActive: true,
    }).select('_id').lean(),
    Subject.find({
      branch: branch.toUpperCase(),
      semester: parseInt(semester),
      isActive: true,
    }).select('subjectCode subjectName').lean()
  ]);

  const studentIds = students.map(s => s._id);
  const subjectIds = subjects.map(s => s._id);

  // Single aggregation to get all subject-wise attendance
  const attendanceData = await Attendance.aggregate([
    {
      $match: {
        student: { $in: studentIds },
        subject: { $in: subjectIds }
      }
    },
    { $unwind: '$periods' },
    {
      $group: {
        _id: '$subject',
        totalClasses: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$periods.status', 'present'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        subject: '$_id',
        totalClasses: 1,
        presentCount: 1,
        percentage: {
          $cond: [
            { $gt: ['$totalClasses', 0] },
            { $round: [{ $multiply: [{ $divide: ['$presentCount', '$totalClasses'] }, 100] }, 0] },
            0
          ]
        }
      }
    }
  ]);

  // Create lookup map
  const attendanceMap = new Map(
    attendanceData.map(a => [a.subject.toString(), a])
  );

  const subjectWise = subjects.map(subject => {
    const data = attendanceMap.get(subject._id.toString()) || {
      totalClasses: 0,
      presentCount: 0,
      percentage: 0
    };

    return {
      subject: {
        _id: subject._id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
      },
      totalClasses: data.totalClasses,
      presentCount: data.presentCount,
      percentage: data.percentage,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      branch: branch.toUpperCase(),
      semester: parseInt(semester),
      totalStudents: students.length,
      totalSubjects: subjects.length,
      subjectWise,
    },
  });
});

// @desc    Get all attendance records - OPTIMIZED & FIXED
// @route   GET /api/attendance/records
// @access  Private (Admin)
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

  // Add branch/semester filter
  if (branch || semester) {
    const subjectQuery = { isActive: true };
    if (branch) subjectQuery.branch = branch.toUpperCase();
    if (semester) subjectQuery.semester = parseInt(semester);
    
    const matchingSubjects = await Subject.find(subjectQuery).select('_id').lean();
    query.subject = { $in: matchingSubjects.map(s => s._id) };
  }

  const skip = (page - 1) * limit;

  const [attendance, total] = await Promise.all([
    Attendance.find(query)
      .populate('student', 'rollNumber email branch semester')
      .populate('subject', 'subjectCode subjectName branch semester')
      .populate('teacher', 'name email')
      .sort({ markedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    Attendance.countDocuments(query)
  ]);

  // Group by session and get total enrolled students
  const groupedSessions = {};
  const subjectStudentMap = new Map();

  attendance.forEach((record) => {
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
        markedStudents: 0,
        students: [],
      };
      
      // Track subject ID for counting
      if (!subjectStudentMap.has(record.subject._id.toString())) {
        subjectStudentMap.set(record.subject._id.toString(), {
          subjectId: record.subject._id,
          branch: record.subject.branch,
          semester: record.subject.semester
        });
      }
    }

    groupedSessions[sessionKey].markedStudents++;

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

  // Get total enrolled students per subject (based on branch/semester)
  const subjectStudentCounts = new Map();
  for (const [subjectIdStr, { subjectId, branch, semester }] of subjectStudentMap) {
    // Get total students enrolled in this branch/semester
    // This represents all students who SHOULD be taking this subject
    const totalInBranchSem = await Student.countDocuments({
      branch,
      semester,
      isActive: true
    });
    subjectStudentCounts.set(subjectIdStr, totalInBranchSem);
  }

  // Assign total students to each session based on subject enrollment
  const sessions = Object.values(groupedSessions);
  sessions.forEach(session => {
    const subjectIdStr = session.subject._id.toString();
    session.totalStudents = subjectStudentCounts.get(subjectIdStr) || session.markedStudents;
  });

  res.status(200).json({
    success: true,
    count: sessions.length,
    totalRecords: total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    data: sessions,
  });
});

// @desc    Export attendance records to CSV format - OPTIMIZED
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

  // Add branch/semester filter
  if (branch || semester) {
    const studentQuery = { isActive: true };
    if (branch) studentQuery.branch = branch.toUpperCase();
    if (semester) studentQuery.semester = parseInt(semester);
    
    const matchingStudents = await Student.find(studentQuery).select('_id').lean();
    query.student = { $in: matchingStudents.map(s => s._id) };
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'rollNumber email branch semester')
    .populate('subject', 'subjectCode subjectName branch semester')
    .populate('teacher', 'name email')
    .sort({ date: -1, subject: 1 })
    .lean();

  // Generate CSV
  const csvRows = [];
  
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

  attendance.forEach((record) => {
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

// @desc    Export attendance summary to CSV - HIGHLY OPTIMIZED
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

  const [students, subjects] = await Promise.all([
    Student.find({
      branch: branch.toUpperCase(),
      semester: parseInt(semester),
      isActive: true,
    }).select('rollNumber email').sort({ rollNumber: 1 }).lean(),
    Subject.find({
      branch: branch.toUpperCase(),
      semester: parseInt(semester),
      isActive: true,
    }).select('subjectCode subjectName').lean()
  ]);

  const studentIds = students.map(s => s._id);
  const subjectIds = subjects.map(s => s._id);

  // Fetch all attendance data in one query
  const attendanceData = await Attendance.aggregate([
    {
      $match: {
        student: { $in: studentIds },
        subject: { $in: subjectIds }
      }
    },
    { $unwind: '$periods' },
    {
      $group: {
        _id: {
          student: '$student',
          subject: '$subject'
        },
        totalClasses: { $sum: 1 },
        attendedClasses: {
          $sum: { $cond: [{ $eq: ['$periods.status', 'present'] }, 1, 0] }
        }
      }
    }
  ]);

  // Create lookup map for quick access
  const attendanceMap = new Map();
  attendanceData.forEach(record => {
    const key = `${record._id.student}-${record._id.subject}`;
    attendanceMap.set(key, {
      totalClasses: record.totalClasses,
      attendedClasses: record.attendedClasses,
      percentage: record.totalClasses > 0 
        ? Math.round((record.attendedClasses / record.totalClasses) * 100) 
        : 0
    });
  });

  // Generate CSV
  const csvRows = [];
  
  const header = ['Roll Number', 'Email'];
  subjects.forEach(subject => {
    header.push(`${subject.subjectCode} (%)`, `${subject.subjectCode} (Classes)`);
  });
  header.push('Overall %');
  csvRows.push(header.join(','));

  students.forEach(student => {
    const row = [student.rollNumber, student.email];
    
    let totalClasses = 0;
    let totalAttended = 0;

    subjects.forEach(subject => {
      const key = `${student._id}-${subject._id}`;
      const data = attendanceMap.get(key) || {
        totalClasses: 0,
        attendedClasses: 0,
        percentage: 0
      };

      row.push(
        data.percentage,
        `${data.attendedClasses}/${data.totalClasses}`
      );

      totalClasses += data.totalClasses;
      totalAttended += data.attendedClasses;
    });

    const overallPercentage = totalClasses > 0 
      ? Math.round((totalAttended / totalClasses) * 100) 
      : 0;
    
    row.push(overallPercentage);
    csvRows.push(row.join(','));
  });

  const csv = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendance-summary-${branch}-sem${semester}-${Date.now()}.csv`);
  res.status(200).send(csv);
});