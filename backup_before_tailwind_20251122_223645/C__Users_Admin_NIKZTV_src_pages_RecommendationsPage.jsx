import React from 'react';
import { useRecommendations } from '../hooks/useRecommendations';
import { Row } from '../components/Row';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FiRefreshCw, FiTrendingUp, FiHeart, FiStar, FiZap } from 'react-icons/fi';

export const RecommendationsPage = ({ onOpenModal, isWatched }) => {
  const { recommendations, loading, sourceItem, hasWatchHistory, hasMyList } = useRecommendations();

  const handleRefresh = () => {
    window.location.reload();
  };

  const getSourceTitle = () => {
    if (!sourceItem) return '';
    const title = sourceItem.title || sourceItem.name;
    return title.length > 40 ? `${title.substring(0, 40)}...` : title;
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white pt-20 px-4 sm:px-8 md:px-16 pb-20">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">🎯 Your Recommendations</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Personalized picks based on your viewing history and preferences
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-(--brand-color) hover:bg-(--brand-color-hover) rounded-lg transition-colors"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiZap className="text-2xl text-purple-400" />
              <span className="text-sm text-gray-300">For You</span>
            </div>
            <p className="text-2xl font-bold">{recommendations.forYou.length}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiTrendingUp className="text-2xl text-blue-400" />
              <span className="text-sm text-gray-300">Trending</span>
            </div>
            <p className="text-2xl font-bold">{recommendations.trending.length}</p>
          </div>

          <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-sm border border-pink-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiHeart className="text-2xl text-pink-400" />
              <span className="text-sm text-gray-300">Similar</span>
            </div>
            <p className="text-2xl font-bold">{recommendations.similar.length}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiStar className="text-2xl text-amber-400" />
              <span className="text-sm text-gray-300">By Genre</span>
            </div>
            <p className="text-2xl font-bold">{recommendations.basedOnGenres.length}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="large" />
        </div>
      )}

      {!loading && !hasWatchHistory && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">Start Watching to Get Recommendations</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Watch some movies or shows to help us understand your preferences and generate
            personalized recommendations for you.
          </p>
        </div>
      )}

      {/* Recommendation Rows */}
      {!loading && hasWatchHistory && (
        <div className="space-y-8">
          {recommendations.becauseYouWatched.length > 0 && sourceItem && (
            <div className="bg-gradient-to-r from-purple-900/20 to-transparent rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  🎯 Because You Watched "{getSourceTitle()}"
                </h2>
                <p className="text-gray-400 text-sm">
                  Similar content you might enjoy based on your recent viewing
                </p>
              </div>
              <Row
                id="rec-because-you-watched"
                title=""
                items={recommendations.becauseYouWatched}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
                isLarge
              />
            </div>
          )}

          {recommendations.forYou.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/20 to-transparent rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">✨ Picked For You</h2>
                <p className="text-gray-400 text-sm">
                  Highly-rated content matching your taste profile
                </p>
              </div>
              <Row
                id="rec-for-you"
                title=""
                items={recommendations.forYou}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
                isLarge
              />
            </div>
          )}

          {recommendations.basedOnGenres.length > 0 && (
            <div className="bg-gradient-to-r from-amber-900/20 to-transparent rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  🎨 Based On Your Favorite Genres
                </h2>
                <p className="text-gray-400 text-sm">
                  Content from genres you watch most frequently
                </p>
              </div>
              <Row
                id="rec-by-genres"
                title=""
                items={recommendations.basedOnGenres}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
            </div>
          )}

          {recommendations.trending.length > 0 && (
            <div className="bg-gradient-to-r from-pink-900/20 to-transparent rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">📈 Trending For You</h2>
                <p className="text-gray-400 text-sm">What's popular now in genres you love</p>
              </div>
              <Row
                id="rec-trending"
                title=""
                items={recommendations.trending}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
            </div>
          )}

          {hasMyList && recommendations.similar.length > 0 && (
            <div className="bg-gradient-to-r from-green-900/20 to-transparent rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">💫 More Like Your List</h2>
                <p className="text-gray-400 text-sm">
                  Similar to content you've saved in your list
                </p>
              </div>
              <Row
                id="rec-similar"
                title=""
                items={recommendations.similar}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-gradient-to-r from-gray-900/50 to-transparent rounded-xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold mb-3">🤖 How Recommendations Work</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">📊 Watch History Analysis</h4>
            <p>We analyze your recently watched content to understand your preferences.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">🎭 Genre Preferences</h4>
            <p>Recommendations prioritize genres you watch most frequently.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">⭐ Rating Factors</h4>
            <p>Higher-rated content matching your taste gets priority.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">🔄 Real-Time Updates</h4>
            <p>Recommendations refresh as you watch more content.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
