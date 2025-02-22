import React, { useState, useEffect } from 'react';
import { X, Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

const AddMunicipality = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    municipality: '',
    wardNumber: '',
    contact: '',
    user_email: '',
    password: '',
    confirmPassword: ''
  });

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
      const response = await axios.get('http://localhost:5555/api/municipalities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMunicipalities(response.data);
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

  const handleDeleteMunicipality = async (municipalityId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5555/api/municipality/${municipalityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Municipality deleted successfully');
      fetchMunicipalities();
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
      
      <div className="p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Municipality Management</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add
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
              {municipalities.map((municipality) => (
                <tr key={municipality.user_id}>
                  <td className="px-6 py-4 text-sm text-gray-500">{municipality.user_name}</td>
                  <td className="px-6 py-4">{municipality.municipality}</td>
                  <td className="px-6 py-4">{municipality.wardNumber}</td>
                  <td className="px-6 py-4">{municipality.user_email}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDeleteMunicipality(municipality.user_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add Municipality</h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-gray-500 hover:text-gray-700"
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
                    className="w-full px-3 py-2 border rounded-md"
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
                    className="w-full px-3 py-2 border rounded-md"
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
                    className="w-full px-3 py-2 border rounded-md"
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
                    className="w-full px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                    pattern="[0-9]{10}"
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
                    className="w-full px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    className="w-full px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                    minLength="8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    className="w-full px-3 py-2 border rounded-md"
                    onChange={handleInputChange}
                    minLength="8"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMunicipality;