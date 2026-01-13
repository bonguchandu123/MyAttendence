import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BRANCHES, SEMESTERS } from '../../utils/helpers';
import Card from '../common/Card';
import Select from '../common/Select';
import Button from '../common/Button';

const AssignmentManager = ({ teacher, subjects, onAdd, onRemove, loading }) => {
  const [formData, setFormData] = useState({
    branch: '',
    semester: '',
    subject: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdd = () => {
    if (formData.branch && formData.semester && formData.subject) {
      onAdd({
        subject: formData.subject,
        branch: formData.branch,
        semester: parseInt(formData.semester),
      });
      setFormData({ branch: '', semester: '', subject: '' });
    } else {
      alert('Please select branch, semester, and subject');
    }
  };

  const filteredSubjects = subjects.filter(
    (sub) =>
      sub.branch === formData.branch &&
      sub.semester === parseInt(formData.semester)
  );

  const subjectOptions = filteredSubjects.map((sub) => ({
    value: sub._id,
    label: `${sub.subjectCode} - ${sub.subjectName}`,
  }));

  return (
    <div className="space-y-6">
      <Card title="➕ Add New Assignment">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              options={BRANCHES}
              placeholder="Select branch"
            />
            <Select
              label="Semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              options={SEMESTERS}
              placeholder="Select semester"
            />
          </div>

          <Select
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            options={subjectOptions}
            placeholder="Select subject"
            disabled={!formData.branch || !formData.semester}
          />

          <Button
            variant="primary"
            icon={Plus}
            onClick={handleAdd}
            loading={loading}
            disabled={!formData.branch || !formData.semester || !formData.subject}
            fullWidth
          >
            + Add This Assignment
          </Button>
        </div>
      </Card>

      <Card title={`📋 Current Assignments (${teacher.assignments?.length || 0})`}>
        {!teacher.assignments || teacher.assignments.length === 0 ? (
          <div className="text-center py-8 text-primary-500">
            No assignments yet. Add assignments above.
          </div>
        ) : (
          <div className="space-y-3">
            {teacher.assignments.map((assignment, index) => (
              <div
                key={assignment._id}
                className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary-900 mb-1">
                    Assignment #{index + 1}
                  </p>
                  <p className="text-sm text-primary-700">
                    Branch: <span className="font-medium">{assignment.branch}</span> | 
                    Semester: <span className="font-medium">{assignment.semester}</span>
                  </p>
                  <p className="text-sm text-primary-700">
                    Subject: <span className="font-medium">{assignment.subject.subjectCode} - {assignment.subject.subjectName}</span>
                  </p>
                </div>
                <Button
                  variant="error"
                  size="sm"
                  icon={Trash2}
                  onClick={() => onRemove(assignment._id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AssignmentManager;