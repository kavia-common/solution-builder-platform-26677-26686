/**
 * Safe JSON localStorage wrappers.
 */

const PREFIX = "sbp:wizard:v1:";

// PUBLIC_INTERFACE
export function storageKey(key) {
  /** Generate a namespaced localStorage key. */
  return `${PREFIX}${key}`;
}

// PUBLIC_INTERFACE
export function loadJSON(key, fallback) {
  /** Load JSON from localStorage with a fallback if missing/corrupt. */
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// PUBLIC_INTERFACE
export function saveJSON(key, value) {
  /** Save JSON to localStorage. */
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // ignore (quota, private mode, etc.)
  }
}

// PUBLIC_INTERFACE
export function clearWizardStorage() {
  /** Clear all wizard keys for this app version. */
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
