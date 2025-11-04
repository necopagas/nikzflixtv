// src/utils/channelDiscovery.js
// Utility helpers for discovering IPTV stream candidates from public APIs

import { checkChannelHealth } from './channelHealthCheck.js';
import { getSeededScrapeCandidates } from './scrapeSeeds.js';

const CHANNELS_API_URL = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_API_URL = 'https://iptv-org.github.io/api/streams.json';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const channelCache = { data: null, timestamp: 0, promise: null };
const streamCache = { data: null, timestamp: 0, promise: null };

const FALLBACK_PLAYLISTS = [
  { url: 'https://raw.githubusercontent.com/SheyEm/PH_IPTV/main/PH.m3u', label: 'SheyEm/PH_IPTV' },
  { url: 'https://raw.githubusercontent.com/touchmetender/m3u/main/iptv.m3u', label: 'touchmetender/m3u' },
  { url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ph.m3u', label: 'iptv-org/streams/ph' },
];

const playlistCache = new Map();

const SCRAPE_CACHE_TTL = 15 * 60 * 1000;
const scrapeCache = new Map();
const PROXY_ENDPOINT = '/api/proxy?url=';

const SCRAPE_SOURCES = [
  {
    label: 'DuckDuckGo',
    buildUrl: (query) => `https://duckduckgo.com/html/?q=${encodeURIComponent(`${query} m3u8`)}`,
  },
  {
    label: 'IptvCat',
    buildUrl: (query) => `https://iptvcat.com/streaming/${encodeURIComponent(query)}`,
  },
  {
    label: 'GitHubSearch',
    buildUrl: (query) => `https://github.com/search?q=${encodeURIComponent(`${query} m3u8`)}&type=code`,
  },
];

const fetchWithCache = async (cacheRef, url, ttl = CACHE_TTL_MS) => {
  const isFresh = cacheRef.data && Date.now() - cacheRef.timestamp < ttl;
  if (isFresh) return cacheRef.data;
  if (cacheRef.promise) return cacheRef.promise;

  cacheRef.promise = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url} (${response.status})`);
      }
      return response.json();
    })
    .then((data) => {
      cacheRef.data = data;
      cacheRef.timestamp = Date.now();
      cacheRef.promise = null;
      return data;
    })
    .catch((error) => {
      cacheRef.promise = null;
      throw error;
    });

  return cacheRef.promise;
};

const parseM3UPlaylist = (raw, playlistMeta) => {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/);
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line || !line.startsWith('#EXTINF')) continue;

    const infoLine = line;
    let url = '';
    let pointer = i + 1;

    while (pointer < lines.length) {
      const candidate = lines[pointer]?.trim();
      if (!candidate) {
        pointer += 1;
        continue;
      }
      if (candidate.startsWith('#EXTINF')) break;
      if (candidate.startsWith('#')) {
        pointer += 1;
        continue;
      }
      url = candidate;
      break;
    }

    if (!url) continue;

    const nameSegment = infoLine.includes(',') ? infoLine.split(',').pop()?.trim() : null;
    const tvgIdMatch = infoLine.match(/tvg-id="([^"]+)"/i);
    const logoMatch = infoLine.match(/tvg-logo="([^"]+)"/i);
    const groupMatch = infoLine.match(/group-title="([^"]+)"/i);
    const qualityMatch = infoLine.match(/,\s*([0-9]{3,4}p)/i);

    entries.push({
      id: tvgIdMatch?.[1] || nameSegment || url,
      name: nameSegment || tvgIdMatch?.[1] || url,
      url,
      logo: logoMatch?.[1] || null,
      group: groupMatch?.[1] || null,
      quality: qualityMatch?.[1] || null,
      sourceId: playlistMeta.url,
      sourceLabel: playlistMeta.label,
    });
  }

  return entries;
};

const fetchPlaylistEntries = async (playlist, ttl = CACHE_TTL_MS) => {
  const cached = playlistCache.get(playlist.url);
  if (cached) {
    const fresh = cached.data && Date.now() - cached.timestamp < ttl;
    if (fresh) return cached.data;
    if (cached.promise) return cached.promise;
  }

  const promise = fetch(playlist.url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist ${playlist.url} (${response.status})`);
      }
      return response.text();
    })
    .then((text) => {
      const entries = parseM3UPlaylist(text, playlist);
      playlistCache.set(playlist.url, {
        data: entries,
        timestamp: Date.now(),
        promise: null,
      });
      return entries;
    })
    .catch((error) => {
      playlistCache.delete(playlist.url);
      throw error;
    });

  playlistCache.set(playlist.url, {
    data: null,
    timestamp: Date.now(),
    promise,
  });

  return promise;
};

