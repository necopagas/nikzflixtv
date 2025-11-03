// src/AdsterraBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function AdsterraBanner() {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user previously dismissed ads
    const dismissed = localStorage.getItem('nikz_ads_hidden');
    if (dismissed === '1') {
      setVisible(false);
      return;
    }

    // Only show on desktop (width >= 768px for better threshold)
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) {
      console.info('[AdsterraBanner] Mobile detected, hiding ads');
      setVisible(false);
      return;
    }

    const currentPath = location?.pathname || '/';
    console.info('[AdsterraBanner] Current path:', currentPath, '| Visible:', visible);
    
    setVisible(true);
  }, [location?.pathname]);

  useEffect(() => {
    if (!visible || scriptsLoaded || !containerRef.current) return;

    const AD_SCRIPTS = [
      'https://gainedspotsspun.com/61/b8/02/61b80217fd398dccf27a4a8ef563b396.js',
      'https://gainedspotsspun.com/23/83/40/238340cef35e12605e283ef1a601c2fe.js'
    ];

    let timeoutId = null;

    const injectScripts = () => {
      if (!containerRef.current) {
        console.warn('[AdsterraBanner] Container not ready');
        return;
      }

      console.info('[AdsterraBanner] Injecting ad scripts...');
      
      AD_SCRIPTS.forEach((src, index) => {
        // Check if script already exists globally
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          console.info('[AdsterraBanner] Script already loaded:', src);
          return;
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.async = true;
        script.setAttribute('data-ad-script', index);
        
        script.onload = () => {
          console.info('[AdsterraBanner] ✓ Loaded:', src);
        };
        
        script.onerror = () => {
          console.error('[AdsterraBanner] ✗ Failed to load:', src);
        };

        // Append to container
        containerRef.current.appendChild(script);
      });

      setScriptsLoaded(true);
      
      // Set global telemetry
      if (typeof window !== 'undefined') {
        window.__nikz_ads_loaded = AD_SCRIPTS;
        window.__nikz_ads_timestamp = new Date().toISOString();
      }
    };

    // Load after 1 second delay
    timeoutId = setTimeout(injectScripts, 1000);

    // Also load on first scroll/click
    const loadOnInteraction = () => {
      clearTimeout(timeoutId);
      injectScripts();
      window.removeEventListener('scroll', loadOnInteraction);
      window.removeEventListener('click', loadOnInteraction);
    };

    window.addEventListener('scroll', loadOnInteraction, { passive: true });
    window.addEventListener('click', loadOnInteraction, { once: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', loadOnInteraction);
      window.removeEventListener('click', loadOnInteraction);
    };
  }, [visible, scriptsLoaded]);

  const handleDismiss = () => {
    localStorage.setItem('nikz_ads_hidden', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
      <div 
        className={`
          bg-gradient-to-br from-gray-900/95 to-gray-800/95 
          backdrop-blur-md rounded-xl shadow-2xl 
          border border-gray-700/50
          transition-all duration-500 ease-out
          ${collapsed ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        `}
        style={{ minWidth: 320, maxWidth: '90vw' }}
      >
        <div className="flex items-start gap-3 p-3">
          {/* Ad Container */}
          <div 
            ref={containerRef} 
            className="flex-1 flex items-center justify-center min-h-[60px] relative"
            id="nikz-ad-container"
          >
            {!scriptsLoaded && (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-8 h-8 border-3 border-gray-600 border-t-red-500 rounded-full animate-spin" />
                <span className="text-xs text-gray-400 animate-pulse">Loading ads...</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="
                w-8 h-8 flex items-center justify-center
                bg-gray-700/50 hover:bg-gray-600/70
                text-gray-300 hover:text-white
                rounded-lg transition-all duration-200
                hover:scale-110 active:scale-95
              "
              title={collapsed ? 'Expand' : 'Collapse'}
              aria-label={collapsed ? 'Expand ads' : 'Collapse ads'}
            >
              <span className="text-sm font-bold">{collapsed ? '▸' : '▾'}</span>
            </button>
            
            <button
              onClick={handleDismiss}
              className="
                w-8 h-8 flex items-center justify-center
                bg-red-600/80 hover:bg-red-600
                text-white
                rounded-lg transition-all duration-200
                hover:scale-110 active:scale-95
              "
              title="Hide ads permanently"
              aria-label="Dismiss ads"
            >
              <span className="text-sm font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-3 pb-2 text-[10px] text-gray-500 font-mono">
            Scripts: {scriptsLoaded ? '✓ Loaded' : '⏳ Loading'} | Path: {location?.pathname}
          </div>
        )}
      </div>
    </div>
  );
}