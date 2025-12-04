import React, { useState } from 'react';
import { useAchievements, ACHIEVEMENTS, UNLOCKABLE_THEMES } from '../hooks/useAchievements';
import { FiAward, FiStar, FiTrendingUp, FiLock, FiUnlock } from 'react-icons/fi';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AchievementsPage = () => {
  const {
    level,
    xp,
    stats,
    achievementsByCategory,
    progressToNextLevel,
    xpForNextLevel,
    unlockedThemes,
    lockedThemes,
  } = useAchievements();

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Category display names with icons
  const categoryInfo = {
    all: { name: 'All Achievements', icon: '🏆', color: 'from-purple-600 to-purple-800' },
    watch: { name: 'Watch Milestones', icon: '🎬', color: 'from-blue-600 to-blue-800' },
    streak: { name: 'Streak Master', icon: '🔥', color: 'from-orange-600 to-orange-800' },
    genre: { name: 'Genre Explorer', icon: '🎨', color: 'from-pink-600 to-pink-800' },
    list: { name: 'List Curator', icon: '📚', color: 'from-green-600 to-green-800' },
    playlist: { name: 'Playlist Master', icon: '🎵', color: 'from-indigo-600 to-indigo-800' },
    time: { name: 'Time-based', icon: '⏰', color: 'from-teal-600 to-teal-800' },
    special: { name: 'Special Events', icon: '✨', color: 'from-amber-600 to-amber-800' },
  };

  // Filter achievements
  const filteredAchievements =
    selectedCategory === 'all'
      ? Object.values(achievementsByCategory).flat()
      : achievementsByCategory[selectedCategory] || [];

  const unlockedCount = filteredAchievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white pt-20 px-4 sm:px-8 md:px-16 pb-20">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">🏆 Achievements & Progress</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Track your viewing journey and unlock exclusive rewards
        </p>
      </div>

      {/* Level & XP Card */}
      <div className="bg-linear-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-8 border border-purple-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-bold">
                {level}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Level {level}</h2>
                <p className="text-gray-300">{xp.toLocaleString()} XP</p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress to Level {level + 1}</span>
              <span className="text-sm font-semibold">{progressToNextLevel}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
            {xpForNextLevel && (
              <p className="text-xs text-gray-500 mt-1">{xpForNextLevel - xp} XP to next level</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🎬</div>
            <div className="text-xl font-bold">{stats.totalWatched}</div>
            <div className="text-xs text-gray-400">Watched</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xl font-bold">
              {
                Object.values(achievementsByCategory)
                  .flat()
                  .filter(a => a.unlocked).length
              }
            </div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🎨</div>
            <div className="text-xl font-bold">{unlockedThemes.length}</div>
            <div className="text-xs text-gray-400">Themes</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(categoryInfo).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedCategory === key
                ? `bg-linear-to-r ${info.color} text-white`
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <span className="mr-2">{info.icon}</span>
            {info.name}
          </button>
        ))}
      </div>

      {/* Achievement Progress Bar */}
      {selectedCategory !== 'all' && (
        <div className="mb-6 bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">
              {categoryInfo[selectedCategory]?.name} Progress
            </span>
            <span className="text-sm text-gray-400">
              {unlockedCount} / {filteredAchievements.length}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full bg-linear-to-r ${categoryInfo[selectedCategory]?.color} transition-all duration-500`}
              style={{ width: `${(unlockedCount / filteredAchievements.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Achievements Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FiAward className="text-amber-400" />
          Achievements
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              className={`relative rounded-xl p-5 transition-all duration-300 ${
                achievement.unlocked
                  ? 'bg-linear-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/50'
                  : 'bg-gray-900/50 border border-gray-800'
              }`}
            >
              {/* Unlock Badge */}
              {achievement.unlocked && (
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <FiUnlock className="text-white text-sm" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`text-4xl mb-3 ${!achievement.unlocked && 'grayscale opacity-50'}`}>
                {achievement.icon}
              </div>

              {/* Title & Description */}
              <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>

              {/* XP Reward */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiStar className="text-amber-400" />
                  <span className="text-sm font-semibold">+{achievement.xp} XP</span>
                </div>
                {!achievement.unlocked && <FiLock className="text-gray-600" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unlockable Themes */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-purple-400" />
          Unlockable Themes
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {unlockedThemes.map(theme => (
            <div
              key={theme.id}
              className="bg-linear-to-br from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg mb-1">{theme.name}</h3>
                  <p className="text-sm text-gray-400">{theme.description}</p>
                </div>
                <FiUnlock className="text-green-400 text-xl" />
              </div>

              <div className="flex gap-2 mt-4">
                {Object.values(theme.colors).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}

          {lockedThemes.map(theme => (
            <div
              key={theme.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 opacity-60"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg mb-1 text-gray-400">{theme.name}</h3>
                  <p className="text-sm text-gray-500">{theme.description}</p>
                </div>
                <FiLock className="text-gray-600 text-xl" />
              </div>

              <div className="flex gap-2 mt-4 grayscale">
                {Object.values(theme.colors).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-full border-2 border-gray-700"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-linear-to-r from-gray-900/50 to-transparent rounded-xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold mb-3">📊 How to Earn XP & Unlock Achievements</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">🎬 Watch Content</h4>
            <p>Earn 10 XP every time you watch a movie or show.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">🔥 Maintain Streaks</h4>
            <p>Watch daily to earn 20 XP per streak day bonus.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">📝 Create Playlists</h4>
            <p>Earn 15 XP for each playlist you create.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">🏆 Complete Achievements</h4>
            <p>Each achievement unlocks bonus XP rewards.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
