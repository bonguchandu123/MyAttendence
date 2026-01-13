import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  UserCheck, 
  Calendar, 
  ClipboardCheck,
  FileText
} from 'lucide-react';
import { classNames } from '../../utils/helpers';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Subjects', path: '/subjects', icon: BookOpen },
    { name: 'Teachers', path: '/teachers', icon: UserCheck },
    { name: 'Schedules', path: '/schedules', icon: Calendar },
    { name: 'Attendance', path: '/attendance', icon: ClipboardCheck },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-primary-200 min-h-screen sticky top-16">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth',
                isActive
                  ? 'bg-primary-900 text-white'
                  : 'text-primary-700 hover:bg-primary-50'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;