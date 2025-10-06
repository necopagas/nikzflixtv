import React, { useEffect } from 'react';

const AdsterraBanner = () => {
  useEffect(() => {
    // This function creates and injects the script tag
    const loadAdScript = () => {
      // Create a new script element
      const script = document.createElement('script');
      
      // Set the attributes from your Adsterra code
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      // Ang imong bag-o nga script URL
      script.src = "//gainedspotsspun.com/0b8e16ce5c5d7303bb2755058f2e65b4/invoke.js";
      
      // Find the container div to append the script to, to be safe
      const container = document.getElementById('container-0b8e16ce5c5d7303bb2755058f2e65b4');

      // Add the script to the body or container
      if (container) {
          document.body.appendChild(script);
      }

      // This is for cleanup. It removes the script if the component is unmounted.
      return () => {
        // Check if the script is still in the body before trying to remove it
        if (script.parentNode === document.body) {
            document.body.removeChild(script);
        }
      };
    };

    // A small delay can sometimes help ensure the container div is ready
    const timer = setTimeout(() => {
        loadAdScript();
    }, 100);

    return () => clearTimeout(timer);

  }, []); // The empty array [] ensures this script runs only once when the component mounts

  return (
    <div className="flex justify-center my-8">
      {/* Ang imong bag-o nga container ID */}
      <div id="container-0b8e16ce5c5d7303bb2755058f2e65b4"></div>
    </div>
  );
};

export default AdsterraBanner;

