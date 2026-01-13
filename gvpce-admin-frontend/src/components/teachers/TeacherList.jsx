import React from 'react';
import TeacherCard from './TeacherCard';
import Loader from '../common/Loader';

const TeacherList = ({ teachers, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" text="Loading teachers..." />
      </div>
    );
  }

  if (!teachers || teachers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-primary-200">
        <p className="text-primary-500">No approved teachers found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {teachers.map((teacher) => (
        <TeacherCard
          key={teacher._id}
          teacher={teacher}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TeacherList;