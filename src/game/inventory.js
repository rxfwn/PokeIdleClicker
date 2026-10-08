// Inventaire et effets passifs des objets. Aucune manipulation du DOM ici.
import shop from "../data/shop.json" with { type: "json" };
import { POKEMON } from "../data/index.js";
import { BALANCE } from "../data/balance.js";
import { state } from "../core/state.js";
import { ordinal } from "./progress.js";
import { caughtCount } from "./dex.js";

export const ITEMS = shop.items;
export const CATEGORIES = shop.categories;

// La Poké Ball de base reste dans state.pokeballs ; les autres objets dans state.items.
export const qty = (id) => (id === "pokeball" ? state.pokeballs : (state.items[id] ?? 0));

export function addItem(id, n = 1) {
  if (id === "pokeball") state.pokeballs += n;
  else state.items[id] = (state.items[id] ?? 0) + n;
}

export function takeItem(id, n = 1) {
  if (qty(id) < n) return false;
  addItem(id, -n);
  return true;
}


export function isItemUnlocked(id) {
  const k = ITEMS[id].unlock;
  if (!k) return true;
  switch (k.type) {
    case "badges": return state.badges >= k.value;
    case "captures": return state.stats.captures >= k.value;
    case "zone": return state.storyBest >= ordinal(k.value - 1, 1, 1);
    case "safari": return state.storyBest >= ordinal(4, 4, 1); // arrivée au Parc Safari
    case "league": return state.leagueBeaten;
    case "dex": return caughtCount() >= k.value;
    default: return true;
  }
}

// ---------- Effets temporaires ----------

export const buffActive = (kind, now = Date.now()) => (state.buffs[kind] ?? 0) > now;

export const buffLeft = (kind, now = Date.now()) => Math.max(0, Math.ceil(((state.buffs[kind] ?? 0) - now) / 1000));

// ---------- Objets tenus ----------

export const holdableItems = () => Object.keys(ITEMS).filter((id) => ITEMS[id].held);

// Pièce Rune : un seul Pokémon de l'équipe suffit, l'effet ne se cumule pas.
export const heldMoneyMult = () => (state.team.some((m) => m.held === "amulet-coin") ? 2 : 1);

export const heldExpMult = (mon) => (mon.held === "lucky-egg" ? 1.5 : 1);

// Objet de type : +20 % de dégâts si le Pokémon est du bon type.
export function heldDpsMult(mon) {
  const t = mon.held && ITEMS[mon.held]?.heldType;
  return t && POKEMON[mon.id]?.types.includes(t) ? BALANCE.heldTypeBonus : 1;
}
