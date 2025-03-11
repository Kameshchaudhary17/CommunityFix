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
      status: "Pending",
      lastUpdate: "2024/12/12",
      upvoteCount: 100
    },
    {
      id: 2,
      title: "Broken Road",
      description: "Repair request for the damaged road near the central market area",
      submittedDate: "2024/12/12",
      status: "Pending",
      lastUpdate: "2024/12/12",
      upvoteCount: 100
    },
    {
      id: 3,
      title: "Street Lights",
      description: "Installation of additional street lights in the northern residential area",
      submittedDate: "2024/12/10",
      status: "Pending",
      lastUpdate: "2024/12/15",
      upvoteCount: 85
    }
  ]);

  // Filter suggestions based on status
  const filteredSuggestions = activeFilter === 'all' 
    ? suggestions 
    : suggestions.filter(suggestion => suggestion.status.toLowerCase() === activeFilter.toLowerCase());

  // Handle Status Change
  const handleStatusChange = (id, newStatus) => {
    setSuggestions(prevSuggestions =>
      prevSuggestions.map(suggestion =>
        suggestion.id === id
          ? {
              ...suggestion,
              status: newStatus,
              lastUpdate: new Date().toISOString().split('T')[0].replace(/-/g, '/')
            }
          : suggestion
      )
    );
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen">
      <MunicipalitySidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Suggestion Management</h1>
          </div>
        </header>
        
        <div className="p-8">
          {/* Filter Buttons */}
          <div className="mb-6 flex space-x-4">
            {['all', 'pending', 'in_progress', 'approved', 'rejected'].map((status) => (
              <button 
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-4 py-2 rounded-md ${activeFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Suggestions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-4 px-6 text-left">Title</th>
                  <th className="py-4 px-6 text-left">Description</th>
                  <th className="py-4 px-6 text-left">Pending Date</th>
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
                        {suggestion.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">{suggestion.lastUpdate}</td>
                    <td className="py-4 px-6">{suggestion.upvoteCount}</td>
                    <td className="py-4 px-6">
                      <select
                        className="px-3 py-2 border rounded-md bg-gray-100"
                        value={suggestion.status}
                        onChange={(e) => handleStatusChange(suggestion.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
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
