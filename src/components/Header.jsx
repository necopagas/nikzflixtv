import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const Header = ({ theme, toggleTheme }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const clock = useClock();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim().length > 0) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className={`header fixed top-0 left-0 w-full px-4 sm:px-8 py-4 flex items-center justify-between z-50 transition-colors duration-300 ${isScrolled ? 'scrolled' : ''}`}>
            <div className="flex items-center space-x-4 md:space-x-8">
                <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center space-x-2 cursor-pointer">
                    <i className="fa-solid fa-clapperboard text-red-600 text-2xl sm:text-3xl"></i>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E50914]">NikzFlix</h1>
                </a>
            </div>
            
            {/* --- RESPONSIVE SEARCH AND CONTROLS --- */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 sm:gap-4">
                <div className="search-container relative flex items-center">
                    <button type="submit" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                        <i className="fa-solid fa-search"></i>
                    </button>
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="search-input border-2 border-transparent p-2 pl-10 rounded-full w-32 sm:w-64 focus:w-40 sm:focus:w-72 focus:outline-none" 
                        placeholder="Search..."
                    />
                </div>
                <button type="button" onClick={toggleTheme} className="theme-toggle" title="Toggle Theme">
                    <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                </button>
                {/* Itago ang orasan sa gagmay nga screens */}
                <div className="clock hidden md:block text-xl font-semibold whitespace-nowrap">{clock}</div>
            </form>
        </header>
    );
};