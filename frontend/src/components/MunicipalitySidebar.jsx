import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  MessageSquare,
  Lightbulb,
  Users,
  LogOut
} from 'lucide-react';

const MunicipalitySidebar = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const navigate = useNavigate();

  // ✅ Move the token check inside useEffect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('upvotedReports');
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', path: '/municipality' },
    { icon: <MessageSquare size={20} />, label: 'Report Management', path: '/reportmanagement' },
    { icon: <Lightbulb size={20} />, label: 'Manage Suggestion', path: '/suggestionmanagement' },
    { icon: <Users size={20} />, label: 'User Management', path: '/user' },
    { icon: <LogOut size={20} />, label: 'Logout', path: null, onClick: handleLogout }
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-white p-4 border-r">
      {/* Logo */}
      <div className="flex items-center text-2xl md:text-2xl font-bold text-blue-500 mb-8">
        Community
        <span className="text-teal-500">Fix</span>
        <div className="w-8 h-8 ml-2 rounded-full border-2 border-teal-500 flex items-center justify-center">
          🌍
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.path ? (
                <Link
                  to={item.path}
                  onClick={() => setActiveItem(item.label)}
                  className={`flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg transition-all duration-200 relative ${
                    activeItem === item.label ? 'text-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              ) : (
                <button
                  onClick={item.onClick}
                  className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg transition-all duration-200 w-full text-left"
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default MunicipalitySidebar;
