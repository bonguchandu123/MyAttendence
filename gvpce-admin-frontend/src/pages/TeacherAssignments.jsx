import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { teachersAPI, subjectsAPI } from '../utils/api';
import AssignmentManager from '../components/teachers/AssignmentManager';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const TeacherAssignments = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [teacherId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        teachersAPI.getAll(),
        subjectsAPI.getAll(),
      ]);

      const foundTeacher = teachersRes.data.data.find((t) => t._id === teacherId);
      if (!foundTeacher) {
        alert('Teacher not found');
        navigate('/teachers');
        return;
      }

      setTeacher(foundTeacher);
      setSubjects(subjectsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
      navigate('/teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async (data) => {
    setActionLoading(true);
    try {
      await teachersAPI.addAssignment(teacherId, data);
      alert('Assignment added successfully');
      fetchData();
    } catch (error) {
      console.error('Error adding assignment:', error);
      alert(error.response?.data?.message || 'Failed to add assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (window.confirm('Remove this assignment?')) {
      try {
        await teachersAPI.removeAssignment(teacherId, assignmentId);
        alert('Assignment removed successfully');
        fetchData();
      } catch (error) {
        console.error('Error removing assignment:', error);
        alert(error.response?.data?.message || 'Failed to remove assignment');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" text="Loading teacher data..." />
      </div>
    );
  }

  if (!teacher) {
    return null;
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate('/teachers')}
          className="mb-4"
        >
          Back to Teachers
        </Button>
        <h1 className="text-2xl font-bold text-primary-900">
          📚 Manage Assignments - {teacher.name}
        </h1>
        <p className="text-primary-600 mt-1">
          📧 {teacher.email}
        </p>
      </div>

      <AssignmentManager
        teacher={teacher}
        subjects={subjects}
        onAdd={handleAddAssignment}
        onRemove={handleRemoveAssignment}
        loading={actionLoading}
      />
    </div>
  );
};

export default TeacherAssignments;