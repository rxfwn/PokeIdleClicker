import { state, notify, MAX_TEAM } from "../core/state.js";
import { addItem } from "./inventory.js";
import { TEAM_SLOT_UNLOCKS } from "../data/balance.js";
import { ordinal } from "./progress.js";

// Une case d'équipe est-elle ouverte ? (index 0 = 1re case)
export const slotUnlocked = (i) => {
  const u = TEAM_SLOT_UNLOCKS[i];
  return !u || state.storyBest >= ordinal(u.zone - 1, u.palier, 1);
};

// Nombre de cases d'équipe ouvertes (une ancienne sauvegarde garde les Pokémon qu'elle avait déjà).
export const teamSlots = () => Math.min(MAX_TEAM, Math.max(state.team.length, TEAM_SLOT_UNLOCKS.filter((_, i) => slotUnlocked(i)).length));

// Échange un pokémon de la boîte avec/vers l'équipe.
export function moveToTeam(boxIndex) {
  if (state.team.length >= teamSlots()) return false;
  state.team.push(state.box.splice(boxIndex, 1)[0]);
  notify();
  return true;
}

export function moveToBox(teamIndex) {
  const mon = state.team.splice(teamIndex, 1)[0];
  if (mon.held) addItem(mon.held, 1); // seuls les Pokémon de l'équipe tiennent un objet
  mon.held = null;
  state.box.push(mon);
  notify();
}
