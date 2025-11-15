import { useCallback, useEffect, useState } from 'react';

const isBrowser = typeof window !== 'undefined';

const safeParse = value => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    if (!isBrowser) {
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }

    const stored = window.localStorage.getItem(key);
    if (stored !== null) {
      return safeParse(stored);
    }

    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  });

  useEffect(() => {
    if (!isBrowser) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`[useLocalStorageState] failed to save ${key}:`, error);
    }
  }, [key, state]);

  const setLocalStorageState = useCallback(
    value => {
      setState(prev => {
        const next = typeof value === 'function' ? value(prev) : value;
        return next;
      });
    },
    [setState]
  );

  return [state, setLocalStorageState];
}
