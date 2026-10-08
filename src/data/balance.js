// Toutes les formules d'équilibrage du jeu sont ici : PV, gains, EXP, DPS, capture, coûts, sauvegarde.
// Pour rééquilibrer le jeu, on ne touche (presque) qu'à ce fichier.

export const BALANCE = {
  killsPerStep: 1, // Pokémon à vaincre pour passer à l'étape suivante
  levelCap: 100,

  save: {
    intervalMs: 10_000, // sauvegarde automatique
    offlineCapSeconds: 8 * 3600, // gain hors ligne plafonné à 8 h
    offlineEfficiency: 1, // part du DPS de l'équipe comptée hors ligne
    offlineMinSeconds: 30, // en dessous, pas de message
  },

  // Multiplicateurs selon le type d'adversaire : wild, boss (mini-boss), champion, league, legend
  hpMult: { wild: 1, boss: 2.5, champion: 5, league: 6, legend: 8 },
  moneyMult: { wild: 1, boss: 2, champion: 4, league: 4, legend: 0 },
  expMult: { wild: 1, boss: 2, champion: 3, league: 3, legend: 0 },
  bossClearBonus: { boss: 5, champion: 15, league: 25 }, // × gain d'argent du dernier Pokémon
  bossTimeLimit: { boss: 30, champion: 45, league: 45 }, // secondes (la Ligue : par dresseur)

  capture: {
    weakenedBelow: 0.5, // le bouton "Lancer une Poké Ball" apparaît sous cette part de PV
    byRarity: { commun: 0.6, "peu commun": 0.45, rare: 0.3, "très rare": 0.15, légendaire: 0.08 },
    min: 0.02,
    max: 0.95,
  },
};

// ---------- Ennemis ----------

export const enemyHp = (level, kind = "wild") =>
  Math.round((10 + 1.6 * Math.pow(level, 2.1)) * BALANCE.hpMult[kind]);

export const moneyReward = (level, kind = "wild") =>
  Math.round((3 + 0.8 * Math.pow(level, 1.5)) * BALANCE.moneyMult[kind]);

export const expReward = (level, kind = "wild") =>
  Math.round((4 + 3 * level) * BALANCE.expMult[kind]);

// Niveaux sauvages d'un palier : la zone [min, max] est découpée en 5 tranches.
export function levelRange(zone, palier) {
  const { min, max } = zone.niveaux_sauvages;
  const span = max - min;
  return {
    min: Math.round(min + (span * (palier - 1)) / 5),
    max: Math.round(min + (span * palier) / 5),
  };
}

// Niveau des ennemis de l'histoire à une étape (1 à 5) d'un palier.
export function storyLevel(zone, palier, step) {
  const r = levelRange(zone, palier);
  return Math.round(r.min + ((r.max - r.min) * (Math.min(step, 5) - 1)) / 4);
}

// Niveau d'un mini-boss : un cran au-dessus des Pokémon sauvages du palier.
export const miniBossLevel = (zone, palier) => levelRange(zone, palier).max + 1;

// ---------- Équipe ----------

// EXP nécessaire pour passer du niveau `level` au suivant.
export const expToNext = (level) => Math.round(8 + 0.8 * level * level);

// Dégâts par seconde d'un Pokémon de l'équipe (bst = total de ses stats de base).
export const pokemonDps = (level, bst = 300) => (bst / 300) * (0.4 + 0.35 * level);

// ---------- Capture ----------

export function captureChance({ rarity, hpFraction, ballMult = 1 }) {
  const c = BALANCE.capture;
  const base = (c.byRarity[rarity] ?? 0.4) * ballMult * (1.5 - hpFraction);
  return Math.min(c.max, Math.max(c.min, base));
}

// ---------- Coûts ----------

// Coût du niveau `level` (0 = premier achat) d'une amélioration.
export const upgradeLevelCost = (baseCost, growth, level) => Math.ceil(baseCost * Math.pow(growth, level));
