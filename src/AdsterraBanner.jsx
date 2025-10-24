// src/AdsterraBanner.jsx
import { useEffect } from 'react';

export default function AdsterraBanner() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//gainedspotsspun.com/61/b8/02/61b80217fd398dccf27a4a8ef563b396.js';
    script.async = true; // Gidugang ni
    
    document.body.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
  return null;
}