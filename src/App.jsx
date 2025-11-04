import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { BackToTopButton } from './components/BackToTopButton';
import { SettingsModal } from './components/SettingsModal';
import { ContentLoader } from './components/LoadingSpinner';
import { BraveNotification } from './components/BraveNotification';
import { useMyList } from './hooks/useMyList';
import { useContinueWatching } from './hooks/useContinueWatching';
import { useTheme } from './hooks/useTheme';
import { useWatchedHistory } from './hooks/useWatchedHistory';
import { useChristmasTheme } from './hooks/useChristmasTheme';
import { AdsterraSocialBar } from './components/AdsterraSocialBar';

// Lazy load seasonal effects for better performance
const SnowEffect = lazy(() => import('./components/SnowEffect').then(m => ({ default: m.SnowEffect })));
const ChristmasLights = lazy(() => import('./components/ChristmasLights').then(m => ({ default: m.ChristmasLights })));
const HalloweenEffects = lazy(() => import('./components/HalloweenEffects').then(m => ({ default: m.HalloweenEffects })));
const NewYearEffects = lazy(() => import('./components/NewYearEffects').then(m => ({ default: m.NewYearEffects })));

// Lazy load pages to keep the initial bundle fast
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const MyListPage = lazy(() => import('./pages/MyListPage').then(m => ({ default: m.MyListPage })));
const IPTVPage = lazy(() => import('./pages/IPTVPage').then(m => ({ default: m.IPTVPage })));
const ChatRoomPage = lazy(() => import('./pages/ChatRoomPage').then(m => ({ default: m.ChatRoomPage })));
const AnimePage = lazy(() => import('./pages/AnimePage').then(m => ({ default: m.AnimePage })));
const DramaPage = lazy(() => import('./pages/DramaPage').then(m => ({ default: m.DramaPage })));
const VideokePage = lazy(() => import('./pages/VideokePage').then(m => ({ default: m.VideokePage })));
const VivamaxPage = lazy(() => import('./pages/VivamaxPage').then(m => ({ default: m.VivamaxPage })));

export default function App() {
  const [modalItem, setModalItem] = useState(null);
  const [playOnOpen, setPlayOnOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();

  const { isItemInMyList, toggleMyList, clearMyList } = useMyList();
  const { continueWatchingList, setItemProgress, clearContinueWatching } = useContinueWatching();
  const { theme, toggleTheme } = useTheme();
  const { isWatched, addToWatched, clearWatchedHistory } = useWatchedHistory();
  const { isChristmasMode, isHalloweenMode, isNewYearMode } = useChristmasTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  const handleOpenModal = (item, play = false) => {
    setModalItem(item);
    setPlayOnOpen(play);
  };

  const handleCloseModal = () => {
    setModalItem(null);
    setPlayOnOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-grow">
        <Suspense fallback={<ContentLoader message="Loading NikzFlix..." />}>
          <Routes>
            <Route
              path="/"
              element={<HomePage onOpenModal={handleOpenModal} isWatched={isWatched} />}
            />
            <Route
              path="/search"
              element={<SearchPage onOpenModal={handleOpenModal} isWatched={isWatched} />}
            />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/anime"
              element={<AnimePage onOpenModal={handleOpenModal} isWatched={isWatched} />}
            />
            <Route
              path="/drama"
              element={<DramaPage onOpenModal={handleOpenModal} isWatched={isWatched} />}
            />
            <Route
              path="/my-list"
              element={<MyListPage onOpenModal={handleOpenModal} isWatched={isWatched} />}
            />
            <Route path="/live-tv" element={<IPTVPage />} />
            <Route path="/chat-room" element={<ChatRoomPage />} />
            <Route path="/videoke" element={<VideokePage />} />
            <Route
              path="/vivamax"
              element={<VivamaxPage onOpenModal={handleOpenModal} isWatched={isWatched} />}
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