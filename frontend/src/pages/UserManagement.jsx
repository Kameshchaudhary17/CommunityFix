import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Search, Filter, ChevronDown, ChevronUp, RefreshCw, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import MunicipalitySidebar from '../components/MunicipalitySidebar';
import axios from 'axios';

const UserManagement = () => {
  // State for users data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for search, filters, and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5555/api/auth/getmunicipalityuser', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.users) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again later.');
      setLoading(false);
      toast.error('Error fetching users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // View user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  // Update user status functions
  const updateUserStatus = async (userId, status) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5555/api/auth/verify-status`, 
        { userId, status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh the user list after updating status
      await fetchUsers();
      
      setIsLoading(false);
      toast.success(`User ${status.toLowerCase()}ed successfully`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} user`);
      setIsLoading(false);
      toast.error(`Failed to ${status.toLowerCase()} user`);
      throw err;
    }
  };

  // Handler functions for the status update operations
  const handleApproveUser = async (userId) => {
    return updateUserStatus(userId, "ACCEPT");
  };

  const handleRejectUser = async (userId) => {
    return updateUserStatus(userId, "REJECT");
  };

  const handleResetStatus = async (userId) => {
    return updateUserStatus(userId, "PENDING");
  };

  // Delete user
  const openDeleteConfirm = (user) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://localhost:5555/api/auth/users/${userToDelete.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh the user list
      await fetchUsers();
      
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
      setIsLoading(false);
      toast.success('User deleted successfully');
      
      // If the deleted user is currently being viewed, close the detail modal
      if (isUserDetailOpen && selectedUser && selectedUser.user_id === userToDelete.user_id) {
        setIsUserDetailOpen(false);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setIsLoading(false);
      toast.error('Failed to delete user');
    }
  };

  // Filter users based on search term and status filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.citizenshipNumber?.includes(searchTerm) ||
      user.contact?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || getStatusText(user.isVerified) === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Get status badge class
  const getStatusBadgeClass = (isVerified) => {
    if (isVerified === "PENDING") return 'bg-yellow-100 text-yellow-800';
    if (isVerified === "ACCEPT") return 'bg-green-100 text-green-800';
    if (isVerified === "REJECT") return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  // Get status text
  const getStatusText = (isVerified) => {
    if (isVerified === "PENDING") return 'Pending';
    if (isVerified === "ACCEPT") return 'Approved';
    if (isVerified === "REJECT") return 'Rejected';
    return 'Pending';
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 md:flex-row">
        <MunicipalitySidebar className="w-full md:w-64 flex-shrink-0" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto py-8">
            <div className="container mx-auto px-4 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-lg text-gray-600">Loading users...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 md:flex-row">
        <MunicipalitySidebar className="w-full md:w-64 flex-shrink-0" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto py-8">
            <div className="container mx-auto px-4 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block rounded-full h-12 w-12 bg-red-100 p-2 text-red-500 mb-4">
                  <X className="h-8 w-8" />
                </div>
                <p className="text-lg text-gray-800 font-medium">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 md:flex-row">
      <Toaster position="top-right" />
      <MunicipalitySidebar className="w-full md:w-64 flex-shrink-0" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">User Management</h1>
            </div>

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
              <div className="p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, email, or contact"
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                      >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2">
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                      }}
                      className="p-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      title="Reset filters"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* ID Column */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('user_id')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>User ID</span>
                          {sortConfig.key === 'user_id' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Name Column */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('user_name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {sortConfig.key === 'user_name' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Contact Info */}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      
                      {/* Municipality */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('municipality')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Municipality</span>
                          {sortConfig.key === 'municipality' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Registration Date */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Registered</span>
                          {sortConfig.key === 'createdAt' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Status */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('isVerified')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {sortConfig.key === 'isVerified' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Actions */}
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        {/* ID */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.user_id}
                        </td>
                        
                        {/* Name with profile picture */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={user.profilePicture ? `http://localhost:5555/${user.profilePicture}` : "/api/placeholder/400/400"} 
                                alt={user.user_name} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Contact Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.user_email || 'No Email'}</div>
                          <div className="text-sm text-gray-500">{user.contact || 'No Contact'}</div>
                        </td>
                        
                        {/* Municipality */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.municipality || 'Not Specified'}</div>
                          <div className="text-sm text-gray-500">Ward {user.wardNumber || 'N/A'}</div>
                        </td>
                        
                        {/* Registration Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Unknown'}
                        </td>
                        
                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.isVerified)}`}>
                            {getStatusText(user.isVerified)}
                          </span>
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewUser(user)}
                              className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Conditional Buttons based on Status */}
                            {user.isVerified === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user.user_id)}
                                  disabled={isLoading}
                                  className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Approve User"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.user_id)}
                                  disabled={isLoading}
                                  className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Reject User"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            
                            {(user.isVerified === "ACCEPT" || user.isVerified === "REJECT") && (
                              <button
                                onClick={() => handleResetStatus(user.user_id)}
                                disabled={isLoading}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reset Status"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}

                            {/* Delete User Button - Always visible */}
                            <button
                              onClick={() => openDeleteConfirm(user)}
                              disabled={isLoading}
                              className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Empty state */}
                    {sortedUsers.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                          <p className="text-lg">No users found</p>
                          <p className="text-sm mt-2">Try adjusting your search or filter settings</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Basic pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedUsers.length}</span> of{' '}
                      <span className="font-medium">{sortedUsers.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronDown className="h-5 w-5 transform rotate-90" />
                      </button>
                      
                      <button
                        aria-current="page"
                        className="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                      >
                        1
                      </button>
                      
                      <button
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronDown className="h-5 w-5 transform -rotate-90" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* User Detail Modal */}
      {isUserDetailOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button
                onClick={() => setIsUserDetailOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left column - Images */}
                <div className="md:w-1/3">
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Profile Picture</h4>
                    <img 
                      src={selectedUser.profilePicture ? `http://localhost:5555/${selectedUser.profilePicture}` : "/api/placeholder/400/400"} 
                      alt={selectedUser.user_name} 
                      className="w-full h-auto rounded-lg shadow object-cover"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Citizenship Document</h4>
                    <img 
                      src={selectedUser.citizenshipPhoto ? `http://localhost:5555/${selectedUser.citizenshipPhoto}` : "/api/placeholder/400/400"} 
                      alt="Citizenship" 
                      className="w-full h-auto rounded-lg shadow object-cover"
                    />
                  </div>
                </div>

                {/* Right column - User details */}
                <div className="md:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">User ID</h4>
                        <p className="font-medium text-gray-900">{selectedUser.user_id}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Full Name</h4>
                        <p className="font-medium text-gray-900">{selectedUser.user_name}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Email Address</h4>
                        <p className="font-medium text-gray-900">{selectedUser.user_email || 'No Email'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Contact Number</h4>
                        <p className="font-medium text-gray-900">{selectedUser.contact || 'No Contact'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Date of Birth</h4>
                        <p className="font-medium text-gray-900">
                          {selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not provided'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Registration Date</h4>
                        <p className="font-medium text-gray-900">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Unknown'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Municipality</h4>
                        <p className="font-medium text-gray-900">{selectedUser.municipality || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Ward Number</h4>
                        <p className="font-medium text-gray-900">{selectedUser.wardNumber || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Status</h4>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5font-semibold rounded-full ${getStatusBadgeClass(selectedUser.isVerified)}`}>
                          {getStatusText(selectedUser.isVerified)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-8 flex flex-wrap gap-3">
                    {selectedUser.isVerified === "PENDING" && (
                      <>
                        <button
                          onClick={() => {
                            handleApproveUser(selectedUser.user_id)
                              .then(() => setIsUserDetailOpen(false));
                          }}
                          disabled={isLoading}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve User
                        </button>
                        <button
                          onClick={() => {
                            handleRejectUser(selectedUser.user_id)
                              .then(() => setIsUserDetailOpen(false));
                          }}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject User
                        </button>
                      </>
                    )}
                    
                    {(selectedUser.isVerified === "ACCEPT" || selectedUser.isVerified === "REJECT") && (
                      <button
                        onClick={() => {
                          handleResetStatus(selectedUser.user_id)
                            .then(() => setIsUserDetailOpen(false));
                        }}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Status
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setIsUserDetailOpen(false);
                        openDeleteConfirm(selectedUser);
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-red-100 p-3 text-red-500">
                  <Trash2 className="h-6 w-6" />
                </div>
              </div>
              
              <p className="mt-4 text-center text-gray-700">
                Are you sure you want to delete the user <strong>{userToDelete.user_name}</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;