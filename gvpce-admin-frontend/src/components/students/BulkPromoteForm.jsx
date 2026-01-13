import React, { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { BRANCHES, SEMESTERS } from '../../utils/helpers';
import Card from '../common/Card';
import Select from '../common/Select';
import Button from '../common/Button';

const BulkPromoteForm = ({ onPromote, loading }) => {
  const [formData, setFormData] = useState({
    branch: '',
    currentSemester: '',
    newSemester: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (formData.branch && formData.currentSemester && formData.newSemester) {
      if (
        window.confirm(
          `Are you sure you want to promote all ${formData.branch} students from Semester ${formData.currentSemester} to Semester ${formData.newSemester}? This action cannot be undone easily.`
        )
      ) {
        onPromote({
          branch: formData.branch,
          currentSemester: parseInt(formData.currentSemester),
          newSemester: parseInt(formData.newSemester),
        });
      }
    }
  };

  const isValid = formData.branch && formData.currentSemester && formData.newSemester;

  return (
    <Card title="🔄 Bulk Semester Update">
      <div className="space-y-4">
        <p className="text-sm text-primary-600">
          Promote students to next semester in bulk
        </p>

        <Select
          label="Branch"
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          options={BRANCHES}
          placeholder="Select branch"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Current Semester"
            name="currentSemester"
            value={formData.currentSemester}
            onChange={handleChange}
            options={SEMESTERS.filter(s => s.value < 8)}
            placeholder="Select current semester"
          />
          <Select
            label="Promote to Semester"
            name="newSemester"
            value={formData.newSemester}
            onChange={handleChange}
            options={SEMESTERS.filter(s => s.value > parseInt(formData.currentSemester || 0))}
            placeholder="Select new semester"
            disabled={!formData.currentSemester}
          />
        </div>

        {isValid && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-900">
                ⚠️ WARNING: This action will update semester for all selected students.
              </p>
              <p className="text-xs text-warning-700 mt-1">
                This cannot be undone easily. Please verify the selection before proceeding.
              </p>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          icon={RefreshCw}
          onClick={handleSubmit}
          loading={loading}
          disabled={!isValid}
          fullWidth
        >
          Promote Students
        </Button>
      </div>
    </Card>
  );
};

export default BulkPromoteForm;