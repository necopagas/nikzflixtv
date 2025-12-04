// src/utils/indexedDB.js

/**
 * IndexedDB wrapper for offline data storage
 */
class IndexedDBManager {
  constructor(dbName = 'NikzFlixDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('movies')) {
          const moviesStore = db.createObjectStore('movies', { keyPath: 'id' });
          moviesStore.createIndex('title', 'title', { unique: false });
          moviesStore.createIndex('addedAt', 'addedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('channels')) {
          const channelsStore = db.createObjectStore('channels', { keyPath: 'id' });
          channelsStore.createIndex('name', 'name', { unique: false });
          channelsStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('watchProgress')) {
          const progressStore = db.createObjectStore('watchProgress', { keyPath: 'itemId' });
          progressStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  async add(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.add({ ...data, addedAt: Date.now() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache helpers
  async setCache(key, value, ttl = 3600000) {
    const expiry = Date.now() + ttl;
    return this.update('cache', { key, value, expiry });
  }

  async getCache(key) {
    const cached = await this.get('cache', key);
    if (!cached) return null;

    // Check if expired
    if (cached.expiry < Date.now()) {
      await this.delete('cache', key);
      return null;
    }

    return cached.value;
  }

  async clearExpiredCache() {
    const all = await this.getAll('cache');
    const now = Date.now();

    for (const item of all) {
      if (item.expiry < now) {
        await this.delete('cache', item.key);
      }
    }
  }
}

// Export singleton instance
export const db = new IndexedDBManager();
