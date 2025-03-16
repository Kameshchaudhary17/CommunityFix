import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Plus, 
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ThumbsUp
} from 'lucide-react';
import MunicipalitySidebar from '../components/MunicipalitySidebar';
import Header from '../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ReportManagement = () => {
  // Sample reports data - in a real app, you would fetch this from an API
  const [reports, setReports] = useState([
    {
      id: 'RPT-1001',
      title: 'Pothole on Main Street',
      description: 'Large pothole causing traffic issues and potential vehicle damage. Located near the intersection with Oak Avenue.',
      status: 'Pending',
      reportDate: '2023-09-15',
      upvotes: 15,
      location: {
        latitude: 27.7172,
        longitude: 85.3240,
        address: 'Main Street, Near Oak Avenue Intersection'
      },
      photos: [
        "/api/placeholder/800/600",
        "/api/placeholder/800/600"
      ],
      reporter: {
        name: 'John Doe',
        contact: '+977 9812345678',
        email: 'johndoe@example.com'
      }
    },
    {
      id: 'RPT-1004',
      title: 'Fallen Tree Blocking Road',
      description: 'Large tree has fallen across the road after the recent storm, completely blocking traffic in both directions.',
      status: 'Pending',
      reportDate: '2023-09-18',
      upvotes: 24,
      location: {
        latitude: 27.7193,
        longitude: 85.3150,
        address: 'Forest Avenue, Near Municipal Building'
      },
      photos: [
        "/api/placeholder/800/600",
        "/api/placeholder/800/600"
      ],
      reporter: {
        name: 'Sarah Williams',
        contact: '+977 9854321098',
        email: 'sarah@example.com'
      }
    },
    {
      id: 'RPT-1005',
      title: 'Water Leakage from Main Pipe',
      description: 'Water constantly leaking from municipal water pipe causing water wastage and road damage.',
      status: 'In Progress',
      reportDate: '2023-09-05',
      upvotes: 8,
      location: {
        latitude: 27.7114,
        longitude: 85.3133,
        address: 'Water Works Road, Behind Shopping Complex'
      },
      photos: [
        "/api/placeholder/800/600"
      ],
      reporter: {
        name: 'Robert Brown',
        contact: '+977 9812345678',
        email: 'robert@example.com'
      }
    }
  ]);

  // State for search, filters, and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'upvotes', direction: 'desc' });
  const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
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

  // View report details
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsReportDetailOpen(true);
  };

  // Update report status
  const handleUpdateStatus = (reportId, newStatus) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setReports(reports.map(report => 
        report.id === reportId ? { ...report, status: newStatus } : report
      ));
      setIsLoading(false);
      toast.success(`Report status updated to ${newStatus}`);
    }, 800);
  };

  // Handle upvote
  const handleUpvote = (reportId) => {
    setReports(reports.map(report => 
      report.id === reportId ? { ...report, upvotes: report.upvotes + 1 } : report
    ));
    toast.success('Upvote added');
  };

  // Filter reports based on search term and status filter
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Report Management</h1>
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

            {/* Reports Table */}
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
                      <tr key={report.id} className="hover:bg-gray-50">
                        {/* ID */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.id}
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
                          {new Date(report.reportDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
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
                            <span className="text-sm font-medium text-gray-900 mr-2">{report.upvotes}</span>
                            <button 
                              onClick={() => handleUpvote(report.id)}
                              className="p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                              title="Upvote"
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </button>
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
                    {sortedReports.length === 0 && (
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
                        Reported on {new Date(selectedReport.reportDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="ml-4 flex items-center text-sm">
                        <ThumbsUp className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="font-medium">{selectedReport.upvotes}</span>
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
                      onChange={(e) => handleUpdateStatus(selectedReport.id, e.target.value)}
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

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Reporter Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900">{selectedReport.reporter.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Contact:</span>
                      <span className="ml-2 text-gray-900">{selectedReport.reporter.contact}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedReport.reporter.email}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <div className="flex items-start mb-2">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{selectedReport.location.address}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      Coordinates: {selectedReport.location.latitude}, {selectedReport.location.longitude}
                    </div>
                  </div>
                  
                  {/* Leaflet Map */}
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                    <MapContainer 
                      center={[selectedReport.location.latitude, selectedReport.location.longitude]} 
                      zoom={14} 
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[selectedReport.location.latitude, selectedReport.location.longitude]}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-medium">{selectedReport.title}</p>
                            <p>{selectedReport.location.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Photos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedReport.photos.map((photo, index) => (
                      <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={photo} 
                          alt={`Report ${index + 1}`} 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => handleUpvote(selectedReport.id)}
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ThumbsUp className="mr-1.5 h-4 w-4" />
                Upvote
              </button>
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