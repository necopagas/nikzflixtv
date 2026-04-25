// src/components/SplashScreen.jsx — IMPROVED (year-round, no seasonal hat)
import { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate loading bar smoothly
    const step = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(step); return 100; }
        return prev + 2;
      });
    }, 28);

    const animationTimer = setTimeout(() => setIsAnimating(false), 2000);
    const fadeTimer = setTimeout(() => setIsVisible(false), 2500);
    const finishTimer = setTimeout(() => onFinish(), 3000);

    return () => {
      clearInterval(step);
      clearTimeout(animationTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${!isVisible ? 'splash-screen--fade-out' : ''}`}>
      <div className="splash-screen__content">
        {/* Logo */}
        <div className={`splash-screen__logo ${isAnimating ? 'splash-screen__logo--animate' : ''}`}>
          <span className="splash-screen__logo-text splash-screen__logo-text--primary">NIKZ</span>
          <span className="splash-screen__logo-text splash-screen__logo-text--secondary">FLIX</span>
        </div>

        {/* TV badge */}
        <span className="splash-screen__badge">TV</span>

        {/* Loading bar — progress driven */}
        <div className="splash-screen__loading">
          <div
            className="splash-screen__loading-bar"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
