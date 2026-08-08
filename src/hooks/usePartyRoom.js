import { useCallback, useEffect, useMemo, useState } from 'react';
import { appendChatMessage, loadRoom, roomInviteLink, updateRoom } from '../utils/watchPartyRooms';

export const usePartyRoom = roomCode => {
  const [room, setRoom] = useState(() => loadRoom(roomCode));
  const [messageInput, setMessageInput] = useState('');

  const refresh = useCallback(() => {
    setRoom(loadRoom(roomCode));
  }, [roomCode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    refresh();
    const onStorage = event => {
      if (!event.key || !event.key.includes(String(roomCode || '').toUpperCase())) return;
      refresh();
    };

    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 700);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(timer);
    };
  }, [refresh, roomCode]);

  const isHost = useMemo(
    () =>
      Boolean(
        room?.host?.username ===
          (typeof window !== 'undefined'
            ? localStorage.getItem('nikzflix_username') || 'Host'
            : 'Host')
      ),
    [room]
  );

  const patchRoom = useCallback(
    updates => {
      const next = updateRoom(roomCode, updates);
      if (next) setRoom(next);
      return next;
    },
    [roomCode]
  );

  const setPlayback = useCallback(
    updates => {
      patchRoom({
        playback: updates,
      });
    },
    [patchRoom]
  );

  const sendMessage = useCallback(() => {
    const text = messageInput.trim();
    if (!text) return;

    const currentUser = localStorage.getItem('nikzflix_username') || 'Guest';
    appendChatMessage(roomCode, {
      id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      username: currentUser,
      text,
      timestamp: new Date().toISOString(),
    });
    setMessageInput('');
    refresh();
  }, [messageInput, refresh, roomCode]);

  const inviteLink = useMemo(() => roomInviteLink(roomCode), [roomCode]);

  return {
    room,
    setRoom: patchRoom,
    setPlayback,
    refresh,
    inviteLink,
    isHost,
    messageInput,
    setMessageInput,
    sendMessage,
  };
};
