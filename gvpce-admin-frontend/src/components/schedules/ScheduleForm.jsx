import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DAYS } from '../../utils/helpers';
import Card from '../common/Card';
import Select from '../common/Select';
import Input from '../common/Input';
import Button from '../common/Button';

const ScheduleForm = ({ teachers, onAdd, loading }) => {
  const [formData, setFormData] = useState({
    teacher: '',
    assignment: '',
    days: [],
    period: '',
    startTime: '',
    endTime: '',
  });
  const [errors, setErrors] = useState({});

  const selectedTeacher = teachers.find((t) => t._id === formData.teacher);
  const assignmentOptions =
    selectedTeacher?.assignments?.map((a) => ({
      value: a._id,
      label: `${a.branch} - Sem ${a.semester} - ${a.subject.subjectName} (${a.subject.subjectCode})`,
      data: a,
    })) || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.teacher) newErrors.teacher = 'Teacher is required';
    if (!formData.assignment) newErrors.assignment = 'Assignment is required';
    if (formData.days.length === 0) newErrors.days = 'Select at least one day';
    if (!formData.period) newErrors.period = 'Period is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const selectedAssignment = assignmentOptions.find(
        (a) => a.value === formData.assignment
      );

      onAdd({
        teacher: formData.teacher,
        subject: selectedAssignment.data.subject._id,
        branch: selectedAssignment.data.branch,
        semester: selectedAssignment.data.semester,
        days: formData.days,
        period: formData.period,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      setFormData({
        teacher: '',
        assignment: '',
        days: [],
        period: '',
        startTime: '',
        endTime: '',
      });
    }
  };

  const periodOptions = [
    { value: '1', label: 'Period 1' },
    { value: '2', label: 'Period 2' },
    { value: '3', label: 'Period 3' },
    { value: '4', label: 'Period 4' },
    { value: '5', label: 'Period 5' },
    { value: '6', label: 'Period 6' },
    { value: '7', label: 'Period 7' },
    { value: '8', label: 'Period 8' },
    { value: '1-2', label: 'Period 1-2' },
    { value: '3-4', label: 'Period 3-4' },
    { value: '5-6', label: 'Period 5-6' },
    { value: '7-8', label: 'Period 7-8' },
  ];

  return (
    <Card title="➕ Create New Schedule">
      <div className="space-y-4">
        <Select
          label="Teacher"
          name="teacher"
          value={formData.teacher}
          onChange={handleChange}
          options={teachers.map((t) => ({
            value: t._id,
            label: `${t.name} (${t.department})`,
          }))}
          placeholder="Select teacher"
          error={errors.teacher}
          required
        />

        <Select
          label="Assignment"
          name="assignment"
          value={formData.assignment}
          onChange={handleChange}
          options={assignmentOptions}
          placeholder="Select assignment"
          disabled={!formData.teacher}
          error={errors.assignment}
          required
        />

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Days (Select Multiple) <span className="text-error-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleDayToggle(day.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-smooth ${
                  formData.days.includes(day.value)
                    ? 'bg-primary-900 text-white border-primary-900'
                    : 'bg-white text-primary-700 border-primary-300 hover:bg-primary-50'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          {errors.days && <p className="mt-1 text-sm text-error-600">{errors.days}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Period"
            name="period"
            value={formData.period}
            onChange={handleChange}
            options={periodOptions}
            placeholder="Select period"
            error={errors.period}
            required
          />
          <Input
            label="Start Time"
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            error={errors.startTime}
            required
          />
          <Input
            label="End Time"
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            error={errors.endTime}
            required
          />
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleSubmit}
          loading={loading}
          fullWidth
        >
          Add Schedule
        </Button>
      </div>
    </Card>
  );
};

export default ScheduleForm;