// Achat, revente et utilisation des objets.
import { ZONES } from "../data/index.js";
import { BALANCE, ballPrice } from "../data/balance.js";
import { state, notify } from "../core/state.js";
import { ITEMS, qty, addItem, takeItem, isItemUnlocked, buffActive, holdableItems } from "./inventory.js";
import { locationInfo } from "./progress.js";
import { gainExp, setLevel } from "./rewards.js";

const lotOf = (id) => ITEMS[id].lot ?? 1;

// Raison pour laquelle un objet ne peut pas être acheté (null = achetable).
export function blocked(id) {
  const it = ITEMS[id];
  if (it.price == null) return "notsold";
  if (it.soon) return "soon";
  if (!isItemUnlocked(id)) return "locked";
  if (it.unique && qty(id) > 0) return "owned";
  return null;
}

// Prix fixes, sauf la Poké Ball de base, qui renchérit à chaque achat.
const unitPrice = (id, i) => (id === "pokeball" ? ballPrice(ITEMS[id].price, state.ballsBought + i) : ITEMS[id].price);
export const nextPrice = (id) => unitPrice(id, 0);

// Prix d'un achat de `mode` unités (1, 10 ou "max").
export function quote(id, mode) {
  const maxN = ITEMS[id].unique ? 1 : Infinity;
  if (blocked(id)) return { count: 1, cost: unitPrice(id, 0), ok: false };
  if (mode === "max") {
    let n = 0;
    let cost = 0;
    while (n < maxN && n < 100000 && cost + unitPrice(id, n) <= state.money) cost += unitPrice(id, n++);
    return n ? { count: n, cost, ok: true } : { count: 1, cost: unitPrice(id, 0), ok: false };
  }
  const count = Math.min(mode, maxN);
  let cost = 0;
  for (let i = 0; i < count; i++) cost += unitPrice(id, i);
  return { count, cost, ok: state.money >= cost };
}

export function buyItem(id, mode) {
  const q = quote(id, mode);
  if (!q.ok) return false;
  state.money -= q.cost;
  addItem(id, q.count * lotOf(id));
  if (id === "pokeball") state.ballsBought += q.count;
  notify();
  return true;
}

// Revente : prix de revente de l'objet, sinon 50 % du prix d'achat.
export const sellPrice = (id) => ITEMS[id].resale ?? Math.floor((ITEMS[id].price ?? 0) * BALANCE.sellRate);

export function sellItem(id) {
  const price = sellPrice(id);
  if (price <= 0 || !takeItem(id)) return false;
  state.money += price;
  notify();
  return true;
}

// ---------- Utilisation ----------

export const isUsable = (id) => !!(ITEMS[id].boost || ITEMS[id].spawn || ITEMS[id].candy);
const effectKind = (it) => (it.boost ?? it.spawn)?.kind;

// Le Miel n'a d'effet que s'il existe un Pokémon rare dans le palier en cours.
export function hasRareHere() {
  const loc = locationInfo(state);
  const z = ZONES.find((x) => x.zone === loc.zoneNum);
  return z.paliers[loc.palier - 1].pokemon_sauvages.some((p) => ["rare", "très rare", "légendaire"].includes(p.rarete));
}

// Un seul effet de chaque type à la fois.
export function canUse(id) {
  const it = ITEMS[id];
  if (qty(id) < 1) return false;
  if (it.candy) return true;
  const kind = effectKind(it);
  if (kind === "honey") return !state.buffs.honey && hasRareHere();
  return !buffActive(kind);
}

// Boosts, Repousse, Parfum, Miel (les bonbons passent par useCandy).
export function useItem(id) {
  const it = ITEMS[id];
  if (it.candy || !canUse(id)) return false;
  const spec = it.boost ?? it.spawn;
  takeItem(id);
  state.buffs[spec.kind] = spec.kind === "honey" ? true : Date.now() + spec.seconds * 1000;
  notify();
  return true;
}

// Bonbon : EXP ou niveau pour un Pokémon de l'équipe ("team") ou de la boîte ("box").
export function useCandy(id, list, index) {
  const mon = state[list]?.[index];
  const c = ITEMS[id].candy;
  if (!mon || !c || !takeItem(id)) return false;
  if (c.exp) gainExp(mon, c.exp);
  if (c.levels) setLevel(mon, mon.level + c.levels);
  state.useItem = qty(id) > 0 ? id : null;
  notify();
  return true;
}

// ---------- Objets tenus ----------

// Donne un objet à un Pokémon de l'équipe (itemId = null pour le reprendre). Un objet par Pokémon.
export function equip(teamIndex, itemId) {
  const mon = state.team[teamIndex];
  if (!mon) return;
  if (itemId && (!holdableItems().includes(itemId) || (itemId !== mon.held && qty(itemId) < 1))) return;
  if (mon.held) addItem(mon.held, 1);
  mon.held = null;
  if (itemId) {
    takeItem(itemId);
    mon.held = itemId;
  }
  notify();
}
