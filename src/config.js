// src/config.js

// --- TMDB API CONFIG ---
export const API_KEY = "3b0f392b6173455e37624a78bd5f79d4";
export const IMG_PATH = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_PATH = "https://image.tmdb.org/t/p/original";

const ANIME_KEYWORD = "210024";
const CURRENT_DATE = new Date().toISOString().split('T')[0];
const ISEKAI_KEYWORD = "193808";

// --- GENRES ---
export const ANIME_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 9648, name: 'Mystery' },
  { id: 99999, name: 'Isekai' }
];

export const MOVIE_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' }, { id: 53, name: 'Thrillera' }, { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

// --- API ENDPOINTS ---
export const API_ENDPOINTS = {
  trending: `https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`,
  popular: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`,
  toprated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`,
  tvshows: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`,
  asianDramas: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=18&with_origin_country=KR,JP,CN,TH&sort_by=popularity.desc`,

  anime: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animePopular: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animeTopRated: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=${ANIME_KEYWORD}&sort_by=vote_average.desc&vote_count.gte=500`,
  animeNewReleases: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=${ANIME_KEYWORD}&sort_by=first_air_date.desc&air_date.lte=${CURRENT_DATE}`,

  animeByGenre: (genreId) => `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=${ANIME_KEYWORD}&with_genres=${genreId}&sort_by=popularity.desc`,
  animeIsekai: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=${ANIME_KEYWORD},${ISEKAI_KEYWORD}&sort_by=popularity.desc`,

  search: (query, page = 1) => `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
  details: (type, id) => `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&append_to_response=videos,credits,external_ids`,
  byGenre: (genreId) => `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`,
  recommendations: (type, id) => `https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${API_KEY}`,
};

// --- EMBED ---
export const EMBED_URLS = {
  vidsrc: {
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  multiembed: {
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
};

export const SOURCE_ORDER = ['vidsrc', 'multiembed'];

// --- IPTV CHANNELS (NO LOGOS, UPGRADED) ---
export const IPTV_CHANNELS = [
  // LOCAL
  { name: 'GMA 7', url: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/index.mpd', fallback: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/playlist.m3u8', category: 'Local', number: 1 },
  { name: 'GMA (HLS)', url: 'https://ott.m3u8.nathcreqtives.com/gmapinoytv/manifest.m3u8', category: 'Local', number: 2 },
  { name: 'Kapamilya Channel HD', url: 'https://d2qohk6nmmf6tv.cloudfront.net/playlist.m3u8', fallback: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/playlist.m3u8', category: 'Local', number: 3 },
  { name: 'ABS-CBN News (ANC)', url: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/hls/anc.m3u8', category: 'News', number: 4 },

  // ENTERTAINMENT
  { name: 'JUNGO TV PINOY', url: 'https://jungotvstream.chanall.tv/jungotv/jungopinoytv/stream.m3u8', category: 'Entertainment', number: 5 },
  { name: 'SCREAMFLIX', url: 'https://jungotvstream.chanall.tv/jungotv/screamflix/stream.m3u8', category: 'Movies', number: 6 },
  { name: 'HALLYPOP', url: 'https://jungotvstream.chanall.tv/jungotv/hallypop/stream.m3u8', category: 'K-Pop', number: 7 },
  { name: 'FRONTROW', url: 'https://jungotvstream.chanall.tv/jungotv/frontrow/stream.m3u8', category: 'Music', number: 8 },
  { name: 'COMBATGO', url: 'https://jungotvstream.chanall.tv/jungotv/combatgo/stream.m3u8', category: 'Sports', number: 9 },

  // KIDS & ANIME
  { name: 'ANIME X HIDIVE', url: 'https://amc-anime-x-hidive-1-us.tablo.wurl.tv/playlist.m3u8', category: 'Anime', number: 10 },
  { name: 'CARTOON NETWORK', url: 'https://cdn3.skygo.mn/live/disk1/Cartoon_Network/HLSv3-FTA/Cartoon_Network.m3u8', category: 'Kids', number: 11 },
  { name: 'DISNEY CHANNEL', url: 'https://fl5.moveonjoy.com/DISNEY_CHANNEL/index.m3u8', category: 'Kids', number: 12 },
  { name: 'NICKELODEON', url: 'https://fl1.moveonjoy.com/NICKELODEON/index.m3u8', category: 'Kids', number: 13 },
  { name: 'PBS KIDS', url: 'https://2-fss-2.streamhoster.com/pl_140/amlst:200914-129820/playlist.m3u8', category: 'Kids', number: 14 },

  // PREMIUM
  { name: 'HBO', url: 'https://fl2.moveonjoy.com/HBO/index.m3u8', category: 'Premium', number: 15 },
  { name: 'SHOWTIME', url: 'https://fl2.moveonjoy.com/SHOWTIME/index.m3u8', category: 'Premium', number: 16 },
  { name: 'STARZ', url: 'https://fl5.moveonjoy.com/STARZ/index.m3u8', category: 'Premium', number: 17 },

  // DOCUMENTARY
  { name: 'NATIONAL GEOGRAPHIC', url: 'https://fl5.moveonjoy.com/National_Geographic/index.m3u8', category: 'Documentary', number: 18 },
  { name: 'DISCOVERY CHANNEL', url: 'https://fl3.moveonjoy.com/Discovery_Channel/index.m3u8', category: 'Documentary', number: 19 },
  { name: 'ANIMAL PLANET', url: 'https://fl5.moveonjoy.com/Animal_Planet/index.m3u8', category: 'Documentary', number: 20 },

  // SPORTS
  { name: 'NBA TV', url: 'https://fl5.moveonjoy.com/NBA_TV/index.m3u8', category: 'Sports', number: 21 },
  { name: 'NHL NETWORK', url: 'https://fl6.moveonjoy.com/NHL_NETWORK/index.m3u8', category: 'Sports', number: 22 },

  // LIFESTYLE
  { name: 'HGTV', url: 'https://fl2.moveonjoy.com/HGTV/index.m3u8', category: 'Lifestyle', number: 23 },
  { name: 'MTV', url: 'https://fl2.moveonjoy.com/MTV/index.m3u8', category: 'Music', number: 24 },
  { name: 'COMEDY CENTRAL', url: 'https://fl3.moveonjoy.com/Comedy_Central/index.m3u8', category: 'Entertainment', number: 25 },

  // --- GITANGTANG NA ANG BAG-ONG MGA CHANNELS ---
];

// --- ADMIN & COLLECTIONS ---
export const ADMIN_UIDS = ['YOUR_FIREBASE_UID_HERE'];
export const CURATED_COLLECTIONS = [
  { title: "Halloween Horrors", ids: [
    { id: 760161, type: 'movie' }, { id: 965876, type: 'movie' }, { id: 616820, type: 'movie' },
    { id: 756999, type: 'movie' }, { id: 760741, type: 'movie' }, { id: 507089, type: 'movie' },
    { id: 536554, type: 'movie' }, { id: 420634, type: 'movie' }
  ]},
  { title: "Mind-Bending Sci-Fi", ids: [
    { id: 603, type: 'movie' }, { id: 157336, type: 'movie' }, { id: 27205, type: 'movie' },
    { id: 137113, type: 'tv' }, { id: 66732, type: 'tv' }, { id: 70593, type: 'tv' },
    { id: 42009, type: 'tv' }, { id: 119051, type: 'tv' }
  ]}
];