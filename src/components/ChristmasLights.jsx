// src/components/ChristmasLights.jsx
import React from 'react';

export const ChristmasLights = () => {
    const lights = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${(i * 5)}%`,
        color: ['#ff0000', '#00ff00', '#ffd700', '#4169e1', '#ff1493'][i % 5],
        delay: `${i * 0.15}s`
    }));

    return (
        <div className="fixed top-0 left-0 right-0 z-[40] pointer-events-none">
            <div className="relative w-full h-6">
                {/* Wire with gradient */}
                <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-600/40 to-transparent"></div>
                
                {/* Lights */}
                {lights.map((light) => (
                    <div
                        key={light.id}
                        className="absolute top-1.5 transform -translate-x-1/2"
                        style={{ 
                            left: light.left,
                            animationDelay: light.delay
                        }}
                    >
                        {/* String */}
                        <div className="w-px h-2 bg-gray-600/30 mx-auto"></div>
                        
                        {/* Bulb holder */}
                        <div className="w-2 h-1 bg-gray-700/50 rounded-t-sm mx-auto"></div>
                        
                        {/* Bulb with professional glow */}
                        <div
                            className="w-2.5 h-3.5 rounded-full christmas-light-bulb"
                            style={{ 
                                backgroundColor: light.color,
                                boxShadow: `
                                    0 0 8px ${light.color},
                                    0 0 15px ${light.color}80,
                                    inset 0 -2px 4px rgba(0,0,0,0.3),
                                    inset 0 2px 2px rgba(255,255,255,0.4)
                                `,
                                animation: `bulb-twinkle 2s ease-in-out infinite`,
                                animationDelay: light.delay
                            }}
                        >
                            {/* Shine effect */}
                            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/60 rounded-full blur-[0.5px]"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

