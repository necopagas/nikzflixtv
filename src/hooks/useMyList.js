import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

export const useMyList = () => {
    const { currentUser } = useAuth();
    const [myList, setMyList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Kung naay naka-login nga user...
        if (currentUser) {
            setLoading(true);
            const listCollectionRef = collection(db, 'users', currentUser.uid, 'myList');
            
            // Ang onSnapshot maminaw sa real-time updates gikan sa Firestore
            const unsubscribe = onSnapshot(listCollectionRef, (snapshot) => {
                const firebaseList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setMyList(firebaseList);
                setLoading(false);
            });

            // Cleanup function para mo-undang og paminaw kung dili na kinahanglan
            return () => unsubscribe();
        } 
        // Kung walay naka-login, gamiton gihapon ang localStorage
        else {
            const localList = JSON.parse(localStorage.getItem('myNikzflixList')) || [];
            setMyList(localList);
            setLoading(false);
        }
    }, [currentUser]);

    // I-save sa localStorage kung walay user
    useEffect(() => {
        if (!currentUser) {
            localStorage.setItem('myNikzflixList', JSON.stringify(myList));
        }
    }, [myList, currentUser]);

    const isItemInMyList = (itemId) => myList.some(item => item.id.toString() === itemId.toString());

    const toggleMyList = async (item) => {
        // Kung naay user, i-save sa Firestore
        if (currentUser) {
            const itemRef = doc(db, 'users', currentUser.uid, 'myList', item.id.toString());
            try {
                if (isItemInMyList(item.id)) {
                    await deleteDoc(itemRef);
                } else {
                    const newItem = {
                        id: item.id,
                        name: item.name || item.title,
                        poster_path: item.poster_path,
                        media_type: item.media_type || (item.title ? 'movie' : 'tv')
                    };
                    await setDoc(itemRef, newItem);
                }
            } catch (error) {
                console.error("Error updating My List in Firestore:", error);
            }
        } 
        // Kung walay user, i-save sa localStorage
        else {
            setMyList(prevList => {
                const isAdded = prevList.some(i => i.id === item.id);
                if (isAdded) {
                    return prevList.filter(i => i.id !== item.id);
                } else {
                    const newItem = {
                        id: item.id,
                        name: item.name || item.title,
                        poster_path: item.poster_path,
                        media_type: item.media_type || (item.title ? 'movie' : 'tv')
                    };
                    return [...prevList, newItem];
                }
            });
        }
    };

    const clearMyList = async () => {
        if (currentUser) {
            // Para ma-clear, i-delete tagsa2 ang document
            myList.forEach(async (item) => {
                const itemRef = doc(db, 'users', currentUser.uid, 'myList', item.id.toString());
                await deleteDoc(itemRef);
            });
        } else {
            setMyList([]);
        }
    };
    
    // Ibalik ang loading state para magamit sa UI kung kinahanglan
    return { myList, isItemInMyList, toggleMyList, clearMyList, loading };
};