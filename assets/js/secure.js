// Passcode unlock for the Resource Hub: checks the passcode against the lock
// file, keeps the key for this browser session (or on this device when asked),
// and decrypts the hub data files.

import { keyFromPasscode, keyMatchesLock, exportKey, importKey, decryptData } from "./crypto-core.js";

const STORAGE_KEY = "a4wp:hub-key";

let lockCache;

async function fetchJSON(path) {
  let response;
  try {
    response = await fetch(path, { cache: "no-cache" });
  } catch {
    throw new Error("We could not reach the server. Check your connection and try again.");
  }
  if (!response.ok) throw new Error(`The file ${path} did not load (error ${response.status}).`);
  try {
    return await response.json();
  } catch {
    throw new Error(`The file ${path} has a formatting mistake.`);
  }
}

export function cryptoAvailable() {
  return Boolean(window.crypto && crypto.subtle);
}

export async function loadLock() {
  lockCache ??= await fetchJSON("data/hub.lock.json");
  return lockCache;
}

function readStored() {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const value = store.getItem(STORAGE_KEY);
      if (value) return value;
    } catch {
      /* storage blocked: treat as locked */
    }
  }
  return null;
}

export function forgetKey() {
  for (const store of [sessionStorage, localStorage]) {
    try {
      store.removeItem(STORAGE_KEY);
    } catch {
      /* nothing stored */
    }
  }
}

/** Returns the stored key if it still opens the current lock, else null. */
export async function storedKey() {
  const raw = readStored();
  if (!raw) return null;
  try {
    const key = await importKey(raw);
    if (await keyMatchesLock(key, await loadLock())) return key;
  } catch {
    /* bad stored value */
  }
  forgetKey();
  return null;
}

/** Checks the passcode. Returns the key, or null when the passcode is wrong. */
export async function unlock(passcode, remember) {
  const key = await keyFromPasscode(passcode, await loadLock());
  if (!key) return null;
  const raw = await exportKey(key);
  forgetKey();
  try {
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, raw);
  } catch {
    /* storage blocked: the hub still works until the page closes */
  }
  return key;
}

/** Loads and decrypts data/<name>.enc.json. */
export async function loadSecureData(name, key) {
  const file = await fetchJSON(`data/${name}.enc.json`);
  try {
    return await decryptData(file, key);
  } catch {
    throw new Error(`The file data/${name}.enc.json does not open with the current passcode. Ask the site admin to encrypt it again.`);
  }
}
