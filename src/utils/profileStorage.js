const PROFILES_KEY = 'nikz_profiles_v1';
const ACTIVE_PROFILE_KEY = 'nikz_active_profile_v1';
const UNLOCK_KEY = 'nikz_profile_unlock_v1';
export const DEFAULT_PARENT_PIN = '1234';

const LEGACY_KEYS = {
  myList: 'myNikzflixList',
  continueWatching: 'nikzflixContinueWatching',
  watchedHistory: 'nikzflixWatchedHistory',
  watchProgress: 'watchProgress',
};

const safeJsonParse = (value, fallback) => {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const safeJsonStringify = value => {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
};

const createId = prefix => {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '';
  return `${prefix}_${uuid || `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`}`;
};

export const getDefaultProfiles = () => [
  {
    id: 'profile-main',
    name: 'Nikz',
    avatar: 'N',
    accent: '#E50914',
    isKids: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'profile-family',
    name: 'Family',
    avatar: 'F',
    accent: '#7c3aed',
    isKids: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'profile-kids',
    name: 'Kids',
    avatar: 'K',
    accent: '#22c55e',
    isKids: true,
    createdAt: new Date().toISOString(),
  },
];

export const normalizeProfile = profile => ({
  id: profile?.id || createId('profile'),
  name: String(profile?.name || 'Profile').slice(0, 18),
  avatar: String(profile?.avatar || (profile?.name || 'P').charAt(0).toUpperCase()).slice(0, 2),
  accent: profile?.accent || '#E50914',
  isKids: Boolean(profile?.isKids),
  createdAt: profile?.createdAt || new Date().toISOString(),
});

export const loadProfiles = () => {
  const raw = safeJsonParse(localStorage.getItem(PROFILES_KEY), null);
  if (Array.isArray(raw) && raw.length) {
    return raw.slice(0, 5).map(normalizeProfile);
  }

  const defaults = getDefaultProfiles();
  localStorage.setItem(PROFILES_KEY, safeJsonStringify(defaults));
  if (!localStorage.getItem(ACTIVE_PROFILE_KEY)) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, defaults[0].id);
  }
  return defaults;
};

export const saveProfiles = profiles => {
  localStorage.setItem(PROFILES_KEY, safeJsonStringify(profiles.slice(0, 5).map(normalizeProfile)));
};

export const getActiveProfileId = profiles => {
  const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (stored && profiles.some(profile => profile.id === stored)) {
    return stored;
  }
  const fallback = profiles[0]?.id || null;
  if (fallback) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, fallback);
  }
  return fallback;
};

export const setActiveProfileId = profileId => {
  if (profileId) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }
};

export const getActiveUnlock = () => safeJsonParse(sessionStorage.getItem(UNLOCK_KEY), null);

export const setActiveUnlock = payload => {
  sessionStorage.setItem(UNLOCK_KEY, safeJsonStringify(payload));
};

export const clearActiveUnlock = () => {
  sessionStorage.removeItem(UNLOCK_KEY);
};

export const isActiveProfileUnlocked = profileId => {
  const unlock = getActiveUnlock();
  return Boolean(unlock && unlock.profileId === profileId && unlock.expiresAt > Date.now());
};

export const profileStorageKey = (baseKey, profileId) => `${baseKey}:${profileId || 'default'}`;

export const migrateLegacyStorageToProfile = profileId => {
  if (!profileId || typeof window === 'undefined') return;

  const mappings = [
    [LEGACY_KEYS.myList, profileStorageKey('myNikzflixList', profileId)],
    [LEGACY_KEYS.continueWatching, profileStorageKey('nikzflixContinueWatching', profileId)],
    [LEGACY_KEYS.watchedHistory, profileStorageKey('nikzflixWatchedHistory', profileId)],
    [LEGACY_KEYS.watchProgress, profileStorageKey('watchProgress', profileId)],
  ];

  mappings.forEach(([legacyKey, nextKey]) => {
    const legacyValue = localStorage.getItem(legacyKey);
    if (legacyValue && !localStorage.getItem(nextKey)) {
      localStorage.setItem(nextKey, legacyValue);
    }
  });
};

export const createProfile = ({ name, avatar, accent, isKids } = {}) =>
  normalizeProfile({
    name,
    avatar,
    accent,
    isKids,
    createdAt: new Date().toISOString(),
  });

export const readProfileScopedValue = (baseKey, profileId, fallback) => {
  const raw = localStorage.getItem(profileStorageKey(baseKey, profileId));
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const writeProfileScopedValue = (baseKey, profileId, value) => {
  localStorage.setItem(profileStorageKey(baseKey, profileId), safeJsonStringify(value));
};
