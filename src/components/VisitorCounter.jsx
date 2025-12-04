import React from 'react';
import { useVisitorCount } from '../hooks/useVisitorCount';

export const VisitorCounter = () => {
  const visitorCount = useVisitorCount();

  return (
    <div className="visitor-counter">
      <span className="live-dot"></span>
      <span>{visitorCount} Users Online</span>
    </div>
  );
};
