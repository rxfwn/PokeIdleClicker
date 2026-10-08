// État global du jeu : une seule source de vérité, sérialisable en JSON.
export const MAX_TEAM = 6;

export function newState() {
  return {
    mode: "story", // "story" | "wild" | "arena" (arène : à venir)
    // Histoire : zone = index dans ZONES (0 = première), palier 1-5, étape 1-5 (affichée "étape-palier", ex. 3-2)
    story: { zone: 0, palier: 1, step: 1, killsInStep: 0, bossFailed: false, done: false, recoverUntil: 0 },
    storyBest: 0, // plus loin atteint (voir progress.ordinal) : débloque les paliers des herbes sauvages
    wild: { zone: 0, palier: 1 }, // palier choisi en mode herbes sauvages
    money: 0,
    pokeballs: 0,
    ballsBought: 0, // Poké Balls achetées au total : fait monter le prix
    items: {}, // objets possédés (hors Poké Ball) : id -> quantité (voir data/shop.json)
    buffs: {}, // effets temporaires : type -> fin (ms) ; honey = true pour le prochain Pokémon
    useItem: null, // bonbon en cours d'utilisation (choix du Pokémon)
    lastDrop: null, // dernier objet trouvé : { id, at }
    filters: { bag: "all", shop: "all", dexStatus: "all", dexType: "all", dexZone: "all" }, // filtres du Sac, du Shop et du Pokédex
    upgrades: {}, // id -> niveau (voir data/upgrades.json)
    buyMode: 1, // quantité achetée par clic : 1 | 10 | "max"
    dex: {}, // id -> { vu, capture, vuShiny, captureShiny, nombreCaptures, premiereCapture, niveauMax } (voir game/dex.js)
    stats: { clicks: 0, kills: 0, captures: 0 },
    badges: 0, // champions d'arène battus
    badgeZones: [], // zones dont le champion est battu
    badgeLevels: {}, // mode Arène (à venir) : zone -> niveau du badge
    leagueBeaten: false,
    skill: { activeUntil: 0, readyAt: 0 }, // compétence active (Légende Vivante)
    team: [], // { id, level, exp }, max MAX_TEAM
    box: [], // Pokémon capturés hors équipe
    enemy: null, // { id, level, hp, maxHp, kind, rarity, capturable }
    boss: null, // combat de boss en cours : { kind, trainer, mon, deadline }
    legends: [], // rencontres légendaires débloquées : { id, level, key }
    legendFight: false,
    lastSeen: 0, // pour le gain hors ligne
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
