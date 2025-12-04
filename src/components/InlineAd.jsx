// src/components/InlineAd.jsx
import React from 'react';

/**
 * Multi-purpose Inline Ad Component
 * Supports: Adsterra, PropellerAds, Google AdSense
 */
export const InlineAd = ({ type = 'adsterra', position = 'center' }) => {
  const positionClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  };

  return (
    <div className={`inline-ad-wrapper my-8 ${positionClass[position]} max-w-[300px]`}>
      <div className="bg-linear-to-br from-gray-900/50 to-gray-800/50 rounded-lg p-4 border border-gray-700/30">
        <div className="text-[10px] text-gray-500 text-center mb-2">Advertisement</div>

        {type === 'adsterra' && (
          <div className="min-h-[250px] flex items-center justify-center bg-gray-800/30 rounded relative overflow-hidden">
            {/* Adsterra code will go here */}
            <div className="text-center p-4 z-10">
              <div className="text-xs text-gray-400 mb-2">Sponsored Content</div>
              <div className="text-[10px] text-gray-600">Adsterra Banner Loading...</div>
            </div>
            {/* 
               TODO: Replace this with your actual Adsterra Native Banner code.
               Example:
               <div id="container-YOUR-ID"></div>
               <script ...></script>
            */}
            <iframe
              src="https://tearingtastes.com/n0u5f9q4a?key=9c1055e64d70326a468b297e9741a70d"
              className="absolute inset-0 w-full h-full opacity-50 pointer-events-none"
              title="Ad Placeholder"
            />
          </div>
        )}

        {type === 'placeholder' && (
          <div className="h-[250px] flex items-center justify-center bg-linear-to-br from-red-900/20 to-purple-900/20 rounded border border-red-500/20">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">💰</div>
              <div className="text-sm text-gray-300 font-semibold mb-1">Ad Space Available</div>
              <div className="text-xs text-gray-500">300 x 250</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Usage Examples:
 *
 * <InlineAd type="adsterra" position="center" />
 * <InlineAd type="placeholder" position="left" />
 */
