import React, { useEffect, useMemo, useState } from 'react';
import { Banner } from '../components/Banner';
import { Row } from '../components/Row';
import { SupportCard } from '../components/SupportCard';
import { ProfileSwitcher } from '../components/ProfileSwitcher.jsx';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useDownloadManager, DOWNLOAD_STATUS } from '../hooks/useDownloadManager';
import { useMyList } from '../hooks/useMyList';
import { useProfile } from '../context/ProfileContext.jsx';
import { API_ENDPOINTS } from '../config';
import { fetchData } from '../utils/fetchData';
import { FaBolt, FaFire, FaLaugh, FaPlayCircle, FaStar, FaChild } from 'react-icons/fa';

const CHIP_OPTIONS = [
  { id: 'all', label: 'All', icon: FaPlayCircle },
  { id: 'action', label: 'Action', icon: FaFire },
  { id: 'comedy', label: 'Comedy', icon: FaLaugh },
  { id: 'tagalog', label: 'Tagalog Dubbed', icon: FaChild },
];

const ACTION_GENRE_IDS = new Set([28, 12, 878, 53]);
const COMEDY_GENRE_IDS = new Set([35]);

const mergeAndSort = (movieResults = [], tvResults = []) =>
  [...movieResults, ...tvResults]
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex(candidate => candidate.id === item.id) === index)
    .sort((a, b) => {
      const aDate = new Date(a.release_date || a.first_air_date || 0).getTime();
      const bDate = new Date(b.release_date || b.first_air_date || 0).getTime();
      return bDate - aDate;
    });

const isKidsSafe = item => !item?.adult;

const matchesChip = (item, chipId) => {
  if (chipId === 'all') return true;
  if (chipId === 'action') {
    return (item.genre_ids || []).some(id => ACTION_GENRE_IDS.has(id));
  }
  if (chipId === 'comedy') {
    return (item.genre_ids || []).some(id => COMEDY_GENRE_IDS.has(id));
  }
  if (chipId === 'tagalog') {
    return ['tl', 'fil', 'tag', 'ceb'].includes(String(item.original_language || '').toLowerCase());
  }
  return true;
};

