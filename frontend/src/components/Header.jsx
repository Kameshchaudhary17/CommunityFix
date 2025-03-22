import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import axios from "axios";

const Header = () => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:5555/api/auth/getcurrentuser", {
          headers: {
              'Authorization': `Bearer ${token}`
          }
      },{ withCredentials: true });
      console.log(response.data.user)
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
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
            <Link to="/profile">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.profilePicture || `http://localhost:5555/api/auth/${user}}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition"
                />
                <div>
                  <div className="font-medium">
                    {user ? user.user_name: "user_name"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role || "Citizen"}
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