const buildProxyUrl = (targetUrl) => {
  if (!targetUrl) return null;
  if (typeof window === 'undefined') return targetUrl;
  return `${PROXY_ENDPOINT}${encodeURIComponent(targetUrl)}`;
};

const fetchTextWithProxy = async (targetUrl) => {
  const requestUrl = buildProxyUrl(targetUrl);
  if (!requestUrl) return '';

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'x-iptv-scrape': '1',
      'User-Agent': 'Mozilla/5.0 (compatible; IPTVDiscoveryBot/1.0)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scrape target ${targetUrl} (${response.status})`);
  }

  return response.text();
};

const extractStreamUrls = (html) => {
  if (!html) return [];
  const urls = new Set();
  const absoluteRegex = /https?:\/\/[^\s"'<>]+\.(m3u8|mpd)[^\s"'<>]*/gi;
  let match;
  while ((match = absoluteRegex.exec(html))) {
    let url = match[0];
    if (!url) continue;
    url = url.replace(/&amp;/gi, '&').replace(/\\u0026/gi, '&');
    if (/https?:\/\/github\.com\//i.test(url) && url.includes('/blob/')) {
      url = url
        .replace('https://github.com/', 'https://raw.githubusercontent.com/')
        .replace('http://github.com/', 'https://raw.githubusercontent.com/')
        .replace('/blob/', '/');
    }
    if (/^https?:\/\//i.test(url)) {
      urls.add(url);
    }
  }

  const relativeRegex = /href="(\/[^"'<>]+\.(m3u8|mpd)[^"'<>]*)"/gi;
  while ((match = relativeRegex.exec(html))) {
    let path = match[1];
    if (!path) continue;
    let url = `https://github.com${path}`;
    url = url.replace(/&amp;/gi, '&').replace(/\\u0026/gi, '&');
    if (url.includes('/blob/')) {
      url = url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
    }
    if (/^https?:\/\//i.test(url)) {
      urls.add(url);
    }
  }
  return Array.from(urls);
};

const scrapeFallbackCandidates = async (channelName, options = {}) => {
  const {
    maxResults = 5,
    localOnly = false,
    targetRegion = null,
  } = options;

  const normalized = normalizeName(channelName);
  if (!normalized) return [];

  const cached = scrapeCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < SCRAPE_CACHE_TTL) {
    return cached.data.slice(0, maxResults);
  }

  const aggregated = [];
  const seenUrls = new Set();

  for (const source of SCRAPE_SOURCES) {
    if (!source?.buildUrl) continue;
    const target = source.buildUrl(channelName.trim());
    if (!target) continue;

    try {
      const html = await fetchTextWithProxy(target);
      const urls = extractStreamUrls(html);
      if (!urls.length) continue;

      const streams = [];
      for (const url of urls) {
        if (streams.length >= maxResults) break;
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        streams.push({
          url,
          quality: null,
          streamType: detectStreamType(url),
          userAgent: null,
          referrer: null,
          requiresProxy: false,
          source: source.label,
        });
      }

      if (!streams.length) continue;

      aggregated.push({
        id: `scrape:${source.label}:${normalized}`,
        name: channelName,
        logo: null,
        country: null,
        categories: [],
        source: source.label,
        score: 35,
        region: null,
        origin: 'scrape',
        streams,
      });
    } catch (error) {
      console.warn(`[IPTV] Failed scrape from ${source.label}`, error.message || error);
    }
  }

  const seeded = getSeededScrapeCandidates(channelName, {
    maxResults,
    localOnly,
    targetRegion,
  });

  const combined = [...aggregated];
  if (seeded.length) {
    seeded.forEach((candidate) => {
      const uniqueStreams = candidate.streams.filter((stream) => {
        if (!stream?.url || seenUrls.has(stream.url)) return false;
        seenUrls.add(stream.url);
        return true;
      });
      if (!uniqueStreams.length) return;
      combined.push({
        ...candidate,
        streams: uniqueStreams,
      });
    });
  }

  let filtered = combined;
  if (localOnly && targetRegion) {
    filtered = filtered.filter((candidate) => {
      if (!candidate) return false;
      if (!candidate.region) return true;
      return candidate.region === targetRegion;
    });
  }

  scrapeCache.set(normalized, { data: filtered, timestamp: Date.now() });
  return filtered.slice(0, maxResults);
};

