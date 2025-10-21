import React, { useRef } from 'react';
import { Poster } from './Poster';
import { useApi } from '../hooks/useApi';

export const Row = ({ title, endpoint, param, items: propItems, onOpenModal, isWatched, isLarge = false, isLoading: propIsLoading = false }) => {
    const rowRef = useRef(null);

    const { items: apiItems, loading: apiLoading } = useApi(endpoint, param);

    const items = endpoint ? apiItems : propItems;
    const isLoading = endpoint ? apiLoading : propIsLoading;

    // --- GI-UPDATE NGA SCROLL FUNCTION ---
    const scroll = (scrollOffset) => {
        if (rowRef.current) {
            // Mogamit ta sa scrollBy para sa smooth scrolling
            rowRef.current.scrollBy({
                left: scrollOffset,
                behavior: 'smooth' // Kini ang magpahapsay sa pag-slide
            });
        }
    };
    // --- END SA UPDATE ---

    if (!isLoading && items.length === 0) {
        return null; // Dili i-render ang row kung walay sulod
    }

    return (
        <div className="row my-10">
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
            <div className="relative group">
                 {/* Arrow buttons para mo-scroll */}
                 <button 
                     onClick={() => scroll(-500)} // Amount of pixels to scroll left
                     className="scroll-arrow left-arrow opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-default" // Mag-disable kung naa na sa pinakasugod (optional improvement for later)
                     aria-label={`Scroll ${title} left`} // Added for accessibility
                 >
                     <i className="fas fa-chevron-left"></i> {/* Gigamit ang FontAwesome icons */}
                 </button>
                <div 
                    ref={rowRef} 
                    className={`row-posters flex overflow-x-scroll overflow-y-hidden space-x-4 p-2 ${isLarge ? 'h-96' : 'h-64'}`}
                    // Gidugang para sa keyboard scrolling (optional but good)
                    tabIndex={0} 
                    aria-label={`${title} carousel`}
                    role="region" 
                >
                    {isLoading ? (
                        // Skeleton loaders samtang nag-load pa
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={`skeleton-${title}-${i}`} className={`flex-shrink-0 skeleton ${isLarge ? 'w-64' : 'w-40'} rounded-md`}></div>
                        ))
                    ) : (
                        // Ang actual posters
                        items.map(item => (
                             <Poster 
                                key={item.id} 
                                item={item} 
                                onOpenModal={onOpenModal} 
                                isWatched={isWatched(item.id)}
                                isLarge={isLarge} 
                                season={item.season} // Para sa Continue Watching badge
                                episode={item.episode} // Para sa Continue Watching badge
                             />
                        ))
                    )}
                </div>
                 <button 
                     onClick={() => scroll(500)} // Amount of pixels to scroll right
                     className="scroll-arrow right-arrow opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-default" // Mag-disable kung naa na sa pinakadulo (optional improvement for later)
                     aria-label={`Scroll ${title} right`} // Added for accessibility
                 >
                     <i className="fas fa-chevron-right"></i> {/* Gigamit ang FontAwesome icons */}
                 </button>
            </div>
        </div>
    );
};