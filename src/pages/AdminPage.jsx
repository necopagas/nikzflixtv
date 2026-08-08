import React, { useEffect, useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaEdit,
  FaFileImport,
  FaLock,
  FaPlus,
  FaSave,
  FaSearch,
  FaSignal,
  FaSpinner,
  FaTrash,
  FaTv,
} from 'react-icons/fa';
import { useProfile } from '../context/ProfileContext.jsx';
import {
  checkStreamStatus,
  createChannel,
  deleteChannel,
  loadAdminChannels,
  loadAdminPlaylists,
  parseM3UPlaylist,
  saveAdminChannels,
  saveAdminPlaylists,
} from '../utils/adminIptv';

const ADMIN_SESSION_KEY = 'nikz_admin_unlocked_v1';
const DEFAULT_PIN = '1234';

const emptyForm = {
  name: '',
  category: 'Custom',
  logo: '',
  url: '',
  streamType: 'auto',
  number: '',
  drmKeys: '',
};

const statusTone = status => {
  if (!status) return 'text-white/50';
  if (status === 'online') return 'text-emerald-400';
  if (status === 'timeout') return 'text-amber-400';
  return 'text-rose-400';
};

const normalizeChannels = channels =>
  (Array.isArray(channels) ? channels : [])
    .filter(Boolean)
    .map(channel => ({
      ...channel,
      name: String(channel.name || '').trim(),
      url: String(channel.url || '').trim(),
      category: String(channel.category || 'Custom').trim() || 'Custom',
    }))
    .filter(channel => channel.name && channel.url);

