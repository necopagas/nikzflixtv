import React, { useState, useMemo } from 'react';
import {
  FaChartLine,
  FaClock,
  FaFire,
  FaTrophy,
  FaHeart,
  FaStar,
  FaCalendarAlt,
  FaFilm,
  FaTv,
  FaTheaterMasks,
  FaChartBar,
  FaChartPie,
  FaCalendarWeek,
  FaMedal,
  FaCrown,
  FaAward,
} from 'react-icons/fa';
import { useWatchedHistory } from '../hooks/useWatchedHistory';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useMyList } from '../hooks/useMyList';

const StatsPage = () => {
  const { watchedHistory } = useWatchedHistory();
  const { continueWatchingList } = useContinueWatching();
  const { myList } = useMyList();

  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, month, week

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter by period
    let filteredHistory = watchedHistory;
    if (selectedPeriod === 'week') {
      filteredHistory = watchedHistory.filter(item => {
        const timestamp = localStorage.getItem(`watched_${item}_timestamp`);
        return timestamp && new Date(parseInt(timestamp)) >= oneWeekAgo;
      });
    } else if (selectedPeriod === 'month') {
      filteredHistory = watchedHistory.filter(item => {
        const timestamp = localStorage.getItem(`watched_${item}_timestamp`);
        return timestamp && new Date(parseInt(timestamp)) >= oneMonthAgo;
      });
    }

    // Get genre stats
    const genreCount = {};
    filteredHistory.forEach(id => {
      const genres = JSON.parse(localStorage.getItem(`watched_${id}_genres`) || '[]');
      genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Calculate watch time (estimate: 45 min per episode, 2h per movie)
    const totalMinutes = filteredHistory.length * 60; // Simplified estimate
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Calculate streaks
    const sortedDates = filteredHistory
      .map(id => {
        const timestamp = localStorage.getItem(`watched_${id}_timestamp`);
        return timestamp ? new Date(parseInt(timestamp)) : null;
      })
      .filter(Boolean)
      .sort((a, b) => b - a);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diff = Math.floor((sortedDates[i] - sortedDates[i + 1]) / (1000 * 60 * 60 * 24));
      if (diff <= 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if watched today
    if (sortedDates.length > 0) {
      const today = new Date().setHours(0, 0, 0, 0);
      const lastWatchDate = sortedDates[0].setHours(0, 0, 0, 0);
      if (today === lastWatchDate) {
        currentStreak = 1;
        // Count consecutive days
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]).setHours(0, 0, 0, 0);
          const currDate = new Date(sortedDates[i]).setHours(0, 0, 0, 0);
          const diff = (prevDate - currDate) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      totalWatched: filteredHistory.length,
      totalHours: hours,
      totalMinutes: minutes,
      totalInMyList: myList.length,
      totalContinueWatching: continueWatchingList.length,
      topGenres,
      currentStreak,
      longestStreak,
      averagePerDay:
        selectedPeriod === 'week'
          ? (filteredHistory.length / 7).toFixed(1)
          : selectedPeriod === 'month'
            ? (filteredHistory.length / 30).toFixed(1)
            : (filteredHistory.length / 365).toFixed(1),
    };
  }, [watchedHistory, myList, continueWatchingList, selectedPeriod]);

  // Achievement system
  const achievements = useMemo(() => {
    const earned = [];

    if (stats.totalWatched >= 1)
      earned.push({ icon: '🎬', title: 'First Watch', desc: 'Watched your first content' });
    if (stats.totalWatched >= 10)
      earned.push({ icon: '📺', title: 'Getting Started', desc: 'Watched 10 titles' });
    if (stats.totalWatched >= 50)
      earned.push({ icon: '🍿', title: 'Movie Buff', desc: 'Watched 50 titles' });
    if (stats.totalWatched >= 100)
      earned.push({ icon: '🎭', title: 'Cinephile', desc: 'Watched 100 titles' });
    if (stats.totalWatched >= 250)
      earned.push({ icon: '👑', title: 'Streaming King', desc: 'Watched 250 titles' });
    if (stats.totalWatched >= 500)
      earned.push({ icon: '🏆', title: 'Legend', desc: 'Watched 500 titles' });

    if (stats.currentStreak >= 3)
      earned.push({ icon: '🔥', title: 'On Fire', desc: '3-day watch streak' });
    if (stats.currentStreak >= 7)
      earned.push({ icon: '⚡', title: 'Week Warrior', desc: '7-day watch streak' });
    if (stats.currentStreak >= 30)
      earned.push({ icon: '💎', title: 'Diamond Streak', desc: '30-day watch streak' });

    if (stats.totalHours >= 24)
      earned.push({ icon: '⏰', title: 'Day Watcher', desc: 'Watched for 24 hours' });
    if (stats.totalHours >= 100)
      earned.push({ icon: '🌟', title: 'Century Club', desc: 'Watched for 100 hours' });

    if (myList.length >= 10)
      earned.push({ icon: '❤️', title: 'Collector', desc: '10 items in My List' });
    if (myList.length >= 50)
      earned.push({ icon: '💝', title: 'Super Collector', desc: '50 items in My List' });

    return earned;
  }, [stats, myList]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 text-white px-4 sm:px-8 md:px-16 pt-28 pb-20">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Your Stats Dashboard
        </h1>
        <p className="text-gray-400 text-lg">Track your viewing habits and achievements</p>
      </div>

      {/* Period Selector */}
      <div className="mb-8 flex justify-center gap-2">
        {['all', 'month', 'week'].map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              selectedPeriod === period
                ? 'bg-linear-to-r from-purple-600 to-pink-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {period === 'all' ? 'All Time' : period === 'month' ? 'This Month' : 'This Week'}
          </button>
        ))}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Watched */}
        <div className="bg-linear-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <FaFilm className="text-4xl text-white/80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.totalWatched}</div>
              <div className="text-sm text-white/80">Content Watched</div>
            </div>
          </div>
        </div>

        {/* Watch Time */}
        <div className="bg-linear-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <FaClock className="text-4xl text-white/80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.totalHours}h</div>
              <div className="text-sm text-white/80">Watch Time</div>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-linear-to-br from-orange-600 to-red-600 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <FaFire className="text-4xl text-white/80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.currentStreak}</div>
              <div className="text-sm text-white/80">Day Streak</div>
            </div>
          </div>
        </div>

        {/* My List */}
        <div className="bg-linear-to-br from-pink-600 to-pink-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <FaHeart className="text-4xl text-white/80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.totalInMyList}</div>
              <div className="text-sm text-white/80">In My List</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Longest Streak */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-2">
            <FaTrophy className="text-3xl text-yellow-400" />
            <div>
              <div className="text-2xl font-bold">{stats.longestStreak} Days</div>
              <div className="text-sm text-gray-400">Longest Streak</div>
            </div>
          </div>
        </div>

        {/* Average Per Day */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-2">
            <FaChartLine className="text-3xl text-green-400" />
            <div>
              <div className="text-2xl font-bold">{stats.averagePerDay}</div>
              <div className="text-sm text-gray-400">Average Per Day</div>
            </div>
          </div>
        </div>

        {/* Continue Watching */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-2">
            <FaTv className="text-3xl text-blue-400" />
            <div>
              <div className="text-2xl font-bold">{stats.totalContinueWatching}</div>
              <div className="text-sm text-gray-400">Continue Watching</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Genres */}
      {stats.topGenres.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaChartBar className="text-purple-400" />
            Top Genres
          </h2>
          <div className="space-y-4">
            {stats.topGenres.map(([genre, count], index) => (
              <div key={genre}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{genre}</span>
                  <span className="text-gray-400">{count} titles</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      index === 0
                        ? 'bg-linear-to-r from-purple-500 to-pink-500'
                        : index === 1
                          ? 'bg-linear-to-r from-blue-500 to-cyan-500'
                          : index === 2
                            ? 'bg-linear-to-r from-green-500 to-emerald-500'
                            : index === 3
                              ? 'bg-linear-to-r from-yellow-500 to-orange-500'
                              : 'bg-linear-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${(count / stats.topGenres[0][1]) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaMedal className="text-yellow-400" />
            Achievements
          </h2>
          <span className="text-lg font-semibold text-purple-400">
            {achievements.length} Unlocked
          </span>
        </div>

        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-linear-to-br from-gray-700 to-gray-800 rounded-lg p-4 border border-yellow-500/30 hover:border-yellow-500 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div>
                    <div className="font-bold text-yellow-400">{achievement.title}</div>
                    <div className="text-sm text-gray-400">{achievement.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FaTrophy className="text-6xl mx-auto mb-4 opacity-50" />
            <p>Start watching to unlock achievements!</p>
          </div>
        )}
      </div>

      {/* Motivational Message */}
      <div className="mt-8 text-center">
        <div className="bg-linear-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl p-6">
          <FaCrown className="text-5xl text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Keep Going!</h3>
          <p className="text-gray-300">
            {stats.currentStreak > 0
              ? `You're on a ${stats.currentStreak}-day streak! Keep watching to maintain it! 🔥`
              : `Watch something today to start a new streak! 🎬`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
