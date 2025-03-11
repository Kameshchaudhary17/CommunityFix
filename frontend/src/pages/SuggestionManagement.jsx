import React, { useState } from 'react';
import MunicipalitySidebar from '../components/MunicipalitySidebar';

const SuggestionManagement = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Sample suggestion data
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      title: "Clean Environment",
      description: "Proposal to organize community cleanup drives in local parks and streets",
      submittedDate: "2024/12/12",
      status: "In progress",
      lastUpdate: "2024/12/12",
      upvoteCount: 100
    },
    {
      id: 2,
      title: "Broken Road",
      description: "Repair request for the damaged road near the central market area",
      submittedDate: "2024/12/12",
      status: "Submitted",
      lastUpdate: "2024/12/12",
      upvoteCount: 100
    },
    {
      id: 3,
      title: "Street Lights",
      description: "Installation of additional street lights in the northern residential area",
      submittedDate: "2024/12/10",
      status: "Approved",
      lastUpdate: "2024/12/15",
      upvoteCount: 85
    }
  ]);

  // Filter suggestions based on status
  const filteredSuggestions = activeFilter === 'all' 
    ? suggestions 
    : suggestions.filter(suggestion => suggestion.status.toLowerCase() === activeFilter.toLowerCase());

  // Toggle status progression (Submitted -> In progress -> Approved)
  const toggleStatus = (id) => {
    setSuggestions(prevSuggestions => 
      prevSuggestions.map(suggestion => {
        if (suggestion.id === id) {
          let newStatus;
          const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '/');
          
          // Determine the next status in the cycle
          switch(suggestion.status.toLowerCase()) {
            case 'pending':
              newStatus = 'In progress';
              break;
            case 'in progress':
              newStatus = 'Approved';
              break;
            case 'approved':
              newStatus = 'Submitted'; // Cycle back to pending
              break;
            default:
              newStatus = 'Submitted';
          }
          
          return {
            ...suggestion,
            status: newStatus,
            lastUpdate: currentDate
          };
        }
        return suggestion;
      })
    );
    
    console.log(`Status changed for suggestion with id: ${id}`);
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in progress':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get button position based on status
  const getButtonPosition = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return 'ml-1'; // Far left
      case 'in progress':
        return 'ml-3'; // Middle
      case 'approved':
        return 'ml-6'; // Far right
      default:
        return 'ml-1';
    }
  };

  return (
    <div className="flex h-screen">
      <MunicipalitySidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              {/* Removed Search icon component as it wasn't imported */}
              <input
                type="text"
                placeholder="Search people"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-4">
              {/* Removed Bell icon component as it wasn't imported */}
              <div className="flex items-center space-x-2">
                <img
                  src="https://imgs.search.brave.com/HxsIMbItz_dQivtNgeLvbI7egmwxBXRKDd4oXXF0V6c/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy90/aHVtYi9iL2I0L0xp/b25lbC1NZXNzaS1B/cmdlbnRpbmEtMjAy/Mi1GSUZBLVdvcmxk/LUN1cF8lMjhjcm9w/cGVkJTI5LmpwZy81/MTJweC1MaW9uZWwt/TWVzc2ktQXJnZW50/aW5hLTIwMjItRklG/QS1Xb3JsZC1DdXBf/JTI4Y3JvcHBlZCUy/OS5qcGc"
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">Kamesh</span>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">Suggestion Management</h1>
          
          {/* Filter Buttons */}
          <div className="mb-6 flex space-x-4">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-md ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter('pending')}
              className={`px-4 py-2 rounded-md ${activeFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Submitted
            </button>
            <button 
              onClick={() => setActiveFilter('in progress')}
              className={`px-4 py-2 rounded-md ${activeFilter === 'in progress' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              In Progress
            </button>
            <button 
              onClick={() => setActiveFilter('approved')}
              className={`px-4 py-2 rounded-md ${activeFilter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Approved
            </button>
          </div>
          
          {/* Suggestions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-4 px-6 text-left">Title</th>
                  <th className="py-4 px-6 text-left">Description</th>
                  <th className="py-4 px-6 text-left">Submitted Date</th>
                  <th className="py-4 px-6 text-left">Status</th>
                  <th className="py-4 px-6 text-left">Last Update</th>
                  <th className="py-4 px-6 text-left">Upvote Count</th>
                  <th className="py-4 px-6 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="border-b border-gray-200">
                    <td className="py-4 px-6">{suggestion.title}</td>
                    <td className="py-4 px-6">{suggestion.description}</td>
                    <td className="py-4 px-6">{suggestion.submittedDate}</td>
                    <td className="py-4 px-6">
                      <span className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColorClass(suggestion.status)}`}></span>
                        {suggestion.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">{suggestion.lastUpdate}</td>
                    <td className="py-4 px-6">{suggestion.upvoteCount}</td>
                    <td className="py-4 px-6">
                      <div className="relative w-12 h-6 bg-gray-300 rounded-full flex items-center cursor-pointer"
                           onClick={() => toggleStatus(suggestion.id)}>
                        <div 
                          className={`w-4 h-4 absolute ${getButtonPosition(suggestion.status)} rounded-full transition-all duration-300 ${getStatusColorClass(suggestion.status)}`}>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* No suggestions message */}
          {filteredSuggestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No suggestions found with the selected status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionManagement;