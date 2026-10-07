import { state, notify, MAX_TEAM } from "../core/state.js";

// Échange un pokémon de la boîte avec/vers l'équipe.
export function moveToTeam(boxIndex) {
  if (state.team.length >= MAX_TEAM) return false;
  state.team.push(state.box.splice(boxIndex, 1)[0]);
  notify();
  return true;
}

export function moveToBox(teamIndex) {
  state.box.push(state.team.splice(teamIndex, 1)[0]);
  notify();
}
