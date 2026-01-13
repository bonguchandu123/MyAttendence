import React from 'react';
import { ClipboardCheck, UserPlus, Users, CheckCircle } from 'lucide-react';
import { getRelativeTime } from '../../utils/helpers';
import Card from '../common/Card';

const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'attendance':
        return ClipboardCheck;
      case 'student':
        return UserPlus;
      case 'teacher':
        return Users;
      default:
        return CheckCircle;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'attendance':
        return 'bg-accent-50 text-accent-600';
      case 'student':
        return 'bg-success-50 text-success-600';
      case 'teacher':
        return 'bg-warning-50 text-warning-600';
      default:
        return 'bg-primary-50 text-primary-600';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <Card title="🔔 Recent Activity">
        <div className="text-center py-8 text-primary-500">
          No recent activity
        </div>
      </Card>
    );
  }

  return (
    <Card title="🔔 Recent Activity">
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);

          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary-900">{activity.message}</p>
                <p className="text-xs text-primary-500 mt-1">
                  {getRelativeTime(activity.time)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default RecentActivity;