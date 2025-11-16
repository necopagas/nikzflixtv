import { useState, useEffect, useCallback } from 'react';
import { useWatchedHistory } from './useWatchedHistory';
import { useMyList } from './useMyList';
import { usePlaylists } from './usePlaylists';

/**
 * Achievement & Gamification System
 * Tracks user progress, unlocks badges, awards XP, and manages levels
 */

// XP Points for different actions
export const XP_REWARDS = {
  WATCH_CONTENT: 10,
  ADD_TO_LIST: 5,
  CREATE_PLAYLIST: 15,
  WATCH_STREAK_DAY: 20,
  COMPLETE_ACHIEVEMENT: 50,
  BINGE_SESSION: 30, // Watch 3+ in a day
  GENRE_EXPLORER: 25, // Watch content from new genre
  EARLY_BIRD: 15, // Watch before 9 AM
  NIGHT_OWL: 15, // Watch after midnight
};

// Level thresholds (XP needed for each level)
export const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5
  2000, // Level 6
  3500, // Level 7
  5500, // Level 8
  8000, // Level 9
  12000, // Level 10
  17000, // Level 11
  23000, // Level 12
  30000, // Level 13
  40000, // Level 14
  50000, // Level 15
];

// Achievement definitions
export const ACHIEVEMENTS = {
  // Watch Count Achievements
  FIRST_WATCH: {
    id: 'first_watch',
    title: 'First Steps',
    description: 'Watch your first content',
    icon: '🎬',
    category: 'watch',
    xp: 50,
    check: stats => stats.totalWatched >= 1,
  },
  CASUAL_VIEWER: {
    id: 'casual_viewer',
    title: 'Casual Viewer',
    description: 'Watch 10 movies or shows',
    icon: '📺',
    category: 'watch',
    xp: 100,
    check: stats => stats.totalWatched >= 10,
  },
  DEDICATED_FAN: {
    id: 'dedicated_fan',
    title: 'Dedicated Fan',
    description: 'Watch 50 movies or shows',
    icon: '🎭',
    category: 'watch',
    xp: 200,
    check: stats => stats.totalWatched >= 50,
  },
  BINGE_MASTER: {
    id: 'binge_master',
    title: 'Binge Master',
    description: 'Watch 100 movies or shows',
    icon: '👑',
    category: 'watch',
    xp: 500,
    check: stats => stats.totalWatched >= 100,
  },
  LEGENDARY_VIEWER: {
    id: 'legendary_viewer',
    title: 'Legendary Viewer',
    description: 'Watch 500 movies or shows',
    icon: '🏆',
    category: 'watch',
    xp: 1000,
    check: stats => stats.totalWatched >= 500,
  },

  // Streak Achievements
  CONSISTENT_WATCHER: {
    id: 'consistent_watcher',
    title: 'Consistent Watcher',
    description: 'Maintain a 3-day watch streak',
    icon: '🔥',
    category: 'streak',
    xp: 100,
    check: stats => stats.currentStreak >= 3,
  },
  DEDICATED_STREAKER: {
    id: 'dedicated_streaker',
    title: 'Dedicated Streaker',
    description: 'Maintain a 7-day watch streak',
    icon: '⚡',
    category: 'streak',
    xp: 200,
    check: stats => stats.currentStreak >= 7,
  },
  UNSTOPPABLE: {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Maintain a 30-day watch streak',
    icon: '💪',
    category: 'streak',
    xp: 500,
    check: stats => stats.currentStreak >= 30,
  },

  // Genre Achievements
  GENRE_EXPLORER: {
    id: 'genre_explorer',
    title: 'Genre Explorer',
    description: 'Watch content from 5 different genres',
    icon: '🗺️',
    category: 'genre',
    xp: 150,
    check: stats => Object.keys(stats.genreStats || {}).length >= 5,
  },
  GENRE_MASTER: {
    id: 'genre_master',
    title: 'Genre Master',
    description: 'Watch content from 10 different genres',
    icon: '🎨',
    category: 'genre',
    xp: 300,
    check: stats => Object.keys(stats.genreStats || {}).length >= 10,
  },

  // List Achievements
  LIST_STARTER: {
    id: 'list_starter',
    title: 'List Starter',
    description: 'Add 5 items to your list',
    icon: '📝',
    category: 'list',
    xp: 50,
    check: stats => stats.myListCount >= 5,
  },
  LIST_CURATOR: {
    id: 'list_curator',
    title: 'List Curator',
    description: 'Add 25 items to your list',
    icon: '📚',
    category: 'list',
    xp: 150,
    check: stats => stats.myListCount >= 25,
  },

  // Playlist Achievements
  PLAYLIST_CREATOR: {
    id: 'playlist_creator',
    title: 'Playlist Creator',
    description: 'Create your first playlist',
    icon: '🎵',
    category: 'playlist',
    xp: 100,
    check: stats => stats.playlistCount >= 1,
  },
  PLAYLIST_PRO: {
    id: 'playlist_pro',
    title: 'Playlist Pro',
    description: 'Create 5 playlists',
    icon: '🎼',
    category: 'playlist',
    xp: 250,
    check: stats => stats.playlistCount >= 5,
  },

  // Time-based Achievements
  NIGHT_OWL: {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Watch content after midnight',
    icon: '🦉',
    category: 'time',
    xp: 100,
    check: stats => stats.nightOwlWatches >= 1,
  },
  EARLY_BIRD: {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Watch content before 9 AM',
    icon: '🐦',
    category: 'time',
    xp: 100,
    check: stats => stats.earlyBirdWatches >= 1,
  },

  // Special Achievements
  WEEKEND_WARRIOR: {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Watch 5+ items on a weekend',
    icon: '🎉',
    category: 'special',
    xp: 150,
    check: stats => stats.weekendBinges >= 1,
  },
  MARATHON_RUNNER: {
    id: 'marathon_runner',
    title: 'Marathon Runner',
    description: 'Watch 10+ items in one day',
    icon: '🏃',
    category: 'special',
    xp: 300,
    check: stats => stats.marathonDays >= 1,
  },
};

