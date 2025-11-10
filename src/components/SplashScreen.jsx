import { useEffect, useState } from 'react';
import './SplashScreen.css';
import { SANTA_HAT_USER } from '../assets/santaHatUser';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Logo animation lasts 2 seconds
    const animationTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 2000);

    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    // Call onFinish after fade completes (3 seconds total)
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${!isVisible ? 'splash-screen--fade-out' : ''}`}>
      <div className="splash-screen__content">
        <div className={`splash-screen__logo ${isAnimating ? 'splash-screen__logo--animate' : ''}`}>
          {/* Santa Hat positioned on top of NIKZ */}
          <img src={SANTA_HAT_USER} alt="Santa Hat" className="splash-screen__santa-hat" />
          <span className="splash-screen__logo-text splash-screen__logo-text--primary">NIKZ</span>
          <span className="splash-screen__logo-text splash-screen__logo-text--secondary">FLIX</span>
        </div>
        <div className="splash-screen__loading">
          <div className="splash-screen__loading-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
