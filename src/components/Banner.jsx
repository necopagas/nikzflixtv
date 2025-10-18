import React, { useState, useEffect } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, BACKDROP_PATH } from '../config';

// Gidugangan nato og "endpoint" prop
export const Banner = ({ onOpenModal, endpoint = 'trending' }) => {
    const [items, setItems] = useState([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    useEffect(() => {
        // Gamiton niya ang endpoint nga gipasa, kung wala, "trending" ang default
        const apiUrl = API_ENDPOINTS[endpoint] || API_ENDPOINTS.trending;
        fetchData(apiUrl)
            .then(data => {
                const validItems = (data.results || []).filter(item => item.backdrop_path);
                setItems(validItems);
                if (validItems.length > 0) {
                    setCurrentItemIndex(Math.floor(Math.random() * validItems.length));
                }
            });
    }, [endpoint]); // Modagan ni pag-usab kung mausab ang endpoint

    useEffect(() => {
        if (items.length > 1) {
            const timer = setInterval(() => {
                setCurrentItemIndex(prevIndex => (prevIndex + 1) % items.length);
            }, 10000);

            return () => clearInterval(timer);
        }
    }, [items]);

    const item = items[currentItemIndex];

    if (!item) {
        return <div className="w-full h-[90vh] skeleton"></div>;
    }

    const truncatedDesc = item.overview.length > 200
        ? `${item.overview.substring(0, 200)}...`
        : item.overview;

    return (
        <div 
            className="banner relative w-full h-[90vh] bg-cover bg-center text-white transition-all duration-1000" 
            style={{ backgroundImage: `url(${BACKDROP_PATH}${item.backdrop_path})` }}
        >
            <div className="absolute inset-0 z-10 p-4 sm:p-8 md:p-16 flex flex-col justify-center">
                <h1 className="banner-title text-4xl md:text-7xl font-extrabold mb-4 max-w-3xl">{item.title || item.name}</h1>
                <p className="banner-desc text-md md:text-xl mb-8 max-w-md md:max-w-2xl">{truncatedDesc}</p>
                
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button onClick={() => onOpenModal(item, true)} className="banner-button bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-gray-200 flex items-center justify-center gap-2 text-lg">
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
