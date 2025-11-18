import { useEffect } from 'react';

// Simple hook to handle remote control navigation (arrow keys, enter, back)
// onFocus callback receives the currently focused element. The hook attaches
// keydown listeners and translates remote keys into keyboard events.
export default function useRemoteNavigation({ onEnter, onBack } = {}) {
  useEffect(() => {
    function handleKey(e) {
      const code = e.key || e.keyCode;
      // Normalize key values
      if (code === 'ArrowLeft' || code === 37) {
        // Move focus left
        const prev = document.activeElement?.previousElementSibling;
        if (prev && prev.focus) prev.focus();
        e.preventDefault();
      } else if (code === 'ArrowRight' || code === 39) {
        const next = document.activeElement?.nextElementSibling;
        if (next && next.focus) next.focus();
        e.preventDefault();
      } else if (code === 'ArrowUp' || code === 38) {
        // try to move to parent or previous row
        const parent = document.activeElement?.parentElement?.previousElementSibling;
        if (parent && parent.querySelector) {
          const focusable = parent.querySelector('[tabindex],button,a,input,select,textarea');
          if (focusable && focusable.focus) focusable.focus();
        }
        e.preventDefault();
      } else if (code === 'ArrowDown' || code === 40) {
        const parent = document.activeElement?.parentElement?.nextElementSibling;
        if (parent && parent.querySelector) {
          const focusable = parent.querySelector('[tabindex],button,a,input,select,textarea');
          if (focusable && focusable.focus) focusable.focus();
        }
        e.preventDefault();
      } else if (code === 'Enter' || code === 13 || code === 'OK') {
        if (typeof onEnter === 'function') {
          onEnter(document.activeElement);
        } else {
          // trigger click on focused element
          document.activeElement?.click?.();
        }
        e.preventDefault();
      } else if (code === 'Backspace' || code === 'Escape' || code === 8 || code === 27) {
        if (typeof onBack === 'function') onBack();
        e.preventDefault();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onEnter, onBack]);
}
