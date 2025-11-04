import React, { useState } from 'react';
import { Row } from '../components/Row';
import { AdsterraSmartlink } from '../components/AdsterraSmartlink';
import { GenreFilter } from '../components/GenreFilter';
import { ANIME_GENRES } from '../config';

export const AnimePage = ({ onOpenModal, isWatched }) => {
    const [selectedGenre, setSelectedGenre] = useState(null);

    const handleGenreSelect = (genreId) => {
        // Kung ang gipili nga genre kay mao na daan ang active, i-reset nato
        if (selectedGenre === genreId) {
            setSelectedGenre(null);
        } else {
            setSelectedGenre(genreId);
        }
    };

    // Kuhaon nato ang ngalan sa gipili nga genre para sa title sa Row
    const selectedGenreName = selectedGenre
        ? ANIME_GENRES.find(g => g.id === selectedGenre)?.name
        : '';

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold mb-2 text-shadow-lg">Anime Hub</h1>
                <p className="text-lg text-[var(--text-secondary)]">Your one-stop destination for all things anime.</p>
            </div>

            {/* --- GENRE FILTER COMPONENT --- */}
            <GenreFilter
                genres={ANIME_GENRES}
                selectedGenre={selectedGenre}
                onGenreSelect={handleGenreSelect}
            />

            {/* --- KONDISYON: Ipakita ang resulta kung naay gipili, kung wala, ipakita ang default rows --- */}
            {selectedGenre ? (
                // Kung naay gipili nga genre
                <Row
                    key={`genre-${selectedGenre}`} // Ang key importante para mo-rerender ang component inig-ilis og genre
                    title={`${selectedGenreName} Anime`}
                    // Special nga pag-handle kung Isekai (ID 99999) ang gipili
                    endpoint={selectedGenre === 99999 ? 'animeIsekai' : 'animeByGenre'}
                    param={selectedGenre === 99999 ? null : selectedGenre} // Ipasa ang genreId isip parameter
                    onOpenModal={onOpenModal}
                    isWatched={isWatched}
                    isLarge
                />
            ) : (
                // Kung walay gipili nga genre (default view)
                <>
                    <Row
                        title="Popular Anime Series"
                        endpoint="animePopular"
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                        isLarge
                    />
                    
                    {/* Smartlink Ad */}
                    <AdsterraSmartlink />
                    
                    <Row
                        title="Top Rated Anime"
                        endpoint="animeTopRated"
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                    />
                    <Row
                        title="New Anime Releases"
                        endpoint="animeNewReleases"
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                    />
                </>
            )}
        </div>
    );
};