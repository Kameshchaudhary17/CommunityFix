import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const MunicipalityNotification = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const token = localStorage.getItem('token');
  const [socket, setSocket] = useState(null);
  
  const API_BASE_URL = "http://localhost:5555";
  
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
      // Listen for unread count updates
      socket.on('unread_count', (count) => {
        setNotificationCount(count);
      });
      
      // Cleanup listeners when component unmounts or socket changes
      return () => {
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

  // Fetch notification count on component mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/notification/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && typeof response.data.count === 'number') {
          setNotificationCount(response.data.count);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
        // Try alternate endpoint if the first one fails
        try {
          const response = await axios.get(`${API_BASE_URL}/api/notification/notifications`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Check if data is in the expected format
          const notificationsData = response.data.data || response.data;
          
          // Ensure we're working with an array and count unread notifications
          if (Array.isArray(notificationsData)) {
            const unreadCount = notificationsData.filter(notif => !notif.isRead).length;
            setNotificationCount(unreadCount);
          }
        } catch (fallbackError) {
          console.error("Also failed with fallback endpoint:", fallbackError);
        }
      }
    };
    
    fetchNotificationCount();
  }, [token]);

  const handleNotificationClick = (e) => {
    e.preventDefault();
    setShowNotifications(!showNotifications);
  };

  return (
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
      
      {/* Simple notification popup */}
      {showNotifications && (
        <div 
          ref={notificationRef}
          className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200"
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="font-semibold">Notifications</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              {notificationCount}
            </span>
          </div>
          
          
          
          <div className="p-3 border-t border-gray-200 text-center">
            <Link 
              to="/notification" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium" 
              onClick={() => setShowNotifications(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalityNotification;