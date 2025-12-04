import React from 'react';

export const PageTransitionIndicator = ({ isActive }) => {
  return (
    <div className={`page-transition-root ${isActive ? 'visible' : ''}`} aria-hidden="true">
      <div className={`page-transition-bar ${isActive ? 'animate' : ''}`} />
    </div>
  );
};
