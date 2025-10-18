import React, { useRef } from 'react';
import { Poster } from './Poster';
import { useApi } from '../hooks/useApi';

export const Row = ({ title, endpoint, param, items: propItems, onOpenModal, isWatched, isLarge = false, isLoading: propIsLoading = false }) => {
    const rowRef = useRef(null);
    
    // Gamiton gihapon nato ang custom hook para mukuha og data
    const { items: apiItems, loading: apiLoading } = useApi(endpoint, param);
    
    // I-combine ang logic para kung gikan sa API ang data or gi-pasa lang
    const items = endpoint ? apiItems : propItems;
    const isLoading = endpoint ? apiLoading : propIsLoading;

    const scroll = (scrollOffset) => {
        if (rowRef.current) {
            rowRef.current.scrollLeft += scrollOffset;
        }
    };
    
    // KINI ANG GI-USAB: Imbis nga `return null`, magpakita ta og status
    const renderContent = () => {
        if (isLoading) {
            // Kung loading pa, ipakita ang skeleton loaders
            return Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`flex-shrink-0 skeleton ${isLarge ? 'w-64' : 'w-40'} rounded-md`}></div>
            ));
        }

        if (items.length === 0) {
            // Kung walay sulod, ipakita ni nga message
            return <p className="text-[var(--text-secondary)]">No content available for this section at the moment.</p>;
        }

        // Kung naay sulod, ipakita ang mga posters
        return items.map(item => (
             <Poster 
                key={item.id} 
                item={item} 
                onOpenModal={onOpenModal} 
                isWatched={isWatched(item.id)}
                isLarge={isLarge} 
                season={item.season}
                episode={item.episode}
             />
        ));
    };

    return (
        <div className="row my-10">
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
            <div className="relative group">
                 <button onClick={() => scroll(-500)} className="scroll-arrow left-arrow opacity-0 group-hover:opacity-100">&lt;</button>
                <div ref={rowRef} className={`row-posters flex overflow-x-scroll overflow-y-hidden space-x-4 p-2 ${isLarge ? 'h-96' : 'h-64'}`}>
                    {renderContent()}
                </div>
                 <button onClick={() => scroll(500)} className="scroll-arrow right-arrow opacity-0 group-hover:opacity-100">&gt;</button>
            </div>
        </div>
    );
};
