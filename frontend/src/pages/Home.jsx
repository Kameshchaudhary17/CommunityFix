import React, { useState, useEffect } from 'react';
import { MapPin, ThumbsUp, Calendar, Eye, SortDesc } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Hearder from '../components/Header';
import { useNavigate } from 'react-router-dom';

// Status Filter component
const StatusFilter = ({ value, onChange }) => {
  return (
    <select 
      value={value} 
      onChange={onChange}
      className="px-3 py-2 rounded-lg border border-gray-300 bg-white"
    >
      <option value="all">All Status</option>
      <option value="pending">Pending</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
  );
};

const Home = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upvotedReports, setUpvotedReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>;
      case 'in_progress':
        return <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>;
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>;
    }
  };

  // Fetch reports from the server
  const fetchReports = async () => {
    try {
      setIsLoading(true);
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
      
      // Store the reports
      let fetchedReports = data.reports || [];
      
      // Now fetch upvote counts for each report
      await Promise.all(fetchedReports.map(async (report) => {
        try {
          const upvoteRes = await fetch(`http://localhost:5555/api/upvote/${report.report_id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (upvoteRes.ok) {
            const upvoteData = await upvoteRes.json();
            report.upvotes = upvoteData.upvotes;
          }
        } catch (err) {
          console.error(`Error fetching upvotes for report ${report.report_id}:`, err);
          // Don't fail the entire process for one upvote fetch failure
          report.upvotes = report.upvotes || 0;
        }
      }));
      fetchedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(fetchedReports);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load upvoted reports from localStorage
    const savedUpvotes = JSON.parse(localStorage.getItem('upvotedReports') || '[]');
    setUpvotedReports(savedUpvotes);
    
    // Fetch reports with upvote counts
    fetchReports();
  }, []);

  const handleUpvote = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Call your API to toggle the upvote (add or remove)
      const response = await fetch(`http://localhost:5555/api/upvote/${reportId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle upvote');
      }
      
      const data = await response.json();
      
      // Check if the user has upvoted or removed the upvote
      const isUpvoted = upvotedReports.includes(reportId);
      let newUpvotedReports;
      
      if (isUpvoted) {
        // If the report was already upvoted, remove it from upvotedReports
        newUpvotedReports = upvotedReports.filter(id => id !== reportId);
      } else {
        // If the report was not upvoted, add it to upvotedReports
        newUpvotedReports = [...upvotedReports, reportId];
      }
      
      // Update localStorage and state with the new upvoted reports
      setUpvotedReports(newUpvotedReports);
      localStorage.setItem('upvotedReports', JSON.stringify(newUpvotedReports));
      
      // Update the reports list with the new upvote count from the server response
      setReports(reports.map(report => 
        report.report_id === reportId 
          ? { ...report, upvotes: data.upvotes } 
          : report
      ));
      
    } catch (err) {
      console.error('Error toggling upvote:', err);
      alert('Failed to process upvote. Please try again later.');
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
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter reports based on status and search query
  const filteredSuggestions = reports.filter(report => {
    const matchesStatus = statusFilter === 'all' || 
                          (report.status?.toLowerCase() === statusFilter.toLowerCase());
    const matchesSearch = !searchQuery || 
                          report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Hearder />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800">Recent Reports</h2>
            {/* Filter controls */}
            <div className="mb-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {filteredSuggestions.length} report{filteredSuggestions.length !== 1 ? 's' : ''}
              </div>
              
              <div className="flex gap-2">
                <StatusFilter 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
                
                <button className="px-3 py-2 rounded-lg border border-gray-300 flex items-center hover:bg-gray-50">
                  <SortDesc size={16} className="mr-1" />
                  <span>Sort</span>
                </button>
              </div>
            </div>
            
            {filteredSuggestions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No Reports Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no reports available at the moment. Be the first to submit a new report!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredSuggestions.map((report) => (
                  <div 
                    key={report.report_id} 
                    className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {report.user?.profilePicture ? (
                            <img
                              src={`http://localhost:5555/${report.user.profilePicture}`}
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
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center mt-1">
                              {getStatusIcon(report.status)}
                              <span className="text-sm font-medium">
                                {report.status || 'Unknown'}
                              </span>
                            </div>
                            
                            <h4 className="font-semibold text-gray-800 mt-3">{report.title}</h4>
                            <p className="text-gray-600 mt-1 line-clamp-2">{report.description}</p>
                            
                            <div className="flex items-center text-sm text-gray-500 mt-3">
                              <MapPin size={16} className="mr-1" />
                              <span>{report.municipality || 'Unknown'}, Ward {report.wardNumber || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-3">
                          <button 
                            onClick={() => handleUpvote(report.report_id)}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition ${
                              upvotedReports.includes(report.report_id)
                                ? 'bg-blue-50 text-blue-500'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <ThumbsUp 
                              size={16} 
                              className={upvotedReports.includes(report.report_id) ? 'fill-blue-500' : ''} 
                            />
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