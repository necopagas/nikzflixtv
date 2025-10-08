import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

export const useWatchedHistory = () => {
    const { currentUser } = useAuth();
    const [watchedHistory, setWatchedHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Kung naay user, gamita ang Firestore
        if (currentUser) {
            setLoading(true);
            const historyCollectionRef = collection(db, 'users', currentUser.uid, 'watchedHistory');
            
            const unsubscribe = onSnapshot(historyCollectionRef, (snapshot) => {
                // I-map lang nato ang mga ID sa document
                const firebaseHistory = snapshot.docs.map(doc => doc.id);
                setWatchedHistory(firebaseHistory);
                setLoading(false);
            });

            return () => unsubscribe();
        } 
        // Kung walay user, gamita ang localStorage
        else {
            const localHistory = JSON.parse(localStorage.getItem('nikzflixWatchedHistory')) || [];
            setWatchedHistory(localHistory);
            setLoading(false);
        }
    }, [currentUser]);

    // I-save sa localStorage kung walay user
    useEffect(() => {
        if (!currentUser) {
            localStorage.setItem('nikzflixWatchedHistory', JSON.stringify(watchedHistory));
        }
    }, [watchedHistory, currentUser]);

    const addToWatched = async (itemId) => {
        const idStr = itemId.toString();
        if (watchedHistory.includes(idStr)) return; // Ayaw na idugang kung naa na

        if (currentUser) {
            const itemRef = doc(db, 'users', currentUser.uid, 'watchedHistory', idStr);
            try {
                // Mag-save lang ta ug empty object para marehistro ang ID
                await setDoc(itemRef, { watchedAt: new Date().toISOString() });
            } catch (error) {
                console.error("Error updating Watched History in Firestore:", error);
            }
        } else {
            setWatchedHistory(prev => [...prev, idStr]);
        }
    };

    const isWatched = (itemId) => watchedHistory.includes(itemId.toString());

    const clearWatchedHistory = async () => {
        if (currentUser) {
            watchedHistory.forEach(async (id) => {
                const itemRef = doc(db, 'users', currentUser.uid, 'watchedHistory', id);
                await deleteDoc(itemRef);
            });
        } else {
            setWatchedHistory([]);
        }
    };

    return { watchedHistory, addToWatched, isWatched, clearWatchedHistory, loading };
};