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
                // Map docs to objects with watchedAt so we can sort by recency
                const firebaseItems = snapshot.docs.map(d => ({ id: d.id, watchedAt: d.data()?.watchedAt || null }));
                // Sort by watchedAt ascending (older first), we want newest last
                firebaseItems.sort((a, b) => {
                    const ta = a.watchedAt ? Date.parse(a.watchedAt) : 0;
                    const tb = b.watchedAt ? Date.parse(b.watchedAt) : 0;
                    return ta - tb;
                });
                const orderedIds = firebaseItems.map(i => i.id);
                setWatchedHistory(orderedIds);
                setLoading(false);
            });

            return () => unsubscribe();
        } 
        // Kung walay user, gamita ang localStorage (store array of {id, watchedAt})
        else {
            const raw = JSON.parse(localStorage.getItem('nikzflixWatchedHistory')) || [];
            // raw may be either array of ids (old format) or array of objects
            const normalized = raw.map(r => (typeof r === 'string' ? { id: r, watchedAt: null } : r));
            normalized.sort((a, b) => {
                const ta = a.watchedAt ? Date.parse(a.watchedAt) : 0;
                const tb = b.watchedAt ? Date.parse(b.watchedAt) : 0;
                return ta - tb;
            });
            setWatchedHistory(normalized.map(i => i.id));
            setLoading(false);
        }
    }, [currentUser]);

    // I-save sa localStorage kung walay user
    useEffect(() => {
        if (!currentUser) {
            // Save as array of { id, watchedAt } to preserve ordering and timestamps
            const existingRaw = JSON.parse(localStorage.getItem('nikzflixWatchedHistory')) || [];
            // Convert existing to map for quick merge
            const map = new Map();
            existingRaw.forEach(r => {
                if (typeof r === 'string') map.set(r, null);
                else if (r && r.id) map.set(r.id, r.watchedAt || null);
            });
            // Update map with current watchedHistory, preserving new timestamps as null (we don't have them locally otherwise)
            const nowIso = new Date().toISOString();
            const out = watchedHistory.map(id => ({ id, watchedAt: map.get(id) || nowIso }));
            localStorage.setItem('nikzflixWatchedHistory', JSON.stringify(out));
        }
    }, [watchedHistory, currentUser]);

    const addToWatched = async (itemId) => {
        const idStr = itemId.toString();

        // For Firestore: always set the watchedAt to now so it becomes the most recent
        if (currentUser) {
            const itemRef = doc(db, 'users', currentUser.uid, 'watchedHistory', idStr);
            try {
                await setDoc(itemRef, { watchedAt: new Date().toISOString() });
            } catch (error) {
                console.error("Error updating Watched History in Firestore:", error);
            }
        } else {
            // For localStorage mode: move existing to end or append
            setWatchedHistory(prev => {
                const filtered = prev.filter(id => id !== idStr);
                return [...filtered, idStr];
            });
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