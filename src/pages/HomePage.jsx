import React, { useState, useEffect } from 'react';
import { useMyList } from '../hooks/useMyList';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { Banner } from '../components/Banner';
import { GenreFilter } from '../components/GenreFilter';
import { Row } from '../components/Row';
import AdsterraBanner from '../AdsterraBanner';
import { API_ENDPOINTS, MOVIE_GENRES } from '../config';
import { fetchData } from '../utils/fetchData';

export const HomePage = ({ onOpenModal, isWatched }) => {
    const { myList, loading: myListLoading } = useMyList();
    const { continueWatchingList, loading: continueWatchingLoading } = useContinueWatching();
    
    // --- MAGHIMO TA OG STATE PARA SA SHORT DRAMAS ---
    const [shortDramas, setShortDramas] = useState([]);

    const [trending, setTrending] = useState([]);
    const [popular, setPopular] = useState([]);
    const [topRated, setTopRated] = useState([]);
    const [tvShows, setTvShows] = useState([]);
    const [anime, setAnime] = useState([]);
    const [asianDramas, setAsianDramas] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [genreMovies, setGenreMovies] = useState([]);
    const [isLoadingGenre, setIsLoadingGenre] = useState(false);

    useEffect(() => {
        // --- UG I-FETCH NATO ANG DATA PARA SA SHORT DRAMAS ---
        fetchData(API_ENDPOINTS.shortDramas).then(data => setShortDramas(data.results));

        fetchData(API_ENDPOINTS.trending).then(data => setTrending(data.results));
        fetchData(API_ENDPOINTS.popular).then(data => setPopular(data.results));
        fetchData(API_ENDPOINTS.toprated).then(data => setTopRated(data.results));
        fetchData(API_ENDPOINTS.tvshows).then(data => setTvShows(data.results));
        fetchData(API_ENDPOINTS.anime).then(data => setAnime(data.results));
        fetchData(API_ENDPOINTS.asianDramas).then(data => setAsianDramas(data.results));
    }, []);

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
                        key={`genre-${selectedGenre}`}
                        title={MOVIE_GENRES.find(g => g.id === selectedGenre)?.name || 'Genre Results'}
                        items={genreMovies}
                        onOpenModal={onOpenModal}
                        isWatched={isWatched}
                        isLoading={isLoadingGenre}
                    />
                )}
                
                <Row title="Trending Now" items={trending} onOpenModal={onOpenModal} isWatched={isWatched} />
                <AdsterraBanner />
                <Row title="Popular Movies" items={popular} onOpenModal={onOpenModal} isWatched={isWatched} />
                
                {(continueWatchingList.length > 0 || continueWatchingLoading) && (
                    <Row title="Continue Watching" items={continueWatchingList} onOpenModal={onOpenModal} isWatched={isWatched} isLoading={continueWatchingLoading} />
                )}

                {/* --- UG Ipakita ang Row para sa Short Dramas --- */}
                <Row title="Short Dramas & Miniseries" items={shortDramas} onOpenModal={onOpenModal} isWatched={isWatched} />

                <Row title="Top Rated Movies" items={topRated} onOpenModal={onOpenModal} isWatched={isWatched} />
                <Row title="Popular TV Shows" items={tvShows} onOpenModal={onOpenModal} isWatched={isWatched} />

                {(myList.length > 0 || myListLoading) && (
                     <Row title="My List" items={myList} onOpenModal={onOpenModal} isWatched={isWatched} isLoading={myListLoading} />
                )}

                <Row title="Anime" items={anime} onOpenModal={onOpenModal} isWatched={isWatched} isLarge />
                <Row title="Asian Dramas" items={asianDramas} onOpenModal={onOpenModal} isWatched={isWatched} />
            </div>
        </>
    );
};
