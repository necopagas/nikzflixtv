// src/utils/videoPlayerUtils.js

/**
 * Auto-skip intro/outro detection and skip functionality
 */
export class IntroSkipper {
  constructor(videoElement, options = {}) {
    this.video = videoElement;
    this.skipIntroStart = options.skipIntroStart || 0;
    this.skipIntroEnd = options.skipIntroEnd || 90; // Default: skip first 90 seconds
    this.skipOutroStart = options.skipOutroStart || null;
    this.autoSkipEnabled = options.autoSkipEnabled !== false;
    this.hasSkippedIntro = false;
    this.skipButtonTimeout = null;
    this.callbacks = options.callbacks || {};
  }

  /**
   * Detect if current time is in intro range
   */
  isInIntro() {
    const currentTime = this.video.currentTime;
    return (
      currentTime >= this.skipIntroStart &&
      currentTime <= this.skipIntroEnd &&
      !this.hasSkippedIntro
    );
  }

  /**
   * Detect if current time is in outro range
   */
  isInOutro() {
    if (!this.skipOutroStart) return false;
    const currentTime = this.video.currentTime;
    const duration = this.video.duration;
    return currentTime >= this.skipOutroStart && currentTime < duration;
  }

  /**
   * Skip intro
   */
  skipIntro() {
    this.video.currentTime = this.skipIntroEnd + 1;
    this.hasSkippedIntro = true;
    if (this.callbacks.onIntroSkipped) {
      this.callbacks.onIntroSkipped();
    }
  }

  /**
   * Skip to next episode (for outro)
   */
  skipToNext() {
    if (this.callbacks.onSkipToNext) {
      this.callbacks.onSkipToNext();
    }
  }

  /**
   * Auto-skip logic
   */
  checkAndSkip() {
    if (!this.autoSkipEnabled) return;

    if (this.isInIntro()) {
      this.skipIntro();
    }
  }

  /**
   * Reset skipper for new episode
   */
  reset() {
    this.hasSkippedIntro = false;
  }
}

/**
 * Playback speed manager
 */
export class PlaybackSpeedController {
  static speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  constructor(videoElement) {
    this.video = videoElement;
    this.currentSpeedIndex = 3; // Default: 1x
  }

  setSpeed(speed) {
    this.video.playbackRate = speed;
    this.currentSpeedIndex = PlaybackSpeedController.speeds.indexOf(speed);
    localStorage.setItem('playbackSpeed', speed);
  }

  increaseSpeed() {
    const newIndex = Math.min(
      this.currentSpeedIndex + 1,
      PlaybackSpeedController.speeds.length - 1
    );
    this.setSpeed(PlaybackSpeedController.speeds[newIndex]);
  }

  decreaseSpeed() {
    const newIndex = Math.max(this.currentSpeedIndex - 1, 0);
    this.setSpeed(PlaybackSpeedController.speeds[newIndex]);
  }

  getCurrentSpeed() {
    return PlaybackSpeedController.speeds[this.currentSpeedIndex];
  }

  static getSavedSpeed() {
    const saved = localStorage.getItem('playbackSpeed');
    return saved ? parseFloat(saved) : 1;
  }
}

/**
 * Watch progress tracker
 */
export class WatchProgressTracker {
  constructor(itemId, totalDuration) {
    this.itemId = itemId;
    this.totalDuration = totalDuration;
    this.saveInterval = null;
  }

  startTracking(videoElement) {
    // Save progress every 5 seconds
    this.saveInterval = setInterval(() => {
      this.saveProgress(videoElement.currentTime);
    }, 5000);
  }

  stopTracking() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
  }

  saveProgress(currentTime) {
    const progress = {
      itemId: this.itemId,
      currentTime,
      totalDuration: this.totalDuration,
      percentage: (currentTime / this.totalDuration) * 100,
      timestamp: Date.now(),
    };

    const allProgress = JSON.parse(localStorage.getItem('watchProgress') || '{}');
    allProgress[this.itemId] = progress;
    localStorage.setItem('watchProgress', JSON.stringify(allProgress));
  }

  static getProgress(itemId) {
    const allProgress = JSON.parse(localStorage.getItem('watchProgress') || '{}');
    return allProgress[itemId] || null;
  }

  static clearProgress(itemId) {
    const allProgress = JSON.parse(localStorage.getItem('watchProgress') || '{}');
    delete allProgress[itemId];
    localStorage.setItem('watchProgress', JSON.stringify(allProgress));
  }
}

/**
 * Network speed detector
 */
export class NetworkSpeedDetector {
  constructor() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    this.listeners = [];
  }

  getConnectionType() {
    if (!this.connection) return 'unknown';
    return this.connection.effectiveType || 'unknown';
  }

  getDownlinkSpeed() {
    if (!this.connection) return null;
    return this.connection.downlink; // in Mbps
  }

  isSlowConnection() {
    const type = this.getConnectionType();
    return type === 'slow-2g' || type === '2g';
  }

  isFastConnection() {
    const type = this.getConnectionType();
    return type === '4g' || type === '5g';
  }

  getSuggestedQuality() {
    const downlink = this.getDownlinkSpeed();

    if (this.isSlowConnection() || (downlink && downlink < 1)) {
      return 'sd'; // 480p or lower
    } else if (this.isFastConnection() || (downlink && downlink > 5)) {
      return 'hd'; // 1080p
    } else {
      return 'auto'; // 720p
    }
  }

  onConnectionChange(callback) {
    if (this.connection) {
      const handler = () => callback(this.getConnectionType());
      this.connection.addEventListener('change', handler);
      this.listeners.push({ event: 'change', handler });
    }
  }

  destroy() {
    this.listeners.forEach(({ event, handler }) => {
      this.connection?.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

/**
 * Subtitle customizer
 */
export class SubtitleCustomizer {
  static defaultSettings = {
    fontSize: 100, // percentage
    fontFamily: 'Arial',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    opacity: 0.75,
    position: 'bottom',
  };

  static saveSettings(settings) {
    localStorage.setItem('subtitleSettings', JSON.stringify(settings));
  }

  static getSettings() {
    const saved = localStorage.getItem('subtitleSettings');
    return saved ? JSON.parse(saved) : SubtitleCustomizer.defaultSettings;
  }

  static applyToVideoElement(trackElement) {
    const settings = SubtitleCustomizer.getSettings();

    if (trackElement) {
      const cue = trackElement.cues?.[0];
      if (cue) {
        cue.line = settings.position === 'top' ? 0 : -1;
        cue.size = settings.fontSize;
      }
    }
  }
}
