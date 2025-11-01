// src/AdsterraBanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Improved Adsterra loader: delayed, collapsible, mobile-friendly, and dismissible
export default function AdsterraBanner({ allowedPaths = ['/', '/search', '/drama', '/anime', '/vivamax'] }) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(() => !!localStorage.getItem('nikz_ads_hidden'));
  const location = useLocation();

  useEffect(() => {
    if (hidden) return; // user dismissed ads

    // Only load ads on allowed paths
    if (allowedPaths && Array.isArray(allowedPaths)) {
      const path = location?.pathname || window.location.pathname;
      if (!allowedPaths.includes(path)) return;
    }

    // Avoid loading ads on small screens to reduce intrusion
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile) return;

    let timer = null;
    const scriptEls = [];

    const AD_SCRIPT_URLS = [
      '//gainedspotsspun.com/61/b8/02/61b80217fd398dccf27a4a8ef563b396.js',
      // New script requested by user:
      '//gainedspotsspun.com/23/83/40/238340cef35e12605e283ef1a601c2fe.js'
    ];

    const loadScripts = () => {
      if (loaded || !containerRef.current) return;
      AD_SCRIPT_URLS.forEach((src) => {
        // Avoid duplicate injection
        if (document.querySelector(`script[src="${src}"]`)) return;
        const el = document.createElement('script');
        el.type = 'text/javascript';
        el.src = src;
        el.async = true;
        containerRef.current.appendChild(el);
        scriptEls.push(el);
      });
      setLoaded(true);
      // Telemetry: expose which scripts were loaded and emit console info
      if (typeof window !== 'undefined') {
        window.__nikz_ads_loaded = window.__nikz_ads_loaded || [];
        AD_SCRIPT_URLS.forEach(s => { if (!window.__nikz_ads_loaded.includes(s)) window.__nikz_ads_loaded.push(s); });
        console.info('[AdsterraBanner] loaded ad scripts:', AD_SCRIPT_URLS);
      }
    };

    // Delay loading to let user engage and avoid blocking render
    // Use IntersectionObserver to load when banner is visible (lazy-load)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          clearTimeout(timer);
          loadScripts();
          observer.disconnect();
        }
      });
    }, { root: null, threshold: 0.1 });

    if (containerRef.current) observer.observe(containerRef.current);
    timer = setTimeout(() => { loadScripts(); observer.disconnect(); }, 3000);

    // If user scrolls or interacts, load sooner
    const onUserInteract = () => {
      clearTimeout(timer);
      loadScripts();
      window.removeEventListener('scroll', onUserInteract);
      window.removeEventListener('click', onUserInteract);
    };
    window.addEventListener('scroll', onUserInteract, { passive: true });
    window.addEventListener('click', onUserInteract);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onUserInteract);
      window.removeEventListener('click', onUserInteract);
      if (observer && observer.disconnect) observer.disconnect();
      // Remove any injected script elements
      scriptEls.forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, [hidden, loaded, allowedPaths, location?.pathname]);

  const handleClose = (e) => {
    e.stopPropagation();
    localStorage.setItem('nikz_ads_hidden', '1');
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`transition-all duration-300 ${collapsed ? 'opacity-60 scale-90' : 'opacity-100 scale-100'}`}>
        <div className="bg-transparent rounded-md shadow-lg p-1" style={{ minWidth: 320 }}>
          <div className="flex items-center justify-between gap-2">
            <div ref={containerRef} className="w-full flex items-center justify-center">
              {/* ad script will be injected here */}
              {!loaded && <div className="text-xs text-gray-400">Ad loading…</div>}
            </div>
            <div className="flex flex-col items-center gap-1 ml-2">
              <button aria-label="Collapse ads" title="Collapse" className="bg-black/40 text-white px-2 py-1 rounded text-xs" onClick={() => setCollapsed(c => !c)}>
                {collapsed ? '▸' : '▾'}
              </button>
              <button aria-label="Hide ads" title="Hide ads" className="bg-red-600 text-white px-2 py-1 rounded text-xs" onClick={handleClose}>
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}