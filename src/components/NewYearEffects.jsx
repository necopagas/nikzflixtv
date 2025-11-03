// src/components/NewYearEffects.jsx
import React, { useEffect, useRef } from 'react';

export const NewYearEffects = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const confetti = [];
        const numberOfConfetti = 60; // Reduced from 80
        const colors = [
            '#FFD700', '#FF6B6B', '#4ECDC4', 
            '#45B7D1', '#FFA07A', '#98D8C8',
            '#FF1493', '#00FF00', '#FF4500'
        ];

        // Create confetti pieces
        for (let i = 0; i < numberOfConfetti; i++) {
            confetti.push({
                x: Math.random() * width,
                y: Math.random() * height - height,
                speedY: Math.random() * 2.5 + 1.5,
                speedX: Math.random() * 1.5 - 0.75,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 8 - 4,
                type: Math.random() > 0.5 ? 'rect' : 'circle',
                opacity: Math.random() * 0.4 + 0.6
            });
        }

        let animationId;
        let lastTime = performance.now();
        const targetFPS = 60;
        const frameTime = 1000 / targetFPS;

        const drawConfetti = (piece) => {
            ctx.save();
            ctx.globalAlpha = piece.opacity;
            ctx.translate(piece.x, piece.y);
            ctx.rotate((piece.rotation * Math.PI) / 180);
            
            // Gradient for shimmer effect
            const gradient = ctx.createLinearGradient(-piece.size, -piece.size, piece.size, piece.size);
            gradient.addColorStop(0, piece.color);
            gradient.addColorStop(0.5, piece.color + 'dd');
            gradient.addColorStop(1, piece.color + '88');
            
            ctx.fillStyle = gradient;
            
            // Add slight glow
            ctx.shadowBlur = 6;
            ctx.shadowColor = piece.color;
            
            if (piece.type === 'rect') {
                // Rectangle confetti
                ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 1.5);
            } else {
                // Circle confetti
                ctx.beginPath();
                ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        };

        const animate = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime < frameTime) {
                animationId = requestAnimationFrame(animate);
                return;
            }
            
            lastTime = currentTime - (deltaTime % frameTime);
            
            ctx.clearRect(0, 0, width, height);

            confetti.forEach(piece => {
                drawConfetti(piece);

                // Physics simulation
                piece.y += piece.speedY;
                piece.x += piece.speedX;
                piece.rotation += piece.rotationSpeed;
                
                // Air resistance simulation
                piece.speedY *= 0.998;
                piece.speedX *= 0.995;

                // Reset when out of bounds
                if (piece.y > height + 20) {
                    piece.y = -20;
                    piece.x = Math.random() * width;
                    piece.speedY = Math.random() * 2.5 + 1.5;
                    piece.speedX = Math.random() * 1.5 - 0.75;
                }
                
                if (piece.x > width + 20) {
                    piece.x = -20;
                } else if (piece.x < -20) {
                    piece.x = width + 20;
                }
            });

            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
            style={{ mixBlendMode: 'screen', opacity: 0.85 }}
        />
    );
};
