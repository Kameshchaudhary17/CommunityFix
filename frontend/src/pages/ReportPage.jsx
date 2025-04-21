import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header'; // Fixed typo in import (was Hearder)
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { 
  MapPin, 
  Search, 
  Camera, 
  AlertTriangle, 
  Upload, 
  CheckCircle, 
  Trash2, 
  MapIcon, 
  Send, 
  Loader,
  X,
  PlusCircle
} from 'lucide-react';

// Define a custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle click events on map
const LocationPicker = ({ setLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLocation({ lat, lng });
    },
  });
  return null;
};

// Component to update map view when user's location changes
const ChangeMapView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Component to search for places on the map
const SearchPlaceControl = ({ onSearch, isSearching }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };
  
  return (
    <div className="absolute top-2 left-2 right-2 z-[1000]">
      {/* Change the form to a div */}
      <div className="flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a location..."
            className="w-full pl-10 pr-12 py-2 bg-white rounded-lg shadow-md border-0 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          {searchTerm && (
            <button
              type="button"
              className="absolute inset-y-0 right-10 flex items-center pr-2"
              onClick={() => setSearchTerm("")}
            >
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button 
          type="button" // Changed from submit to button type
          className="ml-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md"
          disabled={isSearching}
          onClick={handleSearch} // Add onClick handler here
        >
          {isSearching ? <Loader size={16} className="animate-spin" /> : "Search"}
        </button>
      </div>
    </div>
  );
};

const ReportPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    municipality: '',
    wardNumber: '',
    category: 'infrastructure', // Added category field with default
  });
  
  const [photos, setPhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [location, setLocation] = useState({ lat: 27.7172, lng: 85.3240 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]);
  const [zoom, setZoom] = useState(15);
  const [isSearching, setIsSearching] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formStep, setFormStep] = useState(1); // For multi-step form
  const [progress, setProgress] = useState(0); // For upload progress
  
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Predefined categories for reports
  const categories = [
    { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️' },
    { id: 'environment', name: 'Environment', icon: '🌳' },
    { id: 'safety', name: 'Safety & Security', icon: '🔒' },
    { id: 'utilities', name: 'Utilities', icon: '💡' },
    { id: 'waste', name: 'Waste Management', icon: '🗑️' },
    { id: 'other', name: 'Other Issues', icon: '❓' }
  ];

  // Check if user is logged in
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      // Show welcome message with animation
      toast.success('Ready to report an issue!', {
        icon: '👋',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  }, [token, navigate]);

  // Get user's current location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          setZoom(15);
          
          // Reverse geocode to get address
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Using default location.", {
            icon: <AlertTriangle size={18} />,
          });
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  }, []);

  // Handle search for places on the map - Fixed implementation
  const handlePlaceSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Using Nominatim for geocoding (OpenStreetMap's service)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'en' // Keep this header, it's allowed
            // Remove the User-Agent header
          }
        }
      );
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        
        // Update location and map center
        setLocation({ lat: newLat, lng: newLng });
        setMapCenter([newLat, newLng]);
        setZoom(16);
        
        // Update form data with location details
        reverseGeocode(newLat, newLng);
        
        toast.success(`Found location: ${result.display_name}`, {
          icon: <MapPin size={18} />,
        });
      } else {
        toast.error("No location found. Please try a different search term.", {
          icon: <AlertTriangle size={18} />,
        });
      }
    } catch (error) {
      console.error("Error searching for place:", error);
      toast.error("Failed to search for location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  
  // Reverse geocode to get address details from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en' // Keep this header, it's allowed
            // Remove the User-Agent header
          }
        }
      );
      
      if (response.data && response.data.address) {
        const address = response.data.address;
        
        // Try to extract municipality and ward information
        const municipality = 
          address.city || 
          address.town || 
          address.village || 
          address.suburb || 
          address.county ||
          '';
          
        // Ward number might not be directly available from reverse geocoding
        
        setFormData(prev => ({
          ...prev,
          municipality
        }));
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle file selection through drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // For the normal file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Common function to handle files from both drag & drop and file input
  const handleFiles = (files) => {
    const selectedFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (selectedFiles.length > 0) {
      // Limit to 5 photos total
      const combinedPhotos = [...photos, ...selectedFiles].slice(0, 5);
      setPhotos(combinedPhotos);
      
      // Create preview URLs for new photos
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prevUrls => {
        const combinedUrls = [...prevUrls, ...newUrls].slice(0, 5);
        return combinedUrls;
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index) => {
    setPhotos(prevPhotos => {
      const updatedPhotos = [...prevPhotos];
      updatedPhotos.splice(index, 1);
      return updatedPhotos;
    });

    setPreviewUrls(prevUrls => {
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(prevUrls[index]);
      
      const updatedUrls = [...prevUrls];
      updatedUrls.splice(index, 1);
      return updatedUrls;
    });
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Move to next form step
  const goToNextStep = (e) => {
    e.preventDefault();
    
    // Validate current step
    if (formStep === 1) {
      if (!formData.title || !formData.description || !formData.category) {
        toast.error('Please fill in all required fields in this step', {
          icon: <AlertTriangle size={18} />
        });
        return;
      }
    } else if (formStep === 2) {
      if (!formData.municipality || !formData.wardNumber) {
        toast.error('Please enter municipality and ward number', {
          icon: <AlertTriangle size={18} />
        });
        return;
      }
      
      if (photos.length === 0) {
        toast.error('Please upload at least one photo', {
          icon: <Camera size={18} />
        });
        return;
      }
    }
    
    setFormStep(formStep + 1);
    window.scrollTo(0, 0);
  };

  // Go back to previous step
  const goToPrevStep = () => {
    setFormStep(formStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation
    if (!formData.title || !formData.description ||
      !formData.municipality || !formData.wardNumber) {
      toast.error('Please fill in all required fields', {
        icon: <AlertTriangle size={18} />
      });
      return;
    }

    if (photos.length === 0) {
      toast.error('Please upload at least one photo', {
        icon: <Camera size={18} />
      });
      return;
    }

    setIsSubmitting(true);
    
    // Start simulated progress
    setProgress(10);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // Create FormData object to handle file uploads
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('municipality', formData.municipality);
      formDataToSend.append('wardNumber', formData.wardNumber);
      formDataToSend.append('latitude', location.lat);
      formDataToSend.append('longitude', location.lng);
      formDataToSend.append('category', formData.category);

      // Append multiple photos
      photos.forEach(photo => {
        formDataToSend.append('photo', photo);
      });

      // Debug to check if photos are being added to FormData
      console.log("Number of photos being sent:", photos.length);

      const response = await axios.post(
        'http://localhost:5555/api/report/createReport',
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Complete progress
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);

      if (response.data) {
        toast.success('Report submitted successfully!', {
          icon: <CheckCircle size={18} />,
          duration: 5000
        });

        // Reset form and state
        setFormData({
          title: '',
          description: '',
          municipality: '',
          wardNumber: '',
          category: 'infrastructure'
        });
        setPhotos([]);
        setPreviewUrls([]);
        setFormStep(1);

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit report', {
        icon: <AlertTriangle size={18} />
      });
      setProgress(0);
    } finally {
      setIsSubmitting(false);
      clearInterval(progressInterval);
    }
  };

  // Render the form based on current step
  const renderFormStep = () => {
    switch (formStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Start by providing basic details about the issue you're reporting.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Report Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData({...formData, category: category.id})}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                      formData.category === category.id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-2xl mb-2">{category.icon}</span>
                    <span className="text-sm font-medium text-center">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a title for your report"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of the issue. Include when you noticed it and any other relevant details."
                rows="5"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={goToNextStep}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center shadow-md"
              >
                Next: Location & Photos
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    We've detected your current location. You can search for a specific place or click on the map to adjust the pin.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Map with Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set Location <span className="text-red-500">*</span>
              </label>
              <div className="h-64 md:h-80 w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm relative">
                <MapContainer
                  center={mapCenter}
                  zoom={zoom}
                  className="h-full w-full"
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[location.lat, location.lng]} icon={customIcon} />
                  <LocationPicker setLocation={setLocation} />
                  <ChangeMapView center={mapCenter} zoom={zoom} />
                </MapContainer>
                <SearchPlaceControl onSearch={handlePlaceSearch} isSearching={isSearching} />
                
                {/* Coordinates display */}
                <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs text-gray-600 shadow-sm border border-gray-200">
                  Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <MapIcon className="h-4 w-4 mr-1" />
                Click on the map to adjust the location or search for a place
              </p>
            </div>

            {/* Municipality and Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
                  Municipality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="municipality"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleChange}
                  placeholder="Enter municipality"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="wardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Ward Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="wardNumber"
                  name="wardNumber"
                  value={formData.wardNumber}
                  onChange={handleChange}
                  placeholder="Ward no."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  required
                />
              </div>
            </div>
            
            {/* Multiple Photos Upload - Drag & Drop */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photos <span className="text-red-500">*</span> <span className="text-gray-500 text-xs">(Max 5 photos)</span>
              </label>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-6 transition-all ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                  <Upload size={32} className={`${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Drag & drop photos here, or
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-md text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Browse files
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  id="photos"
                  name="photos"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
              </div>
              
              {/* Preview Selected Photos */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Camera size={16} className="mr-2" />
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'} selected:
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm aspect-square">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
                          aria-label="Remove photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add more button if less than 5 photos */}
                    {previewUrls.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 text-gray-500 hover:text-blue-500 hover:border-blue-300 transition-colors aspect-square"
                      >
                        <PlusCircle size={24} className="mb-2" />
                        <span className="text-xs font-medium">Add Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center justify-center shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              
              <button
                type="button"
                onClick={goToNextStep}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center shadow-md"
              >
                Next: Preview & Submit
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Review your report details before final submission.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Report Preview */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
  <h3 className="text-lg font-semibold text-gray-900">Report Summary</h3>
</div>
                
<div className="p-6 space-y-6">
  {/* Category */}
  <div>
    <h4 className="text-sm font-semibold text-gray-600 mb-1">Category</h4>
    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">
      {categories.find(cat => cat.id === formData.category)?.icon} {" "}
      {categories.find(cat => cat.id === formData.category)?.name || formData.category}
    </p>
  </div>
  
  {/* Title & Description */}
  <div>
    <h4 className="text-sm font-semibold text-gray-600 mb-1">Title</h4>
    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">{formData.title}</p>
  </div>
  
  <div>
    <h4 className="text-sm font-semibold text-gray-600 mb-1">Description</h4>
    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-line">{formData.description}</p>
  </div>
  
  {/* Location Details */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <h4 className="text-sm font-semibold text-gray-600 mb-1">Municipality</h4>
      <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">{formData.municipality}</p>
    </div>
    <div>
      <h4 className="text-sm font-semibold text-gray-600 mb-1">Ward Number</h4>
      <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">{formData.wardNumber}</p>
    </div>
  </div>
  
  <div>
    <h4 className="text-sm font-semibold text-gray-600 mb-1">Location Coordinates</h4>
    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">
      <span className="inline-flex items-center">
        <MapPin size={14} className="mr-1 text-gray-500" />
        Latitude: {location.lat.toFixed(5)}, Longitude: {location.lng.toFixed(5)}
      </span>
    </p>
  </div>
  
  {/* Photos Preview */}
  <div>
    <h4 className="text-sm font-semibold text-gray-600 mb-1">Photos ({previewUrls.length})</h4>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {previewUrls.map((url, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-gray-200 shadow-sm aspect-square">
          <img
            src={url}
            alt={`Photo ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  </div>
</div>
</div>

{/* Submit buttons */}
<div className="flex justify-between">
  <button
    type="button"
    onClick={goToPrevStep}
    className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center justify-center shadow-sm"
  >
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
    Back to Edit
  </button>
  
  <button
    type="submit"
    onClick={handleSubmit}
    disabled={isSubmitting}
    className={`bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center justify-center shadow-md ${
      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
    }`}
  >
    {isSubmitting ? (
      <>
        <Loader size={18} className="animate-spin mr-2" />
        Submitting...
      </>
    ) : (
      <>
        <Send size={18} className="mr-2" />
        Submit Report
      </>
    )}
  </button>
</div>

{/* Progress bar when submitting */}
{progress > 0 && (
  <div className="mt-4">
    <div className="w-full bg-gray-200 rounded-full h-2 my-1">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
    <p className="text-xs text-gray-500 text-right">{progress}% complete</p>
  </div>
)}
</div>
);
    default:
      return null;
  }
};

return (
  <div className="flex h-screen bg-gray-50">
    {/* Sidebar - full height */}
    <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200">
      <Sidebar />
    </div>
    
    {/* Main Content Container */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <Header />
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
            <p className="text-gray-600 mt-1">Help improve your community by reporting issues you've noticed.</p>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Line connecting steps */}
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
              
              {/* Step 1 */}
              <div className={`flex flex-col items-center relative z-10 ${formStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  formStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  1
                </div>
                <div className="text-xs font-medium mt-2">Details</div>
              </div>
              
              {/* Step 2 */}
              <div className={`flex flex-col items-center relative z-10 ${formStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  formStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  2
                </div>
                <div className="text-xs font-medium mt-2">Location & Photos</div>
              </div>
              
              {/* Step 3 */}
              <div className={`flex flex-col items-center relative z-10 ${formStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  formStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  3
                </div>
                <div className="text-xs font-medium mt-2">Review & Submit</div>
              </div>
            </div>
          </div>
          
          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <form onSubmit={e => e.preventDefault()} className="space-y-6">
                {renderFormStep()}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
    
    <Toaster position="top-right" />
  </div>
);
};

export default ReportPage;