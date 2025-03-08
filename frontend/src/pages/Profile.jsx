import React, { useState } from 'react';

const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "johndoe@example.com",
    contact: "+977 9812345678",
    municipality: "Kathmandu Metropolitan City",
    wardNo: "10",
    dateOfBirth: "1990-05-15",
    citizenshipNumber: "123-456-7890",
    profilePicture: "/api/placeholder/400/400",
    citizenshipPhoto: "/api/placeholder/400/400"
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd update the profile data here
    setIsEditModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 pt-8 pb-24 px-6 text-center">
            <h1 className="text-white text-2xl font-bold">User Profile</h1>
            <p className="text-blue-100 mt-2">ID: USR-{Math.floor(Math.random() * 10000)}</p>
          </div>
          
          {/* Profile Images */}
          <div className="flex justify-between px-8 -mt-20">
            <div className="relative">
              <img 
                src={profile.profilePicture} 
                alt="Profile" 
                className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
              />
            </div>
            <div className="mt-8">
              <img 
                src={profile.citizenshipPhoto} 
                alt="Citizenship" 
                className="w-24 h-24 rounded-md border-2 border-gray-200 shadow object-cover"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">Citizenship</p>
            </div>
          </div>
          
          {/* Profile Details */}
          <div className="px-8 pt-16 pb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Full Name</p>
                  <p className="font-medium">{profile.name}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Email Address</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Contact Number</p>
                  <p className="font-medium">{profile.contact}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Date of Birth</p>
                  <p className="font-medium">{profile.dateOfBirth}</p>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Municipality</p>
                  <p className="font-medium">{profile.municipality}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Ward No.</p>
                  <p className="font-medium">{profile.wardNo}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Citizenship Number</p>
                  <p className="font-medium">{profile.citizenshipNumber}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with Edit Button */}
          <div className="px-8 py-4 bg-gray-50 border-t flex justify-end">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Edit Profile</h3>
            </div>
            
            <form onSubmit={handleEditSubmit} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    name="contact"
                    value={profile.contact}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Municipality</label>
                  <input
                    type="text"
                    name="municipality"
                    value={profile.municipality}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ward No.</label>
                  <input
                    type="text"
                    name="wardNo"
                    value={profile.wardNo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profile.dateOfBirth}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Citizenship Number</label>
                  <input
                    type="text"
                    name="citizenshipNumber"
                    value={profile.citizenshipNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Photo upload fields would go here in a real application */}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;