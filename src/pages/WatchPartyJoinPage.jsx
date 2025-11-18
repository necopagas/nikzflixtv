import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUsers, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';

/**
 * Watch Party Join Page
 * Landing page for joining watch parties via invite link
 */
const WatchPartyJoinPage = () => {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [partyInfo, setPartyInfo] = useState(null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load party info
    const loadPartyInfo = () => {
      try {
        const stored = localStorage.getItem(`nikzflix_watch_party_${partyId}`);
        if (stored) {
          const party = JSON.parse(stored);
          setPartyInfo(party);
        } else {
          setError('Watch party not found');
        }
      } catch {
        setError('Failed to load party information');
      } finally {
        setIsLoading(false);
      }
    };

    loadPartyInfo();

    // Load saved username
    const savedUsername = localStorage.getItem('nikzflix_username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, [partyId]);

  const handleJoin = () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }

    // Save username
    localStorage.setItem('nikzflix_username', username.trim());

    // Navigate to video with party info
    if (partyInfo?.video?.metadata) {
      const { mediaType, itemId } = partyInfo.video.metadata;
      const type = mediaType === 'tv' ? 'series' : 'movie';
      navigate(`/watch/${type}/${itemId}?party=${partyId}`);
    } else {
      setError('Invalid party data');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading party...</p>
        </div>
      </div>
    );
  }

  if (error || !partyInfo) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-800 to-black pt-20 px-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <FiAlertCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Party Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || 'This watch party may have ended or the link is invalid.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-800 to-black pt-20 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Home</span>
        </button>

        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
          {/* Banner */}
          <div className="relative h-64 bg-linear-to-br from-purple-600 via-pink-600 to-purple-800 flex items-center justify-center">
            <div className="text-center">
              <FiUsers className="text-8xl text-white/90 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-white mb-2">Join Watch Party</h1>
              <p className="text-white/80">Watch together with friends</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Party Info */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Party Details</h2>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
                <div className="flex items-start gap-4">
                  {partyInfo.video?.metadata?.poster && (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${partyInfo.video.metadata.poster}`}
                      alt=""
                      className="w-24 h-36 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {partyInfo.video?.metadata?.title || 'Watch Party'}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        <span className="text-gray-500">Host:</span>{' '}
                        {partyInfo.host?.username || 'Unknown'}
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">Participants:</span>{' '}
                        {partyInfo.participants?.length || 0}
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">Created:</span>{' '}
                        {new Date(partyInfo.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div className="mb-8">
              <label className="block text-white font-semibold mb-2">Your Name</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                maxLength={20}
                autoFocus
              />
              <p className="text-sm text-gray-400 mt-2">
                This name will be visible to other participants
              </p>
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="w-full px-6 py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
            >
              Join Watch Party
            </button>

            {/* Info */}
            <div className="mt-8 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">What is Watch Party?</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Watch videos together in sync with friends</li>
                <li>• Chat with other participants in real-time</li>
                <li>• Playback automatically syncs with the host</li>
                <li>• Works without any additional software</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPartyJoinPage;
