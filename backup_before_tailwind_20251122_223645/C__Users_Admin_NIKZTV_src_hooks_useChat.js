import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';

export const useChat = () => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'chatMessages'), 
            orderBy('timestamp', 'asc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching chat messages: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const sendMessage = async (text) => {
        if (!currentUser || !text.trim()) return;

        try {
            await addDoc(collection(db, 'chatMessages'), {
                text,
                uid: currentUser.uid,
                // Gamiton ang displayName, kung wala, ang email prefix na lang
                displayName: currentUser.displayName || currentUser.email.split('@')[0], 
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return { messages, sendMessage, loading };
};