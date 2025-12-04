import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

/*
  Minimal, single-copy ProgressiveImage component.
  - default export: ProgressiveImage
  - named exports: OptimizedPoster, injectShimmerCSS
*/

const ProgressiveImage = ({
  src,
  alt = '',
  className = '',
  placeholderSrc = null,
  fallbackSrc = '/placeholder.png',
  onLoad = null,
  onError = null,
  threshold = 0.01,
  rootMargin = '50px',
  imgProps = {},
}) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || fallbackSrc);
  const [isLoading, setIsLoading] = useState(Boolean(placeholderSrc));
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  const { ref, inView } = useInView({ threshold, rootMargin, triggerOnce: true });

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
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`block w-full h-auto transition-all duration-500 ease-in-out ${
          isLoading ? 'blur-sm scale-105 opacity-50' : 'blur-0 scale-100 opacity-100'
        } ${hasError ? 'opacity-50' : ''}`}
        {...imgProps}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

/* Minimal skeleton helpers (kept small to avoid duplication and build issues) */
export const Skeleton = ({ width = '100%', height = '200px', className = '' }) => (
  <div className={`bg-gray-800/30 animate-pulse ${className}`} style={{ width, height }} />
);

export const PosterSkeleton = ({ count = 1, className = '' }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`space-y-2 ${className}`}>
        <Skeleton height="300px" />
        <Skeleton height="20px" width="80%" />
      </div>
    ))}
  </>
);

export const RowSkeleton = ({ posterCount = 6 }) => (
  <div className="mb-8">
    <Skeleton height="30px" width="200px" className="mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <PosterSkeleton count={posterCount} />
    </div>
  </div>
);

export const BannerSkeleton = () => (
  <div className="relative w-full h-64 bg-gray-900">
    <Skeleton height="100%" width="100%" />
  </div>
);

export const ModalSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton height="400px" width="100%" />
  </div>
);

export const OptimizedPoster = ({
  item,
  onClick,
  isWatched,
  isLarge = false,
  showTitle = true,
}) => {
  const imageUrl =
    item?.backdrop_path || item?.poster_path
      ? `https://image.tmdb.org/t/p/${isLarge ? 'w500' : 'w300'}${item.backdrop_path || item.poster_path}`
      : '/placeholder.png';

  const placeholderUrl =
    item?.backdrop_path || item?.poster_path
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
        alt={item?.title || item?.name || 'Poster'}
        className="w-full h-auto rounded-lg shadow-lg"
        fallbackSrc="/placeholder.png"
      />

      {isWatched && isWatched(item?.id) && (
        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
          ✓ Watched
        </div>
      )}

      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="text-white font-semibold text-sm line-clamp-2">
            {item?.title || item?.name}
          </h3>
          {item?.vote_average != null && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white text-xs">{Number(item.vote_average).toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// helper shipped from `progressiveImageHelpers.jsx` (keeps this file exporting only components)

export default ProgressiveImage;
