import upgrades from "../data/upgrades.json" with { type: "json" };
import shop from "../data/shop.json" with { type: "json" };
import { upgradeLevelCost } from "../data/balance.js";
import { state, notify } from "../core/state.js";
import { level, isUnlocked } from "./hero.js";

const levelCost = (key, lvl) => upgradeLevelCost(upgrades[key].baseCost, upgrades[key].costGrowth, lvl);

// Raison pour laquelle une amélioration ne peut pas être achetée (null = achetable).
export function blockedReason(key) {
  const u = upgrades[key];
  if (level(key) >= u.maxLevel) return "max";
  if (u.implemented === false) return "soon";
  if (!isUnlocked(key)) return "locked";
  return null;
}

// Prix d'un achat de `mode` niveaux (1, 10 ou "max"). "max" = tout ce qu'on peut payer.
export function quote(key, mode) {
  const start = level(key);
  const remaining = upgrades[key].maxLevel - start;
  if (remaining <= 0) return { count: 0, cost: 0, ok: false };
  const allowed = blockedReason(key) === null;
  if (mode === "max") {
    let count = 0;
    let cost = 0;
    while (count < remaining && cost + levelCost(key, start + count) <= state.money) cost += levelCost(key, start + count++);
    return count ? { count, cost, ok: allowed } : { count: 1, cost: levelCost(key, start), ok: false };
  }
  const count = Math.min(mode, remaining);
  let cost = 0;
  for (let i = 0; i < count; i++) cost += levelCost(key, start + i);
  return { count, cost, ok: allowed && state.money >= cost };
}

export function buyUpgrade(key, mode) {
  const q = quote(key, mode);
  if (!q.ok) return false;
  state.money -= q.cost;
  state.upgrades[key] = level(key) + q.count;
  notify();
  return true;
}

export function quoteBalls(mode) {
  const unit = shop.balls.pokeball.baseCost;
  if (mode === "max") {
    const count = Math.floor(state.money / unit);
    return count ? { count, cost: count * unit, ok: true } : { count: 1, cost: unit, ok: false };
  }
  return { count: mode, cost: mode * unit, ok: state.money >= mode * unit };
}

export function buyPokeballs(mode) {
  const q = quoteBalls(mode);
  if (!q.ok) return false;
  state.money -= q.cost;
  state.pokeballs += q.count;
  notify();
  return true;
}
