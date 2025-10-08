import React, { useRef } from 'react';
import { Poster } from './Poster';
import { useApi } from '../hooks/useApi';

export const Row = ({ title, endpoint, param, items: propItems, onOpenModal, isWatched, isLarge = false, isLoading: propIsLoading = false }) => {
    const rowRef = useRef(null);
    
    // Gamiton ang hook kung naay endpoint, kung wala, gamiton ang "propItems" (para sa My List, etc.)
    const { items: apiItems, loading: apiLoading } = useApi(endpoint, param);
    
    const items = endpoint ? apiItems : propItems;
    const isLoading = endpoint ? apiLoading : propIsLoading;

    const scroll = (scrollOffset) => {
        if (rowRef.current) {
            rowRef.current.scrollLeft += scrollOffset;
        }
    };
    
    if (!isLoading && items.length === 0) {
        return null;
    }

    return (
        <div className="row my-8">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="relative group">
                 <button onClick={() => scroll(-500)} className="scroll-arrow left-arrow opacity-0 group-hover:opacity-100">&lt;</button>
                <div ref={rowRef} className={`row-posters flex overflow-x-scroll overflow-y-hidden space-x-4 p-2 ${isLarge ? 'h-96' : 'h-64'}`}>
                    {isLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className={`flex-shrink-0 skeleton ${isLarge ? 'w-64' : 'w-40'} rounded-md`}></div>
                        ))
                    ) : (
                        items.map(item => (
                             <Poster 
                                key={item.id} 
                                item={item} 
                                onOpenModal={onOpenModal} 
                                isWatched={isWatched(item.id)}
                                isLarge={isLarge} 
                                season={item.season}
                                episode={item.episode}
                             />
                        ))
                    )}
                </div>
                 <button onClick={() => scroll(500)} className="scroll-arrow right-arrow opacity-0 group-hover:opacity-100">&gt;</button>
            </div>
        </div>
    );
};