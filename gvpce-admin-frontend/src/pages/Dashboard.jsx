import React, { useState, useEffect } from 'react';
import { Users, UserCheck, BookOpen, Calendar, TrendingUp, Clock } from 'lucide-react';
import { dashboardAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getActivity(5),
      ]);

      setStats(statsRes.data.data);
      setActivities(activityRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">📊 Dashboard Overview</h1>
        <p className="text-primary-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="👥 Students"
          value={stats?.students?.total || 0}
          icon={Users}
          trend="up"
          trendValue={`+${stats?.students?.new || 0} new`}
          color="primary"
        />
        <StatCard
          title="👨‍🏫 Teachers"
          value={stats?.teachers?.total || 0}
          icon={UserCheck}
          trend="up"
          trendValue={`+${stats?.teachers?.new || 0} new`}
          color="success"
        />
        <StatCard
          title="📚 Subjects"
          value={stats?.subjects?.total || 0}
          icon={BookOpen}
          trend="up"
          trendValue={`+${stats?.subjects?.new || 0} new`}
          color="accent"
        />
        <StatCard
          title="📅 Today"
          value={formatDate(stats?.today || new Date())}
          icon={Calendar}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="📈 Quick Stats">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-900">Overall Attendance</p>
                  <p className="text-xs text-primary-600">All branches combined</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-primary-900">
                {stats?.attendance?.overall || 0}%
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-success-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-900">Attendance Today</p>
                  <p className="text-xs text-primary-600">Current day statistics</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-primary-900">
                {stats?.attendance?.today || 0}%
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-warning-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Clock className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-900">Active Sessions</p>
                  <p className="text-xs text-primary-600">Classes in progress</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-primary-900">
                {stats?.activeSessions || 0}
              </p>
            </div>

            {stats?.pendingApprovals > 0 && (
              <div className="flex items-center justify-between p-4 bg-error-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-error-100 rounded-lg">
                    <UserCheck className="w-5 h-5 text-error-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-900">Pending Approvals</p>
                    <p className="text-xs text-primary-600">Teacher registrations</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary-900">
                  {stats?.pendingApprovals}
                </p>
              </div>
            )}
          </div>
        </Card>

        <RecentActivity activities={activities} />
      </div>

      <QuickActions />
    </div>
  );
};

export default Dashboard;