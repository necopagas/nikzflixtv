// src/hooks/useVisitorCount.js

import { useState, useEffect } from 'react';
import { rtdb } from '../firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

export const useVisitorCount = () => {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    const onlineRef = ref(rtdb, '.info/connected');
    const presenceRef = ref(rtdb, 'onlineUsers');

    onValue(onlineRef, snapshot => {
      if (snapshot.val() === true) {
        const userRef = ref(rtdb, `onlineUsers/${Math.random().toString(36).substr(2, 9)}`);
        onDisconnect(userRef).remove();
        set(userRef, { timestamp: serverTimestamp() });
      }
    });

    onValue(presenceRef, snapshot => {
      // --- FIX: Gamiton ang snapshot.size imbis snapshot.numChildren() ---
      if (snapshot.exists()) {
        setVisitorCount(snapshot.size);
      } else {
        setVisitorCount(0);
      }
    });
  }, []);

  return visitorCount;
};
