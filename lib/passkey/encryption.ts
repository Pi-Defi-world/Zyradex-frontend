const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

export const generateKey = async (): Promise<CryptoKey> => {
  return crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

export const deriveKeyFromPasskey = async (
  passkeyCredential: ArrayBuffer
): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passkeyCredential,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptSecret = async (
  secret: string,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string }> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);

  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    data
  );

  const encryptedBase64 = btoa(
    String.fromCharCode(...new Uint8Array(encrypted))
  );
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    encrypted: encryptedBase64,
    iv: ivBase64,
  };
};

export const decryptSecret = async (
  encryptedBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> => {
  const encrypted = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0)
  );
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

export const importKeyFromRaw = async (rawKey: ArrayBuffer): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

export const exportKey = async (key: CryptoKey): Promise<ArrayBuffer> => {
  return crypto.subtle.exportKey('raw', key);
};

