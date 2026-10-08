// Argent, EXP et nouveaux Pokémon.
import { state, notify, MAX_TEAM } from "../core/state.js";
import { BALANCE, moneyReward, expReward, expToNext } from "../data/balance.js";

export const gainMoney = (amount) => {
  state.money += Math.round(amount);
};

// L'EXP est donnée à chaque Pokémon de l'équipe.
export function giveExp(amount) {
  for (const mon of state.team) {
    mon.exp += amount;
    while (mon.level < BALANCE.levelCap && mon.exp >= expToNext(mon.level)) {
      mon.exp -= expToNext(mon.level);
      mon.level += 1;
    }
  }
}

export function rewardKill(enemy) {
  gainMoney(moneyReward(enemy.level, enemy.kind));
  giveExp(expReward(enemy.level, enemy.kind));
}

export function addPokemon(id, level) {
  const mon = { id, level, exp: 0 };
  (state.team.length < MAX_TEAM ? state.team : state.box).push(mon);
  state.dex[id] = { seen: true, caught: true };
  notify();
}
