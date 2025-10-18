import React from 'react';
import { Banner } from '../components/Banner';
import { Row } from '../components/Row';

export const AnimePage = ({ onOpenModal, isWatched }) => {
    return (
        <>
            {/* Ang Banner, pero ang data gikan sa Anime endpoint */}
            <Banner onOpenModal={onOpenModal} endpoint="animePopular" />

            <div className="px-4 sm:px-8 md:px-16 pb-20">
                <h1 className="text-4xl font-bold mt-8 mb-4">Explore Anime</h1>
                
                {/* Mga Rows nga puro para sa Anime */}
                <Row 
                    title="Popular Anime Series" 
                    endpoint="animePopular" 
                    onOpenModal={onOpenModal} 
                    isWatched={isWatched} 
                    isLarge 
                />
                <Row 
                    title="Top Rated Anime" 
                    endpoint="animeTopRated" 
                    onOpenModal={onOpenModal} 
                    isWatched={isWatched} 
                />
                <Row 
                    title="Anime Movies" 
                    endpoint="animeMovies" 
                    onOpenModal={onOpenModal} 
                    isWatched={isWatched} 
                />
                 <Row 
                    title="Currently Airing" 
                    endpoint="animeOnTheAir" 
                    onOpenModal={onOpenModal} 
                    isWatched={isWatched} 
                />
            </div>
        </>
    );
};
