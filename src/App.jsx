import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { BackToTopButton } from './components/BackToTopButton';
import { SettingsModal } from './components/SettingsModal';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyListPage } from './pages/MyListPage';
import { IPTVPage } from './pages/IPTVPage'; // Import the new page
import { useAuth } from './context/AuthContext';
import { useMyList } from './hooks/useMyList';
import { useContinueWatching } from './hooks/useContinueWatching';
import { useTheme } from './hooks/useTheme';
import { useWatchedHistory } from './hooks/useWatchedHistory';
import { VisitorCounter } from './components/VisitorCounter';

export default function App() {
    const [modalItem, setModalItem] = useState(null);
    const [playOnOpen, setPlayOnOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const location = useLocation();

    const { currentUser } = useAuth();

    const { myList, isItemInMyList, toggleMyList, clearMyList } = useMyList();
    const { continueWatchingList, setItemProgress, clearContinueWatching } = useContinueWatching();
    const { theme, toggleTheme } = useTheme();
    const { watchedHistory, isWatched, addToWatched, clearWatchedHistory } = useWatchedHistory();

    useEffect(() => {
        window.scrollTo(0, 0);
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
                        path="/my-list"
                        element={<MyListPage onOpenModal={handleOpenModal} isWatched={isWatched} />}
                    />
                    <Route path="/live-tv" element={<IPTVPage />} />
                </Routes>
            </main>
            <Footer />
            <BackToTopButton />

            {modalItem && (
                <Modal
                    item={modalItem}
                    onClose={handleCloseModal}
                    isItemInMyList={isItemInMyList}
                    onToggleMyList={toggleMyList}
                    playOnOpen={playOnOpen}
                    onEpisodePlay={(itemForProgress, season, episode) => setItemProgress(itemForProgress, season, episode)}
                    addToWatched={addToWatched}
                    // --- ANG FIX NAA DINHI: ipasa ang tibuok 'isWatched' function ---
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
        </div>
    );
}