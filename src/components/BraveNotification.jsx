// src/components/BraveNotification.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaShieldAlt } from 'react-icons/fa';

export const BraveNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed the notification
    const dismissed = localStorage.getItem('nikz_brave_notification_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Check if user is already using Brave browser
    const isBrave = navigator.brave && navigator.brave.isBrave;
    if (isBrave) {
      setIsDismissed(true);
      return;
    }

    // Show notification after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('nikz_brave_notification_dismissed', '1');
    setIsDismissed(true);
  };

  const handleDownload = () => {
    window.open('https://brave.com/download/', '_blank');
    handleDismiss();
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm animate-slide-in-right">
      <div className="bg-linear-to-br from-orange-600 to-orange-800 text-white rounded-xl shadow-2xl p-5 border-2 border-orange-400">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4 pr-6">
          <div className="shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <FaShieldAlt className="text-2xl text-orange-200" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">🦁 Dili ka gusto sa Ads?</h3>
            <p className="text-sm text-orange-100 mb-4 leading-relaxed">
              Gamita ang <strong>Brave Browser</strong> para ma-block ang tanan nga ads! Faster,
              secure, ug walay distractions. 🚀🛡️
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 bg-white text-orange-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-50 transition-colors shadow-md"
              >
                Download Brave
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
