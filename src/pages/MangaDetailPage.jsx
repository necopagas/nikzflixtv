import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBook, FaClock, FaBookmark, FaPlay } from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const MangaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get source from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const source = searchParams.get('source') || 'mangadex';
  const slug = searchParams.get('slug') || '';

  // Helper function to fetch from WeebCentral
  const fetchWeebCentral = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({ action, ...params }).toString();
      const response = await fetch(`/api/weebcentral?${queryParams}`);

      if (!response.ok) throw new Error('WeebCentral request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from WeebCentral:', error);
      throw error;
    }
  };

  // Helper function to fetch from Mangakakalot
  const fetchMangakakalot = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({ action, ...params }).toString();
      const response = await fetch(`/api/mangakakalot?${queryParams}`);

      if (!response.ok) throw new Error('Mangakakalot request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Mangakakalot:', error);
      throw error;
    }
  };

  // Helper function to fetch from Manganelo
  const fetchManganelo = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({ action, ...params }).toString();
      const response = await fetch(`/api/manganelo?${queryParams}`);

      if (!response.ok) throw new Error('Manganelo request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Manganelo:', error);
      throw error;
    }
  };

  // Helper function to fetch from MangaPanda
  const fetchMangaPanda = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({ action, ...params }).toString();
      const response = await fetch(`/api/mangapanda?${queryParams}`);

      if (!response.ok) throw new Error('MangaPanda request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from MangaPanda:', error);
      throw error;
    }
  };

  // Helper function to fetch from MangaDex (with proxy fallback for production)
  const fetchMangaDex = async endpoint => {
    try {
      const isProduction = window.location.hostname !== 'localhost';

      if (isProduction) {
        const response = await fetch(`/api/mangadex?endpoint=${encodeURIComponent(endpoint)}`);
        if (!response.ok) throw new Error('Proxy request failed');
        return await response.json();
      } else {
        const response = await fetch(`https://api.mangadex.org${endpoint}`);
        if (!response.ok) throw new Error('MangaDex request failed');
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching from MangaDex:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setIsLoading(true);

        if (source === 'weebcentral') {
          // Fetch from WeebCentral
          const seriesData = await fetchWeebCentral('series', { seriesId: id });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: id,
              slug: slug,
              title: s.title || 'Unknown Title',
              description: s.description || 'No description available',
              coverImage: s.coverImage || 'https://via.placeholder.com/512x768?text=No+Cover',
              status: s.status || 'unknown',
              rating: 'safe',
              year: null,
              author: 'Unknown',
              artist: 'Unknown',
              tags: [],
            });
          }

          // Fetch chapters
          const chaptersData = await fetchWeebCentral('chapters', { seriesId: id });

          if (chaptersData?.chapters) {
            const chaptersList = chaptersData.chapters.map((ch, index) => ({
              id: ch.id,
              chapter: String(index + 1),
              title: ch.title || `Chapter ${index + 1}`,
              pages: 0,
              publishAt: new Date(),
            }));

            setChapters(chaptersList);
          }
        } else if (source === 'mangakakalot') {
          // Fetch from Mangakakalot
          const seriesData = await fetchMangakakalot('series', { mangaId: id });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: id,
              title: s.title || 'Unknown Title',
              description: s.description || 'No description available',
              coverImage: s.coverImage || 'https://via.placeholder.com/512x768?text=No+Cover',
              status: s.status || 'unknown',
              rating: 'safe',
              year: null,
              author: 'Unknown',
              artist: 'Unknown',
              tags: [],
            });
          }

          // Fetch chapters
          const chaptersData = await fetchMangakakalot('chapters', { mangaId: id });

          if (chaptersData?.chapters) {
            const chaptersList = chaptersData.chapters.map((ch, index) => ({
              id: ch.id,
              chapter: String(index + 1),
              title: ch.title || `Chapter ${index + 1}`,
              pages: 0,
              publishAt: new Date(),
            }));

            setChapters(chaptersList);
          }
        } else if (source === 'manganelo') {
          // Fetch from Manganelo
          const seriesData = await fetchManganelo('series', { mangaId: id });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: id,
              title: s.title || 'Unknown Title',
              description: s.description || 'No description available',
              coverImage: s.coverImage || 'https://via.placeholder.com/512x768?text=No+Cover',
              status: s.status || 'unknown',
              rating: 'safe',
              year: null,
              author: 'Unknown',
              artist: 'Unknown',
              tags: [],
            });
          }

          // Fetch chapters
          const chaptersData = await fetchManganelo('chapters', { mangaId: id });

          if (chaptersData?.chapters) {
            const chaptersList = chaptersData.chapters.map((ch, index) => ({
              id: ch.id,
              chapter: String(index + 1),
              title: ch.title || `Chapter ${index + 1}`,
              pages: 0,
              publishAt: new Date(),
            }));

            setChapters(chaptersList);
          }
        } else if (source === 'mangapanda') {
          // Fetch from MangaPanda
          const seriesData = await fetchMangaPanda('series', { mangaId: id });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: id,
              title: s.title || 'Unknown Title',
              description: s.description || 'No description available',
              coverImage: s.coverImage || 'https://via.placeholder.com/512x768?text=No+Cover',
              status: s.status || 'unknown',
              rating: 'safe',
              year: null,
              author: 'Unknown',
              artist: 'Unknown',
              tags: [],
            });
          }

          // Fetch chapters
          const chaptersData = await fetchMangaPanda('chapters', { mangaId: id });

          if (chaptersData?.chapters) {
            const chaptersList = chaptersData.chapters.map((ch, index) => ({
              id: ch.id,
              chapter: String(index + 1),
              title: ch.title || `Chapter ${index + 1}`,
              pages: 0,
              publishAt: new Date(),
            }));

            setChapters(chaptersList);
          }
        } else {
          // Fetch manga info from MangaDex
          const endpoint = `/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`;
          const mangaData = await fetchMangaDex(endpoint);
          const m = mangaData.data;

          const coverArt = m.relationships.find(rel => rel.type === 'cover_art');
          const coverId = coverArt?.attributes?.fileName;
          const author = m.relationships.find(rel => rel.type === 'author');
          const artist = m.relationships.find(rel => rel.type === 'artist');

          setManga({
            id: m.id,
            title: m.attributes.title.en || Object.values(m.attributes.title)[0] || 'Unknown Title',
            description:
              m.attributes.description?.en ||
              Object.values(m.attributes.description)[0] ||
              'No description available',
            coverImage: coverId
              ? `/api/manga-cover?mangaId=${m.id}&fileName=${coverId}&size=512`
              : 'https://via.placeholder.com/512x768?text=No+Cover',
            status: m.attributes.status,
            rating: m.attributes.contentRating,
            year: m.attributes.year,
            author: author?.attributes?.name || 'Unknown',
            artist: artist?.attributes?.name || 'Unknown',
            tags: m.attributes.tags?.map(tag => tag.attributes.name.en) || [],
          });

          // Fetch chapters with pagination support (MangaDex max limit is 100 per request)
          let allChapters = [];
          let offset = 0;
          const limit = 100;
          let hasMore = true;

          // Loop to fetch all chapters with pagination
          while (hasMore) {
            const chaptersEndpoint = `/manga/${id}/feed?limit=${limit}&offset=${offset}&order[chapter]=asc&translatedLanguage[]=en`;
            const chaptersData = await fetchMangaDex(chaptersEndpoint);

            if (chaptersData.data && chaptersData.data.length > 0) {
              allChapters = allChapters.concat(chaptersData.data);
              offset += limit;

              // Check if there are more chapters to fetch
              hasMore = chaptersData.data.length === limit && offset < (chaptersData.total || 1000);
            } else {
              hasMore = false;
            }
          }

          // Remove duplicate chapters (sometimes MangaDex has multiple versions)
          const uniqueChapters = new Map();
          allChapters.forEach(ch => {
            const chapterNum = ch.attributes.chapter;
            if (
              !uniqueChapters.has(chapterNum) ||
              new Date(ch.attributes.publishAt) >
                new Date(uniqueChapters.get(chapterNum).attributes.publishAt)
            ) {
              uniqueChapters.set(chapterNum, ch);
            }
          });

          const chaptersList = Array.from(uniqueChapters.values())
            .map(ch => ({
              id: ch.id,
              chapter: ch.attributes.chapter,
              title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
              pages: ch.attributes.pages,
              publishAt: new Date(ch.attributes.publishAt),
            }))
            .sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter)); // Sort by chapter number

          setChapters(chaptersList);
        }
      } catch (err) {
        console.error('Error fetching manga details:', err);
        setManga(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchMangaDetails();
    }
  }, [id, source, slug]);

  const handleChapterClick = chapterId => {
    if (source === 'weebcentral') {
      navigate(`/manga/${id}/chapter/${chapterId}?source=weebcentral&slug=${slug}`);
    } else if (source === 'mangakakalot') {
      navigate(`/manga/${id}/chapter/${chapterId}?source=mangakakalot`);
    } else if (source === 'manganelo') {
      navigate(`/manga/${id}/chapter/${chapterId}?source=manganelo`);
    } else if (source === 'mangapanda') {
      navigate(`/manga/${id}/chapter/${chapterId}?source=mangapanda`);
    } else {
      navigate(`/manga/${id}/chapter/${chapterId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Manga not found or failed to load details.</p>
          <button
            onClick={() => navigate('/manga')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
          >
            Back to Manga
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/manga')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <FaArrowLeft />
          Back to Manga
        </button>

        {/* Manga Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Cover Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <img
                src={manga.coverImage || 'https://via.placeholder.com/512x768?text=No+Image'}
                alt={manga.title}
                className="w-full rounded-xl shadow-2xl"
                onError={e => {
                  e.target.src = 'https://via.placeholder.com/512x768?text=No+Image';
                }}
              />

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                  <FaBookmark />
                  Add to My List
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold mb-4">{manga.title}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              {manga.year && (
                <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
                  <FaClock />
                  <span>{manga.year}</span>
                </div>
              )}
              <div
                className={`px-3 py-1 rounded-full ${
                  manga.status === 'completed'
                    ? 'bg-green-600'
                    : manga.status === 'ongoing'
                      ? 'bg-blue-600'
                      : 'bg-gray-600'
                }`}
              >
                {manga.status}
              </div>
              <div
                className={`px-3 py-1 rounded-full ${
                  manga.rating === 'safe'
                    ? 'bg-green-600'
                    : manga.rating === 'suggestive'
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                }`}
              >
                {manga.rating}
              </div>
            </div>

            {/* Author/Artist */}
            <div className="mb-6 text-gray-300">
              <p>
                <span className="font-semibold">Author:</span> {manga.author}
              </p>
              <p>
                <span className="font-semibold">Artist:</span> {manga.artist}
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-3">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">{manga.description}</p>
            </div>

            {/* Tags */}
            {manga.tags && manga.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {manga.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-600/50 hover:bg-purple-600 rounded-full text-sm transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chapters Section */}
        <div className="bg-gray-800/50 rounded-xl p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
            <FaBook className="text-purple-400" />
            Chapters ({chapters.length})
          </h2>

          {/* Info Notice */}
          {chapters.length > 0 && (
            <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>📚 Chapter Availability:</strong> MangaDex provides free manga chapters
                uploaded by the community. Some manga may have limited chapters due to licensing or
                scanlation group policies. All available chapters are shown below.
              </p>
            </div>
          )}

          {/* Chapters List */}
          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaBook className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No chapters available for this manga</p>
              <p className="text-sm text-gray-500">
                This manga may not have chapters uploaded to MangaDex yet, or they may be
                exclusively licensed elsewhere.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {chapters.map(chapter => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter.id)}
                  className="flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <FaPlay className="text-purple-400 group-hover:text-purple-300" />
                    <div className="text-left">
                      <h3 className="font-semibold group-hover:text-purple-400 transition-colors">
                        Chapter {chapter.chapter}
                        {chapter.title && chapter.title !== `Chapter ${chapter.chapter}` && (
                          <span className="text-gray-400"> - {chapter.title}</span>
                        )}
                      </h3>
                      {chapter.pages > 0 && (
                        <p className="text-sm text-gray-400">{chapter.pages} pages</p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {chapter.publishAt.toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
