import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// @desc    Get all subjects (with optional filters)
// @route   GET /api/subjects
// @access  Private (Admin)
export const getAllSubjects = asyncHandler(async (req, res) => {
  const { branch, semester } = req.query;

  let query = { isActive: true };

  if (branch) query.branch = branch;
  if (semester) query.semester = parseInt(semester);

  const subjects = await Subject.find(query).sort({ subjectCode: 1 });

  res.status(200).json({
    success: true,
    count: subjects.length,
    data: subjects,
  });
});

// @desc    Get subjects by branch and semester
// @route   GET /api/subjects/branch/:branch/semester/:semester
// @access  Private (Admin)
export const getSubjectsByBranchSemester = asyncHandler(async (req, res) => {
  const { branch, semester } = req.params;

  const subjects = await Subject.find({
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    isActive: true,
  }).sort({ subjectCode: 1 });

  res.status(200).json({
    success: true,
    count: subjects.length,
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    data: subjects,
  });
});

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Private (Admin)
export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  // Get enrolled students count
  const enrolledStudents = await subject.getEnrolledStudents();

  res.status(200).json({
    success: true,
    data: {
      ...subject.toObject(),
      enrolledStudentsCount: enrolledStudents.length,
    },
  });
});

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (Admin)
export const createSubject = asyncHandler(async (req, res) => {
  const { subjectCode, subjectName, branch, semester, credits, type } = req.body;

  // Validation
  if (!subjectCode || !subjectName || !branch || !semester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Check if subject code already exists in this branch
  const existingSubject = await Subject.findOne({
    subjectCode: subjectCode.toUpperCase(),
    branch: branch.toUpperCase(),
  });

  if (existingSubject) {
    return res.status(400).json({
      success: false,
      message: `Subject with code ${subjectCode} already exists in ${branch} branch`,
    });
  }

  const subject = await Subject.create({
    subjectCode: subjectCode.toUpperCase(),
    subjectName,
    branch: branch.toUpperCase(),
    semester: parseInt(semester),
    credits: credits || 4,
    type: type || 'Theory',
  });

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: subject,
  });
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin)
export const updateSubject = asyncHandler(async (req, res) => {
  let subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  const { subjectCode, subjectName, branch, semester, credits, type } = req.body;

  // If updating subject code or branch, check if new combination already exists
  const newCode = subjectCode ? subjectCode.toUpperCase() : subject.subjectCode;
  const newBranch = branch ? branch.toUpperCase() : subject.branch;

  if (newCode !== subject.subjectCode || newBranch !== subject.branch) {
    const existingSubject = await Subject.findOne({
      subjectCode: newCode,
      branch: newBranch,
      _id: { $ne: req.params.id }, // Exclude current subject
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: `Subject with code ${newCode} already exists in ${newBranch} branch`,
      });
    }
  }

  subject = await Subject.findByIdAndUpdate(
    req.params.id,
    {
      subjectCode: newCode,
      subjectName: subjectName || subject.subjectName,
      branch: newBranch,
      semester: semester ? parseInt(semester) : subject.semester,
      credits: credits !== undefined ? credits : subject.credits,
      type: type || subject.type,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: 'Subject updated successfully',
    data: subject,
  });
});

// @desc    Delete subject (soft delete)
// @route   DELETE /api/subjects/:id
// @access  Private (Admin)
export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  // Soft delete
  subject.isActive = false;
  await subject.save();

  res.status(200).json({
    success: true,
    message: 'Subject deleted successfully',
    data: {},
  });
});

// @desc    Get enrolled students for a subject
// @route   GET /api/subjects/:id/students
// @access  Private (Admin/Teacher)
export const getEnrolledStudents = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  const students = await subject.getEnrolledStudents();

  res.status(200).json({
    success: true,
    count: students.length,
    subject: {
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      branch: subject.branch,
      semester: subject.semester,
    },
    data: students,
  });
});

// @desc    Get subject attendance statistics
// @route   GET /api/subjects/:id/stats
// @access  Private (Admin/Teacher)
export const getSubjectStats = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  const stats = await subject.getAttendanceStats();
  const enrolledStudents = await subject.getEnrolledStudents();

  res.status(200).json({
    success: true,
    data: {
      subject: {
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        branch: subject.branch,
        semester: subject.semester,
      },
      enrolledStudents: enrolledStudents.length,
      ...stats,
    },
  });
});

// @desc    Bulk create subjects (CSV import)
// @route   POST /api/subjects/bulk
// @access  Private (Admin)
export const bulkCreateSubjects = asyncHandler(async (req, res) => {
  const { subjects } = req.body;

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of subjects',
    });
  }

  const created = [];
  const errors = [];

  for (const subjectData of subjects) {
    try {
      // Check if subject code already exists in this branch
      const existingSubject = await Subject.findOne({
        subjectCode: subjectData.subjectCode.toUpperCase(),
        branch: subjectData.branch.toUpperCase(),
      });

      if (existingSubject) {
        errors.push({
          subjectCode: subjectData.subjectCode,
          branch: subjectData.branch,
          error: `Subject code already exists in ${subjectData.branch} branch`,
        });
        continue;
      }

      const subject = await Subject.create({
        subjectCode: subjectData.subjectCode.toUpperCase(),
        subjectName: subjectData.subjectName,
        branch: subjectData.branch.toUpperCase(),
        semester: parseInt(subjectData.semester),
        credits: subjectData.credits || 4,
        type: subjectData.type || 'Theory',
      });

      created.push(subject);
    } catch (error) {
      errors.push({
        subjectCode: subjectData.subjectCode,
        branch: subjectData.branch,
        error: error.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `${created.length} subjects created successfully`,
    data: {
      created: created.length,
      errors: errors.length,
      subjects: created,
      errorDetails: errors,
    },
  });
});

// @desc    Copy subjects from one semester to another
// @route   POST /api/subjects/copy
// @access  Private (Admin)
export const copySubjects = asyncHandler(async (req, res) => {
  const { fromBranch, fromSemester, toBranch, toSemester } = req.body;

  if (!fromBranch || !fromSemester || !toBranch || !toSemester) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Get subjects from source
  const sourceSubjects = await Subject.find({
    branch: fromBranch.toUpperCase(),
    semester: parseInt(fromSemester),
    isActive: true,
  });

  if (sourceSubjects.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No subjects found in source branch/semester',
    });
  }

  const created = [];
  const errors = [];

  for (const sourceSubject of sourceSubjects) {
    try {
      // Create new subject code by replacing semester
      const newSubjectCode = sourceSubject.subjectCode.replace(
        fromSemester.toString(),
        toSemester.toString()
      );

      // Check if already exists in target branch
      const existingSubject = await Subject.findOne({
        subjectCode: newSubjectCode,
        branch: toBranch.toUpperCase(),
      });

      if (existingSubject) {
        errors.push({
          subjectCode: newSubjectCode,
          branch: toBranch,
          error: `Subject code already exists in ${toBranch} branch`,
        });
        continue;
      }

      const newSubject = await Subject.create({
        subjectCode: newSubjectCode,
        subjectName: sourceSubject.subjectName,
        branch: toBranch.toUpperCase(),
        semester: parseInt(toSemester),
        credits: sourceSubject.credits,
        type: sourceSubject.type,
      });

      created.push(newSubject);
    } catch (error) {
      errors.push({
        subjectCode: sourceSubject.subjectCode,
        error: error.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `${created.length} subjects copied successfully`,
    data: {
      created: created.length,
      errors: errors.length,
      subjects: created,
      errorDetails: errors,
    },
  });
});