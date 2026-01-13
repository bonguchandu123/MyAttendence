import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Schedule from '../models/Schedule.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// ==================== STUDENT MANAGEMENT ====================

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
export const getAllStudents = asyncHandler(async (req, res) => {
  const { branch, semester, search, page = 1, limit = 50 } = req.query;

  let query = { isActive: true };

  if (branch) query.branch = branch.toUpperCase();
  if (semester) query.semester = parseInt(semester);
  if (search) {
    query.$or = [
      { rollNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const students = await Student.find(query)
    .select('-password')
    .sort({ rollNumber: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Student.countDocuments(query);

  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: students,
  });
});

// @desc    Get single student
// @route   GET /api/admin/students/:id
// @access  Private (Admin)
export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).select('-password');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Get overall attendance
  const overallAttendance = await student.getOverallAttendance();

  res.status(200).json({
    success: true,
    data: {
      ...student.toObject(),
      overallAttendance,
    },
  });
});

// @desc    Create new student
// @route   POST /api/admin/students
// @access  Private (Admin)
export const createStudent = asyncHandler(async (req, res) => {
  const { rollNumber, branch, semester, password } = req.body;

  // Validation
  if (!rollNumber || !branch || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide rollNumber, branch, and semester',
    });
  }

  // Check if student already exists
  const existingStudent = await Student.findOne({
    rollNumber: rollNumber.toUpperCase(),
  });

  if (existingStudent) {
    return res.status(400).json({
      success: false,
      message: `Student with roll number ${rollNumber} already exists`,
    });
  }

  // Auto-generate email
  const email = `${rollNumber.toLowerCase()}@gvpce.ac.in`;

  // Create student
  const student = await Student.create({
    rollNumber: rollNumber.toUpperCase(),
    email,
    password: password || rollNumber, // Default password is roll number
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
  });

  // Remove password from response
  student.password = undefined;

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: student,
  });
});

// @desc    Bulk create students
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

  const created = [];
  const errors = [];

  for (const studentData of students) {
    try {
      const { rollNumber, branch, semester, password } = studentData;

      // Check if student already exists
      const existingStudent = await Student.findOne({
        rollNumber: rollNumber.toUpperCase(),
      });

      if (existingStudent) {
        errors.push({
          rollNumber,
          error: 'Student already exists',
        });
        continue;
      }

      // Auto-generate email
      const email = `${rollNumber.toLowerCase()}@gvpce.ac.in`;

      const student = await Student.create({
        rollNumber: rollNumber.toUpperCase(),
        email,
        password: password || rollNumber,
        branch: branch.toUpperCase(),
        semester: parseInt(semester),
      });

      created.push({
        rollNumber: student.rollNumber,
        email: student.email,
        branch: student.branch,
        semester: student.semester,
      });
    } catch (error) {
      errors.push({
        rollNumber: studentData.rollNumber,
        error: error.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `${created.length} students created successfully`,
    data: {
      created: created.length,
      errors: errors.length,
      students: created,
      errorDetails: errors,
    },
  });
});

