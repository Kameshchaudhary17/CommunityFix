import React, { useState } from 'react';
import loginImage from '../assets/photo/login.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    contact: '',
    dob: '',
    password: '',
    confirmPassword: '',
    municipality: '',
    wardNumber: '',
    profilePicture: null,
    citizenshipPhoto: [], // Array for multiple files
  });
  
  // Add state for error messages
  const [errors, setErrors] = useState({
    form: '',
    password: '',
    municipality: ''
  });

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing again
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    
    // Handle citizenship photos differently (as an array)
    if (name === "citizenshipPhoto") {
      // Convert FileList to Array
      const newFiles = Array.from(files);
      
      setFormData((prev) => {
        // Combine with existing files but limit to 2 total
        const updatedFiles = [...prev.citizenshipPhoto, ...newFiles].slice(0, 2);
        return {
          ...prev,
          [name]: updatedFiles,
        };
      });
    } else {
      // Handle other file inputs normally (single file)
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  // Remove a citizenship photo
  const removeCitizenshipPhoto = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      citizenshipPhoto: prev.citizenshipPhoto.filter((_, index) => index !== indexToRemove),
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { form: '', password: '', municipality: '' };
    
    // Password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.password = "Passwords do not match";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({ form: '', password: '', municipality: '' });
    
    // Validate form before submission
    if (!validateForm()) return;
  
    try {
      const formDataToSend = new FormData();
  
      // Append all non-file fields
      Object.keys(formData).forEach((key) => {
        if (key !== "profilePicture" && key !== "citizenshipPhoto" && key !== "confirmPassword") {
          formDataToSend.append(key, formData[key]);
        }
      });
  
      // Append profile picture if exists
      if (formData.profilePicture) {
        formDataToSend.append("profilePicture", formData.profilePicture);
      }

      // Append citizenship photos if they exist (can be multiple)
      if (formData.citizenshipPhoto && formData.citizenshipPhoto.length > 0) {
        formData.citizenshipPhoto.forEach(file => {
          formDataToSend.append("citizenshipPhoto", file);
        });
      }
  
      const response = await axios.post("http://localhost:5555/api/auth/signup", formDataToSend, {
        headers: { 
          "Content-Type": "multipart/form-data"
        }
      });
  
      console.log("Server response:", response.data);
      if (response.status === 201) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      
      // Handle specific error for municipality/ward validation
      if (error.response?.data?.error && error.response.data.error.includes("ward") && error.response.data.error.includes("municipality")) {
        setErrors(prev => ({
          ...prev,
          municipality: error.response.data.error
        }));
      } else if (error.response?.data?.error) {
        // Handle other API errors
        setErrors(prev => ({
          ...prev,
          form: error.response.data.error
        }));
      } else {
        // Handle network or other errors
        setErrors(prev => ({
          ...prev,
          form: "An error occurred during signup. Please try again."
        }));
      }
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Illustration */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 lg:w-1/2 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <h1 className="text-3xl md:text-4xl text-blue-700 font-bold text-center mb-4 animate-fadeIn">
            Be Together
          </h1>
          <h2 className="text-2xl md:text-3xl text-blue-700 font-bold text-center mb-8 animate-fadeIn">
            Make Society Better
          </h2>

          <div className="relative mb-8 transform transition hover:scale-105 duration-500">
            <div className="w-full h-64 md:h-80 bg-teal-100 rounded-2xl absolute opacity-30 shadow-lg" />
            <img
              src={loginImage}
              alt="World Map with People"
              className="w-full h-108 md:h-124 object-contain relative z-10"
            />
          </div>
          
          <div className="text-center text-blue-700 mt-8 opacity-80 animate-fadeIn">
            <p className="text-lg">Join our community and help improve your local area.</p>
            <p className="text-sm mt-2">Already have an account? 
              <span className="text-teal-600 font-medium cursor-pointer hover:underline ml-1" 
                onClick={() => navigate("/login")}>
                Login here
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Signup Form */}
      <div className="lg:w-1/2 p-8 bg-white shadow-inner">
        <div className="max-w-md mx-auto">
          <div className="flex justify-end mb-8">
            <div className="flex items-center text-2xl font-bold text-blue-500">
              Community
              <span className="text-teal-500">Fix</span>
              <div className="w-8 h-8 ml-2 rounded-full border-2 border-teal-500 flex items-center justify-center bg-white shadow-md">
                🌍
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create an Account</h2>
            <p className="text-gray-600 mt-1">Join CommunityFix and help make a difference</p>
          </div>

          {/* Display form-level errors */}
          {errors.form && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 mb-4 rounded-r shadow-md animate-fadeIn">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1
                  0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0
                  001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd" />
                </svg>
                {errors.form}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">Email</label>
              <div className="relative">
                <input
                  type="email"
                  name="user_email"
                  value={formData.user_email}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Contact and Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">Contact</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Your phone number"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 pr-12 border ${errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                  placeholder="Create a strong password"
                  required
                />
                <button 
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 pr-12 border ${errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                  placeholder="Confirm your password"
                  required
                />
                <button 
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0
                    00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0
                    001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Municipality and Ward Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">Municipality</label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 border ${errors.municipality ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                  placeholder="Your municipality"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">Ward Number</label>
                <input
                  type="text"
                  name="wardNumber"
                  value={formData.wardNumber}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 border ${errors.municipality ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                  placeholder="Ward number"
                  required
                />
              </div>
            </div>
            
            {/* Municipality/Ward error message */}
            {errors.municipality && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r shadow-md animate-fadeIn">
                <p className="text-sm flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0
                    00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0
                    001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd" />
                  </svg>
                  {errors.municipality}
                </p>
              </div>
            )}

            {/* Upload Profile Picture */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">Profile Picture</label>
              <div className="flex flex-col md:flex-row items-center gap-4">
                {formData.profilePicture ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
                    <img 
                      src={URL.createObjectURL(formData.profilePicture)} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-blue-50">
                    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="mt-1 flex flex-col">
                    <label className="flex items-center justify-center px-4 py-3 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-colors">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          {formData.profilePicture ? "Change photo" : "Upload a photo"}
                        </p>
                      </div>
                      <input
                        type="file"
                        name="profilePicture"
                        onChange={handleFileChange}
                        className="sr-only"
                        accept="image/*"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2 text-center">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Citizenship Photos */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                Citizenship Photos (Front & Back)
              </label>
              
              {/* Show the current count/limit */}
              <div className="flex items-center mb-3">
                <div className="h-2 flex-1 rounded-full bg-gray-200">
                  <div 
                    className={`h-full rounded-full ${formData.citizenshipPhoto.length === 0 ? 'bg-gray-300' : 
                      formData.citizenshipPhoto.length === 1 ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${formData.citizenshipPhoto.length * 50}%` }}
                  ></div>
                </div>
                <span className="ml-3 text-sm text-gray-600">
                  {formData.citizenshipPhoto.length}/2 photos
                </span>
              </div>
              
              {/* Show selected photos with remove option */}
              {formData.citizenshipPhoto.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4">
                  {formData.citizenshipPhoto.map((file, index) => (
                    <div key={index} className="relative group/item">
                      <div className="border-2 border-blue-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Citizenship ${index === 0 ? 'Front' : 'Back'}`} 
                          className="w-32 h-24 object-cover" 
                        />
                        <div className="bg-blue-50 py-1 px-2">
                          <p className="text-xs text-center font-medium text-blue-700">
                            {index === 0 ? 'Front Side' : 'Back Side'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCitizenshipPhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Only show the upload button if less than 2 photos are selected */}
              {formData.citizenshipPhoto.length < 2 && (
                <div className="mt-1 flex items-center justify-center px-4 py-4 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-colors">
                  <label className="flex flex-col items-center space-y-2 cursor-pointer w-full">
                    <svg className="h-10 w-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-600">
                      {formData.citizenshipPhoto.length === 0 
                        ? "Upload front side of citizenship" 
                        : "Upload back side of citizenship"}
                    </span>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</span>
                    <input
                      type="file"
                      name="citizenshipPhoto"
                      onChange={handleFileChange}
                      className="sr-only"
                      accept="image/*"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Terms & Privacy Policy */}
            <div className="mt-2">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600">
                    I agree to the
                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500 mx-1">Terms of Service</a>
                    and
                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500 ml-1">Privacy Policy</a>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 duration-200 font-medium"
            >
              Create Account
            </button>
            
            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm">
                Already have an account?
                <span 
                  onClick={() => navigate("/login")}
                  className="text-blue-600 ml-1 font-medium cursor-pointer hover:underline"
                >
                  Login
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;