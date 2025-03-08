import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [activeItem, setActiveItem] = useState('Home');

  const menuItems = [
    { icon: <HomeIcon size={20} />, label: 'Home', path: '/home' },
    { icon: <MessageSquare size={20} />, label: 'Report Issue', path: '/report' },
    { icon: <LineChart size={20} />, label: 'Track Issue', path: '/track-issue' },
    { icon: <Lightbulb size={20} />, label: 'Suggestion', path: '/suggestion' },
    { icon: <BookMarked size={20} />, label: 'My Suggestion', path: '/my-suggestion' },
    { icon: <Info size={20} />, label: 'About Community Fix', path: '/about' },
    { icon: <History size={20} />, label: 'History', path: '/history' },
    { icon: <LogOut size={20} />, label: 'Logout', path: '/logout' }
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-white p-4">
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
                  <div className="absolute -left-3 top-0 w-1 h-full bg-blue-600 rounded-l"></div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Submit Button */}
      <button className="w-full bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors duration-200 mt-4" >
        Submit your Suggestion
      </button>
    </div>
  );
};

export default Sidebar;
