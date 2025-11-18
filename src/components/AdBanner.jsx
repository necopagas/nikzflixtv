import React, { useEffect, useState } from 'react';

// Resilient Ad Banner
// - Dynamically injects the ad provider script
// - Tracks loading / error state
// - Shows a simple fallback after timeout

const AD_SCRIPT_SRC = '//patienthercoldness.com/0b8e16ce5c5d7303bb2755058f2e65b4/invoke.js';
const CONTAINER_ID = 'container-0b8e16ce5c5d7303bb2755058f2e65b4';

export default function AdBanner({ timeout = 4000 }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error' | 'fallback'

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If banner already shown this session, don't show again
    if (sessionStorage.getItem('adsterra_banner_shown')) {
      setStatus('loaded');
      return;
    }

    let timer = null;
    let script = null;

    const showFallback = () => {
      if (status === 'loaded') return;
      setStatus('fallback');
      try {
        sessionStorage.setItem('adsterra_banner_shown', '1');
      } catch (err) {
        // sessionStorage might be unavailable in some environments
        console.warn('Unable to set sessionStorage flag for ad banner', err);
      }
    };

    // Create script and container. Many native ad providers expect the script
    // to be adjacent to the provider container (script then container), so
    // we create the script first and then insert the container right after it.
    try {
      script = document.createElement('script');
      script.src = AD_SCRIPT_SRC;
      script.async = true;
      script.type = 'text/javascript';
      script.setAttribute('data-cfasync', 'false');

      // If container already exists, try to place script before it. Otherwise
      // append the script to body and create the container after the script.
      const existingContainer = document.getElementById(CONTAINER_ID);
      if (existingContainer && existingContainer.parentNode) {
        existingContainer.parentNode.insertBefore(script, existingContainer);
      } else {
        document.body.appendChild(script);
        // Create container after script so the script is immediately before it
        let containerAfter = document.getElementById(CONTAINER_ID);
        if (!containerAfter) {
          containerAfter = document.createElement('div');
          containerAfter.id = CONTAINER_ID;
          script.insertAdjacentElement('afterend', containerAfter);
        }
      }

      script.onload = () => {
        setStatus('loaded');
        try {
          sessionStorage.setItem('adsterra_banner_shown', '1');
        } catch (err) {
          console.warn('Unable to set sessionStorage flag for ad banner', err);
        }
        if (timer) clearTimeout(timer);
      };

      script.onerror = () => {
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
      // keep the container (provider may have injected children); do not aggressively remove
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render inline fallback UI while ad loads or if it fails.
  // We intentionally keep the actual provider script out of React's render tree
  // because some providers expect a particular DOM placement.
  if (status === 'loaded') return null;

  return (
    <div className="ad-banner-wrapper p-4 flex items-center justify-center">
      {status === 'loading' && (
        <div className="ad-loading flex flex-col items-center gap-2">
          <div className="w-12 h-12 border-4 border-t-(--brand-color) rounded-full animate-spin" />
          <div className="text-sm text-(--text-secondary)">Loading ad…</div>
        </div>
      )}

      {status === 'fallback' && (
        <div className="ad-fallback w-full max-w-xs bg-(--bg-tertiary) rounded-lg p-4 text-center">
          <div className="text-sm text-(--text-primary) font-semibold mb-2">Sponsored</div>
          <div className="text-xs text-(--text-secondary) mb-3">
            Support NikzFlix — check this out.
          </div>
          <a
            className="inline-block px-4 py-2 bg-(--brand-color) text-white rounded-md"
            href="/promo"
            onClick={() => {
              try {
                sessionStorage.setItem('adsterra_banner_shown', '1');
              } catch (err) {
                console.warn('Unable to set sessionStorage flag for ad banner', err);
              }
            }}
          >
            View Promo
          </a>
        </div>
      )}

      {status === 'error' && <div className="ad-error text-xs text-red-400">Failed to load ad</div>}
    </div>
  );
}
