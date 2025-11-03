// src/config.js

// --- TMDB API CONFIG ---
export const API_KEY = "3b0f392b6173455e37624a78bd5f79d4";
export const IMG_PATH = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_PATH = "https://image.tmdb.org/t/p/original";

// Keywords
const ANIME_KEYWORD = "210024";
const ISEKAI_KEYWORD = "193808";
const CHINESE_DRAMA_KEYWORD = "339110";
const CURRENT_DATE = new Date().toISOString().split("T")[0];

// --- ANIME GENRES ---
export const ANIME_GENRES = [
  { id: 10759, name: "Action & Adventure" }, { id: 35, name: "Comedy" }, { id: 18, name: "Drama" },
  { id: 10765, name: "Sci-Fi & Fantasy" }, { id: 9648, name: "Mystery" }, { id: 99999, name: "Isekai" }
];

// --- MOVIE GENRES ---
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
  popular: tmdb("/movie/popular"),
  toprated: tmdb("/movie/top_rated"),
  tvshows: tmdb("/tv/popular"),

  asianDramas: `${tmdb("/discover/tv")}&with_keywords=${CHINESE_DRAMA_KEYWORD}&sort_by=popularity.desc`,
  dramaPopular: `${tmdb("/discover/tv")}&with_keywords=${CHINESE_DRAMA_KEYWORD}&sort_by=popularity.desc`,
  dramaTopRated: `${tmdb("/discover/tv")}&with_keywords=${CHINESE_DRAMA_KEYWORD}&sort_by=vote_average.desc&vote_count.gte=50`,

  anime: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animePopular: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=popularity.desc`,
  animeTopRated: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=vote_average.desc&vote_count.gte=500`,
  animeNewReleases: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&sort_by=first_air_date.desc&air_date.lte=${CURRENT_DATE}`,
  animeByGenre: (genreId) => `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD}&with_genres=${genreId}&sort_by=popularity.desc`,
  animeIsekai: `${tmdb("/discover/tv")}&with_keywords=${ANIME_KEYWORD},${ISEKAI_KEYWORD}&sort_by=popularity.desc`,

  search: (query, page = 1) => `${tmdb("/search/multi")}&query=${encodeURIComponent(query)}&page=${page}`,
  searchTv: (query, page = 1) => `${tmdb("/search/tv")}&query=${encodeURIComponent(query)}&page=${page}`,
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
export const SOURCE_ORDER = ['autoembed', 'vidlink', 'vidfast', 'vidsrc', 'multiembed'];

// --- IPTV CHANNELS (NAAY SULOD) ---
export const IPTV_CHANNELS = [
  // LOCAL
  { name: 'GMA 7', url: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/index.mpd', fallback: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/playlist.m3u8', category: 'Local', number: 1 },
  { name: 'GMA (HLS)', url: 'https://ott.m3u8.nathcreqtives.com/gmapinoytv/manifest.m3u8', category: 'Local', number: 2 },
  { name: 'Kapamilya Channel HD', url: 'https://d2qohk6nmmf6tv.cloudfront.net/playlist.m3u8', fallback: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/playlist.m3u8', category: 'Local', number: 3 },
  { name: 'ABS-CBN News (ANC)', url: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/hls/anc.m3u8', category: 'News', number: 4 },
  { name: 'INC TV', url: 'https://199211.global.ssl.fastly.net/643cc12aa824db4374021c8c/live_95f6ac80dd6511ed9d08b12be56ae55e/playlist.m3u8', category: 'Local', number: 5 },
  { name: 'A2Z', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_a2z/default/index.mpd', category: 'Local', number: 6 },
  { name: 'One PH', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/oneph_sd/default/index.mpd', category: 'Local', number: 7 },
  { name: 'Buko', url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_buko_sd/default/index.mpd', category: 'Local', number: 8 },
  { name: 'Sari-Sari', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_sarisari/default/index.mpd', category: 'Local', number: 9 },
  { name: 'PTV', url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_ptv4_sd/default/index.mpd', category: 'Local', number: 10 },
  { name: 'TV5 Philippines', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/tv5_hd/default1/index.mpd', category: 'Local', number: 11 },
  { name: 'DepEd Channel', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/depedch_sd/default/index.mpd', category: 'Local', number: 12 },
  { name: 'Knowledge Channel', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/knowledge_channel/default/index.mpd', category: 'Local', number: 13 },
  { name: 'IBC 13', url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/ibc13_sd_new/default1/index.mpd', category: 'Local', number: 14 },
  { name: 'TrueTV', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/truefm_tv/default/index.mpd', category: 'Local', number: 15 },
  { name: 'Bilyonaryo Channel', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/bilyonaryoch/default1/index.mpd', category: 'Local', number: 16 },
  { name: 'PBO', url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/pbo_sd/default/index.mpd', category: 'Local', number: 17 },

  // ENTERTAINMENT
  { name: 'JUNGO TV PINOY', url: 'https://jungotvstream.chanall.tv/jungotv/jungopinoytv/stream.m3u8', category: 'Entertainment', number: 18 },
  { name: 'FRONTROW', url: 'https://jungotvstream.chanall.tv/jungotv/frontrow/stream.m3u8', category: 'Entertainment', number: 19 },
  { name: 'HALLYPOP', url: 'https://jungotvstream.chanall.tv/jungotv/hallypop/stream.m3u8', category: 'Entertainment', number: 20 },
  { name: 'AWSN', url: 'https://amg02188-amg02188c2-jungotv-northamerica-5717.playouts.now.amagi.tv/playlist.m3u8', category: 'Entertainment', number: 21 },
  { name: 'LIFETIME', url: 'https://fl5.moveonjoy.com/LIFETIME/index.m3u8', category: 'Entertainment', number: 22 },
  { name: 'AMC NETWORK', url: 'https://fl2.moveonjoy.com/AMC_NETWORK/index.m3u8', category: 'Entertainment', number: 23 },
  { name: 'HALLMARK CHANNEL', url: 'https://fl2.moveonjoy.com/HALLMARK_CHANNEL/index.m3u8', category: 'Entertainment', number: 24 },
  { name: 'HALLMARK MOVIES MYSTERIES', url: 'https://fl2.moveonjoy.com/HALLMARK_MOVIES_MYSTERIES/index.m3u8', category: 'Entertainment', number: 25 },
  { name: 'PARAMOUNT NETWORK', url: 'https://fl2.moveonjoy.com/PARAMOUNT_NETWORK/index.m3u8', category: 'Entertainment', number: 26 },
  { name: 'COMEDY CENTRAL', url: 'https://fl3.moveonjoy.com/Comedy_Central/index.m3u8', category: 'Entertainment', number: 27 },

  // MOVIES
  { name: 'SCREAMFLIX', url: 'https://jungotvstream.chanall.tv/jungotv/screamflix/stream.m3u8', category: 'Movies', number: 28 },
  { name: 'AMC+', url: 'https://bcovlive-a.akamaihd.net/ba853de442c140b7b3dc020001597c0a/us-east-1/6245817279001/playlist.m3u8', category: 'Movies', number: 29 },
  { name: 'AMC', url: 'https://5def33c73f084e11a19ca77697d6b413.mediatailor.us-east-1.amazonaws.com/v1/master/44f73ba4d03e9607dcd9bebdcb8494d86964f1d8/Plex_AMCPresents/playlist.m3u8', category: 'Movies', number: 30 },
  { name: 'AMC THRILLERS', url: 'https://436f59579436473e8168284cac5d725f.mediatailor.us-east-1.amazonaws.com/v1/master/44f73ba4d03e9607dcd9bebdcb8494d86964f1d8/Plex_RushByAMC/playlist.m3u8', category: 'Movies', number: 31 },
  { name: 'MOVIES THRILLER', url: 'https://shls-live-ak.akamaized.net/out/v1/f6d718e841f8442f8374de47f18c93a7/index.m3u8', category: 'Movies', number: 32 },
  { name: 'MOVIES ACTION', url: 'https://shls-live-ak.akamaized.net/out/v1/46079e838e65490c8299f902a7731168/index.m3u8', category: 'Movies', number: 33 },
  { name: 'MOVIE SPHERE UK', url: 'https://moviesphereuk-samsunguk.amagi.tv/playlist.m3u8', category: 'Movies', number: 34 },
  { name: 'MOVIE SPHERE', url: 'https://dxazj2uf8uiwf.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-2ra9rjcmiktyz/playlist.m3u8?ads.device_did=%7BPSID%7D&ads.device_dnt=%7BTARGETOPT%7D&ads.us_privacy=1YNY&ads.app_domain=%7BAPP_DOMAIN%7D&ads.app_name=%7BAPP_NAME%7D&ads.ssai_vendor=SSSLIVE', category: 'Movies', number: 35 },
  { name: 'PLEX NEW MOVIES', url: 'https://7732c5436342497882363a8cd14ceff4.mediatailor.us-east-1.amazonaws.com/v1/master/04fd913bb278d8775298c26fdca9d9841f37601f/Plex_NewMovies/playlist.m3u8', category: 'Movies', number: 36 },
  { name: 'SAMSUNG NEW MOVIES', url: 'https://bd281c27a16f4a7fb4a88260378e8082.mediatailor.us-east-1.amazonaws.com/v1/master/44f73ba4d03e9607dcd9bebdcb8494d86964f1d8/Samsung_NewMovies/playlist.m3u8', category: 'Movies', number: 37 },
  { name: 'TVN Movies Pinoy', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_tvnmovie/default/index.mpd', category: 'Movies', number: 38 },
  { name: 'Viva Cinema', url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/viva_sd/default/index.mpd', category: 'Movies', number: 39 },
  { name: 'TMC (Tagalized Movie Channel)', url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_tagalogmovie/default/index.mpd', category: 'Movies', number: 40 },
  { name: 'Celestial Movies Pinoy', url: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/celmovie_pinoy_sd/default/index.mpd', category: 'Movies', number: 41 },

  // PREMIUM CHANNELS
  { name: 'HBO', url: 'https://fl2.moveonjoy.com/HBO/index.m3u8', category: 'Premium', number: 42 },
  { name: 'HBO 2', url: 'https://fl5.moveonjoy.com/HBO_2/index.m3u8', category: 'Premium', number: 43 },
  { name: 'HBO COMEDY', url: 'https://fl5.moveonjoy.com/HBO_COMEDY/index.m3u8', category: 'Premium', number: 44 },
  { name: 'HBO FAMILY', url: 'https://fl5.moveonjoy.com/HBO_FAMILY/index.m3u8', category: 'Premium', number: 45 },
  { name: 'HBO ZONE', url: 'https://fl5.moveonjoy.com/HBO_ZONE/index.m3u8', category: 'Premium', number: 46 },
  { name: 'SHOWTIME', url: 'https://fl2.moveonjoy.com/SHOWTIME/index.m3u8', category: 'Premium', number: 47 },
  { name: 'SHOWTIME 2', url: 'https://fl5.moveonjoy.com/SHOWTIME_2/index.m3u8', category: 'Premium', number: 48 },
  { name: 'SHOWTIME EXTREME', url: 'https://fl5.moveonjoy.com/SHOWTIME_EXTREME/index.m3u8', category: 'Premium', number: 49 },
  { name: 'SHOWTIME NEXT', url: 'https://fl5.moveonjoy.com/SHOWTIME_NEXT/index.m3u8', category: 'Premium', number: 50 },
  { name: 'SHOWTIME WOMEN', url: 'https://fl5.moveonjoy.com/SHOWTIME_WOMEN/index.m3u8', category: 'Premium', number: 51 },
  { name: 'STARZ', url: 'https://fl5.moveonjoy.com/STARZ/index.m3u8', category: 'Premium', number: 52 },
  { name: 'STARZ COMEDY', url: 'https://fl5.moveonjoy.com/STARZ_COMEDY/index.m3u8', category: 'Premium', number: 53 },
  { name: 'STARZ EDGE', url: 'https://fl5.moveonjoy.com/STARZ_EDGE/index.m3u8', category: 'Premium', number: 54 },
  { name: 'STARZ ENCORE', url: 'https://fl5.moveonjoy.com/STARZ_ENCORE/index.m3u8', category: 'Premium', number: 55 },
  { name: 'STARZ ENCORE ACTION', url: 'https://fl5.moveonjoy.com/STARZ_ENCORE_ACTION/index.m3u8', category: 'Premium', number: 56 },
  { name: 'STARZ ENCORE WESTERNS', url: 'https://fl5.moveonjoy.com/STARZ_ENCORE_WESTERNS/index.m3u8', category: 'Premium', number: 57 },
  { name: 'STARZ WEST', url: 'https://fl5.moveonjoy.com/STARZ_WEST/index.m3u8', category: 'Premium', number: 58 },

  // KIDS CHANNELS
  { name: 'CARTOON NETWORK', url: 'https://cdn3.skygo.mn/live/disk1/Cartoon_Network/HLSv3-FTA/Cartoon_Network.m3u8', category: 'Kids', number: 59 },
  { name: 'CARTOONITO', url: 'https://cdn3.skygo.mn/live/disk1/Boomerang/HLSv3-FTA/Boomerang.m3u8', category: 'Kids', number: 60 },
  { name: 'BABYSHARK TV', url: 'https://newidco-babysharktv-1-eu.rakuten.wurl.tv/playlist.m3u8', category: 'Kids', number: 61 },
  { name: 'KIDOODLE TV', url: 'https://kidoodletv-kdtv-1-us.samsung.wurl.tv/playlist.m3u8', category: 'Kids', number: 62 },
  { name: 'PBS KIDS', url: 'https://2-fss-2.streamhoster.com/pl_140/amlst:200914-1298290/playlist.m3u8', category: 'Kids', number: 63 },
  { name: 'BBC KIDS', url: 'https://dmr1h4skdal9h.cloudfront.net/v1/manifest/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-msbj6srh7nhug/ce36558b-b031-4284-94be-91ed22d31a41/2.m3u8', category: 'Kids', number: 64 },
  { name: 'ZOOMOO', url: 'https://cdn3.skygo.mn/live/disk1/Zoomoo/HLSv3-FTA/Zoomoo.m3u8', category: 'Kids', number: 65 },
  { name: 'DISCOVERY FAMILY CHANNEL', url: 'https://fl5.moveonjoy.com/DISCOVERY_FAMILY_CHANNEL/index.m3u8', category: 'Kids', number: 66 },
  { name: 'DISNEY CHANNEL', url: 'https://fl5.moveonjoy.com/DISNEY_CHANNEL/index.m3u8', category: 'Kids', number: 67 },
  { name: 'DISNEY XD', url: 'https://fl5.moveonjoy.com/DISNEY_XD/index.m3u8', category: 'Kids', number: 68 },
  { name: 'DISNEY JR', url: 'https://fl2.moveonjoy.com/DISNEY_JR/index.m3u8', category: 'Kids', number: 69 },
  { name: 'NICKELODEON', url: 'https://fl1.moveonjoy.com/NICKELODEON/index.m3u8', category: 'Kids', number: 70 },
  { name: 'NICK JR', url: 'https://fl5.moveonjoy.com/NICK_JR/index.m3u8', category: 'Kids', number: 71 },
  { name: 'NICKTOONS', url: 'https://fl1.moveonjoy.com/NICKTOONS/index.m3u8', category: 'Kids', number: 72 },

  // ANIME
  { name: 'ANIME X HIDIVE', url: 'https://amc-anime-x-hidive-1-us.tablo.wurl.tv/playlist.m3u8', category: 'Anime', number: 73 },
  { name: 'Hi-YAH!', url: 'https://linear-59.frequency.stream/dist/roku/59/hls/master/playlist.m3u8', category: 'Anime', number: 74 },

  // DOCUMENTARY & EDUCATIONAL
  { name: 'NATIONAL GEOGRAPHIC', url: 'https://fl5.moveonjoy.com/National_Geographic/index.m3u8', category: 'Documentary', number: 75 },
  { name: 'NAT GEO WILD', url: 'https://fl5.moveonjoy.com/Nat_Geo_Wild/index.m3u8', category: 'Documentary', number: 76 },
  { name: 'DISCOVERY CHANNEL', url: 'https://fl3.moveonjoy.com/Discovery_Channel/index.m3u8', category: 'Documentary', number: 77 },
  { name: 'DISCOVERY ASIA', url: 'https://cdn3.skygo.mn/live/disk1/Discovery_Asia/HLSv3-FTA/Discovery_Asia.m3u8', category: 'Documentary', number: 78 },
  { name: 'ANIMAL PLANET', url: 'https://fl5.moveonjoy.com/Animal_Planet/index.m3u8', category: 'Documentary', number: 79 },
  { name: 'WILD EARTH', url: 'https://wildearth-plex.amagi.tv/master.m3u8', category: 'Documentary', number: 80 },
  { name: 'TRAVELXP', url: 'https://travelxp-travelxp-1-eu.rakuten.wurl.tv/playlist.m3u8', category: 'Documentary', number: 81 },
  { name: 'LOTUS MACAU', url: 'https://cdn3.skygo.mn/live/disk1/Lotus/HLSv3-FTA/Lotus.m3u8', category: 'Documentary', number: 82 },

  // SPORTS
  { name: 'COMBATGO', url: 'https://jungotvstream.chanall.tv/jungotv/combatgo/stream.m3u8', category: 'Sports', number: 83 },
  { name: 'NBA TV', url: 'https://fl5.moveonjoy.com/NBA_TV/index.m3u8', category: 'Sports', number: 84 },
  { name: 'NHL NETWORK', url: 'https://fl6.moveonjoy.com/NHL_NETWORK/index.m3u8', category: 'Sports', number: 85 },
  { name: 'REDBULL TV', url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_1660.m3u8?xtreamiptv.m3u8', category: 'Sports', number: 86 },
  { name: 'NBA TV Philippines', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cgnl_nba/default/index.mpd', category: 'Sports', number: 87 },

  // MUSIC
  { name: 'MTV', url: 'https://fl2.moveonjoy.com/MTV/index.m3u8', category: 'Music', number: 88 },
  { name: 'MTV LIVE', url: 'https://fl2.moveonjoy.com/MTV_LIVE/index.m3u8', category: 'Music', number: 89 },
  { name: 'NICK MUSIC', url: 'https://fl5.moveonjoy.com/NICK_MUSIC/index.m3u8', category: 'Music', number: 90 },

  // LIFESTYLE
  { name: 'HGTV', url: 'https://fl2.moveonjoy.com/HGTV/index.m3u8', category: 'Lifestyle', number: 91 },

  // NEWS
  { name: 'ALJAZEERA', url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8', category: 'News', number: 92 },
  { name: 'BLOOMBERG', url: 'https://www.bloomberg.com/media-manifest/streams/asia.m3u8', category: 'News', number: 93 },
  { name: 'BBC NEWS', url: 'https://cdn3.skygo.mn/live/disk1/BBC_News/HLSv3-FTA/BBC_News.m3u8', category: 'News', number: 94 },
  { name: 'SKY NEWS', url: 'https://linear417-gb-hls1-prd-ak.cdn.skycdp.com/100e/Content/HLS_001_1080_30/Live/channel(skynews)/index_1080-30.m3u8', category: 'News', number: 95 },
  { name: 'One News', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/onenews_hd1/default/index.mpd', category: 'News', number: 96 },
  { name: 'RPTV', url: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cnn_rptv_prod_hd/default/index.mpd', category: 'News', number: 97 },
];

// --- ADMIN & COLLECTIONS ---
export const ADMIN_UIDS = ['YOUR_FIREBASE_UID_HERE'];
export const CURATED_COLLECTIONS = [
  { title: "Halloween Horrors", ids: [ { id: 760161, type: 'movie' }, { id: 965876, type: 'movie' } ] },
  { title: "Mind-Bending Sci-Fi", ids: [ { id: 603, type: 'movie' }, { id: 157336, type: 'movie' } ] },
];

// --- GET EMBED URL ---
export const getEmbedUrl = (type, id, season, episode, imdb_id, mal_id) => {
  for (const source of SOURCE_ORDER) {
    const src = EMBED_URLS[source];
    if (!src) continue;

    if (type === "movie" && src.movie) { return src.movie(id); }
    if (type === "tv" && src.tv) { return src.tv(id, season, episode); }
    if (type === "anime" && src.anime && mal_id) { return src.anime(mal_id, episode || 1, "sub"); }
  }
  return null;
};