import React, { useState, useEffect } from 'react';
import { Search, Bell, MapPin, ThumbsUp, Calendar, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upvotedReports, setUpvotedReports] = useState([]);
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-500';
      case 'in progress':
        return 'bg-blue-500';
      case 'resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>;
      case 'in progress':
        return <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>;
      case 'resolved':
        return <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>;
    }
  };

  useEffect(() => {
    // Load upvoted reports from localStorage
    const savedUpvotes = JSON.parse(localStorage.getItem('upvotedReports') || '[]');
    setUpvotedReports(savedUpvotes);
    
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
        setReports(data.reports || []);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleUpvote = async (reportId) => {
    // Check if already upvoted
    if (upvotedReports.includes(reportId)) {
      return; // User has already upvoted this report
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Call your API to record the upvote
      const response = await fetch(`http://localhost:5555/api/report/upvote/${reportId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to upvote');
      }
      
      // Update local state for upvotes
      const newUpvotedReports = [...upvotedReports, reportId];
      setUpvotedReports(newUpvotedReports);
      localStorage.setItem('upvotedReports', JSON.stringify(newUpvotedReports));
      
      // Update the reports list with the new upvote count
      setReports(reports.map(report => 
        report.report_id === reportId 
          ? { ...report, upvotes: (report.upvotes || 0) + 1 } 
          : report
      ));
      
    } catch (err) {
      console.error('Error upvoting report:', err);
      alert('Failed to upvote. Please try again later.');
    }
  };

  const viewReportDetail = (reportId) => {
    navigate(`/reportdetail/${reportId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Reports</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search reports"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <img
                  src="https://imgs.search.brave.com/HxsIMbItz_dQivtNgeLvbI7egmwxBXRKDd4oXXF0V6c/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy90/aHVtYi9iL2I0L0xp/b25lbC1NZXNzaS1B/cmdlbnRpbmEtMjAy/Mi1GSUZBLVdvcmxk/LUN1cF8lMjhjcm9w/cGVkJTI5LmpwZy81/MTJweC1MaW9uZWwt/TWVzc2ktQXJnZW50/aW5hLTIwMjItRklG/QS1Xb3JsZC1DdXBf/JTI4Y3JvcHBlZCUy/OS5qcGc"
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
                <div>
                  <div className="font-medium">Kamesh</div>
                  <div className="text-xs text-gray-500">Citizen</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Recent Reports</h2>
              <div className="flex space-x-2">
                {/* Add filters if needed */}
                <button className="px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-sm font-medium hover:bg-gray-50 transition">
                  Filter
                </button>
                <button className="px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-sm font-medium hover:bg-gray-50 transition">
                  Sort by: Latest
                </button>
              </div>
            </div>
            
            {reports.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No Reports Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no reports available at the moment. Be the first to submit a new report!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {reports.map((report) => (
                  <div 
                    key={report.report_id} 
                    className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {report.photo ? (
                            <img
                              src={report.photo}
                              alt={report.title}
                              className="w-12 h-12 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {report.user?.user_name?.substring(0, 2) || 'AN'}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-900">{report.user?.user_name || 'Anonymous'}</h3>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-gray-500 text-sm flex items-center">
                                <Calendar size={14} className="mr-1" />
                                {new Date(report.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center mt-1">
                              {getStatusIcon(report.status)}
                              <span className="text-sm font-medium" style={{color: getStatusColor(report.status).replace('bg-', 'text-')}}>
                                {report.status || 'Unknown'}
                              </span>
                            </div>
                            
                            <h4 className="font-semibold text-gray-800 mt-3">{report.title}</h4>
                            <p className="text-gray-600 mt-1 line-clamp-2">{report.description}</p>
                            
                            <div className="flex items-center text-sm text-gray-500 mt-3">
                              <MapPin size={16} className="mr-1" />
                              <span>{report.municipality}, Ward {report.wardNumber}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-3">
                          <button 
                            onClick={() => handleUpvote(report.report_id)}
                            disabled={upvotedReports.includes(report.report_id)}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition ${
                              upvotedReports.includes(report.report_id)
                                ? 'bg-blue-50 text-blue-500'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <ThumbsUp size={16} className={upvotedReports.includes(report.report_id) ? 'fill-blue-500' : ''} />
                            <span>{report.upvotes || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => viewReportDetail(report.report_id)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Eye size={18} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {report.photos && report.photos.length > 0 && (
                      <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                        <div className="flex space-x-2 overflow-x-auto py-1 scrollbar-thin">
                          {report.photos.slice(0, 3).map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Report photo ${index + 1}`}
                              className="h-16 w-24 rounded object-cover flex-shrink-0"
                            />
                          ))}
                          {report.photos.length > 3 && (
                            <div className="h-16 w-24 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-600 font-medium">+{report.photos.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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