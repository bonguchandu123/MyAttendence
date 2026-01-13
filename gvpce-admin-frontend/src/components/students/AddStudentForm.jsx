import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { BRANCHES, SEMESTERS, generateEmail, validateRollNumber } from '../../utils/helpers';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const AddStudentForm = ({ onAddToQueue }) => {
  const [formData, setFormData] = useState({
    rollNumber: '',
    branch: '',
    semester: '',
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

    if (!formData.rollNumber.trim()) {
      newErrors.rollNumber = 'Roll number is required';
    } else if (!validateRollNumber(formData.rollNumber)) {
      newErrors.rollNumber = 'Invalid roll number format (11 digits required)';
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

  const handleAddToQueue = () => {
    if (validate()) {
      onAddToQueue({
        rollNumber: formData.rollNumber.toUpperCase(),
        branch: formData.branch,
        semester: parseInt(formData.semester),
      });
      setFormData({ rollNumber: '', branch: '', semester: '' });
    }
  };

  return (
    <Card title="📝 Add New Student">
      <div className="space-y-4">
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

        <Input
          label="Roll Number"
          name="rollNumber"
          value={formData.rollNumber}
          onChange={handleChange}
          placeholder="32410383009"
          error={errors.rollNumber}
          required
        />

        {formData.rollNumber && (
          <div className="bg-accent-50 border border-accent-200 rounded-lg p-3">
            <p className="text-sm text-accent-900">
              ⚠️ Email will be: <span className="font-medium">{generateEmail(formData.rollNumber)}</span>
            </p>
            <p className="text-xs text-accent-700 mt-1">
              Default Password: Same as Roll Number
            </p>
          </div>
        )}

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleAddToQueue}
          fullWidth
        >
          Add to Queue
        </Button>
      </div>
    </Card>
  );
};

export default AddStudentForm;