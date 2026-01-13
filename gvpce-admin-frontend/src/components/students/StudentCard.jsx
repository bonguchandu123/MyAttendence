import React from 'react';
import { Edit, Trash2, RefreshCw } from 'lucide-react';
import { formatDate, getYearFromSemester } from '../../utils/helpers';
import Button from '../common/Button';

const StudentCard = ({ student, onEdit, onDelete, onChangeSemester }) => {
  return (
    <div className="bg-white rounded-lg border border-primary-200 p-4 hover:shadow-md transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-primary-900">
              📌 {student.rollNumber}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              student.isActive 
                ? 'bg-success-100 text-success-700' 
                : 'bg-error-100 text-error-700'
            }`}>
              {student.isActive ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
          <p className="text-sm text-primary-600">
            Branch: <span className="font-medium text-primary-900">{student.branch}</span> | 
            Semester: <span className="font-medium text-primary-900">{student.semester}</span>
          </p>
          <p className="text-sm text-primary-600">
            Year: <span className="font-medium text-primary-900">{student.year || getYearFromSemester(student.semester)}</span>
          </p>
        </div>
      </div>

      <div className="mb-4 space-y-1">
        <p className="text-sm text-primary-700">
          📧 {student.email}
        </p>
        <div className="flex items-center gap-4 text-xs text-primary-500">
          <span>Added: {formatDate(student.createdAt)}</span>
          {student.updatedAt !== student.createdAt && (
            <span>Updated: {formatDate(student.updatedAt)}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={Edit}
          onClick={() => onEdit(student)}
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => onChangeSemester(student)}
        >
          Change Semester
        </Button>
        <Button
          variant="error"
          size="sm"
          icon={Trash2}
          onClick={() => onDelete(student)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default StudentCard;