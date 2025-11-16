const CONTINUE_KEY = 'tachiyomi_continue_list';
const QUEUE_KEY = 'tachiyomi_download_queue';
const MAX_CONTINUE = 6;

const dispatchSync = () => {
  window.dispatchEvent(new Event('tachiyomi-storage')); // simple custom event
};

const readList = key => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error reading ${key} from storage`, error);
    return [];
  }
};

const writeList = (key, list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
    dispatchSync();
  } catch (error) {
    console.error(`Error writing ${key} to storage`, error);
  }
};

export const getContinueList = () => readList(CONTINUE_KEY);
export const getDownloadQueue = () => readList(QUEUE_KEY);

export const addOrUpdateContinueEntry = entry => {
  const list = readList(CONTINUE_KEY);
  const filtered = list.filter(item => item.mangaId !== entry.mangaId);
  const next = [
    {
      ...entry,
      updatedAt: new Date().toISOString(),
    },
    ...filtered,
  ];
  writeList(CONTINUE_KEY, next.slice(0, MAX_CONTINUE));
};

export const removeContinueEntry = mangaId => {
  const list = readList(CONTINUE_KEY);
  const next = list.filter(item => item.mangaId !== mangaId);
  writeList(CONTINUE_KEY, next);
};

export const addChapterToQueue = entry => {
  const list = readList(QUEUE_KEY);
  const exists = list.find(
    item => item.chapterId === entry.chapterId && item.mangaId === entry.mangaId
  );
  if (exists) {
    return list;
  }
  const next = [entry, ...list.slice(0, 9)];
  writeList(QUEUE_KEY, next);
  return next;
};

export const removeQueueEntry = chapterId => {
  const list = readList(QUEUE_KEY);
  const next = list.filter(item => item.chapterId !== chapterId);
  writeList(QUEUE_KEY, next);
  return next;
};
