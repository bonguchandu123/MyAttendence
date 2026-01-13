import Schedule from '../models/Schedule.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Private (Admin)
export const getAllSchedules = asyncHandler(async (req, res) => {
  const { teacher, branch, semester, day } = req.query;

  let query = { isActive: true };

  if (teacher) query.teacher = teacher;
  if (branch) query.branch = branch.toUpperCase();
  if (semester) query.semester = parseInt(semester);
  if (day) query.days = day;

  const schedules = await Schedule.find(query)
    .populate('teacher', 'name email department')
    .populate('subject', 'subjectCode subjectName')
    .sort({ startTime: 1 });

  // Add student count to each schedule
  const schedulesWithCount = await Promise.all(
    schedules.map(async (schedule) => {
      const studentCount = await Student.countDocuments({
        branch: schedule.branch,
        semester: schedule.semester,
        isActive: true,
      });

      return {
        ...schedule.toObject(),
        studentCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: schedulesWithCount.length,
    data: schedulesWithCount,
  });
});

// @desc    Get schedule by ID
// @route   GET /api/schedules/:id
// @access  Private (Admin/Teacher)
export const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id)
    .populate('teacher', 'name email department')
    .populate('subject', 'subjectCode subjectName credits type');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found',
    });
  }

  const studentCount = await schedule.getTotalStudents();

  res.status(200).json({
    success: true,
    data: {
      ...schedule.toObject(),
      studentCount,
    },
  });
});

// @desc    Create new schedule
// @route   POST /api/schedules
// @access  Private (Admin)
export const createSchedule = asyncHandler(async (req, res) => {
  const { teacher, subject, branch, semester, days, period, startTime, endTime } =
    req.body;

  // Validation
  if (
    !teacher ||
    !subject ||
    !branch ||
    !semester ||
    !days ||
    !period ||
    !startTime ||
    !endTime
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Check if teacher exists
  const teacherExists = await Teacher.findById(teacher);
  if (!teacherExists) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
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

  // Check if teacher already has assignment for this subject
  const hasAssignment = teacherExists.assignments.some(
    (assignment) => assignment.subject.toString() === subject.toString()
  );

  if (!hasAssignment) {
    // Add assignment to teacher
    teacherExists.assignments.push({
      subject,
      branch: branch.toUpperCase(),
      semester: parseInt(semester),
    });
    await teacherExists.save();
  }

  // Create schedule
  const schedule = await Schedule.create({
    teacher,
    subject,
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    days: Array.isArray(days) ? days : [days],
    period,
    startTime,
    endTime,
  });

  const populatedSchedule = await Schedule.findById(schedule._id)
    .populate('teacher', 'name email')
    .populate('subject', 'subjectCode subjectName');

  res.status(201).json({
    success: true,
    message: 'Schedule created successfully',
    data: populatedSchedule,
  });
});

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Private (Admin)
export const updateSchedule = asyncHandler(async (req, res) => {
  let schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found',
    });
  }

  const { teacher, subject, branch, semester, days, period, startTime, endTime } =
    req.body;

  // If teacher is being changed, verify new teacher exists
  if (teacher && teacher !== schedule.teacher.toString()) {
    const teacherExists = await Teacher.findById(teacher);
    if (!teacherExists) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }
  }

  // If subject is being changed, verify new subject exists
  if (subject && subject !== schedule.subject.toString()) {
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }
  }

  schedule = await Schedule.findByIdAndUpdate(
    req.params.id,
    {
      teacher: teacher || schedule.teacher,
      subject: subject || schedule.subject,
      branch: branch ? branch.toUpperCase() : schedule.branch,
      semester: semester ? parseInt(semester) : schedule.semester,
      days: days || schedule.days,
      period: period || schedule.period,
      startTime: startTime || schedule.startTime,
      endTime: endTime || schedule.endTime,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate('teacher', 'name email')
    .populate('subject', 'subjectCode subjectName');

  res.status(200).json({
    success: true,
    message: 'Schedule updated successfully',
    data: schedule,
  });
});

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Private (Admin)
export const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found',
    });
  }

  // Soft delete
  schedule.isActive = false;
  await schedule.save();

  res.status(200).json({
    success: true,
    message: 'Schedule deleted successfully',
    data: {},
  });
});

