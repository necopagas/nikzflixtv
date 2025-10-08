import React, { useState, useEffect } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, BACKDROP_PATH } from '../config';

export const Banner = ({ onOpenModal }) => {
    const [items, setItems] = useState([]); // State para sa tibuok listahan
    const [currentItemIndex, setCurrentItemIndex] = useState(0); // Index sa kasamtangang item

    useEffect(() => {
        fetchData(API_ENDPOINTS.trending)
            .then(data => {
                // --- FIX: I-filter out ang mga items nga walay backdrop ---
                const validItems = (data.results || []).filter(item => item.backdrop_path);
                setItems(validItems);
                // I-set ang random starting point
                setCurrentItemIndex(Math.floor(Math.random() * validItems.length));
            });
    }, []);

    // --- BAG-O: useEffect para sa rotating banner ---
    useEffect(() => {
        if (items.length > 1) {
            const timer = setInterval(() => {
                setCurrentItemIndex(prevIndex => (prevIndex + 1) % items.length);
            }, 10000); // Mag-ilis matag 10 segundos

            return () => clearInterval(timer); // Limpyuhon ang timer inig unmount
        }
    }, [items]);

    const item = items[currentItemIndex];

    if (!item) {
        return <div className="w-full h-[85vh] skeleton"></div>;
    }

    const truncatedDesc = item.overview.length > 150
        ? `${item.overview.substring(0, 150)}...`
        : item.overview;

    return (
        <div 
            className="banner relative w-full h-[85vh] bg-cover bg-center text-white transition-all duration-1000" 
            style={{ backgroundImage: `url(${BACKDROP_PATH}${item.backdrop_path})` }}
        >
            <div className="absolute inset-0 z-10 p-4 sm:p-8 md:p-16 flex flex-col justify-center">
                <h1 className="banner-title text-4xl md:text-6xl font-extrabold mb-4 max-w-2xl">{item.title || item.name}</h1>
                <p className="banner-desc text-md md:text-lg mb-8 max-w-md md:max-w-xl">{truncatedDesc}</p>
                
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button onClick={() => onOpenModal(item, true)} className="banner-button bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-gray-300 flex items-center justify-center gap-2 text-lg">
                        <i className="fas fa-play"></i> Play
                    </button>
                    <button onClick={() => onOpenModal(item)} className="banner-button bg-gray-700 bg-opacity-70 text-white px-8 py-3 rounded-md font-bold hover:bg-gray-600 flex items-center justify-center gap-2 text-lg">
                        <i className="fas fa-info-circle"></i> More Info
                    </button>
                </div>
            </div>
        </div>
    );
};