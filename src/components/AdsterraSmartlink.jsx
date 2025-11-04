// src/components/AdsterraSmartlink.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Adsterra Smartlink - Inline banner
 * Zone: 27694335 (Smartlink_1)
 */
export const AdsterraSmartlink = ({ className = '' }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | loaded | error

  useEffect(() => {
    if (!containerRef.current || status !== 'loading') return;

    // YOUR ACTUAL ADSTERRA SMARTLINK
  const SMARTLINK_URL = 'https://tearingtastes.com/n0u5f9q4a?key=9c1055e64d70326a468b297e9741a70d';
    
    console.info('[Smartlink] Creating iframe...');

    // Create iframe for smartlink
    const iframe = document.createElement('iframe');
    iframe.src = SMARTLINK_URL;
    iframe.style.cssText = 'width: 100%; min-height: 250px; border: 0; border-radius: 12px; overflow: hidden;';
    iframe.setAttribute('data-aa', 'smartlink');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowtransparency', 'true');
    
    const timeoutId = window.setTimeout(() => {
      console.warn('[Smartlink] Timeout while loading iframe');
      setStatus(prev => (prev === 'loading' ? 'error' : prev));
    }, 8000);

    iframe.onload = () => {
      console.info('[Smartlink] ✓ Loaded');
      window.clearTimeout(timeoutId);
      setStatus('loaded');
    };
    
    iframe.onerror = () => {
      console.error('[Smartlink] ✗ Failed to load');
      window.clearTimeout(timeoutId);
      setStatus('error');
    };

    containerRef.current.appendChild(iframe);

    return () => {
      window.clearTimeout(timeoutId);
      if (containerRef.current?.contains(iframe)) {
        containerRef.current.removeChild(iframe);
      }
    };
  }, [status]);

  if (status === 'error') {
    return null;
  }

  return (
    <div className={`adsterra-smartlink my-8 flex justify-center ${className}`}>
      <div 
        ref={containerRef}
        className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 rounded-lg p-4 border border-gray-700/20 min-h-[250px] flex items-center justify-center"
        id="adsterra-smartlink"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-red-400 animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}></div>
            </div>
            <span className="text-sm text-gray-400 font-medium">Loading ad...</span>
          </div>
        )}
      </div>
    </div>
  );
};
