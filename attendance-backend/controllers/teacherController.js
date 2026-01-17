import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Schedule from '../models/Schedule.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

import moment from 'moment-timezone';

export const getDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const teacher = req.user;

  // Get today's classes
  const todayClasses = await teacher.getTodayClasses();

  // Get current time in IST (India Standard Time)
  const now = moment().tz('Asia/Kolkata');
  const currentTime = now.hours() * 60 + now.minutes();
  
  console.log('Current IST Time:', now.format('YYYY-MM-DD HH:mm:ss'));
  console.log('Current Time in Minutes:', currentTime);

  const formattedClasses = await Promise.all(
    todayClasses.map(async (schedule) => {
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);

      const scheduleStart = startHour * 60 + startMin;
      const scheduleEnd = endHour * 60 + endMin;

      console.log(`Class: ${schedule.subject.subjectName}`);
      console.log(`  Start: ${scheduleStart} mins (${schedule.startTime})`);
      console.log(`  End: ${scheduleEnd} mins (${schedule.endTime})`);
      console.log(`  Current: ${currentTime} mins`);

      let status = 'upcoming';
      if (currentTime >= scheduleStart && currentTime <= scheduleEnd) {
        status = 'active';
      } else if (currentTime > scheduleEnd) {
        status = 'completed';
      }

      console.log(`  Status: ${status}`);

      // Get student count
      const studentCount = await Student.countDocuments({
        branch: schedule.branch,
        semester: schedule.semester,
        isActive: true,
      });

      return {
        _id: schedule._id,
        subject: {
          _id: schedule.subject._id,
          subjectCode: schedule.subject.subjectCode,
          subjectName: schedule.subject.subjectName,
        },
        branch: schedule.branch,
        semester: schedule.semester,
        period: schedule.period,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        studentCount,
        status,
      };
    })
  );

  // Get tomorrow's classes count
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const tomorrow = days[(now.day() + 1) % 7];

  const tomorrowClasses = await Schedule.find({
    teacher: teacherId,
    days: tomorrow,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    data: {
      teacher: {
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
      },
      todayClasses: formattedClasses,
      tomorrowClassesCount: tomorrowClasses.length,
    },
  });
});

// @desc    Get all assigned classes
// @route   GET /api/teacher/classes
// @access  Private (Teacher)
export const getAllClasses = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  // Get all schedules for this teacher
  const schedules = await Schedule.find({
    teacher: teacherId,
    isActive: true,
  }).populate('subject');

  // Get unique assignments
  const assignmentsMap = new Map();

  for (const schedule of schedules) {
    const key = `${schedule.subject._id}-${schedule.branch}-${schedule.semester}`;

    if (!assignmentsMap.has(key)) {
      const studentCount = await Student.countDocuments({
        branch: schedule.branch,
        semester: schedule.semester,
        isActive: true,
      });

      assignmentsMap.set(key, {
        _id: schedule._id,
        subject: {
          _id: schedule.subject._id,
          subjectCode: schedule.subject.subjectCode,
          subjectName: schedule.subject.subjectName,
        },
        branch: schedule.branch,
        semester: schedule.semester,
        days: schedule.days,
        period: schedule.period,
        time: `${schedule.startTime} - ${schedule.endTime}`,
        studentCount,
      });
    } else {
      // Merge days if same subject-branch-semester
      const existing = assignmentsMap.get(key);
      const mergedDays = [...new Set([...existing.days, ...schedule.days])];
      assignmentsMap.get(key).days = mergedDays;
    }
  }

  const assignments = Array.from(assignmentsMap.values());

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

// @desc    Get weekly schedule
// @route   GET /api/teacher/schedule/weekly
// @access  Private (Teacher)
export const getWeeklySchedule = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  const weeklySchedule = await Schedule.getTeacherWeeklySchedule(teacherId);

  // Format the schedule
  const formattedSchedule = {};

  for (const [day, schedules] of Object.entries(weeklySchedule)) {
    formattedSchedule[day] = await Promise.all(
      schedules.map(async (schedule) => {
        const studentCount = await Student.countDocuments({
          branch: schedule.branch,
          semester: schedule.semester,
          isActive: true,
        });

        return {
          _id: schedule._id,
          time: schedule.startTime,
          subject: `${schedule.subject.subjectName} - ${schedule.branch} Sem ${schedule.semester}`,
          subjectCode: schedule.subject.subjectCode,
          period: schedule.period,
          studentCount,
        };
      })
    );
  }

  res.status(200).json({
    success: true,
    data: formattedSchedule,
  });
});

