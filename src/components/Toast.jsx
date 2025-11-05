// src/components/Toast.jsx
import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  const icons = {
    success: <FaCheckCircle className="text-green-500" />,
    error: <FaExclamationCircle className="text-red-500" />,
    info: <FaInfoCircle className="text-blue-500" />,
  };

  const backgrounds = {
    success: 'bg-green-500/10 border-green-500/50',
    error: 'bg-red-500/10 border-red-500/50',
    info: 'bg-blue-500/10 border-blue-500/50',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[10000] animate-slide-in">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl backdrop-blur-xl border ${backgrounds[type]} shadow-2xl max-w-md`}>
        <div className="text-2xl flex-shrink-0">
          {icons[type]}
        </div>
        <p className="text-white font-medium flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default Toast;
