import React from 'react';
import { Search, Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Home = () => {
  const activities = [
    {
      id: 1,
      name: "Lionel Messi",
      title: "Title",
      description: "Write description about the report.",
      status: "pending",
      votes: 0,
      avatar: "/api/placeholder/40/40"
    },
    {
      id: 2,
      name: "Neymar",
      title: "Title",
      description: "Write description about the report.",
      status: "in progress",
      votes: 0,
      avatar: "/api/placeholder/40/40"
    },
    {
      id: 3,
      name: "Ronaldo",
      title: "Title",
      description: "Write description about the report.",
      status: "resolved",
      votes: 0,
      avatar: "/api/placeholder/40/40"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-400';
      case 'in progress':
        return 'bg-blue-400';
      case 'resolved':
        return 'bg-green-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search people"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Bell size={24} className="text-gray-600" />
              <div className="flex items-center space-x-2">
                <img
                  src="https://imgs.search.brave.com/HxsIMbItz_dQivtNgeLvbI7egmwxBXRKDd4oXXF0V6c/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy90/aHVtYi9iL2I0L0xp/b25lbC1NZXNzaS1B/cmdlbnRpbmEtMjAy/Mi1GSUZBLVdvcmxk/LUN1cF8lMjhjcm9w/cGVkJTI5LmpwZy81/MTJweC1MaW9uZWwt/TWVzc2ktQXJnZW50/aW5hLTIwMjItRklG/QS1Xb3JsZC1DdXBf/JTI4Y3JvcHBlZCUy/OS5qcGc"
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">Kamesh</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Activities Section */}
            <h2 className="text-xl font-bold mb-6">Activities</h2>
            
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-white shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <img
                        src={activity.avatar}
                        alt={activity.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{activity.name}</h3>
                        <h4 className="font-medium text-gray-800 mt-1">{activity.title}</h4>
                        <p className="text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <button className="flex items-center space-x-1 px-3 py-1 border rounded-full hover:bg-gray-100 transition-colors duration-200">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 15l7-7 7 7" />
                            </svg>
                            <span>vote</span>
                          </button>
                          <div className={`px-2 py-1 rounded-full text-sm ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      View Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;