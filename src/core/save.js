import { state, replaceState } from "./state.js";

const KEY = "pokeclicker-save-v2";
let resetting = false; // évite que la sauvegarde de fermeture recrée la partie effacée

export function save() {
  if (resetting) return;
  try {
    state.lastSeen = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

// Retourne le temps écoulé depuis la dernière sauvegarde (ms), ou 0 s'il n'y en a pas.
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw);
    replaceState(saved);
    return saved.lastSeen ? Math.max(0, Date.now() - saved.lastSeen) : 0;
  } catch {
    return 0;
  }
}

export function reset() {
  resetting = true;
  try {
    localStorage.removeItem(KEY);
  } catch {}
  location.reload();
}
