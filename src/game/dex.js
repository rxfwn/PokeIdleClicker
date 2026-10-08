// Pokédex : le seul module qui connaît le format des entrées de state.dex.
// Entrée : { vu, capture, vuShiny, captureShiny, nombreCaptures, premiereCapture, niveauMax }
// (les champs shiny sont prêts pour plus tard, rien ne les remplit encore).
import { state } from "../core/state.js";

const blank = () => ({ vu: false, capture: false, vuShiny: false, captureShiny: false, nombreCaptures: 0, premiereCapture: null, niveauMax: 0 });

export const entry = (id) => ({ ...blank(), ...state.dex[id] });
export const isSeen = (id) => !!state.dex[id]?.vu;
export const isCaught = (id) => !!state.dex[id]?.capture;

const touch = (id) => (state.dex[id] = { ...blank(), ...state.dex[id] });

export function markSeen(id, { shiny = false } = {}) {
  const e = touch(id);
  e.vu = true;
  if (shiny) e.vuShiny = true;
}

export function markCaught(id, level, { shiny = false } = {}) {
  const e = touch(id);
  e.vu = true;
  e.capture = true;
  e.nombreCaptures += 1;
  e.premiereCapture ??= Date.now();
  e.niveauMax = Math.max(e.niveauMax, level);
  if (shiny) {
    e.vuShiny = true;
    e.captureShiny = true;
  }
}

// Retient le plus haut niveau atteint par l'espèce.
export function raiseMaxLevel(id, level) {
  const e = state.dex[id];
  if (e && level > e.niveauMax) e.niveauMax = level;
}

// Compteurs du Pokédex pour une liste d'identifiants (le total shiny est déjà séparé).
export function counts(ids) {
  const list = ids.map(entry);
  return {
    total: ids.length,
    vus: list.filter((e) => e.vu).length,
    captures: list.filter((e) => e.capture).length,
    vusShiny: list.filter((e) => e.vuShiny).length,
    capturesShiny: list.filter((e) => e.captureShiny).length,
  };
}

export const caughtCount = () => Object.values(state.dex).filter((e) => e.capture).length;

// Anciennes sauvegardes : { seen, caught } -> nouveau format, sans perdre la progression.
export function migrateDex() {
  for (const [id, old] of Object.entries(state.dex)) {
    if (!("seen" in old) && !("caught" in old)) continue;
    const owned = [...state.team, ...state.box].filter((m) => String(m.id) === id);
    state.dex[id] = {
      ...blank(),
      vu: !!(old.seen || old.caught),
      capture: !!old.caught,
      nombreCaptures: old.caught ? Math.max(1, owned.length) : 0,
      niveauMax: owned.reduce((n, m) => Math.max(n, m.level), 0),
    };
  }
  // un Pokémon possédé est forcément capturé
  for (const m of [...state.team, ...state.box]) {
    const e = touch(m.id);
    if (!e.capture) Object.assign(e, { vu: true, capture: true, nombreCaptures: Math.max(1, e.nombreCaptures) });
    e.niveauMax = Math.max(e.niveauMax, m.level);
  }
}
