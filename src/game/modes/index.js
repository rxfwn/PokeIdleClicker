import { state, notify } from "../../core/state.js";
import { story, abandonBoss } from "./story.js";
import { wild } from "./wild.js";
import { arena } from "./arena.js";

export const modes = { story, wild, arena };

export function setMode(id) {
  if (!modes[id]?.available || state.mode === id) return;
  abandonBoss();
  state.legendFight = false;
  state.mode = id;
  modes[id].spawn();
  notify();
}
