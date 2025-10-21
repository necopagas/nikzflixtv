import React, { useState, useEffect } from 'react';
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, BACKDROP_PATH } from '../config';
import ReactPlayer from 'react-player';

export const Banner = ({ onOpenModal }) => {
    const [items, setItems] = useState([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [trailerKey, setTrailerKey] = useState(null); 
    const [showVideo, setShowVideo] = useState(false); 

    const item = items[currentItemIndex];

    useEffect(() => {
        fetchData(API_ENDPOINTS.trending)
            .then(data => {
                const validItems = (data.results || []).filter(item => item.backdrop_path);
                setItems(validItems);
                setCurrentItemIndex(Math.floor(Math.random() * validItems.length));
            });
    }, []);

    useEffect(() => {
        if (items.length > 1) {
            const timer = setInterval(() => {
                setCurrentItemIndex(prevIndex => (prevIndex + 1) % items.length);
            }, 15000); 

            return () => clearInterval(timer);
        }
    }, [items]);

    useEffect(() => {
        if (item) {
            setTrailerKey(null); 
            setShowVideo(false); 

            const media_type = item.media_type || (item.title ? 'movie' : 'tv');

            fetchData(API_ENDPOINTS.details(media_type, item.id))
                .then(detailsData => {
                    
                    // --- GI-UPDATE NGA VIDEO SEARCH LOGIC ---
                    const videos = detailsData.videos?.results || [];
                    
                    // 1. Unahon pangita ang "Trailer"
                    let foundVideo = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
                    
                    // 2. Kung walay "Trailer", pangitaon ang "Teaser"
                    if (!foundVideo) {
                        foundVideo = videos.find(v => v.type === 'Teaser' && v.site === 'YouTube');
                    }
                    
                    // 3. Kung wala gihapon, kuhaon ang UNANG video nga gikan sa YouTube
                    if (!foundVideo) {
                        foundVideo = videos.find(v => v.site === 'YouTube');
                    }
                    
                    if (foundVideo) {
                        setTrailerKey(foundVideo.key);
                        setTimeout(() => setShowVideo(true), 1000);
                    } else {
                        // Kung wala gyud video, siguruha nga null
                        setTrailerKey(null);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch trailer", err);
                    setTrailerKey(null);
                });
        }
    }, [item]); 

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
            {/* --- KANI ANG TRAILER PLAYER (z-0) --- */}
            <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
                {trailerKey && (
                    <ReactPlayer
                        url={`https://www.youtube.com/watch?v=${trailerKey}`}
                        playing={true}
                        muted={true}
                        loop={true}
                        width="100%"
                        height="100%"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(1.5)', 
                            opacity: showVideo ? 1 : 0,
                            transition: 'opacity 1s ease-in-out',
                        }}
                        config={{
                            youtube: {
                                playerVars: {
                                    autoplay: 1, controls: 0, disablekb: 1, showinfo: 0,
                                    modestbranding: 1, fs: 0, cc_load_policy: 0,
                                    iv_load_policy: 3, autohide: 1,
                                }
                            }
                        }}
                    />
                )}
            </div>
            
            {/* Ang `.banner::after` (ang gradient) kay naa sa z-index: 1 
              mao nga naa siya sa TALIWALA sa video ug sa text.
              Ato ning i-double check sa CSS.
            */}

            {/* --- KANI ANG CONTENT (z-10) --- */}
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