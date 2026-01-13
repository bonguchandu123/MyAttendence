import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
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
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      enum: ['CSE', 'CSD', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BS&H', 'MBA'],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: 'teacher',
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignments: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        branch: {
          type: String,
          required: true,
        },
        semester: {
          type: Number,
          required: true,
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
teacherSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get teacher's classes for today
teacherSchema.methods.getTodayClasses = async function () {
  const Schedule = mongoose.model('Schedule');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  
  const todaySchedules = await Schedule.find({
    teacher: this._id,
    days: today,
  })
    .populate('subject')
    .sort({ startTime: 1 });
  
  return todaySchedules;
};

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;