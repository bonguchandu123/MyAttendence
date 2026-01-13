import React, { useState, useEffect } from 'react';
import { schedulesAPI, teachersAPI } from '../utils/api';
import { BRANCHES, DAYS } from '../utils/helpers';
import ScheduleForm from '../components/schedules/ScheduleForm';
import ScheduleList from '../components/schedules/ScheduleList';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import Button from '../components/common/Button';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [filters, setFilters] = useState({
    teacher: '',
    branch: '',
    day: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, schedulesRes] = await Promise.all([
        teachersAPI.getAll({ isApproved: true }),
        schedulesAPI.getAll({
          ...(filters.teacher && { teacher: filters.teacher }),
          ...(filters.branch && { branch: filters.branch }),
          ...(filters.day && { day: filters.day }),
        }),
      ]);

      setTeachers(teachersRes.data.data);
      setSchedules(schedulesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data) => {
    setAddLoading(true);
    try {
      await schedulesAPI.create(data);
      alert('Schedule created successfully');
      fetchData();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert(error.response?.data?.message || 'Failed to create schedule');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = (schedule) => {
   
  };

  const handleDelete = async (schedule) => {
    if (window.confirm('Delete this schedule?')) {
      try {
        await schedulesAPI.delete(schedule._id);
        alert('Schedule deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert(error.response?.data?.message || 'Failed to delete schedule');
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const teacherOptions = teachers.map((t) => ({
    value: t._id,
    label: `${t.name} (${t.department})`,
  }));

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">📅 Class Schedule Management</h1>
        <p className="text-primary-600 mt-1">Create and manage class schedules</p>
      </div>

      <ScheduleForm teachers={teachers} onAdd={handleAdd} loading={addLoading} />

      <Card title="📋 Existing Schedules">
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Filter by Teacher"
              name="teacher"
              value={filters.teacher}
              onChange={handleFilterChange}
              options={teacherOptions}
              placeholder="All Teachers"
            />
            <Select
              label="Filter by Branch"
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
              options={BRANCHES}
              placeholder="All Branches"
            />
            <Select
              label="Filter by Day"
              name="day"
              value={filters.day}
              onChange={handleFilterChange}
              options={DAYS}
              placeholder="All Days"
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => setFilters({ teacher: '', branch: '', day: '' })}
                fullWidth
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        <ScheduleList
          schedules={schedules}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
};

export default Schedules;