import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, ThumbsUp, MessageSquare, Filter, SortDesc, MoreHorizontal, MoreVertical, Edit, Trash2, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

// Comment Item Component - Enhanced with better spacing and hover effects
const CommentItem = ({
  author,
  text,
  time,
  profilePic,
  commentId,
  onDelete,
  isCurrentUserComment
}) => {
  return (
    <div className="border-b border-gray-100 py-4 hover:bg-gray-50 transition-colors rounded-md px-2">
      <div className="flex items-start">
        <img src={profilePic} alt={author} className="w-10 h-10 rounded-full mr-3 border-2 border-gray-200 object-cover" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-medium text-sm">{author}</h4>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">{time}</span>
              {isCurrentUserComment && (
                <button
                  onClick={() => onDelete(commentId)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-100 transition-all"
                  title="Delete comment"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
};

// Comment Box Modal - Enhanced with smooth animations and better layout
const CommentBox = ({ isOpen, onClose, suggestion, onCommentAdded, onCommentDeleted }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && suggestion) {
      fetchComments();
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      // Reset state when closing modal
      setComments([]);
      setCommentText('');
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
        // Add user data to the comment for display
        const currentUser = JSON.parse(localStorage.getItem('userData'));
        const commentWithUser = {
          ...response.data.comment,
          user: currentUser
        };

        // Update local state with the new comment
        setComments([commentWithUser, ...comments]);
        setCommentText('');
        toast.success('Comment added successfully');

        // Call the callback to update parent component
        if (onCommentAdded) {
          onCommentAdded(suggestion.id);
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
      if (!suggestion?.id) {
        console.error("Missing suggestion ID for delete operation");
        toast.error('Error: Missing suggestion information');
        return;
      }

      const deleteUrl = `http://localhost:5555/api/comment/${suggestion.id}/comments/${commentId}`;
      await axios.delete(
        deleteUrl,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Update local state
      setComments(comments.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully');

      // Call the callback to update parent component
      if (onCommentDeleted) {
        onCommentDeleted(suggestion.id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete comment');
      }
    }
  };

  if (!isOpen) return null;

  // Get current user ID for permission checks
  const currentUserId = user?.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl animate-scaleIn"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-lg">Comments for {suggestion?.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 rounded-full border-2 border-t-blue-600 border-gray-200 animate-spin mr-2"></div>
              <span className="text-gray-500">Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400">Be the first to comment on this suggestion</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                author={comment.user?.user_name || 'Anonymous'}
                text={comment.text}
                time={new Date(comment.createdAt).toLocaleString()}
                profilePic={comment.user?.profilePicture ? `http://localhost:5555/${comment.user.profilePicture}` : "/api/placeholder/32/32"}
                commentId={comment.id}
                onDelete={handleDeleteComment}
                isCurrentUserComment={comment.user?.id === currentUserId || comment.userId === currentUserId}
              />
            ))
          )}
        </div>

        <form onSubmit={handleSubmitComment} className="border-t p-4 sticky bottom-0 bg-white">
          <div className="flex items-center">
           
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
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${commentText.trim() ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300'
                  } p-2 rounded-full transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
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

// New Suggestion Modal - Enhanced with better spacing and inputs
const NewSuggestionModal = ({ isOpen, onClose, onSuggestionCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
    }
  }, [isOpen]);

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
  
      if (response.data && response.data.success) {
        // Get current user data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
        // Get the suggestion from the response
        const suggestion = response.data.data;
  
        // Properly format the profile picture URL
        let profilePicture = userData.profilePicture || null;
        if (profilePicture && !profilePicture.startsWith('http') && !profilePicture.startsWith('/api')) {
          profilePicture = `http://localhost:5555/${profilePicture}`;
        }
  
        // Create a fresh and complete suggestion object
        const newSuggestion = {
          id: suggestion.id,
          title: title,
          description: description,
          createdAt: new Date().toISOString(),
          status: 'Pending',
          userId: userData.id,
          user: {
            id: userData.id,
            user_id: userData.id,
            user_name: userData.user_name || "Anonymous",
            profilePicture: profilePicture
          },
          upvoteCount: 0,
          commentCount: 0,
          hasUserUpvoted: false
        };
  
        toast.success('Suggestion created successfully');
        onClose();
  
        // Call the callback with the enhanced suggestion object
        if (onSuggestionCreated) {
          onSuggestionCreated(newSuggestion);
        }
  
        // Reset form fields
        setTitle('');
        setDescription('');
      } else {
        toast.error(response.data.message || 'Failed to create suggestion');
      }
    } catch (error) {
      console.error('Error creating suggestion:', error);
      toast.error(error.response?.data?.message || 'Failed to create suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-md shadow-xl animate-scaleIn"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="font-semibold text-lg">Add New Suggestion</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              placeholder="Enter suggestion title"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Enter detailed description"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm hover:shadow transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal - Enhanced with better styling
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, suggestionTitle }) => {
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-md shadow-xl p-6 animate-scaleIn"
      >
        <div className="flex items-center mb-4 text-red-500">
          <Trash2 size={24} className="mr-2" />
          <h3 className="font-bold text-lg">Delete Suggestion</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the suggestion "{suggestionTitle}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm hover:shadow transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Suggestion card component - Enhanced with better UI/UX
const SuggestionCard = ({ suggestion, onCommentClick, onUpvote, onUpdate, onDelete, currentUserId }) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState(suggestion.title);
  const [updatedDescription, setUpdatedDescription] = useState(suggestion.description);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef(null);

  // Get user data to check if user is admin
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isAdmin = userData?.role === 'MUNICIPALITY' || userData?.role === 'ADMIN';
  const isAuthor = suggestion.user?.id === currentUserId;
  const canModify = isAuthor || isAdmin;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update local state when suggestion prop changes
  useEffect(() => {
    setUpdatedTitle(suggestion.title);
    setUpdatedDescription(suggestion.description);
    // Reset menu state when suggestion changes
    setMenuOpen(false);
  }, [suggestion]);

  const handleUpdateClick = () => {
    setMenuOpen(false);
    setShowUpdateForm(true);
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete(suggestion.id);
    setShowDeleteModal(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!updatedTitle.trim() || !updatedDescription.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (onUpdate) {
      onUpdate(suggestion.id, { title: updatedTitle, description: updatedDescription });
      setShowUpdateForm(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="relative bg-white rounded-lg p-5 mb-4 shadow hover:shadow-md transition-all border border-gray-100">
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          suggestionTitle={suggestion.title}
        />
      )}

      {showUpdateForm ? (
        <div className="update-form animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Update Suggestion</h3>
            <button
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowUpdateForm(false)}
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleUpdateSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={updatedTitle}
                onChange={(e) => setUpdatedTitle(e.target.value)}
                required
              />
            </div>

            <div className="mb-5">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all min-h-32"
                value={updatedDescription}
                onChange={(e) => setUpdatedDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUpdateForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex items-start">
          <div className="h-12 w-12 rounded-full overflow-hidden mr-4 flex-shrink-0 border-2 border-gray-200">
            <img
              src={
                suggestion.user?.profilePicture ?
                  (suggestion.user.profilePicture.startsWith('http') || suggestion.user.profilePicture.startsWith('/api') ?
                    suggestion.user.profilePicture :
                    `http://localhost:5555/${suggestion.user.profilePicture}`
                  ) :
                  "/api/placeholder/32/32"
              }
              alt={suggestion.user?.user_name || "User"}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/api/placeholder/32/32";
              }}
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(suggestion.status)}`}>
                    {suggestion.status || 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {suggestion.user?.user_name || "Anonymous"} • {formatDate(suggestion.createdAt)}
                </p>
              </div>

              {/* Force re-render menu button when canModify changes */}
              {canModify && (
                <div className="relative" ref={menuRef} key={`menu-${suggestion.id}-${Date.now()}`}>
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="More options"
                    data-testid="suggestion-menu-button"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg z-10 border border-gray-200 py-1 animate-fadeIn">
                      <button
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                        onClick={handleUpdateClick}
                      >
                        <Edit size={16} className="mr-2 text-gray-500" />
                        Edit Suggestion
                      </button>
                      <button
                        className="w-full px-4 py-2.5 text-left text-red-600 text-sm hover:bg-red-50 flex items-center transition-colors"
                        onClick={handleDeleteClick}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Suggestion
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed">{suggestion.description}</p>

            <div className="flex gap-4">
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${suggestion.hasUserUpvoted
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                  } transition-all`}
                onClick={() => onUpvote(suggestion)}
              >
                <ThumbsUp size={16} className={suggestion.hasUserUpvoted ? 'fill-current' : ''} />
                <span className="font-medium">{suggestion.upvoteCount || 0}</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
                onClick={() => onCommentClick(suggestion)}
              >
                <MessageSquare size={16} />
                <span className="font-medium">{suggestion.commentCount || 0}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Status filter component - Enhanced with better styling
const StatusFilter = ({ value, onChange }) => (
  <div className="relative">
    <select
      className="pl-9 pr-10 py-2.5 rounded-lg border border-gray-300 appearance-none bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      value={value}
      onChange={onChange}
    >
      <option value="all">All Statuses</option>
      <option value="pending">Pending</option>
      <option value="in_progress">In Progress</option>
      <option value="approved">Approved</option>
    </select>
    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

// Main component - Enhanced with fixed header and sidebar
const Suggestion = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewSuggestionOpen, setIsNewSuggestionOpen] = useState(false);
  const [isCommentBoxOpen, setIsCommentBoxOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const token = localStorage.getItem('token');

  const filteredSuggestions = suggestions.filter(suggestion => {
    // First apply status filter
    const statusMatch = statusFilter === 'all' ||
      (suggestion.status && suggestion.status.toLowerCase() === statusFilter);

    // Then apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return statusMatch && (
        (suggestion.title && suggestion.title.toLowerCase().includes(query)) ||
        (suggestion.description && suggestion.description.toLowerCase().includes(query))
      );
    }

    return statusMatch;
  });

  const fetchSuggestions = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('You must be logged in to view suggestions');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    // Use direct URL instead of environment variables
    const API_URL = 'http://localhost:5555';
  
    try {
      const response = await axios.get(`${API_URL}/api/suggestion/getusersuggestion`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (response.data && Array.isArray(response.data.suggestions)) {
        // Process suggestions
        const processedSuggestions = response.data.suggestions.map(suggestion => ({
          ...suggestion,
          // Handle both count formats consistently
          upvoteCount: suggestion._count?.upvotes ?? suggestion.upvotes?.length ?? 0,
          commentCount: suggestion._count?.comments ?? suggestion.comments?.length ?? 0,
          // Use hasUserUpvoted from backend if available, otherwise calculate
          hasUserUpvoted:
            suggestion.hasUserUpvoted ??
            (Array.isArray(suggestion.upvotes) &&
              suggestion.upvotes.some(upvote => upvote.userId === currentUser?.id)) ??
            false
        }));
        
        // Sort suggestions by creation date (newest first)
        processedSuggestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setSuggestions(processedSuggestions);
      } else {
        setError('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [token, currentUser?.id]);

  // Fetch user data once component mounts
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setCurrentUser(userData);
  }, []);

  // Fetch suggestions on component mount and when filters change
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleUpvote = async (suggestion) => {
    if (!token) {
      toast.error('You must be logged in to upvote');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5555/api/suggestion/${suggestion.id}/upvote`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data) {
        setSuggestions(suggestions.map(s => {
          if (s.id === suggestion.id) {
            return {
              ...s,
              hasUserUpvoted: response.data.hasUserUpvoted !== undefined
                ? response.data.hasUserUpvoted
                : !s.hasUserUpvoted,
              upvoteCount: response.data.upvotes
            };
          }
          return s;
        }));

        toast.success(suggestion.hasUserUpvoted ? 'Upvote removed' : 'Suggestion upvoted');
      }
    } catch (error) {
      console.error('Error upvoting suggestion:', error);
      toast.error('Failed to process upvote');
    }
  };

  const handleCommentAdded = (suggestionId) => {
    // Update comment count in the suggestions list
    setSuggestions(suggestions.map(s => {
      if (s.id === suggestionId) {
        return {
          ...s,
          commentCount: s.commentCount + 1
        };
      }
      return s;
    }));
  };

  const handleCommentDeleted = (suggestionId) => {
    // Update comment count in the suggestions list
    setSuggestions(suggestions.map(s => {
      if (s.id === suggestionId) {
        return {
          ...s,
          commentCount: Math.max(0, s.commentCount - 1) // Ensure count doesn't go below 0
        };
      }
      return s;
    }));
  };

  const handleDelete = async (suggestionId) => {
    try {
      await axios.delete(
        `http://localhost:5555/api/suggestion/${suggestionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Remove the deleted suggestion from state
      setSuggestions(suggestions.filter(s => s.id !== suggestionId));
      toast.success('Suggestion deleted successfully');
    } catch (error) {
      console.error('Error deleting suggestion:', error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete suggestion');
      }
    }
  };

  const handleUpdate = async (suggestionId, updatedData) => {
    try {
      const response = await axios.put(
        `http://localhost:5555/api/suggestion/${suggestionId}`,
        updatedData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data && response.data.suggestion) {
        // Update the suggestion in state
        setSuggestions(suggestions.map(s => {
          if (s.id === suggestionId) {
            return { ...s, ...updatedData };
          }
          return s;
        }));

        toast.success('Suggestion updated successfully');
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast.error('Failed to update suggestion');
    }
  };

  const handleNewSuggestionCreated = (newSuggestion) => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    // Fix profile picture URL handling
    let profilePicture = userData.profilePicture || null;

    // Ensure the profile picture has the full URL if it's a relative path
    if (profilePicture && !profilePicture.startsWith('http') && !profilePicture.startsWith('/api/placeholder')) {
      profilePicture = `http://localhost:5555/${profilePicture}`;
    }

    // Create a complete suggestion object with proper user data
    const completeNewSuggestion = {
      ...newSuggestion,
      user: {
        id: userData.id,
        user_id: userData.id,
        user_name: userData.user_name || "Anonymous",
        profilePicture: profilePicture
      },
      // Make sure it's added at the top by setting a recent date
      createdAt: new Date().toISOString(),
      // Ensure all required properties are present
      commentCount: 0,
      upvoteCount: 0,
      hasUserUpvoted: false,
      status: 'Pending'
    };

    // Add the new suggestion to the beginning of the list
    setSuggestions(prevSuggestions => [completeNewSuggestion, ...prevSuggestions]);

    // Toast notification
    toast.success('Your suggestion was added successfully!');
  };

  // 3. Finally, let's update the key and canModify logic in the main render loop:

  // In the main Suggestion component's JSX where SuggestionCard is rendered:
  {
    filteredSuggestions.map(suggestion => (
      <SuggestionCard
        // Force complete re-render with a new key when suggestions change
        key={`suggestion-${suggestion.id}-${Date.now()}`}
        suggestion={suggestion}
        onCommentClick={(suggestion) => {
          setSelectedSuggestion(suggestion);
          setIsCommentBoxOpen(true);
        }}
        onUpvote={handleUpvote}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        currentUserId={currentUser?.id}
      />
    ))
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Suggestions</h1>
              <p className="text-gray-600">
                Share your ideas and see what others are suggesting for the community.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row items-center gap-4 md:justify-between">
                <div className="w-full md:w-auto flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search suggestions..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <div className="w-full md:w-auto flex items-center gap-3">
                  <StatusFilter
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  />

                  <button
                    onClick={() => setIsNewSuggestionOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                  >
                    <Plus size={18} />
                    New Suggestion
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full border-4 border-t-blue-600 border-gray-200 animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading suggestions...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-6 rounded-lg border border-red-100 text-center">
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <p className="text-gray-600">Please try refreshing the page or logging in again.</p>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <MessageSquare size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No suggestions found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? "Try adjusting your filters or search query"
                    : "Be the first to create a suggestion for the community!"}
                </p>
                <button
                  onClick={() => setIsNewSuggestionOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} className="mr-1.5" />
                  New Suggestion
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Showing {filteredSuggestions.length} suggestion{filteredSuggestions.length !== 1 ? 's' : ''}
                </p>

                {filteredSuggestions.map(suggestion => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onCommentClick={(suggestion) => {
                      setSelectedSuggestion(suggestion);
                      setIsCommentBoxOpen(true);
                    }}
                    onUpvote={handleUpvote}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <NewSuggestionModal
        isOpen={isNewSuggestionOpen}
        onClose={() => setIsNewSuggestionOpen(false)}
        onSuggestionCreated={handleNewSuggestionCreated}
      />

      <CommentBox
        isOpen={isCommentBoxOpen}
        onClose={() => setIsCommentBoxOpen(false)}
        suggestion={selectedSuggestion}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
      />

      {/* Toast container for notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Suggestion;