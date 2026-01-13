import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
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
    credits: {
      type: Number,
      default: 4,
      min: 1,
      max: 14,
    },
    type: {
      type: String,
      enum: ['Theory', 'Lab', 'Practical', 'Elective', 'Project'],
      default: 'Theory',
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

// Compound unique index - same subject code can exist in different branches
subjectSchema.index({ subjectCode: 1, branch: 1 }, { unique: true });

// Index for faster queries
subjectSchema.index({ branch: 1, semester: 1 });

// Method to get all students enrolled in this subject
subjectSchema.methods.getEnrolledStudents = async function () {
  const Student = mongoose.model('Student');
  
  const students = await Student.find({
    branch: this.branch,
    semester: this.semester,
    isActive: true,
  }).select('-password');
  
  return students;
};

// Method to get subject attendance statistics
subjectSchema.methods.getAttendanceStats = async function () {
  const Attendance = mongoose.model('Attendance');
  
  const attendanceRecords = await Attendance.find({
    subject: this._id,
  });
  
  if (attendanceRecords.length === 0) {
    return {
      totalSessions: 0,
      totalClasses: 0,
      averageAttendance: 0,
    };
  }
  
  let totalClasses = 0;
  let presentCount = 0;
  
  attendanceRecords.forEach(record => {
    totalClasses += record.periods.length;
    presentCount += record.periods.filter(p => p.status === 'present').length;
  });
  
  const uniqueSessions = [...new Set(attendanceRecords.map(r => r.date.toDateString()))].length;
  
  return {
    totalSessions: uniqueSessions,
    totalClasses,
    averageAttendance: totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0,
  };
};

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;