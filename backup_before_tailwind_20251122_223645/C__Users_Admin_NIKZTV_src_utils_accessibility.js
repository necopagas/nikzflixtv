// src/utils/accessibility.js

/**
 * Focus management utilities for better keyboard navigation
 */

export class FocusTrap {
  constructor(element) {
    this.element = element;
    this.focusableElements = null;
    this.firstFocusable = null;
    this.lastFocusable = null;
  }

  activate() {
    this.focusableElements = this.element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];

    this.element.addEventListener('keydown', this.handleKeyDown);
    this.firstFocusable?.focus();
  }

  deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = e => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * Announce messages to screen readers
 */
export const announce = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Skip to main content helper
 */
export const skipToMain = () => {
  const main = document.querySelector('main') || document.querySelector('[role="main"]');
  if (main) {
    main.setAttribute('tabindex', '-1');
    main.focus();
    main.removeAttribute('tabindex');
  }
};

/**
 * Check if reduced motion is preferred
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * High contrast mode detection
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Generate accessible label for media items
 */
export const generateMediaLabel = item => {
  const title = item.title || item.name || 'Untitled';
  const rating = item.vote_average ? `Rating ${item.vote_average} out of 10` : '';
  const year = item.release_date || item.first_air_date;
  const yearText = year ? `Released in ${year.split('-')[0]}` : '';

  return `${title}. ${rating}. ${yearText}`.trim();
};

/**
 * Keyboard shortcut manager
 */
export class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
  }

  register(key, callback, description) {
    this.shortcuts.set(key.toLowerCase(), { callback, description });
  }

  unregister(key) {
    this.shortcuts.delete(key.toLowerCase());
  }

  handle(event) {
    const key = event.key.toLowerCase();
    const shortcut = this.shortcuts.get(key);

    if (shortcut && !this.isInputFocused()) {
      event.preventDefault();
      shortcut.callback(event);
    }
  }

  isInputFocused() {
    const active = document.activeElement;
    return (
      active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable
    );
  }

  getShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({
      key,
      description,
    }));
  }
}
