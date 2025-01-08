import React from 'react';
import { 
  Home,
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
    { icon: <Home size={20} />, label: 'Home' },
    { icon: <MessageSquare size={20} />, label: 'Report Issue' },
    { icon: <LineChart size={20} />, label: 'Track Issue' },
    { icon: <Lightbulb size={20} />, label: 'Suggestion' },
    { icon: <BookMarked size={20} />, label: 'My Suggestion' },
    { icon: <Info size={20} />, label: 'About Community Fix' },
    { icon: <History size={20} />, label: 'History' },
    { icon: <LogOut size={20} />, label: 'Logout' }
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-white p-4">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src="/api/placeholder/150/50" 
          alt="Community Fix Logo" 
          className="w-36"
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className="flex items-center space-x-3 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Submit Button */}
      <button className="w-full bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors duration-200 mt-4">
        Submit your Suggestion
      </button>
    </div>
  );
};

export default Sidebar;