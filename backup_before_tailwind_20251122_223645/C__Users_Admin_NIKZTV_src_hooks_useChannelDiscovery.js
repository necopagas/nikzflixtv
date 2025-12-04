// src/hooks/useChannelDiscovery.js
// React hook wrapper around the channel discovery helpers

import { useCallback, useMemo, useState } from 'react';
import { discoverChannelStreams } from '../utils/channelDiscovery';

export const useChannelDiscovery = (defaultOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const optionsRef = useMemo(() => ({ ...defaultOptions }), [defaultOptions]);

  const discover = useCallback(async (channelName, overrideOptions = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const streams = await discoverChannelStreams(channelName, {
        ...optionsRef,
        ...overrideOptions,
      });
      setResults(streams);
      return streams;
    } catch (err) {
      setError(err);
      setResults([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [optionsRef]);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    discover,
    reset,
    isLoading,
    error,
    results,
  };
};
