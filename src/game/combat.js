import pokemon from "../data/pokemon.json";
import zones from "../data/zones.json";
import { state, notify } from "../core/state.js";
import { gainMoney } from "./economy.js";

export const clickDamage = () => 1 + state.upgrades.clickDamage;

export function teamDps() {
  return state.team.reduce((sum, id) => sum + (pokemon[id]?.dps ?? 0), 0);
}

export function spawnEnemy() {
  const spawns = zones[state.zone].spawns;
  let roll = Math.random() * spawns.reduce((s, x) => s + x.weight, 0);
  const pick = spawns.find((s) => (roll -= s.weight) < 0) ?? spawns[0];
  const hp = pokemon[pick.id].hp;
  state.enemy = { id: pick.id, hp, maxHp: hp };
}

export function damageEnemy(amount) {
  if (!state.enemy) spawnEnemy();
  state.enemy.hp -= amount;
  if (state.enemy.hp <= 0) {
    gainMoney(pokemon[state.enemy.id].reward);
    spawnEnemy();
  }
  notify();
}

export const click = () => damageEnemy(clickDamage());
export const autoAttack = (dt) => teamDps() > 0 && damageEnemy(teamDps() * dt);
