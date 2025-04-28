import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  MessageSquare,
  LineChart,
  Lightbulb,
  BookMarked,
  History,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

const token = localStorage.getItem('token')

if(!token) navigate('/login')

  const handleLogout = () => {
    // Remove all relevant items from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('upvotedReports');
    
    // Redirect to login page
    navigate('/login');
  };

  const menuItems = [
    { icon: <HomeIcon size={20} />, label: 'Home', path: '/home' },
    { icon: <MessageSquare size={20} />, label: 'Report Issue', path: '/report' },
    { icon: <LineChart size={20} />, label: 'My Report', path: '/myreport' },
    { icon: <Lightbulb size={20} />, label: 'Suggestion', path: '/suggestion' },
    { icon: <BookMarked size={20} />, label: 'My Suggestion', path: '/mysuggestion' },
    // Logout is handled differently, so we'll set path to null
    { icon: <LogOut size={20} />, label: 'Logout', path: null, onClick: handleLogout }
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
              {item.path ? (
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
              ) : (
                <button
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;