// src/pages/DramaDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDramaDetails } from '../utils/consumetApi';

export const DramaDetailPage = () => {
    const { dramaId } = useParams();
    const navigate = useNavigate();
    const [drama, setDrama] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getDramaDetails(dramaId)
            .then(data => {
                if (data) {
                    setDrama(data);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [dramaId]);

    const handleEpisodeClick = (episodeId) => {
        navigate(`/drama/watch/${episodeId}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="player-loading"></div>
            </div>
        );
    }

    if (!drama) {
        return (
            <div className="text-center py-16 pt-28">
                <p className="text-xl text-[var(--text-secondary)]">Drama not found or failed to load details.</p>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 flex-shrink-0">
                    <img src={drama.image} alt={drama.title} className="w-full rounded-lg shadow-lg" />
                </div>
                <div className="md:w-2/3">
                    <h1 className="text-4xl font-extrabold mb-2">{drama.title}</h1>
                    <p className="text-lg text-[var(--text-secondary)] mb-4">
                        {drama.otherNames?.join(', ')}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {drama.genres?.map(genre => (
                            <span key={genre} className="bg-[var(--bg-tertiary)] text-sm px-3 py-1 rounded-full">
                                {genre}
                            </span>
                        ))}
                    </div>
                    <p className="text-[var(--text-primary)] leading-relaxed">{drama.description}</p>
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-3xl font-bold mb-6 border-b border-[var(--border-color)] pb-2">Episodes</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {drama.episodes?.map(ep => (
                        <button
                            key={ep.id}
                            onClick={() => handleEpisodeClick(ep.id)}
                            className="p-3 bg-[var(--bg-secondary)] rounded-md text-left hover:bg-[var(--bg-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                        >
                            <span className="font-semibold block truncate">Episode {ep.episodeNumber}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};