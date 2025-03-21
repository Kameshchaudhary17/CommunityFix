import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home as HomeIcon,
  MessageSquare,
  LineChart,
  Lightbulb,
  BookMarked,
  Info,
  History,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: <HomeIcon size={20} />, label: 'Home', path: '/home' },
    { icon: <MessageSquare size={20} />, label: 'Report Issue', path: '/report' },
    { icon: <LineChart size={20} />, label: 'My Report', path: '/myreport' },
    { icon: <Lightbulb size={20} />, label: 'Suggestion', path: '/suggestion' },
    { icon: <BookMarked size={20} />, label: 'My Suggestion', path: '/mysuggestion' },
    { icon: <Info size={20} />, label: 'About Community Fix', path: '/about' },
    { icon: <LogOut size={20} />, label: 'Logout', path: '/login' }
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-white shadow-lg p-4">
      {/* Logo */}
      <div className="flex items-center text-2xl font-bold text-blue-500 mb-8">
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
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
