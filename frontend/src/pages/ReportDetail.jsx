import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, User, ArrowLeft, ThumbsUp, Clock, MessageCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { toast } from 'react-toastify';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ReportDetail = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-500';
      case 'in progress':
        return 'bg-blue-500';
      case 'resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Function to get the full image URL
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;

    // If the path is already a full URL, return it as is
    if (photoPath.startsWith('http')) {
      return photoPath;
    }

    // Otherwise, construct the full URL
    return `http://localhost:5555/${photoPath.replace(/^\.\//, '')}`;
  };

  // Check auth on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch report data
  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `http://localhost:5555/api/report/getReportById/${reportId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      let reportData = response.data;
      if (reportData.photo) {
        try {
          const parsedPhotos = JSON.parse(reportData.photo);
          reportData.photos = Array.isArray(parsedPhotos)
            ? parsedPhotos.map(photo => getPhotoUrl(photo))
            : [getPhotoUrl(parsedPhotos)];
        } catch (parseError) {
          reportData.photos = [getPhotoUrl(reportData.photo)];
        }
      }
      
      setReport(reportData);
      if (reportData.photos?.length > 0) {
        setSelectedPhoto(reportData.photos[0]);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error.message || 'Failed to load report details');
    }
  };

  // Fetch upvote status
  const fetchUpvoteStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { upvotes: 0, hasUserUpvoted: false };
  
      const response = await axios.get(
        `http://localhost:5555/api/upvote/${reportId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
  
      if (response.data) {
        // Set the state directly
        setUpvoteCount(response.data.upvotes || 0);
        setIsUpvoted(response.data.hasUserUpvoted || false);
        
        // Return the data in case we need it elsewhere
        return {
          upvotes: response.data.upvotes || 0,
          hasUserUpvoted: response.data.hasUserUpvoted || false
        };
      }
      
      return { upvotes: 0, hasUserUpvoted: false };
    } catch (error) {
      console.error('Error fetching upvote status:', error);
      return { upvotes: 0, hasUserUpvoted: false };
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchReportData();
        await fetchUpvoteStatus();
        // We don't need to set state again since fetchUpvoteStatus already does it
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  
    if (reportId) {
      loadData();
    }
  }, [reportId]);
  

  // Handle upvote
  const handleUpvote = async () => {
    if (isUpvoting) return;
    
    try {
      setIsUpvoting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to upvote');
        navigate('/login');
        return;
      }
  
      // Optimistic update
      const newIsUpvoted = !isUpvoted;
      setIsUpvoted(newIsUpvoted);
      setUpvoteCount(prevCount => newIsUpvoted ? prevCount + 1 : prevCount - 1);
  
      // API call
      const response = await axios.post(
        `http://localhost:5555/api/upvote/${reportId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
  
      // Update with actual server response
      // Note: Using the property names from your backend
      setUpvoteCount(response.data.upvotes || 0);
      
      toast.success(response.data.message || 'Upvote successful');
    } catch (error) {
      console.error('Error managing upvote:', error);
      // Revert optimistic update on error
      setIsUpvoted(prev => !prev);
      setUpvoteCount(prev => isUpvoted ? prev - 1 : prev + 1);
      toast.error('Failed to process your upvote. Please try again.');
    } finally {
      setIsUpvoting(false);
    }
  };
  

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Report</h2>
          <p className="text-gray-600 mb-4">{error || "Report not found. Please check if the report ID is correct."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if we have photo data
  const hasPhotos = report.photos && Array.isArray(report.photos) && report.photos.length > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Report Details</h1>
            <div className={`ml-3 px-3 py-1 rounded-full text-sm text-white ${getStatusColor(report.status || 'Pending')}`}>
              {report.status || 'Pending'}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Report Details */}
              <div className="md:col-span-2 space-y-6">
                {/* Report Header */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{report.title}</h2>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          <span>{new Date(report.createdAt || report.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <User size={16} className="mr-1" />
                          <span>{report.user?.user_name || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin size={16} className="mr-1" />
                          <span>{report.municipality}, Ward {report.wardNumber}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleUpvote}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                        isUpvoting ? 'opacity-70 cursor-wait' : ''
                      } ${
                        isUpvoted
                          ? 'bg-blue-50 text-blue-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } transition`}
                      disabled={isUpvoting}
                    >
                      <ThumbsUp size={18} className={isUpvoted ? 'fill-blue-500' : ''} />
                      <span>
                        {upvoteCount} Upvote{upvoteCount !== 1 ? 's' : ''}
                      </span>
                    </button>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-line">{report.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock size={16} />
                      <span className="text-sm">
                        {report.status === 'Resolved'
                          ? 'Resolved on ' + (report.resolved_at ? new Date(report.resolved_at).toLocaleDateString() : 'N/A')
                          : 'Reported ' + new Date(report.createdAt || report.created_at).toLocaleDateString()
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photos Section - Display if we have photos */}
                {hasPhotos && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-medium text-gray-700 mb-4">Report Photos</h3>

                    {/* Main Photo */}
                    <div className="rounded-lg overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
                      <img
                        src={selectedPhoto}
                        alt="Selected report photo"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>

                    {/* Photo Gallery - Only show if we have multiple photos */}
                    {report.photos.length > 1 && (
                      <div className="grid grid-cols-5 gap-2">
                        {report.photos.map((photo, index) => (
                          <div
                            key={index}
                            onClick={() => setSelectedPhoto(photo)}
                            className={`cursor-pointer rounded-md overflow-hidden h-20 ${selectedPhoto === photo ? 'ring-2 ring-blue-500' : ''}`}
                          >
                            <img
                              src={photo}
                              alt={`Report photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Display message if photo should exist but doesn't load */}
                {report.photo && !hasPhotos && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-medium text-gray-700 mb-4">Report Photos</h3>
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                      <p>The photo for this report could not be loaded.</p>
                      <p className="text-sm mt-2">Path: {report.photo}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Map and Status Info */}
              {/* The rest of your component remains the same... */}
              <div className="space-y-6">
                {/* Map Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-medium text-gray-700 mb-4">Location</h3>
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                    {report.latitude && report.longitude ? (
                      <MapContainer
                        center={[report.latitude, report.longitude]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[report.latitude, report.longitude]}>
                          <Popup>
                            {report.title}<br />
                            {report.municipality}, Ward {report.wardNumber}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-500">
                        No location data available
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2" />
                      <span>{report.address || `${report.municipality}, Ward ${report.wardNumber}`}</span>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-medium text-gray-700 mb-4">Status Updates</h3>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="mr-3">
                        <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                        <div className="w-0.5 h-full bg-gray-200 mx-auto"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Report Submitted</div>
                        <div className="text-xs text-gray-500">
                          {new Date(report.createdAt || report.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {report.status && report.status !== 'Pending' && (
                      <div className="flex">
                        <div className="mr-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mt-1"></div>
                          <div className="w-0.5 h-full bg-gray-200 mx-auto"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">In Progress</div>
                          <div className="text-xs text-gray-500">
                            {report.inprogress_at ? new Date(report.inprogress_at).toLocaleString() : 'Date not available'}
                          </div>
                        </div>
                      </div>
                    )}

                    {report.status === 'Resolved' && (
                      <div className="flex">
                        <div className="mr-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Resolved</div>
                          <div className="text-xs text-gray-500">
                            {report.resolved_at ? new Date(report.resolved_at).toLocaleString() : 'Date not available'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportDetail;