import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // optional (for logged-in users)
    },

    userRole: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: false,
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },

    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },

    category: {
      type: String,
      enum: ['technical', 'attendance', 'account', 'feedback', 'other'],
      required: true,
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
