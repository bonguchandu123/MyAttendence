import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={classNames('flex items-center justify-between', className)}>
      <div className="text-sm text-primary-600">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={classNames(
            'px-3 py-2 rounded-lg border transition-smooth',
            currentPage === 1
              ? 'border-primary-200 text-primary-400 cursor-not-allowed'
              : 'border-primary-300 text-primary-700 hover:bg-primary-50'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={index} className="px-3 py-2 text-primary-500">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={classNames(
                'px-3 py-2 rounded-lg border transition-smooth text-sm font-medium',
                page === currentPage
                  ? 'bg-primary-900 text-white border-primary-900'
                  : 'border-primary-300 text-primary-700 hover:bg-primary-50'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={classNames(
            'px-3 py-2 rounded-lg border transition-smooth',
            currentPage === totalPages
              ? 'border-primary-200 text-primary-400 cursor-not-allowed'
              : 'border-primary-300 text-primary-700 hover:bg-primary-50'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;