// src/config.js

// --- TMDB API CONFIG ---
export const API_KEY = "3b0f392b6173455e37624a78bd5f79d4";
export const IMG_PATH = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_PATH = "https://image.tmdb.org/t/p/original";

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
  { id: 99999, name: "Isekai" }
];

export const MOVIE_GENRES = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" }, { id: 10751, name: "Family" }, { id: 14, name: "Fantasy" },
  { id: 36, name: "History" }, { id: 27, name: "Horror" }, { id: 10402, name: "Music" },
  { id: Thread: 9648, name: "Mystery" }, { id: 10749, name: "Romance" }, { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" }, { id: 53, name: "Thriller" }, { id: 10752, name: "War" }, // FIXED: -man 10752 → 10752
  { id: 37, name: "Western" }
];

// --- API ENDPOINTS ---
const tmdb = (path) => `https://api.themoviedb.org/3${path}?api_key=${API_KEY}`;

export const API_ENDPOINTS = {
  trending: tmdb("/trending/all/day"),
  popular: tmdb("/movie/popular"),
  toprated: tmdb("/movie/top_rated"),
  tvshows: tmdb("/tv/popular"),
  asianDramas: `${tmdb("/discover/tv")}&with_genres=18&with_origin_country=KR,JP,CN,TH&sort_by=popularity.desc`,
  
  anime: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animePopular: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animeTopRated: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=vote_average.desc&vote_count.gte=500`,
  animeNewReleases: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=first_air_date.desc&air_date.lte=${CURRENT_DATE}`,
  animeByGenre: (genreId) => `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&with_genres=${genreId}&sort_by=popularity.desc`,
  animeIsekai: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD},${ISEKAI_KEYWORD}&sort_by=popularity.desc`,

  search: (query, page = 1) => `${tmdb("/search/multi")}&query=${encodeURIComponent(query)}&page=${page}`,
  details: (type, id) => `${tmdb(`/${type}/${id}`)}&append_to_response=videos,credits,external_ids`,
  recommendations: (type, id) => tmdb(`/${type}/${id}/recommendations`),
  byGenre: (genreId) => `${tmdb("/discover/movie")}&with_genres=${genreId}&sort_by=popularity.desc`,
};

// --- ORIGINAL EMBED SOURCES ---
export const EMBED_URLS = {
  vidsrc: {
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  multiembed: {
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  vidlink: {
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
  },
  videasy: {
    movie: (imdb_id) => imdb_id ? `https://player.videasy.net/movie/${imdb_id}` : null,
    tv: (imdb_id, s, e) => imdb_id ? `https://player.videasy.net/tv/${imdb_id}/${s}/${e}` : null
  },
  vidfast: {
    movie: (id) => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    tv: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true`
  },
  autoembed: {
    movie: (id) => `https://autoembed.pro/embed/movie/${id}`,
    tv: (id, s, e) => `https://autoembed.pro/embed/tv/${id}/${s}/${e}`
  },
  vidlink_anime: {
    anime: (mal_id, e, type = "sub") => `https://vidlink.pro/anime/${mal_id}/${e}/${type}?fallback=true`
  }
};

// --- SOURCE ORDER ---
export const SOURCE_ORDER = ['autoembed', 'vidlink', 'vidfast', 'vidsrc', 'multiembed', 'videasy'];

