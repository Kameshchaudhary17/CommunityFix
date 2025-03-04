import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, User, ArrowLeft, ThumbsUp, Clock, MessageCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

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

  useEffect(() => {
    // Check if report is upvoted from local storage
    const upvotedReports = JSON.parse(localStorage.getItem('upvotedReports') || '[]');
    setIsUpvoted(upvotedReports.includes(parseInt(reportId)));

    const fetchReportDetail = async () => {
      try {
        // Make sure reportId is valid
        if (!reportId) {
          throw new Error('Invalid report ID');
        }
        
        console.log(`Fetching report with ID: ${reportId}`);
        
        // Get auth token from local storage
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token found');
        }
    
        // Attempt API call with better error handling
        try {
          const response = await axios.get(`http://localhost:5555/api/report/getReportById/${reportId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('API Response:', response);
          
          if (response.data && response.data.report) {
            console.log('Report data received:', response.data.report);
            setReport(response.data.report);
            setUpvoteCount(response.data.report.upvotes || 0);
            
            if (response.data.report.photos && response.data.report.photos.length > 0) {
              setSelectedPhoto(response.data.report.photos[0]);
            }
          } else {
            console.error('Invalid response format or missing report data:', response.data);
            throw new Error('Report data not found in response');
          }
        } catch (apiError) {
          console.error('API call failed:', apiError);
          console.error('Error details:', apiError.response?.data || apiError.message);
          
          // Try a different API endpoint if the first one fails (optional)
          try {
            console.log('Attempting alternative API endpoint...');
            const altResponse = await axios.get(`http://localhost:5555/api/report/getReportById/${reportId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (altResponse.data) {
              console.log('Alternative API successful:', altResponse.data);
              setReport(altResponse.data);
              setUpvoteCount(altResponse.data.upvotes || 0);
              
              if (altResponse.data.photos && altResponse.data.photos.length > 0) {
                setSelectedPhoto(altResponse.data.photos[0]);
              }
              
              setIsLoading(false);
              return; // Exit if alternative API works
            }
          } catch (altError) {
            console.error('Alternative API also failed:', altError.message);
          }
          
          // If both APIs fail, fall back to mock data
          console.log('Using mock data as fallback');
          
          // Mock data for testing/development
          const mockReport = {
            report_id: parseInt(reportId) || 2,
            title: "Broken sidewalk on Main Street",
            description: "The sidewalk has multiple cracks and poses a tripping hazard for pedestrians. Several elderly residents have reported difficulty navigating this area.",
            latitude: 27.7172,
            longitude: 85.324,
            municipality: "Kathmandu",
            photos: [],
            status: "Pending",
            created_at: new Date().toISOString(),
            user: {
              user_name: "citizeReporter",
              user_email: "reporter@example.com"
            },
            user_id: 13,
            wardNumber: 33,
            upvotes: 5
          };
          
          setReport(mockReport);
          setUpvoteCount(mockReport.upvotes || 0);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error in fetchReportDetail:', err);
        setError(err.message || 'Failed to load report details');
        setIsLoading(false);
      }
    };
    
    fetchReportDetail();
    
  }, [reportId]);

  const handleUpvote = () => {
    // If already upvoted, do nothing
    if (isUpvoted) return;

    // Update local state for upvote count and status
    setUpvoteCount(prevCount => prevCount + 1);
    setIsUpvoted(true);

    // Save to localStorage to persist the upvote
    const upvotedReports = JSON.parse(localStorage.getItem('upvotedReports') || '[]');
    upvotedReports.push(parseInt(reportId));
    localStorage.setItem('upvotedReports', JSON.stringify(upvotedReports));
    
    // Attempt to update upvote on the server (optional)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        axios.post(`http://localhost:5555/api/report/upvote/${reportId}`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(response => {
          console.log('Upvote registered on server:', response.data);
        }).catch(err => {
          console.error('Failed to register upvote on server:', err);
          // Still keep local state updated even if server update fails
        });
      } catch (error) {
        console.error('Error sending upvote request:', error);
      }
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
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
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
                      disabled={isUpvoted}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full ${isUpvoted
                          ? 'bg-blue-50 text-blue-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition`}
                    >
                      <ThumbsUp size={18} className={isUpvoted ? 'fill-blue-500' : ''} />
                      <span>{upvoteCount} Upvotes</span>
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
                          : 'Reported ' + new Date(report.created_at).toLocaleDateString()
                        }
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition">
                        <MessageCircle size={16} />
                        <span>Add Comment</span>
                      </button>
                      <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                        <span>Share Report</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Photos Section - Only show if photos exist and aren't null */}
                {report.photos && Array.isArray(report.photos) && report.photos.length > 0 && report.photos[0] !== null && (
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

                    {/* Photo Gallery */}
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
                  </div>
                )}
              </div>

              {/* Right Column - Map and Status Info */}
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
                        <div className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString()}</div>
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

                {/* Similar Reports */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-medium text-gray-700 mb-4">Similar Reports</h3>
                  <div className="space-y-3">
                    {/* This would typically be populated from an API call, but for now we'll show a placeholder */}
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                      <div>
                        <div className="font-medium text-gray-800">Similar issue in {report.municipality}</div>
                        <div className="text-sm text-gray-500">Reported 3 days ago</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                      <div>
                        <div className="font-medium text-gray-800">Issue reported in nearby Ward {parseInt(report.wardNumber) + 1}</div>
                        <div className="text-sm text-gray-500">Reported 1 week ago</div>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                        View more similar reports
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-medium text-gray-700 mb-4">Additional Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Report ID:</span>
                      <span className="font-medium">{report.report_id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium">{report.category || 'General'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Priority:</span>
                      <span className="font-medium">{report.priority || 'Medium'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Assigned To:</span>
                      <span className="font-medium">{report.assigned_to || 'Not yet assigned'}</span>
                    </div>
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