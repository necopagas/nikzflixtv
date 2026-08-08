import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { profileStorageKey } from '../utils/profileStorage.js';
import { WatchProgressTracker } from '../utils/videoPlayerUtils.js';

export const useContinueWatching = () => {
  const { currentUser } = useAuth();
  const { activeProfile } = useProfile();
  const [continueWatchingList, setContinueWatchingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kung naay naka-login nga user, gamita ang Firestore
    if (currentUser) {
      setLoading(true);
      const profileId = activeProfile?.id || 'default';
      const listCollectionRef = collection(
        db,
        'users',
        currentUser.uid,
        'profiles',
        profileId,
        'continueWatching'
      );
      const q = query(listCollectionRef, orderBy('lastWatched', 'desc')); // I-sort para ang pinakabag-o ang mauna

      const unsubscribe = onSnapshot(q, snapshot => {
        const firebaseList = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          progress:
            WatchProgressTracker.getProgress(doc.id, profileStorageKey('watchProgress', profileId))
              ?.percentage || 0,
        }));
        setContinueWatchingList(firebaseList);
        setLoading(false);
      });

      return () => unsubscribe();
    }
    // Kung walay naka-login, gamita ang localStorage
    else {
      const profileId = activeProfile?.id || 'default';
      const localList =
        JSON.parse(
          localStorage.getItem(profileStorageKey('nikzflixContinueWatching', profileId))
        ) || [];
      const progressMap = JSON.parse(
        localStorage.getItem(profileStorageKey('watchProgress', profileId)) || '{}'
      );
      setContinueWatchingList(
        localList.map(item => ({
          ...item,
          progress: progressMap[item.id]?.percentage || 0,
        }))
      );
      setLoading(false);
    }
  }, [currentUser, activeProfile?.id]);

  // I-save sa localStorage kung walay user
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem(
        profileStorageKey('nikzflixContinueWatching', activeProfile?.id || 'default'),
        JSON.stringify(continueWatchingList)
      );
    }
  }, [continueWatchingList, currentUser, activeProfile?.id]);

  const setItemProgress = async (item, season, episode) => {
    const newItem = {
      id: item.id,
      title: item.title || item.name,
      name: item.name || item.title,
      poster_path: item.poster_path,
      media_type: item.media_type || (item.title ? 'movie' : 'tv'),
      lastWatched: new Date().toISOString(),
      season,
      episode,
    };

    // Kung naay user, i-save sa Firestore
    if (currentUser) {
      const itemRef = doc(
        db,
        'users',
        currentUser.uid,
        'profiles',
        activeProfile?.id || 'default',
        'continueWatching',
        item.id.toString()
      );
      try {
        await setDoc(itemRef, newItem);
      } catch (error) {
        console.error('Error updating Continue Watching in Firestore:', error);
      }
    }
    // Kung walay user, i-save sa localStorage
    else {
      setContinueWatchingList(prevList => {
        const updatedList = prevList.filter(i => i.id !== item.id);
        return [newItem, ...updatedList];
      });
    }
  };

  const clearContinueWatching = async () => {
    if (currentUser) {
      continueWatchingList.forEach(async item => {
        const itemRef = doc(
          db,
          'users',
          currentUser.uid,
          'profiles',
          activeProfile?.id || 'default',
          'continueWatching',
          item.id.toString()
        );
        await deleteDoc(itemRef);
      });
    } else {
      setContinueWatchingList([]);
    }
  };

  return { continueWatchingList, setItemProgress, clearContinueWatching, loading };
};
