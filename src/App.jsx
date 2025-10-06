import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- STYLING (from original <style> tag) ---
// We include this directly in the component to keep it in a single file.
const GlobalStyles = () => (
    <style>{`
        body {
            background-color: #141414;
            color: white;
            font-family: sans-serif;
        }
        /* General body styling for custom scrollbar */
        body::-webkit-scrollbar {
            width: 8px;
        }
        body::-webkit-scrollbar-track {
            background: #141414;
        }
        body::-webkit-scrollbar-thumb {
            background-color: #E50914;
            border-radius: 20px;
        }

        /* Hide scrollbar for row posters but keep functionality */
        .row-posters::-webkit-scrollbar {
            display: none;
        }
        .row-posters {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
            scroll-behavior: smooth;
        }

        /* Netflix-style poster hover effect */
        .poster {
            transition: transform 0.3s cubic-bezier(0.5, 0, 0.1, 1), z-index 0.3s;
            z-index: 10;
        }
        .poster:hover {
            transform: scale(1.25);
            z-index: 20;
        }
        .row:hover .poster {
            transform: translateX(-25%);
        }
        .row .poster:hover ~ .poster {
            transform: translateX(25%);
        }
        .row .poster:hover {
            transform: scale(1.25) !important;
        }


        /* Banner enhancements */
        .banner::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%),
                        linear-gradient(0deg, #141414 0%, transparent 50%, rgba(0,0,0,0.6) 100%);
            z-index: 1;
        }

        .banner-button {
            transition: transform 0.2s, background-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            border: 1px solid transparent;
        }
        .banner-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.7);
            border-color: rgba(255,255,255,0.2);
        }
        .banner-title, .banner-desc {
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 1);
        }
        
        /* Netflix-inspired Modal styling */
        .modal-body {
            max-height: 90vh;
            overflow-y: auto;
            background-color: #181818;
            border-radius: 8px;
        }
        .modal-body::-webkit-scrollbar {
            width: 8px;
        }
        .modal-body::-webkit-scrollbar-thumb {
            background-color: #4d4d4d;
            border-radius: 10px;
        }

        /* Player loading animation */
        .player-loading::after {
            content: '';
            width: 40px;
            height: 40px;
            border: 3px solid rgba(229,9,20,0.3);
            border-radius: 50%;
            border-top-color: #E50914;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Header scrolled state */
        .header.scrolled {
            background-color: #141414 !important;
        }

        /* Search input enhancement */
        .search-input {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .search-input:focus {
            background: rgba(255,255,255,0.1);
            border-color: #E50914;
            box-shadow: 0 0 15px rgba(229,9,20,0.3);
        }
        .search-container:hover .clear-search-btn, .search-input:focus + .clear-search-btn {
             opacity: 1;
             visibility: visible;
        }

        /* Skeleton loader animation */
        .skeleton {
            background: linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 0.375rem;
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }

        /* Episode button enhancements */
        .episodes button {
            transition: all 0.3s ease;
            border: 2px solid transparent;
            background: #333;
        }
        .episodes button:hover {
            background: #444;
            transform: translateY(-2px);
            border-color: rgba(255,255,255,0.2);
        }
        .episodes button.active {
            background: #E50914;
            color: white;
            box-shadow: 0 0 15px rgba(229,9,20,0.4);
            font-weight: bold;
        }
        
        /* Player Source Buttons */
        .source-btn {
            background-color: #333;
        }
        .source-btn.active {
            background-color: #E50914;
            color: white;
            font-weight: bold;
        }

        /* Row scroll arrows */
        .scroll-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            padding: 2.2rem 0.75rem;
            cursor: pointer;
            z-index: 40;
            opacity: 0;
            transition: opacity 0.3s ease, background-color 0.3s;
        }
        .row:hover .scroll-arrow {
            opacity: 1;
        }
        .scroll-arrow:hover {
            background-color: rgba(0, 0, 0, 0.9);
        }
        .scroll-arrow.left-arrow {
            left: 0;
            border-radius: 0 8px 8px 0;
        }
        .scroll-arrow.right-arrow {
            right: 0;
            border-radius: 8px 0 0 8px;
        }
        .clock {
            text-shadow: 1px 1px 4px rgba(0,0,0,0.7);
        }
    `}</style>
);


