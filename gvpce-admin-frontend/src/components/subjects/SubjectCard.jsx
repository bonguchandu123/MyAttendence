import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Button from '../common/Button';

const SubjectCard = ({ subject, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg border border-primary-200 p-4 hover:shadow-md transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-primary-900">
              {subject.subjectCode}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              subject.isActive 
                ? 'bg-success-100 text-success-700' 
                : 'bg-error-100 text-error-700'
            }`}>
              {subject.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <h3 className="text-base font-semibold text-primary-900 mb-2">
            {subject.subjectName}
          </h3>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <p className="text-sm text-primary-700">
          Branch: <span className="font-medium text-primary-900">{subject.branch}</span> | 
          Semester: <span className="font-medium text-primary-900">{subject.semester}</span>
        </p>
        <p className="text-sm text-primary-700">
          Credits: <span className="font-medium text-primary-900">{subject.credits}</span> | 
          Type: <span className="font-medium text-primary-900">{subject.type}</span>
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={Edit}
          onClick={() => onEdit(subject)}
        >
          Edit Subject
        </Button>
        <Button
          variant="error"
          size="sm"
          icon={Trash2}
          onClick={() => onDelete(subject)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default SubjectCard;