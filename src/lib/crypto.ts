// Web Crypto API helper functions for Zero-Knowledge Client-Side Encryption
// Uses AES-GCM 256-bit encryption. Keys are stored strictly on the client.

// Helper: Convert ArrayBuffer to Hex String
export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert Hex String to ArrayBuffer
export function hexToBuf(hex: string): ArrayBuffer {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Generate a random 256-bit AES-GCM key and return its Hex representation
export async function generateMasterKey(): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return bufToHex(exported);
}

// Derive a 256-bit key from a password and a salt using PBKDF2
export async function deriveKeyFromPassword(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey", "deriveBits"]
  );
  
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hexToBuf(saltHex),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  
  const exported = await window.crypto.subtle.exportKey("raw", derivedKey);
  return bufToHex(exported);
}

// Memory cache for imported CryptoKeys to optimize performance (E2EE acceleration)
const keyCache = new Map<string, any>();

async function getCachedCryptoKey(keyHex: string): Promise<any> {
  if (keyCache.has(keyHex)) {
    return keyCache.get(keyHex);
  }
  const keyBuffer = hexToBuf(keyHex);
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
  keyCache.set(keyHex, cryptoKey);
  return cryptoKey;
}

// Encrypt string data using the hex-encoded key
export async function encryptData(plaintext: string, keyHex: string): Promise<{ ciphertext: string; iv: string }> {
  const cryptoKey = await getCachedCryptoKey(keyHex);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is standard and recommended for GCM
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plaintext);
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    cryptoKey,
    encodedText
  );
  
  return {
    ciphertext: bufToHex(ciphertextBuffer),
    iv: bufToHex(iv.buffer),
  };
}

// Decrypt ciphertext using the hex-encoded key and IV
export async function decryptData(ciphertextHex: string, keyHex: string, ivHex: string): Promise<string> {
  const cryptoKey = await getCachedCryptoKey(keyHex);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: hexToBuf(ivHex),
    },
    cryptoKey,
    hexToBuf(ciphertextHex)
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Utility: Encrypt any JSON object
export async function encryptJSON(obj: any, keyHex: string): Promise<{ ciphertext: string; iv: string }> {
  const str = JSON.stringify(obj);
  return encryptData(str, keyHex);
}

// Utility: Decrypt to JSON object
export async function decryptJSON(ciphertextHex: string, keyHex: string, ivHex: string): Promise<any> {
  const decryptedStr = await decryptData(ciphertextHex, keyHex, ivHex);
  return JSON.parse(decryptedStr);
}

// File/Image helper: Convert File/Blob to Hex representation
export function fileToHex(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(bufToHex(reader.result));
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// File/Image helper: Convert Hex back to Blob
export function hexToBlob(hex: string, mimeType: string): Blob {
  const buffer = hexToBuf(hex);
  return new Blob([buffer], { type: mimeType });
}
