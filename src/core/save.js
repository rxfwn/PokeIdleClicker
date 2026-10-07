import { state, replaceState } from "./state.js";

const KEY = "pokeclicker-save-v1";

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) replaceState(JSON.parse(raw));
  } catch {}
}

export function reset() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  location.reload();
}
