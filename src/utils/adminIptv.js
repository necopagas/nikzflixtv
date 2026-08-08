import { detectStreamType, parseClearkeyInput } from './iptvDrm';

const CHANNEL_STORAGE_KEY = 'iptv_user_channels';
const PLAYLIST_STORAGE_KEY = 'nikz_admin_playlists_v1';

const createId = prefix => {
  const raw = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '';
  return `${prefix}_${raw || `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`}`;
};

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const loadAdminChannels = () => {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(CHANNEL_STORAGE_KEY), []);
};

export const saveAdminChannels = channels => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHANNEL_STORAGE_KEY, JSON.stringify(channels));
};

export const loadAdminPlaylists = () => {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(PLAYLIST_STORAGE_KEY), []);
};

export const saveAdminPlaylists = playlists => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlists));
};

export const normalizeChannel = channel => {
  const streamType = detectStreamType(channel?.url || channel?.streamUrl || '');
  const drmKeys =
    channel?.drmKeys || channel?.dash?.drm?.clearkey?.keys || channel?.drm?.clearkey?.keys || [];

  const normalized = {
    id: channel?.id || createId('admin_channel'),
    name: String(channel?.name || channel?.title || 'Untitled channel').trim(),
    url: String(channel?.url || channel?.streamUrl || '').trim(),
    logo: channel?.logo || channel?.logoUrl || '',
    category: channel?.category || channel?.group || 'Custom',
    number: Number.isFinite(Number(channel?.number)) ? Number(channel.number) : null,
    streamType: channel?.streamType || streamType,
    fallback: channel?.fallback || '',
    originalName: channel?.originalName || channel?.name || '',
  };

  if (channel?.dash || channel?.streamType === 'dash' || streamType === 'dash') {
    const keys = Array.isArray(drmKeys)
      ? drmKeys
      : typeof drmKeys === 'string'
        ? parseClearkeyInput(drmKeys)
        : [];
    if (keys.length) {
      normalized.dash = {
        ...(channel?.dash || {}),
        drm: {
          clearkey: { keys },
        },
      };
    }
  }

  return normalized;
};

export const parseM3UPlaylist = (raw, sourceUrl = '') => {
  if (!raw) return [];

  const lines = String(raw)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const channels = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith('#EXTINF')) continue;

    let streamUrl = '';
    for (let j = i + 1; j < lines.length; j += 1) {
      const candidate = lines[j];
      if (!candidate || candidate.startsWith('#')) continue;
      streamUrl = candidate;
      break;
    }

    if (!streamUrl) continue;

    const groupMatch = line.match(/group-title="([^"]+)"/i);
    const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
    const nameMatch = line.includes(',') ? line.split(',').pop()?.trim() : '';
    const tvgNameMatch = line.match(/tvg-name="([^"]+)"/i);
    const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);
    const clearkeyMatch = line.match(/drm-key="([^"]+)"/i);

    channels.push(
      normalizeChannel({
        id: tvgIdMatch?.[1] || nameMatch || streamUrl,
        name: tvgNameMatch?.[1] || nameMatch || tvgIdMatch?.[1] || streamUrl,
        url: streamUrl,
        logo: logoMatch?.[1] || '',
        category: groupMatch?.[1] || 'Imported',
        source: sourceUrl || 'm3u-import',
        drmKeys: clearkeyMatch?.[1] || '',
      })
    );
  }

  return channels;
};

export const createChannel = input =>
  normalizeChannel({
    ...input,
    id: input?.id || createId('manual_channel'),
  });

export const updateChannel = (channels, channelId, updates) =>
  channels.map(channel =>
    channel.id === channelId ? normalizeChannel({ ...channel, ...updates, id: channelId }) : channel
  );

export const deleteChannel = (channels, channelId) =>
  channels.filter(channel => channel.id !== channelId);

export const checkStreamStatus = async (url, timeoutMs = 5000) => {
  if (!url) return { ok: false, status: 'offline', reason: 'Missing URL' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timer);
    return {
      ok: response.ok,
      status: response.ok ? 'online' : 'offline',
      httpStatus: response.status,
      latency: Date.now() - startedAt,
    };
  } catch (error) {
    clearTimeout(timer);
    return {
      ok: false,
      status: error?.name === 'AbortError' ? 'timeout' : 'offline',
      reason: error?.message || 'Request failed',
      latency: Date.now() - startedAt,
    };
  }
};
