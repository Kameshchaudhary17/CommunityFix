import React, { useState, useEffect } from 'react';
import { Camera, Edit2, X, Save, User, Mail, Phone, Calendar, MapPin, Home, CreditCard, Upload, Eye, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Define the API base URL - adjust based on your backend configuration
const API_BASE_URL = 'http://localhost:5555/api';

const Profile = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState({
    user_name: "",
    user_email: "",
    contact: "",
    municipality: "",
    wardNumber: "",
    dob: "",
    profilePicture: "/api/placeholder/400/400",
    citizenshipPhoto: [], // Changed to array
  });

  // Form state for editing
  const [formData, setFormData] = useState({ ...profile });
  // State to track new citizenship photos for upload
  const [citizenshipPhotos, setCitizenshipPhotos] = useState([]);

  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
  }

  // Reset form data when edit mode changes
  useEffect(() => {
    if (isEditMode) {
      setFormData({ ...profile });
      // Reset citizenship photos array when entering edit mode
      setCitizenshipPhotos([]);
    }
  }, [isEditMode, profile]);

  // Fetch current user data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          // Handle unauthenticated state - redirect to login
          window.location.href = '/login';
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/auth/getcurrentuser`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && response.data.user) {
          const user = response.data.user;

          console.log("User data received:", user);

          // Process citizenship photos to ensure consistent format
          // Ensure it's always an array for frontend display
          const citizenshipPhotoArray = Array.isArray(user.citizenshipPhoto) 
            ? user.citizenshipPhoto 
            : user.citizenshipPhoto ? [user.citizenshipPhoto] : [];
          
          // Map backend user data to our frontend profile state
          setProfile({
            user_name: user.user_name || "",
            user_email: user.user_email || "",
            contact: user.contact || "",
            municipality: user.municipality || "",
            wardNumber: user.wardNumber || "",
            dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
            profilePicture: user.profilePicture ? `http://localhost:5555/${user.profilePicture}` : "/api/placeholder/400/400",
            citizenshipPhoto: citizenshipPhotoArray.map(photo => `http://localhost:5555/${photo}`),
            bio: user.bio || "",
            // Store all possible ID fields
            id: user.user_id,
            _id: user._id,
            user_id: user.user_id
          });

          // Also set the initial form data
          setFormData({
            user_name: user.user_name || "",
            user_email: user.user_email || "",
            contact: user.contact || "",
            municipality: user.municipality || "",
            wardNumber: user.wardNumber || "",
            dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
            profilePicture: user.profilePicture ? `http://localhost:5555/${user.profilePicture}` : "/api/placeholder/400/400",
            citizenshipPhoto: citizenshipPhotoArray.map(photo => `http://localhost:5555/${photo}`),
            bio: user.bio || "",
            id: user.user_id,
            _id: user._id,
            user_id: user.user_id
          });
        }
      } catch (error) {
        toast.error("Failed to load profile");
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSaveChanges = async () => {
  try {
    setIsUploading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      toast.error("Authentication error, please login again");
      window.location.href = '/login';
      return;
    }

    // Create FormData object
    const updateFormData = new FormData();

    // Add the basic text fields
    updateFormData.append('user_name', formData.user_name);
    updateFormData.append('contact', formData.contact);
    updateFormData.append('municipality', formData.municipality);
    updateFormData.append('wardNumber', formData.wardNumber);
    updateFormData.append('dob', formData.dob);
    updateFormData.append('bio', formData.bio || '');

    // Add profile picture if it exists - make sure field name matches backend expectation
    if (formData.profilePicture instanceof File) {
      console.log("Adding profile picture file:", formData.profilePicture.name);
      updateFormData.append('profilePicture', formData.profilePicture);
    }

    // Add all citizenship photos if they exist
    if (citizenshipPhotos.length > 0) {
      citizenshipPhotos.forEach(photo => {
        if (photo.file instanceof File) {
          console.log("Adding citizenship photo file:", photo.file.name);
          updateFormData.append('citizenshipPhotos', photo.file); // Changed to match backend field name
        }
      });
    }

    // Get user ID - use the first available ID from the profile
    const userId = profile.user_id || profile.id || profile._id;

    if (!userId) {
      console.error("User ID missing in profile:", profile);
      toast.error("User ID not found - cannot update profile");
      return;
    }

    console.log("Updating user with ID:", userId);

    // Update endpoint based on the backend controller
    const updateUrl = `${API_BASE_URL}/auth/users/${userId}`;
    console.log("Sending update request to:", updateUrl);

    // Log FormData contents for debugging (can't directly console.log FormData)
    for (let [key, value] of updateFormData.entries()) {
      console.log(`FormData: ${key} = ${value instanceof File ? value.name : value}`);
    }

    const response = await axios.put(
      updateUrl,
      updateFormData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Handle successful response
    if (response.data) {
      console.log("Update successful:", response.data);

      // Get the updated user data from the response
      const updatedUser = response.data.user || response.data;

      // Process citizenship photos to ensure consistent format
      const citizenshipPhotoArray = Array.isArray(updatedUser.citizenshipPhoto) 
        ? updatedUser.citizenshipPhoto 
        : updatedUser.citizenshipPhoto ? [updatedUser.citizenshipPhoto] : [];

      // Update the profile state
      setProfile(prevProfile => ({
        ...prevProfile,
        user_name: updatedUser.user_name || prevProfile.user_name,
        user_email: updatedUser.user_email || prevProfile.user_email,
        contact: updatedUser.contact || prevProfile.contact,
        municipality: updatedUser.municipality || prevProfile.municipality,
        wardNumber: updatedUser.wardNumber || prevProfile.wardNumber,
        dob: updatedUser.dob || prevProfile.dob,
        bio: updatedUser.bio || prevProfile.bio,

        // Handle image paths correctly
        profilePicture: updatedUser.profilePicture ?
          `http://localhost:5555/${updatedUser.profilePicture}` :
          prevProfile.profilePicture,

        citizenshipPhoto: citizenshipPhotoArray.map(photo => `http://localhost:5555/${photo}`),
      }));

      // Reset citizenship photos array
      setCitizenshipPhotos([]);
      setIsEditMode(false);
      toast.success("Profile updated successfully!");
    }
  } catch (error) {
    console.error("Error updating profile:", error);

    // Check for specific error types to provide better error messages
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);

      // More specific error message for MulterError
      if (error.response.data && error.response.data.includes("MulterError")) {
        toast.error("File upload error. Check field names or file size limits.");
      } else if (error.response.status === 404) {
        toast.error("Profile update failed: The server endpoint doesn't exist. Please contact support.");
      } else if (error.response.status === 401 || error.response.status === 403) {
        toast.error("Authentication error. Please log in again.");
      } else {
        toast.error(`Failed to update profile: ${error.response.data.message || "Server error"}`);
      }
    } else if (error.request) {
      toast.error("No response received from server. Check your internet connection.");
    } else {
      toast.error("Error setting up the request");
    }
  } finally {
    setIsUploading(false);
  }
};

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData({ ...profile });
    setCitizenshipPhotos([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoClick = (photo, title) => {
    setSelectedPhoto({ url: photo, title });
    setIsPhotoModalOpen(true);
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File too large. Maximum size is 5MB.`);
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Please upload a JPG, PNG, or GIF image.`);
      return;
    }

    setIsUploading(true);

    // Create a preview for the UI
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log(`File selected for profile picture:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Store the file object for later upload
      setFormData(prev => ({
        ...prev,
        profilePicturePreview: reader.result,
        profilePicture: file
      }));

      setIsUploading(false);
      toast.success("Profile picture selected");
    };

    reader.onerror = () => {
      console.error("Error reading file");
      toast.error(`Error reading the file. Please try again.`);
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleCitizenshipPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File too large. Maximum size is 5MB.`);
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Please upload a JPG, PNG, or GIF image.`);
      return;
    }

    setIsUploading(true);

    // Create a preview for the UI
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log(`File selected for citizenship photo:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Add to citizenship photos array
      setCitizenshipPhotos(prev => [
        ...prev,
        {
          id: Date.now(), // Unique ID for the list
          file: file,
          preview: reader.result
        }
      ]);

      setIsUploading(false);
      toast.success("Citizenship document added");
    };

    reader.onerror = () => {
      console.error("Error reading file");
      toast.error(`Error reading the file. Please try again.`);
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const removeCitizenshipPhoto = (id) => {
    setCitizenshipPhotos(prev => prev.filter(photo => photo.id !== id));
    toast.success("Citizenship document removed");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 md:flex-row">
      <Toaster position="top-right" />
      <Sidebar className="w-full md:w-64 flex-shrink-0" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-gray-50 pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            {/* Profile Header Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-8">
              <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-700">
                <div className="absolute -bottom-16 left-8 flex items-end">
                  <div className="relative">
                    <img
                      src={formData.profilePicturePreview || profile.profilePicture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
                      onClick={() => handlePhotoClick(formData.profilePicturePreview || profile.profilePicture, "Profile Picture")}
                    />
                    {isEditMode && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                        <Camera size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-4 right-6">
                  <button
                    onClick={() => isEditMode ? handleCancel() : setIsEditMode(true)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${isEditMode
                        ? 'bg-white text-blue-600 hover:bg-gray-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    {isEditMode ? (
                      <>
                        <X size={16} /> Cancel Edit
                      </>
                    ) : (
                      <>
                        <Edit2 size={16} /> Edit Profile
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-20 pb-6 px-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{profile.user_name}</h1>
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <CreditCard size={16} />
                      ID: USR-{profile.user_id ? profile.user_id.toString().substring(0, 4) : '0000'}
                    </p>
                  </div>

                  {isEditMode && (
                    <button
                      onClick={handleSaveChanges}
                      disabled={isUploading}
                      className={`mt-4 sm:mt-0 px-5 py-2.5 ${isUploading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg flex items-center gap-2 transition-colors`}
                    >
                      {isUploading ? 'Saving...' : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Profile Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('personal')}
                      className={`py-3 px-1 font-medium text-sm border-b-2 ${activeTab === 'personal'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      Personal Information
                    </button>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className={`py-3 px-1 font-medium text-sm border-b-2 ${activeTab === 'documents'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      Documents
                    </button>
                  </nav>
                </div>

                {/* Personal Information Tab */}
                {activeTab === 'personal' && (
                  <div className="py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Full Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <User size={14} /> Full Name
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            name="user_name"
                            value={formData.user_name}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">{profile.user_name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Mail size={14} /> Email Address
                        </label>
                        <p className="font-medium text-gray-800">{profile.user_email}</p>
                      </div>

                      {/* Contact */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Phone size={14} /> Contact Number
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            name="contact"
                            value={formData.contact}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">{profile.contact}</p>
                        )}
                      </div>

                      {/* DOB */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Calendar size={14} /> Date of Birth
                        </label>
                        {isEditMode ? (
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">
                            {profile.dob ? new Date(profile.dob).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : "Not provided"}
                          </p>
                        )}
                      </div>

                      {/* Municipality */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <MapPin size={14} /> Municipality
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            name="municipality"
                            value={formData.municipality}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">{profile.municipality || "Not provided"}</p>
                        )}
                      </div>

                      {/* Ward No */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Home size={14} /> Ward No.
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            name="wardNumber"
                            value={formData.wardNumber}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">{profile.wardNumber || "Not provided"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                  <div className="py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Profile Picture */}
                      <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                        <div className="relative mb-4">
                          <img
                            src={formData.profilePicturePreview || profile.profilePicture}
                            alt="Profile"
                            className="w-48 h-48 rounded-lg shadow-md object-cover"
                          />
                          <button
                            onClick={() => handlePhotoClick(formData.profilePicturePreview || profile.profilePicture, "Profile Picture")}
                            className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        </div>

                        {isEditMode && (
                          <label className="w-full cursor-pointer">
                            <div className={`flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors ${isUploading ? 'bg-blue-50' : ''}`}>
                              {isUploading ? (
                                <span className="text-blue-600">Uploading...</span>
                              ) : (
                                <>
                                  <Upload size={16} />
                                  <span>Upload new picture</span>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleProfilePhotoUpload}
                              disabled={isUploading}
                            />
                          </label>
                        )}
                      </div>

                      {/* Citizenship Photos */}
                      <div className="bg-gray-50 rounded-xl p-6 flex flex-col">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Citizenship Documents</h3>

                        {/* Display existing citizenship photos */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {profile.citizenshipPhoto.length > 0 ? (
                            profile.citizenshipPhoto.map((photo, index) => (
                              <div key={index} className="flex flex-col items-center">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Document {index + 1}</h4>
                                <div className="relative mb-3">
                                  <img
                                    src={photo}
                                    alt={`Citizenship Document ${index + 1}`}
                                    className="w-full h-32 rounded-lg shadow-md object-cover"
                                  />
                                  <button
                                    onClick={() => handlePhotoClick(photo, `Citizenship Document ${index + 1}`)}
                                    className="absolute bottom-2 right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <Eye size={14} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 text-center text-gray-500">
                              No citizenship documents uploaded
                            </div>
                          )}
                        </div>

                        {/* Display new citizenship photos to be uploaded */}
                        {isEditMode && citizenshipPhotos.length > 0 && (
                          <>
                            <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">New Documents</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {citizenshipPhotos.map(photo => (
                                <div key={photo.id} className="flex flex-col items-center">
                                  <div className="relative mb-3">
                                    <img
                                      src={photo.preview}
                                      alt="New Citizenship Document"
                                      className="w-full h-32 rounded-lg shadow-md object-cover"
                                    />
                                    <button
                                      onClick={() => removeCitizenshipPhoto(photo.id)}
                                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                    <button
                                      onClick={() => handlePhotoClick(photo.preview, "New Citizenship Document")}
                                      className="absolute bottom-2 right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                                    >
                                      <Eye size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {isEditMode && (
                          <label className="w-full cursor-pointer mt-2">
                            <div className={`flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors ${isUploading ? 'bg-blue-50' : ''}`}>
                              {isUploading ? (
                                <span className="text-blue-600">Uploading...</span>
                              ) : (
                                <>
                                  <Plus size={16} />
                                  <span>Update citizenship photo</span>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCitizenshipPhotoUpload}
                              disabled={isUploading}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Photo View Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{selectedPhoto.title}</h3>
            </div>

            <div className="p-4 flex justify-center">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[70vh] w-auto"
              />
            </div>

            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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

export default Profile;