// --- CONFIGURATION ---
const API_KEY = "5ecfe0808a2433b007dee3a9f6ae26a5";
const IMG_PATH = "https://image.tmdb.org/t/p/w500";
const BACKDROP_PATH = "https://image.tmdb.org/t/p/original";

const API_ENDPOINTS = {
    trending: `https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`,
    popular: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`,
    toprated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`,
    tvshows: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`,
    anime: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=210024&sort_by=popularity.desc`,
    asianDramas: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=18&with_origin_country=KR,JP,CN,TH&sort_by=popularity.desc`,
    search: (query) => `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`,
    details: (type, id) => `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&append_to_response=videos,credits,external_ids`
};

const EMBED_URLS = {
    vidsrc: {
        movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=true`,
        tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?autoPlay=true`,
    },
    multiembed: {
        movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
        tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    },
    godrive: {
        movie: (imdb_id) => imdb_id ? `https://godriveplayer.com/player.php?imdb=${imdb_id}` : '',
        tv: (id, s, e) => `https://godriveplayer.com/player.php?type=series&tmdb=${id}&season=${s}&episode=${e}`,
    },
    '111movies': {
        movie: (id) => `https://111movies.com/movie/${id}`,
        tv: (id, s, e) => `https://111movies.com/tv/${id}/${s}/${e}`,
    },
    videasy: {
        movie: (imdb_id) => imdb_id ? `https://player.videasy.net/${imdb_id}` : '',
        tv: (imdb_id, s, e) => imdb_id ? `https://player.videasy.net/${imdb_id}/${s}-${e}` : '',
    }
};

const SOURCE_ORDER = ['vidsrc', 'multiembed', 'godrive', '111movies', 'videasy'];


// --- HELPER HOOKS & FUNCTIONS ---
const useMyList = () => {
    const [myList, setMyList] = useState(() => JSON.parse(localStorage.getItem('myNikzflixList')) || []);

    useEffect(() => {
        localStorage.setItem('myNikzflixList', JSON.stringify(myList));
    }, [myList]);

    const isItemInMyList = (itemId) => myList.some(item => item.id === itemId);

    const addToMyList = (item) => {
        if (!isItemInMyList(item.id)) {
            setMyList(prevList => [...prevList, item]);
        }
    };

    const removeFromMyList = (itemId) => {
        setMyList(prevList => prevList.filter(item => item.id !== itemId));
    };
    
    const toggleMyList = (item) => {
        if (isItemInMyList(item.id)) {
            removeFromMyList(item.id);
        } else {
            addToMyList(item);
        }
    };

    return { myList, isItemInMyList, toggleMyList };
};

const useClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


// --- API FETCHER ---
const fetchData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Fetch failed for ${url}:`, error);
        throw error;
    }
};


// --- COMPONENTS ---

const Header = ({ searchQuery, setSearchQuery }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const clock = useClock();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    const handleNavClick = (e, targetId) => {
        e.preventDefault();
        document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <header className={`header fixed top-0 left-0 w-full px-4 sm:px-8 md:px-16 py-4 flex items-center justify-between z-50 transition-colors duration-300 bg-transparent ${isScrolled ? 'scrolled' : ''}`}>
            <div className="flex items-center space-x-8">
                 <a href="#banner" onClick={(e) => handleNavClick(e, '#banner-section')} className="flex items-center space-x-2 cursor-pointer">
                    <i className="fa-solid fa-clapperboard text-red-600 text-3xl"></i>
                    <h1 className="text-3xl font-extrabold text-[#E50914]">NikzFlix</h1>
                </a>
                 <nav className="hidden md:flex">
                    <ul className="flex space-x-6 text-sm">
                        {['Home', 'TV Shows', 'Movies', 'Anime', 'Asian Dramas', 'My List'].map(item => {
                             const targetId = `#${item.toLowerCase().replace(' ', '-')}-container`;
                             return (
                                <li key={item}>
                                    <a href={targetId} onClick={(e) => handleNavClick(e, targetId)} className="font-bold hover:text-gray-300 transition duration-150">{item}</a>
                                </li>
                             )
                        })}
                    </ul>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <div className="search-container relative flex items-center">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"></i>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input bg-gray-800/80 border-2 border-transparent text-white p-2 pl-10 rounded-md w-40 sm:w-64 focus:w-72 focus:outline-none transition-all duration-300" 
                        placeholder="Search..."
                    />
                     {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="clear-search-btn absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-opacity">
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
                <div className="clock hidden sm:block text-xl font-semibold text-gray-200 whitespace-nowrap">{clock}</div>
            </div>
        </header>
    );
};

