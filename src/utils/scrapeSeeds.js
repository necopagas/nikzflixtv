// src/utils/scrapeSeeds.js
// Curated backup stream definitions that behave like scrape results

const normalize = value => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenize = value => normalize(value).split(' ').filter(Boolean);

const CHANNEL_SEEDS = [
  {
    label: 'PH Mirror Pack',
    region: 'philippines',
    updatedAt: '2025-11-04',
    entries: [
      {
        name: 'PTV 4',
        category: 'Government',
        patterns: ['ptv', 'ptv 4', 'ptv4', 'peoples television network', 'people television'],
        streams: [
          {
            url: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_ptv4_sd.mpd',
            quality: '576p',
            streamType: 'dash',
            source: 'community-mirror',
          },
          {
            url: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_ptv4_sd.m3u8',
            quality: '576p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'TV5',
        category: 'Entertainment',
        patterns: ['tv5', 'tv 5', 'kapatid channel', 'tv5 philippines', 'tv5 kapatid'],
        streams: [
          {
            url: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_tv5_hd.mpd',
            quality: '720p',
            streamType: 'dash',
            source: 'community-mirror',
            requiresProxy: false,
          },
          {
            url: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_tv5_hd.m3u8',
            quality: '720p',
            streamType: 'hls',
            source: 'community-mirror',
            requiresProxy: false,
          },
        ],
      },
      {
        name: 'IBC 13',
        category: 'Government',
        patterns: ['ibc', 'ibc 13', 'intercontinental broadcasting corporation'],
        streams: [
          {
            url: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_ibc13_sd.mpd',
            quality: '480p',
            streamType: 'dash',
            source: 'community-mirror',
          },
          {
            url: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_ibc13_sd.m3u8',
            quality: '480p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'One PH',
        category: 'News',
        patterns: ['one ph', 'oneph', 'cignal one ph'],
        streams: [
          {
            url: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_oneph_sd.mpd',
            quality: '540p',
            streamType: 'dash',
            source: 'community-mirror',
          },
          {
            url: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_oneph_sd.m3u8',
            quality: '540p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'GMA 7',
        category: 'Entertainment',
        patterns: ['gma 7', 'gma7', 'gma network', 'kapuso channel'],
        streams: [
          {
            url: 'https://tmob-p1.cdn.asset.apac.t5c.xyz/PLDT-P1/HLS/asset.m3u8',
            quality: '720p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'Kapamilya Channel',
        category: 'Entertainment',
        patterns: ['kapamilya channel', 'kapamilya online', 'abs cbn kapamilya'],
        streams: [
          {
            url: 'https://tmob-p1.cdn.asset.apac.t5c.xyz/ABS-CBN/Kapamilya/playlist.m3u8',
            quality: '720p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'A2Z Channel 11',
        category: 'Entertainment',
        patterns: ['a2z', 'a2z channel 11', 'a2z philippines'],
        streams: [
          {
            url: 'https://tmob-p1.cdn.asset.apac.t5c.xyz/A2Z/primary/playlist.m3u8',
            quality: '720p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'Cignal One News',
        category: 'News',
        patterns: ['one news', 'cignal news', 'cignal one news'],
        streams: [
          {
            url: 'https://qp-pldt-live-grp-01-prod.akamaized.net/out/u/cg_onenews_hd.mpd',
            quality: '720p',
            streamType: 'dash',
            source: 'community-mirror',
          },
          {
            url: 'https://qp-pldt-live-grp-01-prod.akamaized.net/out/u/cg_onenews_hd.m3u8',
            quality: '720p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'CNN Philippines',
        category: 'News',
        patterns: ['cnn philippines', 'cnn ph', 'cnnph'],
        streams: [
          {
            url: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cnn_cnnph_prod_hd.mpd',
            quality: '720p',
            streamType: 'dash',
            source: 'community-mirror',
          },
          {
            url: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cnn_cnnph_prod_hd.m3u8',
            quality: '720p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'Net 25',
        category: 'Entertainment',
        patterns: ['net25', 'net 25'],
        streams: [
          {
            url: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_net25_sd.mpd',
            quality: '540p',
            streamType: 'dash',
            source: 'community-mirror',
          },
          {
            url: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_net25_sd.m3u8',
            quality: '540p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
      {
        name: 'UNTV',
        category: 'News',
        patterns: ['untv', 'untv philippines'],
        streams: [
          {
            url: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_untv_sd.mpd',
            quality: '540p',
            streamType: 'dash',
            source: 'community-mirror',
          },
          {
            url: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_untv_sd.m3u8',
            quality: '540p',
            streamType: 'hls',
            source: 'community-mirror',
          },
        ],
      },
    ],
  },
];

export const getSeededScrapeCandidates = (
  channelName,
  { maxResults = 5, localOnly = false, targetRegion = null } = {}
) => {
  const normalized = normalize(channelName);
  if (!normalized) return [];
  const queryTokens = tokenize(channelName);

  const candidates = [];

  CHANNEL_SEEDS.forEach(pack => {
    const packRegion = pack.region || null;
    if (localOnly && targetRegion && packRegion && packRegion !== targetRegion) {
      return;
    }

    pack.entries.forEach(entry => {
      const patterns = Array.isArray(entry.patterns) ? entry.patterns : [];
      const matched = patterns.some(pattern => {
        const tokens = tokenize(pattern);
        if (!tokens.length) return false;
        return tokens.every(token => queryTokens.includes(token));
      });

      if (!matched) return;

      const streams = (entry.streams || [])
        .map(stream => ({
          url: stream.url,
          quality: stream.quality || null,
          streamType: stream.streamType || null,
          userAgent: null,
          referrer: null,
          requiresProxy: Boolean(stream.requiresProxy),
          source: stream.source || pack.label,
        }))
        .filter(stream => typeof stream.url === 'string' && stream.url.length > 4);

      if (!streams.length) return;

      candidates.push({
        id: `seed:${pack.label}:${entry.name}`,
        name: entry.name,
        logo: entry.logo || null,
        country: 'PH',
        categories: entry.categories || ['Community'],
        source: entry.source || pack.label,
        score: 45,
        region: packRegion,
        origin: 'seed',
        streams,
      });
    });
  });

  if (!candidates.length) return [];
  return candidates.slice(0, maxResults);
};
