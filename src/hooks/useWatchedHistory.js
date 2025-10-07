import { useState, useEffect } from 'react';

export const useWatchedHistory = () => {
    const [watchedHistory, setWatchedHistory] = useState(() => JSON.parse(localStorage.getItem('nikzflixWatchedHistory')) || []);

    useEffect(() => {
        localStorage.setItem('nikzflixWatchedHistory', JSON.stringify(watchedHistory));
    }, [watchedHistory]);

    const addToWatched = (itemId) => {
        if (!watchedHistory.includes(itemId)) {
            setWatchedHistory(prev => [...prev, itemId]);
        }
    };

    const isWatched = (itemId) => watchedHistory.includes(itemId);

    return { watchedHistory, addToWatched, isWatched };
};