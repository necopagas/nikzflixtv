// src/components/HalloweenEffects.jsx
import React, { useEffect, useRef } from 'react';

export const HalloweenEffects = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const bats = [];
        const ghosts = [];
        const numberOfBats = 8; // Reduced for performance
        const numberOfGhosts = 5; // Reduced for performance

        // Create bats with better properties
        for (let i = 0; i < numberOfBats; i++) {
            bats.push({
                x: Math.random() * width,
                y: Math.random() * (height / 2),
                speedX: Math.random() * 1.5 + 0.8,
                speedY: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 15 + 12,
                wingFlap: 0,
                flapSpeed: Math.random() * 0.08 + 0.05
            });
        }

        // Create floating ghosts
        for (let i = 0; i < numberOfGhosts; i++) {
            ghosts.push({
                x: Math.random() * width,
                y: Math.random() * height,
                speedX: Math.random() * 0.5 + 0.2,
                speedY: Math.random() * 0.3 - 0.15,
                size: Math.random() * 20 + 15,
                opacity: Math.random() * 0.3 + 0.2,
                float: Math.random() * Math.PI * 2
            });
        }

        let animationId;

        const drawBat = (x, y, size, wingFlap) => {
            ctx.save();
            ctx.translate(x, y);
            
            // Shadow
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255, 80, 0, 0.4)';
            
            ctx.fillStyle = '#1a1a1a';
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 0.5;
            
            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Wings with flapping
            const wingSpread = Math.sin(wingFlap) * size * 0.3;
            
            // Left wing
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-size - wingSpread, -size * 0.6, -size - wingSpread, 0);
            ctx.quadraticCurveTo(-size - wingSpread, size * 0.4, 0, 0);
            ctx.fill();
            ctx.stroke();
            
            // Right wing
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(size + wingSpread, -size * 0.6, size + wingSpread, 0);
            ctx.quadraticCurveTo(size + wingSpread, size * 0.4, 0, 0);
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        };

        const drawGhost = (x, y, size, opacity, float) => {
            ctx.save();
            ctx.globalAlpha = opacity;
            
            // Glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
            gradient.addColorStop(0, 'rgba(200, 200, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(200, 200, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
            
            // Ghost body
            ctx.fillStyle = '#e6e6fa';
            ctx.beginPath();
            ctx.arc(x, y - size * 0.2, size * 0.8, Math.PI, 0);
            ctx.lineTo(x + size * 0.8, y + size * 0.8);
            
            // Wavy bottom
            const waves = 4;
            for (let i = 0; i < waves; i++) {
                const waveX = x + size * 0.8 - (i * size * 0.4);
                const waveY = y + size * 0.8 + Math.sin(float + i) * size * 0.2;
                ctx.quadraticCurveTo(waveX - size * 0.1, waveY + size * 0.1, waveX - size * 0.2, waveY);
            }
            
            ctx.closePath();
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.1, 0, Math.PI * 2);
            ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Animate bats
            bats.forEach(bat => {
                bat.wingFlap += bat.flapSpeed;
                drawBat(bat.x, bat.y, bat.size, bat.wingFlap);

                bat.x += bat.speedX;
                bat.y += bat.speedY;

                if (bat.x > width + 50) {
                    bat.x = -50;
                    bat.y = Math.random() * (height / 2);
                }
                if (bat.y < 0) bat.y = 0;
                if (bat.y > height / 2) bat.y = height / 2;
            });

            // Animate ghosts
            ghosts.forEach(ghost => {
                ghost.float += 0.05;
                drawGhost(ghost.x, ghost.y, ghost.size, ghost.opacity, ghost.float);

                ghost.x += ghost.speedX;
                ghost.y += ghost.speedY + Math.sin(ghost.float) * 0.2;

                if (ghost.x > width + 50) ghost.x = -50;
                if (ghost.y < -50) ghost.y = height + 50;
                if (ghost.y > height + 50) ghost.y = -50;
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
            style={{ mixBlendMode: 'soft-light', opacity: 0.7 }}
        />
    );
};
