// src/config.js

// --- TMDB API CONFIG ---
export const API_KEY = "3b0f392b6173455e37624a78bd5f79d4";
export const IMG_PATH = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_PATH = "https://image.tmdb.org/t/p/original";
export const POSTER_SMALL = "https://image.tmdb.org/t/p/w342";
export const PROFILE_PATH = "https://image.tmdb.org/t/p/w185";

// Keywords
const ANIME_KEYWORD = "210024";
const ISEKAI_KEYWORD = "193808";
const CURRENT_DATE = new Date().toISOString().split("T")[0];

// --- GENRES ---
export const ANIME_GENRES = [
  { id: 10759, name: "Action & Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 9648, name: "Mystery" },
  { id: 10762, name: "Kids" },
  { id: 10764, name: "Reality" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 99999, name: "Isekai" },
];

export const MOVIE_GENRES = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" }, { id: 10751, name: "Family" }, { id: 14, name: "Fantasy" },
  { id: 36, name: "History" }, { id: 27, name: "Horror" }, { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" }, { id: 10749, name: "Romance" }, { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" }, { id: 53, name: "Thriller" }, { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

// --- API ENDPOINTS ---
const tmdb = (path) => `https://api.themoviedb.org/3${path}?api_key=${API_KEY}`;

export const API_ENDPOINTS = {
  trending: tmdb("/trending/all/day"),
  popularMovies: tmdb("/movie/popular"),
  topRatedMovies: tmdb("/movie/top_rated"),
  popularTV: tmdb("/tv/popular"),
  tvAiringToday: tmdb("/tv/airing_today"),
  asianDramas: `${tmdb("/discover/tv")}&with_genres=18&with_origin_country=KR,JP,CN,TH,TW,HK&sort_by=popularity.desc`,
  
  anime: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animePopular: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animeTopRated: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=vote_average.desc&vote_count.gte=300`,
  animeNewReleases: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=first_air_date.desc&air_date.lte=${CURRENT_DATE}`,
  animeByGenre: (genreId) => `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&with_genres=${genreId}&sort_by=popularity.desc`,
  animeIsekai: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD},${ISEKAI_KEY internazionali}&sort_by=popularity.desc`,

  search: (query, page = 1) => `${tmdb("/search/multi")}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
  details: (type, id) => `${tmdb(`/${type}/${id}`)}&append_to_response=videos,credits,external_ids,images,release_dates`,
  recommendations: (type, id) => tmdb(`/${type}/${id}/recommendations`),
  byGenre: (genreId, type = "movie") => `${tmdb(`/discover/${type}`)}&with_genres=${genreId}&sort_by=popularity.desc`,
};

// --- EMBED SOURCES (2025 WORKING) ---
export const EMBED_URLS = {
  // TIER 1: FAST & CLEAN
  superembed: {
    movie: (id) => `https://www.superembed.stream/embed/movie/${id}`,
    tv: (id, s, e) => `https://www.superembed.stream/embed/tv/${id}/${s}/${e}`
  },
  '2embed': {
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },
  vidsrc_me: {
    movie: (id) => `https://vidsrc.me/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.me/embed/tv/${id}/${s}/${e}`
  },

  // TIER 2: OFFICIAL DOMAINS
  vidsrc: {
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  vidsrc_cc: {
    movie: (id) => `https://vidsrc.cc/v2/embed/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/${id}/${s}/${e}`
  },
  vidsrc_in: {
    movie: (id) => `https://vidsrc.in/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.in/embed/tv/${id}/${s}/${e}`
  },

  // TIER 3: GOOD FALLBACKS
  flixhq: {
    movie: (id) => `https://flixhq.to/movie/${id}`,
    tv: (id, s, e) => `https://flixhq.to/tv/${id}/season-${s}-episode-${e}`
  },
  smashystream: {
    movie: (id) => `https://embed.smashystream.com/playitagaintom.php?tmdb=${id}`,
    tv: (id, s, e) => `https://embed.smashystream.com/playitagaintom.php?tmdb=${id}&season=${s}&episode=${e}`
  },

  // TIER 4: LEGACY
  autoembed: {
    movie: (id) => `https://autoembed.pro/embed/movie/${id}`,
    tv: (id, s, e) => `https://autoembed.pro/embed/tv/${id}/${s}/${e}`
  },
  vidlink: {
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
  },
  vidfast: {
    movie: (id) => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    tv: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true`
  },
  multiembed: {
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  videasy: {
    movie: (imdb_id) => imdb_id ? `https://player.videasy.net/movie/${imdb_id}` : null,
    tv: (imdb_id, s, e) => imdb_id ? `https://player.videasy.net/tv/${imdb_id}/${s}/${e}` : null
  },

  // ANIME SOURCES (MAL ID)
  animepahe: {
    anime: (mal_id, episode = 1) => `https://animepahe.ru/play/${mal_id}/${episode}`
  },
  gogoanime: {
    anime: (mal_id, episode = 1, dub = false) => {
      const type = dub ? '-dub' : '';
      return `https://gogoanime3.net/play/${mal_id}${type}-episode-${episode}`;
    }
  },
  vidlink_anime: {
    anime: (mal_id, episode = 1, dub = "sub") => `https://vidlink.pro/anime/${mal_id}/${episode}/${dub}?fallback=true`
  }
};

// --- SOURCE ORDER (Best to Worst) ---
export const SOURCE_ORDER = [
  'superembed', '2embed', 'vidsrc_me',
  'vidsrc', 'vidsrc_cc', 'vidsrc_in',
  'flixhq', 'smashystream',
  'autoembed', 'vidlink', 'vidfast', 'multiembed', 'videasy',
  'animepahe', 'gogoanime', 'vidlink_anime'
];

// --- PROXY ---
const proxyCache = new Map();
export const proxy = (url) => {
  if (proxyCache.has(url)) return proxyCache.get(url);
  const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  proxyCache.set(url, proxied);
  return proxied;
};

// --- IPTV CHANNELS (Categorized) ---
export const IPTV_CHANNELS = {
  pinoy: [
    { name: "GMA 7", url: proxy("https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/index.mpd") },
    { name: "JUNGO TV PINOY", url: proxy("https://jungotvstream.chanall.tv/jungotv/jungopinoytv/stream.m3u8") },
    { name: "HALLYPOP", url: proxy("https://jungotvstream.chanall.tv/jungotv/hallypop/stream.m3u8") },
  ],
  anime: [
    { name: "ANIME X HIDIVE", url: proxy("https://amc-anime-x-hidive-1-us.tablo.wurl.tv/playlist.m3u8") },
  ],
  kids: [
    { name: "CARTOON NETWORK", url: proxy("https://cdn3.skygo.mn/live/disk1/Cartoon_Network/HLSv3-FTA/Cartoon_Network.m3u8") },
    { name: "DISNEY CHANNEL", url: proxy("https://fl5.moveonjoy.com/DISNEY_CHANNEL/index.m3u8") },
    { name: "NICK JR", url: proxy("https://fl5.moveonjoy.com/NICK_JR/index.m3u8") },
  ],
  movies: [
    { name: "HBO", url: proxy("https://fl2.moveonjoy.com/HBO/index.m3u8") },
    { name: "SHOWTIME", url: proxy("https://fl2.moveonjoy.com/SHOWTIME/index.m3u8") },
  ],
  discovery: [
    { name: "DISCOVERY CHANNEL", url: proxy("https://fl3.moveonjoy.com/Discovery_Channel/index.m3u8") },
    { name: "ANIMAL PLANET", url: proxy("https://fl5.moveonjoy.com/Animal_Planet/index.m3u8") },
  ],
  sports: [
    { name: "NBA TV", url: proxy("https://fl5.moveonjoy.com/NBA_TV/index.m3u8") },
  ]
};
export const IPTV_CHANNELS_FLAT = Object.values(IPTV_CHANNELS).flat();

// --- ADMIN & COLLECTIONS ---
export const ADMIN_UIDS = ['YOUR_FIREBASE_UID_HERE'];

export const CURATED_COLLECTIONS = [
  { title: "Halloween Horrors", ids: [{ id: 760161, type: "movie" }, { id: 965876, type: "movie" }, { id: 646385, type: "movie" }] },
  { title: "Mind-Bending Sci-Fi", ids: [{ id: 603, type: "movie" }, { id: 157336, type: "movie" }, { id: 78, type: "movie" }] },
  { title: "Top Anime", ids: [{ id: 94605, type: "tv" }, { id: 110427, type: "tv" }, { id: 40071, type: "tv" }] }
];

// === AUTO SERVER SWITCH + GET URL ===
export const getEmbedUrl = (type, id, season, episode, imdb_id, mal_id) => {
  const isAnime = type === 'anime';
  const isMovie = type === 'movie';
  const isTV = type === 'tv';

  const sources = SOURCE_ORDER.map(name => ({ name, url: null }));

  for (const sourceName of SOURCE_ORDER) {
    const src = EMBED_URLS[sourceName];
    if (!src) continue;

    let url = null;

    if (isAnime && mal_id && src.anime) {
      if (sourceName === 'gogoanime') {
        url = src.anime(mal_id, episode || 1, false); // sub first
      } else if (sourceName === 'vidlink_anime') {
        url = src.anime(mal_id, episode || 1, 'sub');
      } else {
        url = src.anime(mal_id, episode || 1);
      }
    } else if (isMovie && src.movie) {
      url = sourceName === 'videasy' && imdb_id ? src.movie(imdb_id) : src.movie(id);
    } else if (isTV && src.tv) {
      url = sourceName === 'videasy' && imdb_id ? src.tv(imdb_id, season, episode) : src.tv(id, season, episode);
    }

    if (url) {
      const index = sources.findIndex(s => s.name === sourceName);
      if (index !== -1) sources[index].url = url;
    }
  }

  // Return array of { name, url } for auto-switching
  return sources.filter(s => s.url).map(s => ({ source: s.name, url: s.url }));
};

// Optional: Get first working URL only
export const getFirstEmbedUrl = (...args) => {
  const list = getEmbedUrl(...args);
  return list.length > 0 ? list[0] : null;
};

// Optional: Try dub if sub fails
export const getAnimeEmbedUrl = (mal_id, episode = 1) => {
  const sub = getEmbedUrl('anime', null, null, episode, null, mal_id);
  if (sub.length > 0) return { ...sub[0], lang: 'sub' };

  const dubSources = ['gogoanime', 'vidlink_anime'];
  for (const src of dubSources) {
    const embed = EMBED_URLS[src];
    if (embed?.anime) {
      const url = src === 'gogoanime'
        ? embed.anime(mal_id, episode, true)
        : embed.anime(mal_id, episode, 'dub');
      if (url) return { source: src, url, lang: 'dub' };
    }
  }
  return null;
};
