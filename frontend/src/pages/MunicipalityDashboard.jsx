import React from 'react';
import { Bell, Search, Home, Users, FileText, Activity } from 'lucide-react';
import MunicipalitySidebar from '../components/MunicipalitySidebar';

const MunicipalityDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <MunicipalitySidebar className="w-64 flex-shrink-0" />

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
          <div className="max-w-6xl mx-auto">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Home size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Wards</h3>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">25</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-teal-50 p-3 rounded-lg">
                    <Users size={24} className="text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Registered Users</h3>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">1,250</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <FileText size={24} className="text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Reports Filed</h3>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">340</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <Activity size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Active Issues</h3>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">15</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
                <p className="text-gray-600">
                  Track and manage the latest activities and reports from your community members.
                  Stay updated with real-time notifications and status changes.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <p className="text-gray-600">
                  Access frequently used tools and features to manage your municipality's reports,
                  review suggestions, and respond to community needs efficiently.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MunicipalityDashboard;