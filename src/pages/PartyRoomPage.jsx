import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheck,
  FaClock,
  FaCopy,
  FaPause,
  FaPlay,
  FaPlus,
  FaMinus,
  FaComments,
  FaLink,
  FaShareAlt,
  FaServer,
  FaUsers,
  FaVideo,
  FaTimes,
} from 'react-icons/fa';
import { BACKDROP_PATH, EMBED_URLS, IMG_PATH, PLAYER_SOURCE_ORDER } from '../config';
import { usePartyRoom } from '../hooks/usePartyRoom';
import {
  loadRoom,
  normalizeLegacyPartyRoom,
  roomInviteLink,
  saveRoom,
} from '../utils/watchPartyRooms';

const formatTime = seconds => {
  const value = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(value / 3600);
  const mins = Math.floor((value % 3600) / 60);
  const secs = Math.floor(value % 60);
  return hrs > 0
    ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${mins}:${String(secs).padStart(2, '0')}`;
};

const buildPlayerUrl = (room, sourceName) => {
  const media = room?.media || {};
  const source = sourceName || media.source || room?.playback?.source || '111movies';
  const sourceConfig = EMBED_URLS[source];
  if (!sourceConfig) return '';
  if (media.itemId == null) return media.playerUrl || '';

  if (media.mediaType === 'tv' && typeof sourceConfig.tv === 'function') {
    return sourceConfig.tv(media.itemId, media.season || 1, media.episode || 1);
  }
  if (typeof sourceConfig.movie === 'function') {
    return sourceConfig.movie(media.itemId);
  }
  return media.playerUrl || '';
};

export const PartyRoomPage = () => {
  const { roomCode: routeRoomCode } = useParams();
  const roomCode = String(routeRoomCode || '').toUpperCase();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [joinMessage, setJoinMessage] = useState('');
  const [copyState, setCopyState] = useState('');
  const participantIdRef = useRef(
    `participant_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
  );

  const {
    room,
    setRoom,
    setPlayback,
    refresh,
    inviteLink,
    isHost,
    messageInput,
    setMessageInput,
    sendMessage,
  } = usePartyRoom(roomCode);

  const currentUsername =
    typeof window !== 'undefined' ? localStorage.getItem('nikzflix_username') || 'Guest' : 'Guest';

  useEffect(() => {
    if (!roomCode || room) return;

    const legacyKey = `nikzflix_watch_party_${roomCode}`;
    try {
      const raw = localStorage.getItem(legacyKey);
      if (!raw) return;
      const legacy = JSON.parse(raw);
      const normalized = normalizeLegacyPartyRoom(legacy, roomCode);
      if (normalized) {
        saveRoom(roomCode, normalized);
        refresh();
        setJoinMessage('Legacy invite migrated into the new party room format.');
      }
    } catch {
      setJoinMessage('Unable to load the shared room.');
    }
  }, [refresh, room, roomCode]);

  useEffect(() => {
    if (!room) return;

    const participants = Array.isArray(room.participants) ? room.participants : [];
    const existing = participants.find(
      participant =>
        participant.id === participantIdRef.current || participant.username === currentUsername
    );

    if (!existing) {
      setRoom({
        participants: [
          ...participants,
          {
            id: participantIdRef.current,
            username: currentUsername,
            isHost: isHost && room?.host?.username === currentUsername,
          },
        ],
      });
    }
  }, [currentUsername, isHost, room, setRoom]);

  useEffect(() => {
    if (!room || !isHost || !room?.playback?.isPlaying) return undefined;

    const timer = setInterval(() => {
      const latest = loadRoom(roomCode);
      if (!latest?.playback?.isPlaying) return;
      const nextTime = Number(latest?.playback?.currentTime || 0) + 1;
      setPlayback({ currentTime: nextTime });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHost, room, roomCode, setPlayback]);

  const roomTitle = room?.media?.title || 'Watch Together';
  const roomBackdrop = room?.media?.backdrop
    ? room.media.backdrop.startsWith('http')
      ? room.media.backdrop
      : `${BACKDROP_PATH}${room.media.backdrop}`
    : '';
  const roomPoster = room?.media?.poster
    ? room.media.poster.startsWith('http')
      ? room.media.poster
      : `${IMG_PATH}${room.media.poster}`
    : '';
  const activeSource = room?.playback?.source || room?.media?.source || '111movies';

  const availableSources = useMemo(
    () =>
      PLAYER_SOURCE_ORDER.filter(source => {
        const config = EMBED_URLS[source];
        if (!config) return false;
        return room?.media?.mediaType === 'tv'
          ? typeof config.tv === 'function'
          : typeof config.movie === 'function';
      }),
    [room?.media?.mediaType]
  );

  const playerUrl = useMemo(() => buildPlayerUrl(room, activeSource), [activeSource, room]);
  const liveTime = Number(room?.playback?.currentTime || 0);
  const inviteUrl = inviteLink || roomInviteLink(roomCode);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyState('Invite link copied.');
      setTimeout(() => setCopyState(''), 2200);
    } catch {
      setCopyState('Copy failed.');
      setTimeout(() => setCopyState(''), 2200);
    }
  };

  const shareInvite = async () => {
    if (!navigator.share) {
      await copyInvite();
      return;
    }

    try {
      await navigator.share({
        title: `${roomTitle} on NikzFlix TV`,
        text: 'Join my watch party room',
        url: inviteUrl,
      });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setCopyState('Share failed. Link copied instead.');
        await copyInvite();
      }
    }
  };

  const togglePlay = () => {
    if (!room) return;
    setPlayback({
      isPlaying: !room.playback?.isPlaying,
      currentTime: Number(room.playback?.currentTime || 0),
      source: activeSource,
    });
  };

  const seekBy = delta => {
    if (!room) return;
    const nextTime = Math.max(0, Number(room.playback?.currentTime || 0) + delta);
    setPlayback({
      currentTime: nextTime,
      source: activeSource,
    });
  };

  const setSource = source => {
    if (!room) return;
    setRoom({
      media: {
        source,
      },
      playback: {
        source,
      },
    });
    setJoinMessage(`Room source switched to ${source}.`);
  };

  const handleMessageSubmit = event => {
    event.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage();
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] px-4 pt-28 pb-20 text-white sm:px-8 md:px-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-2xl text-red-400">
            <FaUsers />
          </div>
          <h1 className="text-3xl font-black">Room not found</h1>
          <p className="mt-3 text-sm text-white/65">
            This watch party room does not exist yet, or the invite data still needs to be opened on
            the host device.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 rounded-full bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 pt-24 pb-20 text-white sm:px-8 md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <FaArrowLeft />
              Back
            </button>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-red-200">
              <FaVideo />
              Watch Party Room
            </div>
            <h1 className="text-4xl font-black sm:text-5xl">{roomTitle}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Room {room.roomCode}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Host {room.host?.username || 'Host'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {room.participants?.length || 0} watching
              </span>
            </div>
            {joinMessage ? <p className="mt-3 text-sm text-amber-200">{joinMessage}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyInvite}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <FaCopy />
              Copy Link
            </button>
            <button
              type="button"
              onClick={shareInvite}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              <FaShareAlt />
              Share
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-2xl">
              <div
                className="relative min-h-[18rem] bg-cover bg-center"
                style={{
                  backgroundImage: roomBackdrop
                    ? `linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4)), url(${roomBackdrop})`
                    : 'linear-gradient(135deg, rgba(228,9,20,0.22), rgba(0,0,0,0.95))',
                }}
              >
                <div className="grid gap-6 p-6 lg:grid-cols-[260px_1fr] lg:p-8">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    {roomPoster ? (
                      <img
                        src={roomPoster}
                        alt={roomTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] items-center justify-center text-white/40">
                        <FaVideo className="text-4xl" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                        Synced Room
                      </span>
                      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                        {room.playback?.isPlaying ? 'Playing' : 'Paused'}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-white/70">
                        {formatTime(liveTime)}
                      </span>
                    </div>

                    <h2 className="text-3xl font-black">
                      {room.media?.title || 'Shared playback'}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                      Shared state, synced source, and room chat all live in the same room record.
                      This front-end room is designed to keep everyone on the same title and source
                      selection.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                      >
                        {room.playback?.isPlaying ? <FaPause /> : <FaPlay />}
                        {room.playback?.isPlaying ? 'Pause' : 'Play'}
                      </button>
                      <button
                        type="button"
                        onClick={() => seekBy(-10)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        <FaMinus />
                        10s
                      </button>
                      <button
                        type="button"
                        onClick={() => seekBy(10)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        <FaPlus />
                        10s
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(prev => !prev)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        <FaComments />
                        {drawerOpen ? 'Hide Chat' : 'Show Chat'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-t border-white/10 bg-black/60 p-5 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
                      <FaClock className="text-red-400" />
                      Playback Time
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-3xl font-black">{formatTime(liveTime)}</p>
                        <p className="text-sm text-white/45">
                          {room.playback?.isPlaying
                            ? 'Advancing for everyone in the room'
                            : 'Paused and ready to sync'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/45">Source</p>
                        <p className="text-lg font-semibold text-white">{activeSource}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
                      <FaServer className="text-red-400" />
                      Active Sources
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSources.map(source => {
                        const active = source === activeSource;
                        return (
                          <button
                            key={source}
                            type="button"
                            onClick={() => setSource(source)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              active
                                ? 'bg-red-600 text-white'
                                : 'bg-black/30 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {source.replace('_', '.')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
                      <FaLink className="text-red-400" />
                      Invite Link
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        readOnly
                        value={inviteUrl}
                        className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/75 outline-none"
                      />
                      <button
                        type="button"
                        onClick={copyInvite}
                        className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                      >
                        Copy
                      </button>
                    </div>
                    {copyState ? (
                      <p className="mt-2 text-xs text-emerald-300">{copyState}</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
                    <FaUsers className="text-red-400" />
                    Participants
                  </div>
                  <div className="space-y-3">
                    {(room.participants || []).map(participant => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold">{participant.username}</p>
                          <p className="text-xs text-white/45">
                            {participant.isHost || participant.username === room.host?.username
                              ? 'Host'
                              : 'Guest'}
                          </p>
                        </div>
                        {participant.username === currentUsername ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                            <FaCheck />
                            You
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-bold">Room Notes</h3>
              <p className="mt-2 text-sm text-white/60">
                Watch-room sync is stored locally for this prototype, so anyone opening the same
                room code in another tab or device session gets the same playback state, source
                choice, and chat timeline.
              </p>
            </div>
          </div>

          <aside
            className={`fixed right-4 top-28 z-60 w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)] pointer-events-none'}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Room Chat</h3>
                <p className="text-xs text-white/45">Lightweight participant drawer</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white xl:hidden"
              >
                <FaTimes />
              </button>
            </div>

            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {(room.chat || []).length > 0 ? (
                room.chat.map(message => (
                  <div
                    key={message.id}
                    className={`rounded-2xl border border-white/10 px-3 py-2 ${message.type === 'system' ? 'bg-white/5 text-white/55' : 'bg-black/30'}`}
                  >
                    {message.type === 'user' ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-red-300">{message.username}</p>
                          <p className="text-[11px] text-white/35">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-white/80">{message.text}</p>
                      </>
                    ) : (
                      <p className="text-sm italic text-white/55">{message.text}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/45">
                  Start the conversation. Messages will appear here for everyone in the room.
                </div>
              )}
            </div>

            <form onSubmit={handleMessageSubmit} className="mt-4 flex gap-2">
              <input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Type a comment..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500"
              >
                Send
              </button>
            </form>
          </aside>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 text-sm text-white/65">
            <span>{room.media?.title || 'Shared playback'}</span>
            <span className="inline-flex items-center gap-2">
              <FaServer className="text-red-400" />
              {activeSource}
            </span>
          </div>
          <div className="aspect-video bg-black">
            {playerUrl ? (
              <iframe
                title={room.media?.title || 'Party Player'}
                src={playerUrl}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-fullscreen"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/45">
                No playable source for this room yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartyRoomPage;
