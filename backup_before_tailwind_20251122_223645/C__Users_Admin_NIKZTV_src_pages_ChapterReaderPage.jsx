import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChapterPages } from '../utils/consumetApi';

export const ChapterReaderPage = () => {
    const { mangaId, chapterId } = useParams();
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        window.scrollTo(0, 0); // Scroll to top on new chapter
        getChapterPages(chapterId)
            .then(data => {
                if (data && data.length > 0) {
                    setPages(data);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [chapterId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="player-loading"></div>
            </div>
        );
    }
    
    return (
        <div className="pt-24 pb-12 bg-black">
            <div className="text-center mb-6 sticky top-20 z-10">
                 <Link to={`/manga/${mangaId}`} className="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors">
                    &larr; Back to Chapter List
                </Link>
            </div>
            <div className="flex flex-col items-center">
                {pages.map(page => (
                    <img 
                        key={page.page} 
                        src={page.img} 
                        alt={`Page ${page.page}`} 
                        className="max-w-full md:max-w-4xl"
                        loading="lazy"
                    />
                ))}
            </div>
             <div className="text-center mt-8">
                 <Link to={`/manga/${mangaId}`} className="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors">
                    Back to Chapter List
                </Link>
            </div>
        </div>
    );
};