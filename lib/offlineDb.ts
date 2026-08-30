import { Musica } from '@/types';

const DB_NAME = 'BibliotecaMusical';
const STORE_NAME = 'musicas';

export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      if (db.objectStoreNames.contains(STORE_NAME)) {
        resolve(db);
        return;
      }

      const nextVersion = db.version + 1;
      db.close();

      const upgradeRequest = indexedDB.open(DB_NAME, nextVersion);
      upgradeRequest.onupgradeneeded = () => {
        const upgradeDb = upgradeRequest.result;
        if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
          upgradeDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
      upgradeRequest.onerror = () => reject(upgradeRequest.error);
    };
  });
}

export async function listOfflineMusicas(): Promise<Musica[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const records = (request.result || []) as Array<{ metadata: Musica }>;
      resolve(records.map((record) => record.metadata).filter(Boolean));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearOfflineStore() {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  localStorage.removeItem('offlineMusicas');
}
