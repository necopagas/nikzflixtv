import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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
                    <i className="fa-solid fa-clapperboard text-red-600 text-2xl sm:text-3xl"></i>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E50914]">NikzFlix</h1>
                </a>
                <nav className="hidden md:flex items-center space-x-6">
                    <NavLink to="/" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Home</NavLink>
                    <NavLink to="/anime" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Anime</NavLink>
                    {/* <NavLink to="/manga" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Manga</NavLink> */} {/* <-- REMOVED */}
                    <NavLink to="/drama" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Drama</NavLink>
                    <NavLink to="/my-list" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>My List</NavLink>
                    <NavLink to="/live-tv" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Live TV</NavLink>
                    
                    {/* --- DUGANG NGA LINK PARA SA DESKTOP --- */}
                    <NavLink to="/videoke" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Videoke</NavLink>
                    
                    <NavLink to="/chat-room" className={({isActive}) => `font-semibold hover:text-[var(--brand-color)] transition-colors ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Chat Room</NavLink>
                </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex items-center gap-2 sm:gap-4">
                    <form onSubmit={handleSearch} className="flex items-center">
                        <div className="search-container relative flex items-center">
                            <button type="submit" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                                <i className="fa-solid fa-search"></i>
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
                    <button type="button" onClick={onOpenSettings} className="theme-toggle" title="Settings"><i className="fas fa-cog"></i></button>
                    <button type="button" onClick={toggleTheme} className="theme-toggle" title="Toggle Theme"><i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i></button>
                    <div className="clock text-xl font-semibold whitespace-nowrap">{clock}</div>
                    <div className="relative">
                        {currentUser ? (
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold">
                                {currentUser.email.charAt(0).toUpperCase()}
                            </button>
                        ) : (
                            <button onClick={() => navigate('/auth')} className="px-4 py-2 bg-[var(--brand-color)] rounded-md font-semibold">
                                Login
                            </button>
                        )}
                        {currentUser && isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50">
                                <div className="px-4 py-2 text-sm text-[var(--text-secondary)] border-b border-[var(--border-color)]">{currentUser.email}</div>
                                <a href="#" onClick={navigateToProfile} className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">My Profile</a>
                                <a href="#" onClick={handleLogout} className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">Logout</a>
                            </div>
                        )}
                    </div>
                </div>

                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-2xl z-[1001]">
                    <i className={isMobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
                </button>
            </div>

            <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <nav className="flex flex-col items-center space-y-8 pt-24 text-xl">
                    <NavLink to="/" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Home</NavLink>
                    <NavLink to="/anime" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Anime</NavLink>
                    {/* <NavLink to="/manga" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Manga</NavLink> */} {/* <-- REMOVED */}
                    <NavLink to="/drama" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Drama</NavLink>
                    <NavLink to="/my-list" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>My List</NavLink>
                    <NavLink to="/live-tv" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Live TV</NavLink>
                    
                    {/* --- DUGANG NGA LINK PARA SA MOBILE --- */}
                    <NavLink to="/videoke" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Videoke</NavLink>
                    
                    <NavLink to="/chat-room" onClick={handleNavLinkClick} className={({isActive}) => `font-semibold ${isActive ? 'text-[var(--brand-color)]' : ''}`}>Chat Room</NavLink>

                    <div className="w-full px-4">
                        <form onSubmit={handleSearch} className="flex items-center">
                            <div className="search-container relative flex items-center w-full">
                                <button type="submit" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"><i className="fa-solid fa-search"></i></button>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input w-full border-2 border-transparent p-3 pl-12 rounded-full"
                                    placeholder="Search..."
                                />
                            </div>
                        </form>
                    </div>

                    <div className="border-t border-[var(--border-color)] w-full my-4"></div>

                    {currentUser ? (
                         <>
                            <button onClick={navigateToProfile} className="font-semibold">My Profile</button>
                            <button onClick={handleLogout} className="font-semibold">Logout</button>
                         </>
                    ) : (
                        <button onClick={() => { navigate('/auth'); handleNavLinkClick(); }} className="px-6 py-2 bg-[var(--brand-color)] rounded-md font-semibold">
                            Login
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
};