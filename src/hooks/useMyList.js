// src/hooks/useMyList.js
import { useState, useEffect } from 'react';

export const useMyList = () => {
    const [myList, setMyList] = useState(() => JSON.parse(localStorage.getItem('myNikzflixList')) || []);
    
    useEffect(() => {
        localStorage.setItem('myNikzflixList', JSON.stringify(myList));
    }, [myList]);

    const isItemInMyList = (itemId) => myList.some(item => item.id === itemId);

    const toggleMyList = (item) => {
        setMyList(prevList => {
            const isAdded = prevList.some(i => i.id === item.id);
            if (isAdded) {
                return prevList.filter(i => i.id !== item.id);
            } else {
                // Only store necessary info
                const newItem = {
                    id: item.id,
                    name: item.name || item.title,
                    poster_path: item.poster_path,
                    media_type: item.media_type || (item.title ? 'movie' : 'tv')
                };
                return [...prevList, newItem];
            }
        });
    };

    return { myList, isItemInMyList, toggleMyList };
};