const Banner = ({ items, onOpenModal }) => {
    const [bannerItem, setBannerItem] = useState(null);

    useEffect(() => {
        if (items?.length) {
            const validItem = items.find(i => i.backdrop_path) || items[0];
            setBannerItem(validItem);
        }
    }, [items]);

    if (!bannerItem) {
        return (
             <div className="banner h-[70vh] sm:h-[90vh] bg-cover bg-center relative flex flex-col justify-center px-4 sm:px-8 md:px-16 text-white bg-black">
                <div className="banner-content max-w-lg z-10 -mt-16 sm:-mt-24">
                     <div className="h-12 w-3/4 mb-4 skeleton"></div>
                     <div className="h-20 w-full mb-8 skeleton"></div>
                </div>
             </div>
        )
    }

    return (
        <div id="banner-section" className="banner h-[70vh] sm:h-[90vh] bg-cover bg-center relative flex flex-col justify-center px-4 sm:px-8 md:px-16 text-white" style={{ backgroundImage: `url(${BACKDROP_PATH + bannerItem.backdrop_path})` }}>
            <div className="banner-content max-w-lg z-10 -mt-16 sm:-mt-24">
                <h1 className="banner-title text-4xl sm:text-6xl font-extrabold mb-4 drop-shadow-2xl">{bannerItem.title || bannerItem.name}</h1>
                <p className="banner-desc text-sm sm:text-lg mb-8 h-20 overflow-hidden text-ellipsis text-gray-200">{bannerItem.overview ? `${bannerItem.overview.substring(0, 150)}...` : "No description available."}</p>
                <div className="banner-buttons flex space-x-4">
                    <button onClick={() => onOpenModal(bannerItem, true)} className="banner-button px-8 py-3 bg-white text-black font-bold text-lg rounded-md hover:bg-gray-300 flex items-center gap-2">
                        <i className="fa-solid fa-play"></i> Play
                    </button>
                    <button onClick={() => onOpenModal(bannerItem)} className="banner-button px-8 py-3 bg-gray-600/70 text-white font-bold text-lg rounded-md hover:bg-gray-500/80 flex items-center gap-2">
                        <i className="fa-solid fa-circle-info"></i> More Info
                    </button>
                </div>
            </div>
        </div>
    );
};

const Poster = ({ item, onOpenModal }) => {
    if (!item?.poster_path) return null;
    return (
        <div className="poster w-40 sm:w-48 md:w-56 flex-shrink-0 relative rounded-md overflow-hidden bg-[#222]" onClick={() => onOpenModal(item)}>
            <img 
                src={IMG_PATH + item.poster_path} 
                alt={item.title || item.name || 'Untitled'} 
                loading="lazy" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/500x750/141414/E50914?text=No+Image'; }}
            />
        </div>
    );
};

const Row = ({ title, items, onOpenModal, isLoading, id }) => {
    const scrollRef = useRef(null);

    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.9;
            scrollRef.current.scrollLeft = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
        }
    };
    
    return (
        <div id={id} className="row-container">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">{title}</h2>
            <div className="row relative group">
                <div ref={scrollRef} className="row-posters flex overflow-x-scroll overflow-y-hidden space-x-2 py-4">
                    {isLoading && Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton w-40 sm:w-48 md:w-56 h-60 sm:h-64 md:h-72 flex-shrink-0"></div>)}
                    {!isLoading && items?.map(item => <Poster key={item.id} item={item} onOpenModal={onOpenModal} />)}
                    {!isLoading && items?.length === 0 && <p className="text-gray-400 p-4">No content found.</p>}
                </div>
                <button className="scroll-arrow left-arrow" onClick={() => handleScroll('left')}><i className="fas fa-chevron-left"></i></button>
                <button className="scroll-arrow right-arrow" onClick={() => handleScroll('right')}><i className="fas fa-chevron-right"></i></button>
            </div>
        </div>
    );
};

