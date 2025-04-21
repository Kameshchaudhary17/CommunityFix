import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  ChevronRight,
  Check,
  User,
  Trash2,
  RefreshCw,
  AlertCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import MunicipalitySidebar from '../components/Sidebar';
import MunicipalityHeader from '../components/Header';

const NotificationUser = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  
  const API_BASE_URL = "http://localhost:5555";
  const token = localStorage.getItem('token');

  // Set up socket connection
  useEffect(() => {
    if (token) {
      try {
        const newSocket = io('http://localhost:5555', {
          auth: {
            token: token 
          },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
        
        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
        });
        
        setSocket(newSocket);
        
        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    }
  }, [token]);

  // Set up socket event listeners
  useEffect(() => {
    if (socket) {
      // Listen for new notifications
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });
      
      // Cleanup listeners
      return () => {
        socket.off('new_notification');
      };
    }
  }, [socket]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/notification/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Handle different response formats
        const notificationsData = response.data.data || response.data;
        
        if (Array.isArray(notificationsData)) {
          setNotifications(notificationsData);
        } else {
          console.error("Unexpected notifications format:", notificationsData);
          setNotifications([]);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setError("Failed to load notifications. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [token, navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'REPORT_STATUS_CHANGED':
        return <Clock className="text-blue-500" size={18} />;
      case 'NEW_COMMENT':
        return <ChevronRight className="text-green-500" size={18} />;
      case 'SUGGESTION_STATUS_CHANGED':
        return <Clock className="text-purple-500" size={18} />;
      case 'NEW_UPVOTE':
        return <Check className="text-yellow-500" size={18} />;
      case 'ACCOUNT_VERIFIED':
        return <Check className="text-green-500" size={18} />;
      default:
        return <Bell className="text-gray-500" size={18} />;
    }
  };

  // Get notification link based on type
  const getNotificationLink = (notification) => {
    if (notification.reportId) {
      return `/reportmanagement/${notification.reportId}`;
    } else if (notification.suggestionId) {
      return `/suggestionmanagement/${notification.suggestionId}`;
    } else {
      return '#';
    }
  };

  // Mark notification as read - FIXED to match router implementation
  const markAsRead = async (e, notificationId) => {
    e.preventDefault(); // Prevent navigation when clicking notification
    e.stopPropagation(); // Prevent event bubbling
    
    try {
      if (socket && socket.connected) {
        // Use socket to mark as read
        socket.emit('mark_notification_read', notificationId);
        
        // Update UI immediately
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? {...n, isRead: true} : n)
        );
        
        // No need to update count as the socket will emit 'unread_count'
      } else {
        // Fallback to API if socket not available
        // Try both endpoint patterns
        try {
          await axios.patch(`${API_BASE_URL}/api/notification/${notificationId}/read`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          // Try alternate endpoint
          await axios.patch(`${API_BASE_URL}/api/notification/${notificationId}/read`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
        
        // Update notifications state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? {...n, isRead: true} : n)
        );
        
        // Update count manually
        setNotificationCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read - FIXED to match router implementation
  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/notification/notifications/mark-all-read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update UI
      setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete notification - FIXED to match router implementation
  const deleteNotification = async (notificationId) => {
    try {
      setDeleteLoading(true);
      await axios.delete(`${API_BASE_URL}/api/notification/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update UI
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
      if (error.response && error.response.data) {
        console.error("Server error details:", error.response.data);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Delete multiple notifications - FIXED to match router implementation
  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;
    
    setDeleteLoading(true);
    try {
      // Delete each selected notification
      for (const notificationId of selectedNotifications) {
        await axios.delete(`${API_BASE_URL}/api/notification/notifications/${notificationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Update UI
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Error deleting selected notifications:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  // Toggle select all notifications
  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedNotifications(notifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    setLoading(true);
    setNotifications([]);
    setSelectedNotifications([]);
    setSelectAll(false);
    
    // Re-fetch notifications
    axios.get(`${API_BASE_URL}/api/notification/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      const notificationsData = response.data.data || response.data;
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData);
      }
      setLoading(false);
    })
    .catch(error => {
      console.error("Error refreshing notifications:", error);
      setError("Failed to refresh notifications. Please try again.");
      setLoading(false);
    });
  };

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
          <div className="max-w-4xl mx-auto">
            {/* Header with actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <button 
                  onClick={() => navigate(-1)} 
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-semibold text-gray-800">Notifications</h1>
                {notifications.length > 0 && (
                  <span className="ml-3 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={refreshNotifications}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  disabled={loading}
                  aria-label="Refresh notifications"
                >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
                
                {notifications.length > 0 && (
                  <>
                    <button 
                      onClick={markAllAsRead}
                      className="text-sm px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                      disabled={!notifications.some(n => !n.isRead)}
                    >
                      Mark all as read
                    </button>
                    
                    {selectedNotifications.length > 0 ? (
                      <button 
                        onClick={deleteSelectedNotifications}
                        className="text-sm px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-md transition flex items-center"
                        disabled={deleteLoading}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete {selectedNotifications.length === notifications.length ? "all" : selectedNotifications.length}
                      </button>
                    ) : (
                      <button 
                        onClick={toggleSelectAll}
                        className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition"
                      >
                        Select all
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="animate-spin text-blue-500 mr-2" size={24} />
                  <span className="text-gray-600">Loading notifications...</span>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-12 flex-col">
                  <AlertCircle className="text-red-500 mb-2" size={32} />
                  <p className="text-red-600">{error}</p>
                  <button 
                    onClick={refreshNotifications}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="text-gray-300 mb-4" size={40} />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">No notifications yet</h3>
                  <p className="text-gray-500">When you receive notifications, they will appear here</p>
                </div>
              ) : (
                <>
                  {/* Table Header (when items are selected) */}
                  {selectedNotifications.length > 0 && (
                    <div className="flex items-center justify-between bg-blue-50 px-6 py-3 border-b border-blue-100">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectAll} 
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {selectedNotifications.length} selected
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedNotifications([])}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {/* Notifications List */}
                  <ul className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <li key={notification.id} className={`relative ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                        <div className="flex items-center px-6 py-4">
                          {/* Checkbox */}
                          <div className="mr-4 flex-shrink-0">
                            <input 
                              type="checkbox" 
                              checked={selectedNotifications.includes(notification.id)}
                              onChange={() => toggleNotificationSelection(notification.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                          
                          {/* Icon */}
                          <div className="mr-4 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          {/* Content */}
                          <Link 
                            to={getNotificationLink(notification)}
                            className="flex-1 flex flex-col"
                            onClick={(e) => {
                              if (!notification.isRead) {
                                markAsRead(e, notification.id);
                              }
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                              <p className={`text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                                {notification.content}
                              </p>
                              <span className="text-xs text-gray-500 mt-1 sm:mt-0">
                                {formatDate(notification.createdAt)}
                              </span>
                            </div>
                            
                            {notification.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {notification.description}
                              </p>
                            )}
                          </Link>
                          
                          {/* Actions */}
                          <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                            {!notification.isRead && (
                              <button 
                                onClick={(e) => markAsRead(e, notification.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition"
                              title="Delete notification"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationUser;