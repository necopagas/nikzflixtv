import { useState, useEffect } from 'react';
import {
  FaSearch,
  FaFilter,
  FaGlobe,
  FaExclamationCircle,
  FaDownload,
  FaExternalLinkAlt,
  FaTimes,
  FaInfoCircle,
  FaMobileAlt,
  FaGlobeAmericas,
  FaBook,
} from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';

const MANGA_REPO_URL = 'https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json';

const MangaExtensionsPage = () => {
  const [mangaData, setMangaData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [nsfwFilter, setNsfwFilter] = useState('all');
  const [showInstructions, setShowInstructions] = useState(false);

  // Check if first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('manga-instructions-seen');
    if (!hasVisited) {
      setShowInstructions(true);
    }
  }, []);

  const handleCloseInstructions = () => {
    localStorage.setItem('manga-instructions-seen', 'true');
    setShowInstructions(false);
  };

  // Fetch manga data
  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);
        const response = await fetch(MANGA_REPO_URL);
        if (!response.ok) throw new Error('Failed to fetch manga data');
        const data = await response.json();
        setMangaData(data);
        setFilteredData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMangaData();
  }, []);

  // Get unique languages
  const languages = ['all', ...new Set(mangaData.map(item => item.lang))].sort();

  // Filter manga data
  useEffect(() => {
    let filtered = [...mangaData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sources?.some(source => source.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Language filter
    if (selectedLang !== 'all') {
      filtered = filtered.filter(item => item.lang === selectedLang);
    }

    // NSFW filter
    if (nsfwFilter !== 'all') {
      const nsfwValue = nsfwFilter === 'nsfw' ? 1 : 0;
      filtered = filtered.filter(item => item.nsfw === nsfwValue);
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedLang, nsfwFilter, mangaData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <FaExclamationCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Manga Extensions</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-linear-to-br from-gray-800 to-gray-900 border border-purple-500/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-linear-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <FaInfoCircle className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Welcome to Manga Extensions!</h2>
              </div>
              <button
                onClick={handleCloseInstructions}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Intro */}
              <div className="text-center">
                <p className="text-lg text-gray-300">
                  Browse ug download manga extensions para sa{' '}
                  <span className="text-purple-400 font-semibold">Aniyomi</span> o{' '}
                  <span className="text-pink-400 font-semibold">Tachiyomi</span> apps!
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaSearch className="w-5 h-5 text-purple-400" />
                        Search ug Filter
                      </h3>
                      <p className="text-gray-400">
                        Use ang search box para hanapon ang specific extension. Filter by language
                        (EN, JA, etc.) o content type (SFW/NSFW).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-pink-600 rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaMobileAlt className="w-5 h-5 text-pink-400" />
                        Download APK
                      </h3>
                      <p className="text-gray-400 mb-2">
                        Click ang{' '}
                        <span className="text-purple-400 font-semibold">"Download APK"</span> button
                        para i-download ang extension sa imong phone.
                      </p>
                      <p className="text-sm text-gray-500">
                        Install ang APK, then open Aniyomi/Tachiyomi → Browse → Extensions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center shrink-0 font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaGlobeAmericas className="w-5 h-5 text-blue-400" />
                        Visit Source Website
                      </h3>
                      <p className="text-gray-400">
                        Or click ang{' '}
                        <span className="text-gray-300 font-semibold">"Visit Source"</span> button
                        para direct browse sa manga website.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FaExclamationCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-yellow-300 mb-1">Important:</h4>
                    <p className="text-sm text-gray-300">
                      Para sa mobile installation, enable ang "Install from Unknown Sources" sa
                      imong phone settings. Powered by{' '}
                      <span className="font-semibold">Keiyoushi Extensions</span> - the
                      community-maintained successor sa Tachiyomi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCloseInstructions}
                className="w-full py-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                Sige, Get Started!
              </button>

              <p className="text-center text-sm text-gray-500">
                This message will only show once. You can always refer to the documentation file for
                more details.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Tachiyomi / Aniyomi Extensions
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            {filteredData.length} of {mangaData.length} manga extensions available
          </p>
          <p className="text-gray-500 text-sm">
            Download APK extensions para sa Tachiyomi/Aniyomi mobile apps - 100+ manga sources!
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search manga extensions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-4">
            {/* Language Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FaGlobe className="w-4 h-4" />
                Language
              </label>
              <select
                value={selectedLang}
                onChange={e => setSelectedLang(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang === 'all' ? 'All Languages' : lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* NSFW Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FaFilter className="w-4 h-4" />
                Content
              </label>
              <select
                value={nsfwFilter}
                onChange={e => setNsfwFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              >
                <option value="all">All Content</option>
                <option value="sfw">Safe for Work</option>
                <option value="nsfw">NSFW (18+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Manga Grid */}
        {filteredData.length === 0 ? (
          <div className="text-center py-16">
            <FaBook className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400">No manga extensions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((manga, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all duration-300 hover:transform hover:scale-[1.02]"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                      {manga.name.replace('Tachiyomi: ', '')}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="px-2 py-1 bg-purple-600/50 rounded-full text-xs font-medium">
                        {manga.lang.toUpperCase()}
                      </span>
                      {manga.nsfw === 1 && (
                        <span className="px-2 py-1 bg-red-600/50 rounded-full text-xs font-medium">
                          18+
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-600/50 rounded-full text-xs font-medium">
                        v{manga.version}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-400">
                  <p>
                    <span className="font-medium">Package:</span>{' '}
                    <span className="text-xs break-all">{manga.pkg}</span>
                  </p>
                  {manga.sources && manga.sources.length > 0 && (
                    <p>
                      <span className="font-medium">Sources:</span> {manga.sources.length}
                    </p>
                  )}
                </div>

                {/* Sources */}
                {manga.sources && manga.sources.length > 0 && (
                  <div className="border-t border-gray-700 pt-4 mb-4">
                    <p className="text-sm font-medium mb-2">Available Sources:</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {manga.sources.map((source, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="text-white font-medium">{source.name}</p>
                          {source.baseUrl && (
                            <button
                              onClick={() => window.open(source.baseUrl.split('#')[0], '_blank')}
                              className="text-purple-400 hover:text-purple-300 text-xs break-all hover:underline flex items-center gap-1 mt-1"
                            >
                              <FaExternalLinkAlt className="w-3 h-3" />
                              {source.baseUrl.split('#')[0]}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <a
                    href={`https://raw.githubusercontent.com/keiyoushi/extensions/repo/apk/${manga.apk}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-center font-medium transition-all duration-300"
                  >
                    <FaDownload className="w-4 h-4" />
                    Download APK
                  </a>

                  {manga.sources && manga.sources.length > 0 && manga.sources[0].baseUrl && (
                    <a
                      href={manga.sources[0].baseUrl.split('#')[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-center font-medium transition-all duration-300"
                    >
                      <FaExternalLinkAlt className="w-4 h-4" />
                      Visit Source
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaExtensionsPage;
