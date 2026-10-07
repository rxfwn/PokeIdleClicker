// État global du jeu : une seule source de vérité, sérialisable en JSON.
export const MAX_TEAM = 6;

export function newState() {
  return {
    mode: "wild", // "wild" | "story"
    zone: "route1",
    money: 0,
    pokeballs: 5,
    upgrades: { clickDamage: 0, moneyBonus: 0 },
    team: [], // ids de pokémon, max MAX_TEAM
    box: [], // pokémons capturés hors équipe
    enemy: null, // { id, hp, maxHp }
  };
}

export const state = newState();

const listeners = new Set();
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const notify = () => listeners.forEach((fn) => fn(state));

export function replaceState(next) {
  Object.assign(state, newState(), next);
  notify();
}