// Unlockable themes
export const UNLOCKABLE_THEMES = {
  GOLD_RUSH: {
    id: 'gold_rush',
    name: 'Gold Rush',
    description: 'Unlock at Level 5',
    requiredLevel: 5,
    colors: {
      primary: '#FFD700',
      secondary: '#FFA500',
      accent: '#FF8C00',
    },
  },
  MIDNIGHT_PURPLE: {
    id: 'midnight_purple',
    name: 'Midnight Purple',
    description: 'Unlock at Level 10',
    requiredLevel: 10,
    colors: {
      primary: '#9D4EDD',
      secondary: '#7B2CBF',
      accent: '#5A189A',
    },
  },
  OCEAN_BREEZE: {
    id: 'ocean_breeze',
    name: 'Ocean Breeze',
    description: 'Unlock at Level 15',
    requiredLevel: 15,
    colors: {
      primary: '#0077B6',
      secondary: '#00B4D8',
      accent: '#90E0EF',
    },
  },
};

export const useAchievements = () => {
  const { watchedHistory } = useWatchedHistory();
  const { myList } = useMyList();
  const { playlists } = usePlaylists();

  const [userProgress, setUserProgress] = useState(() => {
    const saved = localStorage.getItem('nikzflix_gamification');
    return saved
      ? JSON.parse(saved)
      : {
          xp: 0,
          level: 1,
          unlockedAchievements: [],
          stats: {
            totalWatched: 0,
            currentStreak: 0,
            longestStreak: 0,
            myListCount: 0,
            playlistCount: 0,
            genreStats: {},
            nightOwlWatches: 0,
            earlyBirdWatches: 0,
            weekendBinges: 0,
            marathonDays: 0,
          },
          lastWatchDate: null,
          watchDates: [],
        };
  });

  // Calculate level from XP
  const calculateLevel = useCallback(xp => {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
        break;
      }
    }
    return level;
  }, []);

  // Get XP needed for next level
  const getXPForNextLevel = useCallback(currentLevel => {
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
      return null; // Max level reached
    }
    return LEVEL_THRESHOLDS[currentLevel];
  }, []);

  // Award XP and check for level up
  const awardXP = useCallback(
    (amount, reason) => {
      setUserProgress(prev => {
        const newXP = prev.xp + amount;
        const newLevel = calculateLevel(newXP);
        const leveledUp = newLevel > prev.level;

        const updated = {
          ...prev,
          xp: newXP,
          level: newLevel,
        };

        if (leveledUp) {
          // Level up notification will be handled by the component
          console.log(`🎉 Level Up! You are now level ${newLevel}!`);
        }

        return updated;
      });

      return { amount, reason };
    },
    [calculateLevel]
  );

  // Unlock achievement
  const unlockAchievement = useCallback(
    achievementId => {
      setUserProgress(prev => {
        if (prev.unlockedAchievements.includes(achievementId)) {
          return prev;
        }

        const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
        if (!achievement) return prev;

        const updated = {
          ...prev,
          unlockedAchievements: [...prev.unlockedAchievements, achievementId],
          xp: prev.xp + achievement.xp,
        };

        updated.level = calculateLevel(updated.xp);

        console.log(`🏆 Achievement Unlocked: ${achievement.title}! +${achievement.xp} XP`);

        return updated;
      });
    },
    [calculateLevel]
  );

  // Calculate streak
  const calculateStreak = useCallback(watchDates => {
    if (watchDates.length === 0) return 0;

    const sortedDates = [...watchDates].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = today;

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr).setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((checkDate - date) / (1000 * 60 * 60 * 24));

      if (dayDiff === 0) {
        streak++;
        checkDate = date - 1000 * 60 * 60 * 24;
      } else if (dayDiff === 1) {
        streak++;
        checkDate = date - 1000 * 60 * 60 * 24;
      } else {
        break;
      }
    }

    return streak;
  }, []);

  // Update stats based on current data
  useEffect(() => {
    setUserProgress(prev => {
      const watchDates = watchedHistory.map(() => new Date().toISOString().split('T')[0]);
      const uniqueDates = [...new Set(watchDates)];
      const currentStreak = calculateStreak(uniqueDates);

      const updated = {
        ...prev,
        stats: {
          ...prev.stats,
          totalWatched: watchedHistory.length,
          currentStreak,
          longestStreak: Math.max(currentStreak, prev.stats.longestStreak),
          myListCount: myList.length,
          playlistCount: playlists.length,
        },
        watchDates: uniqueDates,
      };

      // Check for newly unlocked achievements
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (!prev.unlockedAchievements.includes(achievement.id)) {
          if (achievement.check(updated.stats)) {
            setTimeout(() => unlockAchievement(achievement.id), 100);
          }
        }
      });

      return updated;
    });
  }, [watchedHistory, myList, playlists, calculateStreak, unlockAchievement]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('nikzflix_gamification', JSON.stringify(userProgress));
  }, [userProgress]);

  // Get progress to next level
  const progressToNextLevel = () => {
    const currentLevelXP = LEVEL_THRESHOLDS[userProgress.level - 1] || 0;
    const nextLevelXP = getXPForNextLevel(userProgress.level);

    if (nextLevelXP === null) {
      return 100; // Max level
    }

    const xpInCurrentLevel = userProgress.xp - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;

    return Math.floor((xpInCurrentLevel / xpNeededForLevel) * 100);
  };

  // Get unlocked themes
  const unlockedThemes = Object.values(UNLOCKABLE_THEMES).filter(
    theme => userProgress.level >= theme.requiredLevel
  );

  // Get locked themes
  const lockedThemes = Object.values(UNLOCKABLE_THEMES).filter(
    theme => userProgress.level < theme.requiredLevel
  );

  // Get achievements by category
  const achievementsByCategory = Object.values(ACHIEVEMENTS).reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push({
      ...achievement,
      unlocked: userProgress.unlockedAchievements.includes(achievement.id),
    });
    return acc;
  }, {});

  return {
    userProgress,
    level: userProgress.level,
    xp: userProgress.xp,
    stats: userProgress.stats,
    unlockedAchievements: userProgress.unlockedAchievements,
    achievementsByCategory,
    progressToNextLevel: progressToNextLevel(),
    xpForNextLevel: getXPForNextLevel(userProgress.level),
    unlockedThemes,
    lockedThemes,
    awardXP,
    unlockAchievement,
  };
};
