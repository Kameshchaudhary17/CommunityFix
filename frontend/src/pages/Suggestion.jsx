import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Clock, Check, Filter, SortDesc, Search, Bell, Plus, X, Send } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';

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
const CommentBox = ({ isOpen, onClose, player }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { id: 1, author: 'Coach Smith', text: 'Great performance in the last match!', time: '2 days ago' },
    { id: 2, author: 'Manager Jones', text: 'Need to work on defensive positioning.', time: '1 day ago' }
  ]);

  if (!isOpen) return null;

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const newComment = {
      id: comments.length + 1,
      author: 'Kamesh',
      text: commentText,
      time: 'Just now'
    };
    
    setComments([...comments, newComment]);
    setCommentText('');
    toast.success('Comment added successfully');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="font-medium text-lg">Comments for {player?.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No comments yet</div>
          ) : (
            comments.map(comment => (
              <CommentItem 
                key={comment.id} 
                author={comment.author} 
                text={comment.text} 
                time={comment.time} 
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
                <Send size={18} />
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

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({ title, description });
    setTitle('');
    setDescription('');
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Suggestion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// PlayerReportCard component for displaying individual player cards
const PlayerReportCard = ({ player, status, upvotes, comments, onCommentClick, onUpvote }) => {
  const statusColors = {
    submitted: 'bg-blue-100 text-blue-700',
    'in progress': 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700'
  };
  
  const statusIcons = {
    submitted: <Check size={16} />,
    'in progress': <Clock size={16} />,
    approved: <ThumbsUp size={16} className="text-green-700" />
  };
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start">
        <div className="h-12 w-12 rounded-full overflow-hidden mr-3 flex-shrink-0 border-2 border-gray-200">
          <img src={`/api/placeholder/80/80`} alt={player.name} className="h-full w-full object-cover" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{player.name}</h3>
          <p className="text-gray-500 text-sm mb-3">Player Performance Report</p>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              className="flex items-center hover:bg-gray-200 px-2 py-1 rounded-md transition-colors"
              onClick={() => onUpvote(player)}
            >
              <ThumbsUp size={14} className="mr-1 text-gray-500" />
              <span className="text-sm font-medium">{upvotes}</span>
            </button>
            
            <button 
              className="flex items-center hover:bg-gray-200 px-2 py-1 rounded-md transition-colors"
              onClick={() => onCommentClick(player)}
            >
              <MessageSquare size={14} className="mr-1 text-gray-500" />
              <span className="text-sm font-medium">{comments}</span>
            </button>
            
            <div className={`ml-auto px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusColors[status]}`}>
              {statusIcons[status]}
              <span className="ml-1 capitalize">{status}</span>
            </div>
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
      <option value="submitted">Submitted</option>
      <option value="in progress">In Progress</option>
      <option value="approved">Approved</option>
    </select>
    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
  </div>
);

// Main Suggestion component
const Suggestion = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isCommentBoxOpen, setIsCommentBoxOpen] = useState(false);
  const [isNewSuggestionOpen, setIsNewSuggestionOpen] = useState(false);
  
  // Sample data
  const [players, setPlayers] = useState([
    { id: 1, name: 'Lionel Messi', upvotes: 20, comments: 30, status: 'submitted' },
    { id: 2, name: 'Neymar', upvotes: 10, comments: 30, status: 'in progress' },
    { id: 3, name: 'Ronaldo', upvotes: 15, comments: 30, status: 'approved' },
    { id: 4, name: 'Kylian Mbappé', upvotes: 17, comments: 25, status: 'submitted' },
    { id: 5, name: 'Erling Haaland', upvotes: 22, comments: 18, status: 'in progress' }
  ]);
  
  // Filter players based on status and search query
  const filteredPlayers = players.filter(player => {
    const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
    const matchesSearch = !searchQuery || 
      player.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  // Handle player upvote
  const handleUpvote = (player) => {
    setPlayers(players.map(p => 
      p.id === player.id ? { ...p, upvotes: p.upvotes + 1 } : p
    ));
    toast.success(`Upvoted ${player.name}'s suggestion`);
  };
  
  // Handle comment click
  const handleCommentClick = (player) => {
    setSelectedPlayer(player);
    setIsCommentBoxOpen(true);
  };
  
  // Handle add new suggestion
  const handleAddSuggestion = () => {
    setIsNewSuggestionOpen(true);
  };
  
  // Handle submit new suggestion
  const handleSubmitSuggestion = (data) => {
    const newSuggestion = {
      id: players.length + 1,
      name: data.title,
      upvotes: 0,
      comments: 0,
      status: 'submitted'
    };
    
    setPlayers([...players, newSuggestion]);
    setIsNewSuggestionOpen(false);
    toast.success('New suggestion created successfully');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toaster for notifications */}
      <Toaster position="top-right" />

      {/* Modals */}
      <CommentBox 
        isOpen={isCommentBoxOpen} 
        onClose={() => setIsCommentBoxOpen(false)} 
        player={selectedPlayer} 
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
        <header className="bg-white shadow-sm px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="relative p-2 rounded-full hover:bg-gray-100"
                onClick={() => toast.success('Checking notifications')}
              >
                <Bell size={24} className="text-gray-600" />
                <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2">
                <img
                  src="/api/placeholder/32/32"
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                />
                <span className="font-medium">Kamesh</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content area with scrolling */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {/* Page header with title and actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">Suggestions</h1>
                <p className="text-gray-500">View and manage player suggestions</p>
              </div>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
                onClick={handleAddSuggestion}
              >
                <Plus size={18} className="mr-1" />
                Add Suggestion
              </button>
            </div>
            
            {/* Filter controls */}
            <div className="mb-6 flex justify-end gap-2">
              <StatusFilter 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              
              <button className="px-3 py-2 rounded-lg border border-gray-300 flex items-center hover:bg-gray-50">
                <SortDesc size={16} className="mr-1" />
                <span>Sort</span>
              </button>
            </div>
            
            {/* Main content area */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500">
                  Showing {filteredPlayers.length} of {players.length} reports
                </div>
                
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Submitted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">In Progress</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Approved</span>
                  </div>
                </div>
              </div>
              
              {/* Player cards */}
              {filteredPlayers.map(player => (
                <PlayerReportCard 
                  key={player.id}
                  player={player}
                  upvotes={player.upvotes}
                  comments={player.comments}
                  status={player.status}
                  onCommentClick={handleCommentClick}
                  onUpvote={handleUpvote}
                />
              ))}
              
              {/* Empty state */}
              {filteredPlayers.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No suggestions found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    No player suggestions match your current filter criteria. Try changing your filters or create a new suggestion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Suggestion;