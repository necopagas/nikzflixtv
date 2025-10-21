import React, { useState } from 'react'; // Gidugang ang useState
import { IMG_PATH } from '../config';
import { getGenreNamesByIds } from '../utils/genreUtils'; // <-- Gidugang nga import

export const Poster = ({ item, onOpenModal, isWatched, isLarge, season, episode }) => {
    // --- STATE PARA SA HOVER ---
    const [isHovered, setIsHovered] = useState(false);

    // Check if the poster_path is already a full URL
    const imageUrl = item.poster_path?.startsWith('http') 
        ? item.poster_path 
        : `${IMG_PATH}${item.poster_path}`;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); 
            onOpenModal(item);
        }
    };

    // --- KUHAON ANG GENRE NAMES ---
    const genreNames = getGenreNamesByIds(item.genre_ids);

    return (
        <div 
            className={`poster-wrapper group flex-shrink-0 relative ${isLarge ? 'w-64' : 'w-40'} focus:outline-none overflow-hidden rounded-md`} // Gidugang ang overflow-hidden ug rounded-md diri
            onClick={() => onOpenModal(item)}
            tabIndex="0" 
            onKeyDown={handleKeyDown} 
            // --- GIDUGANG NGA EVENT HANDLERS ---
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img
                className="poster w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" // Gitanggal ang rounded-md diri kay naa na sa wrapper
                src={imageUrl}
                alt={item.title || item.name}
                loading="lazy"
            />
            
            {/* --- Ipakita ang progress kung TV Show --- */}
            {season && episode && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                    S{season}: E{episode}
                </div>
            )}
            
            {/* --- Ipakita ang checkmark kung natan-aw na --- */}
            {isWatched && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white z-10">
                    <i className="fas fa-check text-sm"></i>
                </div>
            )}

            {/* --- BAG-O: GENRE DISPLAY ON HOVER --- */}
            {isHovered && genreNames.length > 0 && (
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-6 transition-opacity duration-300 z-20">
                    <p className="text-white text-xs font-semibold truncate">
                        {genreNames.join(' • ')} {/* Ibutang og dot sa tunga */}
                    </p>
                </div>
            )}
            {/* --- END SA BAG-O --- */}
        </div>
    );
};