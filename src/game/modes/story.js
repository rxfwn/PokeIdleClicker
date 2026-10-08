// Mode Histoire : zones, paliers de 5 étapes, boss à l'étape 5, timer de boss.
import { ZONES } from "../../data/index.js";
import { BALANCE, storyLevel, miniBossLevel, moneyReward } from "../../data/balance.js";
import { state, notify } from "../../core/state.js";
import { makeEnemy, setEnemy, pickWild } from "../enemies.js";
import { gainMoney } from "../rewards.js";
import { nextPosition, ordinal, palierData } from "../progress.js";

// Les dresseurs d'un boss : mini-boss (paliers 1-4), champion d'arène (palier 5) ou Conseil 4 de la Ligue.
export function bossTrainers(zoneIndex, palier) {
  const z = ZONES[zoneIndex];
  if (palier === 5) {
    const c = z.champion_arene;
    if (c.enchainement) {
      return { kind: "league", trainers: c.enchainement.map((t) => ({ name: t.nom, level: t.niveau, team: t.equipe })) };
    }
    return { kind: "champion", trainers: [{ name: c.nom, level: c.niveau, team: c.equipe }] };
  }
  const b = palierData(zoneIndex, palier).boss_etape_5;
  return { kind: "boss", trainers: [{ name: b.nom, level: miniBossLevel(z, palier), team: b.equipe }] };
}

const markBest = () => {
  const s = state.story;
  state.storyBest = Math.max(state.storyBest, ordinal(s.zone, s.palier, s.step));
};

function loadBossEnemy() {
  const s = state.story;
  const { kind, trainers } = bossTrainers(s.zone, s.palier);
  const t = trainers[state.boss.trainer];
  setEnemy(makeEnemy(t.team[state.boss.mon].id, t.level, kind));
}

function startBoss() {
  const s = state.story;
  const { kind } = bossTrainers(s.zone, s.palier);
  state.boss = { kind, trainer: 0, mon: 0, deadline: Date.now() + BALANCE.bossTimeLimit[kind] * 1000 };
  loadBossEnemy();
}

function completeBoss() {
  const s = state.story;
  const { kind } = state.boss;
  const p = palierData(s.zone, s.palier);
  gainMoney(moneyReward(state.enemy.level, kind) * BALANCE.bossClearBonus[kind]);
  if (s.palier === 5) {
    if (!state.badgeZones.includes(s.zone)) state.badgeZones.push(s.zone);
    state.badges = state.badgeZones.length;
    if (kind === "league") state.leagueBeaten = true;
  }
  const key = `${s.zone}-${s.palier}`;
  if (p.rencontre_legendaire && !state.legends.some((l) => l.key === key)) {
    state.legends.push({ id: p.rencontre_legendaire.id, level: p.rencontre_legendaire.niveau, key });
  }
  state.boss = null;
  const next = nextPosition(s);
  if (next) {
    Object.assign(s, next, { killsInStep: 0, bossFailed: false });
    markBest();
  } else {
    s.done = true; // fin du jeu : on reste à farmer la dernière étape
    s.bossFailed = true;
  }
  story.spawn();
}

function advanceBoss() {
  const s = state.story;
  const b = state.boss;
  const { kind, trainers } = bossTrainers(s.zone, s.palier);
  b.mon += 1;
  if (b.mon < trainers[b.trainer].team.length) return loadBossEnemy();
  b.trainer += 1;
  b.mon = 0;
  if (b.trainer < trainers.length) {
    b.deadline = Date.now() + BALANCE.bossTimeLimit[kind] * 1000; // chaque dresseur de la Ligue a son timer
    return loadBossEnemy();
  }
  completeBoss();
}

export const story = {
  id: "story",
  available: true,

  spawn() {
    const s = state.story;
    if (s.step === 5 && !s.bossFailed && !s.done) return startBoss();
    state.boss = null;
    const { id, rarity } = pickWild(s.zone, s.palier);
    // devant un boss, on farme au niveau de l'étape 4
    setEnemy(makeEnemy(id, storyLevel(ZONES[s.zone], s.palier, Math.min(s.step, 4)), "wild", rarity));
  },

  onClear() {
    const s = state.story;
    if (state.boss) return advanceBoss();
    s.killsInStep += 1;
    if (s.step < 5 && s.killsInStep >= BALANCE.killsPerStep) {
      s.step += 1;
      s.killsInStep = 0;
      markBest();
    }
    story.spawn();
  },

  // Niveau où l'équipe farme (pour le gain hors ligne).
  farmLevel() {
    const s = state.story;
    return storyLevel(ZONES[s.zone], s.palier, Math.min(s.step, 4));
  },
};

// Le boss n'a pas été battu à temps : on reste à l'étape 5 et on farme avant de réessayer.
export function failBoss() {
  state.boss = null;
  state.story.bossFailed = true;
  story.spawn();
  notify();
}

export function challengeBoss() {
  const s = state.story;
  if (state.mode !== "story" || s.step !== 5 || !s.bossFailed || s.done) return;
  s.bossFailed = false;
  story.spawn();
  notify();
}

export function checkBossTimer(now = Date.now()) {
  if (state.boss && now > state.boss.deadline) failBoss();
}

// Quitter un combat de boss (changement de mode, rencontre légendaire…) : il faudra le redéfier.
export function abandonBoss() {
  if (state.boss) {
    state.boss = null;
    state.story.bossFailed = true;
  }
}

// Infos pour l'affichage du boss en cours.
export function bossInfo(now = Date.now()) {
  if (!state.boss) return null;
  const s = state.story;
  const { kind, trainers } = bossTrainers(s.zone, s.palier);
  const t = trainers[state.boss.trainer];
  return {
    kind,
    name: t.name,
    trainer: state.boss.trainer + 1,
    trainers: trainers.length,
    mon: state.boss.mon + 1,
    monCount: t.team.length,
    secondsLeft: Math.max(0, (state.boss.deadline - now) / 1000),
    limit: BALANCE.bossTimeLimit[kind],
  };
}
