import React, { useState } from 'react';
import axios from 'axios';
import loginImage from '../assets/photo/login.png';
import { useNavigate, Link } from 'react-router-dom';
import ForgotPasswordPopup from '../components/ForgetPassword';
import { Eye, EyeOff, AlertCircle, Wifi, Server, Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    user_email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error states
    setError('');
    setErrorType('');
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5555/api/auth/login', formData);
  
      // Store token & user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
  
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
    } finally {
      setIsLoading(false);
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

  // Helper function to get error icon based on error type
  const getErrorIcon = () => {
    switch (errorType) {
      case 'auth':
        return <Lock className="w-5 h-5 text-red-600" />;
      case 'network':
        return <Wifi className="w-5 h-5 text-yellow-600" />;
      case 'server':
        return <Server className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Section - Illustration */}
      <div className="bg-blue-50 lg:w-1/2 p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background elements for visual interest */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-teal-200 rounded-full opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-green-200 rounded-full opacity-20"></div>
        </div>

        <div className="max-w-md w-full relative z-10">
          <h1 className="text-3xl md:text-4xl text-blue-700 font-bold text-center mb-4">
            Be Together
          </h1>
          <h2 className="text-2xl md:text-3xl text-blue-700 font-bold text-center mb-8">
            Make Society Better
          </h2>
          
          <div className="relative mb-8">
            <div className="w-full h-48 md:h-64 bg-teal-100 rounded-lg opacity-30 absolute"></div>
            <img 
              src={loginImage}
              alt="World Map"
              className="w-full h-108 md:h-124 object-contain relative z-10"
            />
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="lg:w-1/2 p-8 flex items-center justify-center bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
          <div className="flex justify-center mb-8">
            <div className="flex items-center text-2xl md:text-3xl font-bold text-blue-500">
              Community
              <span className="text-teal-500">Fix</span>
              <div className="w-8 h-8 ml-2 rounded-full border-2 border-teal-500 flex items-center justify-center">
                🌍
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">Welcome</h3>

          {/* Display error message if there's an error */}
          {error && (
            <div className={`${getErrorBgColor()} border-l-4 border-red-500 p-4 mb-6 rounded flex items-start`}>
              <span className="mr-2">{getErrorIcon()}</span>
              <p className="text-gray-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="user_email" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="user_email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                  className={`pl-10 block w-full px-3 py-2 border ${errorType === 'auth' ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                  placeholder="Your email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <button 
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-green-600 hover:text-green-500 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`pl-10 block w-full px-3 py-2 border ${errorType === 'auth' ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-300 flex-grow"></div>
              <span className="px-3 text-sm text-gray-500 bg-white">or continue with</span>
              <div className="border-t border-gray-300 flex-grow"></div>
            </div>

            <div className="text-center py-4">
              <span className="text-gray-600 text-sm">Are you new? </span>
              <Link 
                to="/signup" 
                className="text-green-600 hover:text-green-500 font-medium hover:underline transition-colors"
              >
                Create an Account
              </Link>
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