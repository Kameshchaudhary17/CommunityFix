import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  ThumbsUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import MunicipalitySidebar from '../components/MunicipalitySidebar';
import Header from '../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// API base URL - should be moved to environment variable in production
const API_BASE_URL = 'http://localhost:5555/api';

const ReportManagement = () => {
  // State management
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'upvotes', direction: 'desc' });
  const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status mapping for consistent display
  const statusMapping = {
    'PENDING': 'Pending',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed'
  };

  // Helper function to get token
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch reports from API
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/report/getReport`, {
        headers: getAuthHeader()
      });
      
      console.log('Report data structure:', response.data);
      
      // Map backend enum statuses to frontend display format
      const mappedReports = response.data.reports.map(report => {
        // Check if upvotes is an array and get its length
        const upvotesCount = Array.isArray(report.upvotes) ? report.upvotes.length : 
                            (typeof report.upvotes === 'number' ? report.upvotes : 0);
        
        return {
          ...report,
          status: statusMapping[report.status] || report.status,
          reportDate: report.createdAt, // Map createdAt to reportDate
          upvotesCount // Add upvotesCount property
        };
      });
      
      setReports(mappedReports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again later.');
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  // Update report status
  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      // Use report_id from the model schema
      const id = reportId || selectedReport?.report_id;
      console.log(`Attempting to update report ${id} status to ${newStatus}`);
      
      // Map frontend display status to backend enum values
      let backendStatus;
      switch(newStatus) {
        case 'Pending': backendStatus = 'PENDING'; break;
        case 'In Progress': backendStatus = 'IN_PROGRESS'; break;
        case 'Completed': backendStatus = 'COMPLETED'; break;
        default: backendStatus = newStatus;
      }
      
      console.log(`Converted status from "${newStatus}" to "${backendStatus}"`);
      
      // Update URL to match server route structure
      const response = await axios.put(
        `${API_BASE_URL}/report/${id}/status`,
        { status: backendStatus },
        { headers: getAuthHeader() }
      );
      
      if (response.status === 200) {
        console.log('Status update successful:', response.data);
        
        // Update the local state with the new status
        setReports(reports.map(report => {
          if (report.report_id === id) {
            return { ...report, status: newStatus };
          }
          return report;
        }));
        
        toast.success('Status updated successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Detailed API error:', err);
      
      // Try with an alternative endpoint format as a fallback
      try {
        const id = reportId || selectedReport?.report_id;
        console.log('Trying alternative endpoint format...');
        
        const alternativeResponse = await axios.post(
          `${API_BASE_URL}/report/status`,
          {
            report_id: id,
            status: backendStatus
          },
          { headers: getAuthHeader() }
        );
        
        if (alternativeResponse.status === 200) {
          console.log('Status update successful with alternative endpoint');
          setReports(reports.map(report => {
            if (report.report_id === id) {
              return { ...report, status: newStatus };
            }
            return report;
          }));
          
          toast.success('Status updated successfully');
          return true;
        }
        return false;
      } catch (alternativeErr) {
        // Log response details if available
        if (err.response) {
          console.error('API response:', {
            status: err.response.status,
            data: err.response.data,
            headers: err.response.headers
          });
        }
        
        // Both approaches failed, handle the error
        handleApiError(err, 'Failed to update status');
        
        // Log error details for debugging
        console.error('Failed with both endpoint approaches');
        return false;
      }
    }
  };


  // Generic error handler for API requests
  const handleApiError = (err, defaultMessage) => {
    console.error(`API Error: ${defaultMessage}`, err);
    
    if (err.response) {
      // Server responded with error status
      const errorMsg = err.response.data?.error || `${defaultMessage} (${err.response.status})`;
      toast.error(errorMsg);
      setError(errorMsg);
    } else if (err.request) {
      // No response received
      toast.error('No response from server. Please check your connection.');
      setError('Network error. Please check your connection.');
    } else {
      // Request setup error
      toast.error(defaultMessage);
      setError(`${defaultMessage}: ${err.message}`);
    }
  };

  // Effects
  useEffect(() => {
    fetchReports();
  }, []);

  // Event handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsReportDetailOpen(true);
  };

  // Handle status change from UI
  const handleStatusChange = async (event, reportId) => {
    const newStatus = event.target.value;
    console.log(`Status change requested: ${reportId} to ${newStatus}`);
    
    // Disable the select while updating
    event.target.disabled = true;
    
    const success = await handleUpdateStatus(reportId, newStatus);
    
    // Re-enable the select
    event.target.disabled = false;
    
    if (!success) {
      // Revert the select element to the previous value if update failed
      const originalStatus = reports.find(report => 
        report.report_id === reportId || report.id === reportId
      )?.status || '';
      
      console.log(`Update failed, reverting to original status: ${originalStatus}`);
      event.target.value = originalStatus;
      
      toast.error('Failed to update status. Please try again.');
    } else {
      // Update selectedReport if we're in detail view
      if (selectedReport && (selectedReport.report_id === reportId || selectedReport.id === reportId)) {
        setSelectedReport({
          ...selectedReport,
          status: newStatus
        });
      }
    }
  };

  // Filter and sort reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Helper functions
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return {
          className: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="mr-1 h-3 w-3" />
        };
      case 'In Progress':
        return {
          className: 'bg-blue-100 text-blue-800',
          icon: <Clock className="mr-1 h-3 w-3" />
        };
      case 'Pending':
        return {
          className: 'bg-yellow-100 text-yellow-800',
          icon: <AlertCircle className="mr-1 h-3 w-3" />
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800',
          icon: null
        };
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Report Management</h1>
              
              {/* Error display */}
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <span>{error}</span>
                  <button 
                    onClick={() => setError(null)} 
                    className="ml-2 text-red-700 hover:text-red-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
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
                      placeholder="Search by title or description"
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
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
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

            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading reports...</p>
              </div>
            ) : (
              /* Reports Table */
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
                            <span>Report ID</span>
                            {sortConfig.key === 'id' && (
                              sortConfig.direction === 'asc' ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        
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
                        
                        {/* Report Date */}
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('reportDate')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Report Date</span>
                            {sortConfig.key === 'reportDate' && (
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
                        
                        {/* Upvotes */}
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('upvotes')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Upvotes</span>
                            {sortConfig.key === 'upvotes' && (
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
                      {sortedReports.map((report) => (
                        <tr key={report.id || report.report_id} className="hover:bg-gray-50">
                          {/* ID */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {report.report_id}
                          </td>
                          
                          {/* Title */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{report.title}</div>
                          </td>
                          
                          {/* Description */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs">
                              {truncateText(report.description, 100)}
                            </div>
                          </td>
                          
                          {/* Report Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.reportDate ? new Date(report.reportDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </td>
                          
                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusBadge(report.status).className}`}>
                              {getStatusBadge(report.status).icon}
                              {report.status}
                            </span>
                          </td>
                          
                          {/* Upvotes */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {report.upvotesCount || (report.upvotes && report.upvotes.length) || 0}
                              </span>
                              <ThumbsUp className="h-4 w-4 ml-1.5 text-blue-500" />
                            </div>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {/* View Details Button */}
                              <button
                                onClick={() => handleViewReport(report)}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 flex items-center"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Empty state */}
                      {sortedReports.length === 0 && !isLoading && (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                            <p className="text-lg">No reports found</p>
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
                        Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedReports.length}</span> of{' '}
                        <span className="font-medium">{sortedReports.length}</span> results
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
            )}
          </div>
        </main>
      </div>

      {/* Report Detail Modal */}
      {isReportDetailOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
              <button
                onClick={() => setIsReportDetailOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
                    <div className="flex items-center mt-2">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusBadge(selectedReport.status).className}`}>
                        {getStatusBadge(selectedReport.status).icon}
                        {selectedReport.status}
                      </span>
                      <span className="ml-4 text-sm text-gray-500">
                        Reported on {selectedReport.reportDate ? new Date(selectedReport.reportDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </span>
                      <span className="ml-4 flex items-center text-sm">
                        <ThumbsUp className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="font-medium">
                          {selectedReport.upvotesCount || (selectedReport.upvotes && selectedReport.upvotes.length) || 0}
                        </span>
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
                      value={selectedReport.status}
                      onChange={(e) => handleStatusChange(e, selectedReport.id || selectedReport.report_id)}
                      disabled={isLoading}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedReport.description}</p>
                </div>

                {selectedReport.user && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Reporter Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 text-gray-900">{selectedReport.user.user_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Contact:</span>
                        <span className="ml-2 text-gray-900">{selectedReport?.user?.contact || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 text-gray-900">{selectedReport.user.user_email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.latitude && selectedReport.longitude && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                    <div className="bg-gray-50 p-4 rounded-lg mb-3">
                      <div className="flex items-start mb-2">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          {selectedReport.municipality ? selectedReport.municipality + " " : ""}
                          {selectedReport.wardNumber ? selectedReport.wardNumber : ""}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        Coordinates: {selectedReport.latitude}, {selectedReport.longitude}
                      </div>
                    </div>
                    
                    {/* Leaflet Map */}
                    <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                      <MapContainer 
                        center={[selectedReport.latitude, selectedReport.longitude]} 
                        zoom={14} 
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[selectedReport.latitude, selectedReport.longitude]}>
                          <Popup>
                            <div className="text-sm">
                              <p className="font-medium">{selectedReport.title}</p>
                              <p>
                                {selectedReport.municipality ? selectedReport.municipality + " " : ""}
                                {selectedReport.wardNumber ? selectedReport.wardNumber : ""}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Photos</h4>
                  {selectedReport.photo ? (
                    Array.isArray(selectedReport.photo) && selectedReport.photo.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedReport.photo.map((photo, index) => (
                          <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={photo} 
                              alt={`Report ${index + 1}`} 
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      typeof selectedReport.photo === 'string' ? (
                        <div className="rounded-lg overflow-hidden border border-gray-200 max-w-md">
                          <img 
                            src={selectedReport.photo} 
                            alt="Report photo" 
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No photos available</p>
                      )
                    )
                  ) : (
                    <p className="text-sm text-gray-500">No photos available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setIsReportDetailOpen(false)}
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

export default ReportManagement;