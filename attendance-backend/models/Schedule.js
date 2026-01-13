import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      enum: ['CSE', 'CSD', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    days: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true,
      },
    ],
    period: {
      type: String,
      required: [true, 'Period is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
scheduleSchema.index({ teacher: 1, days: 1 });
scheduleSchema.index({ subject: 1 });
scheduleSchema.index({ branch: 1, semester: 1 });

// Method to check if schedule is active for today
scheduleSchema.methods.isActiveToday = function () {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  return this.days.includes(today);
};

// Method to check if schedule is currently ongoing
scheduleSchema.methods.isCurrentlyActive = function () {
  if (!this.isActiveToday()) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  const scheduleStart = startHour * 60 + startMin;
  const scheduleEnd = endHour * 60 + endMin;
  
  return currentTime >= scheduleStart && currentTime <= scheduleEnd;
};

// Static method to get teacher's schedule for a specific day
scheduleSchema.statics.getTeacherScheduleByDay = async function (teacherId, day) {
  return await this.find({
    teacher: teacherId,
    days: day,
    isActive: true,
  })
    .populate('subject')
    .sort({ startTime: 1 });
};

// Static method to get teacher's weekly schedule
scheduleSchema.statics.getTeacherWeeklySchedule = async function (teacherId) {
  const schedules = await this.find({
    teacher: teacherId,
    isActive: true,
  })
    .populate('subject')
    .sort({ startTime: 1 });
  
  const weeklySchedule = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };
  
  schedules.forEach(schedule => {
    schedule.days.forEach(day => {
      weeklySchedule[day].push(schedule);
    });
  });
  
  return weeklySchedule;
};

// Static method to get all schedules for a branch and semester
scheduleSchema.statics.getClassSchedule = async function (branch, semester) {
  return await this.find({
    branch,
    semester,
    isActive: true,
  })
    .populate('teacher', 'name email')
    .populate('subject')
    .sort({ startTime: 1 });
};

// Method to get total students for this schedule
scheduleSchema.methods.getTotalStudents = async function () {
  const Student = mongoose.model('Student');
  
  const count = await Student.countDocuments({
    branch: this.branch,
    semester: this.semester,
    isActive: true,
  });
  
  return count;
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;