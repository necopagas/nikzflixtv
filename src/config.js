export const API_KEY = "3b0f392b6173455e37624a78bd5f79d4";
export const IMG_PATH = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_PATH = "https://image.tmdb.org/t/p/original";

export const API_ENDPOINTS = {
    trending: `https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`,
    popular: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`,
    toprated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`,
    tvshows: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`,
    asianDramas: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=18&with_origin_country=KR,JP,CN,TH&sort_by=popularity.desc`,
    shortDramas: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_type=1&sort_by=popularity.desc`,

    // --- MGA BAG-ONG ENDPOINTS PARA SA ANIME PAGE ---
    animePopular: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=210024&sort_by=popularity.desc`,
    animeTopRated: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`,
    animeMovies: `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_keywords=210024&sort_by=popularity.desc`,
    animeOnTheAir: `https://api.themoviedb.org/3/tv/on_the_air?api_key=${API_KEY}&with_keywords=210024`,
    
    // Gi-rename nato ang daan nga 'anime' para klaro
    discoverAnime: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_keywords=210024&sort_by=popularity.desc`,

    search: (query, page = 1) => `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
    details: (type, id) => `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&append_to_response=videos,credits,external_ids`,
    byGenre: (genreId) => `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`,
    recommendations: (type, id) => `https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${API_KEY}`,
};

export const MOVIE_GENRES = [
    { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' }, { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' }, { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Science Fiction' }, { id: 10770, name: 'TV Movie' }, { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' }
];

export const EMBED_URLS = {
    vidsrc: {
        movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
        tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
    },
    multiembed: {
        movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
        tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
    },
    vidlink: {
        movie: (id) => `https://vidlink.pro/movie/${id}`,
        tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
    },
    videasy: {
        movie: (imdb_id) => imdb_id ? `https://player.videasy.net/movie/${imdb_id}` : null,
        tv: (imdb_id, s, e) => imdb_id ? `https://player.videasy.net/tv/${imdb_id}/${s}/${e}` : null,
    },
    vidfast: {
        movie: (id) => `https://vidfast.pro/movie/${id}?autoPlay=true`,
        tv: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true`,
    },
    autoembed: {
        movie: (id) => `https://autoembed.pro/embed/movie/${id}`,
        tv: (id, s, e) => `https://autoembed.pro/embed/tv/${id}/${s}/${e}`,
    },
    vidlink_anime: {
        anime: (mal_id, e, type) => `https://vidlink.pro/anime/${mal_id}/${e}/${type}?fallback=true`
    }
};

export const SOURCE_ORDER = ['autoembed', 'vidlink', 'vidfast', 'vidsrc', 'multiembed', 'videasy'];

// Ang uban code sa ubos parehas ra...
export const IPTV_CHANNELS = [
    { name: 'GMA 7', url: 'https://amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono-dzsx9.amagi.tv/index.mpd' },
    // ...ug ang uban channels
];
