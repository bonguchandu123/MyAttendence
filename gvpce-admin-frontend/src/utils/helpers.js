export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (time) => {
  if (!time) return '';
  return time;
};

export const getYearFromSemester = (semester) => {
  if (semester <= 2) return '1st Year';
  if (semester <= 4) return '2nd Year';
  if (semester <= 6) return '3rd Year';
  return '4th Year';
};

export const getBranchFullName = (branch) => {
  const branches = {
    CSE: 'Computer Science & Engineering',
    CSD: 'Computer Science & Engineering (Data Science)',
    IT: 'Information Technology',
    ECE: 'Electronics & Communication Engineering',
    EEE: 'Electrical & Electronics Engineering',
    MECH: 'Mechanical Engineering',
    CIVIL: 'Civil Engineering',
    'BS&H': 'Basic Sciences & Humanities',
    MBA: 'Master of Business Administration',
  };
  return branches[branch] || branch;
};

export const getDepartmentFullName = (dept) => {
  return getBranchFullName(dept);
};

export const getAttendanceStatus = (percentage) => {
  if (percentage >= 90) return { label: 'excellent', color: 'text-success-600 bg-success-50' };
  if (percentage >= 75) return { label: 'good', color: 'text-accent-600 bg-accent-50' };
  if (percentage >= 60) return { label: 'warning', color: 'text-warning-600 bg-warning-50' };
  return { label: 'critical', color: 'text-error-600 bg-error-50' };
};

export const calculatePercentage = (attended, total) => {
  if (!total || total === 0) return 0;
  return Math.round((attended / total) * 100);
};

export const getDayFromDate = (date) => {
  if (!date) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(date);
  return days[d.getDay()];
};

export const getRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return formatDate(date);
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateRollNumber = (rollNumber) => {
  const regex = /^\d{12}$/;
  return regex.test(rollNumber);
};

export const validatePhone = (phone) => {
  const regex = /^[+]?[\d\s-]{10,15}$/;
  return regex.test(phone);
};

export const generateEmail = (rollNumber) => {
  return `${rollNumber}@gvpce.ac.in`;
};

export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const downloadCSV = (data, filename) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((header) => row[header]).join(','));
  return [headers.join(','), ...rows].join('\n');
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const BRANCHES = [
  { value: 'CSE', label: 'CSE - Computer Science & Engineering' },
  { value: 'CSD', label: 'CSD - Computer Science (Data Science)' },
  { value: 'IT', label: 'IT - Information Technology' },
  { value: 'ECE', label: 'ECE - Electronics & Communication' },
  { value: 'EEE', label: 'EEE - Electrical & Electronics' },
  { value: 'MECH', label: 'MECH - Mechanical Engineering' },
  { value: 'CIVIL', label: 'CIVIL - Civil Engineering' },
];

export const DEPARTMENTS = [
  ...BRANCHES,
  { value: 'BS&H', label: 'BS&H - Basic Sciences & Humanities' },
  { value: 'MBA', label: 'MBA - Business Administration' },
];

export const SEMESTERS = [
  { value: 1, label: 'Semester 1' },
  { value: 2, label: 'Semester 2' },
  { value: 3, label: 'Semester 3' },
  { value: 4, label: 'Semester 4' },
  { value: 5, label: 'Semester 5' },
  { value: 6, label: 'Semester 6' },
  { value: 7, label: 'Semester 7' },
  { value: 8, label: 'Semester 8' },
];

export const SUBJECT_TYPES = [
  { value: 'Theory', label: 'Theory' },
  { value: 'Lab', label: 'Lab' },
  { value: 'Practical', label: 'Practical' },
  { value: 'Elective', label: 'Elective' },
];

export const DAYS = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
];

export const PERIODS = [
  { value: '1', label: 'Period 1 (08:40 - 09:30)' },
  { value: '2', label: 'Period 2 (09:30 - 10:20)' },
  { value: '3', label: 'Period 3 (11:00 - 11:50)' },
  { value: '4', label: 'Period 4 (11:50 - 12:40)' },
  { value: '5', label: 'Period 5 (01:30 - 02:20)' },
  { value: '6', label: 'Period 6 (02:20 - 03:10)' },
  { value: '7', label: 'Period 7 (03:10 - 04:00)' },
  { value: '8', label: 'Period 8 (04:00 - 04:50)' },
];