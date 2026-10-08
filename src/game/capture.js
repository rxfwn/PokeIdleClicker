import { BALANCE, captureChance, expReward } from "../data/balance.js";
import { HABITATS, POKEMON } from "../data/index.js";
import { state, notify } from "../core/state.js";
import { modes } from "./modes/index.js";
import { ITEMS, qty, takeItem } from "./inventory.js";
import { locationInfo } from "./progress.js";
import { addPokemon, giveExp } from "./rewards.js";
import { isCaught } from "./dex.js";

// Un Pokémon sauvage se capture quand il est affaibli ; un légendaire seulement après sa défaite.
export function canCapture(e = state.enemy) {
  if (!e || !e.capturable) return false;
  if (e.kind === "legend") return !!e.defeated;
  return e.hp / e.maxHp <= BALANCE.capture.weakenedBelow;
}

// Les conditions d'une ball spéciale sont-elles réunies pour cet adversaire ?
function condMet(c, e) {
  if (!c) return true;
  const lieu = locationInfo(state).lieu;
  if (c.levelBelow !== undefined && !(e.level < c.levelBelow)) return false;
  if (c.habitat && !HABITATS[c.habitat].some((n) => lieu.includes(n))) return false;
  if (c.types && !POKEMON[e.id].types.some((t) => c.types.includes(t))) return false;
  if (c.caught && !isCaught(e.id)) return false;
  if (c.withinSeconds !== undefined && Date.now() - e.spawnedAt > c.withinSeconds * 1000) return false;
  return true;
}

// Certaines balls (Safari Ball) ne se lancent que dans leur lieu.
export const ballUsable = (id, e = state.enemy) => {
  const b = ITEMS[id].ball;
  return !(b.only && !condMet(b.cond, e));
};

// Multiplicateur de capture de la ball pour cet adversaire (Infinity = capture garantie).
export function ballMultiplier(id, e = state.enemy) {
  const b = ITEMS[id].ball;
  if (b.guaranteed) return Infinity;
  if (b.timer) return 1 + (b.timer.max - 1) * Math.min(1, (Date.now() - e.spawnedAt) / 1000 / b.timer.seconds);
  return condMet(b.cond, e) ? b.mult : 1;
}

export function captureOdds(id, e = state.enemy) {
  const m = ballMultiplier(id, e);
  if (m === Infinity) return 1;
  return captureChance({ rarity: e.rarity, hpFraction: e.hp / e.maxHp, ballMult: m });
}

// Balls possédées, dans l'ordre de la boutique.
export const ownedBalls = () => Object.keys(ITEMS).filter((id) => ITEMS[id].ball && qty(id) > 0);

let capturing = false; // lancer en cours : l'ennemi ne bouge ni ne prend de dégâts
export const isCapturing = () => capturing;

// Lance la ball : la consomme et tire le résultat, mais n'applique rien avant endCapture()
// (l'interface joue l'animation entre les deux). Retourne null si impossible.
export function beginCapture(ball = "pokeball") {
  const e = state.enemy;
  if (capturing || !canCapture(e) || !ITEMS[ball]?.ball || qty(ball) < 1 || !ballUsable(ball, e)) return null;
  const chance = captureOdds(ball, e);
  takeItem(ball);
  capturing = true;
  notify();
  return { ball, enemy: e, ok: Math.random() < chance };
}

// Applique le résultat du lancer (capture réussie ou ennemi qui s'échappe).
export function endCapture({ enemy: e, ok }) {
  capturing = false;
  if (ok && state.enemy === e) {
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
}

// Lancer immédiat, sans animation. Retourne null (impossible) ou { ok }.
export function tryCapture(ball = "pokeball") {
  const r = beginCapture(ball);
  if (!r) return null;
  endCapture(r);
  return { ok: r.ok };
}
