import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to download file with authentication
const downloadFile = async (url, filename) => {
  const token = getAuthToken();
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

// ==================== AUTH API ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getActivity: (limit = 10) => api.get(`/admin/dashboard/activity?limit=${limit}`),
};

// ==================== STUDENTS API ====================
export const studentsAPI = {
  getAll: (params) => api.get('/admin/students', { params }),
  getById: (id) => api.get(`/admin/students/${id}`),
  create: (data) => api.post('/admin/students', data),
  bulkCreate: (data) => api.post('/admin/students/bulk', data),
  update: (id, data) => api.put(`/admin/students/${id}`, data),
  delete: (id) => api.delete(`/admin/students/${id}`),
  bulkPromote: (data) => api.put('/admin/students/bulk/promote', data),
};

// ==================== TEACHERS API ====================
export const teachersAPI = {
  getAll: (params) => api.get('/admin/teachers', { params }),
  getPending: () => api.get('/admin/teachers/pending'),
  approve: (id) => api.put(`/admin/teachers/${id}/approve`),
  reject: (id) => api.put(`/admin/teachers/${id}/reject`),
  update: (id, data) => api.put(`/admin/teachers/${id}`, data),
  delete: (id) => api.delete(`/admin/teachers/${id}`),
  addAssignment: (id, data) => api.post(`/admin/teachers/${id}/assignments`, data),
  removeAssignment: (teacherId, assignmentId) => 
    api.delete(`/admin/teachers/${teacherId}/assignments/${assignmentId}`),
};

// ==================== SUBJECTS API ====================
export const subjectsAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getByBranchSemester: (branch, semester) => 
    api.get(`/subjects/branch/${branch}/semester/${semester}`),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  bulkCreate: (data) => api.post('/subjects/bulk', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  getStudents: (id) => api.get(`/subjects/${id}/students`),
  getStats: (id) => api.get(`/subjects/${id}/stats`),
  copy: (data) => api.post('/subjects/copy', data),
};

// ==================== SCHEDULES API ====================
export const schedulesAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  getByTeacher: (teacherId, params) => 
    api.get(`/schedules/teacher/${teacherId}`, { params }),
  getWeekly: (teacherId) => api.get(`/schedules/teacher/${teacherId}/weekly`),
  getByClass: (branch, semester) => 
    api.get(`/schedules/class/${branch}/${semester}`),
  getToday: () => api.get('/schedules/today'),
  checkConflict: (data) => api.post('/schedules/check-conflict', data),
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
  // Get attendance records
  getAll: (params) => api.get('/attendance', { params }),
  getRecords: (params) => api.get('/attendance/records', { params }),
  getByStudent: (studentId, params) => 
    api.get(`/attendance/student/${studentId}`, { params }),
  getBySubject: (subjectId, params) => 
    api.get(`/attendance/subject/${subjectId}`, { params }),
  getByDate: (date, params) => 
    api.get(`/attendance/date/${date}`, { params }),
  
  // Get statistics
  getStats: (params) => api.get('/attendance/stats', { params }),
  getLowAttendance: (params) => api.get('/attendance/low-attendance', { params }),
  getSummary: (params) => api.get('/attendance/summary', { params }),
  
  // Update/Delete
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  
  // Export functions
  exportCSV: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/attendance/export/csv?${queryString}`;
    const filename = `attendance-export-${Date.now()}.csv`;
    await downloadFile(url, filename);
  },
  
  exportSummaryCSV: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/attendance/export/summary-csv?${queryString}`;
    const filename = `attendance-summary-${params.branch}-sem${params.semester}-${Date.now()}.csv`;
    await downloadFile(url, filename);
  },
};

export default api;