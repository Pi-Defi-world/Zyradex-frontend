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

/**
 * Check if IndexedDB is available in this browser
 */
export const isIndexedDBAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return 'indexedDB' in window && indexedDB !== null && indexedDB !== undefined;
  } catch {
    return false;
  }
};

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available in this browser. Please use a modern browser that supports IndexedDB.'));
      return;
    }

    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('IndexedDB open error:', error);
      reject(new Error(`Failed to open IndexedDB: ${error?.message || 'Unknown error'}`));
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
    if (!isIndexedDBAvailable()) {
      throw new Error('IndexedDB is not available. Please use a browser that supports IndexedDB.');
    }

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
      let resolved = false;
      
      // Listen to transaction errors first (they can abort the whole transaction)
      transaction.onerror = (event) => {
        if (resolved) return;
        resolved = true;
        const error = (event.target as IDBTransaction).error;
        console.error('❌ Transaction error while storing:', error);
        reject(new Error(`Transaction failed: ${error?.message || 'Unknown error'}`));
      };
      
      transaction.onabort = () => {
        if (resolved) return;
        resolved = true;
        console.error('❌ Transaction aborted while storing');
        reject(new Error('Transaction was aborted. Please try again.'));
      };
      
      transaction.oncomplete = () => {
        if (resolved) return;
        resolved = true;
        console.log('✅ Transaction completed - encrypted secret stored for:', publicKey);
        resolve();
      };
      
      const request = store.put(data);
      request.onsuccess = () => {
        // Don't resolve here - wait for transaction.oncomplete
        // This ensures the transaction is fully committed
        console.log('✅ Put request succeeded, waiting for transaction to complete...');
      };
      request.onerror = (event) => {
        if (resolved) return;
        resolved = true;
        const error = (event.target as IDBRequest).error;
        console.error('❌ Failed to store encrypted secret:', error);
        reject(new Error(`Failed to store encrypted secret: ${error?.message || 'Unknown error'}`));
      };
    });
  } catch (error) {
    console.error('❌ Error storing encrypted secret:', error);
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

