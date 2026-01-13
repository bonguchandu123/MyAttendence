import React, { useState, useEffect } from 'react';
import { subjectsAPI } from '../utils/api';
import { BRANCHES, SEMESTERS } from '../utils/helpers';
import AddSubjectForm from '../components/subjects/AddSubjectForm';
import SubjectList from '../components/subjects/SubjectList';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [filters, setFilters] = useState({
    branch: '',
    semester: '',
  });
  const [editModal, setEditModal] = useState({ isOpen: false, subject: null });

  useEffect(() => {
    if (filters.branch && filters.semester) {
      fetchSubjects();
    }
  }, [filters]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await subjectsAPI.getByBranchSemester(filters.branch, filters.semester);
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      alert('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data) => {
    setAddLoading(true);
    try {
      await subjectsAPI.create(data);
      alert('Subject created successfully');
      if (filters.branch && filters.semester) {
        fetchSubjects();
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      alert(error.response?.data?.message || 'Failed to create subject');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = (subject) => {
    setEditModal({ isOpen: true, subject: { ...subject } });
  };

  const handleUpdate = async () => {
    try {
      await subjectsAPI.update(editModal.subject._id, editModal.subject);
      alert('Subject updated successfully');
      setEditModal({ isOpen: false, subject: null });
      fetchSubjects();
    } catch (error) {
      console.error('Error updating subject:', error);
      alert(error.response?.data?.message || 'Failed to update subject');
    }
  };

  const handleDelete = async (subject) => {
    if (window.confirm(`Delete subject ${subject.subjectCode} - ${subject.subjectName}?`)) {
      try {
        await subjectsAPI.delete(subject._id);
        alert('Subject deleted successfully');
        fetchSubjects();
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert(error.response?.data?.message || 'Failed to delete subject');
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoadSubjects = () => {
    if (filters.branch && filters.semester) {
      fetchSubjects();
    } else {
      alert('Please select both branch and semester');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">📚 Subject Management</h1>
        <p className="text-primary-600 mt-1">Manage subjects by branch and semester</p>
      </div>

      <Card title="🔍 Select Branch & Semester">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Branch"
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
              options={BRANCHES}
              placeholder="Select branch"
            />
            <Select
              label="Semester"
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              options={SEMESTERS}
              placeholder="Select semester"
            />
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={handleLoadSubjects}
                fullWidth
              >
                Load Subjects
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {filters.branch && filters.semester && (
        <>
          <Card
            title={`📖 Subjects for ${filters.branch} - Semester ${filters.semester} (${subjects.length} subjects)`}
          >
            <SubjectList
              subjects={subjects}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Card>

          <AddSubjectForm onAdd={handleAdd} loading={addLoading} />
        </>
      )}

      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, subject: null })}
        title="Edit Subject"
        size="md"
      >
        {editModal.subject && (
          <div className="space-y-4">
            <Input
              label="Subject Code"
              value={editModal.subject.subjectCode}
              disabled
            />
            <Input
              label="Subject Name"
              value={editModal.subject.subjectName}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  subject: { ...prev.subject, subjectName: e.target.value },
                }))
              }
            />
            <Select
              label="Branch"
              value={editModal.subject.branch}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  subject: { ...prev.subject, branch: e.target.value },
                }))
              }
              options={BRANCHES}
            />
            <Select
              label="Semester"
              value={editModal.subject.semester}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  subject: { ...prev.subject, semester: e.target.value },
                }))
              }
              options={SEMESTERS}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Credits"
                value={editModal.subject.credits}
                onChange={(e) =>
                  setEditModal((prev) => ({
                    ...prev,
                    subject: { ...prev.subject, credits: e.target.value },
                  }))
                }
                options={[
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                  { value: '6', label: '6' },
                ]}
              />
              <Select
                label="Type"
                value={editModal.subject.type}
                onChange={(e) =>
                  setEditModal((prev) => ({
                    ...prev,
                    subject: { ...prev.subject, type: e.target.value },
                  }))
                }
                options={[
                  { value: 'Theory', label: 'Theory' },
                  { value: 'Lab', label: 'Lab' },
                  { value: 'Practical', label: 'Practical' },
                  { value: 'Elective', label: 'Elective' },
                ]}
              />
            </div>
            <Button variant="primary" onClick={handleUpdate} fullWidth>
              Update Subject
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Subjects;