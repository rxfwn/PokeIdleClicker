// Rencontres légendaires : combats optionnels débloqués après certains boss, capturables.
import { state, notify } from "../core/state.js";
import { modes } from "./modes/index.js";
import { abandonBoss } from "./modes/story.js";
import { makeEnemy, setEnemy } from "./enemies.js";

export function startLegend(key) {
  const l = state.legends.find((x) => x.key === key);
  if (!l) return;
  abandonBoss();
  state.legendFight = true;
  setEnemy({ ...makeEnemy(l.id, l.level, "legend", "légendaire"), legendKey: key });
  notify();
}

export function fleeLegend() {
  state.legendFight = false;
  modes[state.mode].spawn();
  notify();
}
