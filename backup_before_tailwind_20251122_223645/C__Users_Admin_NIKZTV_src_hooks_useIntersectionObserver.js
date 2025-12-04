// src/hooks/useIntersectionObserver.js
import { useState, useEffect, useRef } from 'react';

export const useIntersectionObserver = (options) => {
    const [entry, setEntry] = useState(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setEntry(entry);
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                // I-disconnect ang observer human makita
                observer.disconnect(); 
            }
        }, options);

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
     
    }, [ref, options]);

    return [ref, isIntersecting, entry];
};