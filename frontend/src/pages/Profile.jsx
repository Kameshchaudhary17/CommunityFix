import React, { useState, useEffect } from 'react';
import { Camera, Edit2, X, Save, User, Mail, Phone, Calendar, MapPin, Home, CreditCard, Upload, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { toast, Toaster } from 'react-hot-toast';

const Profile = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "johndoe@example.com",
    contact: "+977 9812345678",
    municipality: "Kathmandu Metropolitan City",
    wardNo: "10",
    dateOfBirth: "1990-05-15",
    citizenshipNumber: "123-456-7890",
    profilePicture: "/api/placeholder/400/400",
    citizenshipPhoto: "/api/placeholder/400/400",
    bio: "I'm a resident of Kathmandu who is passionate about improving our local community through active participation."
  });
  
  // Form state for editing
  const [formData, setFormData] = useState({...profile});
  
  // Reset form data when edit mode changes
  useEffect(() => {
    if (isEditMode) {
      setFormData({...profile});
    }
  }, [isEditMode, profile]);

  const handleSaveChanges = () => {
    // Simulate API call with loading state
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setProfile(formData);
          setIsEditMode(false);
          resolve();
        }, 1000);
      }),
      {
        loading: 'Saving changes...',
        success: 'Profile updated successfully!',
        error: 'Could not save changes.',
      }
    );
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData({...profile});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoClick = (photo, title) => {
    setSelectedPhoto({url: photo, title});
    setIsPhotoModalOpen(true);
  };

  const handlePhotoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      
      // Simulate upload delay
      setTimeout(() => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            [type]: reader.result
          }));
          setIsUploading(false);
          toast.success(`${type === 'profilePicture' ? 'Profile picture' : 'Citizenship photo'} uploaded successfully`);
        };
        reader.readAsDataURL(file);
      }, 1500);
    }
  };

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
                      src={profile.profilePicture} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
                      onClick={() => handlePhotoClick(profile.profilePicture, "Profile Picture")}
                    />
                    {isEditMode && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                        <Camera size={16} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handlePhotoUpload(e, 'profilePicture')}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-4 right-6">
                  <button 
                    onClick={() => setIsEditMode(!isEditMode)} 
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                      isEditMode 
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
                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <CreditCard size={16} />
                      ID: USR-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
                    </p>
                  </div>
                  
                  {isEditMode && (
                    <button 
                      onClick={handleSaveChanges}
                      className="mt-4 sm:mt-0 px-5 py-2.5 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                    >
                      <Save size={16} /> 
                      Save Changes
                    </button>
                  )}
                </div>
                
                {/* User Bio */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  {isEditMode ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Write something about yourself..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] text-gray-700"
                    />
                  ) : (
                    <p className="text-gray-700 italic">{profile.bio}</p>
                  )}
                </div>
                
                {/* Profile Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('personal')}
                      className={`py-3 px-1 font-medium text-sm border-b-2 ${
                        activeTab === 'personal'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Personal Information
                    </button>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className={`py-3 px-1 font-medium text-sm border-b-2 ${
                        activeTab === 'documents'
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
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">{profile.name}</p>
                        )}
                      </div>
                      
                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Mail size={14} /> Email Address
                        </label>
                        {isEditMode ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">{profile.email}</p>
                        )}
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
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">
                            {new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
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
                          <p className="font-medium text-gray-800">{profile.municipality}</p>
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
                            name="wardNo"
                            value={formData.wardNo}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">{profile.wardNo}</p>
                        )}
                      </div>
                      
                      {/* Citizenship Number */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <CreditCard size={14} /> Citizenship Number
                        </label>
                        {isEditMode ? (
                          <input
                            type="text"
                            name="citizenshipNumber"
                            value={formData.citizenshipNumber}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="font-medium text-gray-800">{profile.citizenshipNumber}</p>
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
                            src={isEditMode ? formData.profilePicture : profile.profilePicture} 
                            alt="Profile" 
                            className="w-48 h-48 rounded-lg shadow-md object-cover"
                          />
                          <button 
                            onClick={() => handlePhotoClick(isEditMode ? formData.profilePicture : profile.profilePicture, "Profile Picture")}
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
                              onChange={(e) => handlePhotoUpload(e, 'profilePicture')}
                              disabled={isUploading}
                            />
                          </label>
                        )}
                      </div>
                      
                      {/* Citizenship Photo */}
                      <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Citizenship Document</h3>
                        <div className="relative mb-4">
                          <img 
                            src={isEditMode ? formData.citizenshipPhoto : profile.citizenshipPhoto} 
                            alt="Citizenship" 
                            className="w-48 h-48 rounded-lg shadow-md object-cover"
                          />
                          <button 
                            onClick={() => handlePhotoClick(isEditMode ? formData.citizenshipPhoto : profile.citizenshipPhoto, "Citizenship Document")}
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
                                  <span>Upload new document</span>
                                </>
                              )}
                            </div>
                            <input 
                              type="file"
                              accept="image/*" 
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(e, 'citizenshipPhoto')}
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
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Close
              </button>
            </div>
            
            {/* Close button at top-right */}
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;