// @desc    Update student
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
export const updateStudent = asyncHandler(async (req, res) => {
  let student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  const { rollNumber, branch, semester } = req.body;

  // If updating roll number, check if new roll number exists
  if (rollNumber && rollNumber !== student.rollNumber) {
    const existingStudent = await Student.findOne({
      rollNumber: rollNumber.toUpperCase(),
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student with roll number ${rollNumber} already exists`,
      });
    }

    // Update email if roll number changes
    student.email = `${rollNumber.toLowerCase()}@gvpce.ac.in`;
  }

  student.rollNumber = rollNumber
    ? rollNumber.toUpperCase()
    : student.rollNumber;
  student.branch = branch ? branch.toUpperCase() : student.branch;
  student.semester = semester ? parseInt(semester) : student.semester;

  await student.save();

  student.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Student updated successfully',
    data: student,
  });
});

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Soft delete
  student.isActive = false;
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Student deleted successfully',
    data: {},
  });
});

// @desc    Bulk update semester (promotion)
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

// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Private (Admin)
export const getAllTeachers = asyncHandler(async (req, res) => {
  const { department, isApproved, search } = req.query;

  let query = { isActive: true };

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
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});

// @desc    Get pending teacher approvals
// @route   GET /api/admin/teachers/pending
// @access  Private (Admin)
export const getPendingTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find({
    isApproved: false,
    isActive: true,
  })
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});

// @desc    Approve teacher
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

// @desc    Reject teacher
// @route   PUT /api/admin/teachers/:id/reject
// @access  Private (Admin)
export const rejectTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  // Soft delete (reject)
  teacher.isActive = false;
  await teacher.save();

  res.status(200).json({
    success: true,
    message: 'Teacher rejected successfully',
    data: {},
  });
});

// @desc    Update teacher
// @route   PUT /api/admin/teachers/:id
// @access  Private (Admin)
export const updateTeacher = asyncHandler(async (req, res) => {
  let teacher = await Teacher.findById(req.params.id);

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

// @desc    Delete teacher (deactivate)
// @route   DELETE /api/admin/teachers/:id
// @access  Private (Admin)
export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  // Soft delete
  teacher.isActive = false;
  await teacher.save();

  res.status(200).json({
    success: true,
    message: 'Teacher deleted successfully',
    data: {},
  });
});

// @desc    Assign subject to teacher
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
  const subjectExists = await Subject.findById(subject);
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

  // Add assignment
  teacher.assignments.push({
    subject,
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
  });

  await teacher.save();

  const populatedTeacher = await Teacher.findById(teacher._id)
    .select('-password')
    .populate('assignments.subject', 'subjectCode subjectName');

  res.status(200).json({
    success: true,
    message: 'Assignment added successfully',
    data: populatedTeacher,
  });
});

// @desc    Remove assignment from teacher
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

  // Remove assignment
  teacher.assignments = teacher.assignments.filter(
    (assignment) => assignment._id.toString() !== assignmentId
  );

  await teacher.save();

  const populatedTeacher = await Teacher.findById(teacher._id)
    .select('-password')
    .populate('assignments.subject', 'subjectCode subjectName');

  res.status(200).json({
    success: true,
    message: 'Assignment removed successfully',
    data: populatedTeacher,
  });
});

// ==================== DASHBOARD STATS ====================

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Count active students
  const totalStudents = await Student.countDocuments({ isActive: true });

  // Count new students (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newStudents = await Student.countDocuments({
    isActive: true,
    createdAt: { $gte: sevenDaysAgo },
  });

  // Count active teachers
  const totalTeachers = await Teacher.countDocuments({
    isActive: true,
    isApproved: true,
  });

  // Count new teachers (last 7 days)
  const newTeachers = await Teacher.countDocuments({
    isActive: true,
    isApproved: true,
    createdAt: { $gte: sevenDaysAgo },
  });

  // Count total subjects
  const totalSubjects = await Subject.countDocuments({ isActive: true });

  // Count new subjects (last 7 days)
  const newSubjects = await Subject.countDocuments({
    isActive: true,
    createdAt: { $gte: sevenDaysAgo },
  });

  // Count pending teacher approvals
  const pendingApprovals = await Teacher.countDocuments({
    isApproved: false,
    isActive: true,
  });

  // Get today's attendance stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAttendance = await Attendance.find({
    date: { $gte: today, $lt: tomorrow },
  });

  let todayTotalClasses = 0;
  let todayPresentCount = 0;

  todayAttendance.forEach((record) => {
    record.periods.forEach((period) => {
      todayTotalClasses++;
      if (period.status === 'present') {
        todayPresentCount++;
      }
    });
  });

  const todayAttendancePercentage =
    todayTotalClasses > 0
      ? Math.round((todayPresentCount / todayTotalClasses) * 100)
      : 0;

  // Get overall attendance
  const allAttendance = await Attendance.find({});

  let overallTotalClasses = 0;
  let overallPresentCount = 0;

  allAttendance.forEach((record) => {
    record.periods.forEach((period) => {
      overallTotalClasses++;
      if (period.status === 'present') {
        overallPresentCount++;
      }
    });
  });

  const overallAttendancePercentage =
    overallTotalClasses > 0
      ? Math.round((overallPresentCount / overallTotalClasses) * 100)
      : 0;

  // Count active sessions today
  const activeSessions = await Schedule.countDocuments({
    isActive: true,
    days: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ][new Date().getDay()],
  });

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

// @desc    Get recent activity
// @route   GET /api/admin/dashboard/activity
// @access  Private (Admin)
export const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const activities = [];

  // Recent attendance marked
  const recentAttendance = await Attendance.find({})
    .sort({ markedAt: -1 })
    .limit(3)
    .populate('teacher', 'name')
    .populate('subject', 'subjectName')
    .populate('student', 'branch semester');

  recentAttendance.forEach((att) => {
    if (att.teacher && att.subject && att.student) {
      activities.push({
        type: 'attendance',
        message: `${att.teacher.name} marked attendance for ${att.student.branch}-${att.student.semester}-${att.subject.subjectName}`,
        time: att.markedAt,
      });
    }
  });

  // Recent students added
  const recentStudents = await Student.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(3);

  recentStudents.forEach((student) => {
    activities.push({
      type: 'student',
      message: `${student.rollNumber} added to ${student.branch} - Sem ${student.semester}`,
      time: student.createdAt,
    });
  });

  // Recent teachers registered
  const recentTeachers = await Teacher.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(3);

  recentTeachers.forEach((teacher) => {
    activities.push({
      type: 'teacher',
      message: `Teacher "${teacher.name}" registered`,
      time: teacher.createdAt,
    });
  });

  // Sort by time and limit
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  const limitedActivities = activities.slice(0, limit);

  res.status(200).json({
    success: true,
    count: limitedActivities.length,
    data: limitedActivities,
  });
});