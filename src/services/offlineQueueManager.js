/**
 * offlineQueueManager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Persistent offline queue backed by IndexedDB (primary) with localStorage
 * fallback. Stores pending mutations so they survive page refreshes and
 * browser restarts.
 *
 * Supported modules: patients | prescriptions | billing | staff
 *
 * Queue item shape:
 *   {
 *     id          : string   (uuidv4)
 *     module      : 'patients' | 'prescriptions' | 'billing' | 'staff'
 *     type        : 'create' | 'update' | 'delete' | 'updateStatus'
 *     payload     : object   (raw action payload)
 *     timestamp   : number   (Date.now())
 *     retries     : number   (0–MAX_RETRIES)
 *     status      : 'pending' | 'processing' | 'success' | 'failed'
 *     errorMessage: string | null
 *   }
 *
 * Usage:
 *   import qm from './offlineQueueManager';
 *   await qm.enqueue({ module, type, payload });
 *   const items = await qm.getAll();
 *   await qm.updateItem(id, { retries: 1, status: 'failed' });
 *   await qm.dequeue(id);
 *   await qm.clear();
 */

const DB_NAME    = 'ehr_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_queue';
const LS_KEY     = 'ehr_offline_queue_fallback';

// ── IndexedDB helpers ────────────────────────────────────────────────────────

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) { resolve(_db); return; }

    if (!window.indexedDB) { resolve(null); return; }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db    = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('module',    'module',    { unique: false });
        store.createIndex('status',    'status',    { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = (e) => {
      console.warn('[offlineQueueManager] IndexedDB open failed:', e.target.error);
      resolve(null); // fall back to localStorage
    };
  });
}

function idbTransaction(mode) {
  return _db
    ? _db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
    : null;
}

function idbPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// ── localStorage fallback ────────────────────────────────────────────────────

const lsFallback = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch { return []; }
  },
  save(items) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
  },
  enqueue(item) {
    const items = this.getAll();
    items.push(item);
    this.save(items);
  },
  dequeue(id) {
    const items = this.getAll().filter((i) => i.id !== id);
    this.save(items);
  },
  update(id, patch) {
    const items = this.getAll().map((i) => i.id === id ? { ...i, ...patch } : i);
    this.save(items);
  },
  clear(module = null) {
    if (module) {
      const items = this.getAll().filter((i) => i.module !== module);
      this.save(items);
    } else {
      localStorage.removeItem(LS_KEY);
    }
  },
};

// ── Public API ───────────────────────────────────────────────────────────────

const queueManager = {

  /**
   * Initialise (call once on app start or first use).
   */
  async init() {
    await openDB();
  },

  /**
   * Add an item to the queue.
   * @param {{ module, type, payload, id? }} item
   * @returns {string} generated id
   */
  async enqueue(item) {
    const entry = {
      id:           item.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      module:       item.module,
      type:         item.type,
      payload:      item.payload,
      timestamp:    Date.now(),
      retries:      0,
      status:       'pending',
      errorMessage: null,
    };

    const db = await openDB();
    if (db) {
      const store = idbTransaction('readwrite');
      await idbPromise(store.add(entry));
    } else {
      lsFallback.enqueue(entry);
    }

    return entry.id;
  },

  /**
   * Remove an item from the queue by id.
   */
  async dequeue(id) {
    const db = await openDB();
    if (db) {
      const store = idbTransaction('readwrite');
      await idbPromise(store.delete(id));
    } else {
      lsFallback.dequeue(id);
    }
  },

  /**
   * Update a queue item's fields (status, retries, errorMessage, etc.).
   */
  async updateItem(id, patch) {
    const db = await openDB();
    if (db) {
      const store   = idbTransaction('readwrite');
      const current = await idbPromise(store.get(id));
      if (current) {
        await idbPromise(idbTransaction('readwrite').put({ ...current, ...patch }));
      }
    } else {
      lsFallback.update(id, patch);
    }
  },

  /**
   * Get all items (optionally filter by module or status).
   * @param {{ module?, status? }} filter
   */
  async getAll(filter = {}) {
    const db = await openDB();

    let items;
    if (db) {
      const store = idbTransaction('readonly');
      items = await idbPromise(store.getAll());
    } else {
      items = lsFallback.getAll();
    }

    if (filter.module) items = items.filter((i) => i.module === filter.module);
    if (filter.status) items = items.filter((i) => i.status === filter.status);

    // Sort by timestamp ascending (FIFO)
    return items.sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * Get count of pending items (optionally by module).
   */
  async countPending(module = null) {
    const filter = { status: 'pending' };
    if (module) filter.module = module;
    const items = await this.getAll(filter);
    return items.length;
  },

  /**
   * Sync the queue into Redux state (for selectors / UI).
   * Returns the full queue as an array.
   */
  async syncToRedux() {
    return this.getAll();
  },

  /**
   * Remove all items (or just for a specific module).
   */
  async clear(module = null) {
    const db = await openDB();
    if (db) {
      if (module) {
        const items = await this.getAll();
        const tx    = _db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await Promise.all(
          items.filter((i) => i.module === module).map((i) => idbPromise(store.delete(i.id)))
        );
      } else {
        const store = idbTransaction('readwrite');
        await idbPromise(store.clear());
      }
    } else {
      lsFallback.clear(module);
    }
  },
};

export default queueManager;