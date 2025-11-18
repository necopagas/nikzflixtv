import { useState, useRef, useEffect } from 'react';
import {
  FiUsers,
  FiMessageCircle,
  FiX,
  FiSend,
  FiCopy,
  FiShare2,
  FiUserX,
  FiPause,
  FiPlay,
} from 'react-icons/fi';
import { useWatchParty } from '../hooks/useWatchParty';

/**
 * Watch Party Controls Component
 * Floating widget for managing watch party during video playback
 */
const WatchPartyControls = ({ videoRef, videoUrl, videoMetadata }) => {
  const {
    isHost,
    participants,
    messages,
    isConnected,
    syncEnabled,
    createParty,
    joinParty,
    leaveParty,
    sendMessage,
    copyInviteLink,
    shareInviteLink,
    toggleSync,
    kickParticipant,
  } = useWatchParty(videoRef);

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('participants'); // 'participants' or 'chat'
  const [messageInput, setMessageInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [notification, setNotification] = useState('');

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle create party
  const handleCreateParty = () => {
    if (!videoUrl) {
      showNotification('Please load a video first');
      return;
    }

    createParty(videoUrl, videoMetadata);
    setIsExpanded(true);
    showNotification('Watch party created!');
  };

  // Handle join party
  const handleJoinParty = () => {
    if (!joinInput.trim()) {
      showNotification('Please enter a party ID or link');
      return;
    }

    try {
      // Extract party ID from link or use directly
      const idMatch = joinInput.match(/watch-party\/([^/?]+)/);
      const partyIdToJoin = idMatch ? idMatch[1] : joinInput.trim();

      joinParty(partyIdToJoin);
      setShowJoinModal(false);
      setJoinInput('');
      setIsExpanded(true);
      showNotification('Joined party!');
    } catch (error) {
      showNotification(error.message || 'Failed to join party');
    }
  };

  // Handle leave party
  const handleLeaveParty = () => {
    if (confirm('Leave watch party?')) {
      leaveParty();
      setIsExpanded(false);
      showNotification('Left party');
    }
  };

  // Handle send message
  const handleSendMessage = e => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    sendMessage(messageInput.trim());
    setMessageInput('');
  };

  // Handle copy link
  const handleCopyLink = async () => {
    const success = await copyInviteLink();
    showNotification(success ? 'Link copied!' : 'Failed to copy link');
  };

  // Handle share link
  const handleShareLink = async () => {
    const success = await shareInviteLink();
    if (success) {
      showNotification('Shared successfully!');
    }
  };

  // Show notification
  const showNotification = message => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  if (!isConnected) {
    // Not in a party - show join/create buttons
    return (
      <>
        <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2">
          <button
            onClick={handleCreateParty}
            className="flex items-center gap-2 px-4 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg font-medium transition-all duration-300 hover:scale-105"
            title="Start Watch Party"
          >
            <FiUsers className="text-xl" />
            <span className="hidden sm:inline">Start Watch Party</span>
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-lg font-medium transition-all duration-300 hover:scale-105"
            title="Join Watch Party"
          >
            <FiUsers className="text-xl" />
            <span className="hidden sm:inline">Join Party</span>
          </button>
        </div>

        {/* Join Modal */}
        {showJoinModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowJoinModal(false)}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-xl p-6 shadow-2xl z-50 w-full max-w-md border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Join Watch Party</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleJoinParty();
                }}
              >
                <input
                  type="text"
                  value={joinInput}
                  onChange={e => setJoinInput(e.target.value)}
                  placeholder="Enter party ID or invite link"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none mb-4"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-colors"
                >
                  Join Party
                </button>
              </form>
            </div>
          </>
        )}

        {/* Notification */}
        {notification && (
          <div className="fixed top-20 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-700 z-50 animate-fade-in">
            {notification}
          </div>
        )}
      </>
    );
  }

  // In a party - show party controls
  return (
    <>
      <div
        className={`fixed bottom-4 right-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-40 transition-all duration-300 ${isExpanded ? 'w-96 h-[500px]' : 'w-auto'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiUsers className="text-2xl text-purple-500" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {participants.length}
              </span>
            </div>
            {isExpanded && (
              <div>
                <h3 className="text-white font-semibold">Watch Party</h3>
                <p className="text-xs text-gray-400">{isHost ? 'You are hosting' : 'Connected'}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              <FiMessageCircle className="text-xl" />
            </button>
            <button
              onClick={handleLeaveParty}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Leave Party"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'participants' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
              >
                Participants ({participants.length})
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'chat' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
              >
                Chat
              </button>
            </div>

            {/* Content Area */}
            <div className="h-80 overflow-y-auto p-4">
              {activeTab === 'participants' ? (
                <div className="space-y-3">
                  {/* Sync Status */}
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Playback Sync</span>
                      <button
                        onClick={toggleSync}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${syncEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                      >
                        {syncEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {syncEnabled ? 'Playback is synchronized with host' : 'Sync disabled'}
                    </p>
                  </div>

                  {/* Invite Links */}
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Invite Friends</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <FiCopy /> Copy Link
                      </button>
                      <button
                        onClick={handleShareLink}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <FiShare2 /> Share
                      </button>
                    </div>
                  </div>

                  {/* Participants List */}
                  <div className="space-y-2">
                    {participants.map(participant => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {participant.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{participant.username}</p>
                            {participant.isHost && (
                              <span className="text-xs text-purple-400">Host</span>
                            )}
                          </div>
                        </div>
                        {isHost && participant.id !== participants.find(p => p.isHost)?.id && (
                          <button
                            onClick={() => kickParticipant(participant.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Remove participant"
                          >
                            <FiUserX />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`p-2 rounded-lg ${message.type === 'system' ? 'bg-gray-800/50 text-gray-400 text-center text-sm italic' : 'bg-gray-800'}`}
                    >
                      {message.type === 'user' && (
                        <>
                          <p className="text-purple-400 text-sm font-medium">{message.username}</p>
                          <p className="text-white text-sm">{message.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </>
                      )}
                      {message.type === 'system' && <p>{message.text}</p>}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            {activeTab === 'chat' && (
              <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <FiSend />
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-700 z-50 animate-fade-in">
          {notification}
        </div>
      )}
    </>
  );
};

export default WatchPartyControls;
