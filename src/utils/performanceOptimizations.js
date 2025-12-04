// src/utils/performanceOptimizations.js

/**
 * Performance utilities for smooth mobile experience
 */

// Debounce function para sa scroll events
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function para sa resize events
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Check kung low-end device
export const isLowEndDevice = () => {
  // Check CPU cores
  const cores = navigator.hardwareConcurrency || 2;

  // Check memory (if available)
  const memory = navigator.deviceMemory || 4;

  // Check connection speed
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const effectiveType = connection?.effectiveType || '4g';

  // Low-end kung:
  // - 2 cores or less
  // - 2GB RAM or less
  // - Slow connection (2g, slow-2g)
  return cores <= 2 || memory <= 2 || ['slow-2g', '2g'].includes(effectiveType);
};

// Detect mobile device
export const isMobileDevice = () => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
};

// Preload critical images
export const preloadImage = src => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Lazy load images with IntersectionObserver
export const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    images.forEach(img => imageObserver.observe(img));
  }
};

// Request idle callback wrapper
export const requestIdleCallback = callback => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback);
  } else {
    return setTimeout(callback, 1);
  }
};

// Cancel idle callback wrapper
export const cancelIdleCallback = id => {
  if ('cancelIdleCallback' in window) {
    return window.cancelIdleCallback(id);
  } else {
    return clearTimeout(id);
  }
};

// Optimize scroll performance
export const optimizeScroll = element => {
  if (!element) return;

  // Enable hardware acceleration
  element.style.willChange = 'scroll-position';
  element.style.transform = 'translateZ(0)';

  // iOS momentum scrolling
  element.style.webkitOverflowScrolling = 'touch';

  // Contain scroll
  element.style.overscrollBehavior = 'contain';
};

// Detect if device prefers reduced motion
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get optimal image quality based on device
export const getOptimalImageQuality = () => {
  if (isLowEndDevice() || isMobileDevice()) {
    return 'w300'; // Lower quality for mobile/low-end
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const effectiveType = connection?.effectiveType || '4g';

  if (['slow-2g', '2g'].includes(effectiveType)) {
    return 'w185'; // Very low quality for slow connection
  } else if (effectiveType === '3g') {
    return 'w300'; // Medium quality for 3G
  } else {
    return 'w500'; // High quality for fast connection
  }
};

// Adaptive loading strategy
export const getAdaptiveLoadingStrategy = () => {
  const isLowEnd = isLowEndDevice();
  const isMobile = isMobileDevice();
  const reducedMotion = prefersReducedMotion();

  return {
    enableAnimations: !isLowEnd && !reducedMotion,
    enableBlur: !isLowEnd,
    enableShadows: !isLowEnd,
    lazyLoadThreshold: isMobile ? 0.1 : 0.25,
    imageQuality: getOptimalImageQuality(),
    prefetchImages: !isLowEnd && !isMobile,
    useTransforms: !isLowEnd,
    scrollBehavior: isMobile ? 'auto' : 'smooth',
  };
};

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      memory: 0,
      loadTime: 0,
    };
    this.lastTime = performance.now();
    this.frames = 0;
  }

  measureFPS() {
    const currentTime = performance.now();
    this.frames++;

    if (currentTime >= this.lastTime + 1000) {
      this.metrics.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.measureFPS());
  }

  getMemoryUsage() {
    if (performance.memory) {
      this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
    }
    return this.metrics.memory;
  }

  getLoadTime() {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      this.metrics.loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
    }
    return this.metrics.loadTime;
  }

  getMetrics() {
    return {
      ...this.metrics,
      memory: this.getMemoryUsage(),
      loadTime: this.getLoadTime(),
    };
  }
}

// Initialize performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Start FPS monitoring if in development
if (import.meta.env.DEV) {
  performanceMonitor.measureFPS();
}
