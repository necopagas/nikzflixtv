import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-[--bg-primary] to-[--bg-secondary]">
      <div className="text-center max-w-lg">
        {/* 404 Icon */}
        <div className="mb-6">
          <div className="text-8xl font-bold text-[--brand-color] mb-4">404</div>
          <div className="w-24 h-1 bg-gradient-to-r from-[--brand-color] to-transparent mx-auto"></div>
        </div>

        {/* Message */}
        <h1 className="text-3xl sm:text-4xl font-bold text-[--text-primary] mb-3">
          Page Not Found
        </h1>
        <p className="text-lg text-[--text-secondary] mb-8">
          Sorry, the page you're looking for doesn't exist or has been removed. Let's get you back to watching!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[--brand-color] hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            <FaHome className="text-lg" />
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[--bg-tertiary] hover:bg-[--bg-secondary] text-[--text-primary] font-semibold rounded-lg border border-[--border-color] transition-colors duration-200"
          >
            <FaArrowLeft className="text-lg" />
            Go Back
          </button>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-[--border-color]">
          <p className="text-sm text-[--text-secondary] mb-4">You might want to check:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/anime')}
              className="p-3 bg-[--bg-tertiary] hover:bg-[--bg-secondary] rounded-lg text-[--text-primary] font-medium transition-colors duration-200"
            >
              Anime
            </button>
            <button
              onClick={() => navigate('/drama')}
              className="p-3 bg-[--bg-tertiary] hover:bg-[--bg-secondary] rounded-lg text-[--text-primary] font-medium transition-colors duration-200"
            >
              Drama
            </button>
            <button
              onClick={() => navigate('/search')}
              className="p-3 bg-[--bg-tertiary] hover:bg-[--bg-secondary] rounded-lg text-[--text-primary] font-medium transition-colors duration-200"
            >
              Search
            </button>
            <button
              onClick={() => navigate('/my-list')}
              className="p-3 bg-[--bg-tertiary] hover:bg-[--bg-secondary] rounded-lg text-[--text-primary] font-medium transition-colors duration-200"
            >
              My List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
