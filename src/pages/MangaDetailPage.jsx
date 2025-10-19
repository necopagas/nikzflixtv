import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMangaDetails } from '../utils/consumetApi';

export const MangaDetailPage = () => {
    const { mangaId } = useParams();
    const navigate = useNavigate();
    const [manga, setManga] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getMangaDetails(mangaId)
            .then(data => {
                if (data) {
                    setManga(data);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [mangaId]);

    const handleChapterClick = (chapterId) => {
        navigate(`/manga/${mangaId}/chapter/${chapterId}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="player-loading"></div>
            </div>
        );
    }

    if (!manga) {
        return (
            <div className="text-center py-16 pt-28">
                <p className="text-xl text-[var(--text-secondary)]">Manga not found or failed to load details.</p>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 flex-shrink-0">
                    <img src={manga.image} alt={manga.title} className="w-full rounded-lg shadow-lg" />
                </div>
                <div className="md:w-2/3">
                    <h1 className="text-4xl font-extrabold mb-2">{manga.title}</h1>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {manga.genres.map(genre => (
                            <span key={genre} className="bg-[var(--bg-tertiary)] text-sm px-3 py-1 rounded-full">
                                {genre}
                            </span>
                        ))}
                    </div>
                    <p className="text-[var(--text-primary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: manga.description }}></p>
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-3xl font-bold mb-6 border-b border-[var(--border-color)] pb-2">Chapters</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {manga.chapters.map(chapter => (
                        <button
                            key={chapter.id}
                            onClick={() => handleChapterClick(chapter.id)}
                            className="p-3 bg-[var(--bg-secondary)] rounded-md text-left hover:bg-[var(--bg-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                        >
                            <span className="font-semibold block truncate">Chapter {chapter.chapterNumber}</span>
                            {chapter.title && <span className="block text-xs text-[var(--text-secondary)] truncate">{chapter.title}</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};