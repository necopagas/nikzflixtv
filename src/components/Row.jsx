import React, { useState, useEffect, useRef } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS } from '../config';
import { Poster } from './Poster';

export const Row = ({ title, endpoint, items: initialItems, onOpenModal, isWatched, isLarge = false }) => {
    const [items, setItems] = useState(initialItems || []);
    const [isLoading, setIsLoading] = useState(!initialItems);
    const rowRef = useRef(null);

    useEffect(() => {
        if (!initialItems && endpoint) {
            setIsLoading(true);
            fetchData(API_ENDPOINTS[endpoint])
                .then(data => {
                    setItems(data.results);
                })
                .finally(() => setIsLoading(false));
        } else if (initialItems) {
            setItems(initialItems);
            setIsLoading(false);
        }
    }, [endpoint, initialItems]);

    const scroll = (scrollOffset) => {
        rowRef.current.scrollLeft += scrollOffset;
    };

    return (
        <div className="row my-8">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="relative">
                 <button onClick={() => scroll(-500)} className="scroll-arrow left-arrow">&lt;</button>
                <div ref={rowRef} className={`row-posters flex overflow-x-scroll overflow-y-hidden space-x-4 p-2 ${isLarge ? 'h-96' : 'h-64'}`}>
                    {isLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className={`flex-shrink-0 skeleton ${isLarge ? 'w-64' : 'w-40'} rounded-md`}></div>
                        ))
                    ) : (
                        items.map(item => (
                            // --- ANG FIX NAA DINHI: Gitangtang ang 'item.poster_path &&' ---
                             <Poster 
                                key={item.id} 
                                item={item} 
                                onOpenModal={onOpenModal} 
                                isWatched={isWatched(item.id)}
                                isLarge={isLarge} 
                             />
                        ))
                    )}
                </div>
                 <button onClick={() => scroll(500)} className="scroll-arrow right-arrow">&gt;</button>
            </div>
        </div>
    );
};