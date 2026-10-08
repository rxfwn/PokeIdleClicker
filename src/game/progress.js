// Position dans l'histoire et paliers débloqués.
import { ZONES, STEPS_PER_PALIER, PALIERS_PER_ZONE } from "../data/index.js";

// Numéro d'ordre d'une étape : sert à comparer deux positions.
export const ordinal = (zone, palier, step = 1) =>
  zone * PALIERS_PER_ZONE * STEPS_PER_PALIER + (palier - 1) * STEPS_PER_PALIER + (step - 1);

export const palierData = (zone, palier) => ZONES[zone].paliers[palier - 1];

// Étape suivante dans l'ordre 1-1, 2-1 … 5-1, 1-2 … 5-5, puis zone suivante. null = fin du jeu.
export function nextPosition({ zone, palier, step }) {
  if (step < STEPS_PER_PALIER) return { zone, palier, step: step + 1 };
  if (palier < PALIERS_PER_ZONE) return { zone, palier: palier + 1, step: 1 };
  if (zone + 1 < ZONES.length) return { zone: zone + 1, palier: 1, step: 1 };
  return null;
}

// Paliers que le joueur peut farmer en mode herbes sauvages.
export function unlockedPaliers(state) {
  const list = [];
  ZONES.forEach((z, zone) => {
    z.paliers.forEach((p) => {
      if (ordinal(zone, p.palier, 1) <= state.storyBest) list.push({ zone, palier: p.palier });
    });
  });
  return list;
}

// Où est le joueur en ce moment (pour l'affichage).
export function locationInfo(state) {
  const wild = state.mode === "wild";
  const pos = wild ? state.wild : state.story;
  const z = ZONES[pos.zone];
  const p = z.paliers[pos.palier - 1];
  return {
    mode: state.mode,
    zoneNum: z.zone,
    zoneName: z.nom,
    palier: pos.palier,
    lieu: p.lieu,
    stepLabel: wild ? null : `${pos.step}-${pos.palier}`,
  };
}

// Pokémon sauvages d'un palier (sans doublon), avec leur rareté.
export function palierMons(zone, palier) {
  const seen = new Set();
  return ZONES[zone].paliers[palier - 1].pokemon_sauvages.filter((p) => !seen.has(p.id) && seen.add(p.id));
}
