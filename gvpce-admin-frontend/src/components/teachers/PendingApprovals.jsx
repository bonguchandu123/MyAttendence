import React from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { formatDate, getDepartmentFullName } from '../../utils/helpers';
import Card from '../common/Card';
import Button from '../common/Button';

const PendingApprovals = ({ teachers, onApprove, onReject }) => {
  if (!teachers || teachers.length === 0) {
    return (
      <Card title="⏳ Pending Approvals">
        <div className="text-center py-8 text-primary-500">
          No pending teacher approvals
        </div>
      </Card>
    );
  }

  return (
    <Card title={`⏳ Pending Approvals (${teachers.length})`}>
      <div className="space-y-4">
        {teachers.map((teacher) => (
          <div
            key={teacher._id}
            className="bg-warning-50 rounded-lg border border-warning-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-primary-900 mb-1">
                  👤 {teacher.name}
                </h3>
                <p className="text-sm text-primary-700">
                  📧 {teacher.email}
                </p>
                <p className="text-sm text-primary-700">
                  📱 {teacher.phone}
                </p>
                <p className="text-sm text-primary-700">
                  🏢 Department: <span className="font-medium">{getDepartmentFullName(teacher.department)}</span>
                </p>
                <p className="text-xs text-primary-500 mt-2">
                  Registered: {formatDate(teacher.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle}
                onClick={() => onApprove(teacher)}
              >
                ✅ Approve
              </Button>
              <Button
                variant="error"
                size="sm"
                icon={XCircle}
                onClick={() => onReject(teacher)}
              >
                ❌ Reject
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Eye}
              >
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PendingApprovals;