const useCollection = (loader, deps = []) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loader()
      .then(next => {
        if (!mounted) return;
        setItems(next || []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { items, loading };
};

export const HomePage = ({ onOpenModal, isWatched }) => {
  const { continueWatchingList, loading: continueLoading } = useContinueWatching();
  const { myList, loading: myListLoading } = useMyList();
  const { downloads } = useDownloadManager();
  const { activeProfile } = useProfile();
  const [activeChip, setActiveChip] = useState('all');
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' && navigator.onLine === false
  );

  useEffect(() => {
    const updateNetworkState = () => {
      setIsOffline(typeof navigator !== 'undefined' && navigator.onLine === false);
    };

    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);
    updateNetworkState();

    return () => {
      window.removeEventListener('online', updateNetworkState);
      window.removeEventListener('offline', updateNetworkState);
    };
  }, []);

  const { items: trending, loading: trendingLoading } = useCollection(async () => {
    const data = await fetchData(API_ENDPOINTS.trending);
    return (data.results || []).filter(item => item.backdrop_path);
  }, []);

  const { items: pinoyFavorites, loading: pinoyLoading } = useCollection(async () => {
    const [movies, tv] = await Promise.all([
      fetchData(
        API_ENDPOINTS.discoverMovies({
          with_origin_country: 'PH',
          sort_by: 'popularity.desc',
          include_adult: false,
        })
      ),
      fetchData(
        API_ENDPOINTS.discoverTv({
          with_origin_country: 'PH',
          sort_by: 'popularity.desc',
          include_adult: false,
        })
      ),
    ]);

    return mergeAndSort(movies.results || [], tv.results || [])
      .filter(item => item.poster_path || item.backdrop_path)
      .slice(0, 20);
  }, []);

  const { items: kDrama, loading: kDramaLoading } = useCollection(async () => {
    const [movies, tv] = await Promise.all([
      fetchData(
        API_ENDPOINTS.discoverMovies({
          with_original_language: 'ko',
          sort_by: 'popularity.desc',
          include_adult: false,
        })
      ),
      fetchData(
        API_ENDPOINTS.discoverTv({
          with_original_language: 'ko',
          sort_by: 'popularity.desc',
          include_adult: false,
        })
      ),
    ]);

    return mergeAndSort(movies.results || [], tv.results || [])
      .filter(item => item.poster_path || item.backdrop_path)
      .slice(0, 20);
  }, []);

  const { items: recentlyAdded, loading: recentlyLoading } = useCollection(async () => {
    const [movies, tv] = await Promise.all([
      fetchData(
        API_ENDPOINTS.discoverMovies({
          sort_by: 'release_date.desc',
          'release_date.lte': new Date().toISOString().split('T')[0],
          include_adult: false,
        })
      ),
      fetchData(
        API_ENDPOINTS.discoverTv({
          sort_by: 'first_air_date.desc',
          'first_air_date.lte': new Date().toISOString().split('T')[0],
          include_adult: false,
        })
      ),
    ]);

    return mergeAndSort(movies.results || [], tv.results || [])
      .filter(item => item.poster_path || item.backdrop_path)
      .slice(0, 20);
  }, []);

  const filteredTrending = useMemo(
    () =>
      trending
        .filter(item => isKidsSafe(item))
        .filter(item => matchesChip(item, activeChip))
        .slice(0, 20),
    [trending, activeChip]
  );

  const filteredPinoy = useMemo(
    () =>
      pinoyFavorites
        .filter(item => isKidsSafe(item))
        .filter(item => matchesChip(item, activeChip))
        .slice(0, 20),
    [pinoyFavorites, activeChip]
  );

  const filteredKDrama = useMemo(
    () =>
      kDrama
        .filter(item => isKidsSafe(item))
        .filter(item => matchesChip(item, activeChip))
        .slice(0, 20),
    [kDrama, activeChip]
  );

  const filteredRecent = useMemo(
    () =>
      recentlyAdded
        .filter(item => isKidsSafe(item))
        .filter(item => matchesChip(item, activeChip))
        .slice(0, 20),
    [recentlyAdded, activeChip]
  );

  const top10 = useMemo(
    () => filteredTrending.slice(0, 10).map((item, index) => ({ ...item, rank: index + 1 })),
    [filteredTrending]
  );

  const safeContinueWatching = useMemo(
    () =>
      continueWatchingList
        .filter(item => isKidsSafe(item))
        .filter(item => matchesChip(item, activeChip)),
    [continueWatchingList, activeChip]
  );

  const offlineDownloads = useMemo(
    () =>
      downloads
        .filter(download => download.status === DOWNLOAD_STATUS.COMPLETED)
        .map(download => ({
          id: download.itemId,
          title: download.title,
          name: download.title,
          poster_path: download.poster,
          backdrop_path: download.backdrop,
          overview: download.overview,
          media_type: download.mediaType,
          downloadStatus: download.status,
          quality: download.quality,
          source: 'offline',
        }))
        .filter(item => item.poster_path || item.backdrop_path)
        .reverse(),
    [downloads]
  );

  return (
    <div className="flex flex-col">
      <Banner onOpenModal={onOpenModal} />

      <div className="relative -mt-12 px-4 sm:px-8 md:px-16 pb-4">
        <div className="glass-card border border-white/10 bg-black/35 p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/60">
                <FaBolt className="text-red-500" />
                NikzFlix TV
              </div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Welcome back{activeProfile ? `, ${activeProfile.name}` : ''}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-white/65">
                Pick a profile, jump into the latest rows, and keep your watch history separated by
                viewer.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ProfileSwitcher />
              {activeProfile?.isKids && (
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300">
                  Kids mode is active
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {CHIP_OPTIONS.map(chip => {
              const Icon = chip.icon;
              const active = activeChip === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveChip(chip.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-red-500 bg-red-500/15 text-white shadow-[0_0_24px_rgba(228,9,20,0.2)]'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={active ? 'text-red-400' : 'text-white/50'} />
                  {chip.label}
                </button>
              );
            })}
          </div>

          {activeProfile?.isKids && (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Kids profile filtering is on. Mature titles and Live TV stay hidden for this profile.
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0b0b0b] text-white min-h-screen">
        <div className="px-4 sm:px-8 md:px-16 pb-20">
          <main>
            {(safeContinueWatching.length > 0 || continueLoading) && (
              <Row
                id="continue-watching"
                title="Continue Watching"
                items={safeContinueWatching}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
                isLoading={continueLoading}
              />
            )}

            <Row
              id="trending-now"
              title="Trending Now"
              items={filteredTrending}
              onOpenModal={onOpenModal}
              isWatched={isWatched}
              isLoading={trendingLoading}
            />

            <Row
              id="top-10-today"
              title="Top 10 Today"
              items={top10}
              onOpenModal={onOpenModal}
              isWatched={isWatched}
              isLoading={trendingLoading}
              showRankNumbers
            />

            <Row
              id="pinoy-favorites"
              title="Pinoy Favorites"
              items={filteredPinoy}
              onOpenModal={onOpenModal}
              isWatched={isWatched}
              isLoading={pinoyLoading}
            />

            <Row
              id="kdrama"
              title="KDrama"
              items={filteredKDrama}
              onOpenModal={onOpenModal}
              isWatched={isWatched}
              isLoading={kDramaLoading}
            />

            <Row
              id="anime"
              title="Anime"
              endpoint={API_ENDPOINTS.anime}
              onOpenModal={onOpenModal}
              isWatched={isWatched}
              isLarge
            />

            <Row
              id="recently-added"
              title="Recently Added"
              items={filteredRecent}
              onOpenModal={onOpenModal}
              isWatched={isWatched}
              isLoading={recentlyLoading}
            />

            {(myList.length > 0 || myListLoading) && (
              <Row
                id="my-list"
                title="My List"
                items={myList
                  .filter(item => isKidsSafe(item))
                  .filter(item => matchesChip(item, activeChip))}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
                isLoading={myListLoading}
              />
            )}

            {isOffline && offlineDownloads.length > 0 && (
              <Row
                id="offline-downloads"
                title="Offline Downloads"
                items={offlineDownloads}
                onOpenModal={onOpenModal}
                isWatched={isWatched}
              />
            )}

            <div className="mt-6">
              <SupportCard />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
