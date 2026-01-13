import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, BookPlus, UserCheck, FileBarChart } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Add Students',
      icon: UserPlus,
      onClick: () => navigate('/students'),
      variant: 'primary',
    },
    {
      label: 'Add Subject',
      icon: BookPlus,
      onClick: () => navigate('/subjects'),
      variant: 'secondary',
    },
    {
      label: 'Approve Teachers',
      icon: UserCheck,
      onClick: () => navigate('/teachers'),
      variant: 'secondary',
    },
    {
      label: 'View Reports',
      icon: FileBarChart,
      onClick: () => navigate('/reports'),
      variant: 'secondary',
    },
  ];

  return (
    <Card title="⚡ Quick Actions">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            icon={action.icon}
            onClick={action.onClick}
            fullWidth
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;