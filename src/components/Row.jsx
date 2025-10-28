﻿// src/components/Row.jsx
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Poster } from './Poster';
import { useApi } from '../hooks/useApi';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export const Row = ({ title, endpoint, param, items: propItems, onOpenModal, isWatched, isLarge = false, isLoading: propIsLoading = false, query = '' }) => {
    const scrollContainerRef = useRef(null);
    const [rowRef, isVisible] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

    const { items: apiItems, loading: apiLoading } = useApi(endpoint, param);
    const items = endpoint ? apiItems : propItems;
    const isLoading = endpoint ? apiLoading : propIsLoading;

    const visibleItems = useMemo(() => {
        if (!query) return items || [];
        const s = query.trim().toLowerCase();
        return (items || []).filter(item => {
            const t = (item.title || item.name || '').toString().toLowerCase();
            return t.includes(s) || (item.overview || '').toLowerCase().includes(s);
        });
    }, [items, query]);

    const scroll = (scrollOffset) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
        }
    };

    const handleKeyDown = (e) => {
        if (!scrollContainerRef.current) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scroll(-300);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scroll(300);
        }
    };

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const update = () => {
            setCanScrollLeft(el.scrollLeft > 10);
            setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
        };
        update();
        el.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        return () => {
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [items]);

    if (!isLoading && (!items || items.length === 0)) return null;

    return (
        <div ref={rowRef} className={`row-container py-4 ${isVisible ? 'is-visible' : ''}`}>
            <div className="px-6 max-w-7xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
            </div>

            <div className="relative group">
                <button
                    onClick={() => {
                        const el = scrollContainerRef.current;
                        if (!el) return;
                        const step = Math.round(el.clientWidth * 0.8);
                        scroll(-step);
                    }}
                    aria-label={`Scroll ${title} left`}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-24 flex items-center justify-center bg-black/50 hover:bg-black/75 transition-colors duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none`}
                    disabled={!canScrollLeft}
                >
                    <FaChevronLeft className="text-white text-2xl" />
                </button>

                <div
                    ref={scrollContainerRef}
                    className={`row-posters flex snap-x snap-mandatory touch-pan-x overflow-x-scroll overflow-y-visible space-x-4 pl-6 pr-6 py-4 -mx-6 ${isLarge ? 'h-[400px]' : 'h-[300px]'}`}
                    tabIndex={0}
                    aria-label={`${title} carousel`}
                    role="region"
                    onKeyDown={handleKeyDown}
                >
                    {isLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={`skeleton-${title}-${i}`} className={`flex-shrink-0 ${isLarge ? 'w-64' : 'w-40'} snap-start skeleton rounded-md`}></div>
                        ))
                    ) : visibleItems.length === 0 ? (
                        <div className="flex items-center justify-center w-full text-gray-400">No results</div>
                    ) : (
                        visibleItems.map(item => (
                            <div key={item.id} className={`flex-shrink-0 ${isLarge ? 'w-64' : 'w-40'} snap-start`}>
                                <Poster
                                    item={item}
                                    onOpenModal={onOpenModal}
                                    isWatched={isWatched && isWatched(item.id)}
                                    isLarge={isLarge}
                                    season={item.season}
                                    episode={item.episode}
                                    query={query}
                                />
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={() => {
                        const el = scrollContainerRef.current;
                        if (!el) return;
                        const step = Math.round(el.clientWidth * 0.8);
                        scroll(step);
                    }}
                    aria-label={`Scroll ${title} right`}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-24 flex items-center justify-center bg-black/50 hover:bg-black/75 transition-colors duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none`}
                    disabled={!canScrollRight}
                >
                    <FaChevronRight className="text-white text-2xl" />
                </button>
            </div>
        </div>
    );
};
