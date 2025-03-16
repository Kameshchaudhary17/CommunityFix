import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Hearder from '../components/Header';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LocationPicker = ({ setLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLocation({ lat, lng });
    },
  });
  return null;
};

const ReportPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    municipality: '',
    wardNumber: '',
  });
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [location, setLocation] = useState({ lat: 27.7172, lng: 85.3240 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    
    // Create a preview for the selected image
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Free memory when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validation
    if (!formData.title || !formData.description || 
        !formData.municipality || !formData.wardNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
  
    setIsSubmitting(true);
  
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
      
      // Append photo if exists
      if (photo) {
        formDataToSend.append('photo', photo);
      }
  
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
  
      if (response.data) {
        toast.success('Report submitted successfully!');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          municipality: '',
          wardNumber: '',
        });
        setPhoto(null);
        setPreviewUrl(null);
        setLocation({ lat: 27.7172, lng: 85.3240 });
        
        // Clear file input
        if (document.getElementById('photo')) {
          document.getElementById('photo').value = '';
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toaster for notifications */}
      <Toaster />

      {/* Sidebar */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Hearder/>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Report an Issue</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter a title for your report"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide a detailed description of the issue"
                        rows="4"
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                        Upload a Photo
                      </label>
                      <input
                        type="file"
                        id="photo"
                        name="photo"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full p-2 border rounded-lg focus:outline-none"
                      />
                      {previewUrl && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">Preview:</p>
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="h-32 object-cover rounded-lg border border-gray-200" 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Map */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Set Location
                      </label>
                      <div className="h-48 w-full rounded-lg overflow-hidden border">
                        <MapContainer
                          center={[location.lat, location.lng]}
                          zoom={13}
                          className="h-full w-full"
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <Marker position={[location.lat, location.lng]} icon={customIcon} />
                          <LocationPicker setLocation={setLocation} />
                        </MapContainer>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Click on the map to set the location.
                      </p>
                    </div>

                    {/* Municipality and Ward */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
                          Municipality
                        </label>
                        <input
                          type="text"
                          id="municipality"
                          name="municipality"
                          value={formData.municipality}
                          onChange={handleChange}
                          placeholder="Enter municipality"
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="wardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Ward Number
                        </label>
                        <input
                          type="number"
                          id="wardNumber"
                          name="wardNumber"
                          value={formData.wardNumber}
                          onChange={handleChange}
                          placeholder="Ward no."
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportPage;