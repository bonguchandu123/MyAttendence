import React from 'react';
import { Edit, Trash2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, getDepartmentFullName } from '../../utils/helpers';
import Button from '../common/Button';

const TeacherCard = ({ teacher, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-primary-200 p-4 hover:shadow-md transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-primary-900">
              👤 {teacher.name}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              teacher.isActive 
                ? 'bg-success-100 text-success-700' 
                : 'bg-error-100 text-error-700'
            }`}>
              {teacher.isActive ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
          <p className="text-sm text-primary-600">
            📧 {teacher.email}
          </p>
          {teacher.phone && (
            <p className="text-sm text-primary-600">
              📱 {teacher.phone}
            </p>
          )}
          <p className="text-sm text-primary-600">
            🏢 Department: <span className="font-medium text-primary-900">{getDepartmentFullName(teacher.department)}</span>
          </p>
        </div>
      </div>

      {teacher.assignments && teacher.assignments.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg">
          <p className="text-xs font-semibold text-primary-900 mb-2">
            📚 Assignments ({teacher.assignments.length}):
          </p>
          <div className="space-y-1">
            {teacher.assignments.slice(0, 3).map((assignment, index) => (
              <p key={index} className="text-xs text-primary-700">
                • {assignment.branch} - Sem {assignment.semester} - {assignment.subject.subjectName} ({assignment.subject.subjectCode})
              </p>
            ))}
            {teacher.assignments.length > 3 && (
              <p className="text-xs text-primary-500 italic">
                +{teacher.assignments.length - 3} more...
              </p>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-primary-500 mb-3">
        Added: {formatDate(teacher.createdAt)}
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={BookOpen}
          onClick={() => navigate(`/teachers/${teacher._id}/assignments`)}
        >
          Manage Assignments
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={Edit}
          onClick={() => onEdit(teacher)}
        >
          Edit
        </Button>
        <Button
          variant="error"
          size="sm"
          icon={Trash2}
          onClick={() => onDelete(teacher)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default TeacherCard;