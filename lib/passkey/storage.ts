const DB_NAME = 'PasskeyStorage';
const DB_VERSION = 2; // Incremented to add salt and attempt tracking
const STORE_NAME = 'encryptedSecrets';
const ATTEMPTS_STORE_NAME = 'passwordAttempts';

interface EncryptedSecret {
  publicKey: string;
  encryptedSecret: string;
  iv: string;
  salt: string; // Base64 encoded salt for password-based key derivation
  createdAt: number;
}

interface PasswordAttempts {
  publicKey: string;
  attempts: number;
  lockedUntil?: number; // Timestamp when lock expires (optional, for future use)
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
      
      // Create encrypted secrets store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'publicKey' });
        objectStore.createIndex('publicKey', 'publicKey', { unique: true });
      } else {
        // Upgrade existing store to add salt field
        const objectStore = (event.target as IDBOpenDBRequest).transaction?.objectStore(STORE_NAME);
        if (objectStore && !objectStore.indexNames.contains('publicKey')) {
          objectStore.createIndex('publicKey', 'publicKey', { unique: true });
        }
      }
      
      // Create password attempts store if it doesn't exist
      if (!database.objectStoreNames.contains(ATTEMPTS_STORE_NAME)) {
        const attemptsStore = database.createObjectStore(ATTEMPTS_STORE_NAME, { keyPath: 'publicKey' });
        attemptsStore.createIndex('publicKey', 'publicKey', { unique: true });
      }
    };
  });
};

export const storeEncryptedSecret = async (
  publicKey: string,
  encryptedSecret: string,
  iv: string,
  salt: string
): Promise<void> => {
  try {
    const database = await openDatabase();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const data: EncryptedSecret = {
      publicKey,
      encryptedSecret,
      iv,
      salt,
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
): Promise<{ encryptedSecret: string; iv: string; salt: string } | null> => {
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
            salt: result.salt || '', // Fallback for old records without salt
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

// Password attempt tracking functions

export const storePasswordAttempts = async (
  publicKey: string,
  attempts: number
): Promise<void> => {
  try {
    const database = await openDatabase();
    const transaction = database.transaction([ATTEMPTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(ATTEMPTS_STORE_NAME);

    const data: PasswordAttempts = {
      publicKey,
      attempts,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store password attempts'));
    });
  } catch (error) {
    console.error('Error storing password attempts:', error);
    throw error;
  }
};

export const getPasswordAttempts = async (publicKey: string): Promise<number> => {
  try {
    const database = await openDatabase();
    const transaction = database.transaction([ATTEMPTS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(ATTEMPTS_STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(publicKey);
      request.onsuccess = () => {
        const result = request.result as PasswordAttempts | undefined;
        resolve(result?.attempts || 0);
      };
      request.onerror = () => {
        reject(new Error('Failed to retrieve password attempts'));
      };
    });
  } catch (error) {
    console.error('Error retrieving password attempts:', error);
    return 0; // Return 0 on error to allow retry
  }
};

export const resetPasswordAttempts = async (publicKey: string): Promise<void> => {
  try {
    const database = await openDatabase();
    const transaction = database.transaction([ATTEMPTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(ATTEMPTS_STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(publicKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to reset password attempts'));
    });
  } catch (error) {
    console.error('Error resetting password attempts:', error);
    throw error;
  }
};

export const isAccountLocked = async (publicKey: string): Promise<boolean> => {
  const attempts = await getPasswordAttempts(publicKey);
  return attempts >= 5; // Lock after 5 failed attempts
};

