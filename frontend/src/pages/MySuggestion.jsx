import React, { useState, useEffect } from 'react';
import { Plus, X, ThumbsUp, MessageSquare, Filter, SortDesc, MoreVertical, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

// Comment Component
const CommentItem = ({ author, text, time, profilePic, userId, commentId, currentUserId, userRole, onDelete }) => (
  <div className="border-b border-gray-100 py-3">
    <div className="flex items-start">
      <img src={profilePic} alt={author} className="w-8 h-8 rounded-full mr-3" />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-medium text-sm">{author}</h4>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">{time}</span>
            {(currentUserId === userId || userRole === 'ADMIN') && (
              <button 
                onClick={() => onDelete(commentId)}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
              >
                <X size={16} />
              </button>
            )}
          </div>
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
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (isOpen && suggestion) {
      fetchComments();
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [isOpen, suggestion]);

  const fetchComments = async () => {
    if (!suggestion || !suggestion.id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5555/api/comment/${suggestion.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data.comments) {
        setComments(response.data.comments);
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
        `http://localhost:5555/api/comment/${suggestion.id}/comments`, 
        { text: commentText },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.comment) {
        setComments([response.data.comment, ...comments]);
        setCommentText('');
        toast.success('Comment added successfully');
        
        if (suggestion.onCommentAdded) {
          suggestion.onCommentAdded();
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 401) {
        toast.error('You must be logged in to comment');
      } else {
        toast.error('Failed to add comment');
      }
    }
  };
  
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await axios.delete(
        `http://localhost:5555/api/comment/${suggestion.id}/comments/${commentId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setComments(comments.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully');
      
      if (suggestion.onCommentDeleted) {
        suggestion.onCommentDeleted();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
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
            comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                author={comment.user?.user_name || 'Anonymous'}
                text={comment.text}
                time={new Date(comment.createdAt).toLocaleString()}
                profilePic={`http://localhost:5555/${comment.user.profilePicture}`}
                userId={comment.userId}
                commentId={comment.id}
                currentUserId={user?.id}
                userRole={user?.role}
                onDelete={handleDeleteComment}
              />
            ))
          )}
        </div>
        
        <form onSubmit={handleSubmitComment} className="border-t p-4">
          <div className="flex items-center">
            <img 
              src={user?.profilePicture ? `http://localhost:5555/${user.profilePicture}` : "/api/placeholder/32/32"}
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
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
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5555/api/suggestion/createSuggestion',
        { title, description },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        onSubmit(response.data.suggestion);
        toast.success('Suggestion created successfully');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating suggestion:', error);
      toast.error('Failed to create suggestion');
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
const SuggestionCard = ({ suggestion, onCommentClick, onUpvote, onUpdate, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState(suggestion.title);
  const [updatedDescription, setUpdatedDescription] = useState(suggestion.description);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");
  const token = localStorage.getItem("token");

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateClick = () => {
    setMenuOpen(false);
    setShowUpdateForm(true);
  };

  const handleDeleteClick = async () => {
    setMenuOpen(false);
    if (!token) {
      showMessage("No token provided", "error");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this suggestion?")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5555/api/suggestion/${suggestion.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage("Suggestion deleted successfully");
      window.location.reload();
    } catch (error) {
      showMessage(error.response?.data?.message || "Failed to delete suggestion", "error");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showMessage("No token provided", "error");
      return;
    }
    try {
      await axios.put(
        `http://localhost:5555/api/suggestion/${suggestion.id}`,
        { title: updatedTitle, description: updatedDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showMessage("Suggestion updated successfully");
      setShowUpdateForm(false);
      window.location.reload();
    } catch (error) {
      showMessage(error.response?.data?.message || "Failed to update suggestion", "error");
    }
  };

  return (
    <div className="relative bg-white rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      {message && (
        <div
          className={`absolute top-2 right-2 px-4 py-2 text-sm font-semibold rounded-md ${
            messageType === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {showUpdateForm ? (
        <div className="update-form">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Update Suggestion</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowUpdateForm(false)}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleUpdateSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={updatedTitle}
                onChange={(e) => setUpdatedTitle(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-24"
                value={updatedDescription}
                onChange={(e) => setUpdatedDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setShowUpdateForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex items-start">
          <div className="h-12 w-12 rounded-full overflow-hidden mr-3 flex-shrink-0 border-2 border-gray-200">
            <img
              src={`http://localhost:5555/${suggestion.user?.profilePicture || "default.png"}`}
              alt={suggestion.user?.user_name || "User"}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                <p className="text-sm text-gray-500">
                  {suggestion.user?.user_name || "Anonymous"} • {new Date(suggestion.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="relative">
                <button className="p-1 rounded-full hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
                  <MoreVertical size={16} className="text-gray-500" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={handleUpdateClick}>
                      <Edit size={14} className="mr-2" />
                      Update
                    </button>
                    <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center" onClick={handleDeleteClick}>
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-700 my-2">{suggestion.description}</p>
            <div className="flex gap-2">
              <button 
                className={`flex items-center ${suggestion.hasUserUpvoted ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                onClick={() => onUpvote(suggestion)}
              >
                <ThumbsUp size={16} className={`mr-1 ${suggestion.hasUserUpvoted ? 'fill-current' : ''}`} />
                <span>{suggestion.upvotes?.length || 0}</span>
              </button>
              <button className="flex items-center text-gray-500 hover:text-blue-600" onClick={() => onCommentClick(suggestion)}>
                <MessageSquare size={16} className="mr-1" />
                <span>{suggestion.comments?.length || 0}</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
      const response = await axios.get(`http://localhost:5555/api/suggestion/getusersuggestion`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && response.data.suggestions) {
        setSuggestions(response.data.suggestions || []);
      } else {
        setError('No suggestions found.');
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
      const wasUpvoted = suggestion.hasUserUpvoted;
      
      await axios.post(
        `http://localhost:5555/api/suggestion/${suggestion.id}/upvote`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update the local state to reflect the upvote change
      setSuggestions(suggestions.map(s => {
        if (s.id === suggestion.id) {
          const newUpvotes = [...s.upvotes];
          if (wasUpvoted) {
            // Remove user's upvote
            return {
              ...s,
              upvotes: newUpvotes.filter(upvote => upvote.userId !== (JSON.parse(localStorage.getItem('userData'))?.id)),
              hasUserUpvoted: false
            };
          } else {
            // Add user's upvote
            newUpvotes.push({ userId: JSON.parse(localStorage.getItem('userData'))?.id });
            return {
              ...s,
              upvotes: newUpvotes,
              hasUserUpvoted: true
            };
          }
        }
        return s;
      }));
      
      toast.success(wasUpvoted ? 'Removed upvote' : 'Upvoted suggestion');
    } catch (error) {
      console.error('Error managing upvote:', error);
      toast.error('Failed to process your upvote. Please try again.');
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
      <Toaster position="top-right" />
      
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

      <Sidebar className="w-64 flex-shrink-0" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
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