// src/components/Row.jsx
import React, { useRef } from 'react';
import { Poster } from './Poster';
import { useApi } from '../hooks/useApi';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'; // <-- DUGANG NGA IMPORT

export const Row = ({ title, endpoint, param, items: propItems, onOpenModal, isWatched, isLarge = false, isLoading: propIsLoading = false }) => {
    const scrollContainerRef = useRef(null); // Gi-ilisan ang ngalan para klaro
    
    // --- DUGANG: Intersection Observer para sa animation ---
    const [rowRef, isVisible] = useIntersectionObserver({ 
        threshold: 0.1, 
        triggerOnce: true 
    });
    // --- END SA DUGANG ---

    const { items: apiItems, loading: apiLoading } = useApi(endpoint, param);

    const items = endpoint ? apiItems : propItems;
    const isLoading = endpoint ? apiLoading : propIsLoading;

    const scroll = (scrollOffset) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: scrollOffset,
                behavior: 'smooth'
            });
        }
    };

    if (!isLoading && items.length === 0) {
        return null;
    }

    return (
        // --- GI-UPDATE: Gidugang ang ref ug classes para sa animation ---
        <div 
            ref={rowRef} 
            className={`row-container my-10 ${isVisible ? 'is-visible' : ''}`}
        >
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
            <div className="relative group">
                 <button 
                     onClick={() => scroll(-500)}
                     className="scroll-arrow left-arrow opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-default"
                     aria-label={`Scroll ${title} left`}
                 >
                     <i className="fas fa-chevron-left"></i>
                 </button>
                <div 
                    ref={scrollContainerRef} // Gigamit ang bag-ong ref name
                    className={`row-posters flex overflow-x-scroll overflow-y-hidden space-x-4 p-2 ${isLarge ? 'h-96' : 'h-64'}`}
                    tabIndex={0} 
                    aria-label={`${title} carousel`}
                    role="region" 
                >
                    {isLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={`skeleton-${title}-${i}`} className={`flex-shrink-0 skeleton ${isLarge ? 'w-64' : 'w-40'} rounded-md`}></div>
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
                 <button 
                     onClick={() => scroll(500)}
                     className="scroll-arrow right-arrow opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-default"
                     aria-label={`Scroll ${title} right`}
                 >
                     <i className="fas fa-chevron-right"></i>
                 </button>
            </div>
        </div>
    );
};