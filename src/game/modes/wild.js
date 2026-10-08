// Mode Herbes sauvages : on farme un palier déjà débloqué, sans fin.
import { ZONES } from "../../data/index.js";
import { levelRange } from "../../data/balance.js";
import { state, notify } from "../../core/state.js";
import { makeEnemy, setEnemy, pickWild } from "../enemies.js";
import { ordinal, unlockedPaliers } from "../progress.js";
import { abandonBoss } from "./story.js";

const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

export const wild = {
  id: "wild",
  available: true,

  spawn() {
    const w = state.wild;
    if (ordinal(w.zone, w.palier, 1) > state.storyBest) Object.assign(w, { zone: 0, palier: 1 });
    const r = levelRange(ZONES[w.zone], w.palier);
    const { id, rarity } = pickWild(w.zone, w.palier);
    setEnemy(makeEnemy(id, randInt(r.min, r.max), "wild", rarity));
  },

  onClear() {
    wild.spawn();
  },

  farmLevel() {
    const w = state.wild;
    const r = levelRange(ZONES[w.zone], w.palier);
    return Math.round((r.min + r.max) / 2);
  },
};

// Choisir un palier débloqué lance le mode herbes sauvages.
export function chooseWild(zone, palier) {
  if (ordinal(zone, palier, 1) > state.storyBest) return;
  abandonBoss();
  state.legendFight = false;
  state.wild = { zone, palier };
  state.mode = "wild";
  wild.spawn();
  notify();
}

// Position dans la liste des paliers débloqués (pour les flèches : on ne boucle pas).
export function wildNav() {
  const list = unlockedPaliers(state);
  const pos = state.mode === "wild" ? state.wild : state.story;
  const index = list.findIndex((p) => p.zone === pos.zone && p.palier === pos.palier);
  // zones qui ont au moins un palier débloqué, avec leur palier le plus avancé
  const zones = [...new Set(list.map((p) => p.zone))];
  const zi = zones.indexOf(pos.zone);
  return { list, index, canPrev: index > 0, canNext: index >= 0 && index < list.length - 1, zones, canPrevZone: zi > 0, canNextZone: zi >= 0 && zi < zones.length - 1 };
}

// Palier débloqué précédent (-1) ou suivant (+1), sans revenir au début après le dernier.
export function cycleWild(dir) {
  const { list, index } = wildNav();
  const next = list[index + dir];
  if (next) chooseWild(next.zone, next.palier);
}

// Saute à la zone précédente (-1) ou suivante (+1), sur son palier débloqué le plus avancé.
export function cycleZone(dir) {
  const { list, zones } = wildNav();
  const pos = state.mode === "wild" ? state.wild : state.story;
  const target = zones[zones.indexOf(pos.zone) + dir];
  if (target === undefined) return;
  const best = Math.max(...list.filter((p) => p.zone === target).map((p) => p.palier));
  chooseWild(target, best);
}
