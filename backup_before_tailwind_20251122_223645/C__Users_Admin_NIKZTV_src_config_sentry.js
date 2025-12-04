// src/config/sentry.js
import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

export const initSentry = () => {
  // Only initialize in production
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '', // Add your Sentry DSN here
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        Sentry.reactRouterV6BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Filter out specific errors
      beforeSend(event, hint) {
        // Don't send console errors in development
        if (event.level === 'log') {
          return null;
        }

        // Filter out known browser extension errors
        const error = hint.originalException;
        if (error && error.message) {
          if (
            error.message.includes('ResizeObserver') ||
            error.message.includes('chrome-extension://') ||
            error.message.includes('moz-extension://')
          ) {
            return null;
          }
        }

        return event;
      },
    });
  }
};

export { Sentry };
