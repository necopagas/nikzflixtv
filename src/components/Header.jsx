import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SANTA_HAT_USER } from '../assets/santaHatUser';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
// Icons (use react-icons for consistent, lightweight icons)
import {
  FaSearch,
  FaCog,
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
  FaPlay,
  FaChevronDown,
} from 'react-icons/fa';

const PRIMARY_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/anime', label: 'Anime' },
  { to: '/drama', label: 'Drama' },
  { to: '/my-list', label: 'My List' },
  { to: '/live-tv', label: 'Live TV' },
  { to: '/videoke', label: 'Videoke' },
];

const MORE_NAV_LINKS = [
  { to: '/vivamax', label: 'Vivamax', isLogo: true },
  { to: '/chat-room', label: 'Chat Room' },
];

const ALL_NAV_LINKS = [...PRIMARY_NAV_LINKS, ...MORE_NAV_LINKS];

const desktopNavLinkClass = ({ isActive }) =>
  `px-3 py-2 font-semibold hover:text-[var(--brand-color)] transition-all duration-200 rounded-md hover:bg-[var(--bg-tertiary)] ${
    isActive ? 'text-[var(--brand-color)] bg-[var(--bg-tertiary)]' : ''
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`;

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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const clock = useClock();

  const { currentUser, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen(prev => !prev), []);

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

    const tryLoad = src =>
      new Promise((resolve, reject) => {
        try {
          const img = new Image();
          img.onload = () => resolve(src);
          img.onerror = reject;
          img.src = src;
        } catch (e) {
          reject(e);
        }
      });

    // 1) Prefer public PNG (transparent)
    tryLoad('/assets/santa-hat.png')
      .then(ok => setHatSrc(ok))
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

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsProfileOpen(false);
    }
  }, [isMobileMenuOpen]);

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      closeMobileMenu();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      closeMobileMenu();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navigateToProfile = () => {
    setIsProfileOpen(false);
    navigate('/profile');
    closeMobileMenu();
  };

  const handleOpenSettings = () => {
    closeMobileMenu();
    onOpenSettings();
  };

  return (
    <header
      className={`header fixed top-0 left-0 w-full px-4 sm:px-8 py-4 flex items-center justify-between z-50 transition-colors duration-300 ${isScrolled ? 'scrolled' : ''}`}
    >
      <div className="flex items-center space-x-4 md:space-x-8">
        <a
          href="/"
          onClick={e => {
            e.preventDefault();
            navigate('/');
          }}
          className="flex items-center space-x-2 cursor-pointer"
        >
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
        <nav className="flex items-center gap-8" aria-label="Primary navigation">
          {PRIMARY_NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} className={desktopNavLinkClass}>
              {link.label}
            </NavLink>
          ))}

          {/* More Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="px-3 py-2 font-semibold hover:text-[var(--brand-color)] transition-all duration-200 rounded-md hover:bg-[var(--bg-tertiary)] flex items-center gap-2"
              aria-expanded={isMoreMenuOpen}
              aria-haspopup="true"
            >
              More
              <FaChevronDown
                className={`text-xs transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isMoreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMoreMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute top-full mt-2 right-0 bg-[var(--bg-secondary)] rounded-md shadow-lg py-2 min-w-[200px] z-50 border border-[var(--border-color)]">
                  {/* Search in dropdown */}
                  <div className="px-3 py-2 border-b border-[var(--border-color)]">
                    <form onSubmit={handleSearch} className="flex items-center">
                      <div className="search-container relative flex items-center w-full">
                        <button
                          type="submit"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
                          aria-label="Search"
                        >
                          <FaSearch className="text-sm" />
                        </button>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="search-input border-2 border-transparent p-2 pl-8 rounded-md w-full focus:outline-none text-sm"
                          placeholder="Search..."
                          aria-label="Search titles"
                        />
                      </div>
                    </form>
                  </div>

                  {/* Navigation links */}
                  {MORE_NAV_LINKS.map(link => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2 hover:bg-[var(--bg-tertiary)] hover:text-[var(--brand-color)] transition-colors ${
                          isActive ? 'text-[var(--brand-color)] bg-[var(--bg-tertiary)]' : ''
                        }`
                      }
                    >
                      {link.isLogo ? (
                        <img
                          src="https://raw.githubusercontent.com/necopagas/nikzflixtv/refs/heads/main/public/vivamax-logo.png"
                          alt={link.label}
                          className="h-5 inline-block"
                        />
                      ) : (
                        link.label
                      )}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile icons - shown before hamburger menu */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={handleOpenSettings}
            className="theme-toggle text-xl"
            title="Settings"
            aria-label="Open settings"
          >
            <FaCog />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle text-xl"
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
        </div>

        {/* Desktop Right Section - Organized into compartments */}
        <div className="hidden md:flex items-center gap-6">
          {/* Actions Compartment */}
          <div className="header-compartment actions-compartment flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenSettings}
              className="theme-toggle"
              title="Settings"
              aria-label="Open settings"
            >
              <FaCog />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
            <div className="clock text-xl font-semibold whitespace-nowrap">{clock}</div>
          </div>

          {/* Divider */}
          <div className="header-divider"></div>

          {/* User Compartment */}
          <div className="header-compartment user-compartment">
            <div className="relative">
              {currentUser ? (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  aria-label="Open profile menu"
                >
                  {currentUser.email.charAt(0).toUpperCase()}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  className="px-3 py-1 bg-[var(--brand-color)] rounded-md font-semibold text-sm"
                >
                  Login
                </button>
              )}
              {currentUser && isProfileOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 text-sm">
                  <div className="px-3 py-2 text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                    {currentUser.email}
                  </div>
                  <button
                    onClick={navigateToProfile}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--bg-tertiary)]"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--bg-tertiary)]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMobileMenu}
          className="md:hidden text-2xl"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobileMenu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={closeMobileMenu} aria-hidden="true" />
      )}

      <div
        className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
        id="mobileMenu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobileMenuTitle"
      >
        <div className="mobile-menu__header">
          <div className="mobile-menu__brand" id="mobileMenuTitle">
            <FaPlay className="text-[var(--brand-color)] text-lg" />
            <span>NikzFlix</span>
          </div>
          <button
            type="button"
            className="mobile-menu__close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mobile-menu__meta">
          <span className="mobile-menu__clock">{clock}</span>
          <div className="mobile-menu__meta-actions">
            <button type="button" onClick={handleOpenSettings} aria-label="Open settings">
              <FaCog />
            </button>
            <button type="button" onClick={() => toggleTheme()} aria-label="Toggle theme">
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
          </div>
        </div>

        <div className="mobile-menu__content">
          {/* Mobile Search Compartment */}
          <div className="mobile-menu__compartment mobile-search-compartment">
            <form onSubmit={handleSearch} className="mobile-menu__search">
              <div className="search-container relative flex items-center w-full">
                <button
                  type="submit"
                  className="absolute top-1/2 -translate-y-1/2 text-gray-400 z-10"
                  aria-label="Search"
                >
                  <FaSearch />
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input"
                  placeholder="Search..."
                  aria-label="Search titles"
                />
              </div>
            </form>
          </div>

          <div className="mobile-menu__divider" />

          {/* Mobile Navigation Compartment */}
          <div className="mobile-menu__compartment mobile-nav-compartment">
            <nav className="mobile-menu__nav" role="navigation" aria-label="Mobile navigation">
              {ALL_NAV_LINKS.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {link.isLogo ? (
                    <img
                      src="https://raw.githubusercontent.com/necopagas/nikzflixtv/refs/heads/main/public/vivamax-logo.png"
                      alt={link.label}
                      className="h-5 inline-block"
                    />
                  ) : (
                    link.label
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mobile-menu__divider" />

          {/* Mobile User Compartment */}
          <div className="mobile-menu__compartment mobile-user-compartment">
            {currentUser ? (
              <div className="mobile-menu__auth">
                <div className="mobile-menu__user-email">{currentUser.email}</div>
                <button type="button" onClick={navigateToProfile}>
                  My Profile
                </button>
                <button type="button" onClick={handleLogout} className="mobile-menu__logout">
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="mobile-menu__login"
                onClick={() => {
                  navigate('/auth');
                  closeMobileMenu();
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
