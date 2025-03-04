import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const scrollToAbout = () => {
    document.getElementById("about-section").scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    document.getElementById("contact-section").scrollIntoView({ behavior: "smooth" });
  };
  const scrollToFeature = () => {
    document.getElementById("feature-section").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-white py-4 px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center text-2xl md:text-3xl font-bold text-blue-500">
            Community<span className="text-teal-500">Fix</span>
            <div className="w-8 h-8 ml-2 rounded-full border-2 border-teal-500 flex items-center justify-center">
              🌍
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
            <button onClick={scrollToAbout} className="text-gray-700 hover:text-blue-600">About</button>
            <button onClick={scrollToContact} className="text-gray-700 hover:text-blue-600">Contact</button>
            <button onClick={scrollToFeature} className="text-gray-700 hover:text-blue-600">Feature</button>
          </nav>
          <div className="flex space-x-4">
            <Link to="/signup">
              <button className="px-4 py-2 text-blue-600 hover:text-blue-700">Sign up</button>
            </Link>
            <Link to="/login">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Login</button>
            </Link>
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
            {[
              { title: "REGISTER", text: "Sign up by creating an account with your details and get approved by your municipality." },
              { title: "HOW IT WORKS", text: "Submit issues, provide details, and track progress in real-time." },
              { title: "RESOLVE", text: "Receive updates when issues are resolved, ensuring accountability." },
            ].map((feature, index) => (
              <div key={index} className="bg-blue-900 text-white p-8 rounded-lg">
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-sm">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* About Us Section */}
      <section id="about-section" className="flex-grow bg-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6">About Community Fix</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Community Fix is a platform that connects citizens with municipalities to report and resolve civic issues efficiently.
            We believe in the power of technology to improve community well-being by streamlining communication and ensuring
            transparency in issue resolution.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Our Mission", text: "To empower citizens and municipalities with seamless issue reporting." },
              { title: "Transparency", text: "Ensuring real-time updates and status tracking for reported issues." },
              { title: "Community Impact", text: "Creating a cleaner, safer, and better environment for everyone." },
            ].map((about, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">{about.title}</h3>
                <p className="text-gray-600">{about.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

            {/* contact section */}
      <main id="contact-section" className="flex-grow bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center text-blue-900 mb-12">
            Get in Touch
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-700 mb-4">Send a Message</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-3 border border-gray-300 rounded"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full p-3 border border-gray-300 rounded"
                />
                <textarea
                  placeholder="Your Message"
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded"
                ></textarea>
                <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-700 mb-4">Contact Information</h3>
              <p className="text-gray-600 mb-2">📍 Address: Duhabi, Sunsari</p>
              <p className="text-gray-600 mb-2">📞 Phone: 9827089956</p>
              <p className="text-gray-600 mb-2">📧 Email: kamesh17@gmail.com</p>
              
            </div>
          </div>
        </div>
      </main>

       {/* Feature Section */}
       <main id="feature-section" className="flex-grow bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center text-blue-900 mb-12">
            Our Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Easy Issue Reporting</h3>
              <p className="text-gray-600">Report problems in your area with images, location, and descriptions.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Real-Time Tracking</h3>
              <p className="text-gray-600">Track the progress of reported issues with live updates.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Instant Notifications</h3>
              <p className="text-gray-600">Get notified when an issue is acknowledged or resolved.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">User-Friendly Dashboard</h3>
              <p className="text-gray-600">Monitor issues, responses, and approvals all in one place.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">Your data is protected with strong authentication measures.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Municipality Integration</h3>
              <p className="text-gray-600">Municipalities can manage and prioritize reported issues efficiently.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>Community Fix is dedicated to connecting citizens with municipalities to report and resolve civic issues efficiently.</p>
          <p className="mt-2">© 2024 Community Fix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
