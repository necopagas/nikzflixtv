// src/hooks/useChristmasTheme.js
import { useState, useEffect, useRef } from 'react';

// Auto-detect season based on current date
const getCurrentSeason = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Halloween: October 15 - November 1
  if ((month === 10 && day >= 15) || (month === 11 && day === 1)) {
    return 'halloween';
  }

  // Christmas: December 1 - December 31
  if (month === 12) {
    return 'christmas';
  }

  // New Year: January 1 - January 7
  if (month === 1 && day <= 7) {
    return 'newyear';
  }

  return 'none';
};

export const useChristmasTheme = () => {
  const [selectedTheme, setSelectedTheme] = useState(() => {
    const saved = localStorage.getItem('nikz_seasonal_theme');
    return saved || 'auto'; // auto, halloween, christmas, newyear, none
  });

  const [isChristmasMusicEnabled, setIsChristmasMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('nikz_christmas_music');
    return saved === 'true';
  });

  const audioRef = useRef(null);

  // Determine active theme
  const activeTheme = selectedTheme === 'auto' ? getCurrentSeason() : selectedTheme;
  const isChristmasMode = activeTheme === 'christmas';
  const isHalloweenMode = activeTheme === 'halloween';
  const isNewYearMode = activeTheme === 'newyear';

  useEffect(() => {
    localStorage.setItem('nikz_seasonal_theme', selectedTheme);

    // Remove all theme classes
    document.body.classList.remove('christmas-mode', 'halloween-mode', 'newyear-mode');

    // Add active theme class
    if (isChristmasMode) {
      document.body.classList.add('christmas-mode');
    } else if (isHalloweenMode) {
      document.body.classList.add('halloween-mode');
    } else if (isNewYearMode) {
      document.body.classList.add('newyear-mode');
    }

    // Stop music if no theme active
    if (activeTheme === 'none' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [selectedTheme, isChristmasMode, isHalloweenMode, isNewYearMode, activeTheme]);

  useEffect(() => {
    localStorage.setItem('nikz_christmas_music', isChristmasMusicEnabled);

    if (isChristmasMode && isChristmasMusicEnabled) {
      // Play Christmas music
      if (!audioRef.current) {
        audioRef.current = new Audio(
          'https://www.bensound.com/bensound-music/bensound-jazzyfrenchy.mp3'
        );
        audioRef.current.loop = true;
        audioRef.current.volume = 0.15; // Even lower
        audioRef.current.play().catch(err => {
          console.log('Music autoplay prevented:', err);
        });
      }
    } else {
      // Stop music
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isChristmasMode, isChristmasMusicEnabled]);

  const setTheme = theme => {
    setSelectedTheme(theme);
  };

  const toggleChristmasMusic = () => {
    setIsChristmasMusicEnabled(prev => !prev);
  };

  return {
    selectedTheme,
    activeTheme,
    isChristmasMode,
    isHalloweenMode,
    isNewYearMode,
    setTheme,
    isChristmasMusicEnabled,
    toggleChristmasMusic,
    // Legacy support
    legacyIsChristmasMode: isChristmasMode,
    toggleChristmasMode: () => setTheme(isChristmasMode ? 'none' : 'christmas'),
  };
};
