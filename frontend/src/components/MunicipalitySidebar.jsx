import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  MessageSquare,
  Lightbulb,
  Users,
  History,
  LogOut
} from 'lucide-react';

const MunicipalitySidebar = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');

  const menuItems = [
    { icon: <LayoutGrid size={20} />, label: 'Dashboard', path: '/municipality' },
    { icon: <MessageSquare size={20} />, label: 'Report Management', path: '/reportmanagement' },
    { icon: <Lightbulb size={20} />, label: 'Manage Suggestion', path: '/suggestionmanagement' },
    { icon: <Users size={20} />, label: 'User Management', path: '/user' },
    { icon: <History size={20} />, label: 'History', path: '/history' },
    { icon: <LogOut size={20} />, label: 'Logout', path: '/login' }
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
                {activeItem === item.label && (
                  <div className="bg-blue-600 rounded-r"></div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default MunicipalitySidebar;
