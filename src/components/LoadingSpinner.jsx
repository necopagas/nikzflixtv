// src/components/LoadingSpinner.jsx
import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin"></div>
      </div>
    </div>
  );
};

export const FullPageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-[9999]">
      <LoadingSpinner size="xl" />
      <p className="mt-6 text-xl text-white font-semibold animate-pulse">{message}</p>
    </div>
  );
};

export const ContentLoader = ({ message = 'Loading content...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg text-gray-400">{message}</p>
    </div>
  );
};
