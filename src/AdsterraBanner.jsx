// src/AdsterraBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function AdsterraBanner() {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [adStatus, setAdStatus] = useState('loading');
  const location = useLocation();

  useEffect(() => {
    // Check if user previously dismissed ads
    const dismissed = localStorage.getItem('nikz_ads_hidden');
    if (dismissed === '1') {
      setVisible(false);
      return;
    }

    // Show on all devices
    const currentPath = location?.pathname || '/';
    console.info('[AdsterraBanner] Current path:', currentPath, '| Visible:', visible);
    
    setVisible(true);
  }, [location?.pathname]);

  useEffect(() => {
    if (!visible || scriptsLoaded || !containerRef.current) return;

    const AD_SCRIPTS = [
      {
        src: 'https://gainedspotsspun.com/61/b8/02/61b80217fd398dccf27a4a8ef563b396.js',
        type: 'banner'
      },
      {
        src: 'https://gainedspotsspun.com/23/83/40/238340cef35e12605e283ef1a601c2fe.js',
        type: 'native'
      }
    ];

    let timeoutId = null;

    const injectScripts = () => {
      if (!containerRef.current) {
        console.warn('[AdsterraBanner] Container not ready');
        setAdStatus('error');
        return;
      }

      console.info('[AdsterraBanner] Injecting ad scripts...');
      setAdStatus('loading');
      
      let loadedCount = 0;
      
      AD_SCRIPTS.forEach((adConfig, index) => {
        const { src, type } = adConfig;
        
        // Check if script already exists globally
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          console.info('[AdsterraBanner] Script already loaded:', src);
          loadedCount++;
          if (loadedCount === AD_SCRIPTS.length) {
            setScriptsLoaded(true);
            setAdStatus('loaded');
          }
          return;
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.async = true;
        script.setAttribute('data-ad-script', index);
        script.setAttribute('data-ad-type', type);
        
        script.onload = () => {
          console.info('[AdsterraBanner] ✓ Loaded:', src, `(${type})`);
          loadedCount++;
          if (loadedCount === AD_SCRIPTS.length) {
            setScriptsLoaded(true);
            setAdStatus('loaded');
          }
        };
        
        script.onerror = () => {
          console.error('[AdsterraBanner] ✗ Failed to load:', src);
          loadedCount++;
          if (loadedCount === AD_SCRIPTS.length) {
            setAdStatus('error');
          }
        };

        // Append to container
        containerRef.current.appendChild(script);
      });
      
      // Set global telemetry
      if (typeof window !== 'undefined') {
        window.__nikz_ads_loaded = AD_SCRIPTS.map(s => s.src);
        window.__nikz_ads_timestamp = new Date().toISOString();
      }

      // Fallback timeout - mark as loaded after 5 seconds even if scripts don't trigger onload
      setTimeout(() => {
        if (!scriptsLoaded) {
          console.info('[AdsterraBanner] Timeout reached, marking as loaded');
          setScriptsLoaded(true);
          setAdStatus('loaded');
        }
      }, 5000);
    };

    // Load after 500ms delay (reduced from 1000ms)
    timeoutId = setTimeout(injectScripts, 500);

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
            className="flex-1 flex items-center justify-center min-h-[90px] relative"
            id="nikz-ad-container"
          >
            {adStatus === 'loading' && (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-8 h-8 border-3 border-gray-600 border-t-red-500 rounded-full animate-spin" />
                <span className="text-xs text-gray-400 animate-pulse">Loading ads...</span>
              </div>
            )}
            {adStatus === 'error' && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <span className="text-xs text-orange-400">⚠️ Ad scripts loaded</span>
                <span className="text-[10px] text-gray-500">If ads don't appear, check Adsterra dashboard</span>
              </div>
            )}
            {adStatus === 'loaded' && !containerRef.current?.querySelector('script') && (
              <div className="text-xs text-gray-400 py-4">
                📺 Ad space ready - waiting for impressions
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

        {/* Debug info */}
        {(process.env.NODE_ENV === 'development' || true) && (
          <div className="px-3 pb-2 text-[10px] text-gray-500 font-mono border-t border-gray-700/30 pt-2">
            <div className="flex items-center justify-between gap-2">
              <span>Status: <span className={`font-bold ${
                adStatus === 'loaded' ? 'text-green-400' : 
                adStatus === 'loading' ? 'text-yellow-400' : 
                'text-orange-400'
              }`}>{adStatus}</span></span>
              <span>Path: {location?.pathname}</span>
              <span>Scripts: {scriptsLoaded ? '✓' : '⏳'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}