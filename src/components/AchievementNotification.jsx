import React, { useState, useEffect } from 'react';
import { FiX, FiStar } from 'react-icons/fi';

export const AchievementNotification = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-20 right-4 sm:right-8 z-[9999] max-w-sm transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-xl shadow-2xl border-2 border-amber-500 overflow-hidden">
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />

        <div className="relative p-5">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl animate-bounce">🏆</div>
            <div>
              <h3 className="font-bold text-lg text-white">Achievement Unlocked!</h3>
              <p className="text-xs text-amber-200">You earned {achievement.xp} XP</p>
            </div>
          </div>

          {/* Achievement Details */}
          <div className="flex items-start gap-3">
            <div className="text-3xl">{achievement.icon}</div>
            <div className="flex-1">
              <h4 className="font-bold text-white mb-1">{achievement.title}</h4>
              <p className="text-sm text-amber-100">{achievement.description}</p>
            </div>
          </div>

          {/* XP Badge */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <FiStar className="text-amber-300" />
            <span className="text-sm font-semibold text-white">+{achievement.xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LevelUpNotification = ({ level, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-20 right-4 sm:right-8 z-[9999] max-w-sm transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl shadow-2xl border-2 border-purple-500 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />

        <div className="relative p-5">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>

          <div className="text-center">
            <div className="text-5xl mb-3 animate-bounce">🎉</div>
            <h3 className="font-bold text-2xl text-white mb-2">Level Up!</h3>
            <p className="text-lg text-purple-200">You reached Level {level}!</p>
            <div className="mt-4 text-sm text-purple-300">Keep watching to unlock more rewards</div>
          </div>
        </div>
      </div>
    </div>
  );
};
