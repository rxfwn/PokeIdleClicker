import shop from "../data/shop.json" with { type: "json" };
import { BALANCE, captureChance, expReward } from "../data/balance.js";
import { state, notify } from "../core/state.js";
import { modes } from "./modes/index.js";
import { addPokemon, giveExp } from "./rewards.js";

// Un Pokémon sauvage se capture quand il est affaibli ; un légendaire seulement après sa défaite.
export function canCapture(e = state.enemy) {
  if (!e || !e.capturable) return false;
  if (e.kind === "legend") return !!e.defeated;
  return e.hp / e.maxHp <= BALANCE.capture.weakenedBelow;
}

// Retourne null (impossible) ou { ok } selon la réussite du lancer.
export function tryCapture(ball = "pokeball") {
  const e = state.enemy;
  if (!canCapture(e) || state.pokeballs <= 0) return null;
  state.pokeballs -= 1;
  const chance = captureChance({ rarity: e.rarity, hpFraction: e.hp / e.maxHp, ballMult: shop.balls[ball].catchMult });
  const ok = Math.random() < chance;
  if (ok) {
    addPokemon(e.id, e.level);
    state.stats.captures += 1;
    giveExp(expReward(e.level, e.kind === "legend" ? "boss" : "wild"));
    if (e.kind === "legend") {
      state.legends = state.legends.filter((l) => l.key !== e.legendKey);
      state.legendFight = false;
      modes[state.mode].spawn();
    } else {
      state.stats.kills += 1;
      modes[state.mode].onClear(e); // une capture compte comme une victoire pour la progression
    }
  }
  notify();
  return { ok };
}
