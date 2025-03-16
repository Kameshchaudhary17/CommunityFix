import React, { useState } from 'react';
import loginImage from '../assets/photo/login.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    contact: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    municipality: '',
    wardNumber: '',
    photo: null,
    citizenshipPhoto: null,
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      const response = await axios.post('http://localhost:5555/api/auth/signup', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(response);
      if (response) {
        navigate('/');
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Illustration */}
      <div className="bg-blue-50 lg:w-1/2 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <h1 className="text-3xl md:text-4xl text-blue-700 font-bold text-center mb-4">
            Be Together
          </h1>
          <h2 className="text-2xl md:text-3xl text-blue-700 font-bold text-center mb-8">
            Make Society Better
          </h2>

          <div className="relative mb-8">
            <div className="w-full h-64 md:h-80 bg-teal-100 rounded-lg absolute opacity-30" />
            <img
              src={loginImage}
              alt="World Map with People"
              className="w-full h-108 md:h-124 object-contain relative z-10"
            />
          </div>
        </div>
      </div>

      {/* Right Section - Signup Form */}
      <div className="lg:w-1/2 p-8 bg-white-100">
        <div className="max-w-md mx-auto">
          <div className="flex justify-end mb-8">
            <div className="flex items-center text-2xl font-bold text-blue-500">
              Community
              <span className="text-teal-500">Fix</span>
              <div className="w-8 h-8 ml-2 rounded-full border-2 border-teal-500 flex items-center justify-center">
                🌍
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="user_email"
                value={formData.user_email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Contact and Date of Birth */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Municipality and Ward Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Municipality</label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ward Number</label>
                <input
                  type="text"
                  name="wardNumber"
                  value={formData.wardNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Upload Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Photo</label>
              <div className="mt-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-sm text-gray-600">Choose a file</span>
                  <input
                    type="file"
                    name="photo"
                    onChange={handleFileChange}
                    className="sr-only"
                    accept="image/*"
                  />
                </label>
              </div>
              {formData.photo && (
                <p className="mt-1 text-sm text-gray-500">{formData.photo.name}</p>
              )}
            </div>

            {/* Upload Citizenship Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Citizenship Photo</label>
              <div className="mt-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-sm text-gray-600">Choose a file</span>
                  <input
                    type="file"
                    name="citizenshipPhoto"
                    onChange={handleFileChange}
                    className="sr-only"
                    accept="image/*"
                  />
                </label>
              </div>
              {formData.citizenshipPhoto && (
                <p className="mt-1 text-sm text-gray-500">{formData.citizenshipPhoto.name}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;