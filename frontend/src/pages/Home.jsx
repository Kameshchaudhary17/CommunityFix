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
    <>
     <div className="flex">
      {/* Sidebar */}
      <div className="w-64 fixed h-screen">
        <Sidebar />
      </div>
      </div>
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Activities Section */}
      <h2 className="text-xl font-bold mb-4">Activities</h2>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <img
                  src={activity.avatar}
                  alt={activity.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-medium">{activity.name}</h3>
                  <h4 className="font-medium mt-1">{activity.title}</h4>
                  <p className="text-gray-600 mt-1">{activity.description}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <button className="flex items-center space-x-1 px-3 py-1 border rounded-full hover:bg-gray-100">
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
              <button className="text-blue-600 hover:text-blue-700">
                view detail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default Home;