// src/components/SnowEffect.jsx
import React, { useEffect, useRef } from 'react';

export const SnowEffect = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const snowflakes = [];
    const numberOfSnowflakes = 50; // Further optimized

    // Create snowflakes with better properties
    for (let i = 0; i < numberOfSnowflakes; i++) {
      snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3.5 + 1.5,
        speed: Math.random() * 1.5 + 0.5,
        wind: Math.random() * 0.8 - 0.4,
        opacity: Math.random() * 0.5 + 0.5,
        swing: Math.random() * 0.3,
        swingSpeed: Math.random() * 0.008 + 0.003,
      });
    }

    let time = 0;
    let animationId;
    let lastTime = performance.now();
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;

    const animate = currentTime => {
      const deltaTime = currentTime - lastTime;

      // Skip frame if we're running too fast
      if (deltaTime < frameTime) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      lastTime = currentTime - (deltaTime % frameTime);

      ctx.clearRect(0, 0, width, height);
      time += 0.016; // ~60fps

      snowflakes.forEach(flake => {
        ctx.save();

        // Soft glow effect
        const gradient = ctx.createRadialGradient(
          flake.x,
          flake.y,
          0,
          flake.x,
          flake.y,
          flake.radius * 3
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${flake.opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${flake.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core snowflake
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Smooth swinging motion
        const swing = Math.sin(time * flake.swingSpeed) * flake.swing * 50;
        flake.y += flake.speed;
        flake.x += flake.wind + swing * 0.02;

        // Seamless reset
        if (flake.y > height + 20) {
          flake.y = -20;
          flake.x = Math.random() * width;
        }
        if (flake.x > width + 20) {
          flake.x = -20;
        } else if (flake.x < -20) {
          flake.x = width + 20;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    // Start animation
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
      style={{ mixBlendMode: 'screen', opacity: 0.9 }}
    />
  );
};
