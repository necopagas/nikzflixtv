import React from 'react';
import { IMG_PATH } from '../config';

export const Poster = ({ item, onOpenModal, isWatched, isLarge }) => {
    return (
        <div 
            className={`poster-wrapper flex-shrink-0 ${isLarge ? 'w-64' : 'w-40'}`} 
            onClick={() => onOpenModal(item)}
        >
            <img
                className="poster w-full h-full object-cover rounded-md"
                src={`${IMG_PATH}${item.poster_path}`}
                alt={item.title || item.name}
                loading="lazy"
            />
            {isWatched && (
                <div className="watched-progress">
                    <div className="watched-progress-bar"></div>
                </div>
            )}
        </div>
    );
};