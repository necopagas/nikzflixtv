import { useState, useEffect } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS } from '../config';

export const useApi = (endpoint, param) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let apiUrl;
        const endpointOrFn = API_ENDPOINTS[endpoint];

        if (typeof endpointOrFn === 'function') {
            apiUrl = endpointOrFn(param); // Tawagon ang function kung naay parameter
        } else if (typeof endpointOrFn === 'string') {
            apiUrl = endpointOrFn; // Gamiton ang string kung wala
        } else {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchData(apiUrl)
            .then(data => {
                setItems(data.results || []);
            })
            .catch(error => console.error(`Failed to fetch data for ${endpoint}:`, error))
            .finally(() => setLoading(false));
            
    }, [endpoint, param]);

    return { items, loading };
};