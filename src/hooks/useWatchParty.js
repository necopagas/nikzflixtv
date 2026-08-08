import { useState, useEffect, useCallback, useRef } from 'react';
import {
  appendChatMessage,
  createRoomCode,
  getRoomStorageKey,
  loadRoom,
  roomInviteLink,
  saveRoom,
  updateRoom,
} from '../utils/watchPartyRooms';

/**
 * Watch Party Hook
 * Shared room-state wrapper used by the floating player controls.
 * The source of truth is the room record in localStorage.
 */

const SYNC_INTERVAL = 500;
const MAX_PARTICIPANTS = 10;

const buildMediaPayload = metadata => ({
  itemId: metadata?.itemId || metadata?.id || null,
  mediaType: metadata?.mediaType || (metadata?.season || metadata?.episode ? 'tv' : 'movie'),
  title: metadata?.title || metadata?.name || 'Watch Party',
  poster: metadata?.poster || metadata?.poster_path || '',
  backdrop: metadata?.backdrop || metadata?.backdrop_path || '',
  overview: metadata?.overview || '',
  season: metadata?.season || 1,
  episode: metadata?.episode || 1,
  source: metadata?.source || '111movies',
  playerUrl: metadata?.playerUrl || metadata?.url || '',
});

export const useWatchParty = videoRef => {
  const [isHost, setIsHost] = useState(false);
  const [partyId, setPartyId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);

  const syncIntervalRef = useRef(null);
  const lastSyncRef = useRef(null);
  const userIdRef = useRef(`user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`);

  const getCurrentUser = useCallback(() => {
    const username =
      (typeof window !== 'undefined' && localStorage.getItem('nikzflix_username')) || 'Guest';
    return {
      id: userIdRef.current,
      username,
      isHost,
      joinedAt: new Date().toISOString(),
    };
  }, [isHost]);

  const loadPartyState = useCallback(() => {
    if (!partyId) return null;
    return loadRoom(partyId);
  }, [partyId]);

  const savePartyState = useCallback(
    state => {
      if (!partyId || !state) return null;
      return saveRoom(partyId, state);
    },
    [partyId]
  );

  const createParty = useCallback(
    (videoUrl, metadata) => {
      const newPartyId = createRoomCode();
      const currentUser = getCurrentUser();
      const hostUser = {
        ...currentUser,
        isHost: true,
      };

      const initialState = {
        roomCode: newPartyId,
        createdAt: new Date().toISOString(),
        host: hostUser,
        participants: [
          {
            id: hostUser.id,
            username: hostUser.username,
            isHost: true,
          },
        ],
        media: {
          ...buildMediaPayload(metadata),
          playerUrl: videoUrl || metadata?.playerUrl || metadata?.url || '',
        },
        playback: {
          currentTime: 0,
          isPlaying: false,
          playbackRate: 1,
          source: metadata?.source || '111movies',
        },
        chat: [],
      };

      saveRoom(newPartyId, initialState);
      setPartyId(newPartyId);
      setIsHost(true);
      setParticipants(initialState.participants);
      setMessages([]);
      setIsConnected(true);
      return newPartyId;
    },
    [getCurrentUser]
  );

  const sendMessage = useCallback(
    (text, type = 'user') => {
      if (!partyId) return;
      const messageText = String(text || '').trim();
      if (!messageText) return;

      const currentUser = getCurrentUser();
      appendChatMessage(partyId, {
        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        userId: currentUser.id,
        username: currentUser.username,
        text: messageText,
        type,
        timestamp: new Date().toISOString(),
      });

      const updated = loadPartyState();
      if (updated) {
        setMessages(updated.chat || []);
      }
    },
    [getCurrentUser, loadPartyState, partyId]
  );

  const joinParty = useCallback(
    partyIdToJoin => {
      const normalizedPartyId = String(partyIdToJoin || '')
        .trim()
        .toUpperCase();
      if (!normalizedPartyId) throw new Error('Party not found');

      let state = loadRoom(normalizedPartyId);
      if (!state) {
        const legacyRaw =
          typeof window !== 'undefined'
            ? localStorage.getItem(`nikzflix_watch_party_${normalizedPartyId}`)
            : null;
        if (legacyRaw) {
          try {
            state = JSON.parse(legacyRaw);
          } catch {
            state = null;
          }
        }
      }

      if (!state) {
        throw new Error('Party not found');
      }

      const participantsList = Array.isArray(state.participants) ? state.participants : [];
      if (participantsList.length >= MAX_PARTICIPANTS) {
        throw new Error('Party is full');
      }

      const currentUser = getCurrentUser();
      const nextParticipants = participantsList.some(
        participant =>
          participant.id === currentUser.id || participant.username === currentUser.username
      )
        ? participantsList
        : [...participantsList, { ...currentUser, isHost: false }];

      const nextState = saveRoom(normalizedPartyId, {
        ...state,
        roomCode: normalizedPartyId,
        participants: nextParticipants,
        chat: state.chat || state.messages || [],
        playback: {
          currentTime: state.playback?.currentTime || state.video?.currentTime || 0,
          isPlaying: state.playback?.isPlaying ?? state.video?.isPlaying ?? false,
          playbackRate: state.playback?.playbackRate || state.video?.playbackRate || 1,
          source: state.playback?.source || state.media?.source || '111movies',
        },
      });

      setPartyId(normalizedPartyId);
      setIsHost(Boolean(nextState?.host?.username === currentUser.username));
      setParticipants(nextState?.participants || []);
      setMessages(nextState?.chat || []);
      setIsConnected(true);

      if (currentUser.username !== nextState?.host?.username) {
        appendChatMessage(normalizedPartyId, {
          id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          userId: currentUser.id,
          username: currentUser.username,
          text: `${currentUser.username} joined the party`,
          type: 'system',
          timestamp: new Date().toISOString(),
        });
        const refreshed = loadRoom(normalizedPartyId);
        if (refreshed) {
          setMessages(refreshed.chat || []);
        }
      }

      return nextState?.media;
    },
    [getCurrentUser]
  );

  const leaveParty = useCallback(() => {
    if (!partyId) return;

    const state = loadPartyState();
    if (state) {
      const currentUser = getCurrentUser();
      const remaining = (state.participants || []).filter(p => p.id !== currentUser.id);

      if (remaining.length === 0) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(getRoomStorageKey(partyId));
          }
        } catch (error) {
          console.error('Failed to remove empty room', error);
        }
      } else {
        const nextHost = state.host?.username === currentUser.username ? remaining[0] : state.host;
        savePartyState({
          ...state,
          host: nextHost || state.host,
          participants: remaining,
        });
        appendChatMessage(partyId, {
          id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          userId: currentUser.id,
          username: currentUser.username,
          text: `${currentUser.username} left the party`,
          type: 'system',
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    setPartyId(null);
    setIsHost(false);
    setParticipants([]);
    setMessages([]);
    setIsConnected(false);
  }, [getCurrentUser, loadPartyState, partyId, savePartyState]);

  const syncVideoState = useCallback(() => {
    if (!partyId || !videoRef?.current || !syncEnabled) return;

    const state = loadPartyState();
    if (!state) return;

    const video = videoRef.current;

    if (isHost) {
      const videoState = {
        currentTime: video.currentTime,
        isPlaying: !video.paused,
        playbackRate: video.playbackRate,
      };

      const nextState = updateRoom(partyId, {
        playback: {
          ...((state && state.playback) || {}),
          ...videoState,
          source: state.playback?.source || state.media?.source || '111movies',
        },
      });

      if (nextState) {
        lastSyncRef.current = videoState;
      }
    } else {
      const hostState = state.playback || {};

      if (!lastSyncRef.current || Math.abs(video.currentTime - (hostState.currentTime || 0)) > 2) {
        video.currentTime = hostState.currentTime || 0;
      }

      if (hostState.isPlaying && video.paused) {
        video.play().catch(() => {});
      } else if (!hostState.isPlaying && !video.paused) {
        video.pause();
      }

      if (video.playbackRate !== (hostState.playbackRate || 1)) {
        video.playbackRate = hostState.playbackRate || 1;
      }

      lastSyncRef.current = hostState;
    }
  }, [isHost, loadPartyState, partyId, syncEnabled, videoRef]);

  useEffect(() => {
    if (!partyId || !isConnected) return undefined;

    const pollInterval = setInterval(() => {
      const state = loadPartyState();
      if (state) {
        setParticipants(state.participants || []);
        setMessages(state.chat || state.messages || []);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [isConnected, loadPartyState, partyId]);

  useEffect(() => {
    if (!partyId || !isConnected || !videoRef?.current) return undefined;

    syncIntervalRef.current = setInterval(syncVideoState, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isConnected, partyId, syncVideoState, videoRef]);

  const getInviteLink = useCallback(() => {
    if (!partyId) return null;
    return roomInviteLink(partyId);
  }, [partyId]);

  const copyInviteLink = useCallback(async () => {
    const link = getInviteLink();
    if (!link) return false;

    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (error) {
      console.error('Failed to copy link:', error);
      return false;
    }
  }, [getInviteLink]);

  const shareInviteLink = useCallback(async () => {
    const link = getInviteLink();
    if (!link) return false;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Watch Party on NikzFlix TV',
          text: 'Watch together with me!',
          url: link,
        });
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        return false;
      }
    }

    return copyInviteLink();
  }, [copyInviteLink, getInviteLink]);

  const toggleSync = useCallback(() => {
    setSyncEnabled(prev => !prev);
  }, []);

  const kickParticipant = useCallback(
    participantId => {
      if (!isHost || !partyId) return;

      const state = loadPartyState();
      if (!state) return;

      const updatedParticipants = (state.participants || []).filter(p => p.id !== participantId);
      const kickedUser = (state.participants || []).find(p => p.id === participantId);

      savePartyState({
        ...state,
        participants: updatedParticipants,
      });
      setParticipants(updatedParticipants);

      if (kickedUser) {
        sendMessage(`${kickedUser.username} was removed from the party`, 'system');
      }
    },
    [isHost, loadPartyState, partyId, savePartyState, sendMessage]
  );

  return {
    isHost,
    partyId,
    participants,
    messages,
    isConnected,
    syncEnabled,
    createParty,
    joinParty,
    leaveParty,
    sendMessage,
    getInviteLink,
    copyInviteLink,
    shareInviteLink,
    toggleSync,
    kickParticipant,
  };
};
