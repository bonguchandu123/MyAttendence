import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Schedule from '../models/Schedule.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// ==================== STUDENT MANAGEMENT ====================

// @desc    Get all students (OPTIMIZED)
// @route   GET /api/admin/students
// @access  Private (Admin)
export const getAllStudents = asyncHandler(async (req, res) => {
  const { branch, semester, search, page = 1, limit = 50 } = req.query;

  const query = { isActive: true };

  if (branch) query.branch = branch.toUpperCase();
  if (semester) query.semester = parseInt(semester);
  if (search) {
    query.$or = [
      { rollNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [students, count] = await Promise.all([
    Student.find(query)
      .select('rollNumber email branch semester createdAt')
      .sort({ rollNumber: 1 })
      .limit(Number(limit))
      .skip(skip)
      .lean(),
    Student.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: students,
  });
});

// @desc    Get single student (OPTIMIZED)
// @route   GET /api/admin/students/:id
// @access  Private (Admin)
export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).select('-password').lean();

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Optimized attendance calculation using aggregation
  const attendanceData = await Attendance.aggregate([
    { $match: { student: req.params.id } },
    { $unwind: '$periods' },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$periods.status', 'present'] }, 1, 0] }
        }
      }
    }
  ]);

  const overallAttendance = attendanceData[0]
    ? Math.round((attendanceData[0].present / attendanceData[0].total) * 100)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      ...student,
      overallAttendance,
    },
  });
});

// @desc    Create new student (OPTIMIZED)
// @route   POST /api/admin/students
// @access  Private (Admin)
export const createStudent = asyncHandler(async (req, res) => {
  const { rollNumber, branch, semester, password } = req.body;

  if (!rollNumber || !branch || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide rollNumber, branch, and semester',
    });
  }

  const existingStudent = await Student.findOne({
    rollNumber: rollNumber.toUpperCase(),
  }).select('_id').lean();

  if (existingStudent) {
    return res.status(400).json({
      success: false,
      message: `Student with roll number ${rollNumber} already exists`,
    });
  }

  const email = `${rollNumber.toLowerCase()}@gvpce.ac.in`;

  const student = await Student.create({
    rollNumber: rollNumber.toUpperCase(),
    email,
    password: password || rollNumber,
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
  });

  student.password = undefined;

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: student,
  });
});

// @desc    Bulk create students (HIGHLY OPTIMIZED)
// @route   POST /api/admin/students/bulk
// @access  Private (Admin)
export const bulkCreateStudents = asyncHandler(async (req, res) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of students',
    });
  }

  const rollNumbers = students.map(s => s.rollNumber.toUpperCase());

  // Bulk check for existing students
  const existing = await Student.find({
    rollNumber: { $in: rollNumbers },
  }).select('rollNumber').lean();

  const existingSet = new Set(existing.map(s => s.rollNumber));

  const toInsert = [];
  const errors = [];

  for (const studentData of students) {
    const rn = studentData.rollNumber.toUpperCase();
    
    if (existingSet.has(rn)) {
      errors.push({
        rollNumber: rn,
        error: 'Student already exists',
      });
      continue;
    }

    const email = `${rn.toLowerCase()}@gvpce.ac.in`;

    toInsert.push({
      rollNumber: rn,
      email,
      password: studentData.password || rn,
      branch: studentData.branch.toUpperCase(),
      semester: parseInt(studentData.semester),
    });
  }

  // Bulk insert with unordered for better performance
  const created = toInsert.length
    ? await Student.insertMany(toInsert, { ordered: false })
    : [];

  res.status(201).json({
    success: true,
    message: `${created.length} students created successfully`,
    data: {
      created: created.length,
      errors: errors.length,
      students: created.map(s => ({
        rollNumber: s.rollNumber,
        email: s.email,
        branch: s.branch,
        semester: s.semester,
      })),
      errorDetails: errors,
    },
  });
});

