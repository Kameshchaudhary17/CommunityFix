import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-white py-4 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
          <div className="flex items-center text-2xl md:text-3xl font-bold text-blue-500">
              Community
              <span className="text-teal-500">Fix</span>
          <div className="w-8 h-8 ml-2 rounded-full border-2 border-teal-500 flex items-center justify-center">
                🌍
              </div>
          </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
            <Link to="/features" className="text-gray-700 hover:text-blue-600">Features</Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
          </nav>
          
          <div className="flex space-x-4">
            <button className="px-4 py-2 text-blue-600 hover:text-blue-700"> Sign up</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Login</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">
              Report Issues. Make Your<br />Community Better
            </h1>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg hover:bg-blue-700">
              Get Started
            </button>
          </div>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-blue-900 text-white p-8 rounded-lg">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">REGISTER</h3>
              <p className="text-sm">Sign up by creating an account with your details and get approved by your municipality.</p>
            </div>

            <div className="bg-blue-900 text-white p-8 rounded-lg">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">HOW IT WORKS</h3>
              <p className="text-sm">Submit issues by providing descriptions, locations, and images. Track the progress of your reported issues with real-time updates and status.</p>
            </div>

            <div className="bg-blue-900 text-white p-8 rounded-lg">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">RESOLVE</h3>
              <p className="text-sm">Receive notifications when your issues are resolved, ensuring transparency and accountability.</p>
            </div>
          </div>

          {/* Bottom Icons */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <div className="bg-red-500 w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">!</span>
              </div>
              <h4 className="text-lg font-semibold text-blue-900">Issue Report</h4>
            </div>
            
            <div>
              <div className="bg-green-500 w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-blue-900">Track Progress</h4>
            </div>
            
            <div>
              <div className="bg-blue-400 w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-blue-900">Stay Updated</h4>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>Community Fix is a platform dedicated to connecting citizens with municipalities to report and resolve civic issues efficiently.</p>
          <p className="mt-2">© 2024 Community Fix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;