// Argent, EXP, objets trouvés et nouveaux Pokémon.
import { state, notify } from "../core/state.js";
import { BALANCE, moneyReward, expReward, expToNext } from "../data/balance.js";
import { HABITATS } from "../data/index.js";
import { ITEMS, qty, addItem, heldMoneyMult, heldExpMult } from "./inventory.js";
import { ordinal, locationInfo } from "./progress.js";
import { markCaught, raiseMaxLevel } from "./dex.js";
import { teamSlots } from "./team.js";

export const gainMoney = (amount) => {
  state.money += Math.round(amount);
};

// EXP d'un Pokémon, avec montée de niveau.
export function gainExp(mon, amount) {
  mon.exp += Math.round(amount);
  while (mon.level < BALANCE.levelCap && mon.exp >= expToNext(mon.level)) {
    mon.exp -= expToNext(mon.level);
    mon.level += 1;
  }
  raiseMaxLevel(mon.id, mon.level);
}

export function setLevel(mon, level) {
  mon.level = Math.min(BALANCE.levelCap, level);
  mon.exp = 0;
  raiseMaxLevel(mon.id, mon.level);
}

// EXP donnée à l'équipe (Œuf Chance : ×1,5) ; avec la Multi Exp, la boîte en reçoit une part.
export function giveExp(amount) {
  for (const mon of state.team) gainExp(mon, amount * heldExpMult(mon));
  if (qty("exp-share") > 0) for (const mon of state.box) gainExp(mon, amount * BALANCE.expShare);
}

// Objets de revente qui tombent sur les Pokémon sauvages.
function rollDrops() {
  const lieu = locationInfo(state).lieu;
  for (const [id, it] of Object.entries(ITEMS)) {
    const d = it.drop;
    if (!d || state.storyBest < ordinal(d.zone - 1, 1, 1)) continue;
    const here =
      d.where === "anywhere" ||
      (d.where === "aquatic" && HABITATS.aquatic.some((n) => lieu.startsWith(n))) ||
      (d.where === "caves" && HABITATS.caves.some((n) => lieu.includes(n))) ||
      (d.lieux && d.lieux.some((n) => lieu.includes(n)));
    if (here && Math.random() < d.chance) {
      addItem(id, 1);
      state.lastDrop = { id, at: Date.now() };
    }
  }
}

export function rewardKill(enemy) {
  gainMoney(moneyReward(enemy.level, enemy.kind) * heldMoneyMult());
  giveExp(expReward(enemy.level, enemy.kind));
  if (enemy.kind === "wild") rollDrops();
}

export function addPokemon(id, level) {
  const mon = { id, level, exp: 0, held: null };
  (state.team.length < teamSlots() ? state.team : state.box).push(mon); // sinon dans la boîte
  markCaught(id, level);
  notify();
}
