import React from 'react';
import { IMG_PATH } from '../config';

export const Poster = ({ item, onOpenModal, isWatched, isLarge, season, episode }) => {
    return (
        <div 
            className={`poster-wrapper group flex-shrink-0 relative ${isLarge ? 'w-64' : 'w-40'}`} 
            onClick={() => onOpenModal(item)}
        >
            <img
                className="poster w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-110"
                src={`${IMG_PATH}${item.poster_path}`}
                alt={item.title || item.name}
                loading="lazy"
            />
            {/* --- Ipakita ang progress kung TV Show --- */}
            {season && episode && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs font-bold px-2 py-1 rounded-md">
                    S{season}: E{episode}
                </div>
            )}
            {/* --- Ipakita ang checkmark kung natan-aw na --- */}
            {isWatched && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">
                    <i className="fas fa-check text-sm"></i>
                </div>
            )}
            {/* --- Kuhaa ang daan nga progress bar, ang checkmark na ang puli --- */}
        </div>
    );
};