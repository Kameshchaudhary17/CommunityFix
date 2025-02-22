import React, { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Home = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5555/api/report/getReport', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        setReports(data.reports || []); // Ensure we correctly extract reports
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []); // If needed, add `[token]` as dependency

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

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
                placeholder="Search reports"
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
            <h2 className="text-xl font-bold mb-6">Recent Reports</h2>
            
            {reports.length === 0 ? (
              <div className="text-center text-gray-500">
                No reports found
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div 
                    key={report.report_id} 
                    className="bg-white shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {report.photo ? (
                          <img
                            src={report.photo}
                            alt={report.title}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">NP</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{report.user?.user_name || 'Anonymous'}</h3>
                          <h4 className="font-medium text-gray-800 mt-1">{report.title}</h4>
                          <p className="text-gray-600 mt-1">{report.description}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">Location:</span>
                              <span className="text-gray-800">
                                {report.municipality}, Ward {report.wardNumber}
                              </span>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-sm text-white ${getStatusColor(report.status)}`}>
                              {report.status}
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
