import React from 'react';
import SubjectCard from './SubjectCard';
import Loader from '../common/Loader';

const SubjectList = ({ subjects, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" text="Loading subjects..." />
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-primary-200">
        <p className="text-primary-500">No subjects found. Add subjects using the form above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {subjects.map((subject) => (
        <SubjectCard
          key={subject._id}
          subject={subject}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default SubjectList;