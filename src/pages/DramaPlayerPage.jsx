// src/pages/DramaPlayerPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
// --- GIBALIK ANG DAAN NGA IMPORT ---
import { getDramaEpisodeSources } from '../utils/consumetApi';

export const DramaPlayerPage = () => {
    const { episodeId } = useParams();
    // --- GIBALIK ANG DAAN NGA STATE ---
    const [sources, setSources] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        // --- GIBALIK ANG DAAN NGA FUNCTION CALL ---
        getDramaEpisodeSources(episodeId)
            .then(data => {
                // --- GIBALIK ANG DAAN NGA LOGIC ---
                if (data && data.sources && data.sources.length > 0) {
                    const bestSource = data.sources.reduce((prev, current) => (parseInt(prev.quality) > parseInt(current.quality)) ? prev : current);
                    setSources(bestSource);
                } else {
                    setError("No video sources found for this episode.");
                }
            })
            .catch(() => setError("Failed to load video sources."))
            .finally(() => {
                setIsLoading(false);
            });
    }, [episodeId]);

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <div className="max-w-4xl mx-auto">
                {isLoading ? (
                    <div className="aspect-video w-full bg-[var(--bg-secondary)] flex items-center justify-center rounded-lg">
                        <div className="player-loading"></div>
                    </div>
                ) : error ? (
                    <div className="aspect-video w-full bg-[var(--bg-secondary)] flex items-center justify-center rounded-lg text-center">
                        <p className="text-xl text-red-500">{error}</p>
                    </div>
                ) : (
                    <div className="player-wrapper rounded-lg overflow-hidden">
                        <ReactPlayer
                            className="react-player"
                            // --- GIBALIK ANG DAAN NGA URL ---
                            url={sources.url}
                            width="100%"
                            height="100%"
                            controls
                            playing
                        />
                    </div>
                )}
                <div className="mt-4 text-center">
                    <button onClick={() => window.history.back()} className="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700">
                        &larr; Back to Episode List
                    </button>
                </div>
            </div>
        </div>
    );
};