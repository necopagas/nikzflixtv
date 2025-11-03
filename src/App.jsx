import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { BackToTopButton } from './components/BackToTopButton';
import { SettingsModal } from './components/SettingsModal';
import { BraveNotification } from './components/BraveNotification';
// Lazy load seasonal effects for better performance
const SnowEffect = lazy(() => import('./components/SnowEffect').then(m => ({ default: m.SnowEffect })));
const ChristmasLights = lazy(() => import('./components/ChristmasLights').then(m => ({ default: m.ChristmasLights })));
const HalloweenEffects = lazy(() => import('./components/HalloweenEffects').then(m => ({ default: m.HalloweenEffects })));
const NewYearEffects = lazy(() => import('./components/NewYearEffects').then(m => ({ default: m.NewYearEffects })));
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyListPage } from './pages/MyListPage';
import { IPTVPage } from './pages/IPTVPage';
import { ChatRoomPage } from './pages/ChatRoomPage';
import { AnimePage } from './pages/AnimePage';
import { DramaPage } from './pages/DramaPage';
// --- GI-TANGGAL ANG IMPORT KAY DILI NA MAGAMIT ---
// import { DramaDetailPage } from './pages/DramaDetailPage';
// import { DramaPlayerPage } from './pages/DramaPlayerPage';
// removed unused useAuth import
import { useMyList } from './hooks/useMyList';
import { useContinueWatching } from './hooks/useContinueWatching';
import { useTheme } from './hooks/useTheme';
import { useWatchedHistory } from './hooks/useWatchedHistory';
import { useChristmasTheme } from './hooks/useChristmasTheme';

// --- I-IMPORT ANG BAG-ONG PAGE ---
import { VideokePage } from './pages/VideokePage.jsx';
import { VivamaxPage } from './pages/VivamaxPage.jsx';

// --- ADSTERRA ADS ---
import { AdsterraSocialBar } from './components/AdsterraSocialBar';

const scaryMessages = [
  "INITIALIZING SYSTEM OVERRIDE...",
  "FIREWALL BREACHED. SECURITY PROTOCOLS BYPASSED.",
  "TRACKING USER LOCATION... [GEOLOCATION API ACTIVE]",
  "USER DATA PACKET INTERCEPTION: nikzflix_userdata.zip",
  "[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100% - DATA CAPTURED.",
  "FINAL WARNING: IMMEDIATE DISCONNECTION REQUIRED.",
];

export default function App() {
  const [modalItem, setModalItem] = useState(null);
  const [playOnOpen, setPlayOnOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();
  const [isDevToolsOpened, setIsDevToolsOpened] = useState(false);
  const [completedLines, setCompletedLines] = useState([]);
  const [currentLineText, setCurrentLineText] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const soundPlayed = useRef(false);

  const { isItemInMyList, toggleMyList, clearMyList } = useMyList();
  const { continueWatchingList, setItemProgress, clearContinueWatching } = useContinueWatching();
  const { theme, toggleTheme } = useTheme();
  const { isWatched, addToWatched, clearWatchedHistory } = useWatchedHistory();
  const { isChristmasMode, isHalloweenMode, isNewYearMode } = useChristmasTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const devToolsChecker = () => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        setIsDevToolsOpened(true);
      } else {
        setIsDevToolsOpened(false);
        soundPlayed.current = false;
      }
    };
    const intervalId = setInterval(devToolsChecker, 1000);
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isDevToolsOpened) {
      setCompletedLines([]);
      setCurrentLineText('');
      setLineIndex(0);
      return;
    }

    if (isDevToolsOpened && !soundPlayed.current) {
      const audio = new Audio('/alarm.mp3');
      audio.play();
      soundPlayed.current = true;
    }

    if (isDevToolsOpened && lineIndex < scaryMessages.length) {
      const lineToType = scaryMessages[lineIndex];
      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < lineToType.length) {
          setCurrentLineText(lineToType.substring(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setCompletedLines(prev => [...prev, lineToType]);
          setCurrentLineText('');
          setTimeout(() => setLineIndex(prev => prev + 1), 500);
        }
      }, 50);
      return () => clearInterval(typingInterval);
    }
  }, [isDevToolsOpened, lineIndex]);

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
      {isDevToolsOpened && (
        <div className="hacker-overlay fixed inset-0 bg-black z-[9999] flex items-center justify-center p-8 font-mono">
          <div className="w-full max-w-2xl text-left">
            {completedLines.map((line, index) => (
              <p key={index} className={`text-lg ${index >= 4 ? 'text-red-500 font-bold' : 'text-green-400'}`}>
                {line}
              </p>
            ))}
            {currentLineText && (
              <p className="text-lg text-green-400">
                {currentLineText}
                <span className="blinking-cursor">|</span>
              </p>
            )}
          </div>
        </div>
      )}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage onOpenModal={handleOpenModal} isWatched={isWatched} />} />
          <Route path="/search" element={<SearchPage onOpenModal={handleOpenModal} isWatched={isWatched} />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/anime" element={<AnimePage onOpenModal={handleOpenModal} isWatched={isWatched} />} />
          
          {/* --- GI-UPDATE ANG DRAMA ROUTE --- */}
          <Route path="/drama" element={<DramaPage onOpenModal={handleOpenModal} isWatched={isWatched} />} />
          
          {/* --- GI-TANGGAL ANG MGA ROUTE NGA DILI NA MAGAMIT --- */}
          {/* <Route path="/drama/:dramaId" element={<DramaDetailPage />} /> */}
          {/* <Route path="/drama/watch/:episodeId" element={<DramaPlayerPage />} /> */}
          
          <Route path="/my-list" element={<MyListPage onOpenModal={handleOpenModal} isWatched={isWatched} />} />
          <Route path="/live-tv" element={<IPTVPage />} />
          <Route path="/chat-room" element={<ChatRoomPage />} />

          <Route path="/videoke" element={<VideokePage />} />
          <Route path="/vivamax" element={<VivamaxPage onOpenModal={handleOpenModal} isWatched={isWatched} />} />
        </Routes>
      </main>
      <Footer />
      <BackToTopButton />

      {/* Adsterra Social Bar - Sticky bottom (Zone: 27867027) */}
      <AdsterraSocialBar />

      {/* Seasonal Effects - Lazy loaded for performance */}
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
          onEpisodePlay={(itemForProgress, season, episode) => setItemProgress(itemForProgress, season, episode)}
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

      {/* Brave Browser Notification */}
      <BraveNotification />
    </div>
  );
}