// @desc    Get students for marking attendance
// @route   GET /api/teacher/attendance/students/:scheduleId
// @access  Private (Teacher)
// export const getStudentsForAttendance = asyncHandler(async (req, res) => {
//   const { scheduleId } = req.params;
//   const { date } = req.query;

//   // Get schedule
//   const schedule = await Schedule.findById(scheduleId).populate('subject');

//   if (!schedule) {
//     return res.status(404).json({
//       success: false,
//       message: 'Schedule not found',
//     });
//   }

//   // Get all students for this branch and semester
//   const students = await Student.find({
//     branch: schedule.branch,
//     semester: schedule.semester,
//     isActive: true,
//   })
//     .select('rollNumber email')
//     .sort({ rollNumber: 1 });

//   // If date is provided, check if attendance already marked
//   let existingAttendance = [];
//   if (date) {
//     const attendanceDate = new Date(date);
//     const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

//     existingAttendance = await Attendance.find({
//       subject: schedule.subject._id,
//       date: {
//         $gte: startOfDay,
//         $lte: endOfDay,
//       },
//     });
//   }

//   // Map existing attendance to students
//   const studentsWithStatus = students.map((student) => {
//     const attendance = existingAttendance.find(
//       (att) => att.student.toString() === student._id.toString()
//     );

//     // Determine status based on attendance
//     let markedStatus = null;
//     if (attendance && attendance.periods.length > 0) {
//       const presentCount = attendance.periods.filter((p) => p.status === 'present').length;
//       const absentCount = attendance.periods.filter((p) => p.status === 'absent').length;
      
//       // If all periods are present, mark as "present"
//       // If all periods are absent, mark as "absent"
//       // Otherwise, mark as "present" if at least one period is present
//       if (absentCount === attendance.periods.length) {
//         markedStatus = 'absent';
//       } else if (presentCount > 0) {
//         markedStatus = 'present';
//       }
//     }

//     return {
//       _id: student._id,
//       rollNumber: student.rollNumber,
//       email: student.email,
//       markedStatus: markedStatus,  // ✅ Now returns a string: "present", "absent", or null
//     };
//   });

//   res.status(200).json({
//     success: true,
//     data: {
//       schedule: {
//         _id: schedule._id,
//         subject: {
//           _id: schedule.subject._id,
//           subjectCode: schedule.subject.subjectCode,
//           subjectName: schedule.subject.subjectName,
//         },
//         branch: schedule.branch,
//         semester: schedule.semester,
//         period: schedule.period,
//         startTime: schedule.startTime,
//         endTime: schedule.endTime,
//       },
//       students: studentsWithStatus,
//       totalStudents: students.length,
//     },
//   });
// });