// @desc    Get schedules by teacher
// @route   GET /api/schedules/teacher/:teacherId
// @access  Private (Admin/Teacher)
export const getSchedulesByTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const { day } = req.query;

  // Check if teacher exists
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  let query = { teacher: teacherId, isActive: true };
  if (day) query.days = day;

  const schedules = await Schedule.find(query)
    .populate('subject', 'subjectCode subjectName')
    .sort({ startTime: 1 });

  // Add student count to each schedule
  const schedulesWithCount = await Promise.all(
    schedules.map(async (schedule) => {
      const studentCount = await schedule.getTotalStudents();
      return {
        ...schedule.toObject(),
        studentCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: schedulesWithCount.length,
    teacher: {
      name: teacher.name,
      email: teacher.email,
    },
    data: schedulesWithCount,
  });
});

// @desc    Get schedules by branch and semester
// @route   GET /api/schedules/class/:branch/:semester
// @access  Private (Admin)
export const getSchedulesByClass = asyncHandler(async (req, res) => {
  const { branch, semester } = req.params;

  const schedules = await Schedule.getClassSchedule(
    branch.toUpperCase(),
    parseInt(semester)
  );

  // Add student count
  const studentCount = await Student.countDocuments({
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    isActive: true,
  });

  res.status(200).json({
    success: true,
    count: schedules.length,
    class: {
      branch: branch.toUpperCase(),
      semester: parseInt(semester),
      studentCount,
    },
    data: schedules,
  });
});

// @desc    Get weekly schedule for a teacher
// @route   GET /api/schedules/teacher/:teacherId/weekly
// @access  Private (Admin/Teacher)
export const getTeacherWeeklySchedule = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  // Check if teacher exists
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  const weeklySchedule = await Schedule.getTeacherWeeklySchedule(teacherId);

  // Add student count to each schedule
  const formattedSchedule = {};

  for (const [day, schedules] of Object.entries(weeklySchedule)) {
    formattedSchedule[day] = await Promise.all(
      schedules.map(async (schedule) => {
        const studentCount = await schedule.getTotalStudents();
        return {
          ...schedule.toObject(),
          studentCount,
        };
      })
    );
  }

  res.status(200).json({
    success: true,
    teacher: {
      name: teacher.name,
      email: teacher.email,
    },
    data: formattedSchedule,
  });
});

// @desc    Get today's active schedules
// @route   GET /api/schedules/today
// @access  Private (Admin)
export const getTodaySchedules = asyncHandler(async (req, res) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];

  const schedules = await Schedule.find({
    days: today,
    isActive: true,
  })
    .populate('teacher', 'name email')
    .populate('subject', 'subjectCode subjectName')
    .sort({ startTime: 1 });

  // Add status and student count
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const schedulesWithStatus = await Promise.all(
    schedules.map(async (schedule) => {
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);

      const scheduleStart = startHour * 60 + startMin;
      const scheduleEnd = endHour * 60 + endMin;

      let status = 'upcoming';
      if (currentTime >= scheduleStart && currentTime <= scheduleEnd) {
        status = 'active';
      } else if (currentTime > scheduleEnd) {
        status = 'completed';
      }

      const studentCount = await schedule.getTotalStudents();

      return {
        ...schedule.toObject(),
        status,
        studentCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: schedulesWithStatus.length,
    today,
    data: schedulesWithStatus,
  });
});

// @desc    Check schedule conflicts
// @route   POST /api/schedules/check-conflict
// @access  Private (Admin)
export const checkScheduleConflict = asyncHandler(async (req, res) => {
  const { teacher, days, startTime, endTime, excludeScheduleId } = req.body;

  if (!teacher || !days || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide teacher, days, startTime, and endTime',
    });
  }

  // Convert time to minutes for comparison
  const [newStartHour, newStartMin] = startTime.split(':').map(Number);
  const [newEndHour, newEndMin] = endTime.split(':').map(Number);
  const newStart = newStartHour * 60 + newStartMin;
  const newEnd = newEndHour * 60 + newEndMin;

  let query = {
    teacher,
    isActive: true,
    days: { $in: Array.isArray(days) ? days : [days] },
  };

  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  const existingSchedules = await Schedule.find(query).populate(
    'subject',
    'subjectName'
  );

  const conflicts = [];

  existingSchedules.forEach((schedule) => {
    const [existingStartHour, existingStartMin] = schedule.startTime
      .split(':')
      .map(Number);
    const [existingEndHour, existingEndMin] = schedule.endTime.split(':').map(Number);
    const existingStart = existingStartHour * 60 + existingStartMin;
    const existingEnd = existingEndHour * 60 + existingEndMin;

    // Check for time overlap
    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      conflicts.push({
        scheduleId: schedule._id,
        subject: schedule.subject.subjectName,
        days: schedule.days,
        time: `${schedule.startTime} - ${schedule.endTime}`,
      });
    }
  });

  res.status(200).json({
    success: true,
    hasConflict: conflicts.length > 0,
    conflicts,
  });
});