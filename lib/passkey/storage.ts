const DB_NAME = 'PasskeyStorage';
const DB_VERSION = 1;
const STORE_NAME = 'encryptedSecrets';

interface EncryptedSecret {
  publicKey: string;
  encryptedSecret: string;
  iv: string;
  createdAt: number;
}

let db: IDBDatabase | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'publicKey' });
        objectStore.createIndex('publicKey', 'publicKey', { unique: true });
      }
    };
  });
};

export const storeEncryptedSecret = async (
  publicKey: string,
  encryptedSecret: string,
  iv: string
): Promise<void> => {
  try {
    const database = await openDatabase();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const data: EncryptedSecret = {
      publicKey,
      encryptedSecret,
      iv,
      createdAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store encrypted secret'));
    });
  } catch (error) {
    console.error('Error storing encrypted secret:', error);
    throw error;
  }
};

export const getEncryptedSecret = async (
  publicKey: string
): Promise<{ encryptedSecret: string; iv: string } | null> => {
  try {
    const database = await openDatabase();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(publicKey);
      request.onsuccess = () => {
        const result = request.result as EncryptedSecret | undefined;
        if (result) {
          resolve({
            encryptedSecret: result.encryptedSecret,
            iv: result.iv,
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        reject(new Error('Failed to retrieve encrypted secret'));
      };
    });
  } catch (error) {
    console.error('Error retrieving encrypted secret:', error);
    throw error;
  }
};

export const deleteEncryptedSecret = async (publicKey: string): Promise<void> => {
  try {
    const database = await openDatabase();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(publicKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete encrypted secret'));
    });
  } catch (error) {
    console.error('Error deleting encrypted secret:', error);
    throw error;
  }
};

export const hasStoredSecret = async (publicKey: string): Promise<boolean> => {
  const secret = await getEncryptedSecret(publicKey);
  return secret !== null;
};

