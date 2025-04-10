import React, { useState } from 'react';
import axios from 'axios';
import loginImage from '../assets/photo/login.png';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordPopup from '../components/ForgetPassword';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    user_email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false); // New state for popup
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error states
    setError('');
    setErrorType('');
    
    try {
      const response = await axios.post('http://localhost:5555/api/auth/login', formData);
  
      // Store token & user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
  
      console.log('Login successful:', response.data.user.role);
  
      if(response.data.user.role === "USER"){
        navigate('/home'); 
      } else if(response.data.user.role === "MUNICIPALITY"){
        navigate('/municipality'); 
      } else if(response.data.user.role === "ADMIN"){
        navigate('/admin'); 
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        if (error.response.status === 401) {
          setErrorType('auth');
          setError('Invalid email or password. Please try again.');
        } else if (error.response.status === 404) {
          setErrorType('auth');
          setError('User not found. Please check your email.');
        } else if (error.response.status >= 500) {
          setErrorType('server');
          setError('Server error. Please try again later.');
        } else {
          setErrorType('auth');
          setError(error.response.data?.message || 'Login failed. Please try again.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        setErrorType('network');
        setError('Network error. Please check your internet connection.');
      } else {
        // Something happened in setting up the request
        setErrorType('general');
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Helper function to get error background color based on error type
  const getErrorBgColor = () => {
    switch (errorType) {
      case 'auth':
        return 'bg-red-100';
      case 'network':
        return 'bg-yellow-100';
      case 'server':
        return 'bg-orange-100';
      default:
        return 'bg-red-100';
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
            <div className="w-full h-48 md:h-64 bg-teal-100 rounded-lg opacity-30 absolute" />
            <img 
              src={loginImage}
              alt="World Map"
              className="w-full h-108 md:h-124 object-contain relative z-10"
            />
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="lg:w-1/2 p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="flex justify-center mb-8">
            <div className="flex items-center text-2xl md:text-3xl font-bold text-blue-500">
              Community
              <span className="text-teal-500">Fix</span>
              <div className="w-8 h-8 ml-2 rounded-full border-2 border-teal-500 flex items-center justify-center">
                🌍
              </div>
            </div>
          </div>

          {/* Display error message if there's an error */}
          {error && (
            <div className={`${getErrorBgColor()} border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded`}>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="user_email" 
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="text"
                id="user_email"
                value={formData.user_email}
                onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                className={`mt-1 block w-full px-3 py-2 border ${errorType === 'auth' ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={`mt-1 block w-full px-3 py-2 border ${errorType === 'auth' ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
              />
            </div>

            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-sm text-green-600 hover:text-green-500"
              >
                forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>

            <div className="text-center">
              <span className="text-gray-600">or</span>
            </div>

            <div className="text-center">
              <span className="text-gray-600">Are you new? </span>
              <a 
                href="/signup" 
                className="text-green-600 hover:text-green-500"
              >
                Create an Account
              </a>
            </div>
          </form>
        </div>
      </div>
      
      {/* Forgot Password Popup */}
      <ForgotPasswordPopup 
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default LoginPage;