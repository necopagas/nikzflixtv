const ROOM_PREFIX = 'nikzflix_party_room_';
const DEFAULT_PARTICIPANT_KEY = 'nikzflix_username';

const createId = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(6))
      : Array.from({ length: 6 }, () => Math.floor(Math.random() * alphabet.length));
  return Array.from(bytes, byte => alphabet[byte % alphabet.length])
    .join('')
    .slice(0, 6);
};

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const createRoomCode = () => createId();

export const getRoomStorageKey = roomCode =>
  `${ROOM_PREFIX}${String(roomCode || '')
    .trim()
    .toUpperCase()}`;

export const loadRoom = roomCode => {
  if (typeof window === 'undefined' || !roomCode) return null;
  return safeParse(localStorage.getItem(getRoomStorageKey(roomCode)), null);
};

export const saveRoom = (roomCode, room) => {
  if (typeof window === 'undefined' || !roomCode) return null;
  const payload = {
    ...room,
    roomCode: String(roomCode).toUpperCase(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(getRoomStorageKey(roomCode), JSON.stringify(payload));
  return payload;
};

export const normalizeLegacyPartyRoom = (legacyRoom, roomCode) => {
  if (!legacyRoom) return null;

  const legacyHostUsername =
    legacyRoom?.host?.username ||
    legacyRoom?.participants?.find?.(participant => participant?.isHost)?.username ||
    (typeof window !== 'undefined' && localStorage.getItem(DEFAULT_PARTICIPANT_KEY)) ||
    'Host';

  return {
    roomCode: String(roomCode || legacyRoom?.roomCode || '').toUpperCase(),
    createdAt: legacyRoom?.createdAt || new Date().toISOString(),
    host: {
      id: legacyRoom?.host?.id || `host_${Date.now()}`,
      username: legacyHostUsername,
    },
    participants: Array.isArray(legacyRoom?.participants)
      ? legacyRoom.participants.map(participant => ({
          id: participant?.id || `participant_${Date.now()}`,
          username: participant?.username || 'Guest',
          isHost: Boolean(participant?.isHost),
        }))
      : [
          {
            id: `host_${Date.now()}`,
            username: legacyHostUsername,
            isHost: true,
          },
        ],
    media: {
      itemId: legacyRoom?.media?.itemId || legacyRoom?.video?.metadata?.itemId || null,
      mediaType:
        legacyRoom?.media?.mediaType ||
        legacyRoom?.video?.metadata?.mediaType ||
        (legacyRoom?.video?.metadata?.itemId ? 'movie' : 'tv'),
      title:
        legacyRoom?.media?.title ||
        legacyRoom?.video?.metadata?.title ||
        legacyRoom?.video?.metadata?.name ||
        'Watch Party',
      poster:
        legacyRoom?.media?.poster ||
        legacyRoom?.video?.metadata?.poster ||
        legacyRoom?.video?.metadata?.poster_path ||
        '',
      backdrop:
        legacyRoom?.media?.backdrop ||
        legacyRoom?.video?.metadata?.backdrop ||
        legacyRoom?.video?.metadata?.backdrop_path ||
        '',
      overview:
        legacyRoom?.media?.overview ||
        legacyRoom?.video?.metadata?.overview ||
        legacyRoom?.overview ||
        '',
      season: legacyRoom?.media?.season || legacyRoom?.video?.metadata?.season || 1,
      episode: legacyRoom?.media?.episode || legacyRoom?.video?.metadata?.episode || 1,
      source: legacyRoom?.media?.source || legacyRoom?.playback?.source || '111movies',
      playerUrl:
        legacyRoom?.media?.playerUrl ||
        legacyRoom?.video?.url ||
        legacyRoom?.video?.playerUrl ||
        '',
    },
    playback: {
      currentTime:
        legacyRoom?.playback?.currentTime ||
        legacyRoom?.video?.currentTime ||
        legacyRoom?.video?.metadata?.currentTime ||
        0,
      isPlaying:
        legacyRoom?.playback?.isPlaying ??
        legacyRoom?.video?.isPlaying ??
        legacyRoom?.isPlaying ??
        false,
      playbackRate: legacyRoom?.playback?.playbackRate || legacyRoom?.video?.playbackRate || 1,
      source: legacyRoom?.playback?.source || legacyRoom?.media?.source || '111movies',
    },
    chat: Array.isArray(legacyRoom?.chat)
      ? legacyRoom.chat
      : Array.isArray(legacyRoom?.messages)
        ? legacyRoom.messages
        : [],
  };
};

export const createRoomFromMedia = ({
  item,
  details,
  source,
  playerUrl,
  season = 1,
  episode = 1,
  initialTime = 0,
}) => {
  const roomCode = createRoomCode();
  const username =
    (typeof window !== 'undefined' && localStorage.getItem(DEFAULT_PARTICIPANT_KEY)) || 'Host';
  const hostId = `host_${Date.now()}`;

  const room = saveRoom(roomCode, {
    roomCode,
    createdAt: new Date().toISOString(),
    host: {
      id: hostId,
      username,
    },
    participants: [
      {
        id: hostId,
        username,
        isHost: true,
      },
    ],
    media: {
      itemId: item?.id,
      mediaType: item?.media_type || (item?.title ? 'movie' : 'tv'),
      title: details?.title || details?.name || item?.title || item?.name,
      poster: details?.poster_path || item?.poster_path || '',
      backdrop: details?.backdrop_path || item?.backdrop_path || '',
      overview: details?.overview || item?.overview || '',
      season,
      episode,
      source: source || '111movies',
      playerUrl: playerUrl || '',
    },
    playback: {
      currentTime: initialTime,
      isPlaying: false,
      playbackRate: 1,
      source: source || '111movies',
    },
    chat: [],
  });

  return room || loadRoom(roomCode);
};

export const updateRoom = (roomCode, updates) => {
  const current = loadRoom(roomCode);
  if (!current) return null;
  return saveRoom(roomCode, {
    ...current,
    ...updates,
    media: {
      ...current.media,
      ...(updates.media || {}),
    },
    playback: {
      ...current.playback,
      ...(updates.playback || {}),
    },
    participants: updates.participants || current.participants || [],
    chat: updates.chat || current.chat || [],
  });
};

export const appendChatMessage = (roomCode, message) => {
  const current = loadRoom(roomCode);
  if (!current) return null;
  const chat = [...(current.chat || []), message].slice(-200);
  return saveRoom(roomCode, { ...current, chat });
};

export const roomInviteLink = roomCode => {
  if (typeof window === 'undefined') return `/party/${roomCode}`;
  return `${window.location.origin}/party/${String(roomCode).toUpperCase()}`;
};