const normalizeName = (value) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(tv|channel|hd)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const detectRegionToken = (value) => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (/\b(philippines|philippine|pinoy|filipino)\b/.test(lower)) return 'philippines';
  if (/\bph\b/.test(lower)) return 'philippines';
  if (/\b(mongolia|mongolian)\b/.test(lower)) return 'mongolia';
  if (/\b(thailand|thai)\b/.test(lower)) return 'thailand';
  if (/\b(malaysia|malaysian)\b/.test(lower)) return 'malaysia';
  if (/\b(indonesia|indonesian|indo)\b/.test(lower)) return 'indonesia';
  if (/\b(singapore|sg)\b/.test(lower)) return 'singapore';
  if (/\b(vietnam|vietnamese)\b/.test(lower)) return 'vietnam';
  if (/\b(uae|dubai|arab|middle east)\b/.test(lower)) return 'uae';
  if (/\b(india|indian)\b/.test(lower)) return 'india';
  if (/\b(pakistan|pakistani)\b/.test(lower)) return 'pakistan';
  if (/\b(japan|japanese)\b/.test(lower)) return 'japan';
  if (/\b(korea|korean)\b/.test(lower)) return 'korea';
  if (/\b(china|chinese)\b/.test(lower)) return 'china';
  if (/\b(usa|us|united states|america|american)\b/.test(lower)) return 'usa';
  if (/\b(uk|britain|british|england|london)\b/.test(lower)) return 'uk';
  return null;
};

const COUNTRY_REGION_HINTS = {
  PH: 'philippines',
  PHL: 'philippines',
  US: 'usa',
  USA: 'usa',
  GB: 'uk',
  GBR: 'uk',
  SG: 'singapore',
  SGP: 'singapore',
  MY: 'malaysia',
  MYS: 'malaysia',
  ID: 'indonesia',
  IDN: 'indonesia',
  TH: 'thailand',
  THA: 'thailand',
  JP: 'japan',
  JPN: 'japan',
  KR: 'korea',
  KOR: 'korea',
  VN: 'vietnam',
  VNM: 'vietnam',
  CN: 'china',
  CHN: 'china',
  AE: 'uae',
  ARE: 'uae',
  IN: 'india',
  IND: 'india',
  PK: 'pakistan',
  PAK: 'pakistan',
  MN: 'mongolia',
  MNG: 'mongolia',
};

const regionFromCountryCode = (code) => {
  if (!code) return null;
  return COUNTRY_REGION_HINTS[code.toUpperCase()] || null;
};

