import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const ForgetPassword = ({ isOpen, onClose }) => {
  // Different steps in the password reset flow
  const STEPS = {
    REQUEST_OTP: 'REQUEST_OTP',
    VERIFY_OTP: 'VERIFY_OTP',
    NEW_PASSWORD: 'NEW_PASSWORD',
    SUCCESS: 'SUCCESS'
  };

  const [step, setStep] = useState(STEPS.REQUEST_OTP);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  // Request OTP from server
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      await axios.post('http://localhost:5555/api/auth/forget-password', { user_email: email });
      setStatus('idle');
      setStep(STEPS.VERIFY_OTP);
    } catch (error) {
      console.error('OTP request failed:', error);
      setStatus('error');
      
      if (error.response) {
        if (error.response.status === 404) {
          setErrorMessage('Email not found. Please check your email address.');
        } else if (error.response.status >= 500) {
          setErrorMessage('Server error. Please try again later.');
        } else {
          setErrorMessage(error.response.data?.error || 'Failed to send OTP. Please try again.');
        }
      } else if (error.request) {
        setErrorMessage('Network error. Please check your internet connection.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };
  
  // Verify the OTP entered by user
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // Verify OTP with the server
      await axios.post('http://localhost:5555/api/auth/verify-otp', { 
        user_email: email, 
        otp 
      });
      
      setStatus('idle');
      setStep(STEPS.NEW_PASSWORD);
    } catch (error) {
      console.error('OTP verification failed:', error);
      setStatus('error');
      
      if (error.response) {
        if (error.response.status === 400) {
          setErrorMessage('Invalid or expired OTP. Please try again.');
        } else {
          setErrorMessage(error.response.data?.error || 'OTP verification failed.');
        }
      } else if (error.request) {
        setErrorMessage('Network error. Please check your internet connection.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };
  
  // Set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please try again.');
      return;
    }
    
    // Validate password strength (you can adjust these requirements)
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // Reset password with the server
      await axios.post('http://localhost:5555/api/auth/reset-password', {
        user_email: email,
        otp,
        new_password: password
      });
      
      setStatus('idle');
      setStep(STEPS.SUCCESS);
    } catch (error) {
      console.error('Password reset failed:', error);
      setStatus('error');
      
      if (error.response) {
        setErrorMessage(error.response.data?.error || 'Password reset failed. Please try again.');
      } else if (error.request) {
        setErrorMessage('Network error. Please check your internet connection.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };
  
  const resetForm = () => {
    setEmail('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setStatus('idle');
    setErrorMessage('');
    setStep(STEPS.REQUEST_OTP);
  };
  
  // If the popup is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative animate-fadeIn">
        {/* Close button */}
        <button 
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
          
          {errorMessage && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              <p>{errorMessage}</p>
            </div>
          )}
          
          {step === STEPS.REQUEST_OTP && (
            <>
              <p className="text-gray-600 mb-6">
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </p>
              
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your registered email"
                    required
                    disabled={status === 'loading'}
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-white ${
                      status === 'loading' 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : 'Send OTP'}
                  </button>
                </div>
              </form>
            </>
          )}
          
          {step === STEPS.VERIFY_OTP && (
            <>
              <p className="text-gray-600 mb-6">
                We've sent a 6-digit code to <span className="font-medium">{email}</span>. 
                Enter the code below to continue.
              </p>
              
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => {
                      // Only allow digits and limit to 6 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 tracking-widest text-center font-mono text-lg"
                    placeholder="000000"
                    required
                    disabled={status === 'loading'}
                    maxLength={6}
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    OTP is valid for 15 minutes
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(STEPS.REQUEST_OTP)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-white ${
                      status === 'loading' 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={status === 'loading' || otp.length !== 6}
                  >
                    {status === 'loading' ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                
                <div className="text-center mt-4 text-sm">
                  <p className="text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      className="text-blue-600 hover:text-blue-800"
                      disabled={status === 'loading'}
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}
          
          {step === STEPS.NEW_PASSWORD && (
            <>
              <p className="text-gray-600 mb-6">
                Create a new password for your account.
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    disabled={status === 'loading'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new password"
                    required
                    disabled={status === 'loading'}
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(STEPS.VERIFY_OTP)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-white ${
                      status === 'loading' 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </>
          )}
          
          {step === STEPS.SUCCESS && (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h3 className="text-xl font-medium text-gray-900 mb-2">Password Reset Successful</h3>
              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;