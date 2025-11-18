import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Progressive Image Component with Blur-up Effect
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur-up effect for smooth loading
 * - Low-quality placeholder
 * - Error handling with fallback
 * - Fade-in animation
 */
export const ProgressiveImage = ({
  src,
  alt = '',
  className = '',
  placeholderSrc = null,
  onLoad = null,
  onError = null,
  fallbackSrc = '/placeholder.png',
  threshold = 0.01,
  rootMargin = '50px',
}) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  useEffect(() => {
    if (!inView) return;

    const img = new Image();

    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setImgSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
      if (onError) onError();
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [inView, src, fallbackSrc, onLoad, onError]);

  return (
    <div ref={ref} className="relative overflow-hidden">
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        className={`${className} transition-all duration-500 ease-in-out ${
          isLoading ? 'blur-sm scale-105 opacity-50' : 'blur-0 scale-100 opacity-100'
        } ${hasError ? 'opacity-50' : ''}`}
        loading="lazy"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton Loading Component
 * Use while content is loading
 */
export const Skeleton = ({
  width = '100%',
  height = '200px',
  borderRadius = '8px',
  className = '',
}) => {
  return (
    <div
      className={`bg-linear-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse ${className}`}
      style={{ width, height, borderRadius }}
    >
      <div className="w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
    </div>
  );
};

/**
 * Card Skeleton for Poster Loading
 */
export const PosterSkeleton = ({ count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`space-y-2 ${className}`}>
          <Skeleton height="300px" borderRadius="12px" />
          <Skeleton height="20px" width="80%" borderRadius="4px" />
          <Skeleton height="16px" width="60%" borderRadius="4px" />
        </div>
      ))}
    </>
  );
};

/**
 * Row Skeleton for Loading States
 */
export const RowSkeleton = ({ posterCount = 6 }) => {
  return (
    <div className="mb-8">
      <Skeleton height="30px" width="200px" className="mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <PosterSkeleton count={posterCount} />
      </div>
    </div>
  );
};

/**
 * Banner Skeleton for Hero Section
 */
export const BannerSkeleton = () => {
  return (
    <div className="relative w-full h-[500px] md:h-[600px] bg-gray-900">
      <Skeleton height="100%" width="100%" borderRadius="0" />
      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
        <Skeleton height="48px" width="60%" />
        <Skeleton height="24px" width="80%" />
        <Skeleton height="24px" width="70%" />
        <div className="flex gap-4 mt-6">
          <Skeleton height="48px" width="150px" borderRadius="8px" />
          <Skeleton height="48px" width="150px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
};

/**
 * Modal Content Skeleton
 */
export const ModalSkeleton = () => {
  return (
    <div className="space-y-4 p-6">
      <Skeleton height="400px" width="100%" borderRadius="12px" />
      <Skeleton height="36px" width="70%" />
      <Skeleton height="20px" width="100%" />
      <Skeleton height="20px" width="90%" />
      <Skeleton height="20px" width="95%" />
      <div className="flex gap-4 mt-6">
        <Skeleton height="48px" width="120px" borderRadius="8px" />
        <Skeleton height="48px" width="120px" borderRadius="8px" />
        <Skeleton height="48px" width="48px" borderRadius="8px" />
      </div>
    </div>
  );
};

/**
 * Optimized Poster Component with Progressive Loading
 */
export const OptimizedPoster = ({
  item,
  onClick,
  isWatched,
  isLarge = false,
  showTitle = true,
}) => {
  const imageUrl =
    item.backdrop_path || item.poster_path
      ? `https://image.tmdb.org/t/p/${isLarge ? 'w500' : 'w300'}${item.backdrop_path || item.poster_path}`
      : '/placeholder.png';

  // Generate low-quality placeholder (you can implement this server-side)
  const placeholderUrl =
    item.backdrop_path || item.poster_path
      ? `https://image.tmdb.org/t/p/w92${item.backdrop_path || item.poster_path}`
      : '/placeholder.png';

  return (
    <div
      className="relative cursor-pointer group transform transition-all duration-300 hover:scale-105 hover:z-10"
      onClick={() => onClick && onClick(item)}
    >
      <ProgressiveImage
        src={imageUrl}
        placeholderSrc={placeholderUrl}
        alt={item.title || item.name || 'Poster'}
        className="w-full h-auto rounded-lg shadow-lg"
        fallbackSrc="/placeholder.png"
      />

      {isWatched && isWatched(item.id) && (
        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
          ✓ Watched
        </div>
      )}

      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="text-white font-semibold text-sm line-clamp-2">
            {item.title || item.name}
          </h3>
          {item.vote_average && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white text-xs">{item.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Utility function for shimmer animation CSS injection
// eslint-disable-next-line react-refresh/only-export-components
export const injectShimmerCSS = () => {
  if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
    const style = document.createElement('style');
    style.id = 'shimmer-styles';
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-shimmer {
        animation: shimmer 2s infinite;
      }
    `;
    document.head.appendChild(style);
  }
};

// Call this in your App.jsx or main entry point
if (typeof window !== 'undefined') {
  injectShimmerCSS();
}
