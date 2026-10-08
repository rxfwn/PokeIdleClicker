import { state, notify } from "../core/state.js";
import { modes } from "./modes/index.js";
import { rewardKill } from "./rewards.js";
import { clickHit, teamDps } from "./hero.js";

export const spawnEnemy = () => modes[state.mode].spawn();

export function damageEnemy(amount) {
  const e = state.enemy;
  if (!e) {
    spawnEnemy();
    return notify();
  }
  if (e.defeated) return;
  e.hp -= amount;
  if (e.hp <= 0) {
    state.stats.kills += 1;
    if (e.kind === "legend") {
      // un légendaire vaincu reste là, affaibli : on peut tenter de le capturer
      e.hp = 0;
      e.defeated = true;
    } else {
      rewardKill(e);
      modes[state.mode].onClear(e);
    }
  }
  notify();
}

// Retourne { damage, crit } pour l'affichage.
export function click() {
  state.stats.clicks += 1;
  const hit = clickHit();
  damageEnemy(hit.damage);
  return hit;
}

export const autoAttack = (dt) => {
  const dps = teamDps();
  if (dps > 0) damageEnemy(dps * dt);
};
