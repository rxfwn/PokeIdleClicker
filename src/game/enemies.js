// Fabrication des adversaires.
import { POKEMON, RARITIES, ZONES } from "../data/index.js";
import { enemyHp } from "../data/balance.js";
import { state } from "../core/state.js";
import { buffActive } from "./inventory.js";
import { markSeen } from "./dex.js";

const RARE = ["rare", "très rare", "légendaire"];

// kind : wild | boss | champion | league | legend
export function makeEnemy(id, level, kind = "wild", rarity = "commun") {
  const maxHp = enemyHp(level, kind);
  return { id, level, hp: maxHp, maxHp, kind, rarity, capturable: kind === "wild" || kind === "legend" };
}

// Installe l'adversaire courant et le marque comme "vu" dans le Pokédex.
export function setEnemy(enemy) {
  enemy.spawnedAt = Date.now(); // sert à la Rapide Ball et à la Chrono Ball
  state.enemy = enemy;
  markSeen(enemy.id);
}

// Pokémon sauvage tiré au hasard selon la rareté, dans un palier.
// Repousse : plus de communs ; Parfum : rares ×2 ; Miel : le prochain est rare ou mieux.
export function pickWild(zoneIndex, palier) {
  let list = ZONES[zoneIndex].paliers[palier - 1].pokemon_sauvages;
  if (state.buffs.honey) {
    const rares = list.filter((p) => RARE.includes(p.rarete));
    if (rares.length) list = rares;
    state.buffs.honey = false;
  } else if (buffActive("repel")) {
    const others = list.filter((p) => p.rarete !== "commun");
    if (others.length) list = others;
  }
  const lure = buffActive("lure");
  const weights = list.map((p) => (RARITIES[p.rarete] ?? 10) * (lure && RARE.includes(p.rarete) ? 2 : 1));
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  const i = weights.findIndex((w) => (roll -= w) < 0);
  const pick = list[i === -1 ? 0 : i];
  return { id: pick.id, rarity: pick.rarete };
}

export const known = (id) => id in POKEMON;
