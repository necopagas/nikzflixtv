// src/AdsterraBanner.jsx
import { useEffect } from 'react';

export default function AdsterraBanner() {
  useEffect(() => {
    const script = document.createElement('script');
    // --- SIGURADUHA NGA KINI NGA URL KAY SAKTO GIKAN SA IMONG ADSTERRA ACCOUNT ---
    script.src = '//gainedspotsspun.com/61/b8/02/61b80217fd398dccf27a4a8ef563b396.js';
    script.async = true; 
    
    // I-append sa body para mo-load
    document.body.appendChild(script);
    
    // Cleanup function: Tanggalon ang script kung ma-unmount ang component
    return () => {
      // Pangitaon nato ang script nga ato gidugang
      const addedScript = document.querySelector(`script[src="${script.src}"]`);
      if (addedScript && addedScript.parentNode) {
        addedScript.parentNode.removeChild(addedScript);
      }
    };
  }, []); // Empty dependency array para modagan kausa ra
  
  // Kini nga component kay walay visual output, script loader ra siya
  return null; 
}