import React from 'react';
import { classNames } from '../../utils/helpers';

const Table = ({ columns, data, loading = false, emptyMessage = 'No data available' }) => {
  if (loading) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="animate-pulse">
          <div className="h-12 bg-primary-100 rounded mb-2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-primary-50 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-primary-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-primary-200">
        <thead className="bg-primary-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={classNames(
                  'px-6 py-3 text-left text-xs font-semibold text-primary-900 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-primary-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-primary-50 transition-smooth">
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={classNames(
                    'px-6 py-4 whitespace-nowrap text-sm text-primary-900',
                    column.className
                  )}
                >
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;