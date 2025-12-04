import React, { useEffect, useState } from 'react';

// Resilient Ad Banner
// - Dynamically injects the ad provider script
// - Tracks loading / error state
// - Shows a simple fallback after timeout

const AD_SCRIPT_SRC = '//patienthercoldness.com/0b8e16ce5c5d7303bb2755058f2e65b4/invoke.js';
const CONTAINER_ID = 'container-0b8e16ce5c5d7303bb2755058f2e65b4';

export default function AdBanner({ timeout = 8000 }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error' | 'fallback'

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If banner already shown this session, don't show again
    // Commented out for testing/debugging purposes
    /* if (sessionStorage.getItem('adsterra_banner_shown')) {
      setStatus('loaded');
      return;
    } */

    let timer = null;
    let script = null;

    const showFallback = () => {
      if (status === 'loaded') return;
      console.warn('[AdBanner] Timeout or error loading ad. Showing fallback.');
      setStatus('fallback');
      try {
        sessionStorage.setItem('adsterra_banner_shown', '1');
      } catch (err) {
        // sessionStorage might be unavailable in some environments
        console.warn('Unable to set sessionStorage flag for ad banner', err);
      }
    };

    // Create script and container. Many native ad providers expect the script
    // to be adjacent to the provider container (script then container).
    try {
      script = document.createElement('script');
      script.src = AD_SCRIPT_SRC;
      script.async = true;
      script.type = 'text/javascript';
      script.setAttribute('data-cfasync', 'false');

      // Find the container rendered by React
      const container = document.getElementById(CONTAINER_ID);

      if (container) {
        // Clear container just in case
        container.innerHTML = '';
        // Append script INSIDE the container
        container.appendChild(script);
      } else {
        // Fallback if React hasn't mounted it yet (unlikely)
        document.body.appendChild(script);
      }

      script.onload = () => {
        console.log('[AdBanner] Script loaded successfully');
        setStatus('loaded');
        try {
          sessionStorage.setItem('adsterra_banner_shown', '1');
        } catch (err) {
          console.warn('Unable to set sessionStorage flag for ad banner', err);
        }
        if (timer) clearTimeout(timer);
      };

      script.onerror = e => {
        console.error('[AdBanner] Script load error:', e);
        setStatus('error');
        showFallback();
      };
    } catch (err) {
      setStatus('error');
      console.warn('Error injecting ad script', err);
      showFallback();
    }

    // Timeout to show fallback if provider doesn't load in time
    timer = setTimeout(() => {
      if (status !== 'loaded') showFallback();
    }, timeout);

    return () => {
      if (timer) clearTimeout(timer);
      if (script && script.parentNode) script.parentNode.removeChild(script);
      // We don't remove the container because React manages it
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ad-banner-wrapper p-4 flex flex-col items-center justify-center min-h-[100px]">
      {/* The Container for the Ad - Always rendered so script can find it */}
      <div id={CONTAINER_ID} className="w-full flex justify-center" />

      {status === 'loading' && (
        <div className="ad-loading flex flex-col items-center gap-2 my-2">
          <div className="w-8 h-8 border-2 border-t-red-500 rounded-full animate-spin" />
          <div className="text-xs text-gray-400">Loading ad...</div>
        </div>
      )}

      {status === 'fallback' && (
        <div className="ad-fallback w-full max-w-xs bg-gray-800 rounded-lg p-4 text-center mt-2">
          <div className="text-sm text-white font-semibold mb-2">Sponsored</div>
          <div className="text-xs text-gray-400 mb-3">Support NikzFlix — check this out.</div>
          <a
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            href="/promo"
          >
            View Promo
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className="ad-error text-xs text-red-400 mt-2">Unable to load ad provider</div>
      )}
    </div>
  );
}
