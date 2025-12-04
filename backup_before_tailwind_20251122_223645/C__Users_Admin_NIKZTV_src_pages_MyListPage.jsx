import React from 'react';
import { useMyList } from '../hooks/useMyList';
import { useAuth } from '../context/AuthContext';
import { Poster } from '../components/Poster';
import { useNavigate } from 'react-router-dom';

export const MyListPage = ({ onOpenModal, isWatched }) => {
    const { myList, loading } = useMyList();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Kung loading pa, magpakita ta og skeleton grid
    if (loading) {
        return (
            <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
                <h2 className="text-3xl font-bold mb-8">My List</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] skeleton"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Kung walay naka-login ug walay sulod ang local list
    if (!currentUser && myList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20 text-center">
                <h2 className="text-3xl font-bold mb-4">Your List is Empty</h2>
                <p className="text-lg text-[var(--text-secondary)] mb-6">Log in to sync your list across devices.</p>
                <button onClick={() => navigate('/auth')} className="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700">
                    Login
                </button>
            </div>
        );
    }

    // Kung naay naka-login pero walay sulod ang list
    if (currentUser && myList.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen pt-20 text-center">
                <h2 className="text-3xl font-bold mb-4">Your List is Empty</h2>
                <p className="text-lg text-[var(--text-secondary)]">Add movies and shows to see them here.</p>
            </div>
        )
    }

    return (
        <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
            <h2 className="text-3xl font-bold mb-8">My List</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {myList.map(item => (
                    <Poster 
                        key={item.id} 
                        item={item} 
                        onOpenModal={onOpenModal} 
                        isWatched={isWatched(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};