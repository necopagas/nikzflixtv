import React, { useEffect } from 'react';

const AdsterraBanner = () => {
  useEffect(() => {
    // Kini nga function maghimo ug mag-inject sa pop-under script
    const loadAdScript = () => {
      // Maghimo ug bag-ong script element
      const script = document.createElement('script');
      
      // I-set ang attributes gikan sa imong Adsterra pop-under code
      script.type = 'text/javascript';
      script.src = '//gainedspotsspun.com/61/b8/02/61b80217fd398dccf27a4a8ef563b396.js';
      
      // Idugang ang script sa document body
      document.body.appendChild(script);

      // Cleanup function: tangtangon ang script kung ma-unmount ang component
      return () => {
        if (script.parentNode === document.body) {
            document.body.removeChild(script);
        }
      };
    };

    loadAdScript();

  }, []); // Ang empty array [] para kausa ra ni modagan inig mount sa component

  // Dili na kinahanglan mag-render ug bisan unsa nga visible
  return null;
};

export default AdsterraBanner;