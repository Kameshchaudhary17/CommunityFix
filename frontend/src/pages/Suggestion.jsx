import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ThumbsUp, MessageSquare, Filter, SortDesc, MoreVertical, Calendar, Clock, Check, Trash } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

// Comment Item Component with Animation and Enhanced UI
const CommentItem = ({ comment, currentUser, onEdit, onDelete, toggleMenu, openMenuId }) => {
  const isOwner = currentUser && comment.userId === currentUser.id;
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const createdAt = new Date(comment.createdAt);

  return (
    <div className="border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors duration-200 rounded-md px-2">
      <div className="flex items-start">
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0 border-2 border-gray-200">
          <img
            src={comment.user?.profilePicture ? `http://localhost:5555/${comment.user.profilePicture}` : "/api/placeholder/32/32"}
            alt={comment.user?.user_name || 'Anonymous'}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <h4 className="font-medium text-sm text-gray-800">{comment.user?.user_name || 'Anonymous'}</h4>
              {isOwner && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 flex items-center">
                <Clock size={12} className="mr-1" />
                {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Delete button - always visible for owner */}
              {isOwner && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-red-400 hover:text-red-600 ml-2 p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete Comment"
                >
                  <Trash size={16} />
                </button>
              )}

              {/* Edit button - always visible for owner */}
              {isOwner && (
                <button
                  onClick={() => onEdit(comment)}
                  className="text-blue-400 hover:text-blue-600 ml-2 p-1 rounded-full hover:bg-blue-50 transition-colors"
                  title="Edit Comment"
                >
                  <Edit size={16} />
                </button>
              )}

              {/* Special admin delete button - only if not the owner and user is admin */}
              {!isOwner && isAdmin && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-red-400 hover:text-red-600 ml-2 p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="Admin Delete"
                >
                  <Trash size={16} />
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
        </div>
      </div>
    </div>
  );
};

// Enhanced Comment Box Modal with animations and better UX
const CommentBox = ({ isOpen, onClose, suggestion }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    if (isOpen && suggestion) {
      setAnimateOut(false);
      fetchComments();
      // Get current user info from localStorage
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [isOpen, suggestion]);

  const handleCloseWithAnimation = () => {
    setAnimateOut(true);
    setTimeout(() => {
      onClose();
      setOpenMenuId(null);
    }, 300);
  };

  const fetchComments = async () => {
    if (!suggestion || !suggestion.id) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5555/api/comment/${suggestion.id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        // Add the new comment to the top of the list
        setComments([response.data.comment, ...comments]);
        setCommentText('');
        toast.success('Comment added successfully');

        // Update the comment count in the parent component
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

  const handleEditComment = async () => {
    if (!editText.trim() || !editingCommentId) {
      setEditingCommentId(null);
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5555/api/comment/${suggestion.id}/comments/${editingCommentId}`,
        { text: editText },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.comment) {
        // Update the comment in the list
        setComments(comments.map(comment =>
          comment.id === editingCommentId ? { ...comment, text: editText } : comment
        ));
        toast.success('Comment updated successfully');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setEditingCommentId(null);
      setOpenMenuId(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await axios.delete(
        `http://localhost:5555/api/comment/${suggestion.id}/comments/${commentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Remove the deleted comment from the state
      setComments(comments.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully');

      // Update the comment count in the parent component
      if (suggestion.onCommentDeleted) {
        suggestion.onCommentDeleted();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setOpenMenuId(null);
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
    setOpenMenuId(null);
  };

  const toggleCommentMenu = (commentId) => {
    setOpenMenuId(openMenuId === commentId ? null : commentId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl transition-all duration-300 ${animateOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h3 className="font-medium text-lg text-gray-800">
            <span className="flex items-center">
              <MessageSquare size={18} className="mr-2 text-blue-600" />
              Comments for {suggestion?.title}
            </span>
          </h3>
          <button
            onClick={handleCloseWithAnimation}
            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments container */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-3 text-gray-500 font-medium">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare size={36} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 font-medium">No comments yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to share your thoughts</p>
            </div>
          ) : (
            <>
              {editingCommentId ? (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                  <h4 className="font-medium text-sm text-blue-700 mb-2">Edit your comment</h4>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    autoFocus
                  />
                  <div className="flex justify-end mt-3 space-x-2">
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="px-3 py-1.5 text-sm text-gray-700 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditComment}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={user}
                    onEdit={startEditComment}
                    onDelete={handleDeleteComment}
                    toggleMenu={toggleCommentMenu}
                    openMenuId={openMenuId}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Comment input area */}
        <form onSubmit={handleSubmitComment} className="border-t p-4">
          <div className="flex items-start">
           
            <div className="flex-1 relative">
            <input
                type="text"
                placeholder="Add a comment..."
                className="w-full pl-4 pr-12 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className={`absolute right-3 bottom-3 text-white p-1.5 rounded-full transition-colors ${commentText.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                  }`}
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

// Enhanced Suggestion Modal with animations and better UX
const NewSuggestionModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      setAnimateOut(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseWithAnimation = () => {
    setAnimateOut(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

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

      // Update this line to match your backend response structure
      if (response.data) {
        // Change from response.data.suggestion to response.data.data
        onSubmit(response.data.data);
        setTitle('');
        setDescription('');
        toast.success('Suggestion created successfully');
        handleCloseWithAnimation();
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
      <div className={`bg-white rounded-lg w-full max-w-md shadow-xl transition-all duration-300 ${animateOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h3 className="font-medium text-lg text-gray-800">
            <span className="flex items-center">
              <Plus size={18} className="mr-2 text-blue-600" />
              Add New Suggestion
            </span>
          </h3>
          <button
            onClick={handleCloseWithAnimation}
            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              placeholder="Enter suggestion title"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Enter a detailed description of your suggestion"
              className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseWithAnimation}
              className="px-4 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className={`px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${loading || !title.trim() || !description.trim() ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-1" />
                  Create Suggestion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Suggestion Card Component
const SuggestionCard = ({ suggestion, onCommentClick, onUpvote }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'approved': return 'bg-green-100 text-green-700 border border-green-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const userProfilePic = suggestion.user && suggestion.user.profilePicture 
  ? `http://localhost:5555/${suggestion.user.profilePicture}`
  : "/api/placeholder/48/48";

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={12} className="mr-1" />;
      case 'in_progress': return <div className="w-3 h-3 rounded-full bg-orange-500 mr-1.5"></div>;
      case 'approved': return <Check size={12} className="mr-1" />;
      default: return <Clock size={12} className="mr-1" />;
    }
  };

  const formattedDate = new Date(suggestion.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 transform hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
          <img
            src={`http://localhost:5555/${suggestion.user.profilePicture}`}
            alt={suggestion.user?.user_name || 'User'}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/api/placeholder/48/48";
            }}
          />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{suggestion.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span className="font-medium mr-2">{suggestion.user?.user_name || 'Anonymous'}</span>
                <span className="flex items-center">
                  <Calendar size={14} className="mr-1 text-gray-400" />
                  {formattedDate}
                </span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(suggestion.status)}`}>
              {getStatusIcon(suggestion.status)}
              {suggestion.status || 'pending'}
            </span>
          </div>

          <p className="text-gray-700 my-3 leading-relaxed">{suggestion.description}</p>

          <div className="flex items-center space-x-5 mt-4">
            <button
              className={`flex items-center transition-colors duration-200 rounded-full px-3 py-1.5 ${suggestion.hasUserUpvoted
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
              onClick={() => onUpvote(suggestion)}
            >
              <ThumbsUp size={16} className={`mr-2 ${suggestion.hasUserUpvoted ? 'fill-current' : ''}`} />
              <span className="font-medium">{suggestion.upvoteCount || 0}</span>
            </button>

            <button
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 rounded-full px-3 py-1.5 hover:bg-gray-100"
              onClick={() => onCommentClick(suggestion)}
            >
              <MessageSquare size={16} className="mr-2" />
              <span className="font-medium">{suggestion.commentsCount || suggestion._count?.comments || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Status Filter Component
const StatusFilter = ({ value, onChange }) => (
  <div className="relative">
    <select
      className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 appearance-none bg-white text-gray-700 font-medium text-sm hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={onChange}
    >
      <option value="all">All Statuses</option>
      <option value="pending">Pending</option>
      <option value="in_progress">In Progress</option>
      <option value="approved">Approved</option>
    </select>
    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
  </div>
);

// Main Suggestion Component with optimizations
const Suggestion = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewSuggestionOpen, setIsNewSuggestionOpen] = useState(false);
  const [isCommentBoxOpen, setIsCommentBoxOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'popular'
  const token = localStorage.getItem('token');

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchSuggestions();
    }
  }, [token, navigate]);

  const fetchSuggestions = useCallback(async () => {
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
  }, [token]);

  const handleCommentClick = (suggestion) => {
    setSelectedSuggestion({
      ...suggestion,
      onCommentAdded: () => {
        // Update the comment count when a comment is added
        setSuggestions(suggestions.map(s => {
          if (s.id === suggestion.id) {
            return {
              ...s,
              commentsCount: (parseInt(s.commentsCount) || 0) + 1
            };
          }
          return s;
        }));
      },
      onCommentDeleted: () => {
        // Update the comment count when a comment is deleted
        setSuggestions(suggestions.map(s => {
          if (s.id === suggestion.id) {
            return {
              ...s,
              commentsCount: Math.max((parseInt(s.commentsCount) || 0) - 1, 0)
            };
          }
          return s;
        }));
      }
    });
    setIsCommentBoxOpen(true);
  };

  const handleUpvote = async (suggestion) => {
    try {
      // Cache the current state before the API call
      const wasUpvoted = suggestion.hasUserUpvoted;

      // Call the upvote API
      const response = await axios.post(
        `http://localhost:5555/api/suggestion/${suggestion.id}/upvote`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Optimistic update - Toggle the state and update count immediately 
      setSuggestions(suggestions.map(s => {
        if (s.id === suggestion.id) {
          const newCount = wasUpvoted
            ? (parseInt(s.upvoteCount) || 0) - 1
            : (parseInt(s.upvoteCount) || 0) + 1;

          return {
            ...s,
            upvoteCount: newCount,
            hasUserUpvoted: !wasUpvoted
          };
        }
        return s;
      }));

      // Display success message based on the action
      toast.success(wasUpvoted ? 'Upvote removed' : 'Suggestion upvoted');

    } catch (error) {
      console.error('Error upvoting suggestion:', error);
      if (error.response?.status === 401) {
        toast.error('You must be logged in to upvote');
      } else {
        toast.error('Failed to update upvote');
      }
    }
  };

  const handleAddSuggestion = (newSuggestion) => {
  // Get user data from localStorage with null check
  const userDataString = localStorage.getItem('userData');
  const userData = userDataString ? JSON.parse(userDataString) : {};
  
  // Create a complete suggestion object with safe access to user data
  const completeNewSuggestion = {
    ...newSuggestion,
    user: {
      ...newSuggestion.user,
      ...(userData || {}), // Safely spread userData or empty object if null
      profilePicture: userData?.profilePicture || 'default-profile.jpg'
    },
    commentsCount: 0,
    upvoteCount: 0,
    hasUserUpvoted: false
  };
  
  // Update the UI immediately
  setSuggestions([completeNewSuggestion, ...suggestions]);
  
  // Then re-fetch all suggestions after a short delay
  setTimeout(() => {
    fetchSuggestions();
  }, 500);
};

const getFilteredSuggestions = () => {
  return suggestions
    .filter(suggestion => {
      // Filter by status - THIS IS THE FIX
      if (statusFilter !== 'all' && suggestion.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return suggestion.title?.toLowerCase().includes(query) ||
          suggestion.description?.toLowerCase().includes(query) ||
          suggestion.user?.user_name?.toLowerCase().includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by selected order
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortOrder === 'popular') {
        return (parseInt(b.upvoteCount) || 0) - (parseInt(a.upvoteCount) || 0);
      }
      return 0;
    });
};

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
  
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
  
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            {/* Page Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Suggestions</h1>
                <p className="text-gray-500 mt-1">Share and upvote community ideas</p>
              </div>
              
              <button
                onClick={() => setIsNewSuggestionOpen(true)}
                className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center w-full md:w-auto"
              >
                <Plus size={18} className="mr-1.5" />
                New Suggestion
              </button>
            </div>
  
            {/* Search and Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search suggestions..."
                    className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                </div>
  
                <div className="flex gap-3 w-full md:w-auto">
                  <StatusFilter value={statusFilter} onChange={handleStatusChange} />
  
                  <div className="relative flex-1 md:flex-none">
                    <select
                      className="w-full md:w-auto pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 appearance-none bg-white text-gray-700 font-medium text-sm hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={sortOrder}
                      onChange={handleSortChange}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="popular">Most Popular</option>
                    </select>
                    <SortDesc size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Content Section */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-5 text-gray-500 font-medium">Loading suggestions...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
                <button
                  onClick={fetchSuggestions}
                  className="mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : getFilteredSuggestions().length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-gray-400" />
                </div>
                <h3 className="font-medium text-lg text-gray-700 mb-2">No suggestions found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try changing your filters or search query'
                    : 'Be the first to create a suggestion'}
                </p>
                <button
                  onClick={() => setIsNewSuggestionOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <Plus size={18} className="mr-1.5" />
                  New Suggestion
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredSuggestions().map(suggestion => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onCommentClick={handleCommentClick}
                    onUpvote={handleUpvote}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
  
        <NewSuggestionModal
          isOpen={isNewSuggestionOpen}
          onClose={() => setIsNewSuggestionOpen(false)}
          onSubmit={handleAddSuggestion}
        />
  
        <CommentBox
          isOpen={isCommentBoxOpen}
          onClose={() => setIsCommentBoxOpen(false)}
          suggestion={selectedSuggestion}
        />
  
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '12px 16px',
            },
            success: {
              style: {
                border: '1px solid #E6F4EA',
                color: '#1E8E3E',
              },
              iconTheme: {
                primary: '#1E8E3E',
                secondary: '#E6F4EA',
              },
            },
            error: {
              style: {
                border: '1px solid #FADCE0',
                color: '#D93025',
              },
              iconTheme: {
                primary: '#D93025',
                secondary: '#FADCE0',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Suggestion;