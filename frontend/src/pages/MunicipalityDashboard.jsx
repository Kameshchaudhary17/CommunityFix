import React, { useState, useEffect } from 'react';
import { Bell, Users, FileText, Activity, Loader, User } from 'lucide-react';
import MunicipalitySidebar from '../components/MunicipalitySidebar';
import MunicipalityHeader from '../components/MunicipalityHeader';
import MunicipalityNotification from '../components/MunicipalityNotification';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create a constant for the API base URL so it's easy to change
const API_BASE_URL = 'http://localhost:5555/api';

const MunicipalityDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const [dashboardStats, setDashboardStats] = useState({
    users: 0,
    reports: 0,
    activeIssues: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: '',
    profilePicture: ''
  });
  const [dataAvailable, setDataAvailable] = useState(true);

  // Get auth token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    return token;
  };

  // Helper function to check token
  const checkToken = () => {
    const token = getAuthToken();
    if (!token) {
      console.error('Authentication token not found');
      setTokenError('Authentication token not found. Please log in again.');
      return false;
    }
    return token;
  };

  // Fetch dashboard data when component mounts
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        setTokenError(null);

        const token = checkToken();
        if (!token) return;

        try {
          // Fetch user profile first to ensure authentication is working
          const profileResponse = await axios.get(
            `${API_BASE_URL}/auth/getmunicipalityuser`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          // Check if the response has users array
          if (profileResponse.data.users && profileResponse.data.users.length > 0) {
            const user = profileResponse.data.users[0]; // Get the first user from the array

            setUserProfile({
              name: user.user_name || 'Municipality User',
              profilePicture: user.profilePicture || ''
            });

            // Try to fetch the actual dashboard stats
            try {
              const statsResponse = await axios.get(
                `${API_BASE_URL}/dashboard/stats`,
                {
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );

              if (statsResponse.data.status === 'success') {
                setDashboardStats(statsResponse.data.data);
              } else {
                // Fallback: Create stats based on user data
                setDashboardStats({
                  users: profileResponse.data.count || 1,
                  reports: 0,
                  activeIssues: 0
                });
              }
            } catch (statsErr) {
              console.error('Error fetching stats:', statsErr);
              // Fallback: Create stats based on user data
              setDashboardStats({
                users: profileResponse.data.count || 1,
                reports: 0,
                activeIssues: 0
              });
            }

            // Try to fetch activities
            try {
              const activitiesResponse = await axios.get(
                `${API_BASE_URL}/dashboard/activities`,
                {
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );

              if (activitiesResponse.data.status === 'success') {
                setRecentActivities(activitiesResponse.data.data);
              } else {
                // Set empty activities array if no data
                setRecentActivities([]);
              }
            } catch (activitiesErr) {
              console.error('Error fetching activities:', activitiesErr);
              setRecentActivities([]);
            }
          } else {
            // Standard format expected by original code
            if (profileResponse.data.status === 'success' && profileResponse.data.user) {
              setUserProfile({
                name: profileResponse.data.user.user_name || 'Municipality User',
                profilePicture: profileResponse.data.user.profilePicture || ''
              });

              // Continue with normal flow from original code
              // Now fetch the stats and activities
              const statsResponse = await axios.get(
                `${API_BASE_URL}/dashboard/stats`,
                {
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );

              if (statsResponse.data.status === 'success') {
                setDashboardStats(statsResponse.data.data);
              }

              const activitiesResponse = await axios.get(
                `${API_BASE_URL}/dashboard/activities`,
                {
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );

              if (activitiesResponse.data.status === 'success') {
                setRecentActivities(activitiesResponse.data.data);
              }
            } else {
              // Instead of showing error, set data available flag to false
              setDataAvailable(false);
              console.log('No user profile data available. Using default values.');

              // Initialize with empty default values
              setUserProfile({
                name: 'Municipality User',
                profilePicture: ''
              });

              setDashboardStats({
                users: 0,
                reports: 0,
                activeIssues: 0
              });

              setRecentActivities([]);
            }
          }
        } catch (err) {
          console.error('API Error:', err);

          if (err.response) {
            // The request was made and the server responded with a status code
            if (err.response.status === 401) {
              setTokenError('Your session has expired. Please log in again.');
              localStorage.removeItem('token'); // Clear invalid token
            } else if (err.response.status === 403) {
              setError('You do not have permission to access this dashboard.');
            } else if (err.response.status === 404) {
              // Handle 404 errors gracefully
              setDataAvailable(false);
              console.log('Resource not found. Using default values.');

              // Initialize with empty default values
              setUserProfile({
                name: 'Municipality User',
                profilePicture: ''
              });

              setDashboardStats({
                users: 0,
                reports: 0,
                activeIssues: 0
              });

              setRecentActivities([]);
            } else {
              // Handle other errors without showing error messages directly to user
              setDataAvailable(false);
              console.error('Response error:', err.response.data);
            }
          } else if (err.request) {
            // The request was made but no response was received
            setError('No response from server. Please check your connection.');
          } else {
            // Something happened in setting up the request
            setError('Error setting up request. Please try again later.');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    // Redirect to login page
    navigate('/login');
  };

  // Handle refresh data
  const handleRefreshData = () => {
    setLoading(true);
    window.location.reload();
  };

  // Render user profile image with fallback
  const renderUserAvatar = (profilePicture, userName) => {
    if (profilePicture) {
      return (
        <img
          src={`http://localhost:5555/${profilePicture}`}
          alt={userName || 'User'}
          className="w-10 h-10 rounded-full object-cover mr-3"
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }

    // Fallback avatar
    return (
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3">
        <User size={20} />
      </div>
    );
  };

  // Show token error if present
  if (tokenError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-xl font-semibold mb-4">Authentication Error</div>
          <p className="text-gray-700 mb-6">{tokenError}</p>
          <button
            onClick={handleLoginRedirect}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <MunicipalitySidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <MunicipalityHeader />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="animate-spin text-blue-500" size={40} />
              <span className="ml-2 text-gray-600">Loading dashboard data...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-6xl mx-auto">
              <p>{error}</p>
              <button
                onClick={handleRefreshData}
                className="mt-2 px-4 py-2 bg-red-100 rounded-md hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* Show welcome message when no data available */}
              {!dataAvailable && (
                <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to the Municipality Dashboard</h2>
                  <p className="text-gray-600 mb-4">
                    Your dashboard is ready for use, but we don't have any data to display yet.
                    As your municipality generates reports and activities, they'll appear here.
                  </p>
                  <button
                    onClick={handleRefreshData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Refresh Dashboard
                  </button>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="bg-teal-50 p-3 rounded-lg">
                      <Users size={24} className="text-teal-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Registered Users</h3>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {dashboardStats.users !== undefined ? dashboardStats.users.toLocaleString() : '0'}
                      </p>
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
                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {dashboardStats.reports !== undefined ? dashboardStats.reports.toLocaleString() : '0'}
                      </p>
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
                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {dashboardStats.activeIssues !== undefined ? dashboardStats.activeIssues.toLocaleString() : '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>

                  {recentActivities.length === 0 ? (
                    <div className="py-8 text-center">
                      <Activity size={36} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No recent activities found.</p>
                      <p className="text-gray-400 text-sm mt-1">Activities will appear here as they occur.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-0">
                          <div className="flex items-start">
                            {/* User profile picture with fallback */}
                            {renderUserAvatar(
                              activity.user?.profilePicture,
                              activity.user?.name || 'User'
                            )}
                            {/* Hidden fallback element that will be shown if image fails to load */}
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3" style={{ display: 'none' }}>
                              <User size={20} />
                            </div>

                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{activity.title}</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <span>{formatDate(activity.date)}</span>
                                <span className="mx-2">•</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(activity.status)}`}>
                                  {activity.status}
                                </span>
                                <span className="mx-2">•</span>
                                <span>{activity.type}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors"
                      onClick={() => navigate('/suggestionmanagement')}
                    >
                      <FileText size={24} className="text-blue-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Manage Suggestion</span>
                    </button>

                    <button
                      className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors"
                      onClick={() => navigate('/user')}
                    >
                      <Users size={24} className="text-green-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">View Users</span>
                    </button>

                    <button
                      className="flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 p-4 rounded-lg transition-colors"
                      onClick={() => navigate('/reportmanagement')}
                    >
                      <Activity size={24} className="text-purple-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Track Issues</span>
                    </button>

                    {/* Replace the Bell button with our new component */}
                    <div className="flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg transition-colors">
                      <MunicipalityNotification />
                      <span className="text-sm font-medium text-gray-700 mt-2">Notifications</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MunicipalityDashboard;