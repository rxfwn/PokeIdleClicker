import upgrades from "../data/upgrades.json";
import { state, notify } from "../core/state.js";

export function gainMoney(base) {
  state.money += Math.round(base * (1 + 0.1 * state.upgrades.moneyBonus));
}

export function upgradeCost(key) {
  const u = upgrades[key];
  return Math.ceil(u.baseCost * Math.pow(u.costGrowth, state.upgrades[key] ?? 0));
}

export function buyUpgrade(key) {
  const cost = upgradeCost(key);
  if (state.money < cost) return false;
  state.money -= cost;
  state.upgrades[key] += 1;
  notify();
  return true;
}

export function buyPokeball() {
  const cost = upgrades.pokeball.baseCost;
  if (state.money < cost) return false;
  state.money -= cost;
  state.pokeballs += 1;
  notify();
  return true;
}
