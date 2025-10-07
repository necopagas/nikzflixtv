import React, { useState } from 'react';
import { useMyList } from '../hooks/useMyList';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { Banner } from '../components/Banner';
import { GenreFilter } from '../components/GenreFilter';
import { Row } from '../components/Row';
import AdsterraBanner from '../AdsterraBanner';
import { API_ENDPOINTS, MOVIE_GENRES } from '../config';
import { fetchData } from '../utils/fetchData';

export const HomePage = ({ onOpenModal, isWatched }) => {
    const { myList } = useMyList();
    const { continueWatchingList } = useContinueWatching();
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [genreMovies, setGenreMovies] = useState([]);
    const [isLoadingGenre, setIsLoadingGenre] = useState(false);

    const handleGenreSelect = (genreId) => {
        if (selectedGenre === genreId) {
            setSelectedGenre(null);
            setGenreMovies([]);
        } else {
            setSelectedGenre(genreId);
            setIsLoadingGenre(true);
            fetchData(API_ENDPOINTS.byGenre(genreId))
                .then(data => setGenreMovies(data.results))
                .finally(() => setIsLoadingGenre(false));
        }
    };

    return (
        <>
            <Banner onOpenModal={onOpenModal} />
            <div className="px-4 sm:px-8 md:px-16 pb-20">
                <GenreFilter
                    genres={MOVIE_GENRES}
                    selectedGenre={selectedGenre}
                    onGenreSelect={handleGenreSelect}
                />
                {selectedGenre && (
                    <Row
                        // --- ANG FIX NAA DINHI: Gigamit na ang backticks (`) para sa key ---
                        key={`genre-${selectedGenre}`}
                        title={MOVIE_GENRES.find(g => g.id === selectedGenre)?.name || 'Genre Results'}
                        items={genreMovies}
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                        isLoading={isLoadingGenre}
                    />
                )}
                <Row title="Trending Now" endpoint="trending" onOpenModal={onOpenModal} isWatched={isWatched} />
                <AdsterraBanner />
                <Row title="Popular Movies" endpoint="popular" onOpenModal={onOpenModal} isWatched={isWatched} />
                {continueWatchingList.length > 0 && (
                    <Row title="Continue Watching" items={continueWatchingList} onOpenModal={onOpenModal} isWatched={isWatched} />
                )}
                <Row title="Top Rated Movies" endpoint="toprated" onOpenModal={onOpenModal} isWatched={isWatched} />
                <Row title="Popular TV Shows" endpoint="tvshows" onOpenModal={onOpenModal} isWatched={isWatched} />
                {myList.length > 0 && (
                     <Row title="My List" items={myList} onOpenModal={onOpenModal} isWatched={isWatched} />
                )}
                <Row title="Anime" endpoint="anime" onOpenModal={onOpenModal} isWatched={isWatched} isLarge />
                <Row title="Asian Dramas" endpoint="asianDramas" onOpenModal={onOpenModal} isWatched={isWatched} />
            </div>
        </>
    );
};