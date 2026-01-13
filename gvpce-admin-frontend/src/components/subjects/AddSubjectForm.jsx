import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { BRANCHES, SEMESTERS, SUBJECT_TYPES } from '../../utils/helpers';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const AddSubjectForm = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    branch: '',
    semester: '',
    credits: '4',
    type: 'Theory',
  });
  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const newErrors = {};

    if (!formData.subjectCode.trim()) {
      newErrors.subjectCode = 'Subject code is required';
    }

    if (!formData.subjectName.trim()) {
      newErrors.subjectName = 'Subject name is required';
    }

    if (!formData.branch) {
      newErrors.branch = 'Branch is required';
    }

    if (!formData.semester) {
      newErrors.semester = 'Semester is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onAdd({
        subjectCode: formData.subjectCode.toUpperCase(),
        subjectName: formData.subjectName,
        branch: formData.branch,
        semester: parseInt(formData.semester),
        credits: parseInt(formData.credits),
        type: formData.type,
      });
      setFormData({
        subjectCode: '',
        subjectName: '',
        branch: '',
        semester: '',
        credits: '4',
        type: 'Theory',
      });
    }
  };

  const creditsOptions = [
    { value: '1', label: '1 Credit' },
    { value: '2', label: '2 Credits' },
    { value: '3', label: '3 Credits' },
    { value: '4', label: '4 Credits' },
    { value: '5', label: '5 Credits' },
    { value: '6', label: '6 Credits' },
  ];

  return (
    <Card title="➕ Add New Subject">
      <div className="space-y-4">
        <Input
          label="Subject Code"
          name="subjectCode"
          value={formData.subjectCode}
          onChange={handleChange}
          placeholder="22CS2305"
          error={errors.subjectCode}
          required
        />

        <Input
          label="Subject Name"
          name="subjectName"
          value={formData.subjectName}
          onChange={handleChange}
          placeholder="Software Engineering"
          error={errors.subjectName}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Branch"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            options={BRANCHES}
            placeholder="Select branch"
            error={errors.branch}
            required
          />
          <Select
            label="Semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            options={SEMESTERS}
            placeholder="Select semester"
            error={errors.semester}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Credits"
            name="credits"
            value={formData.credits}
            onChange={handleChange}
            options={creditsOptions}
          />
          <Select
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={SUBJECT_TYPES}
          />
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleSubmit}
          loading={loading}
          fullWidth
        >
          Save Subject
        </Button>
      </div>
    </Card>
  );
};

export default AddSubjectForm;