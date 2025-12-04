import { useState, useEffect } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS } from '../config';

export const useApi = (endpoint, param) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let apiUrl;
    const endpointOrFn = API_ENDPOINTS[endpoint];

    if (typeof endpointOrFn === 'function') {
      apiUrl = endpointOrFn(param);
    } else if (typeof endpointOrFn === 'string') {
      apiUrl = endpointOrFn;
    } else if (
      typeof endpoint === 'string' &&
      (endpoint.startsWith('/') || endpoint.startsWith('http'))
    ) {
      // allow passing a direct URL (e.g. /api/vivamax?page=1 or full tmdb URL)
      apiUrl = endpoint;
    } else {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchData(apiUrl)
      .then(data => {
        console.log(`useApi: ${endpoint} returned ${data.results?.length || 0} results`);
        setItems(data.results || []);
      })
      .catch(error => {
        console.error(`Failed to fetch data for ${endpoint}:`, error);
        setError(error.message || 'Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [endpoint, param]);

  return { items, loading, error };
};
