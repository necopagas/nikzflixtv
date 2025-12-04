// src/components/AdsterraSmartlink.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Adsterra Smartlink - Inline banner
 * Zone: 27694335 (Smartlink_1)
 */
export const AdsterraSmartlink = ({ className = '' }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | loaded | error
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !shouldLoad || status !== 'idle') return;

    const SMARTLINK_URL =
      'https://tearingtastes.com/n0u5f9q4a?key=9c1055e64d70326a468b297e9741a70d';
    const container = containerRef.current;
    const iframe = document.createElement('iframe');

    iframe.src = SMARTLINK_URL;
    iframe.style.cssText =
      'width: 100%; min-height: 250px; border: 0; border-radius: 16px; overflow: hidden; background: transparent;';
    iframe.setAttribute('data-aa', 'smartlink');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowtransparency', 'true');

    let timeoutId = null;

    const handleLoaded = () => {
      window.clearTimeout(timeoutId);
      setStatus('loaded');
    };

    const handleError = () => {
      window.clearTimeout(timeoutId);
      setStatus('error');
    };

    iframe.onload = handleLoaded;
    iframe.onerror = handleError;

    timeoutId = window.setTimeout(() => {
      if (status === 'loading') {
        console.warn('[Smartlink] Timeout while loading iframe');
        setStatus('error');
      }
    }, 8000);

    container.appendChild(iframe);
    setStatus('loading');

    return () => {
      window.clearTimeout(timeoutId);
      iframe.onload = null;
      iframe.onerror = null;
      if (container.contains(iframe)) {
        container.removeChild(iframe);
      }
    };
  }, [shouldLoad, status]);

  useEffect(() => {
    if (!containerRef.current || status === 'loading' || status === 'loaded') return undefined;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [status]);

  if (status === 'error') {
    return null;
  }

  return (
    <div className={`adsterra-smartlink my-8 flex justify-center ${className}`}>
      <div
        ref={containerRef}
        className="bg-linear-to-br from-gray-900/30 to-gray-800/30 rounded-2xl p-4 border border-gray-700/20 min-h-[260px] flex items-center justify-center"
        id="adsterra-smartlink"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
              <div
                className="absolute inset-2 rounded-full border-4 border-transparent border-t-red-400 animate-spin"
                style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}
              ></div>
            </div>
            <span className="text-sm text-gray-400 font-medium">Loading ad...</span>
          </div>
        )}
      </div>
    </div>
  );
};