// @desc    Get students for marking attendance
// @route   GET /api/teacher/attendance/students/:scheduleId
// @access  Private (Teacher)
export const getStudentsForAttendance = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const { date, periods } = req.query;

  // Get schedule
  const schedule = await Schedule.findById(scheduleId).populate('subject');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found',
    });
  }

  // Get all students for this branch and semester
  const students = await Student.find({
    branch: schedule.branch,
    semester: schedule.semester,
    isActive: true,
  })
    .select('rollNumber email')
    .sort({ rollNumber: 1 });

  // If date and periods are provided, check if attendance already marked for those specific periods
  let existingAttendance = [];
  let selectedPeriodNumbers = [];
  
  if (date && periods) {
    // Parse periods (comma-separated string like "1,2,3")
    selectedPeriodNumbers = periods.split(',').map(p => parseInt(p.trim()));
    
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

    existingAttendance = await Attendance.find({
      subject: schedule.subject._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  // Map existing attendance to students
  const studentsWithStatus = students.map((student) => {
    const studentAttendance = existingAttendance.find(
      (att) => att.student.toString() === student._id.toString()
    );

    let markedStatus = null;
    
    if (studentAttendance && selectedPeriodNumbers.length > 0) {
      // Check if the student has attendance marked for ANY of the selected periods
      const hasMarkedPeriods = studentAttendance.periods.some(p => 
        selectedPeriodNumbers.includes(p.periodNumber)
      );
      
      if (hasMarkedPeriods) {
        // Get the status for the selected periods
        const selectedPeriodsData = studentAttendance.periods.filter(p => 
          selectedPeriodNumbers.includes(p.periodNumber)
        );
        
        const presentCount = selectedPeriodsData.filter(p => p.status === 'present').length;
        const absentCount = selectedPeriodsData.filter(p => p.status === 'absent').length;
        
        // If all selected periods are present
        if (presentCount === selectedPeriodsData.length) {
          markedStatus = 'present';
        }
        // If all selected periods are absent
        else if (absentCount === selectedPeriodsData.length) {
          markedStatus = 'absent';
        }
        // Mixed status - show as present if at least one period is present
        else if (presentCount > 0) {
          markedStatus = 'present';
        } else {
          markedStatus = 'absent';
        }
      }
    }

    return {
      _id: student._id,
      rollNumber: student.rollNumber,
      email: student.email,
      markedStatus: markedStatus,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      schedule: {
        _id: schedule._id,
        subject: {
          _id: schedule.subject._id,
          subjectCode: schedule.subject.subjectCode,
          subjectName: schedule.subject.subjectName,
        },
        branch: schedule.branch,
        semester: schedule.semester,
        period: schedule.period,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
      students: studentsWithStatus,
      totalStudents: students.length,
    },
  });
});

// @desc    Mark attendance
// @route   POST /api/teacher/attendance/mark
// @access  Private (Teacher)
// export const markAttendance = asyncHandler(async (req, res) => {
//   const teacherId = req.user._id;
//   const { scheduleId, date, periods, attendance } = req.body;

//   // Validation
//   if (!scheduleId || !date || !periods || !attendance) {
//     return res.status(400).json({
//       success: false,
//       message: 'Please provide all required fields',
//     });
//   }

//   // Get schedule
//   const schedule = await Schedule.findById(scheduleId).populate('subject');

//   if (!schedule) {
//     return res.status(404).json({
//       success: false,
//       message: 'Schedule not found',
//     });
//   }

//   // Verify teacher owns this schedule
//   if (schedule.teacher.toString() !== teacherId.toString()) {
//     return res.status(403).json({
//       success: false,
//       message: 'Not authorized to mark attendance for this class',
//     });
//   }

//   const attendanceDate = new Date(date);
//   const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
//   const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

//   // FIXED: Check if attendance already marked for ANY of the students on this date
//   // Get all student IDs from the request
//   const studentIds = attendance.map(a => a.studentId);
  
//   // Check if any of these students already have attendance marked for this date and subject
//   const existingAttendance = await Attendance.find({
//     student: { $in: studentIds },
//     subject: schedule.subject._id,
//     date: {
//       $gte: startOfDay,
//       $lte: endOfDay,
//     },
//   });

//   if (existingAttendance.length > 0) {
//     return res.status(400).json({
//       success: false,
//       message: 'Attendance already marked for this date',
//     });
//   }

//   // Create attendance records
//   const attendanceRecords = [];
//   let presentCount = 0;
//   let absentCount = 0;

//   for (const studentAttendance of attendance) {
//     const { studentId, status } = studentAttendance;

//     const periodsData = periods.map((period) => ({
//       periodNumber: period.periodNumber,
//       startTime: period.startTime,
//       endTime: period.endTime,
//       status,
//     }));

//     if (status === 'present') {
//       presentCount++;
//     } else {
//       absentCount++;
//     }

//     const attendanceRecord = await Attendance.create({
//       student: studentId,
//       subject: schedule.subject._id,
//       teacher: teacherId,
//       date: new Date(date),
//       periods: periodsData,
//       markedBy: teacherId,
//     });

//     attendanceRecords.push(attendanceRecord);
//   }

//   res.status(201).json({
//     success: true,
//     message: 'Attendance marked successfully',
//     data: {
//       subject: {
//         _id: schedule.subject._id,
//         subjectCode: schedule.subject.subjectCode,
//         subjectName: schedule.subject.subjectName,
//       },
//       class: `${schedule.branch} - Sem ${schedule.semester}`,
//       date: new Date(date),
//       periods: periods.map((p) => p.periodNumber),
//       time: `${periods[0].startTime} - ${periods[periods.length - 1].endTime}`,
//       presentCount,
//       absentCount,
//       totalStudents: attendance.length,
//       classAttendance: Math.round((presentCount / attendance.length) * 100),
//     },
//   });
// });
// @desc    Mark attendance
// @route   POST /api/teacher/attendance/mark
// @access  Private (Teacher)
// export const markAttendance = asyncHandler(async (req, res) => {
//   const teacherId = req.user._id;
//   const { scheduleId, date, periods, attendance } = req.body;

//   // Validation
//   if (!scheduleId || !date || !periods || !attendance) {
//     return res.status(400).json({
//       success: false,
//       message: 'Please provide all required fields',
//     });
//   }

//   // Get schedule
//   const schedule = await Schedule.findById(scheduleId).populate('subject');

//   if (!schedule) {
//     return res.status(404).json({
//       success: false,
//       message: 'Schedule not found',
//     });
//   }

//   // Verify teacher owns this schedule
//   if (schedule.teacher.toString() !== teacherId.toString()) {
//     return res.status(403).json({
//       success: false,
//       message: 'Not authorized to mark attendance for this class',
//     });
//   }

//   const attendanceDate = new Date(date);
//   const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
//   const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

//   // Get all student IDs from the request
//   const studentIds = attendance.map(a => a.studentId);
  
//   // Extract period numbers from the request
//   const periodNumbers = periods.map(p => p.periodNumber);
  
//   // FIXED: Check if attendance already marked for these specific periods
//   const existingAttendance = await Attendance.find({
//     student: { $in: studentIds },
//     subject: schedule.subject._id,
//     date: {
//       $gte: startOfDay,
//       $lte: endOfDay,
//     },
//     'periods.periodNumber': { $in: periodNumbers }
//   });

//   if (existingAttendance.length > 0) {
//     // Check if any of the existing records have overlapping periods
//     const hasOverlap = existingAttendance.some(record => 
//       record.periods.some(p => periodNumbers.includes(p.periodNumber))
//     );

//     if (hasOverlap) {
//       return res.status(400).json({
//         success: false,
//         message: `Attendance already marked for period(s) ${periodNumbers.join(', ')} on this date`,
//       });
//     }
//   }

//   // Create attendance records
//   const attendanceRecords = [];
//   let presentCount = 0;
//   let absentCount = 0;

//   for (const studentAttendance of attendance) {
//     const { studentId, status } = studentAttendance;

//     const periodsData = periods.map((period) => ({
//       periodNumber: period.periodNumber,
//       startTime: period.startTime,
//       endTime: period.endTime,
//       status,
//     }));

//     if (status === 'present') {
//       presentCount++;
//     } else {
//       absentCount++;
//     }

//     const attendanceRecord = await Attendance.create({
//       student: studentId,
//       subject: schedule.subject._id,
//       teacher: teacherId,
//       date: new Date(date),
//       periods: periodsData,
//       markedBy: teacherId,
//     });

//     attendanceRecords.push(attendanceRecord);
//   }

//   res.status(201).json({
//     success: true,
//     message: 'Attendance marked successfully',
//     data: {
//       subject: {
//         _id: schedule.subject._id,
//         subjectCode: schedule.subject.subjectCode,
//         subjectName: schedule.subject.subjectName,
//       },
//       class: `${schedule.branch} - Sem ${schedule.semester}`,
//       date: new Date(date),
//       periods: periods.map((p) => p.periodNumber),
//       time: `${periods[0].startTime} - ${periods[periods.length - 1].endTime}`,
//       presentCount,
//       absentCount,
//       totalStudents: attendance.length,
//       classAttendance: Math.round((presentCount / attendance.length) * 100),
//     },
//   });
// });

// @desc    Mark attendance
// @route   POST /api/teacher/attendance/mark
// @access  Private (Teacher)
export const markAttendance = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { scheduleId, date, periods, attendance } = req.body;

  // Validation
  if (!scheduleId || !date || !periods || !attendance) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Get schedule
  const schedule = await Schedule.findById(scheduleId).populate('subject');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found',
    });
  }

  // Verify teacher owns this schedule
  if (schedule.teacher.toString() !== teacherId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to mark attendance for this class',
    });
  }

  const attendanceDate = new Date(date);
  const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

  // Get all student IDs from the request
  const studentIds = attendance.map(a => a.studentId);
  
  // Extract period numbers from the request
  const periodNumbers = periods.map(p => p.periodNumber);
  
  // Check if attendance already marked for these specific periods
  const existingAttendance = await Attendance.find({
    student: { $in: studentIds },
    subject: schedule.subject._id,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    }
  });

  // Check if ANY of the existing records have the exact same periods
  if (existingAttendance.length > 0) {
    const hasExactPeriodMatch = existingAttendance.some(record => {
      const recordPeriods = record.periods.map(p => p.periodNumber);
      // Check if there's ANY overlap between periods being marked and existing periods
      return periodNumbers.some(pNum => recordPeriods.includes(pNum));
    });

    if (hasExactPeriodMatch) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked for one or more of the selected periods on this date`,
      });
    }
  }

  // Create attendance records
  const attendanceRecords = [];
  let presentCount = 0;
  let absentCount = 0;

  for (const studentAttendance of attendance) {
    const { studentId, status } = studentAttendance;

    const periodsData = periods.map((period) => ({
      periodNumber: period.periodNumber,
      startTime: period.startTime,
      endTime: period.endTime,
      status,
    }));

    if (status === 'present') {
      presentCount++;
    } else {
      absentCount++;
    }

    const attendanceRecord = await Attendance.create({
      student: studentId,
      subject: schedule.subject._id,
      teacher: teacherId,
      date: new Date(date),
      periods: periodsData,
      markedBy: teacherId,
    });

    attendanceRecords.push(attendanceRecord);
  }

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    data: {
      subject: {
        _id: schedule.subject._id,
        subjectCode: schedule.subject.subjectCode,
        subjectName: schedule.subject.subjectName,
      },
      class: `${schedule.branch} - Sem ${schedule.semester}`,
      date: new Date(date),
      periods: periods.map((p) => p.periodNumber),
      time: `${periods[0].startTime} - ${periods[periods.length - 1].endTime}`,
      presentCount,
      absentCount,
      totalStudents: attendance.length,
      classAttendance: Math.round((presentCount / attendance.length) * 100),
    },
  });
});
// @desc    Get attendance reports for a subject
// @route   GET /api/teacher/reports/:subjectId
// @access  Private (Teacher)
export const getAttendanceReports = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { branch, semester } = req.query;

  // Get subject
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  // Get all students for this branch and semester
  const students = await Student.find({
    branch: branch || subject.branch,
    semester: semester || subject.semester,
    isActive: true,
  }).sort({ rollNumber: 1 });

  // Get attendance for each student
  const studentReports = await Promise.all(
    students.map(async (student) => {
      const attendanceData = await Attendance.getStudentSubjectAttendance(
        student._id,
        subjectId
      );

      let status = 'good';
      if (attendanceData.percentage >= 90) status = 'excellent';
      else if (attendanceData.percentage < 75) status = 'warning';

      return {
        student: {
          _id: student._id,
          rollNumber: student.rollNumber,
          email: student.email,
        },
        totalClasses: attendanceData.totalClasses,
        attendedClasses: attendanceData.attendedClasses,
        percentage: attendanceData.percentage,
        status,
      };
    })
  );

  // Calculate overall stats
  const totalSessions = studentReports[0]?.totalClasses || 0;
  const totalPossibleAttendance = totalSessions * students.length;
  const totalActualAttendance = studentReports.reduce(
    (sum, report) => sum + report.attendedClasses,
    0
  );

  const overallPercentage =
    totalPossibleAttendance > 0
      ? Math.round((totalActualAttendance / totalPossibleAttendance) * 100)
      : 0;

  res.status(200).json({
    success: true,
    data: {
      subject: {
        _id: subject._id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
      },
      class: `${branch || subject.branch} - Sem ${semester || subject.semester}`,
      overallStats: {
        overallPercentage,
        totalSessions,
        totalStudents: students.length,
        totalPossibleAttendance,
        totalActualAttendance,
      },
      studentReports,
    },
  });
});

// @desc    Get class-wise attendance for a specific date
// @route   GET /api/teacher/attendance/class/:subjectId
// @access  Private (Teacher)
export const getClassAttendanceByDate = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a date',
    });
  }

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  const attendanceRecords = await Attendance.getAttendanceByDate(subjectId, date);

  const presentCount = attendanceRecords.filter((record) =>
    record.periods.some((p) => p.status === 'present')
  ).length;

  const absentCount = attendanceRecords.filter((record) =>
    record.periods.every((p) => p.status === 'absent')
  ).length;

  res.status(200).json({
    success: true,
    data: {
      date,
      subject: {
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
      },
      totalStudents: attendanceRecords.length,
      presentCount,
      absentCount,
      percentage:
        attendanceRecords.length > 0
          ? Math.round((presentCount / attendanceRecords.length) * 100)
          : 0,
      records: attendanceRecords,
    },
  });
});

// Add to teacherController.js

// @desc    Edit/Update attendance for a specific date and schedule
// @route   PUT /api/teacher/attendance/edit
// @access  Private (Teacher)
export const editAttendance = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { scheduleId, date, periods, attendance } = req.body;

  // Validation
  if (!scheduleId || !date || !periods || !attendance) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Get schedule
  const schedule = await Schedule.findById(scheduleId).populate('subject');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found',
    });
  }

  // Verify teacher owns this schedule
  if (schedule.teacher.toString() !== teacherId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to edit attendance for this class',
    });
  }

  const attendanceDate = new Date(date);
  const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

  // Extract period numbers from the request
  const periodNumbers = periods.map(p => p.periodNumber);
  
  // Find existing attendance records for these specific periods
  const studentIds = attendance.map(a => a.studentId);
  
  const existingRecords = await Attendance.find({
    student: { $in: studentIds },
    subject: schedule.subject._id,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    'periods.periodNumber': { $in: periodNumbers }
  });

  if (existingRecords.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No attendance records found to edit',
    });
  }

  // Update each student's attendance
  let presentCount = 0;
  let absentCount = 0;

  for (const studentAttendance of attendance) {
    const { studentId, status } = studentAttendance;

    // Find the student's existing attendance record
    const existingRecord = existingRecords.find(
      record => record.student.toString() === studentId
    );

    if (existingRecord) {
      // Update the periods with matching period numbers
      existingRecord.periods = existingRecord.periods.map(period => {
        if (periodNumbers.includes(period.periodNumber)) {
          return {
            ...period.toObject(),
            status: status,
          };
        }
        return period;
      });

      existingRecord.markedAt = new Date(); // Update timestamp
      existingRecord.markedBy = teacherId;
      
      await existingRecord.save();

      if (status === 'present') {
        presentCount++;
      } else {
        absentCount++;
      }
    }
  }

  res.status(200).json({
    success: true,
    message: 'Attendance updated successfully',
    data: {
      subject: {
        _id: schedule.subject._id,
        subjectCode: schedule.subject.subjectCode,
        subjectName: schedule.subject.subjectName,
      },
      class: `${schedule.branch} - Sem ${schedule.semester}`,
      date: new Date(date),
      periods: periods.map((p) => p.periodNumber),
      time: `${periods[0].startTime} - ${periods[periods.length - 1].endTime}`,
      presentCount,
      absentCount,
      totalStudents: attendance.length,
      classAttendance: Math.round((presentCount / attendance.length) * 100),
    },
  });
});