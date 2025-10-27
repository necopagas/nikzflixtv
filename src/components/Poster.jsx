// src/components/Poster.jsx
import React, { useState } from 'react';
import { IMG_PATH } from '../config';
import { getGenreNamesByIds } from '../utils/genreUtils';

export const Poster = ({ item, onOpenModal, isWatched, isLarge, season, episode }) => {
    const [isHovered, setIsHovered] = useState(false);

    const imageUrl = item.poster_path?.startsWith('http')
        ? item.poster_path
        : item.poster_path ? `${IMG_PATH}${item.poster_path}` : 'https://via.placeholder.com/500x750.png?text=No+Image+Available';

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenModal(item);
        }
    };

    const genreNames = getGenreNamesByIds(item.genre_ids);
    const displayTitle = item.title || item.name || 'Untitled';
    const widthClass = isLarge ? 'w-64' : 'w-40';

    return (
        // --- CONTAINER: Adjusted hover effects, removed explicit cursor ---
         <div
            // --- GIBALHIN NATO ANG widthClass SA SULOD NGA WRAPPER ---
            className={`poster-container relative group focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] focus-visible:ring-[var(--brand-color)] rounded-lg`} // Removed width, added rounding here
            onClick={() => onOpenModal(item)}
            tabIndex="0"
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
         >
            {/* --- WRAPPER PARA SA IMAGE UG TITLE (KANI NA ANG NAAY SIZE UG HOVER EFFECT) --- */}
            <div
                // --- GIBUTANG ANG WIDTH UG HOVER EFFECT DIRI ---
                className={`relative ${widthClass} flex flex-col rounded-lg overflow-hidden bg-[var(--bg-secondary)] shadow-md transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-110 group-hover:z-10`}
            >
                {/* --- IMAGE WRAPPER --- */}
                <div
                    className={`poster-image-wrapper relative w-full aspect-[2/3] overflow-hidden`} // Removed flex-shrink-0
                >
                    <img
                        className="poster w-full h-full object-cover" // Removed transitions from here, parent handles it
                        src={imageUrl}
                        alt={displayTitle}
                        loading="lazy"
                         onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/500x750.png?text=No+Image+Available'; }}
                    />

                    {/* Season/Episode Badge */}
                    {season && episode && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                            S{season}: E{episode}
                        </div>
                    )}

                    {/* Watched Checkmark */}
                    {isWatched && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg" title="Watched">
                            <i className="fas fa-check text-sm"></i>
                        </div>
                    )}

                    {/* --- HOVER OVERLAY --- */}
                    <div
                        // --- MAS DARK NGA GRADIENT ---
                        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 transition-opacity duration-300 ease-in-out z-20 ${
                            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                    >
                        {/* Play/Info Buttons */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3">
                             <button
                                onClick={(e) => { e.stopPropagation(); onOpenModal(item, true); }}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 text-black flex items-center justify-center text-xl md:text-2xl transition-all duration-200 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white ring-offset-2 ring-offset-transparent"
                                title="Play"
                                aria-label="Play"
                            >
                                <i className="fas fa-play"></i>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenModal(item); }}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-600/80 backdrop-blur-sm text-white flex items-center justify-center text-xl md:text-2xl transition-all duration-200 hover:bg-gray-500/90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white ring-offset-2 ring-offset-transparent"
                                title="More Info"
                                aria-label="More Info"
                            >
                                <i className="fas fa-info-circle"></i>
                            </button>
                        </div>

                         {/* Genres on Hover */}
                        {genreNames.length > 0 && isHovered && (
                            <div className="absolute bottom-3 left-3 w-[calc(100%-24px)]">
                                <p className="text-white text-xs font-semibold truncate">
                                    {genreNames.join(' • ')}
                                </p>
                            </div>
                        )}
                    </div> {/* End Hover Overlay */}
                </div> {/* End poster-image-wrapper */}

                {/* --- TITLE AREA (Walay background) --- */}
                {/* Gibutang balik sa sulod sa main scaling div */}
                <div className="pt-2 pb-1 px-1"> {/* Adjusted padding */}
                    <h3
                        className="text-sm font-semibold text-[var(--text-primary)] transition-colors duration-300 truncate group-hover:text-white" // Keep text white on hover maybe? Or brand color? Let's try white.
                        title={displayTitle}
                    >
                        {displayTitle}
                    </h3>
                </div>
            </div> {/* End scaling/sizing wrapper */}
         </div> // End poster-container
    );
};