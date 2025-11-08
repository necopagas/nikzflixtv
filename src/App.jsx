import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { BackToTopButton } from './components/BackToTopButton';
import { SettingsModal } from './components/SettingsModal';
import { ContentLoader } from './components/LoadingSpinner';
import { BraveNotification } from './components/BraveNotification';
import SplashScreen from './components/SplashScreen';
import { useMyList } from './hooks/useMyList';
import { useContinueWatching } from './hooks/useContinueWatching';
import { useTheme } from './hooks/useTheme';
import { useWatchedHistory } from './hooks/useWatchedHistory';
import { useChristmasTheme } from './hooks/useChristmasTheme';
import { AdsterraSocialBar } from './components/AdsterraSocialBar';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { PageTransitionIndicator } from './components/PageTransitionIndicator';
import { useToast } from './components/toastContext.js';

// Lazy load seasonal effects for better performance
const SnowEffect = lazy(() =>
  import('./components/SnowEffect').then(m => ({ default: m.SnowEffect }))
);
const ChristmasLights = lazy(() =>
  import('./components/ChristmasLights').then(m => ({ default: m.ChristmasLights }))
);
const HalloweenEffects = lazy(() =>
  import('./components/HalloweenEffects').then(m => ({ default: m.HalloweenEffects }))
);
const NewYearEffects = lazy(() =>
  import('./components/NewYearEffects').then(m => ({ default: m.NewYearEffects }))
);

// Lazy load pages to keep the initial bundle fast
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage }))
);
const MyListPage = lazy(() => import('./pages/MyListPage').then(m => ({ default: m.MyListPage })));
const IPTVPage = lazy(() => import('./pages/IPTVPage').then(m => ({ default: m.IPTVPage })));
const ChatRoomPage = lazy(() =>
  import('./pages/ChatRoomPage').then(m => ({ default: m.ChatRoomPage }))
);
const AnimePage = lazy(() => import('./pages/AnimePage').then(m => ({ default: m.AnimePage })));
const DramaPage = lazy(() => import('./pages/DramaPage').then(m => ({ default: m.DramaPage })));
const VideokePage = lazy(() =>
  import('./pages/VideokePage').then(m => ({ default: m.VideokePage }))
);
const VivamaxPage = lazy(() =>
  import('./pages/VivamaxPage').then(m => ({ default: m.VivamaxPage }))
);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const [playOnOpen, setPlayOnOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }
    return null;
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const onlineTimeoutRef = useRef();

  const { isItemInMyList, toggleMyList, clearMyList } = useMyList();
  const { continueWatchingList, setItemProgress, clearContinueWatching } = useContinueWatching();
  const { theme, toggleTheme } = useTheme();
  const { isWatched, addToWatched, clearWatchedHistory } = useWatchedHistory();
  const { isChristmasMode, isHalloweenMode, isNewYearMode } = useChristmasTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    const handleOffline = () => {
      if (onlineTimeoutRef.current) {
        clearTimeout(onlineTimeoutRef.current);
      }
      setNetworkStatus('offline');
      showToast('You appear to be offline. Playback may pause until you reconnect.', 'error', 4000);
    };

    const handleOnline = () => {
      setNetworkStatus('online');
      showToast('Connection restored. You are back online.', 'success', 3000);
      onlineTimeoutRef.current = setTimeout(() => {
        setNetworkStatus(null);
      }, 3200);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (onlineTimeoutRef.current) {
        clearTimeout(onlineTimeoutRef.current);
      }
    };
  }, [showToast]);

  useEffect(() => {
    const handler = event => {
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }

      if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        navigate('/search');
        showToast('Jumped to search. Tip: press Shift + L for My List.', 'info', 3500);
      }

      if ((event.key === 'L' || event.key === 'l') && event.shiftKey) {
        event.preventDefault();
        navigate('/my-list');
        showToast('Opened My List via keyboard shortcut.', 'info', 3000);
      }

      if ((event.key === 'S' || event.key === 's') && event.shiftKey) {
        event.preventDefault();
        setIsSettingsOpen(true);
        showToast('Settings opened. Press Esc to close.', 'info', 3000);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, showToast]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storageKey = 'nikzflixtv_shortcuts_v1';
    const hasSeen = sessionStorage.getItem(storageKey);
    if (!hasSeen) {
      showToast(
        'Pro tip: Press / for search, Shift + L for My List, Shift + S for settings.',
        'info',
        5200
      );
      sessionStorage.setItem(storageKey, '1');
    }
  }, [showToast]);

  const handleOpenModal = (item, play = false) => {
    setModalItem(item);
    setPlayOnOpen(play);
  };

  const handleCloseModal = () => {
    setModalItem(null);
    setPlayOnOpen(false);
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageTransitionIndicator isActive={isTransitioning} />
      <NetworkStatusBanner status={networkStatus} />
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-grow">
        <Suspense fallback={<ContentLoader message="Loading NikzFlix..." />}>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={<HomePage key="home" onOpenModal={handleOpenModal} isWatched={isWatched} />}
            />
            <Route
              path="/search"
              element={
                <SearchPage key="search" onOpenModal={handleOpenModal} isWatched={isWatched} />
              }
            />
            <Route path="/auth" element={<AuthPage key="auth" />} />
            <Route path="/profile" element={<ProfilePage key="profile" />} />
            <Route
              path="/anime"
              element={
                <AnimePage key="anime" onOpenModal={handleOpenModal} isWatched={isWatched} />
              }
            />
            <Route
              path="/drama"
              element={
                <DramaPage key="drama" onOpenModal={handleOpenModal} isWatched={isWatched} />
              }
            />
            <Route
              path="/my-list"
              element={
                <MyListPage key="mylist" onOpenModal={handleOpenModal} isWatched={isWatched} />
              }
            />
            <Route path="/live-tv" element={<IPTVPage key="livetv" />} />
            <Route path="/chat-room" element={<ChatRoomPage key="chat" />} />
            <Route path="/videoke" element={<VideokePage key="videoke" />} />
            <Route
              path="/vivamax"
              element={
                <VivamaxPage key="vivamax" onOpenModal={handleOpenModal} isWatched={isWatched} />
              }
            />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <BackToTopButton />
      <AdsterraSocialBar />

      <Suspense fallback={null}>
        {isChristmasMode && (
          <>
            <ChristmasLights />
            <SnowEffect />
          </>
        )}
        {isHalloweenMode && <HalloweenEffects />}
        {isNewYearMode && <NewYearEffects />}
      </Suspense>

      {modalItem && (
        <Modal
          item={modalItem}
          onClose={handleCloseModal}
          isItemInMyList={isItemInMyList}
          onToggleMyList={toggleMyList}
          playOnOpen={playOnOpen}
          onEpisodePlay={(itemForProgress, season, episode) =>
            setItemProgress(itemForProgress, season, episode)
          }
          addToWatched={addToWatched}
          isWatched={isWatched}
          onOpenModal={handleOpenModal}
          continueWatchingList={continueWatchingList}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          toggleTheme={toggleTheme}
          onClearContinueWatching={clearContinueWatching}
          onClearWatchedHistory={clearWatchedHistory}
          onClearMyList={clearMyList}
        />
      )}

      <BraveNotification />
    </div>
  );
}
