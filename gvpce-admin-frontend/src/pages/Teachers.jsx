import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { teachersAPI } from '../utils/api';
import { DEPARTMENTS } from '../utils/helpers';
import PendingApprovals from '../components/teachers/PendingApprovals';
import TeacherList from '../components/teachers/TeacherList';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

const Teachers = () => {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    search: '',
  });
  const [editModal, setEditModal] = useState({ isOpen: false, teacher: null });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        teachersAPI.getPending(),
        teachersAPI.getAll({
          ...(filters.department && { department: filters.department }),
          ...(filters.search && { search: filters.search }),
        }),
      ]);

      setPendingTeachers(pendingRes.data.data);
      setApprovedTeachers(approvedRes.data.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      alert('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teacher) => {
    if (window.confirm(`Approve teacher ${teacher.name}?`)) {
      try {
        await teachersAPI.approve(teacher._id);
        alert('Teacher approved successfully');
        fetchData();
      } catch (error) {
        console.error('Error approving teacher:', error);
        alert(error.response?.data?.message || 'Failed to approve teacher');
      }
    }
  };

  const handleReject = async (teacher) => {
    if (window.confirm(`Reject teacher ${teacher.name}? This will delete their account.`)) {
      try {
        await teachersAPI.reject(teacher._id);
        alert('Teacher rejected successfully');
        fetchData();
      } catch (error) {
        console.error('Error rejecting teacher:', error);
        alert(error.response?.data?.message || 'Failed to reject teacher');
      }
    }
  };

  const handleEdit = (teacher) => {
    setEditModal({ isOpen: true, teacher: { ...teacher } });
  };

  const handleUpdate = async () => {
    try {
      await teachersAPI.update(editModal.teacher._id, editModal.teacher);
      alert('Teacher updated successfully');
      setEditModal({ isOpen: false, teacher: null });
      fetchData();
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert(error.response?.data?.message || 'Failed to update teacher');
    }
  };

  const handleDelete = async (teacher) => {
    if (window.confirm(`Delete teacher ${teacher.name}? This action cannot be undone.`)) {
      try {
        await teachersAPI.delete(teacher._id);
        alert('Teacher deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert(error.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">👨‍🏫 Teacher Management</h1>
        <p className="text-primary-600 mt-1">Approve and manage teacher accounts</p>
      </div>

      <PendingApprovals
        teachers={pendingTeachers}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <Card title="✅ Approved Teachers">
        <div className="space-y-4 mb-4">
          <Input
            placeholder="Search by name or email..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            icon={Search}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Filter by Department"
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              options={DEPARTMENTS}
              placeholder="All Departments"
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => setFilters({ department: '', search: '' })}
                fullWidth
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        <TeacherList
          teachers={approvedTeachers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, teacher: null })}
        title="Edit Teacher"
        size="md"
      >
        {editModal.teacher && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={editModal.teacher.name}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  teacher: { ...prev.teacher, name: e.target.value },
                }))
              }
            />
            <Input
              label="Email"
              value={editModal.teacher.email}
              disabled
            />
            <Input
              label="Phone"
              value={editModal.teacher.phone}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  teacher: { ...prev.teacher, phone: e.target.value },
                }))
              }
            />
            <Select
              label="Department"
              value={editModal.teacher.department}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  teacher: { ...prev.teacher, department: e.target.value },
                }))
              }
              options={DEPARTMENTS}
            />
            <Button variant="primary" onClick={handleUpdate} fullWidth>
              Update Teacher
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Teachers;