const tokenizeName = (value) => {
  const normalized = normalizeName(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
};

const detectChannelRegion = (channel) => {
  if (!channel) return null;
  let region = detectRegionToken(channel.name);
  if (!region && Array.isArray(channel.alt_names)) {
    for (const alt of channel.alt_names) {
      region = detectRegionToken(alt);
      if (region) break;
    }
  }
  if (!region && channel.country) {
    region = regionFromCountryCode(channel.country);
  }
  return region;
};

const computeMatchScore = (candidate, query) => {
  if (!candidate || !query) return 0;
  if (candidate === query) return 100;
  if (candidate.includes(query)) return 80;
  if (query.includes(candidate)) return 70;

  const candidateTokens = new Set(candidate.split(' '));
  const queryTokens = query.split(' ');
  let overlap = 0;
  queryTokens.forEach((token) => {
    if (candidateTokens.has(token)) overlap += 10;
  });
  return Math.min(60, overlap);
};

const parseQuality = (quality) => {
  if (!quality) return 0;
  if (typeof quality === 'number') return quality;
  const lower = quality.toLowerCase();
  if (lower === 'uhd' || lower === '4k') return 2160;
  if (lower === 'fhd') return 1080;
  if (lower === 'hd') return 720;
  const match = /([0-9]{3,4})p/.exec(lower);
  if (match) return parseInt(match[1], 10);
  return 0;
};

const detectStreamType = (url) => {
  if (!url) return 'unknown';
  const lower = url.toLowerCase();
  if (lower.includes('.m3u8') || lower.includes('format=m3u8')) return 'hls';
  if (lower.includes('.mpd') || lower.includes('manifest.mpd')) return 'dash';
  if (/(\.mp4|\.mkv|\.ts)(\?|$)/.test(lower)) return 'progressive';
  return 'unknown';
};

const requiresProxy = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const loadChannels = () => fetchWithCache(channelCache, CHANNELS_API_URL);
const loadStreams = () => fetchWithCache(streamCache, STREAMS_API_URL);

const buildChannelCandidates = (channels, query, options) => {
  const {
    country = 'PH',
    maxResults = 5,
    includeInternational = false,
    localOnly = false,
    targetRegion = null,
  } = options;
  const normalizedQuery = normalizeName(query);
  const queryRegion = detectRegionToken(query);
  const regionPriority = targetRegion || queryRegion || null;
  const queryTokens = new Set(tokenizeName(query));
  const normalizedCountry = country.toUpperCase();
  const localRegion = targetRegion || regionFromCountryCode(country) || queryRegion;
  if (!normalizedQuery) return [];

  return channels
    .filter((channel) => {
      if (!channel?.name) return false;
      if (!includeInternational && channel.country && channel.country !== country) return false;

      if (localOnly) {
        const channelCountry = channel.country ? channel.country.toUpperCase() : null;
        const channelRegion = detectChannelRegion(channel);
        if (channelCountry && channelCountry !== normalizedCountry) {
          if (!(localRegion && channelRegion && channelRegion === localRegion)) {
            return false;
          }
        }
        if (!channelCountry && localRegion && channelRegion && channelRegion !== localRegion) {
          return false;
        }
      }

      const normalizedName = normalizeName(channel.name);
      const altMatch = Array.isArray(channel.alt_names)
        ? channel.alt_names.some((alt) => normalizeName(alt).includes(normalizedQuery))
        : false;

      const score = Math.max(
        computeMatchScore(normalizedName, normalizedQuery),
        altMatch ? 50 : 0
      );

      return score > 0;
    })
    .map((channel) => {
      const normalizedName = normalizeName(channel.name);
      const altScore = Array.isArray(channel.alt_names)
        ? Math.max(...channel.alt_names.map((alt) => computeMatchScore(normalizeName(alt), normalizedQuery)))
        : 0;

      const baseScore = Math.max(computeMatchScore(normalizedName, normalizedQuery), altScore);

      const candidateTokens = new Set(tokenizeName(channel.name));
      if (Array.isArray(channel.alt_names)) {
        channel.alt_names.forEach((alt) => {
          tokenizeName(alt).forEach((token) => candidateTokens.add(token));
        });
      }

      const candidateRegion = detectChannelRegion(channel);
      const channelCountry = channel.country ? channel.country.toUpperCase() : null;

      let adjustedScore = baseScore;

      if (normalizedName === normalizedQuery) {
        adjustedScore += 30;
      } else if (channel.name?.toLowerCase() === String(query || '').toLowerCase()) {
        adjustedScore += 20;
      }

      if (queryTokens.size > 0) {
        let missingTokens = 0;
        queryTokens.forEach((token) => {
          if (!candidateTokens.has(token)) missingTokens += 1;
        });
        if (missingTokens === 0) {
          adjustedScore += 15;
        } else {
          adjustedScore -= missingTokens * 6;
        }
      }

      if (channelCountry) {
        if (channelCountry === normalizedCountry) {
          adjustedScore += 25;
        } else if (!includeInternational) {
          adjustedScore -= 50;
        } else {
          adjustedScore -= 25;
        }
      }

      if (regionPriority) {
        if (candidateRegion && candidateRegion === regionPriority) {
          adjustedScore += 25;
        } else if (candidateRegion && candidateRegion !== regionPriority) {
          adjustedScore -= 40;
        } else {
          adjustedScore -= 12;
        }
      } else if (queryRegion) {
        if (candidateRegion && candidateRegion === queryRegion) {
          adjustedScore += 15;
        } else if (candidateRegion && candidateRegion !== queryRegion) {
          adjustedScore -= 20;
        }
      }

      if (localOnly && localRegion) {
        if (candidateRegion && candidateRegion !== localRegion) {
          adjustedScore -= 45;
        } else if (!candidateRegion) {
          adjustedScore -= 15;
        }
      }

      const score = adjustedScore;

      return {
        id: channel.id,
        name: channel.name,
        logo: channel.logo ?? channel.tvg_logo ?? null,
        country: channel.country,
        categories: channel.categories || [],
        score,
        region: candidateRegion,
        origin: 'api',
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

const attachStreamsToCandidates = (candidates, streams) => {
  const streamByChannel = streams.reduce((map, stream) => {
    if (!stream?.channel) return map;
    if (!map.has(stream.channel)) map.set(stream.channel, []);
    map.get(stream.channel).push(stream);
    return map;
  }, new Map());

  return candidates.map((candidate) => {
    const streamList = streamByChannel.get(candidate.id) || [];
    const formattedStreams = streamList
      .filter((stream) => typeof stream.url === 'string')
      .map((stream) => ({
        url: stream.url,
        quality: stream.quality || null,
        streamType: detectStreamType(stream.url),
        userAgent: stream.user_agent || null,
        referrer: stream.referrer || null,
        requiresProxy: requiresProxy(stream.url),
        raw: stream,
      }))
      .sort((a, b) => parseQuality(b.quality) - parseQuality(a.quality));

    return {
      ...candidate,
      streams: formattedStreams,
    };
  });
};

const discoverFromPlaylists = async (channelName, options) => {
  const normalizedQuery = normalizeName(channelName);
  if (!normalizedQuery) return [];

  const {
    maxResults = 5,
    localOnly = false,
    country = 'PH',
    localRegion: explicitLocalRegion,
  } = options;
  const queryRegion = detectRegionToken(channelName);
  const queryTokens = new Set(tokenizeName(channelName));
  const localRegion = explicitLocalRegion || regionFromCountryCode(country) || queryRegion;

  const playlistEntries = await Promise.all(
    FALLBACK_PLAYLISTS.map(async (playlist) => {
      try {
        return await fetchPlaylistEntries(playlist);
      } catch (error) {
        console.warn(`[IPTV] Failed to load playlist ${playlist.url}`, error.message || error);
        return [];
      }
    })
  );

  const entries = playlistEntries.flat();
  if (!entries.length) return [];

  const candidateMap = new Map();

  entries.forEach((entry) => {
    if (!entry?.name || !entry?.url) return;
    const normalizedName = normalizeName(entry.name);
    const score = computeMatchScore(normalizedName, normalizedQuery);
    if (score <= 0) return;

    let entryRegion = detectRegionToken(entry.name);
    if (!entryRegion && entry.group) {
      entryRegion = detectRegionToken(entry.group);
    }
    if (!entryRegion && entry.sourceId) {
      const loweredSource = entry.sourceId.toLowerCase();
      if (loweredSource.includes('/ph') || loweredSource.includes('philippines')) {
        entryRegion = 'philippines';
      } else if (loweredSource.includes('/sg') || loweredSource.includes('singapore')) {
        entryRegion = 'singapore';
      } else if (loweredSource.includes('/th') || loweredSource.includes('thailand')) {
        entryRegion = 'thailand';
      }
    }
    if (!entryRegion && entry.sourceLabel) {
      const loweredSource = entry.sourceLabel.toLowerCase();
      if (loweredSource.includes('philippines') || loweredSource.includes('ph ')) {
        entryRegion = 'philippines';
      }
    }

    let adjustedScore = score;
    if (queryRegion && entryRegion && queryRegion !== entryRegion) {
      adjustedScore -= 40;
    } else if (queryRegion && !entryRegion) {
      adjustedScore -= 10;
    }

    if (entryRegion && queryRegion && entryRegion === queryRegion) {
      adjustedScore += 15;
    }

    if (queryTokens.size > 0) {
      const entryTokens = new Set(tokenizeName(entry.name));
      let missingTokens = 0;
      queryTokens.forEach((token) => {
        if (!entryTokens.has(token)) missingTokens += 1;
      });
      if (missingTokens === 0) {
        adjustedScore += 10;
      } else {
        adjustedScore -= missingTokens * 5;
      }
    }

    if (localOnly && localRegion) {
      if (entryRegion && entryRegion !== localRegion) {
        return;
      }
      if (!entryRegion) {
        adjustedScore -= 15;
      }
    }
    if (adjustedScore <= 0) return;

    const stream = {
      url: entry.url,
      quality: entry.quality || null,
      streamType: detectStreamType(entry.url),
      userAgent: null,
      referrer: null,
      requiresProxy: requiresProxy(entry.url),
      source: entry.sourceLabel,
    };

    const key = `${entry.sourceId}:${entry.id}`;
    if (candidateMap.has(key)) {
      candidateMap.get(key).streams.push(stream);
      candidateMap.get(key).score = Math.max(candidateMap.get(key).score, adjustedScore);
      return;
    }

    candidateMap.set(key, {
      id: entry.id,
      name: entry.name,
      logo: entry.logo || null,
      country: null,
      categories: entry.group ? [entry.group] : [],
      source: entry.sourceLabel,
      score: adjustedScore,
      region: entryRegion,
      origin: 'playlist',
      streams: [stream],
    });
  });

  let playlistCandidates = Array.from(candidateMap.values())
    .map((candidate) => ({
      ...candidate,
      streams: candidate.streams.sort((a, b) => parseQuality(b.quality) - parseQuality(a.quality)),
    }))
    .sort((a, b) => b.score - a.score);

  if (localOnly && localRegion) {
    playlistCandidates = playlistCandidates.filter((candidate) => {
      if (!candidate) return false;
      if (candidate.region && candidate.region !== localRegion) {
        return false;
      }
      return true;
    });
  }

  return playlistCandidates.slice(0, maxResults);
};

const dedupeCandidates = (candidates) => {
  const seenUrls = new Set();
  return candidates
    .map((candidate) => {
      const uniqueStreams = candidate.streams.filter((stream) => {
        if (!stream?.url) return false;
        if (seenUrls.has(stream.url)) return false;
        seenUrls.add(stream.url);
        return true;
      });

      if (!uniqueStreams.length) return null;

      return {
        ...candidate,
        streams: uniqueStreams,
      };
    })
    .filter(Boolean);
};

const verifyTopStreams = async (candidate, limit, timeout) => {
  const streamsToTest = candidate.streams.slice(0, limit);
  const results = await Promise.all(
    streamsToTest.map(async (stream) => {
      try {
        const health = await checkChannelHealth(stream.url, timeout);
        return { ...stream, health };
      } catch (error) {
        return {
          ...stream,
          health: {
            isAlive: false,
            status: 'offline',
            error: error.message,
          },
        };
      }
    })
  );

  const enriched = candidate.streams.map((stream) => {
    const match = results.find((tested) => tested.url === stream.url);
    return match ? match : stream;
  });

  return { ...candidate, streams: enriched };
};

const weightOrigin = (origin) => {
  if (origin === 'playlist') return 2;
  if (origin === 'api') return 1;
  if (origin === 'seed') return 0;
  if (origin === 'scrape') return -1;
  return 0;
};

const compareCandidates = (a, b) => {
  const weightA = weightOrigin(a?.origin);
  const weightB = weightOrigin(b?.origin);
  if (weightA !== weightB) return weightB - weightA;

  const scoreA = a?.score ?? 0;
  const scoreB = b?.score ?? 0;
  if (scoreA !== scoreB) return scoreB - scoreA;

  const nameA = (a?.name || '').toLowerCase();
  const nameB = (b?.name || '').toLowerCase();
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};

export const discoverChannelStreams = async (channelName, options = {}) => {
  const {
    country = 'PH',
    maxResults = 5,
    includeInternational: includeInternationalOption,
    verify = false,
    verifyLimit = 2,
    verifyTimeout = 4000,
    localOnly = false,
    localRegion: explicitLocalRegion,
    enableScraping = true,
  } = options;

  const includeInternational = localOnly ? false : (includeInternationalOption ?? false);
  const normalizedCountry = country || 'PH';
  const localRegionFallback = regionFromCountryCode(normalizedCountry);
  const targetRegion = explicitLocalRegion || localRegionFallback || null;

  if (!channelName) return [];

  const [channels, streams, playlistMatches] = await Promise.all([
    loadChannels(),
    loadStreams(),
    discoverFromPlaylists(channelName, {
      maxResults,
      localOnly,
      country: normalizedCountry,
      localRegion: targetRegion,
    }),
  ]);

  const candidates = buildChannelCandidates(channels, channelName, {
    country: normalizedCountry,
    maxResults,
    includeInternational,
    localOnly,
    targetRegion,
  });

  const withStreams = attachStreamsToCandidates(candidates, streams);
  const filtered = withStreams.filter((candidate) => candidate.streams.length > 0);

  const orderedInput = [...playlistMatches, ...filtered].sort(compareCandidates);
  let combined = dedupeCandidates(orderedInput);

  if (localOnly) {
    combined = combined.filter((candidate) => {
      if (!candidate) return false;
      if (candidate.country && candidate.country.toUpperCase() !== normalizedCountry.toUpperCase()) {
        if (targetRegion) {
          const candidateRegion = candidate.region || regionFromCountryCode(candidate.country) || detectRegionToken(candidate.name);
          if (candidateRegion !== targetRegion) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (targetRegion) {
        const candidateRegion = candidate.region || regionFromCountryCode(candidate.country) || detectRegionToken(candidate.name);
        if (candidateRegion && candidateRegion !== targetRegion) {
          return false;
        }
      }

      return true;
    });
  }

  if (!combined.length && enableScraping) {
    try {
      const scraped = await scrapeFallbackCandidates(channelName, {
        maxResults,
        localOnly,
        targetRegion,
      });
      if (scraped.length) {
        combined = dedupeCandidates(scraped.sort(compareCandidates));
      }
    } catch (error) {
      console.warn('[IPTV] Scrape fallback failed', error.message || error);
    }
  }

  if (!combined.length) return [];

  if (!verify) return combined.sort(compareCandidates);

  const verified = [];
  for (const candidate of combined) {
    const enriched = await verifyTopStreams(candidate, verifyLimit, verifyTimeout);
    verified.push(enriched);
  }

  return verified.sort(compareCandidates);
};

export const discoverChannelsBatch = async (channelNames, options = {}) => {
  if (!Array.isArray(channelNames) || channelNames.length === 0) return new Map();

  const result = new Map();
  for (const name of channelNames) {
    try {
      const streams = await discoverChannelStreams(name, options);
      result.set(name, streams);
    } catch (error) {
      result.set(name, { error: error.message, streams: [] });
    }
  }
  return result;
};

export const clearDiscoveryCache = () => {
  channelCache.data = null;
  channelCache.timestamp = 0;
  channelCache.promise = null;
  streamCache.data = null;
  streamCache.timestamp = 0;
  streamCache.promise = null;
  playlistCache.clear();
  scrapeCache.clear();
};
