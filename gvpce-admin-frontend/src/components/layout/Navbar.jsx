import React, { useState } from 'react';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <nav className="bg-white border-b border-primary-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-900">GVPCE Admin Panel</h1>
              <p className="text-xs text-primary-600">Attendance Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-smooth">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-primary-900 hover:bg-primary-50 rounded-lg transition-smooth"
              >
                <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-700" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-primary-600">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-primary-600" />
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-primary-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-primary-200">
                      <p className="text-sm font-medium text-primary-900">Admin</p>
                      <p className="text-xs text-primary-600 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-smooth"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;