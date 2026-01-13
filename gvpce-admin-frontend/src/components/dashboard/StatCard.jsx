import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-900',
    success: 'bg-success-50 text-success-900',
    warning: 'bg-warning-50 text-warning-900',
    error: 'bg-error-50 text-error-900',
    accent: 'bg-accent-50 text-accent-900',
  };

  return (
    <div className="bg-white rounded-lg border border-primary-200 p-6 shadow-sm hover:shadow-md transition-smooth">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary-900">{value}</p>
          {trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-success-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-error-600" />
              )}
              <span
                className={classNames(
                  'text-xs font-medium',
                  trend === 'up' ? 'text-success-600' : 'text-error-600'
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={classNames('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;