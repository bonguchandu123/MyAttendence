import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    periods: [
      {
        periodNumber: {
          type: Number,
          required: true,
        },
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent'],
          required: true,
        },
      },
    ],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
attendanceSchema.index({ student: 1, subject: 1, date: 1 });
attendanceSchema.index({ subject: 1, date: 1 });
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ date: 1, markedAt: -1 });
attendanceSchema.index({ subject: 1, teacher: 1, date: 1 });
attendanceSchema.index({ student: 1, subject: 1 });


// Auto-populate day from date
attendanceSchema.pre('save', function (next) {
  if (this.date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.day = days[new Date(this.date).getDay()];
  }
  next();
});

// Static method to get attendance by student and subject
attendanceSchema.statics.getStudentSubjectAttendance = async function (studentId, subjectId) {
  const records = await this.find({
    student: studentId,
    subject: subjectId,
  }).sort({ date: -1 });
  
  if (records.length === 0) {
    return {
      totalClasses: 0,
      attendedClasses: 0,
      percentage: 0,
      records: [],
    };
  }
  
  let totalClasses = 0;
  let attendedClasses = 0;
  
  records.forEach(record => {
    totalClasses += record.periods.length;
    attendedClasses += record.periods.filter(p => p.status === 'present').length;
  });
  
  return {
    totalClasses,
    attendedClasses,
    percentage: totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0,
    records,
  };
};

// Static method to get monthly breakdown
attendanceSchema.statics.getMonthlyBreakdown = async function (studentId, subjectId) {
  const records = await this.find({
    student: studentId,
    subject: subjectId,
  }).sort({ date: -1 });
  
  const monthlyData = {};
  
  records.forEach(record => {
    const monthYear = new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        totalClasses: 0,
        attendedClasses: 0,
      };
    }
    
    monthlyData[monthYear].totalClasses += record.periods.length;
    monthlyData[monthYear].attendedClasses += record.periods.filter(p => p.status === 'present').length;
  });
  
  return Object.keys(monthlyData).map(month => ({
    month,
    totalClasses: monthlyData[month].totalClasses,
    attendedClasses: monthlyData[month].attendedClasses,
    percentage: Math.round((monthlyData[month].attendedClasses / monthlyData[month].totalClasses) * 100),
  }));
};

// Static method to get attendance for a specific date
attendanceSchema.statics.getAttendanceByDate = async function (subjectId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await this.find({
    subject: subjectId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).populate('student', 'rollNumber email branch semester');
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;