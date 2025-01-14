import React from 'react';
import { Bell, Search, Home, Users, FileText, Activity } from 'lucide-react';
import MunicipalitySidebar from '../components/MunicipalitySidebar';

const MunicipalityDashboard = () => {
  return (
    <>
    <div className="flex">
    {/* Sidebar */}
    <div className="w-64 fixed h-screen">
      <MunicipalitySidebar/>
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
      {/* Main Content */}
      <main className="flex flex-col flex-1 p-6">
        {/* Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="p-4 bg-white shadow rounded-lg">
            <div className="flex items-center space-x-3">
              <Home size={24} className="text-blue-500" />
              <div>
                <h3 className="text-sm text-gray-500">Total Wards</h3>
                <p className="text-xl font-semibold">25</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white shadow rounded-lg">
            <div className="flex items-center space-x-3">
              <Users size={24} className="text-teal-500" />
              <div>
                <h3 className="text-sm text-gray-500">Registered Users</h3>
                <p className="text-xl font-semibold">1,250</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white shadow rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText size={24} className="text-yellow-500" />
              <div>
                <h3 className="text-sm text-gray-500">Reports Filed</h3>
                <p className="text-xl font-semibold">340</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white shadow rounded-lg">
            <div className="flex items-center space-x-3">
              <Activity size={24} className="text-red-500" />
              <div>
                <h3 className="text-sm text-gray-500">Active Issues</h3>
                <p className="text-xl font-semibold">15</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Dashboard Overview</h2>
          <p className="text-gray-600">
            Welcome to the Municipality Dashboard. Here, you can manage reports, track suggestions, and review community activity.
          </p>
        </section>
      </main>
    </div>
    </>
  );
};

export default MunicipalityDashboard;
