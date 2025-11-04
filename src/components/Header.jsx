import React, { useState, useEffect, useMemo } from 'react';
import { SANTA_HAT_USER } from '../assets/santaHatUser';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
// Icons (use react-icons for consistent, lightweight icons)
import { FaSearch, FaCog, FaMoon, FaSun, FaBars, FaTimes, FaPlay } from 'react-icons/fa';

const useClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const Header = ({ theme, toggleTheme, onOpenSettings }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const clock = useClock();

    const { currentUser, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Show holiday hat in November and December
    const showHolidayHat = useMemo(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const forced = localStorage.getItem('nikzflix-hat'); // 'on' | 'off'
            if (params.get('hat') === '1' || forced === 'on') return true;
            if (forced === 'off') return false;
            const m = new Date().getMonth(); // 0=Jan, 10=Nov, 11=Dec
            return m === 10 || m === 11;
        } catch {
            return false;
        }
    }, []);

    // Resolve hat source; prefer transparent PNG in public, else use provided data URL, else SVG
    const [hatSrc, setHatSrc] = useState('/assets/santa-hat.svg');

    useEffect(() => {
        if (!showHolidayHat) return;

        const tryLoad = (src) => new Promise((resolve, reject) => {
            try {
                const img = new Image();
                img.onload = () => resolve(src);
                img.onerror = reject;
                img.src = src;
            } catch (e) { reject(e); }
        });

        // 1) Prefer public PNG (transparent)
        tryLoad('/assets/santa-hat.png')
            .then((ok) => setHatSrc(ok))
            .catch(() => {
                // 2) Then use embedded user image if present
                if (SANTA_HAT_USER && typeof SANTA_HAT_USER === 'string' && SANTA_HAT_USER.length > 0) {
                    setHatSrc(SANTA_HAT_USER);
                } else {
                    // 3) Fallback to vector SVG
                    setHatSrc('/assets/santa-hat.svg');
                }
            });
    }, [showHolidayHat]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim().length > 0) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMobileMenuOpen(false);
        }
    };
    
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            setIsMobileMenuOpen(false);
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navigateToProfile = () => {
        setIsProfileOpen(false);
        navigate('/profile');
        setIsMobileMenuOpen(false);
    };
    
    const handleNavLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <header className={`header fixed top-0 left-0 w-full px-4 sm:px-8 py-4 flex items-center justify-between z-50 transition-colors duration-300 ${isScrolled ? 'scrolled' : ''}`}>
            <div className="flex items-center space-x-4 md:space-x-8">
                <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center space-x-2 cursor-pointer">
                    <FaPlay className="text-red-600 text-2xl sm:text-3xl" />
                    <span className="relative inline-block">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E50914]">NikzFlix</h1>
                        {showHolidayHat && (
                            <img
                                src={hatSrc}
                                alt=""
                                aria-hidden="true"
                                className="absolute -top-4 sm:-top-5 -left-3 sm:-left-4 w-7 sm:w-9 -rotate-12 drop-shadow-md pointer-events-none select-none"
                                onError={() => setHatSrc('/assets/santa-hat.svg')}
                            />
                        )}
                    </span>
                </a>
            </div>

            {/* Centered nav for wider screens */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-4 z-50">
                <nav className="flex items-center space-x-6">
                    <NavLink to="/" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Home</NavLink>
                    <NavLink to="/anime" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Anime</NavLink>
                    <NavLink to="/drama" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Drama</NavLink>
                    <NavLink to="/my-list" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>My List</NavLink>
                    <NavLink to="/live-tv" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Live TV</NavLink>
                    <NavLink to="/videoke" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Videoke</NavLink>
                    <NavLink to="/vivamax" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Vivamax</NavLink>
                    <NavLink to="/chat-room" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Chat Room</NavLink>
                </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile icons - shown before hamburger menu */}
                <div className="flex md:hidden items-center gap-2">
                    <button type="button" onClick={onOpenSettings} className="theme-toggle text-xl" title="Settings">
                        <FaCog />
                    </button>
                    <button type="button" onClick={toggleTheme} className="theme-toggle text-xl" title="Toggle Theme">
                        {theme === 'light' ? <FaMoon /> : <FaSun />}
                    </button>
                </div>

                {/* Desktop icons - shown on larger screens */}
                <div className="hidden md:flex items-center gap-2 sm:gap-4">
                    <form onSubmit={handleSearch} className="flex items-center">
                        <div className="search-container relative flex items-center">
                            <button type="submit" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                                <FaSearch />
                            </button>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input border-2 border-transparent p-2 pl-10 rounded-full w-40 focus:w-64 focus:outline-none"
                                placeholder="Search..."
                            />
                        </div>
                    </form>
                    <button type="button" onClick={onOpenSettings} className="theme-toggle" title="Settings"><FaCog /></button>
                    <button type="button" onClick={toggleTheme} className="theme-toggle" title="Toggle Theme">{theme === 'light' ? <FaMoon /> : <FaSun />}</button>
                    <div className="clock text-xl font-semibold whitespace-nowrap">{clock}</div>
                    <div className="relative">
                        {currentUser ? (
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]">
                                {currentUser.email.charAt(0).toUpperCase()}
                            </button>
                        ) : (
                            <button onClick={() => navigate('/auth')} className="px-3 py-1 bg-[var(--brand-color)] rounded-md font-semibold text-sm">
                                Login
                            </button>
                        )}
                        {currentUser && isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 text-sm">
                                <div className="px-3 py-2 text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)]">{currentUser.email}</div>
                                <button onClick={navigateToProfile} className="w-full text-left px-3 py-2 hover:bg-[var(--bg-tertiary)]">My Profile</button>
                                <button onClick={handleLogout} className="w-full text-left px-3 py-2 hover:bg-[var(--bg-tertiary)]">Logout</button>
                            </div>
                        )}
                    </div>
                </div>

                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-2xl z-[1001]">
                    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <nav className="flex flex-col items-center space-y-6 pt-20 text-lg pb-8">
                    {/* Clock at top of mobile menu */}
                    <div className="text-2xl font-bold text-[var(--brand-color)] mb-2">{clock}</div>
                    
                    <NavLink to="/" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Home</NavLink>
                    <NavLink to="/anime" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Anime</NavLink>
                    {/* <NavLink to="/manga" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Manga</NavLink> */} {/* <-- REMOVED */}
                    <NavLink to="/drama" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Drama</NavLink>
                    <NavLink to="/my-list" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>My List</NavLink>
                    <NavLink to="/live-tv" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Live TV</NavLink>
                    
                    {/* --- DUGANG NGA LINK PARA SA MOBILE --- */}
                    <NavLink to="/videoke" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Videoke</NavLink>
                    <NavLink to="/vivamax" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Vivamax</NavLink>
                    
                    <NavLink to="/chat-room" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Chat Room</NavLink>

                    <div className="w-full px-6 pt-2">
                        <form onSubmit={handleSearch} className="flex items-center">
                            <div className="search-container relative flex items-center w-full">
                                <button type="submit" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"><FaSearch /></button>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input w-full border-2 border-transparent p-2.5 pl-11 rounded-full text-base"
                                    placeholder="Search..."
                                />
                            </div>
                        </form>
                    </div>

                    <div className="border-t border-[var(--border-color)] w-3/4 my-3"></div>

                    {currentUser ? (
                         <>
                            <div className="text-sm text-[var(--text-secondary)] px-4 text-center truncate max-w-full">{currentUser.email}</div>
                            <button onClick={navigateToProfile} className="font-semibold">My Profile</button>
                            <button onClick={handleLogout} className="font-semibold text-red-500">Logout</button>
                         </>
                    ) : (
                        <button onClick={() => { navigate('/auth'); handleNavLinkClick(); }} className="px-6 py-2.5 bg-[var(--brand-color)] rounded-md font-semibold text-base">
                            Login
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
};