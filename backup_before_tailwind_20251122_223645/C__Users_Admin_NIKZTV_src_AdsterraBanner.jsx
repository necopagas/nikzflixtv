// src/AdsterraBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from './hooks/useLocalStorageState';

export default function AdsterraBanner() {
  const adContainerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [adStatus, setAdStatus] = useState('loading');
  const [readyToShow, setReadyToShow] = useState(false);
  const [isDismissed, setIsDismissed] = useLocalStorageState('nikz_ads_hidden', false);
  const hasShownBanner = sessionStorage.getItem('nikz_ads_shown') === '1';

  useEffect(() => {
    if (isDismissed || hasShownBanner) {
      setReadyToShow(false);
      return;
    }

    // Show banner only once per session
    setReadyToShow(true);
    sessionStorage.setItem('nikz_ads_shown', '1');
  }, [isDismissed, hasShownBanner]);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    if (isDismissed || !readyToShow || scriptsLoaded || !adContainerRef.current) return;

    const NATIVE_BANNER_CODE = '0b8e16ce5c5d7303bb2755058f2e65b4';
    let timeoutId = null;

    const injectScripts = () => {
      if (!adContainerRef.current) {
        console.warn('[AdsterraBanner] Container not ready');
        setAdStatus('error');
        return;
      }

      console.info('[AdsterraBanner] Injecting native banner...');
      setAdStatus('loading');

      const existing = adContainerRef.current.querySelector(`script[src*="${NATIVE_BANNER_CODE}"]`);

      if (existing) {
        console.info('[AdsterraBanner] Already loaded');
        setScriptsLoaded(true);
        setAdStatus('loaded');
        return;
      }

      const adDiv = document.createElement('div');
      adDiv.id = `container-${NATIVE_BANNER_CODE}`;
      adContainerRef.current.appendChild(adDiv);

      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = `//gainedspotsspun.com/${NATIVE_BANNER_CODE}/invoke.js`;

      script.onload = () => {
        console.info('[AdsterraBanner] ✓ Native banner loaded');
        setScriptsLoaded(true);
        setAdStatus('loaded');
      };

      script.onerror = () => {
        console.error('[AdsterraBanner] ✗ Failed to load');
        setAdStatus('error');
      };

      adContainerRef.current.appendChild(script);

      if (typeof window !== 'undefined') {
        window.__nikz_ads_loaded = [script.src];
        window.__nikz_ads_timestamp = new Date().toISOString();
      }

      // Reduce timeout to 2 seconds, then show fallback if not loaded
      setTimeout(() => {
        if (!scriptsLoaded) {
          console.info('[AdsterraBanner] Timeout reached, showing fallback');
          setAdStatus('error');
        }
      }, 2000);
    };

    timeoutId = window.setTimeout(injectScripts, prefersReducedMotion ? 250 : 500);

    const loadOnInteraction = () => {
      window.clearTimeout(timeoutId);
      injectScripts();
      window.removeEventListener('scroll', loadOnInteraction);
      window.removeEventListener('click', loadOnInteraction);
    };

    window.addEventListener('scroll', loadOnInteraction, { passive: true });
    window.addEventListener('click', loadOnInteraction, { once: true });

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('scroll', loadOnInteraction);
      window.removeEventListener('click', loadOnInteraction);
    };
  }, [isDismissed, readyToShow, scriptsLoaded, prefersReducedMotion]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    wrapperRef.current.dataset.ready = readyToShow && !isDismissed ? '1' : '0';
  }, [readyToShow, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setReadyToShow(false);
  };

  if (isDismissed || !readyToShow || adStatus === 'loading') return null;

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bottom-[env(safe-area-inset-bottom,1.5rem)] pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-live="polite"
      data-banner-ready="true"
    >
      <div
        className={`
          pointer-events-auto backdrop-blur-md rounded-xl shadow-2xl
          border border-gray-700/50
          transition-all duration-500 ease-out
          ${collapsed ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        `}
        style={{
          minWidth: 320,
          maxWidth: '90vw',
          margin: '0 auto',
          background: 'linear-gradient(225deg, rgba(15,23,42,0.95), rgba(15,23,42,0.6))',
          transform: collapsed ? 'translateY(20%) scale(0.95)' : 'translateY(0) scale(1)',
        }}
      >
        <div className="flex items-start gap-3 p-3">
          {/* Ad Container */}
          <div
            ref={adContainerRef}
            className="flex-1 flex items-center justify-center min-h-[90px] relative"
            id="nikz-ad-container"
          >
            {adStatus === 'error' && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <span className="text-xs text-orange-400">⚠️ Ad could not be loaded</span>
                <span className="text-[10px] text-gray-500">
                  Ads are currently unavailable. Please try again later.
                  <br />
                  If you are the site owner, check your Adsterra dashboard.
                </span>
              </div>
            )}
            {adStatus === 'loaded' && !adContainerRef.current?.querySelector('script') && (
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
        {import.meta.env.DEV && (
          <div className="px-3 pb-2 text-[10px] text-gray-500 font-mono border-t border-gray-700/30 pt-2">
            <div className="flex items-center justify-between gap-2">
              <span>
                Status:{' '}
                <span
                  className={`font-bold ${
                    adStatus === 'loaded'
                      ? 'text-green-400'
                      : adStatus === 'loading'
                        ? 'text-yellow-400'
                        : 'text-orange-400'
                  }`}
                >
                  {adStatus}
                </span>
              </span>
              <span>Path: {location?.pathname}</span>
              <span>Scripts: {scriptsLoaded ? '✓' : '⏳'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
