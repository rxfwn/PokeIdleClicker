import pokemon from "../data/pokemon.json";
import { state, notify, MAX_TEAM } from "../core/state.js";
import { spawnEnemy } from "./combat.js";

// Plus l'ennemi est blessé, plus la capture est facile.
export function tryCapture() {
  const e = state.enemy;
  if (!e || state.pokeballs <= 0) return false;
  state.pokeballs -= 1;
  const chance = pokemon[e.id].catchRate * (1.5 - e.hp / e.maxHp);
  const success = Math.random() < Math.min(chance, 1);
  if (success) {
    (state.team.length < MAX_TEAM ? state.team : state.box).push(e.id);
    spawnEnemy();
  }
  notify();
  return success;
}
