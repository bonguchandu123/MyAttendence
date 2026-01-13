import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { studentsAPI } from '../utils/api';
import { BRANCHES, SEMESTERS } from '../utils/helpers';
import AddStudentForm from '../components/students/AddStudentForm';
import StudentQueue from '../components/students/StudentQueue';
import StudentList from '../components/students/StudentList';
import BulkPromoteForm from '../components/students/BulkPromoteForm';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [filters, setFilters] = useState({
    branch: '',
    semester: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [editModal, setEditModal] = useState({ isOpen: false, student: null });

  useEffect(() => {
    fetchStudents();
  }, [filters, pagination.currentPage]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: 50,
        ...(filters.branch && { branch: filters.branch }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await studentsAPI.getAll(params);
      setStudents(response.data.data);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = (student) => {
    const exists = queue.find((s) => s.rollNumber === student.rollNumber);
    if (exists) {
      alert('Student already in queue');
      return;
    }
    setQueue((prev) => [...prev, student]);
  };

  const handleRemoveFromQueue = (index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearQueue = () => {
    if (window.confirm('Clear all queued students?')) {
      setQueue([]);
    }
  };

  const handleSaveAll = async () => {
    if (queue.length === 0) return;

    setSaveLoading(true);
    try {
      const response = await studentsAPI.bulkCreate({ students: queue });
      alert(`${response.data.data.created} students created successfully`);
      setQueue([]);
      fetchStudents();
    } catch (error) {
      console.error('Error saving students:', error);
      alert(error.response?.data?.message || 'Failed to save students');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditModal({ isOpen: true, student });
  };

  const handleUpdateStudent = async (updatedData) => {
    try {
      await studentsAPI.update(editModal.student._id, updatedData);
      alert('Student updated successfully');
      setEditModal({ isOpen: false, student: null });
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      alert(error.response?.data?.message || 'Failed to update student');
    }
  };

  const handleDelete = async (student) => {
    if (window.confirm(`Delete student ${student.rollNumber}?`)) {
      try {
        await studentsAPI.delete(student._id);
        alert('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert(error.response?.data?.message || 'Failed to delete student');
      }
    }
  };

  const handleChangeSemester = (student) => {
    const newSemester = prompt(`Enter new semester for ${student.rollNumber} (1-8):`, student.semester);
    if (newSemester && newSemester >= 1 && newSemester <= 8) {
      handleUpdateStudent({ semester: parseInt(newSemester) });
    }
  };

  const handleBulkPromote = async (data) => {
    setPromoteLoading(true);
    try {
      const response = await studentsAPI.bulkPromote(data);
      alert(response.data.message);
      fetchStudents();
    } catch (error) {
      console.error('Error promoting students:', error);
      alert(error.response?.data?.message || 'Failed to promote students');
    } finally {
      setPromoteLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">👥 Student Management</h1>
        <p className="text-primary-600 mt-1">Add, view, and manage student records</p>
      </div>

      <AddStudentForm onAddToQueue={handleAddToQueue} />

      <StudentQueue
        queue={queue}
        onRemove={handleRemoveFromQueue}
        onSaveAll={handleSaveAll}
        onClearQueue={handleClearQueue}
        loading={saveLoading}
      />

      <Card title="🔍 Search & Filter Existing Students">
        <div className="space-y-4">
          <Input
            placeholder="Search by roll number..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            icon={Search}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Filter by Branch"
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
              options={BRANCHES}
              placeholder="All Branches"
            />
            <Select
              label="Filter by Semester"
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              options={SEMESTERS}
              placeholder="All Semesters"
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({ branch: '', semester: '', search: '' });
                  setPagination({ currentPage: 1, totalPages: 1 });
                }}
                fullWidth
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card title={`👥 Existing Students (${students.length} total)`}>
        <StudentList
          students={students}
          loading={loading}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChangeSemester={handleChangeSemester}
        />
      </Card>

      <BulkPromoteForm onPromote={handleBulkPromote} loading={promoteLoading} />

      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, student: null })}
        title="Edit Student"
        size="md"
      >
        {editModal.student && (
          <div className="space-y-4">
            <Input
              label="Roll Number"
              value={editModal.student.rollNumber}
              disabled
            />
            <Select
              label="Branch"
              name="branch"
              value={editModal.student.branch}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  student: { ...prev.student, branch: e.target.value },
                }))
              }
              options={BRANCHES}
            />
            <Select
              label="Semester"
              name="semester"
              value={editModal.student.semester}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  student: { ...prev.student, semester: e.target.value },
                }))
              }
              options={SEMESTERS}
            />
            <Button
              variant="primary"
              onClick={() => handleUpdateStudent(editModal.student)}
              fullWidth
            >
              Update Student
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Students;