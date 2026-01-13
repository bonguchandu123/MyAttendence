import React from 'react';
import { Save, Trash2, X } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const StudentQueue = ({ queue, onRemove, onSaveAll, onClearQueue, loading }) => {
  if (queue.length === 0) return null;

  return (
    <Card title={`📋 Queued for Saving (${queue.length} students)`}>
      <div className="space-y-3">
        {queue.map((student, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-200"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-900">
                {student.rollNumber}
              </p>
              <p className="text-xs text-primary-600">
                {student.branch} | Semester {student.semester}
              </p>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="text-error-600 hover:text-error-700 p-2 hover:bg-error-50 rounded transition-smooth"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div className="flex gap-3 pt-3">
          <Button
            variant="primary"
            icon={Save}
            onClick={onSaveAll}
            loading={loading}
            fullWidth
          >
            💾 Save All ({queue.length} Students)
          </Button>
          <Button
            variant="secondary"
            icon={Trash2}
            onClick={onClearQueue}
            disabled={loading}
          >
            Clear Queue
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StudentQueue;