// src/components/AdsterraSocialBar.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Adsterra Social Bar - Sticky bottom bar
 * Zone: 27867027 (SocialBar_1)
 */
export const AdsterraSocialBar = () => {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check if dismissed
    const dismissed = localStorage.getItem('nikz_social_bar_hidden');
    if (dismissed === '1') {
      setVisible(false);
      return;
    }

  if (!containerRef.current || loaded) return;

  const container = containerRef.current;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//gainedspotsspun.com/23/83/40/238340cef35e12605e283ef1a601c2fe.js';
    
    script.onload = () => {
      console.info('[SocialBar] ✓ Loaded');
      setLoaded(true);
    };
    
    script.onerror = () => {
      console.error('[SocialBar] ✗ Failed to load');
    };

    container.appendChild(script);

    return () => {
      if (container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, [loaded]);

  const handleDismiss = () => {
    localStorage.setItem('nikz_social_bar_hidden', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-[9998]"
      id="adsterra-social-bar"
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-1 right-1 z-[9999] w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-black/90 rounded-full text-white text-xs transition-all"
        title="Close social bar"
        aria-label="Close ads"
      >
        ✕
      </button>
    </div>
  );
};
