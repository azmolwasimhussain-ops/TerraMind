import { OutdoorMission } from '../types/mission';
import { JournalEntry } from '../types/journal';
import { AppSettings, DEFAULT_SETTINGS, getDefaultSettings } from '../types/settings';

const DB_NAME = 'TerraMindDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

// In-memory fallback in case IndexedDB is restricted by sandbox/iframe
const memoryStore = {
  missions: new Map<string, OutdoorMission>(),
  journal: new Map<string, JournalEntry>(),
  settings: getDefaultSettings(),
};

function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB;
}

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Missions store
        if (!db.objectStoreNames.contains('missions')) {
          const missionStore = db.createObjectStore('missions', { keyPath: 'id' });
          missionStore.createIndex('status', 'status', { unique: false });
          missionStore.createIndex('createdAt', 'createdAt', { unique: false });
          missionStore.createIndex('completedAt', 'completedAt', { unique: false });
        }

        // Journal store
        if (!db.objectStoreNames.contains('journal')) {
          const journalStore = db.createObjectStore('journal', { keyPath: 'id' });
          journalStore.createIndex('createdAt', 'createdAt', { unique: false });
          journalStore.createIndex('missionId', 'missionId', { unique: false });
          journalStore.createIndex('mood', 'mood', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          dbPromise = null;
        };
        db.onerror = (e) => {
          console.error('IndexedDB general error:', e);
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error('Failed to open TerraMind IndexedDB'));
      };

      request.onblocked = () => {
        console.warn('TerraMind IndexedDB open request blocked by another tab');
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });

  return dbPromise;
}

// ----------------- MISSION OPERATIONS -----------------

export async function saveMission(mission: OutdoorMission): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('missions', 'readwrite');
      const store = tx.objectStore('missions');
      const req = store.put(mission);
      req.onsuccess = () => {
        memoryStore.missions.set(mission.id, mission);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Using memory fallback for saveMission:', err);
    memoryStore.missions.set(mission.id, mission);
  }
}

export async function getMission(id: string): Promise<OutdoorMission | undefined> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('missions', 'readonly');
      const store = tx.objectStore('missions');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || memoryStore.missions.get(id));
      req.onerror = () => resolve(memoryStore.missions.get(id));
    });
  } catch {
    return memoryStore.missions.get(id);
  }
}

export async function getAllMissions(): Promise<OutdoorMission[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('missions', 'readonly');
      const store = tx.objectStore('missions');
      const req = store.getAll();
      req.onsuccess = () => {
        const missions: OutdoorMission[] = req.result || [];
        missions.forEach((m) => memoryStore.missions.set(m.id, m));
        missions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(missions);
      };
      req.onerror = () => {
        const fallback = Array.from(memoryStore.missions.values());
        fallback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(fallback);
      };
    });
  } catch {
    const fallback = Array.from(memoryStore.missions.values());
    fallback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return fallback;
  }
}

export async function updateMissionStatus(
  id: string,
  status: OutdoorMission['status'],
  completedAt?: string
): Promise<OutdoorMission | undefined> {
  const existing = await getMission(id);
  if (!existing) return undefined;

  const updated: OutdoorMission = {
    ...existing,
    status,
    completedAt: status === 'completed' ? completedAt || new Date().toISOString() : existing.completedAt,
    startedAt: status === 'in_progress' && !existing.startedAt ? new Date().toISOString() : existing.startedAt,
  };

  await saveMission(updated);
  return updated;
}

export async function toggleChecklistItem(
  missionId: string,
  itemId: string,
  completed: boolean
): Promise<OutdoorMission | undefined> {
  const existing = await getMission(missionId);
  if (!existing) return undefined;

  const updatedChecklist = existing.checklist.map((item) =>
    item.id === itemId ? { ...item, completed } : item
  );

  const updated: OutdoorMission = {
    ...existing,
    checklist: updatedChecklist,
    status: existing.status === 'not_started' && completed ? 'in_progress' : existing.status,
    startedAt: existing.status === 'not_started' && completed && !existing.startedAt ? new Date().toISOString() : existing.startedAt,
  };

  await saveMission(updated);
  return updated;
}

export async function deleteMission(id: string): Promise<void> {
  memoryStore.missions.delete(id);
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('missions', 'readwrite');
      const store = tx.objectStore('missions');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Memory store already updated
  }
}

// ----------------- JOURNAL OPERATIONS -----------------

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  memoryStore.journal.set(entry.id, entry);
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('journal', 'readwrite');
      const store = tx.objectStore('journal');
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Using memory fallback for saveJournalEntry:', err);
  }
}

export async function getJournalEntry(id: string): Promise<JournalEntry | undefined> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('journal', 'readonly');
      const store = tx.objectStore('journal');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || memoryStore.journal.get(id));
      req.onerror = () => resolve(memoryStore.journal.get(id));
    });
  } catch {
    return memoryStore.journal.get(id);
  }
}

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('journal', 'readonly');
      const store = tx.objectStore('journal');
      const req = store.getAll();
      req.onsuccess = () => {
        const entries: JournalEntry[] = req.result || [];
        entries.forEach((e) => memoryStore.journal.set(e.id, e));
        entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(entries);
      };
      req.onerror = () => {
        const fallback = Array.from(memoryStore.journal.values());
        fallback.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(fallback);
      };
    });
  } catch {
    const fallback = Array.from(memoryStore.journal.values());
    fallback.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return fallback;
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  memoryStore.journal.delete(id);
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('journal', 'readwrite');
      const store = tx.objectStore('journal');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Memory store already updated
  }
}

// ----------------- SETTINGS OPERATIONS -----------------

export async function saveSettings(settings: AppSettings): Promise<void> {
  memoryStore.settings = { ...settings };
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ key: 'user_settings', value: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Using memory fallback for saveSettings:', err);
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('user_settings');
      req.onsuccess = () => {
        const defaults = getDefaultSettings();
        if (req.result && req.result.value) {
          const merged = { ...defaults, ...req.result.value };
          memoryStore.settings = merged;
          resolve(merged);
        } else {
          resolve(memoryStore.settings || defaults);
        }
      };
      req.onerror = () => resolve(memoryStore.settings || getDefaultSettings());
    });
  } catch {
    return memoryStore.settings || getDefaultSettings();
  }
}

// ----------------- BULK & DATA MGMT -----------------

export async function exportAllData(): Promise<{
  missions: OutdoorMission[];
  journal: JournalEntry[];
  settings: AppSettings;
  exportedAt: string;
}> {
  const [missions, journal, settings] = await Promise.all([
    getAllMissions(),
    getAllJournalEntries(),
    getSettings(),
  ]);

  return {
    missions,
    journal,
    settings,
    exportedAt: new Date().toISOString(),
  };
}

export async function clearAllData(): Promise<void> {
  memoryStore.missions.clear();
  memoryStore.journal.clear();
  memoryStore.settings = { ...DEFAULT_SETTINGS };

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['missions', 'journal', 'settings'], 'readwrite');
      tx.objectStore('missions').clear();
      tx.objectStore('journal').clear();
      tx.objectStore('settings').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    // Safely close connection
    db.close();
    dbPromise = null;
  } catch (err) {
    console.warn('IndexedDB clear warning:', err);
    dbPromise = null;
  }
}
