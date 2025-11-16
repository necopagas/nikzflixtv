import React from 'react';
import { useAchievements } from '../hooks/useAchievements';
import { useNavigate } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';

export const LevelBadge = () => {
  const { level, xp, progressToNextLevel } = useAchievements();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/achievements')}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-900/50 to-blue-900/50 hover:from-purple-800/60 hover:to-blue-800/60 rounded-lg border border-purple-500/30 transition-all duration-200 group"
      title="View Achievements"
    >
      {/* Level Circle */}
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
          {level}
        </div>

        {/* Progress Ring */}
        <svg className="absolute inset-0 w-8 h-8 -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="url(#gradient)"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${(progressToNextLevel / 100) * 87.96} 87.96`}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* XP Info */}
      <div className="hidden sm:flex items-center gap-1">
        <FiStar className="text-amber-400 text-sm" />
        <span className="text-xs font-semibold text-white">{xp.toLocaleString()}</span>
      </div>
    </button>
  );
};
