// Encryption helpers for the locked Resource Hub data.
// Uses only the built-in Web Crypto API: a key is made from the passcode with
// PBKDF2-SHA256, and each data file is sealed with AES-GCM.
// This file has no page code, so the admin tools can reuse it.

export const FORMAT_VERSION = 1;
export const ITERATIONS = 310000;
const CHECK_TEXT = "A4 WAYPOINT hub key check";

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toBase64(bytes) {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i]);
  return btoa(binary);
}

export function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** Makes an AES-GCM key from a passcode and the salt in the lock file. */
export async function deriveKey(passcode, salt, iterations = ITERATIONS) {
  const material = await crypto.subtle.importKey("raw", enc.encode(passcode), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKey(key) {
  return toBase64(await crypto.subtle.exportKey("raw", key));
}

export async function importKey(base64) {
  return crypto.subtle.importKey("raw", fromBase64(base64), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

async function sealText(text, key) {
  const iv = randomBytes(12);
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  return { iv: toBase64(iv), data: toBase64(data) };
}

async function openText(sealed, key) {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(sealed.iv) }, key, fromBase64(sealed.data));
  return dec.decode(plain);
}

/** Creates a new lock file for a passcode. Returns { lock, key }. */
export async function createLock(passcode) {
  const salt = randomBytes(16);
  const key = await deriveKey(passcode, salt);
  const check = await sealText(CHECK_TEXT, key);
  const lock = {
    _about: "Lock file for the Resource Hub. It holds no data and no passcode. Replace it only with the admin page.",
    v: FORMAT_VERSION,
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: toBase64(salt),
    check
  };
  return { lock, key };
}

/** Returns the key when the passcode is right, or null when it is wrong. */
export async function keyFromPasscode(passcode, lock) {
  const key = await deriveKey(passcode, fromBase64(lock.salt), lock.iterations || ITERATIONS);
  return (await keyMatchesLock(key, lock)) ? key : null;
}

export async function keyMatchesLock(key, lock) {
  try {
    return (await openText(lock.check, key)) === CHECK_TEXT;
  } catch {
    return false;
  }
}

/** Encrypts a data object into the published *.enc.json format. */
export async function encryptData(value, key, name = "") {
  const sealed = await sealText(JSON.stringify(value), key);
  return {
    _about: `Encrypted Resource Hub data${name ? ` (${name})` : ""}. Edit it with the admin page, not by hand.`,
    v: FORMAT_VERSION,
    ...sealed
  };
}

/** Decrypts a published *.enc.json object back into data. */
export async function decryptData(file, key) {
  return JSON.parse(await openText(file, key));
}