const Modal = ({ item, onClose, isItemInMyList, onToggleMyList }) => {
    const [details, setDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPlayer, setShowPlayer] = useState(false);
    const [playerUrl, setPlayerUrl] = useState('');
    const [activeEpisode, setActiveEpisode] = useState({ s: 1, e: 1 });
    const [activeSource, setActiveSource] = useState(SOURCE_ORDER[0]);
    const [playerIsLoading, setPlayerIsLoading] = useState(false);
    
    const failoverTimeoutRef = useRef(null);
    const modalRef = useRef(null);

    const type = item.media_type || (item.title ? "movie" : "tv");

    const getPlayerUrl = useCallback((source, type, details, season, episode) => {
        const urlBuilder = EMBED_URLS[source];
        if (!urlBuilder) return '';

        if (type === 'movie') {
            return urlBuilder.movie(details.id, details.external_ids?.imdb_id);
        } else {
            return urlBuilder.tv(details.id, season, episode, details.external_ids?.imdb_id);
        }
    }, []);

    const trySource = useCallback((sourceIndex) => {
        clearTimeout(failoverTimeoutRef.current);
        if (sourceIndex >= SOURCE_ORDER.length || !details) {
            console.error("All sources failed.");
            setPlayerIsLoading(false);
            setPlayerUrl('about:blank');
            return;
        }

        const source = SOURCE_ORDER[sourceIndex];
        setActiveSource(source);
        setPlayerIsLoading(true);

        const url = getPlayerUrl(source, type, details, activeEpisode.s, activeEpisode.e);
        if (!url) {
            console.log(`No URL for ${source}, trying next.`);
            trySource(sourceIndex + 1);
            return;
        }
        
        setPlayerUrl(url);

        failoverTimeoutRef.current = setTimeout(() => {
            console.warn(`Source ${source} timed out. Trying next...`);
            trySource(sourceIndex + 1);
        }, 8000);

    }, [details, type, activeEpisode, getPlayerUrl]);
    
    useEffect(() => {
        if (!item) return;
        setIsLoading(true);
        const fetchDetails = async () => {
            try {
                const data = await fetchData(API_ENDPOINTS.details(type, item.id));
                setDetails(data);
            } catch (error) {
                console.error("Failed to fetch modal details:", error);
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [item, type, onClose]);

    useEffect(() => {
        const handleKeydown = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleKeydown);
        document.body.style.overflow = 'hidden';
        
        return () => {
            window.removeEventListener('keydown', handleKeydown);
            document.body.style.overflow = 'auto';
            clearTimeout(failoverTimeoutRef.current);
        };
    }, [onClose]);
    
    const handlePlayClick = () => {
        setShowPlayer(true);
        if(details) trySource(0);
        setTimeout(() => modalRef.current?.scrollTo({ top: modalRef.current.scrollHeight, behavior: 'smooth' }), 100);
    };
    
    const handleEpisodeClick = (s, e) => {
        setActiveEpisode({ s, e });
        setShowPlayer(true);
        trySource(0);
    };
    
    const handleSourceClick = (source) => {
        const startIndex = SOURCE_ORDER.indexOf(source);
        if (startIndex !== -1) trySource(startIndex);
    };
    
    if (!item) return null;

    const trailer = details?.videos?.results?.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
    
    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000] overflow-y-auto p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-[#181818] w-full max-w-4xl rounded-lg shadow-2xl relative transform scale-100 transition-all duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div ref={modalRef} className="modal-body">
                    {isLoading || !details ? (
                        <div className="h-[60vh] w-full skeleton"></div>
                    ) : (
                        <>
                        <div className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: `url(${BACKDROP_PATH + (details.backdrop_path || details.poster_path)})` }}>
                           {trailer?.key && <div className="absolute inset-0 z-10"><iframe src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&rel=0&loop=1&playlist=${trailer.key}`} className="w-full h-full" allow="autoplay; encrypted-media"></iframe></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent z-20"></div>
                            <div className="absolute bottom-0 left-0 p-8 z-30">
                                <h2 className="text-5xl font-bold mb-4 drop-shadow-lg">{details.title || details.name}</h2>
                                <div className="flex flex-wrap items-center gap-4">
                                    <button onClick={handlePlayClick} className="flex items-center space-x-2 bg-white text-black px-8 py-3 rounded-md hover:bg-opacity-80 transition-all duration-300 hover:scale-105 font-bold">
                                        <i className="fas fa-play"></i><span>Play</span>
                                    </button>
                                    <button onClick={() => onToggleMyList({ ...item, ...details})} className={`flex items-center justify-center bg-gray-500/30 text-white w-14 h-14 rounded-full hover:bg-opacity-70 transition-all duration-300 hover:scale-110 border-2 ${isItemInMyList(item.id) ? 'border-white' : 'border-gray-400'}`}>
                                        <i className={`fas ${isItemInMyList(item.id) ? 'fa-check' : 'fa-plus'} text-xl`}></i>
                                    </button>
                                </div>
                            </div>
                            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 z-50">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2">
                                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-300">
                                    <span className="font-bold text-green-500">{`${Math.round(details.vote_average * 10)}% Match`}</span>
                                    <span>{new Date(details.release_date || details.first_air_date).getFullYear()}</span>
                                    <span>{details.runtime ? `${details.runtime} min` : `${details.number_of_seasons || 1} Seasons`}</span>
                                    <span className="border border-gray-500 px-2 rounded-sm">{details.adult ? '18+' : 'All'}</span>
                                </div>
                                <p className="text-base text-gray-200 mb-6">{details.overview}</p>
                            </div>
                            <div>
                                 <p className="text-sm text-gray-500 mb-2">Genres:</p>
                                 <p className="text-sm text-gray-300">{details.genres.map(g => g.name).join(', ')}</p>
                            </div>
                        </div>

                        <div className="px-8 pb-4">
                            <div className="flex items-center space-x-2 border-t border-gray-700 pt-4 flex-wrap gap-2">
                                <h3 className="text-md font-semibold text-gray-400 w-full mb-2">Player Source:</h3>
                                {SOURCE_ORDER.map(source => (
                                    <button key={source} onClick={() => handleSourceClick(source)} className={`source-btn px-4 py-1 rounded-md text-sm font-semibold transition-colors ${activeSource === source ? 'active' : ''}`}>{source.charAt(0).toUpperCase() + source.slice(1)}</button>
                                ))}
                            </div>
                        </div>
                        
                        {type === 'tv' && (
                            <div className="episodes px-8 pb-8 space-y-4">
                                {details.seasons?.filter(s => s.season_number >= 1 && s.episode_count > 0).map(season => (
                                    <div key={season.id} className="mb-4">
                                        <h4 className="text-lg font-semibold mb-3 text-gray-300">Season {season.season_number}</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {Array.from({length: season.episode_count}, (_, i) => i + 1).map(epNum => (
                                                <button 
                                                    key={epNum} 
                                                    onClick={() => handleEpisodeClick(season.season_number, epNum)} 
                                                    className={`episode-btn px-4 py-2 rounded-lg text-sm ${activeEpisode.s === season.season_number && activeEpisode.e === epNum ? 'active' : ''}`}
                                                >
                                                    {`E${epNum}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showPlayer && (
                             <div className="player-container bg-black rounded-b-lg overflow-hidden">
                                <div className="player-wrapper relative pt-[56.25%]">
                                    <iframe 
                                        id="player"
                                        src={playerUrl} 
                                        className="absolute inset-0 w-full h-full" 
                                        frameBorder="0" 
                                        allowFullScreen
                                        onLoad={() => {
                                            setPlayerIsLoading(false);
                                            clearTimeout(failoverTimeoutRef.current);
                                        }}
                                        onError={() => {
                                            console.error(`Source ${activeSource} failed with an error. Trying next...`);
                                            trySource(SOURCE_ORDER.indexOf(activeSource) + 1);
                                        }}
                                    ></iframe>
                                    {playerIsLoading && <div className="player-loading absolute inset-0 flex justify-center items-center bg-black/80 z-10"></div>}
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
    const [categories, setCategories] = useState({
        trending: { title: "Trending Now", data: [], isLoading: true, endpoint: API_ENDPOINTS.trending, id: 'trending-container' },
        anime: { title: "Anime", data: [], isLoading: true, endpoint: API_ENDPOINTS.anime, id: 'anime-container' },
        popular: { title: "Popular Movies", data: [], isLoading: true, endpoint: API_ENDPOINTS.popular, id: 'movies-container' },
        asianDramas: { title: "Asian Dramas", data: [], isLoading: true, endpoint: API_ENDPOINTS.asianDramas, id: 'asian-dramas-container' },
        toprated: { title: "Top Rated", data: [], isLoading: true, endpoint: API_ENDPOINTS.toprated, id: 'top-rated-container' },
        tvshows: { title: "Popular TV Shows", data: [], isLoading: true, endpoint: API_ENDPOINTS.tvshows, id: 'tv-shows-container' },
    });
    const [modalItem, setModalItem] = useState(null);
    const [playOnOpen, setPlayOnOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(true);
    
    const { myList, isItemInMyList, toggleMyList } = useMyList();

    useEffect(() => {
        setGlobalLoading(true);
        const fetchAllCategories = async () => {
            const promises = Object.entries(categories).map(async ([key, value]) => {
                try {
                    const response = await fetchData(value.endpoint);
                    return { key, data: response.results };
                } catch (error) {
                    console.error(`Failed to load ${key}`);
                    return { key, data: [] };
                }
            });
            
            const results = await Promise.all(promises);
            
            setCategories(prev => {
                const newState = { ...prev };
                results.forEach(({ key, data }) => {
                    newState[key] = { ...newState[key], data, isLoading: false };
                });
                return newState;
            });
            setGlobalLoading(false);
        };
        fetchAllCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Debounced search effect
    useEffect(() => {
        if (searchQuery.length < 3) {
             setSearchResults([]);
             setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const handler = setTimeout(() => {
            fetchData(API_ENDPOINTS.search(searchQuery))
                .then(data => {
                    const filtered = data.results.filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'));
                    setSearchResults(filtered);
                })
                .catch(err => console.error("Search failed:", err))
                .finally(() => setIsSearching(false));
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery]);


    const handleOpenModal = (item, play = false) => {
        setModalItem(item);
        setPlayOnOpen(play);
    };

    const handleCloseModal = () => {
        setModalItem(null);
        setPlayOnOpen(false);
    };
    
    return (
        <>
            <GlobalStyles />
            {globalLoading && (
                 <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[5000]">
                    <div className="w-16 h-16 border-4 border-t-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
                </div>
            )}
            
            <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            
            <Banner items={categories.trending.data} onOpenModal={handleOpenModal} />
            
            <main className="px-4 sm:px-8 md:px-16 -mt-10 sm:-mt-24 z-20 relative space-y-10 pb-20">
                 {searchQuery.length > 2 ? (
                    <Row title="Search Results" items={searchResults} onOpenModal={handleOpenModal} isLoading={isSearching} id="search-results-container" />
                ) : (
                    <>
                    {myList.length > 0 && <Row title="My List" items={myList} onOpenModal={handleOpenModal} isLoading={false} id="my-list-container" />}
                    {Object.values(categories).map(cat => (
                        <Row key={cat.title} title={cat.title} items={cat.data} onOpenModal={handleOpenModal} isLoading={cat.isLoading} id={cat.id} />
                    ))}
                    </>
                )}
            </main>
            
            {modalItem && <Modal item={modalItem} onClose={handleCloseModal} isItemInMyList={isItemInMyList} onToggleMyList={toggleMyList} playOnOpen={playOnOpen} />}
        </>
    );
}
