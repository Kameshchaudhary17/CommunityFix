import React, { useState } from 'react';
import { Home, Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState('/admin');

  const menuItems = [
    { icon: <Home size={20} />, name: 'Dashboard', path: '/admin' },
    { icon: <Building2 size={20} />, name: 'Manage Municipality', path: '/register' },
  ];

  const handleNavigation = (path) => {
    setActivePath(path);
    navigate(path); // Navigate to the selected path
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear authentication token
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-white p-4 border-r">
      <div className="flex items-center text-2xl md:text-2xl font-bold text-blue-500 mb-8">
        Community
        <span className="text-teal-500">Fix</span>
        <div className="w-8 h-8 ml-2 rounded-full border-2 border-teal-500 flex items-center justify-center">
          🌍
        </div>
      </div>

      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <div
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`
              flex items-center gap-3 px-6 py-3 cursor-pointer
              transition-colors duration-200
              ${activePath === item.path 
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.name}</span>
          </div>
        ))}
      </nav>

      <div 
        onClick={handleLogout}
        className="flex items-center gap-3 px-6 py-3 text-gray-700 
                   hover:bg-gray-100 cursor-pointer border-t border-gray-200"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">Logout</span>
      </div>
    </div>
  );
};

export default AdminSidebar;
