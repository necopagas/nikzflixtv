import { useState, useEffect } from 'react';

export const useContinueWatching = () => {
    const [continueWatchingList, setContinueWatchingList] = useState(() => JSON.parse(localStorage.getItem('nikzflixContinueWatching')) || []);

    useEffect(() => {
        localStorage.setItem('nikzflixContinueWatching', JSON.stringify(continueWatchingList));
    }, [continueWatchingList]);
    
    // Dawaton na nato ang tibuok 'item' object
    const setItemProgress = (item, season, episode) => { 
        const newItem = {
            id: item.id,
            title: item.title || item.name,
            name: item.name || item.title,
            poster_path: item.poster_path,
            media_type: item.media_type || (item.title ? 'movie' : 'tv'),
            lastWatched: new Date().toISOString(),
            season,
            episode
        };
        
        setContinueWatchingList(prevList => {
            const updatedList = prevList.filter(i => i.id !== item.id);
            return [newItem, ...updatedList];
        });
    };

    return { continueWatchingList, setItemProgress };
};