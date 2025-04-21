import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, X, Check, ChevronRight, Clock, User } from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";

const Header = (props) => {
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [socket, setSocket] = useState(null);
  
  const API_BASE_URL = "http://localhost:5555";
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('search') || '';
    setSearchQuery(query);
  }, [location]);

  // Set up socket connection when component mounts
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
        setNotificationCount(prevCount => prevCount + 1);
      });
      
      // Listen for unread count updates
      socket.on('unread_count', (count) => {
        setNotificationCount(count);
      });
      
      // Cleanup listeners when component unmounts or socket changes
      return () => {
        socket.off('new_notification');
        socket.off('unread_count');
      };
    }
  }, [socket]);
  
  // Close notification popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/getcurrentuser`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/notification/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Check if data is in the expected format with data property
        const notificationsData = response.data.data || response.data;
        
        // Ensure we're working with an array
        if (Array.isArray(notificationsData)) {
          setNotifications(notificationsData);
          // Count unread notifications
          const unreadCount = notificationsData.filter(notif => !notif.isRead).length;
          setNotificationCount(unreadCount);
        } else {
          console.error("Notifications data is not an array:", notificationsData);
          setNotifications([]);
          setNotificationCount(0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Try alternate endpoint if the first one fails
        try {
          const response = await axios.get(`${API_BASE_URL}/api/notification/notifications`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Check if data is in the expected format
          const notificationsData = response.data.data || response.data;
          
          // Ensure we're working with an array
          if (Array.isArray(notificationsData)) {
            setNotifications(notificationsData);
            const unreadCount = notificationsData.filter(notif => !notif.isRead).length;
            setNotificationCount(unreadCount);
          } else {
            console.error("Notifications data is not an array:", notificationsData);
            setNotifications([]);
            setNotificationCount(0);
          }
        } catch (fallbackError) {
          console.error("Also failed with fallback endpoint:", fallbackError);
          setNotifications([]);
          setNotificationCount(0);
        }
      }
    };
    
    if (token) {
      fetchUser();
      fetchNotifications();
    }
  }, [token]);

  const handleNotificationClick = (e) => {
    e.preventDefault();
    setShowNotifications(!showNotifications);
  };
  
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
  
  const handleNotificationNavigation = (path) => {
    setShowNotifications(false);
    // Navigation will happen via Link component
  };
  
  const markAllAsRead = async () => {
    try {
      if (socket && socket.connected) {
        // Use socket to mark all as read
        socket.emit('mark_all_read');
        
        // Update UI immediately
        setNotifications(prev => 
          prev.map(n => ({...n, isRead: true}))
        );
        
        // No need to update count as the socket will emit 'unread_count'
      } else {
        // Fallback to API if socket not available
        try {
          await axios.patch(`${API_BASE_URL}/api/notification/notifications/read-all`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          // Try alternate endpoint
          await axios.patch(`${API_BASE_URL}/api/notification/mark-all-read`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
        
        // Update notifications state
        setNotifications(prev => 
          prev.map(n => ({...n, isRead: true}))
        );
        
        // Set count to zero
        setNotificationCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };
  
  // Get notification link based on type
  const getNotificationLink = (notification) => {
    if (notification.reportId) {
      return `/myreport/${notification.reportId}`;
    } else if (notification.suggestionId) {
      return `/mysuggestion/${notification.suggestionId}`;
    } else {
      return '#';
    }
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
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to the reports page with search query
      navigate(`/home?search=${encodeURIComponent(searchQuery.trim())}`);
      
      // Call the onSearch prop if provided
      if (props.onSearch) {
        props.onSearch(searchQuery.trim());
      }
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    
    // Also call onSearch with empty string if provided
    if (props.onSearch) {
      props.onSearch('');
    }
    
    // Navigate to home without search query
    navigate('/home');
  };
  
  // Handle key press for search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };
  
  // Render user avatar - either actual image or fallback
  const renderUserAvatar = () => {
    // If there's a profile picture URL and no error loading it
    if (user?.profilePicture && !profileImageError) {
      return (
        <img
          src={`${API_BASE_URL}/${user.profilePicture}`}
          alt="Profile"
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition"
          onError={() => setProfileImageError(true)}
        />
      );
    }
    
    // Show fallback avatar with user's initials or icon
    return (
      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
        {user?.user_name ? (
          user.user_name.charAt(0).toUpperCase()
        ) : (
          <User size={20} />
        )}
      </div>
    );
  };

  return (
    <div>
    <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search reports"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
                onClick={handleNotificationClick}
                aria-label="Show notifications"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Popup */}
              {showNotifications && (
                <div 
                  ref={notificationRef}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200"
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-semibold">Notifications</h3>
                    {notificationCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="relative">
                          <Link
                            to={getNotificationLink(notification)}
                            className={`block border-b border-gray-100 hover:bg-gray-50 transition duration-150 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                            onClick={() => handleNotificationNavigation(getNotificationLink(notification))}
                          >
                            <div className="flex items-start p-3">
                              <div className="flex-shrink-0 mr-3 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm mb-1">{notification.content}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(notification.createdAt).toLocaleDateString('en-US', { 
                                    day: 'numeric', 
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <button 
                                  className="absolute right-2 top-2 w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center"
                                  onClick={(e) => markAsRead(e, notification.id)}
                                  title="Mark as read"
                                >
                                  <Check size={14} className="text-blue-600" />
                                </button>
                              )}
                            </div>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-gray-200 text-center">
                    <Link to="/notificationuser" className="text-sm text-blue-600 hover:text-blue-800" onClick={() => setShowNotifications(false)}>
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <Link to="/profile">
              <div className="flex items-center space-x-3">
                {renderUserAvatar()}
                <div>
                  <div className="font-medium">
                    {user ? user.user_name : "User"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {"Citizen"}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;