// @desc    Update student (OPTIMIZED)
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  const { rollNumber, branch, semester } = req.body;

  if (rollNumber && rollNumber !== student.rollNumber) {
    const existingStudent = await Student.findOne({
      rollNumber: rollNumber.toUpperCase(),
    }).select('_id').lean();

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student with roll number ${rollNumber} already exists`,
      });
    }

    student.rollNumber = rollNumber.toUpperCase();
    student.email = `${rollNumber.toLowerCase()}@gvpce.ac.in`;
  }

  if (branch) student.branch = branch.toUpperCase();
  if (semester) student.semester = parseInt(semester);

  await student.save();
  student.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Student updated successfully',
    data: student,
  });
});

// @desc    Delete student (OPTIMIZED)
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: false, select: '_id' }
  );

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Student deleted successfully',
    data: {},
  });
});

// @desc    Bulk update semester (promotion) (OPTIMIZED)
// @route   PUT /api/admin/students/bulk/promote
// @access  Private (Admin)
export const bulkPromoteStudents = asyncHandler(async (req, res) => {
  const { branch, currentSemester, newSemester } = req.body;

  if (!branch || !currentSemester || !newSemester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide branch, currentSemester, and newSemester',
    });
  }

  const result = await Student.updateMany(
    {
      branch: branch.toUpperCase(),
      semester: parseInt(currentSemester),
      isActive: true,
    },
    {
      $set: { semester: parseInt(newSemester) },
    }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} students promoted successfully`,
    data: {
      branch: branch.toUpperCase(),
      from: parseInt(currentSemester),
      to: parseInt(newSemester),
      count: result.modifiedCount,
    },
  });
});

// ==================== TEACHER MANAGEMENT ====================

// @desc    Get all teachers (OPTIMIZED)
// @route   GET /api/admin/teachers
// @access  Private (Admin)
export const getAllTeachers = asyncHandler(async (req, res) => {
  const { department, isApproved, search } = req.query;

  const query = { isActive: true };

  if (department) query.department = department.toUpperCase();
  if (isApproved !== undefined) query.isApproved = isApproved === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const teachers = await Teacher.find(query)
    .select('-password')
    .populate('assignments.subject', 'subjectCode subjectName')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});

// @desc    Get pending teacher approvals (OPTIMIZED)
// @route   GET /api/admin/teachers/pending
// @access  Private (Admin)
export const getPendingTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find({
    isApproved: false,
    isActive: true,
  })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});

// @desc    Approve teacher (OPTIMIZED)
// @route   PUT /api/admin/teachers/:id/approve
// @access  Private (Admin)
export const approveTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  if (teacher.isApproved) {
    return res.status(400).json({
      success: false,
      message: 'Teacher is already approved',
    });
  }

  teacher.isApproved = true;
  await teacher.save();
  teacher.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Teacher approved successfully',
    data: teacher,
  });
});

// @desc    Reject teacher (OPTIMIZED)
// @route   PUT /api/admin/teachers/:id/reject
// @access  Private (Admin)
export const rejectTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: false, select: '_id' }
  );

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Teacher rejected successfully',
    data: {},
  });
});

// @desc    Update teacher (OPTIMIZED)
// @route   PUT /api/admin/teachers/:id
// @access  Private (Admin)
export const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  const { name, email, phone, department } = req.body;

  if (name) teacher.name = name;
  if (email) teacher.email = email;
  if (phone) teacher.phone = phone;
  if (department) teacher.department = department.toUpperCase();

  await teacher.save();
  teacher.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Teacher updated successfully',
    data: teacher,
  });
});

// @desc    Delete teacher (deactivate) (OPTIMIZED)
// @route   DELETE /api/admin/teachers/:id
// @access  Private (Admin)
export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: false, select: '_id' }
  );

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Teacher deleted successfully',
    data: {},
  });
});

// @desc    Assign subject to teacher (OPTIMIZED)
// @route   POST /api/admin/teachers/:id/assignments
// @access  Private (Admin)
export const assignSubjectToTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  const { subject, branch, semester } = req.body;

  if (!subject || !branch || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide subject, branch, and semester',
    });
  }

  // Check if subject exists
  const subjectExists = await Subject.findById(subject).select('_id').lean();
  if (!subjectExists) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  // Check if assignment already exists
  const hasAssignment = teacher.assignments.some(
    (assignment) =>
      assignment.subject.toString() === subject.toString() &&
      assignment.branch === branch.toUpperCase() &&
      assignment.semester === parseInt(semester)
  );

  if (hasAssignment) {
    return res.status(400).json({
      success: false,
      message: 'This assignment already exists for the teacher',
    });
  }

  teacher.assignments.push({
    subject,
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
  });

  await teacher.save();

  const populatedTeacher = await Teacher.findById(teacher._id)
    .select('-password')
    .populate('assignments.subject', 'subjectCode subjectName')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Assignment added successfully',
    data: populatedTeacher,
  });
});

// @desc    Remove assignment from teacher (OPTIMIZED)
// @route   DELETE /api/admin/teachers/:teacherId/assignments/:assignmentId
// @access  Private (Admin)
export const removeAssignmentFromTeacher = asyncHandler(async (req, res) => {
  const { teacherId, assignmentId } = req.params;

  const teacher = await Teacher.findById(teacherId);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  teacher.assignments = teacher.assignments.filter(
    (assignment) => assignment._id.toString() !== assignmentId
  );

  await teacher.save();

  const populatedTeacher = await Teacher.findById(teacher._id)
    .select('-password')
    .populate('assignments.subject', 'subjectCode subjectName')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Assignment removed successfully',
    data: populatedTeacher,
  });
});

// ==================== SUBJECT MANAGEMENT ====================

// @desc    Get all subjects (OPTIMIZED)
// @route   GET /api/admin/subjects
// @access  Private (Admin)
export const getAllSubjects = asyncHandler(async (req, res) => {
  const { branch, semester, search } = req.query;

  const query = { isActive: true };
  if (branch) query.branch = branch.toUpperCase();
  if (semester) query.semester = parseInt(semester);
  if (search) {
    query.$or = [
      { subjectCode: { $regex: search, $options: 'i' } },
      { subjectName: { $regex: search, $options: 'i' } },
    ];
  }

  const subjects = await Subject.find(query)
    .populate('teacher', 'name email')
    .sort({ branch: 1, semester: 1, subjectCode: 1 })
    .lean();

  res.status(200).json({
    success: true,
    count: subjects.length,
    data: subjects,
  });
});

// @desc    Get single subject (OPTIMIZED)
// @route   GET /api/admin/subjects/:id
// @access  Private (Admin)
export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('teacher', 'name email department')
    .lean();

  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  res.status(200).json({
    success: true,
    data: subject,
  });
});

// @desc    Create new subject (OPTIMIZED)
// @route   POST /api/admin/subjects
// @access  Private (Admin)
export const createSubject = asyncHandler(async (req, res) => {
  const { subjectCode, subjectName, branch, semester, teacher } = req.body;

  if (!subjectCode || !subjectName || !branch || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  const exists = await Subject.findOne({
    subjectCode: subjectCode.toUpperCase(),
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
  }).select('_id').lean();

  if (exists) {
    return res.status(400).json({
      success: false,
      message: 'Subject already exists for this branch and semester',
    });
  }

  const subject = await Subject.create({
    subjectCode: subjectCode.toUpperCase(),
    subjectName,
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    teacher: teacher || null,
  });

  const populatedSubject = await Subject.findById(subject._id)
    .populate('teacher', 'name email')
    .lean();

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: populatedSubject,
  });
});

// @desc    Update subject (OPTIMIZED)
// @route   PUT /api/admin/subjects/:id
// @access  Private (Admin)
export const updateSubject = asyncHandler(async (req, res) => {
  const { subjectCode, subjectName, branch, semester, teacher } = req.body;

  const updateData = {};
  if (subjectCode) updateData.subjectCode = subjectCode.toUpperCase();
  if (subjectName) updateData.subjectName = subjectName;
  if (branch) updateData.branch = branch.toUpperCase();
  if (semester) updateData.semester = parseInt(semester);
  if (teacher !== undefined) updateData.teacher = teacher;

  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('teacher', 'name email');

  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Subject updated successfully',
    data: subject,
  });
});

// @desc    Delete subject (OPTIMIZED)
// @route   DELETE /api/admin/subjects/:id
// @access  Private (Admin)
export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: false, select: '_id' }
  );

  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Subject deleted successfully',
    data: {},
  });
});

// ==================== DASHBOARD STATS ====================

