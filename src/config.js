// src/config.js

// --- TMDB API CONFIG ---
const FALLBACK_TMDB_KEY = '3b0f392b6173455e37624a78bd5f79d4';
const resolvedKey = (import.meta.env?.VITE_TMDB_API_KEY || FALLBACK_TMDB_KEY || '').trim();

if (!import.meta.env?.VITE_TMDB_API_KEY) {
  console.warn('[TMDB] VITE_TMDB_API_KEY not found. Falling back to bundled demo key.');
}

export const API_KEY = resolvedKey;
export const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
export const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

// Keywords
const ANIME_KEYWORD = '210024';
const ISEKAI_KEYWORD = '193808';
const CHINESE_DRAMA_KEYWORD = '339110';
const CURRENT_DATE = new Date().toISOString().split('T')[0];

// --- ANIME GENRES ---
export const ANIME_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 9648, name: 'Mystery' },
  { id: 99999, name: 'Isekai' },
];

// --- MOVIE GENRES ---
export const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

// --- API ENDPOINTS ---
const tmdb = path => `https://api.themoviedb.org/3${path}?api_key=${API_KEY}`;
const toQS = (params = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

export const API_ENDPOINTS = {
  trending: tmdb('/trending/all/day'),
  popular: tmdb('/movie/popular'),
  toprated: tmdb('/movie/top_rated'),
  tvshows: tmdb('/tv/popular'),

  asianDramas: `${tmdb('/discover/tv')}&with_keywords=${CHINESE_DRAMA_KEYWORD}&sort_by=popularity.desc`,
  dramaPopular: `${tmdb('/discover/tv')}&with_keywords=${CHINESE_DRAMA_KEYWORD}&sort_by=popularity.desc`,
  dramaTopRated: `${tmdb('/discover/tv')}&with_keywords=${CHINESE_DRAMA_KEYWORD}&sort_by=vote_average.desc&vote_count.gte=50`,

  anime: `${tmdb('/discover/tv')}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animePopular: `${tmdb('/discover/tv')}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animeTopRated: `${tmdb('/discover/tv')}&with_keywords=${ANIME_KEYWORD}&sort_by=vote_average.desc&vote_count.gte=500`,
  animeNewReleases: `${tmdb('/discover/tv')}&with_keywords=${ANIME_KEYWORD}&sort_by=first_air_date.desc&air_date.lte=${CURRENT_DATE}`,
  animeByGenre: genreId =>
    `${tmdb('/discover/tv')}&with_keywords=${ANIME_KEYWORD}&with_genres=${genreId}&sort_by=popularity.desc`,
  animeIsekai: `${tmdb('/discover/tv')}&with_keywords=${ANIME_KEYWORD},${ISEKAI_KEYWORD}&sort_by=popularity.desc`,

  search: (query, page = 1) =>
    `${tmdb('/search/multi')}&query=${encodeURIComponent(query)}&page=${page}`,
  searchTv: (query, page = 1) =>
    `${tmdb('/search/tv')}&query=${encodeURIComponent(query)}&page=${page}`,
  details: (type, id) => `${tmdb(`/${type}/${id}`)}&append_to_response=videos,credits,external_ids`,
  recommendations: (type, id) => tmdb(`/${type}/${id}/recommendations`),
  byGenre: genreId => `${tmdb('/discover/movie')}&with_genres=${genreId}&sort_by=popularity.desc`,
  discoverMovies: params => `${tmdb('/discover/movie')}&${toQS(params)}`,
};

// --- EMBED SOURCES ---
export const EMBED_URLS = {
  // Premium ad-free sources (cleanest experience)
  vidsrcpro: {
    movie: id => `https://vidsrc.pro/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
  },
  vidsrccc: {
    movie: id => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  embedflix: {
    movie: id => `https://www.embedflix.to/movie/${id}`,
    tv: (id, s, e) => `https://www.embedflix.to/tv/${id}/${s}/${e}`,
  },
  streamwish: {
    movie: id => `https://streamwish.to/embed-movie/${id}`,
    tv: (id, s, e) => `https://streamwish.to/embed-tv/${id}/${s}/${e}`,
  },

  // Working reliable sources (tested and verified)
  vidsrc: {
    movie: id => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  vidsrcme: {
    movie: id => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  embedsoap: {
    movie: id => `https://www.embedsoap.com/embed/movie/${id}`,
    tv: (id, s, e) => `https://www.embedsoap.com/embed/tv/${id}/${s}/${e}`,
  },
  multiembed: {
    movie: id => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  superembed: {
    movie: id => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },

  // Alternative working sources
  vidlink: {
    movie: id => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  vidfast: {
    movie: id => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    tv: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true`,
  },
  embedsu: {
    movie: id => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  embed2: {
    movie: id => `https://www.2embed.to/embed/tmdb/movie?id=${id}`,
    tv: (id, s, e) => `https://www.2embed.to/embed/tmdb/tv?id=${id}&s=${s}&e=${e}`,
  },

  // Additional backup sources
  videasy: {
    movie: id => `https://videasy.org/embed/movie/${id}`,
    tv: (id, s, e) => `https://videasy.org/embed/tv/${id}/${s}/${e}`,
  },
  autoembed: {
    movie: id => `https://autoembed.co/movie/tmdb/${id}`,
    tv: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}/${s}/${e}`,
  },

  // Last resort sources
  moviesapi: {
    movie: id => `https://moviesapi.club/movie/${id}`,
    tv: (id, s, e) => `https://moviesapi.club/tv/${id}/${s}/${e}`,
  },
  smashystream: {
    movie: id => `https://player.smashy.stream/movie/${id}`,
    tv: (id, s, e) => `https://player.smashy.stream/tv/${id}/${s}/${e}`,
  },

  // Anime specific
  vidlink_anime: {
    anime: (mal_id, e, type = 'sub') =>
      `https://vidlink.pro/anime/${mal_id}/${e}/${type}?fallback=true`,
  },
};

// --- SOURCE ORDER (Priority-based) ---
export const SOURCE_ORDER = [
  'vidsrcpro', // 🚫 No ads - Premium version
  'vidsrccc', // 🚫 No ads - Clean interface
  'embedflix', // 🚫 No ads - Minimal popups
  'streamwish', // 🚫 No ads - Clean streaming
  'vidsrc', // Most reliable
  'vidsrcme', // Alternative vidsrc
  'multiembed', // Proven working
  'superembed', // Same as multiembed
  'embedsoap', // Clean interface
  'vidlink', // Backup
  'vidfast', // Backup
  'embed2', // Reliable backup
  'embedsu', // Alternative
  'videasy', // More backup
  'autoembed', // Updated URL
  'moviesapi', // Last resort
  'smashystream', // Final backup
];

// --- IPTV CHANNELS (NAAY SULOD) ---
export const IPTV_CHANNELS = [
  // LOCAL - WORKING PLDT CHANNELS
  {
    name: 'GMA 7',
    url: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/index.mpd',
    fallback: 'https://ott.m3u8.nathcreqtives.com/gmapinoytv/manifest.m3u8',
    streamType: 'dash',
    category: 'Local',
    number: 1,
  },
  {
    name: 'Kapamilya Channel',
    url: 'https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-kapcha-dash-abscbnono/index.mpd',
    fallback: 'https://d2qohk6nmmf6tv.cloudfront.net/playlist.m3u8',
    streamType: 'dash',
    category: 'Local',
    number: 3,
  },
  {
    name: 'A2Z',
    url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_a2z/default/index.m3u8',
    fallback: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_a2z/default/index.m3u8',
    category: 'Local',
    number: 6,
  },
  {
    name: 'One PH',
    url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/oneph_sd/default/index.m3u8',
    fallback: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/oneph_sd/default/index.m3u8',
    category: 'Local',
    number: 7,
  },
  {
    name: 'Buko',
    url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_buko_sd/default/index.m3u8',
    fallback: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_buko_sd/default/index.m3u8',
    category: 'Local',
    number: 8,
  },
  {
    name: 'Sari-Sari',
    url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_sarisari/default/index.m3u8',
    fallback:
      'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_sarisari/default/index.m3u8',
    category: 'Local',
    number: 9,
  },
  {
    name: 'PTV',
    url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_ptv4_sd/default/index.m3u8',
    fallback: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_ptv4_sd/default/index.m3u8',
    category: 'Local',
    number: 10,
  },
  {
    name: 'TV5 Philippines',
    url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/tv5_hd/default1/index.m3u8',
    fallback: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/tv5_hd/default1/index.m3u8',
    category: 'Local',
    number: 11,
  },
  {
    name: 'DepEd Channel',
    url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/depedch_sd/default/index.m3u8',
    fallback: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/depedch_sd/default/index.m3u8',
    category: 'Local',
    number: 12,
  },
  {
    name: 'Knowledge Channel',
    url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/knowledge_channel/default/index.m3u8',
    fallback:
      'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/knowledge_channel/default/index.m3u8',
    category: 'Local',
    number: 13,
  },
  {
    name: 'IBC 13',
    url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/ibc13_sd_new/default1/index.m3u8',
    fallback:
      'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/ibc13_sd_new/default1/index.m3u8',
    category: 'Local',
    number: 14,
  },
  {
    name: 'TrueTV',
    url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/truefm_tv/default/index.m3u8',
    fallback: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/truefm_tv/default/index.m3u8',
    category: 'Local',
    number: 15,
  },
  {
    name: 'Bilyonaryo Channel',
    url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/bilyonaryoch/default1/index.m3u8',
    fallback:
      'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/bilyonaryoch/default1/index.m3u8',
    category: 'Local',
    number: 16,
  },
  {
    name: 'PBO',
    url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/pbo_sd/default/index.m3u8',
    fallback: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/pbo_sd/default/index.m3u8',
    category: 'Local',
    number: 17,
  },

  // ENTERTAINMENT - WORKING CHANNELS
  {
    name: 'JUNGO TV PINOY',
    url: 'https://jungotvstream.chanall.tv/jungotv/jungopinoytv/stream.m3u8',
    category: 'Entertainment',
    number: 18,
  },
  {
    name: 'FRONTROW',
    url: 'https://jungotvstream.chanall.tv/jungotv/frontrow/stream.m3u8',
    category: 'Entertainment',
    number: 19,
  },
  {
    name: 'HALLYPOP',
    url: 'https://jungotvstream.chanall.tv/jungotv/hallypop/stream.m3u8',
    category: 'Entertainment',
    number: 20,
  },
  {
    name: 'AWSN',
    url: 'https://amg02188-amg02188c2-jungotv-northamerica-5717.playouts.now.amagi.tv/playlist.m3u8',
    category: 'Entertainment',
    number: 21,
  },

  // NEWS - WORKING CHANNELS
  {
    name: 'ALJAZEERA',
    url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',
    category: 'News',
    number: 93,
  },
  {
    name: 'BBC NEWS',
    url: 'https://cdn3.skygo.mn/live/disk1/BBC_News/HLSv3-FTA/BBC_News.m3u8',
    category: 'News',
    number: 95,
  },
  {
    name: 'SKY NEWS',
    url: 'https://linear417-gb-hls1-prd-ak.cdn.skycdp.com/100e/Content/HLS_001_1080_30/Live/channel(skynews)/index_1080-30.m3u8',
    category: 'News',
    number: 96,
  },
];

// --- ADMIN & COLLECTIONS ---
export const ADMIN_UIDS = ['YOUR_FIREBASE_UID_HERE'];
export const CURATED_COLLECTIONS = [
  // Dynamic lists (fetch many)
  {
    title: 'Halloween Horrors',
    endpoint: API_ENDPOINTS.discoverMovies({
      with_genres: '27', // Horror
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
      with_original_language: 'en',
      include_adult: false,
    }),
    limit: 20,
  },
  {
    title: 'Mind-Bending Sci-Fi',
    endpoint: API_ENDPOINTS.discoverMovies({
      with_genres: '878,53', // Sci-Fi + Thriller
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
      with_original_language: 'en',
      include_adult: false,
    }),
    limit: 20,
  },
  // Editor Picks: high-rated, well-reviewed films
  {
    title: 'Editor Picks',
    endpoint: API_ENDPOINTS.discoverMovies({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 1000,
      'vote_average.gte': 7.5,
      include_adult: false,
      with_original_language: 'en',
    }),
    limit: 20,
  },
];

// --- GET EMBED URL ---
export const getEmbedUrl = (type, id, season, episode, imdb_id, mal_id) => {
  // Priority override: for movies, try `moviesapi` first (user-requested preference)
  if (
    type === 'movie' &&
    EMBED_URLS.moviesapi &&
    typeof EMBED_URLS.moviesapi.movie === 'function'
  ) {
    try {
      const url = EMBED_URLS.moviesapi.movie(id);
      if (url) return url;
    } catch {
      // swallow and continue to normal SOURCE_ORDER fallback
    }
  }

  for (const source of SOURCE_ORDER) {
    const src = EMBED_URLS[source];
    if (!src) continue;

    if (type === 'movie' && src.movie) {
      return src.movie(id);
    }
    if (type === 'tv' && src.tv) {
      return src.tv(id, season, episode);
    }
    if (type === 'anime' && src.anime && mal_id) {
      return src.anime(mal_id, episode || 1, 'sub');
    }
  }
  return null;
};