export const AdminPage = () => {
  const { parentPin } = useProfile();
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  });
  const [pinInput, setPinInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [channels, setChannels] = useState(() => loadAdminChannels());
  const [playlists, setPlaylists] = useState(() => loadAdminPlaylists());
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistLabel, setPlaylistLabel] = useState('');
  const [playlistRaw, setPlaylistRaw] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [statusMap, setStatusMap] = useState({});
  const [busyId, setBusyId] = useState('');
  const [feedback, setFeedback] = useState(
    'Manage IPTV playlists, channels, and stream status from one place.'
  );

  useEffect(() => {
    saveAdminChannels(channels);
  }, [channels]);

  useEffect(() => {
    saveAdminPlaylists(playlists);
  }, [playlists]);

  useEffect(() => {
    if (isUnlocked && typeof window !== 'undefined') {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    }
  }, [isUnlocked]);

  const handleUnlock = event => {
    event.preventDefault();
    const expected = String(parentPin || DEFAULT_PIN).trim();
    const entered = String(pinInput || '').trim();
    if (entered && entered === expected) {
      setIsUnlocked(true);
      setUnlockError('');
      setFeedback('Admin panel unlocked.');
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    } else {
      setUnlockError('Incorrect 4-digit PIN.');
    }
  };

  const categories = useMemo(() => {
    const set = new Set(['all']);
    channels.forEach(channel => {
      if (channel?.category) set.add(channel.category);
    });
    return Array.from(set);
  }, [channels]);

  const filteredChannels = useMemo(() => {
    const query = search.trim().toLowerCase();
    return channels
      .filter(channel =>
        selectedCategory === 'all'
          ? true
          : String(channel.category || '').toLowerCase() === selectedCategory.toLowerCase()
      )
      .filter(channel => {
        if (!query) return true;
        return (
          String(channel.name || '')
            .toLowerCase()
            .includes(query) ||
          String(channel.category || '')
            .toLowerCase()
            .includes(query) ||
          String(channel.url || '')
            .toLowerCase()
            .includes(query)
        );
      });
  }, [channels, search, selectedCategory]);

  const stats = useMemo(() => {
    const total = channels.length;
    const online = Object.values(statusMap).filter(result => result?.status === 'online').length;
    const offline = Object.values(statusMap).filter(
      result => result && result.status !== 'online'
    ).length;
    const imported = playlists.reduce((sum, playlist) => sum + (playlist?.count || 0), 0);
    return { total, online, offline, imported };
  }, [channels.length, playlists, statusMap]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const handleEdit = channel => {
    setEditingId(channel.id);
    setForm({
      name: channel.name || '',
      category: channel.category || 'Custom',
      logo: channel.logo || '',
      url: channel.url || '',
      streamType: channel.streamType || 'auto',
      number: channel.number ?? '',
      drmKeys: Array.isArray(channel?.dash?.drm?.clearkey?.keys)
        ? JSON.stringify(channel.dash.drm.clearkey.keys)
        : '',
    });
    setFeedback(`Editing ${channel.name}.`);
  };

  const handleSubmitChannel = event => {
    event.preventDefault();

    const payload = createChannel({
      id: editingId || undefined,
      name: form.name,
      category: form.category,
      logo: form.logo,
      url: form.url,
      streamType: form.streamType === 'auto' ? undefined : form.streamType,
      number: form.number,
      drmKeys: form.drmKeys,
    });

    setChannels(prev => {
      const existing = normalizeChannels(prev);
      const next = editingId
        ? existing.map(channel => (channel.id === editingId ? { ...channel, ...payload } : channel))
        : [...existing, payload];
      return next;
    });

    setFeedback(editingId ? `Updated ${payload.name}.` : `Added ${payload.name}.`);
    resetForm();
  };

  const handleDeleteChannel = channelId => {
    if (!window.confirm('Delete this channel?')) return;
    setChannels(prev => deleteChannel(prev, channelId));
    if (editingId === channelId) resetForm();
    setFeedback('Channel deleted.');
  };

  const handlePingChannel = async channel => {
    setBusyId(channel.id);
    try {
      const result = await checkStreamStatus(channel.url);
      setStatusMap(prev => ({ ...prev, [channel.id]: result }));
      setFeedback(
        `${channel.name} is ${result.status}${typeof result.latency === 'number' ? ` (${result.latency}ms)` : ''}.`
      );
    } finally {
      setBusyId('');
    }
  };

  const handlePingAll = async () => {
    for (const channel of filteredChannels) {
      // Sequential ping keeps the UI quieter for large lists.

      await handlePingChannel(channel);
    }
  };

  const handleImportPlaylist = async event => {
    event.preventDefault();
    const source = playlistRaw.trim();
    if (!source && !playlistUrl.trim()) {
      setFeedback('Paste an M3U playlist URL or raw playlist text first.');
      return;
    }

    try {
      let rawText = source;
      let resolvedUrl = playlistUrl.trim();
      if (!rawText || !rawText.includes('#EXTINF')) {
        const response = await fetch(resolvedUrl || source);
        if (!response.ok) {
          throw new Error(`Failed to fetch playlist (${response.status})`);
        }
        rawText = await response.text();
        resolvedUrl = resolvedUrl || source;
      }

      const parsed = parseM3UPlaylist(rawText, resolvedUrl || 'manual-import');
      if (!parsed.length) {
        setFeedback('No channels were found in that playlist.');
        return;
      }

      setChannels(prev => {
        const merged = [...normalizeChannels(prev)];
        parsed.forEach(channel => {
          const duplicateIndex = merged.findIndex(
            existing =>
              existing.url === channel.url ||
              existing.name.toLowerCase() === channel.name.toLowerCase()
          );
          if (duplicateIndex >= 0) {
            merged[duplicateIndex] = { ...merged[duplicateIndex], ...channel };
          } else {
            merged.push(channel);
          }
        });
        return merged;
      });

      setPlaylists(prev => [
        {
          id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          label: playlistLabel.trim() || resolvedUrl || 'Imported playlist',
          url: resolvedUrl || '',
          count: parsed.length,
          importedAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      setFeedback(`Imported ${parsed.length} channels from playlist.`);
      setPlaylistUrl('');
      setPlaylistLabel('');
      setPlaylistRaw('');
    } catch (error) {
      setFeedback(error?.message || 'Playlist import failed.');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] px-4 pt-28 pb-20 text-white sm:px-8 md:px-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-3xl text-red-400">
            <FaLock />
          </div>
          <h1 className="text-3xl font-black">Admin Panel</h1>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Enter the 4-digit parent PIN to manage IPTV channels and playlist imports.
          </p>
          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <input
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              autoFocus
              placeholder="1234"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-center text-lg tracking-[0.5em] text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/40"
            />
            {unlockError ? <p className="text-sm text-rose-400">{unlockError}</p> : null}
            <button className="w-full rounded-full bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500">
              Unlock Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 pt-28 pb-20 text-white sm:px-8 md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-red-200">
              <FaTv />
              IPTV Admin
            </div>
            <h1 className="text-4xl font-black sm:text-5xl">Channel Manager</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              Import M3U playlists, manually manage channels, and ping stream URLs before pushing
              them into Live TV.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setFeedback(
                'Channels are stored locally in `iptv_user_channels` so Live TV picks them up automatically.'
              )
            }
            className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Local channel storage
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/55">Channels</p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="text-sm text-emerald-100/70">Online</p>
            <p className="mt-2 text-3xl font-black text-emerald-300">{stats.online}</p>
          </div>
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
            <p className="text-sm text-rose-100/70">Offline / Unknown</p>
            <p className="mt-2 text-3xl font-black text-rose-300">{stats.offline}</p>
          </div>
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-100/70">Imported this session</p>
            <p className="mt-2 text-3xl font-black text-amber-300">{stats.imported}</p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-sm text-white/75">
            <FaSignal className="text-red-400" />
            {feedback}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <form
              onSubmit={handleSubmitChannel}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="mb-4 flex items-center gap-2 text-lg font-bold">
                <FaPlus className="text-red-400" />
                {editingId ? 'Edit Channel' : 'Add Channel'}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Channel Name
                  </span>
                  <input
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                    placeholder="GMA 7"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Category
                  </span>
                  <input
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                    placeholder="Local"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Logo URL
                  </span>
                  <input
                    value={form.logo}
                    onChange={e => setForm(prev => ({ ...prev, logo: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                    placeholder="https://..."
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Stream URL
                  </span>
                  <input
                    value={form.url}
                    onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                    placeholder="https://.../playlist.m3u8"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Channel Number
                  </span>
                  <input
                    value={form.number}
                    onChange={e =>
                      setForm(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '') }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                    placeholder="7"
                    inputMode="numeric"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Stream Type
                  </span>
                  <select
                    value={form.streamType}
                    onChange={e => setForm(prev => ({ ...prev, streamType: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="hls">HLS / M3U8</option>
                    <option value="dash">DASH / MPD</option>
                    <option value="progressive">Progressive</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                  DRM Keys for DASH / ClearKey
                </span>
                <textarea
                  value={form.drmKeys}
                  onChange={e => setForm(prev => ({ ...prev, drmKeys: e.target.value }))}
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                  placeholder='[{"kid":"...","k":"..."}] or raw key string'
                />
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500">
                  <FaSave />
                  {editingId ? 'Save Channel' : 'Add Channel'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white/75 transition hover:bg-white/10"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <form
              onSubmit={handleImportPlaylist}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="mb-4 flex items-center gap-2 text-lg font-bold">
                <FaFileImport className="text-red-400" />
                M3U Playlist Import
              </div>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                  Playlist URL
                </span>
                <input
                  value={playlistUrl}
                  onChange={e => setPlaylistUrl(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                  placeholder="https://example.com/playlist.m3u8"
                />
              </label>
              <label className="mt-4 block space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                  Playlist Label
                </span>
                <input
                  value={playlistLabel}
                  onChange={e => setPlaylistLabel(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                  placeholder="Cignal Premium"
                />
              </label>
              <label className="mt-4 block space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-white/50">
                  Raw M3U Text
                </span>
                <textarea
                  value={playlistRaw}
                  onChange={e => setPlaylistRaw(e.target.value)}
                  className="min-h-52 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
                  placeholder="#EXTM3U..."
                />
              </label>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15">
                <FaSave />
                Import Playlist
              </button>
            </form>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(category => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-red-600 text-white'
                      : 'bg-black/30 text-white/65 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          <div className="flex flex-1 items-center gap-3 lg:max-w-md">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-black/40 py-3 pl-11 pr-4 outline-none focus:border-red-500"
                placeholder="Search channels or streams..."
              />
            </div>
            <button
              type="button"
              onClick={handlePingAll}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              Ping Visible
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Channels</h2>
              <span className="text-sm text-white/50">{filteredChannels.length} shown</span>
            </div>

            <div className="space-y-3">
              {filteredChannels.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-white/55">
                  No channels match the current filters.
                </div>
              ) : (
                filteredChannels.map(channel => {
                  const status = statusMap[channel.id];
                  return (
                    <div
                      key={channel.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                          <FaTv />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold">{channel.name}</h3>
                            {channel.number ? (
                              <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-white/65">
                                #{channel.number}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-white/55">
                              {channel.category || 'Custom'}
                            </span>
                            <span className={`text-xs font-semibold ${statusTone(status?.status)}`}>
                              {status?.status || channel.streamType || 'unchecked'}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-white/45">{channel.url}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePingChannel(channel)}
                          disabled={busyId === channel.id}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyId === channel.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaSignal />
                          )}
                          Ping
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(channel)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                        >
                          <FaEdit />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChannel(channel.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <h2 className="text-xl font-bold">Imported Playlists</h2>
              <div className="mt-4 space-y-3">
                {playlists.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/55">
                    No playlists imported yet.
                  </p>
                ) : (
                  playlists.map(playlist => (
                    <div
                      key={playlist.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{playlist.label}</p>
                          <p className="mt-1 text-sm text-white/45">
                            {playlist.url || 'Raw import'}
                          </p>
                        </div>
                        <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-200">
                          {playlist.count || 0} channels
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-white/35">
                        Imported {new Date(playlist.importedAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-red-500/15 via-black/40 to-black/40 p-5">
              <h2 className="text-xl font-bold">Admin Notes</h2>
              <ul className="mt-4 space-y-2 text-sm text-white/65">
                <li>• Imported channels are saved into `iptv_user_channels`.</li>
                <li>• The Live TV page picks them up automatically.</li>
                <li>
                  • Ping uses a fetch-based reachability check, so some CDN streams may report
                  offline if they block CORS.
                </li>
                <li>
                  • PIN defaults to `1234` until the parent PIN is changed elsewhere in the app.
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-2 text-sm text-emerald-300">
                <FaCheckCircle />
                Ready for IPTV management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
