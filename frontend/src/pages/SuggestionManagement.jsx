import React, { useEffect, useState } from 'react';
import { 
  Eye, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ThumbsUp
} from 'lucide-react';
import MunicipalitySidebar from '../components/MunicipalitySidebar';
import Header from '../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

const SuggestionManagement = () => {
  // Sample suggestion data
  const [suggestions, setSuggestions] = useState([]);
const [loading, setLoading] = useState(false)
const [error, setError] = useState("")


const token = localStorage.getItem('token');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5555/api/suggestion/getSuggestion', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(response)
      
      console.log(response.data);
      if (response.data && response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Failed to load suggestions. Please try again.');
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
      fetchSuggestions();
    }, []);


  // State for filters and sorting
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'upvoteCount', direction: 'desc' });
  const [isSuggestionDetailOpen, setIsSuggestionDetailOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // View suggestion details
  const handleViewSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsSuggestionDetailOpen(true);
  };

  // Update suggestion status
  const handleStatusChange = (id, newStatus) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSuggestions(suggestions.map(suggestion => 
        suggestion.id === id ? { 
          ...suggestion, 
          status: newStatus,
          lastUpdate: new Date().toISOString().split('T')[0].replace(/-/g, '/')
        } : suggestion
      ));
      setIsLoading(false);
      toast.success(`Suggestion status updated to ${newStatus.replace('_', ' ')}`);
    }, 800);
  };

  // Filter suggestions based on status
  const filteredSuggestions = activeFilter === 'all' 
    ? suggestions 
    : suggestions.filter(suggestion => suggestion.status.toLowerCase() === activeFilter.toLowerCase());

  // Sort suggestions
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Get status badge class and icon
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return {
          className: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="mr-1 h-3 w-3" />
        };
      case 'in_progress':
        return {
          className: 'bg-blue-100 text-blue-800',
          icon: <Clock className="mr-1 h-3 w-3" />
        };
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800',
          icon: <AlertCircle className="mr-1 h-3 w-3" />
        };
      case 'rejected':
        return {
          className: 'bg-red-100 text-red-800',
          icon: <X className="mr-1 h-3 w-3" />
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800',
          icon: null
        };
    }
  };

  // Truncate text to a specific length
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Suggestion Management</h1>
            </div>

            {/* Filter Buttons */}
            <div className="mb-6 flex flex-wrap gap-2">
              {['all', 'pending', 'in_progress', 'approved', 'rejected'].map((status) => (
                <button 
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`px-4 py-2 rounded-md ${activeFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
              
              <button 
                onClick={() => {
                  setActiveFilter('all');
                }}
                className="ml-auto p-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                title="Reset filters"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {/* Suggestions Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* Title Column */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Title</span>
                          {sortConfig.key === 'title' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Description */}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      
                      {/* Submitted Date */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('submittedDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Submitted Date</span>
                          {sortConfig.key === 'submittedDate' && (
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
                      
                      {/* Last Update */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('lastUpdate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Last Update</span>
                          {sortConfig.key === 'lastUpdate' && (
                            sortConfig.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Upvotes */}
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('upvoteCount')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Upvotes</span>
                          {sortConfig.key === 'upvoteCount' && (
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
                    {sortedSuggestions.map((suggestion) => (
                      <tr key={suggestion.id} className="hover:bg-gray-50">
                        {/* Title */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{suggestion.title}</div>
                        </td>
                        
                        {/* Description */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs">
                            {truncateText(suggestion.description, 100)}
                          </div>
                        </td>
                        
                        {/* Submitted Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {suggestion.submittedDate}
                        </td>
                        
                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusBadge(suggestion.status).className}`}>
                            {getStatusBadge(suggestion.status).icon}
                            {suggestion.status.replace('_', ' ')}
                          </span>
                        </td>
                        
                        {/* Last Update */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {suggestion.lastUpdate}
                        </td>
                        
                        {/* Upvotes */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{suggestion.upvoteCount}</span>
                          </div>
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewSuggestion(suggestion)}
                              className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 flex items-center"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Status Update Dropdown */}
                            <select
                              className="px-3 py-1.5 border rounded-md bg-gray-100 text-sm"
                              value={suggestion.status}
                              onChange={(e) => handleStatusChange(suggestion.id, e.target.value)}
                              disabled={isLoading}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In_Progress">In Progress</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Empty state */}
                    {sortedSuggestions.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                          <p className="text-lg">No suggestions found</p>
                          <p className="text-sm mt-2">Try adjusting your filter settings</p>
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
                      Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedSuggestions.length}</span> of{' '}
                      <span className="font-medium">{sortedSuggestions.length}</span> results
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

      {/* Suggestion Detail Modal */}
      {isSuggestionDetailOpen && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Suggestion Details</h3>
              <button
                onClick={() => setIsSuggestionDetailOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSuggestion.title}</h2>
                    <div className="flex items-center mt-2">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusBadge(selectedSuggestion.status).className}`}>
                        {getStatusBadge(selectedSuggestion.status).icon}
                        {selectedSuggestion.status.replace('_', ' ')}
                      </span>
                      <span className="ml-4 text-sm text-gray-500">
                        Submitted on {selectedSuggestion.submittedDate}
                      </span>
                      <span className="ml-4 flex items-center text-sm">
                        <ThumbsUp className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="font-medium">{selectedSuggestion.upvoteCount}</span>
                        <span className="text-gray-500 ml-1">upvotes</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Update Dropdown */}
                  <div className="mt-4 md:mt-0">
                    <label htmlFor="status-change" className="block text-sm font-medium text-gray-700 mb-1">
                      Update Status
                    </label>
                    <select
                      id="status-change"
                      className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={selectedSuggestion.status}
                      onChange={(e) => handleStatusChange(selectedSuggestion.id, e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In_Progress">In Progress</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedSuggestion.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Date</h4>
                    <p className="text-sm text-gray-600">{selectedSuggestion.submittedDate}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Last Update</h4>
                    <p className="text-sm text-gray-600">{selectedSuggestion.lastUpdate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setIsSuggestionDetailOpen(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionManagement;