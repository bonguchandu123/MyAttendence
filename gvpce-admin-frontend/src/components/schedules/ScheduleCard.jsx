import React from 'react';
import { Edit, Trash2, Users, Clock } from 'lucide-react';
import Button from '../common/Button';

const ScheduleCard = ({ schedule, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg border border-primary-200 p-4 hover:shadow-md transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-primary-900 mb-1">
            👨‍🏫 {schedule.teacher.name}
          </h3>
          <p className="text-sm font-semibold text-accent-700 mb-1">
            {schedule.subject.subjectCode} - {schedule.subject.subjectName}
          </p>
          <p className="text-sm text-primary-700">
            🎓 {schedule.branch} - Semester {schedule.semester}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          schedule.isActive 
            ? 'bg-success-100 text-success-700' 
            : 'bg-error-100 text-error-700'
        }`}>
          {schedule.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-primary-700">
          <span className="font-medium">📅 Days:</span>
          <span>{schedule.days.join(', ')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-700">
          <Clock className="w-4 h-4" />
          <span className="font-medium">Period {schedule.period}</span>
          <span>({schedule.startTime} - {schedule.endTime})</span>
        </div>
        {schedule.studentCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-primary-700">
            <Users className="w-4 h-4" />
            <span>{schedule.studentCount} students</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={Edit}
          onClick={() => onEdit(schedule)}
        >
          Edit
        </Button>
        <Button
          variant="error"
          size="sm"
          icon={Trash2}
          onClick={() => onDelete(schedule)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default ScheduleCard;