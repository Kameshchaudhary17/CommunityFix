import React, { useState, useEffect } from 'react';
import { X, Plus, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

const AddMunicipality = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [municipalityToDelete, setMunicipalityToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    municipality: '',
    wardNumber: '',
    contact: '',
    user_email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];

    // Name validation
    if (!formData.user_name.trim()) {
      errors.push('Name is required');
    }

    // Municipality validation
    if (!formData.municipality.trim()) {
      errors.push('Municipality is required');
    }

    // Ward Number validation
    if (!formData.wardNumber) {
      errors.push('Ward Number is required');
    }

    // Contact validation (10-digit phone number)
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.contact.match(phoneRegex)) {
      errors.push('Contact number must be 10 digits');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.user_email.match(emailRegex)) {
      errors.push('Invalid email address');
    }

    // Password validation
    if (formData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  };

  const fetchMunicipalities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5555/api/auth/municipalityuser', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMunicipalities(response.data.data);
    } catch (error) {
      console.error('Error fetching municipalities:', error);
      toast.error('Failed to fetch municipalities');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    
    // If there are validation errors, show them
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    // Start submission process
    setIsSubmitting(true);

    try {
      // Prepare data for submission (excluding confirmPassword)
      const submissionData = {
        user_name: formData.user_name,
        user_email: formData.user_email,
        role: 'MUNICIPALITY',
        municipality: formData.municipality,
        wardNumber: parseInt(formData.wardNumber),
        contact: formData.contact,
        password: formData.password
      };

      // Get token from local storage
      const token = localStorage.getItem('token');

      // Send POST request to backend
      const response = await axios.post(
        'http://localhost:5555/api/auth/signup', 
        submissionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Success handling
      toast.success('Municipality added successfully!');
      
      // Refresh municipalities list
      fetchMunicipalities();
      
      // Reset form and close modal
      setFormData({
        user_name: '',
        municipality: '',
        wardNumber: '',
        contact: '',
        user_email: '',
        password: '',
        confirmPassword: ''
      });
      setIsModalOpen(false);

    } catch (error) {
      // Error handling
      console.error('Submission error:', error);
      
      // Check if there's a specific error message from the backend
      const errorMessage = error.response?.data?.error || 'Failed to add municipality';
      toast.error(errorMessage);
    } finally {
      // Always reset submitting state
      setIsSubmitting(false);
    }
  };

  const confirmDeleteMunicipality = (municipality) => {
    setMunicipalityToDelete(municipality);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteMunicipality = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5555/api/auth/users/${municipalityToDelete.user_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Municipality deleted successfully');
      fetchMunicipalities();
      setIsDeleteModalOpen(false);
      setMunicipalityToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete municipality');
    }
  };

  // Fetch municipalities on component mount
  useEffect(() => {
    fetchMunicipalities();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toaster for notifications */}
      <Toaster />

      {/* Sidebar */}
      <AdminSidebar className="w-64 flex-shrink-0" />
      
      <div className="p-6 flex-1 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Municipality Management</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Municipality
          </button>
        </div>

        {/* Municipalities Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Municipality</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Ward</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {municipalities?.map((municipality) => (
                <tr key={municipality.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{municipality.user_name}</td>
                  <td className="px-6 py-4">{municipality.municipality}</td>
                  <td className="px-6 py-4">{municipality.wardNumber}</td>
                  <td className="px-6 py-4">{municipality.user_email}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => confirmDeleteMunicipality(municipality)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete Municipality"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {municipalities.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No municipalities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Municipality Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add Municipality</h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Municipality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                  <input
                    type="text"
                    name="municipality"
                    value={formData.municipality}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Ward Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ward Number</label>
                  <input
                    type="number"
                    name="wardNumber"
                    value={formData.wardNumber}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={handleInputChange}
                    pattern="[0-9]{10}"
                    placeholder="10-digit number"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="user_email"
                    value={formData.user_email}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      onChange={handleInputChange}
                      minLength="8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      onChange={handleInputChange}
                      minLength="8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && municipalityToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center mb-4 text-red-600">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h2 className="text-xl font-semibold">Confirm Deletion</h2>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete the municipality <span className="font-semibold">{municipalityToDelete.municipality}</span> with user <span className="font-semibold">{municipalityToDelete.user_name}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setMunicipalityToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMunicipality}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMunicipality;