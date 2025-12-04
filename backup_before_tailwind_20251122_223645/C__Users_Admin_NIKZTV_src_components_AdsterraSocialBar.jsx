// src/components/AdsterraSocialBar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

/**
 * Adsterra Social Bar - Sticky bottom bar
 * Zone: 27867027 (SocialBar_1)
 */
export const AdsterraSocialBar = () => {
  const containerRef = useRef(null);
  const scriptRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isHidden, setIsHidden] = useLocalStorageState('nikz_social_bar_hidden', false);
  const [shouldRender, setShouldRender] = useState(!isHidden);

  useEffect(() => {
    if (isHidden) {
      setShouldRender(false);
      return;
    }

    const timer = window.setTimeout(() => setShouldRender(true), 1200);
    return () => window.clearTimeout(timer);
  }, [isHidden]);

  useEffect(() => {
    if (!shouldRender || isHidden) return;

    const horizontalPadding = window.matchMedia('(max-width: 640px)').matches ? '0.5rem' : '1rem';
    document.documentElement.style.setProperty('--social-bar-spacing', horizontalPadding);
  }, [shouldRender, isHidden]);

  useEffect(() => {
    if (!shouldRender || isHidden || scriptLoaded || !containerRef.current) return;

    const container = containerRef.current;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//gainedspotsspun.com/23/83/40/238340cef35e12605e283ef1a601c2fe.js';
    script.async = true;

    script.onload = () => {
      console.info('[SocialBar] ✓ Loaded');
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.error('[SocialBar] ✗ Failed to load');
      setScriptLoaded(false);
    };

    scriptRef.current = script;
    container.appendChild(script);

    return () => {
      if (scriptRef.current && container?.contains(scriptRef.current)) {
        container.removeChild(scriptRef.current);
      }
      scriptRef.current = null;
    };
  }, [shouldRender, isHidden, scriptLoaded]);

  const handleDismiss = () => {
    setIsHidden(true);
  };

  if (isHidden || !shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-9998"
      id="adsterra-social-bar"
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-1 right-1 z-9999 w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-black/90 rounded-full text-white text-xs transition-all"
        title="Close social bar"
        aria-label="Close ads"
      >
        ✕
      </button>
    </div>
  );
};
