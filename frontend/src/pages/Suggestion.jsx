import React, { useState, useEffect } from 'react';
import {Plus, X, ThumbsUp, MessageSquare, Filter, SortDesc } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Hearder from '../components/Hearder';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

// Comment Component
const CommentItem = ({ author, text, time }) => (
  <div className="border-b border-gray-100 py-3">
    <div className="flex items-start">
      <img src="/api/placeholder/32/32" alt={author} className="w-8 h-8 rounded-full mr-3" />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-medium text-sm">{author}</h4>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-sm text-gray-700">{text}</p>
      </div>
    </div>
  </div>
);

// Comment Box Modal
const CommentBox = ({ isOpen, onClose, suggestion }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen && suggestion) {
      fetchComments();
    }
  }, [isOpen, suggestion]);

  const fetchComments = async () => {
    if (!suggestion || !suggestion.id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5555/api/suggestion/${suggestion.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.suggestion && response.data.suggestion.comments) {
        setComments(response.data.suggestion.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      const response = await axios.post(
        `http://localhost:5555/api/suggestion/${suggestion.id}/comments`, 
        { text: commentText },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.comment) {
        setComments([...comments, response.data.comment]);
        setCommentText('');
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="font-medium text-lg">Comments for {suggestion?.title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No comments yet</div>
          ) : (
            comments.map((comment, index) => (
              <CommentItem 
                key={comment.id || index} 
                author={comment.user?.user_name || 'Anonymous'} 
                text={comment.text} 
                time={new Date(comment.createdAt).toLocaleString()} 
              />
            ))
          )}
        </div>
        
        <form onSubmit={handleSubmitComment} className="border-t p-4">
          <div className="flex items-center">
            <img 
              src="/api/placeholder/32/32" 
              alt="Your avatar" 
              className="w-8 h-8 rounded-full mr-3"
            />
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="w-full pl-4 pr-10 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 p-1 rounded-full hover:bg-blue-50"
              >
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// New Suggestion Modal
const NewSuggestionModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [wardNumber, setWardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5555/api/suggestion/createSuggestion',
        {
          title,
          description
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        onSubmit(response.data.suggestion);
        setTitle('');
        setDescription('');
        setMunicipality('');
        setWardNumber('');
        toast.success('Suggestion created successfully');
      }
    } catch (error) {
      console.error('Error creating suggestion:', error);
      if (error.response?.status === 401) {
        toast.error('You must be logged in to create a suggestion');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create suggestion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="font-medium text-lg">Add New Suggestion</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input 
              type="text" 
              id="title"
              placeholder="Enter suggestion title" 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              id="description"
              placeholder="Enter detailed description" 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          
          
            
          
          
          <div className="flex justify-end gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Suggestion card component
const SuggestionCard = ({ suggestion, onCommentClick, onUpvote }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'in progress': return 'bg-orange-100 text-orange-700';
      case 'approved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className="flex items-start">
        <div className="h-12 w-12 rounded-full overflow-hidden mr-3 flex-shrink-0 border-2 border-gray-200">
          <img 
            src="/api/placeholder/80/80" 
            alt={suggestion.user?.user_name || 'User'} 
            className="h-full w-full object-cover" 
          />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{suggestion.title}</h3>
              <p className="text-sm text-gray-500">
                {suggestion.user?.user_name || 'Anonymous'} • {new Date(suggestion.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
              {suggestion.status || 'Pending'}
            </span>
          </div>
          
          <p className="text-gray-700 my-2">{suggestion.description}</p>
          
          <div className="text-xs text-gray-500 mb-3">
            {suggestion.municipality}, Ward {suggestion.wardNumber}
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="flex items-center text-gray-500 hover:text-blue-600"
              onClick={() => onUpvote(suggestion)}
            >
              <ThumbsUp size={16} className="mr-1" />
              <span>{suggestion.upvotes || 0}</span>
            </button>
            
            <button 
              className="flex items-center text-gray-500 hover:text-blue-600"
              onClick={() => onCommentClick(suggestion)}
            >
              <MessageSquare size={16} className="mr-1" />
              <span>{suggestion.commentsCount || suggestion._count?.comments || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status filter component
const StatusFilter = ({ value, onChange }) => (
  <div className="relative">
    <select 
      className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 appearance-none bg-white"
      value={value}
      onChange={onChange}
    >
      <option value="all">All Statuses</option>
      <option value="submitted">Pending</option>
      <option value="in progress">In Progress</option>
      <option value="approved">Approved</option>
    </select>
    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
  </div>
);

const Suggestion = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewSuggestionOpen, setIsNewSuggestionOpen] = useState(false);
  const [isCommentBoxOpen, setIsCommentBoxOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    fetchSuggestions();
  }, []);
  
  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5555/api/suggestion/getSuggestion', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Failed to load suggestions. Please try again.');
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCommentClick = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsCommentBoxOpen(true);
  };
  
  const handleUpvote = async (suggestion) => {
    try {
      const response = await axios.post(
        `http://localhost:5555/api/suggestion/${suggestion.id}/upvote`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        // Update the suggestion in the list
        setSuggestions(suggestions.map(s => 
          s.id === suggestion.id ? {...s, upvotes: response.data.upvotes} : s
        ));
        
        toast.success('Upvoted suggestion');
      }
    } catch (error) {
      console.error('Error upvoting suggestion:', error);
      toast.error('Failed to upvote suggestion');
    }
  };
  
  const handleSubmitSuggestion = (newSuggestion) => {
    setSuggestions([newSuggestion, ...suggestions]);
    setIsNewSuggestionOpen(false);
  };
  
  // Filter suggestions based on status and search query
  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesStatus = statusFilter === 'all' || suggestion.status === statusFilter;
    const matchesSearch = !searchQuery || 
      suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toaster for notifications */}
      <Toaster position="top-right" />
      
      {/* Modals */}
      <CommentBox 
        isOpen={isCommentBoxOpen} 
        onClose={() => setIsCommentBoxOpen(false)} 
        suggestion={selectedSuggestion} 
      />
      
      <NewSuggestionModal 
        isOpen={isNewSuggestionOpen} 
        onClose={() => setIsNewSuggestionOpen(false)} 
        onSubmit={handleSubmitSuggestion} 
      />

      {/* Sidebar */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
      <Hearder/>

        {/* Content area with scrolling */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Page header with title and actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">Suggestions</h1>
                <p className="text-gray-500">Share your ideas with the community</p>
              </div>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
                onClick={() => setIsNewSuggestionOpen(true)}
              >
                <Plus size={18} className="mr-1" />
                Add Suggestion
              </button>
            </div>
            
            {/* Filter controls */}
            <div className="mb-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {filteredSuggestions.length} suggestion{filteredSuggestions.length !== 1 ? 's' : ''}
              </div>
              
              <div className="flex gap-2">
                <StatusFilter 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
                
                <button className="px-3 py-2 rounded-lg border border-gray-300 flex items-center hover:bg-gray-50">
                  <SortDesc size={16} className="mr-1" />
                  <span>Sort</span>
                </button>
              </div>
            </div>
            
            {/* Suggestions list */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 rounded-full border-4 border-t-blue-600 border-gray-200 animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading suggestions...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg p-6 text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button 
                    onClick={fetchSuggestions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredSuggestions.length === 0 ? (
                <div className="bg-white rounded-lg p-10 text-center">
                  <p className="text-gray-500 mb-6">No suggestions found</p>
                  <button 
                    onClick={() => setIsNewSuggestionOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
                  >
                    <Plus size={18} className="mr-1" />
                    Create Your First Suggestion
                  </button>
                </div>
              ) : (
                filteredSuggestions.map(suggestion => (
                  <SuggestionCard 
                    key={suggestion.id} 
                    suggestion={suggestion}
                    onCommentClick={handleCommentClick}
                    onUpvote={handleUpvote}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Suggestion;