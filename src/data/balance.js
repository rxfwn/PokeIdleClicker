// Toutes les formules d'équilibrage du jeu sont ici : PV, gains, EXP, DPS, capture, coûts, sauvegarde.
// Pour rééquilibrer le jeu, on ne touche (presque) qu'à ce fichier.

export const BALANCE = {
  levelCap: 100,

  save: {
    intervalMs: 10_000, // sauvegarde automatique
    offlineCapSeconds: 8 * 3600, // gain hors ligne plafonné à 8 h
    offlineEfficiency: 1, // part du DPS de l'équipe comptée hors ligne
    offlineMinSeconds: 30, // en dessous, pas de message
  },

  // Multiplicateurs selon le type d'adversaire : wild, boss (mini-boss), champion, league, legend
  hpMult: { wild: 1, boss: 12, champion: 24, league: 30, legend: 40 },
  moneyMult: { wild: 1, boss: 10, champion: 10, league: 10, legend: 0 }, // un boss rapporte 10× un sauvage
  expMult: { wild: 1, boss: 2, champion: 3, league: 3, legend: 0 },
  bossClearBonus: { boss: 5, champion: 15, league: 25 }, // × gain d'argent du dernier Pokémon
  bossTimeLimit: { boss: 30, champion: 45, league: 45 }, // secondes (la Ligue : par dresseur)
  bossRecover: { boss: 30, champion: 60, league: 90 }, // secondes de récupération après un échec, avant de pouvoir redéfier

  heldTypeBonus: 1.2, // objet tenu du bon type : +20 % de dégâts
  expShare: 0.3, // part d'EXP des Pokémon hors équipe avec la Multi Exp
  sellRate: 0.5, // revente : 50 % du prix d'achat
  ball: { step: 0.15, power: 2 }, // prix de la Poké Ball = base × (1 + step × achetées)^power

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

// Un Pokémon sauvage rapporte environ 2 ₽ × son niveau (hypothèse d'équilibrage de la boutique).
export const moneyReward = (level, kind = "wild") => Math.round(2 * level * BALANCE.moneyMult[kind]);

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

// Prix de la Poké Ball suivante, sachant que `bought` ont déjà été achetées.
// Le prix grimpe fortement : base × (1 + 0,15 × achetées)². Avec 200 ₽ de base : 11ᵉ ball ≈ 1 250 ₽, 51ᵉ ≈ 14 000 ₽, 101ᵉ ≈ 51 000 ₽.
export const ballPrice = (baseCost, bought) => Math.ceil(baseCost * Math.pow(1 + BALANCE.ball.step * bought, BALANCE.ball.power));

// ---------- Progression ----------

// Pokémon à vaincre pour passer une étape (1 à 4 ; la 5 est le boss) : 3 ou 4 en zone 1, de plus en plus ensuite.
export const killsPerStep = (zoneIndex, step) => 3 + Math.floor((step - 1) / 2) + zoneIndex;

// Cases d'équipe : la 1re est ouverte dès le début, les autres s'ouvrent en atteignant ce palier de l'histoire.
export const TEAM_SLOT_UNLOCKS = [null, { zone: 1, palier: 3 }, { zone: 2, palier: 1 }, { zone: 3, palier: 1 }, { zone: 5, palier: 1 }, { zone: 7, palier: 1 }];
