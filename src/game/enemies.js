// Fabrication des adversaires.
import { POKEMON, RARITIES, ZONES } from "../data/index.js";
import { enemyHp } from "../data/balance.js";
import { state } from "../core/state.js";

// kind : wild | boss | champion | league | legend
export function makeEnemy(id, level, kind = "wild", rarity = "commun") {
  const maxHp = enemyHp(level, kind);
  return { id, level, hp: maxHp, maxHp, kind, rarity, capturable: kind === "wild" || kind === "legend" };
}

// Installe l'adversaire courant et le marque comme "vu" dans le Pokédex.
export function setEnemy(enemy) {
  state.enemy = enemy;
  state.dex[enemy.id] = { ...state.dex[enemy.id], seen: true };
}

// Pokémon sauvage tiré au hasard selon la rareté, dans un palier.
export function pickWild(zoneIndex, palier) {
  const list = ZONES[zoneIndex].paliers[palier - 1].pokemon_sauvages;
  const weights = list.map((p) => RARITIES[p.rarete] ?? 10);
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  const i = weights.findIndex((w) => (roll -= w) < 0);
  const pick = list[i === -1 ? 0 : i];
  return { id: pick.id, rarity: pick.rarete };
}

export const known = (id) => id in POKEMON;
