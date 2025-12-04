import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Watch Party Hook
 * Manages synchronized viewing sessions with friends using peer-to-peer connections
 * Uses localStorage for simple peer synchronization without backend
 */

const STORAGE_KEY = 'nikzflix_watch_party';
const SYNC_INTERVAL = 500; // Sync every 500ms
const MAX_PARTICIPANTS = 10;

export const useWatchParty = videoRef => {
  const [isHost, setIsHost] = useState(false);
  const [partyId, setPartyId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);

  const syncIntervalRef = useRef(null);
  const lastSyncRef = useRef(null);
  const userIdRef = useRef(generateUserId());

  // Generate unique user ID
  function generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate party ID
  function generatePartyId() {
    return `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current user info
  const getCurrentUser = useCallback(() => {
    const username = localStorage.getItem('nikzflix_username') || 'Guest';
    return {
      id: userIdRef.current,
      username,
      isHost,
      joinedAt: new Date().toISOString(),
    };
  }, [isHost]);

  // Load party state from storage
  const loadPartyState = useCallback(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${partyId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading party state:', error);
    }
    return null;
  }, [partyId]);

  // Save party state to storage
  const savePartyState = useCallback(
    state => {
      try {
        localStorage.setItem(
          `${STORAGE_KEY}_${partyId}`,
          JSON.stringify({
            ...state,
            lastUpdate: Date.now(),
          })
        );
      } catch (error) {
        console.error('Error saving party state:', error);
      }
    },
    [partyId]
  );

  // Create new watch party
  const createParty = useCallback(
    (videoUrl, metadata) => {
      const newPartyId = generatePartyId();
      const currentUser = getCurrentUser();

      const initialState = {
        id: newPartyId,
        host: currentUser,
        participants: [currentUser],
        video: {
          url: videoUrl,
          metadata,
          currentTime: 0,
          isPlaying: false,
          playbackRate: 1,
        },
        messages: [],
        createdAt: new Date().toISOString(),
      };

      setPartyId(newPartyId);
      setIsHost(true);
      setParticipants([currentUser]);
      setIsConnected(true);
      savePartyState(initialState);

      return newPartyId;
    },
    [getCurrentUser, savePartyState]
  );

  // Join existing party
  const joinParty = useCallback(
    partyIdToJoin => {
      const state = loadPartyState();

      if (!state) {
        throw new Error('Party not found');
      }

      if (state.participants.length >= MAX_PARTICIPANTS) {
        throw new Error('Party is full');
      }

      const currentUser = getCurrentUser();
      const updatedState = {
        ...state,
        participants: [...state.participants, currentUser],
      };

      setPartyId(partyIdToJoin);
      setIsHost(false);
      setParticipants(updatedState.participants);
      setMessages(state.messages || []);
      setIsConnected(true);
      savePartyState(updatedState);

      // Send join message
      sendMessage(`${currentUser.username} joined the party`, 'system');

      return updatedState.video;
    },
    [getCurrentUser, loadPartyState, savePartyState, sendMessage]
  );

  // Leave party
  const leaveParty = useCallback(() => {
    if (!partyId) return;

    const state = loadPartyState();
    if (state) {
      const currentUser = getCurrentUser();
      const updatedParticipants = state.participants.filter(p => p.id !== currentUser.id);

      if (updatedParticipants.length === 0) {
        // Last person leaving, delete party
        localStorage.removeItem(`${STORAGE_KEY}_${partyId}`);
      } else {
        // Update participants list
        const updatedState = {
          ...state,
          participants: updatedParticipants,
          // If host is leaving, transfer to next participant
          host: isHost ? updatedParticipants[0] : state.host,
        };
        savePartyState(updatedState);
        sendMessage(`${currentUser.username} left the party`, 'system');
      }
    }

    // Clear local state
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    setPartyId(null);
    setIsHost(false);
    setParticipants([]);
    setMessages([]);
    setIsConnected(false);
  }, [partyId, isHost, getCurrentUser, loadPartyState, savePartyState, sendMessage]);

  // Sync video state
  const syncVideoState = useCallback(() => {
    if (!partyId || !videoRef?.current || !syncEnabled) return;

    const state = loadPartyState();
    if (!state) return;

    const video = videoRef.current;

    if (isHost) {
      // Host broadcasts current state
      const videoState = {
        currentTime: video.currentTime,
        isPlaying: !video.paused,
        playbackRate: video.playbackRate,
      };

      const updatedState = {
        ...state,
        video: {
          ...state.video,
          ...videoState,
        },
      };

      savePartyState(updatedState);
      lastSyncRef.current = videoState;
    } else {
      // Participants sync to host's state
      const hostState = state.video;

      if (!lastSyncRef.current || Math.abs(video.currentTime - hostState.currentTime) > 2) {
        // Significant desync, jump to correct time
        video.currentTime = hostState.currentTime;
      }

      if (hostState.isPlaying && video.paused) {
        video.play().catch(() => {});
      } else if (!hostState.isPlaying && !video.paused) {
        video.pause();
      }

      if (video.playbackRate !== hostState.playbackRate) {
        video.playbackRate = hostState.playbackRate;
      }

      lastSyncRef.current = hostState;
    }
  }, [partyId, videoRef, isHost, syncEnabled, loadPartyState, savePartyState]);

  // Send chat message
  const sendMessage = useCallback(
    (text, type = 'user') => {
      if (!partyId) return;

      const state = loadPartyState();
      if (!state) return;

      const currentUser = getCurrentUser();
      const message = {
        id: Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        text,
        type, // 'user', 'system', 'sync'
        timestamp: new Date().toISOString(),
      };

      const updatedState = {
        ...state,
        messages: [...state.messages, message],
      };

      savePartyState(updatedState);
      setMessages(updatedState.messages);
    },
    [partyId, getCurrentUser, loadPartyState, savePartyState]
  );

  // Poll for updates
  useEffect(() => {
    if (!partyId || !isConnected) return;

    const pollInterval = setInterval(() => {
      const state = loadPartyState();
      if (state) {
        setParticipants(state.participants || []);
        setMessages(state.messages || []);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [partyId, isConnected, loadPartyState]);

  // Setup sync interval
  useEffect(() => {
    if (!partyId || !isConnected || !videoRef?.current) return;

    syncIntervalRef.current = setInterval(syncVideoState, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [partyId, isConnected, videoRef, syncVideoState]);

  // Get party invite link
  const getInviteLink = useCallback(() => {
    if (!partyId) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/watch-party/${partyId}`;
  }, [partyId]);

  // Copy invite link
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

  // Share invite link
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
    } else {
      // Fallback to copy
      return copyInviteLink();
    }
  }, [getInviteLink, copyInviteLink]);

  // Toggle sync
  const toggleSync = useCallback(() => {
    setSyncEnabled(prev => !prev);
  }, []);

  // Kick participant (host only)
  const kickParticipant = useCallback(
    participantId => {
      if (!isHost || !partyId) return;

      const state = loadPartyState();
      if (!state) return;

      const updatedParticipants = state.participants.filter(p => p.id !== participantId);
      const kickedUser = state.participants.find(p => p.id === participantId);

      const updatedState = {
        ...state,
        participants: updatedParticipants,
      };

      savePartyState(updatedState);
      setParticipants(updatedParticipants);

      if (kickedUser) {
        sendMessage(`${kickedUser.username} was removed from the party`, 'system');
      }
    },
    [isHost, partyId, loadPartyState, savePartyState, sendMessage]
  );

  return {
    // State
    isHost,
    partyId,
    participants,
    messages,
    isConnected,
    syncEnabled,

    // Actions
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
