// src/components/AdSenseAd.jsx
import React, { useEffect, useRef } from 'react';

/**
 * Google AdSense Component
 * Para sa AdSense, i-setup first ang account:
 * 1. Sign up sa https://adsense.google.com
 * 2. Get your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
 * 3. Replace ang CLIENT_ID below
 */
export const AdSenseAd = ({
  slot = 'YOUR_AD_SLOT_ID',
  format = 'auto',
  style = {},
  className = '',
}) => {
  const adRef = useRef(null);
  const CLIENT_ID = 'ca-pub-XXXXXXXXXXXXXXXX'; // Replace with your AdSense ID

  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

/**
 * Usage:
 * <AdSenseAd slot="1234567890" />
 */
