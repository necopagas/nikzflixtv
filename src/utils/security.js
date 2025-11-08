// src/utils/security.js
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHTML = dirty => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

/**
 * Sanitize user input for search queries
 */
export const sanitizeInput = input => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .slice(0, 200); // Limit length
};

/**
 * Rate limiter class for API calls
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key) {
    this.requests.delete(key);
  }
}

/**
 * Content Security Policy meta tag generator
 */
export const generateCSPMeta = () => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://gainedspotsspun.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.themoviedb.org https://api.consumet.org https://*.firebase.com wss://*.firebase.com",
    "media-src 'self' https: http: blob:",
    "frame-src 'self' https://www.youtube.com",
  ].join('; ');

  return csp;
};

/**
 * Validate URL before using it
 */
export const isValidURL = string => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Secure localStorage wrapper
 */
export const secureStorage = {
  set: (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage error:', error);
      return defaultValue;
    }
  },

  remove: key => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },
};
