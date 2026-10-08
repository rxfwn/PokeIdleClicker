// Effets des améliorations de Sacha. Aucune manipulation du DOM ici.
import { POKEMON } from "../data/index.js";
import { pokemonDps } from "../data/balance.js";
import upgrades from "../data/upgrades.json" with { type: "json" };
import { state, notify } from "../core/state.js";

export const level = (id) => state.upgrades[id] ?? 0;
const has = (id) => level(id) > 0;

// Paliers qui doublent : 25, 50, 100, 200... puis le niveau max.
export function milestones(max) {
  const m = [];
  for (let p = 25; p < max; p *= 2) m.push(p);
  m.push(max);
  return m;
}

// Niveau "effectif" : si l'amélioration a un `milestoneMult` (ex. 2), chaque palier atteint multiplie son effet.
function effLevel(id) {
  const lvl = level(id);
  const u = upgrades[id];
  if (!u.milestoneMult) return lvl;
  return lvl * Math.pow(u.milestoneMult, milestones(u.maxLevel).filter((m) => m <= lvl).length);
}

export const speciesCaught = () => Object.values(state.dex).filter((d) => d.caught).length;

export function isUnlocked(id) {
  const k = upgrades[id].unlock;
  if (!k) return true;
  switch (k.type) {
    case "kills": return state.stats.kills >= k.value;
    case "captures": return state.stats.captures >= k.value;
    case "teamSize": return state.team.length >= k.value;
    case "species": return speciesCaught() >= k.value;
    case "badges": return state.badges >= k.value;
    case "league": return state.leagueBeaten;
    default: return true;
  }
}

// État temporaire, non sauvegardé.
const temp = { combo: 0, comboLast: 0, frenzyUntil: 0 };

// Multiplicateur appliqué à tous les dégâts (clics et équipe).
function globalMult(now) {
  let m = 1;
  if (has("auraChampion")) m *= 2;
  if (has("memoirePokedex")) m *= 1 + 0.01 * speciesCaught();
  if (now < temp.frenzyUntil) m *= 3;
  if (now < state.skill.activeUntil) m *= 10;
  return m;
}

function teamDpsBase() {
  const sum = state.team.reduce((s, mon) => s + pokemonDps(mon.level, POKEMON[mon.id]?.bst), 0);
  return sum * (1 + 0.05 * effLevel("encouragements")) * (has("rappelTactique") ? 2 : 1);
}

export const teamDps = (now = Date.now()) => teamDpsBase() * globalMult(now);

function baseClick() {
  const flat = 1 + effLevel("poingFerme") + 0.005 * effLevel("lienConfiance") * teamDpsBase();
  return flat * (1 + 0.05 * effLevel("entrainement")) * (has("doubleFrappe") ? 2 : 1);
}

// Dégâts d'un clic "normal" (sans combo, critique ni coup de grâce), pour l'affichage.
export const clickDamage = (now = Date.now()) => Math.max(1, Math.round(baseClick() * globalMult(now)));

// Résout un clic : appeler après avoir incrémenté state.stats.clicks.
export function clickHit(now = Date.now()) {
  if (has("combo")) {
    temp.combo = now - temp.comboLast <= 1000 ? temp.combo + 1 : 1;
    temp.comboLast = now;
  }
  if (has("frenesie") && state.stats.clicks % 100 === 0) temp.frenzyUntil = now + 10_000;

  let dmg = baseClick() * globalMult(now);
  if (has("combo")) dmg *= Math.min(2, 1 + 0.02 * temp.combo);
  const e = state.enemy;
  if (has("coupDeGrace") && e && e.hp / e.maxHp < 0.2) dmg *= 5;
  const crit = Math.random() < Math.min(1, 0.01 * effLevel("coupDoeil"));
  if (crit) dmg *= 2 + 0.1 * effLevel("frappePrecise");
  return { damage: Math.max(1, Math.round(dmg)), crit };
}

// Compétence active Légende Vivante.
export function skillStatus(now = Date.now()) {
  if (!has("legendeVivante")) return null;
  return {
    activeLeft: Math.max(0, Math.ceil((state.skill.activeUntil - now) / 1000)),
    cooldownLeft: Math.max(0, Math.ceil((state.skill.readyAt - now) / 1000)),
  };
}

export function activateLegend(now = Date.now()) {
  if (!has("legendeVivante") || now < state.skill.readyAt) return;
  state.skill = { activeUntil: now + 30_000, readyAt: now + 600_000 };
  notify();
}
