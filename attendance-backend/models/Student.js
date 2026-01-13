import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@gvpce\.ac\.in$/, 'Please use a valid GVPCE email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
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
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    },
    academicYear: {
      type: String,
      default: '2024-25',
    },
    role: {
      type: String,
      default: 'student',
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationSettings: {
      notifications: {
        type: Boolean,
        default: true,
      },
      emailAlerts: {
        type: Boolean,
        default: false,
      },
      darkMode: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate email from roll number
studentSchema.pre('validate', function (next) {
  if (this.rollNumber && !this.email) {
    this.email = `${this.rollNumber.toLowerCase()}@gvpce.ac.in`;
  }
  next();
});

// Auto-calculate year from semester
studentSchema.pre('save', function (next) {
  if (this.semester) {
    if (this.semester <= 2) this.year = '1st Year';
    else if (this.semester <= 4) this.year = '2nd Year';
    else if (this.semester <= 6) this.year = '3rd Year';
    else this.year = '4th Year';
  }
  next();
});

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get overall attendance percentage
studentSchema.methods.getOverallAttendance = async function () {
  const Attendance = mongoose.model('Attendance');
  
  const attendanceRecords = await Attendance.find({ student: this._id });
  
  if (attendanceRecords.length === 0) return 0;
  
  let totalClasses = 0;
  let attendedClasses = 0;
  
  attendanceRecords.forEach(record => {
    totalClasses += record.periods.length;
    attendedClasses += record.periods.filter(p => p.status === 'present').length;
  });
  
  return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
};

const Student = mongoose.model('Student', studentSchema);

export default Student;