// @desc    Get admin dashboard statistics (HIGHLY OPTIMIZED)
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
export const getDashboardStats = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

  const [
    studentStats,
    teacherStats,
    subjectStats,
    pendingApprovals,
    todayAttendanceStats,
    overallAttendanceStats,
    activeSessions,
  ] = await Promise.all([
    // Student stats
    Student.aggregate([
      { $match: { isActive: true } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          new: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $count: 'count' }
          ]
        }
      }
    ]),

    // Teacher stats
    Teacher.aggregate([
      { $match: { isActive: true, isApproved: true } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          new: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $count: 'count' }
          ]
        }
      }
    ]),

    // Subject stats
    Subject.aggregate([
      { $match: { isActive: true } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          new: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $count: 'count' }
          ]
        }
      }
    ]),

    // Pending approvals
    Teacher.countDocuments({ isApproved: false, isActive: true }),

    // Today's attendance
    Attendance.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $unwind: '$periods' },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$periods.status', 'present'] }, 1, 0] }
          }
        }
      }
    ]),

    // Overall attendance
    Attendance.aggregate([
      { $unwind: '$periods' },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$periods.status', 'present'] }, 1, 0] }
          }
        }
      }
    ]),

    // Active sessions
    Schedule.countDocuments({ isActive: true, days: currentDay }),
  ]);

  const totalStudents = studentStats[0]?.total[0]?.count || 0;
  const newStudents = studentStats[0]?.new[0]?.count || 0;

  const totalTeachers = teacherStats[0]?.total[0]?.count || 0;
  const newTeachers = teacherStats[0]?.new[0]?.count || 0;

  const totalSubjects = subjectStats[0]?.total[0]?.count || 0;
  const newSubjects = subjectStats[0]?.new[0]?.count || 0;

  const todayTotalClasses = todayAttendanceStats[0]?.total || 0;
  const todayPresentCount = todayAttendanceStats[0]?.present || 0;
  const todayAttendancePercentage = todayTotalClasses > 0
    ? Math.round((todayPresentCount / todayTotalClasses) * 100)
    : 0;

  const overallTotalClasses = overallAttendanceStats[0]?.total || 0;
  const overallPresentCount = overallAttendanceStats[0]?.present || 0;
  const overallAttendancePercentage = overallTotalClasses > 0
    ? Math.round((overallPresentCount / overallTotalClasses) * 100)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      students: {
        total: totalStudents,
        new: newStudents,
      },
      teachers: {
        total: totalTeachers,
        new: newTeachers,
      },
      subjects: {
        total: totalSubjects,
        new: newSubjects,
      },
      pendingApprovals,
      attendance: {
        overall: overallAttendancePercentage,
        today: todayAttendancePercentage,
      },
      activeSessions,
      today: new Date().toISOString().split('T')[0],
    },
  });
});

// @desc    Get recent activity (OPTIMIZED)
// @route   GET /api/admin/dashboard/activity
// @access  Private (Admin)
export const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const [recentAttendance, recentStudents, recentTeachers] = await Promise.all([
    Attendance.find({})
      .sort({ markedAt: -1 })
      .limit(3)
      .populate('teacher', 'name')
      .populate('subject', 'subjectName')
      .populate('student', 'branch semester')
      .lean(),

    Student.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('rollNumber branch semester createdAt')
      .lean(),

    Teacher.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name createdAt')
      .lean(),
  ]);

  const activities = [];

  recentAttendance.forEach((att) => {
    if (att.teacher && att.subject && att.student) {
      activities.push({
        type: 'attendance',
        message: `${att.teacher.name} marked attendance for ${att.student.branch}-${att.student.semester}-${att.subject.subjectName}`,
        time: att.markedAt,
      });
    }
  });

  recentStudents.forEach((student) => {
    activities.push({
      type: 'student',
      message: `${student.rollNumber} added to ${student.branch} - Sem ${student.semester}`,
      time: student.createdAt,
    });
  });

  recentTeachers.forEach((teacher) => {
    activities.push({
      type: 'teacher',
      message: `Teacher "${teacher.name}" registered`,
      time: teacher.createdAt,
    });
  });

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  const limitedActivities = activities.slice(0, limit);

  res.status(200).json({
    success: true,
    count: limitedActivities.length,
    data: limitedActivities,
  });
});