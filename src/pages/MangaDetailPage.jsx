import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBook, FaClock, FaBookmark, FaPlay } from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';
import ProgressiveImage from '../components/ProgressiveImage';

export const MangaDetailPage = () => {
  const { id: rawId } = useParams();
  const mangaId = rawId ? decodeURIComponent(rawId) : '';
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get source from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const source = searchParams.get('source') || 'weebcentral';
  const slug = searchParams.get('slug') || '';

  // Helper function to fetch from WeebCentral
  const fetchWeebCentral = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        source: 'weebcentral',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

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
      const queryParams = new URLSearchParams({
        source: 'mangakakalot',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

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
      const queryParams = new URLSearchParams({
        source: 'manganelo',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

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
      const queryParams = new URLSearchParams({
        source: 'mangapanda',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

      if (!response.ok) throw new Error('MangaPanda request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from MangaPanda:', error);
      throw error;
    }
  };

  const fetchMangahere = async (action, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        source: 'mangahere',
        action,
        ...params,
      }).toString();
      const response = await fetch(`/api/manga?${queryParams}`);

      if (!response.ok) throw new Error('Mangahere request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Mangahere:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setIsLoading(true);

        if (source === 'mangahere') {
          const seriesData = await fetchMangahere('series', { mangaId });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: mangaId,
              slug: slug,
              title: s.title || 'Unknown Title',
              description: s.description || 'No description available',
              coverImage: s.coverImage || 'https://via.placeholder.com/512x768?text=No+Cover',
              status: s.status || 'unknown',
              rating: 'safe',
              year: null,
              author: s.author || 'Unknown',
              artist: s.artist || 'Unknown',
              tags: s.genres || [],
            });
          }

          const chaptersData = await fetchMangahere('chapters', { mangaId });

          if (chaptersData?.chapters) {
            const chaptersList = chaptersData.chapters.map((ch, index) => ({
              id: ch.id,
              chapter: ch.chapter ? String(ch.chapter) : String(index + 1),
              title: ch.title || `Chapter ${index + 1}`,
              pages: 0,
              publishAt: new Date(),
            }));

            setChapters(chaptersList);
          }
        } else if (source === 'weebcentral') {
          // Fetch from WeebCentral
          const seriesData = await fetchWeebCentral('series', { seriesId: mangaId });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: mangaId,
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
          const chaptersData = await fetchWeebCentral('chapters', { seriesId: mangaId });

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
          const seriesData = await fetchMangakakalot('series', { mangaId: mangaId });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: mangaId,
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
          const chaptersData = await fetchMangakakalot('chapters', { mangaId: mangaId });

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
          const seriesData = await fetchManganelo('series', { mangaId: mangaId });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: mangaId,
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
          const chaptersData = await fetchManganelo('chapters', { mangaId: mangaId });

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
          const seriesData = await fetchMangaPanda('series', { mangaId: mangaId });

          if (seriesData?.series) {
            const s = seriesData.series;
            setManga({
              id: mangaId,
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
          const chaptersData = await fetchMangaPanda('chapters', { mangaId: mangaId });

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
        }
      } catch (err) {
        console.error('Error fetching manga details:', err);
        setManga(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (mangaId) {
      fetchMangaDetails();
    }
  }, [mangaId, source, slug]);

  const handleChapterClick = chapterId => {
    const encodedSeriesId = encodeURIComponent(mangaId);
    const encodedChapterId = encodeURIComponent(chapterId);

    if (source === 'weebcentral') {
      const slugQuery = slug ? `&slug=${encodeURIComponent(slug)}` : '';
      navigate(
        `/manga/${encodedSeriesId}/chapter/${encodedChapterId}?source=weebcentral${slugQuery}`
      );
    } else if (source === 'mangahere') {
      const slugQuery = slug ? `&slug=${encodeURIComponent(slug)}` : '';
      navigate(
        `/manga/${encodedSeriesId}/chapter/${encodedChapterId}?source=mangahere${slugQuery}`
      );
    } else if (source === 'mangakakalot') {
      navigate(`/manga/${encodedSeriesId}/chapter/${encodedChapterId}?source=mangakakalot`);
    } else if (source === 'manganelo') {
      navigate(`/manga/${encodedSeriesId}/chapter/${encodedChapterId}?source=manganelo`);
    } else if (source === 'mangapanda') {
      navigate(`/manga/${encodedSeriesId}/chapter/${encodedChapterId}?source=mangapanda`);
    } else {
      navigate(`/manga/${encodedSeriesId}/chapter/${encodedChapterId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center text-white">
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
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
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
              {/* Progressive cover image */}
              <ProgressiveImage
                src={manga.coverImage || 'https://via.placeholder.com/512x768?text=No+Image'}
                placeholderSrc={'https://via.placeholder.com/92x138.png?text=...'}
                alt={manga.title}
                imgProps={{
                  className: 'w-full rounded-xl shadow-2xl',
                  onError: e => {
                    e.target.src = 'https://via.placeholder.com/512x768?text=No+Image';
                  },
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
                <strong>📚 Chapter Availability:</strong> Free manga chapters from various sources.
                Some manga may have limited chapters due to licensing or scanlation group policies.
                All available chapters are shown below.
              </p>
            </div>
          )}

          {/* Chapters List */}
          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaBook className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No chapters available for this manga</p>
              <p className="text-sm text-gray-500">
                This manga may not have chapters uploaded yet, or they may be exclusively licensed
                elsewhere.
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
