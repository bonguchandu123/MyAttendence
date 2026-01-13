import React from 'react';
import StudentCard from './StudentCard';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';

const StudentList = ({
  students,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onChangeSemester,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" text="Loading students..." />
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-primary-200">
        <p className="text-primary-500">No students found. Add students using the form above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {students.map((student) => (
          <StudentCard
            key={student._id}
            student={student}
            onEdit={onEdit}
            onDelete={onDelete}
            onChangeSemester={onChangeSemester}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default StudentList;