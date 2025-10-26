// src/components/Poster.jsx
import React, { useState } from 'react';
import { IMG_PATH } from '../config';
import { getGenreNamesByIds } from '../utils/genreUtils';

export const Poster = ({ item, onOpenModal, isWatched, isLarge, season, episode }) => {
    const [isHovered, setIsHovered] = useState(false);

    const imageUrl = item.poster_path?.startsWith('http') 
        ? item.poster_path 
        : `${IMG_PATH}${item.poster_path}`;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); 
            onOpenModal(item);
        }
    };

    const genreNames = getGenreNamesByIds(item.genre_ids);

    return (
        <div 
            className={`poster-wrapper group flex-shrink-0 relative ${isLarge ? 'w-64' : 'w-40'} focus:outline-none overflow-hidden rounded-md`}
            onClick={() => onOpenModal(item)}
            tabIndex="0" 
            onKeyDown={handleKeyDown} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img
                className="poster w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                src={imageUrl}
                alt={item.title || item.name}
                loading="lazy"
            />
            
            {season && episode && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                    S{season}: E{episode}
                </div>
            )}
            
            {isWatched && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white z-10">
                    <i className="fas fa-check text-sm"></i>
                </div>
            )}

            {/* --- BAG-O: HOVER OVERLAY NGA NAAY BUTTONS UG GENRE --- */}
            <div 
                className={`absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 transition-all duration-300 z-20 ${
                    isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3">
                    {/* Play Button (Opens Modal in Play mode) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Para dili mo-trigger sa wrapper onClick
                            onOpenModal(item, true); // true = playOnOpen
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 text-black flex items-center justify-center text-xl md:text-2xl transition-all hover:bg-white hover:scale-110"
                        title="Play"
                    >
                        <i className="fas fa-play"></i>
                    </button>
                     {/* Info Button (Opens Modal normally) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenModal(item);
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-500/70 text-white backdrop-blur-sm flex items-center justify-center text-xl md:text-2xl transition-all hover:bg-gray-500/90 hover:scale-110"
                        title="More Info"
                    >
                        <i className="fas fa-info-circle"></i>
                    </button>
                </div>
                
                {/* Genre display */}
                {genreNames.length > 0 && (
                    <div className="absolute bottom-3 left-3 w-[calc(100%-24px)]">
                        <p className="text-white text-xs font-semibold truncate">
                            {genreNames.join(' • ')}
                        </p>
                    </div>
                )}
            </div>
            {/* --- END SA BAG-O --- */}
        </div>
    );
};