// --- PROXY ---
const proxy = (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

// --- IPTV CHANNELS ---
export const IPTV_CHANNELS = [
  { name: 'GMA 7', url: proxy('https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/index.mpd') },
  { name: 'JUNGO TV PINOY', url: proxy('https://jungotvstream.chanall.tv/jungotv/jungopinoytv/stream.m3u8') },
  { name: 'SCREAMFLIX', url: proxy('https://jungotvstream.chanall.tv/jungotv/screamflix/stream.m3u8') },
  { name: 'HALLYPOP', url: proxy('https://jungotvstream.chanall.tv/jungotv/hallypop/stream.m3u8') },
  { name: 'FRONTROW', url: proxy('https://jungotvstream.chanall.tv/jungotv/frontrow/stream.m3u8') },
  { name: 'COMBATGO', url: proxy('https://jungotvstream.chanall.tv/jungotv/combatgo/stream.m3u8') },
  { name: 'AWSN', url: proxy('https://amg02188-amg02188c2-jungotv-northamerica-5717.playouts.now.amagi.tv/playlist.m3u8') },
  { name: 'Hi-YAH!', url: proxy('https://linear-59.frequency.stream/dist/roku/59/hls/master/playlist.m3u8') },
  { name: 'ANIME X HIDIVE', url: proxy('https://amc-anime-x-hidive-1-us.tablo.wurl.tv/playlist.m3u8') },
  { name: 'LOTUS MACAU', url: proxy('https://cdn3.skygo.mn/live/disk1/Lotus/HLSv3-FTA/Lotus.m3u8') },
  { name: 'TRAVELXP', url: proxy('https://travelxp-travelxp-1-eu.rakuten.wurl.tv/playlist.m3u8') },
  { name: 'DISCOVERY ASIA', url: proxy('https://cdn3.skygo.mn/live/disk1/Discovery_Asia/HLSv3-FTA/Discovery_Asia.m3u8') },
  { name: 'DISCOVERY CHANNEL', url: proxy('https://fl3.moveonjoy.com/Discovery_Channel/index.m3u8') },
  { name: 'NBA TV', url: proxy('https://fl5.moveonjoy.com/NBA_TV/index.m3u8') },
  { name: 'NHL NETWORK', url: proxy('https://fl6.moveonjoy.com/NHL_NETWORK/index.m3u8') },
  { name: 'ANIMAL PLANET', url: proxy('https://fl5.moveonjoy.com/Animal_Planet/index.m3u8') },
  { name: 'CARTOONITO', url: proxy('https://cdn3.skygo.mn/live/disk1/Boomerang/HLSv3-FTA/Boomerang.m3u8') },
  { name: 'CARTOON NETWORK', url: proxy('https://cdn3.skygo.mn/live/disk1/Cartoon_Network/HLSv3-FTA/Cartoon_Network.m3u8') },
  { name: 'BABYSHARK TV', url: proxy('https://newidco-babysharktv-1-eu.rakuten.wurl.tv/playlist.m3u8') },
  { name: 'KIDOODLE TV', url: proxy('https://kidoodletv-kdtv-1-us.samsung.wurl.tv/playlist.m3u8') },
  { name: 'PBS KIDS', url: proxy('https://2-fss-2.streamhoster.com/pl_140/amlst:200914-129820/playlist.m3u8') },
  { name: 'BBC KIDS', url: proxy('https://dmr1h4skdal9h.cloudfront.net/v1/manifest/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-msbj6srh7nhug/ce36558b-b031-4284-94be-91ed22d31a41/2.m3u8') },
  { name: 'ZOOMOO', url: proxy('https://cdn3.skygo.mn/live/disk1/Zoomoo/HLSv3-FTA/Zoomoo.m3u8') },
  { name: 'DISCOVERY FAMILY CHANNEL', url: proxy('https://fl5.moveonjoy.com/DISCOVERY_FAMILY_CHANNEL/index.m3u8') },
  { name: 'DISNEY CHANNEL', url: proxy('https://fl5.moveonjoy.com/DISNEY_CHANNEL/index.m3u8') },
  { name: 'DISNEY XD', url: proxy('https://fl5.moveonjoy.com/DISNEY_XD/index.m3u8') },
  { name: 'DISNEY JR', url: proxy('https://fl2.moveonjoy.com/DISNEY_JR/index.m3u8') },
  { name: 'NICKELODEON', url: proxy('https://fl1.moveonjoy.com/NICKELODEON/index.m3u8') },
  { name: 'NICK JR', url: proxy('https://fl5.moveonjoy.com/NICK_JR/index.m3u8') },
  { name: 'NICKTOONS', url: proxy('https://fl1.moveonjoy.com/NICKTOONS/index.m3u8') },
  { name: 'LIFETIME', url: proxy('https://fl5.moveonjoy.com/LIFETIME/index.m3u8') },
  { name: 'AMC NETWORK', url: proxy('https://fl2.moveonjoy.com/AMC_NETWORK/index.m3u8') },
  { name: 'HALLMARK CHANNEL', url: proxy('https://fl2.moveonjoy.com/HALLMARK_CHANNEL/index.m3u8') },
  { name: 'HALLMARK MOVIES MYSTERIES', url: proxy('https://fl2.moveonjoy.com/HALLMARK_MOVIES_MYSTERIES/index.m3u8') },
  { name: 'HBO', url: proxy('https://fl2.moveonjoy.com/HBO/index.m3u8') },
  { name: 'HBO 2', url: proxy('https://fl5.moveonjoy.com/HBO_2/index.m3u8') },
  { name: 'HBO COMEDY', url: proxy('https://fl5.moveonjoy.com/HBO_COMEDY/index.m3u8') },
  { name: 'HBO FAMILY', url: proxy('https://fl5.moveonjoy.com/HBO_FAMILY/index.m3u8') },
  { name: 'HBO ZONE', url: proxy('https://fl5.moveonjoy.com/HBO_ZONE/index.m3u8') },
  { name: 'SHOWTIME', url: proxy('https://fl2.moveonjoy.com/SHOWTIME/index.m3u8') },
  { name: 'SHOWTIME 2', url: proxy('https://fl5.moveonjoy.com/SHOWTIME_2/index.m3u8') },
  { name: 'SHOWTIME EXTREME', url: proxy('https://fl5.moveonjoy.com/SHOWTIME_EXTREME/index.m3u8') },
  { name: 'SHOWTIME NEXT', url: proxy('https://fl5.moveonjoy.com/SHOWTIME_NEXT/index.m3u8') },
  { name: 'SHOWTIME WOMEN', url: proxy('https://fl5.moveonjoy.com/SHOWTIME_WOMEN/index.m3u8') },
  { name: 'STARZ', url: proxy('https://fl5.moveonjoy.com/STARZ/index.m3u8') },
  { name: 'STARZ COMEDY', url: proxy('https://fl5.moveonjoy.com/STARZ_COMEDY/index.m3u8') },
  { name: 'STARZ EDGE', url: proxy('https://fl5.moveonjoy.com/STARZ_EDGE/index.m3u8') },
  { name: 'STARZ ENCORE', url: proxy('https://fl5.moveonjoy.com/STARZ_ENCORE/index.m3u8') },
  { name: 'STARZ ENCORE ACTION', url: proxy('https://fl5.moveonjoy.com/STARZ_ENCORE_ACTION/index.m3u8') },
  { name: 'STARZ ENCORE WESTERNS', url: proxy('https://fl5.moveonjoy.com/STARZ_ENCORE_WESTERNS/index.m3u8') },
  { name: 'STARZ WEST', url: proxy('https://fl5.moveonjoy.com/STARZ_WEST/index.m3u8') },
  { name: 'PARAMOUNT NETWORK', url: proxy('https://fl2.moveonjoy.com/PARAMOUNT_NETWORK/index.m3u8') },
  { name: 'NICK MUSIC', url: proxy('https://fl5.moveonjoy.com/NICK_MUSIC/index.m3u8') },
  { name: 'MTV', url: proxy('https://fl2.moveonjoy.com/MTV/index.m3u8') },
  { name: 'MTV LIVE', url: proxy('https://fl2.moveonjoy.com/MTV_LIVE/index.m3u8') },
  { name: 'NAT GEO WILD', url: proxy('https://fl5.moveonjoy.com/Nat_Geo_Wild/index.m3u8') },
  { name: 'NATIONAL GEOGRAPHIC', url: proxy('https://fl5.moveonjoy.com/National_Geographic/index.m3u8') },
  { name: 'HGTV', url: proxy('https://fl2.moveonjoy.com/HGTV/index.m3u8') },
  { name: 'COMEDY CENTRAL', url: proxy('https://fl3.moveonjoy.com/Comedy_Central/index.m3u8') }
];

// --- ADMIN & COLLECTIONS ---
export const ADMIN_UIDS = ['YOUR_FIREBASE_UID_HERE'];

export const CURATED_COLLECTIONS = [
  { title: "Halloween Horrors", ids: [ { id: 760161, type: 'movie' }, { id: 965876, type: 'movie' } ] },
  { title: "Mind-Bending Sci-Fi", ids: [ { id: 603, type: 'movie' }, { id: 157336, type: 'movie' } ] },
];

// --- SIMPLE GET EMBED URL ---
export const getEmbedUrl = (type, id, season, episode, imdb_id, mal_id) => {
  for (const source of SOURCE_ORDER) {
    const src = EMBED_URLS[source];
    if (!src) continue;

    if (type === "movie" && src.movie) {
      return imdb_id && source === "videasy" ? src.movie(imdb_id) : src.movie(id);
    }
    if (type === "tv" && src.tv) {
      return imdb_id && source === "videasy" ? src.tv(imdb_id, season, episode) : src.tv(id, season, episode);
    }
    if (type === "anime" && mal_id && src.anime) {
      return src.anime(mal_id, episode || 1, "sub");
    }
  }
  return null;
};
