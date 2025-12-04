import React from 'react';
import { FiWifiOff, FiWifi } from 'react-icons/fi';

const STATUS_CONFIG = {
  offline: {
    icon: <FiWifiOff />,
    message: 'You are offline. Some features may be unavailable.',
  },
  online: {
    icon: <FiWifi />,
    message: 'Connection restored.',
  },
};

export const NetworkStatusBanner = ({ status = null }) => {
  if (!status) {
    return null;
  }

  const { icon, message } = STATUS_CONFIG[status];

  return (
    <div className={`network-status-banner visible ${status}`} role="status" aria-live="assertive">
      <div className={`network-status-chip ${status}`}>
        <span className="network-status-icon">{icon}</span>
        <span className="network-status-text">{message}</span>
      </div>
    </div>
  );
};
