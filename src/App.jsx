import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';
import { BackToTopButton } from './components/BackToTopButton';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { useMyList } from './hooks/useMyList';
import { useContinueWatching } from './hooks/useContinueWatching';
import { useTheme } from './hooks/useTheme';
import { useWatchedHistory } from './hooks/useWatchedHistory';

export default function App() {
    const [modalItem, setModalItem] = useState(null);
    const [playOnOpen, setPlayOnOpen] = useState(false);
    const location = useLocation();
    
    const { isItemInMyList, toggleMyList } = useMyList();
    const { setItemProgress } = useContinueWatching();
    const { theme, toggleTheme } = useTheme();
    const { isWatched, addToWatched } = useWatchedHistory();

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
            <Header theme={theme} toggleTheme={toggleTheme} />
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
                    // --- ANG FIX NAA DINHI: Sakto na ang pagpasa sa function ---
                    onEpisodePlay={(itemForProgress, season, episode) => setItemProgress(itemForProgress, season, episode)} 
                    addToWatched={addToWatched}
                    isWatched={isWatched} 
                    onOpenModal={handleOpenModal}
                />
            )}
        </div>
    );
}