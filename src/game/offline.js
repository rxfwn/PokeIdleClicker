// Gain hors ligne : pendant l'absence, l'équipe farme là où le joueur s'était arrêté (plafonné à 8 h).
import { BALANCE, enemyHp, moneyReward, expReward } from "../data/balance.js";
import { state } from "../core/state.js";
import { modes } from "./modes/index.js";
import { teamDps } from "./hero.js";
import { gainMoney, giveExp } from "./rewards.js";

// Retourne null s'il n'y a rien à afficher, sinon { seconds, capped, kills, money, exp }.
export function applyOffline(elapsedMs) {
  const cfg = BALANCE.save;
  const seconds = Math.min(elapsedMs / 1000, cfg.offlineCapSeconds);
  if (seconds < cfg.offlineMinSeconds) return null;
  const dps = teamDps();
  if (dps <= 0) return null;

  const level = modes[state.mode].farmLevel();
  const kills = Math.floor((dps * seconds * cfg.offlineEfficiency) / enemyHp(level, "wild"));
  const money = kills * moneyReward(level, "wild");
  const exp = kills * expReward(level, "wild");
  gainMoney(money);
  giveExp(exp);
  state.stats.kills += kills;
  return { seconds, capped: elapsedMs / 1000 > cfg.offlineCapSeconds, kills, money, exp };
}
