import React from 'react';
import ScheduleCard from './ScheduleCard';
import Loader from '../common/Loader';

const ScheduleList = ({ schedules, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" text="Loading schedules..." />
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-primary-200">
        <p className="text-primary-500">No schedules found. Create schedules using the form above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {schedules.map((schedule) => (
        <ScheduleCard
          key={schedule._id}
          schedule={schedule}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ScheduleList;