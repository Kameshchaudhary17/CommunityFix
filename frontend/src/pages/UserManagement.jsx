import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Search, Filter, ChevronDown, ChevronUp, RefreshCw, UserPlus } from 'lucide-react';
import Header from '../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import MunicipalitySidebar from '../components/MunicipalitySidebar';

const UserManagement = () => {
  // Sample users data - in a real app, you would fetch this from an API
  const [users, setUsers] = useState([
    {
      id: 'USR-1001',
      name: 'John Doe',
      email: 'johndoe@example.com',
      contact: '+977 9812345678',
      municipality: 'Kathmandu Metropolitan City',
      wardNo: '10',
      dateOfBirth: '1990-05-15',
      citizenshipNumber: '123-456-7890',
      profilePicture: "/api/placeholder/400/400",
      citizenshipPhoto: "/api/placeholder/400/400",
      status: 'Pending',
      registeredDate: '2023-09-15'
    },
    {
      id: 'USR-1002',
      name: 'Jane Smith',
      email: 'janesmith@example.com',
      contact: '+977 9876543210',
      municipality: 'Lalitpur Metropolitan City',
      wardNo: '5',
      dateOfBirth: '1992-08-21',
      citizenshipNumber: '987-654-3210',
      profilePicture: "/api/placeholder/400/400",
      citizenshipPhoto: "/api/placeholder/400/400",
      status: 'Approved',
      registeredDate: '2023-08-10'
    },
    {
      id: 'USR-1003',
      name: 'Michael Johnson',
      email: 'michael@example.com',
      contact: '+977 9845678912',
      municipality: 'Bhaktapur Municipality',
      wardNo: '3',
      dateOfBirth: '1985-02-10',
      citizenshipNumber: '456-789-0123',
      profilePicture: "/api/placeholder/400/400",
      citizenshipPhoto: "/api/placeholder/400/400",
      status: 'Rejected',
      registeredDate: '2023-09-05'
    },
    {
      id: 'USR-1004',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      contact: '+977 9854321098',
      municipality: 'Kirtipur Municipality',
      wardNo: '8',
      dateOfBirth: '1988-11-25',
      citizenshipNumber: '789-012-3456',
      profilePicture: "/api/placeholder/400/400",
      citizenshipPhoto: "/api/placeholder/400/400",
      status: 'Pending',
      registeredDate: '2023-09-18'
    },
    {
      id: 'USR-1005',
      name: 'Robert Brown',
      email: 'robert@example.com',
      contact: '+977 9812345678',
      municipality: 'Kathmandu Metropolitan City',
      wardNo: '15',
      dateOfBirth: '1991-07-30',
      citizenshipNumber: '321-654-9870',
      profilePicture: "/api/placeholder/400/400",
      citizenshipPhoto: "/api/placeholder/400/400",
      status: 'Approved',
      registeredDate: '2023-07-22'
    }
  ]);

  // State for search, filters, and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'registeredDate', direction: 'desc' });
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Approve user
  const handleApproveUser = (userId) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: 'Approved' } : user
      ));
      setIsLoading(false);
      toast.success('User approved successfully');
    }, 800);
  };

  // Reject user
  const handleRejectUser = (userId) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: 'Rejected' } : user
      ));
      setIsLoading(false);
      toast.success('User rejected');
    }, 800);
  };

  // Reset user status to pending
  const handleResetStatus = (userId) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: 'Pending' } : user
      ));
      setIsLoading(false);
      toast.success('User status reset to pending');
    }, 800);
  };

  // Filter users based on search term and status filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.citizenshipNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                      placeholder="Search by name, email, or citizenship number"
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
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>User ID</span>
                          {sortConfig.key === 'id' && (
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
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {sortConfig.key === 'name' && (
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
                        onClick={() => handleSort('registeredDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Registered</span>
                          {sortConfig.key === 'registeredDate' && (
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
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {sortConfig.key === 'status' && (
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
                      <tr key={user.id} className="hover:bg-gray-50">
                        {/* ID */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.id}
                        </td>
                        
                        {/* Name with profile picture */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={user.profilePicture} 
                                alt={user.name} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.citizenshipNumber}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Contact Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.contact}</div>
                        </td>
                        
                        {/* Municipality */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.municipality}</div>
                          <div className="text-sm text-gray-500">Ward {user.wardNo}</div>
                        </td>
                        
                        {/* Registration Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.registeredDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        
                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                            {user.status}
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
                            {user.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user.id)}
                                  disabled={isLoading}
                                  className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Approve User"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id)}
                                  disabled={isLoading}
                                  className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Reject User"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            
                            {(user.status === 'Approved' || user.status === 'Rejected') && (
                              <button
                                onClick={() => handleResetStatus(user.id)}
                                disabled={isLoading}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reset Status"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}
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
                      <a
                        href="#"
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronDown className="h-5 w-5 transform rotate-90" />
                      </a>
                      <a
                        href="#"
                        aria-current="page"
                        className="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                      >
                        1
                      </a>
                      <a
                        href="#"
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronDown className="h-5 w-5 transform -rotate-90" />
                      </a>
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
                      src={selectedUser.profilePicture} 
                      alt={selectedUser.name} 
                      className="w-full h-auto rounded-lg shadow"
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Citizenship Document</h4>
                    <img 
                      src={selectedUser.citizenshipPhoto} 
                      alt="Citizenship" 
                      className="w-full h-auto rounded-lg shadow"
                    />
                  </div>
                </div>

                {/* Right column - User details */}
                <div className="md:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">User ID</h4>
                        <p className="font-medium text-gray-900">{selectedUser.id}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Full Name</h4>
                        <p className="font-medium text-gray-900">{selectedUser.name}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Email Address</h4>
                        <p className="font-medium text-gray-900">{selectedUser.email}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Contact Number</h4>
                        <p className="font-medium text-gray-900">{selectedUser.contact}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Date of Birth</h4>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedUser.dateOfBirth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Registration Date</h4>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedUser.registeredDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Municipality</h4>
                        <p className="font-medium text-gray-900">{selectedUser.municipality}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Ward No.</h4>
                        <p className="font-medium text-gray-900">{selectedUser.wardNo}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Citizenship Number</h4>
                        <p className="font-medium text-gray-900">{selectedUser.citizenshipNumber}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Status</h4>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              {selectedUser.status === 'Pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApproveUser(selectedUser.id);
                      setIsUserDetailOpen(false);
                    }}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Approve User
                  </button>
                  <button
                    onClick={() => {
                      handleRejectUser(selectedUser.id);
                      setIsUserDetailOpen(false);
                    }}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Reject User
                  </button>
                </>
              )}
              
              {(selectedUser.status === 'Approved' || selectedUser.status === 'Rejected') && (
                <button
                  onClick={() => {
                    handleResetStatus(selectedUser.id);
                    setIsUserDetailOpen(false);
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Reset to Pending
                </button>
              )}
              
              <button
                onClick={() => setIsUserDetailOpen(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;