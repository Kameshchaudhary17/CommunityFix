import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ArrowLeft, Mail, CheckCircle, Lock, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = Array(6).fill(0).map(() => React.createRef());

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    setPasswordStrength(strength);
  };

  // Request OTP from server
  const handleRequestOTP = async (e) => {
    if (e) e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      await axios.post('http://localhost:5555/api/auth/forget-password', { user_email: email });
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setStep(STEPS.VERIFY_OTP);
        // Set resend countdown
        setResendDisabled(true);
        setCountdown(60);
      }, 500);
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
  
  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Move to next input if value is entered
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };
  
  // Verify the OTP entered by user
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    const otpString = otp.join('');
    
    try {
      // Verify OTP with the server
      await axios.post('http://localhost:5555/api/auth/verify-otp', { 
        user_email: email, 
        otp: otpString
      });
      
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setStep(STEPS.NEW_PASSWORD);
      }, 500);
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
    
    // Validate password strength
    if (passwordStrength < 2) {
      setErrorMessage('Please use a stronger password with at least 8 characters and a mix of letters, numbers, or symbols.');
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // Reset password with the server
      await axios.post('http://localhost:5555/api/auth/reset-password', {
        user_email: email,
        otp: otp.join(''),
        new_password: password
      });
      
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setStep(STEPS.SUCCESS);
      }, 500);
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
    setOtp(['', '', '', '', '', '']);
    setPassword('');
    setConfirmPassword('');
    setStatus('idle');
    setErrorMessage('');
    setStep(STEPS.REQUEST_OTP);
    setPasswordStrength(0);
    setResendDisabled(false);
    setCountdown(0);
  };
  
  // If the popup is not open, don't render anything
  if (!isOpen) return null;

  const getStepTitle = () => {
    switch (step) {
      case STEPS.REQUEST_OTP: return 'Forgot Password';
      case STEPS.VERIFY_OTP: return 'Verify Code';
      case STEPS.NEW_PASSWORD: return 'Create New Password';
      case STEPS.SUCCESS: return 'Success';
      default: return 'Reset Password';
    }
  };
  
  const getProgressPercentage = () => {
    switch (step) {
      case STEPS.REQUEST_OTP: return '25%';
      case STEPS.VERIFY_OTP: return '50%';
      case STEPS.NEW_PASSWORD: return '75%';
      case STEPS.SUCCESS: return '100%';
      default: return '0%';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all duration-300 ease-in-out">
        {/* Progress bar */}
        {step !== STEPS.SUCCESS && (
          <div className="w-full h-1 bg-gray-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
              style={{ width: getProgressPercentage() }}
            ></div>
          </div>
        )}
        
        {/* Close button */}
        <button 
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{getStepTitle()}</h2>
          
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded flex items-start gap-3 animate-fadeIn">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
          
          {step === STEPS.REQUEST_OTP && (
            <>
              <p className="text-gray-600 mb-6">
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
              
              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your.email@example.com"
                      required
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className={`w-full px-4 py-2.5 rounded-lg text-white font-medium transition-all duration-200 ${
                      status === 'loading' 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : status === 'success'
                          ? 'bg-green-500'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                    disabled={status === 'loading' || !email}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin" />
                        Sending...
                      </span>
                    ) : status === 'success' ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle size={18} />
                        Sent Successfully
                      </span>
                    ) : 'Send Verification Code'}
                  </button>
                </div>
                
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          )}
          
          {step === STEPS.VERIFY_OTP && (
            <>
              <p className="text-gray-600 mb-6">
                We've sent a 6-digit verification code to <span className="font-medium text-blue-600">{email}</span>
              </p>
              
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-3">
                    Enter Verification Code
                  </label>
                  <div className="flex gap-2 justify-between">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 text-center border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                        maxLength={1}
                        autoComplete="off"
                        disabled={status === 'loading'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <RefreshCw size={12} className={countdown > 0 ? "animate-spin" : ""} />
                    {countdown > 0 
                      ? `Code expires in ${countdown} seconds` 
                      : "OTP is valid for 15 minutes"}
                  </p>
                </div>
                
                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(STEPS.REQUEST_OTP)}
                    className="flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-all duration-200 ${
                      status === 'loading' 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : status === 'success'
                          ? 'bg-green-500'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                    disabled={status === 'loading' || otp.some(digit => digit === '')}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin" />
                        Verifying...
                      </span>
                    ) : status === 'success' ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle size={18} />
                        Verified
                      </span>
                    ) : 'Verify Code'}
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        if (!resendDisabled) {
                          handleRequestOTP();
                        }
                      }}
                      className={`${
                        resendDisabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-800'
                      } transition-colors font-medium`}
                      disabled={resendDisabled || status === 'loading'}
                    >
                      {resendDisabled ? `Resend in ${countdown}s` : 'Resend Code'}
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}
          
          {step === STEPS.NEW_PASSWORD && (
            <>
              <p className="text-gray-600 mb-6">
                Create a new secure password for your account.
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        checkPasswordStrength(e.target.value);
                      }}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Create new password"
                      required
                      minLength={8}
                      disabled={status === 'loading'}
                    />
                  </div>
                  
                  {/* Password strength indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              passwordStrength === 0 ? 'bg-red-500 w-1/4' :
                              passwordStrength === 1 ? 'bg-orange-500 w-2/4' :
                              passwordStrength === 2 ? 'bg-yellow-500 w-3/4' :
                              'bg-green-500 w-full'
                            }`}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">
                          {passwordStrength === 0 ? 'Weak' :
                           passwordStrength === 1 ? 'Fair' :
                           passwordStrength === 2 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Use 8+ characters with a mix of letters, numbers & symbols
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-500 bg-red-50'
                          : confirmPassword && password === confirmPassword
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300'
                      }`}
                      placeholder="Confirm new password"
                      required
                      disabled={status === 'loading'}
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Passwords don't match
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(STEPS.VERIFY_OTP)}
                    className="flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-all duration-200 ${
                      status === 'loading' 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : status === 'success'
                          ? 'bg-green-500'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                    disabled={status === 'loading' || !password || !confirmPassword}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw size={18} className="animate-spin" />
                        Updating...
                      </span>
                    ) : status === 'success' ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle size={18} />
                        Updated
                      </span>
                    ) : 'Reset Password'}
                  </button>
                </div>
              </form>
            </>
          )}
          
          {step === STEPS.SUCCESS && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Successful</h3>
              <p className="text-gray-600 mb-8">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium"
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