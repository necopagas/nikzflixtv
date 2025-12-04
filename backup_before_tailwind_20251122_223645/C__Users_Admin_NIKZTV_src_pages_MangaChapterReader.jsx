import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaList, FaTimes } from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';

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

const SOURCE_ORDER = ['mangahere'];
const SOURCE_LABELS = {
  mangahere: 'Mangahere',
};
const SOURCE_FETCHERS = {
  mangahere: fetchMangahere,
};

const getFallbackChain = requested => [
  requested,
  ...SOURCE_ORDER.filter(candidate => candidate !== requested),
];

const MangaChapterReader = () => {
  const { id: rawId, chapterId: rawChapterId } = useParams();
  const mangaId = rawId ? decodeURIComponent(rawId) : '';
  const chapterId = rawChapterId ? decodeURIComponent(rawChapterId) : '';
  const navigate = useNavigate();

  // Get source from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const source = searchParams.get('source') || 'mangahere';

  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [chapters, setChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(-1);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [resolvedSource, setResolvedSource] = useState(source);

  useEffect(() => {
    setResolvedSource(source);
  }, [source]);

  const fallbackNotice =
    resolvedSource && resolvedSource !== source ? (
      <div className="fixed inset-x-0 top-0 z-50 mt-12 flex justify-center pointer-events-none">
        <div className="px-3 py-1 bg-amber-500/90 text-black text-xs uppercase tracking-wide rounded-full shadow-lg">
          Resolved source: {SOURCE_LABELS[resolvedSource] ?? resolvedSource}
        </div>
      </div>
    ) : null;

  const fetchWithFallback = useCallback(
    async (action, buildParams) => {
      const candidates = getFallbackChain(source);
      let lastError = null;

      for (const candidate of candidates) {
        const handler = SOURCE_FETCHERS[candidate];
        if (!handler) continue;

        const params = buildParams(candidate);
        if (!params) continue;

        try {
          const result = await handler(action, params);

          if (!result) {
            lastError = new Error(`Empty response from ${candidate}`);
            continue;
          }

          const hasData =
            (result.pages && result.pages.length > 0) ||
            (result.chapters && result.chapters.length > 0);

          if (hasData) {
            if (resolvedSource !== candidate) {
              setResolvedSource(candidate);
            }
            return { data: result, source: candidate };
          }

          lastError = new Error(`No content from ${candidate}`);
        } catch (error) {
          lastError = error;
          console.warn(`Source ${candidate} failed:`, error.message);
        }
      }

      throw lastError || new Error('No manga sources available right now');
    },
    [source, resolvedSource]
  );

  // Fetch chapter pages
  useEffect(() => {
    const fetchChapterPages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data } = await fetchWithFallback('pages', () => ({ chapterId }));

        const pageUrls = data.pages?.map(p => p.img) ?? [];

        if (pageUrls.length === 0) {
          throw new Error('No pages returned from any manga source');
        }

        setPages(pageUrls);
      } catch (err) {
        console.error('Error fetching chapter pages:', err);
        setError('Failed to load chapter. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (chapterId) {
      fetchChapterPages();
    }
  }, [chapterId, source, fetchWithFallback]);

  // Fetch all chapters for navigation
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const { data } = await fetchWithFallback('chapters', () => ({ mangaId }));

        const chaptersPayload = data.chapters || [];
        if (chaptersPayload.length === 0) {
          throw new Error('No chapter data returned');
        }

        const normalized = chaptersPayload.map((ch, index) => {
          const chapterNumber = ch.chapter ?? index + 1;
          const chapterLabel =
            chapterNumber !== null && chapterNumber !== undefined
              ? String(chapterNumber)
              : String(index + 1);
          return {
            id: ch.id,
            chapter: chapterLabel,
            title: ch.title && ch.title.trim().length > 0 ? ch.title : `Chapter ${chapterLabel}`,
          };
        });

        setChapters(normalized);
        const index = normalized.findIndex(ch => ch.id === chapterId);
        setCurrentChapterIndex(index);
      } catch (err) {
        console.error('Error fetching chapters:', err);
      }
    };

    if (mangaId) {
      fetchChapters();
    }
  }, [mangaId, chapterId, fetchWithFallback]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = e => {
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pages.length]);

  // Touch gestures for mobile
  const minSwipeDistance = 50;

  const buildDetailUrl = () => {
    if (!mangaId) {
      return '/manga';
    }

    const encodedSeriesId = encodeURIComponent(mangaId);
    return `/manga/${encodedSeriesId}?source=mangahere`;
  };

  const buildChapterUrl = targetChapterId => {
    if (!mangaId || !targetChapterId) {
      return '/manga';
    }

    const encodedSeriesId = encodeURIComponent(mangaId);
    const encodedChapterId = encodeURIComponent(targetChapterId);
    return `/manga/${encodedSeriesId}/chapter/${encodedChapterId}?source=mangahere`;
  };

  const onTouchStart = e => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = e => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextPage();
    }
    if (isRightSwipe) {
      handlePrevPage();
    }
  };

  // Auto-hide controls on mobile
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      if (window.innerWidth <= 768) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(hideTimer);
  }, [currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChapterIndex < chapters.length - 1) {
      const nextChapter = chapters[currentChapterIndex + 1];
      navigate(buildChapterUrl(nextChapter.id));
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      const prevChapter = chapters[currentChapterIndex - 1];
      navigate(buildChapterUrl(prevChapter.id));
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      const nextChapter = chapters[currentChapterIndex + 1];
      navigate(buildChapterUrl(nextChapter.id));
    }
  };

  if (isLoading) {
    return (
      <>
        {fallbackNotice}
        <div className="min-h-screen bg-black flex items-center justify-center">
          <LoadingSpinner size="xl" />
        </div>
      </>
    );
  }

  if (error || pages.length === 0) {
    return (
      <>
        {fallbackNotice}
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-xl mb-4">{error || 'No pages available'}</p>
            <button
              onClick={() => {
                navigate(buildDetailUrl());
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
            >
              Back to Manga
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentChapter = chapters[currentChapterIndex];

  return (
    <>
      {fallbackNotice}
      <div className="min-h-screen bg-black text-white">
        {/* Top Navigation Bar */}
        <div
          className={`fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-800 transition-transform duration-300 ${
            showControls ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <button
              onClick={() => {
                navigate(buildDetailUrl());
              }}
              className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
            >
              <FaArrowLeft className="text-sm sm:text-base" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-400">
                {currentPage + 1}/{pages.length}
              </span>

              {currentChapter && (
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                  Ch. {currentChapter.chapter}
                </span>
              )}

              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="px-2 sm:px-3 py-1 sm:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-sm"
              >
                <FaList className="text-sm" />
                <span className="hidden md:inline">Chapters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chapter List Sidebar */}
        {showChapterList && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowChapterList(false)}
          >
            <div
              className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Chapters</h3>
                <button
                  onClick={() => setShowChapterList(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-2">
                {chapters.map(chapter => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      navigate(buildChapterUrl(chapter.id));
                      setShowChapterList(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      chapter.id === chapterId
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="font-semibold">Chapter {chapter.chapter}</div>
                    {chapter.title && chapter.title !== `Chapter ${chapter.chapter}` && (
                      <div className="text-sm text-gray-400 truncate">{chapter.title}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="pt-12 sm:pt-16">
          {/* Current Page Image */}
          <div
            className="flex items-center justify-center min-h-screen p-0 sm:p-4"
            onClick={() => setShowControls(!showControls)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={pages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="max-w-full h-auto touch-manipulation"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            />
          </div>

          {/* Navigation Controls */}
          <div
            className={`fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 p-2 sm:p-4 transition-transform duration-300 ${
              showControls ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="container mx-auto flex items-center justify-between gap-2">
              {/* Previous Button */}
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-sm"
              >
                <FaArrowLeft className="text-sm" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Slider */}
              <div className="flex-1 mx-2 sm:mx-4 max-w-md">
                <input
                  type="range"
                  min="0"
                  max={pages.length - 1}
                  value={currentPage}
                  onChange={e => setCurrentPage(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextPage}
                className="px-2 sm:px-4 py-1 sm:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Chapter Navigation */}
            <div className="container mx-auto mt-2 sm:mt-3 flex items-center justify-center gap-2 sm:gap-4">
              <button
                onClick={handlePrevChapter}
                disabled={currentChapterIndex <= 0}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                ← Prev Ch
              </button>

              <button
                onClick={handleNextChapter}
                disabled={currentChapterIndex >= chapters.length - 1}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                Next Ch →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MangaChapterReader;
