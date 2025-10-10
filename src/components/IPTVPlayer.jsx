import React, { useRef, useEffect } from 'react';
import 'shaka-player/dist/controls.css'; // Import default controls
import shaka from 'shaka-player/dist/shaka-player.ui.js'; // Use standard ES6 import

export const IPTVPlayer = ({ url, isLoading, onCanPlay }) => {
    const videoContainerRef = useRef(null);
    const videoRef = useRef(null);
    const playerRef = useRef(null); // Keep a ref to the player instance
    const uiRef = useRef(null); // Keep a ref to the UI instance

    useEffect(() => {
        const video = videoRef.current;
        const container = videoContainerRef.current;
        if (!video || !container) return;

        // Initialize player and UI
        const player = new shaka.Player(video);
        const ui = new shaka.ui.Overlay(player, container, video);
        ui.getControls();

        playerRef.current = player;
        uiRef.current = ui;

        // Player configuration for optimization
        player.configure({
            streaming: {
                bufferingGoal: 120,
                rebufferingGoal: 10,
                retryParameters: { maxAttempts: 4, baseDelay: 1000 },
            },
            manifest: {
                retryParameters: { maxAttempts: 4, baseDelay: 1000 }
            }
        });

        // Event listener for errors
        const onError = (event) => console.error('Shaka Player Error:', event.detail);
        player.addEventListener('error', onError);

        // Cleanup function to destroy the player instance on unmount
        return () => {
            player.destroy();
            ui.destroy();
        };
    }, []); // Run this setup only once when the component mounts

    // This separate effect handles loading new URLs
    useEffect(() => {
        const player = playerRef.current;
        if (player && url) {
            player.load(url)
                .then(() => {
                    console.log('The video has been loaded successfully!');
                    onCanPlay(); //  <-- THE MISSING CALLBACK IS NOW CALLED
                })
                .catch(e => console.error('Error loading video:', e));
        }
    }, [url, onCanPlay]);


    // This effect handles the loading state visibility
    useEffect(() => {
        if (videoContainerRef.current) {
            const uiContainer = videoContainerRef.current.querySelector('.shaka-ui-container');
            if (uiContainer) {
                uiContainer.style.visibility = isLoading ? 'hidden' : 'visible';
            }
        }
    }, [isLoading]);


    return (
        <div ref={videoContainerRef} className="player-wrapper">
             {isLoading && (
                <div className="player-loading-overlay">
                    <div className="player-loading"></div>
                </div>
            )}
            <video
                ref={videoRef}
                className="react-player"
                autoPlay
                muted // Start muted to help with autoplay policy
                style={{
                    maxWidth: '100%',
                    width: '100%',
                    height: '100%',
                }}
            ></video>
        </div>
    );
};