import { POKEMON, ZONES } from "../data/index.js";
import upgrades from "../data/upgrades.json";
import shop from "../data/shop.json";
import { expToNext, pokemonDps } from "../data/balance.js";
import { MAX_TEAM } from "../core/state.js";
import { quote, quoteBalls, blockedReason } from "../game/economy.js";
import { teamDps, clickDamage, level, milestones } from "../game/hero.js";
import { modes } from "../game/modes/index.js";
import { unlockedPaliers, palierMons } from "../game/progress.js";
import { money, pokeballIcon } from "./money.js";
import { spriteSrc } from "./battle.js";
import { TABS } from "./tabs.js";

const sprite = (id, cls = "") =>
  `<img class="sprite ${cls}" src="${spriteSrc(id)}" alt="${POKEMON[id].name}" draggable="false" />`;

const buyModes = (s) =>
  `<div class="modes">${[1, 10, "max"]
    .map((m) => `<button data-action="buyMode" data-mode="${m}" class="${s.buyMode === m ? "on" : ""}">${m === "max" ? "XMAX" : "X" + m}</button>`)
    .join("")}</div>`;

const buyBtn = (action, q, attrs = "") =>
  `<button data-action="${action}" ${attrs} ${q.ok ? "" : "disabled"}>Acheter ×${q.count} — ${money(q.cost)}</button>`;

const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");

// Barre vers le prochain palier, avec "niveau/palier" écrit dedans ; précise si le palier double l'effet.
function progressBar(k, lvl, max) {
  const next = milestones(max).find((m) => m > lvl);
  const mult = upgrades[k].milestoneMult;
  return `<div class="tprog">
      <div class="tfill" style="width:${next ? (lvl / next) * 100 : 100}%"></div>
      <span>${next ? `${lvl}/${next}` : "MAX"}</span>
    </div>
    <small>${mult ? `×${mult.toLocaleString("fr-FR")} à chaque palier` : "Sans bonus de palier"}</small>`;
}

function upgradeRow(k, s) {
  const u = upgrades[k];
  const why = blockedReason(k);
  const q = quote(k, s.buyMode);
  const label = { max: "MAX", soon: "Bientôt", locked: "Verrouillé" }[why];
  const note = why === "locked" ? `<small class="lock">Débloqué : ${u.unlockLabel}</small>` : "";
  const img = `${import.meta.env.BASE_URL}${u.image}`;
  return `<div class="row col upgrade ${why ?? ""}">
    <div class="uhead">
      <div class="uicon"><img src="${img}" alt="" draggable="false" onerror="this.remove()" /></div>
      <div><b>${u.name}</b> <small>${u.maxLevel > 1 ? `niv ${level(k)}/${u.maxLevel}` : level(k) ? "acquis" : ""}</small><br><small>${u.effect}</small><br>${note}</div>
    </div>
    ${u.maxLevel > 1 ? progressBar(k, level(k), u.maxLevel) : ""}
    <button data-action="buy" data-key="${k}" ${q.ok ? "" : "disabled"}>${label ?? `Acheter ×${q.count} — ${money(q.cost)}`}</button>
  </div>`;
}

// Case d'équipe façon écran "Pokémon" : coins coupés en escalier, nom, niveau, barre d'EXP.
function teamSlot(mon, i) {
  if (!mon) return `<div class="slot empty"><div class="slot-in"><span class="slot-empty">Emplacement libre</span></div></div>`;
  const need = expToNext(mon.level);
  const dps = pokemonDps(mon.level, POKEMON[mon.id].bst);
  return `<div class="slot"><div class="slot-in">
    <div class="slot-sprite">${sprite(mon.id)}</div>
    <div class="slot-info">
      <div class="slot-top"><b>${POKEMON[mon.id].name}</b><button class="slot-btn" data-action="toBox" data-i="${i}" title="Envoyer dans la boîte">Boîte</button></div>
      <div class="slot-bar"><i>EXP</i><div class="slot-track"><div class="slot-fill" style="width:${Math.min(100, (mon.exp / need) * 100)}%"></div></div></div>
      <div class="slot-bot"><span class="lv">Niv. ${mon.level}</span><span>${mon.exp.toLocaleString("fr-FR")}/${need.toLocaleString("fr-FR")}</span><span>${fmt(dps)} dgt/s</span></div>
    </div>
  </div></div>`;
}

const monRow = (mon, button) => {
  const need = expToNext(mon.level);
  return `<div class="row"><div>${sprite(mon.id)} ${POKEMON[mon.id].name}<br><small>Niv. ${mon.level} · EXP ${mon.exp}/${need}</small></div>${button}</div>`;
};

// Liste des Pokémon du palier en cours : capturé, vu ou inconnu.
function wildMons(s) {
  const pos = s.mode === "wild" ? s.wild : s.story;
  const rows = palierMons(pos.zone, pos.palier)
    .map((m) => {
      const d = s.dex[m.id];
      return `<div class="row"><div>${sprite(m.id, d?.caught ? "" : "silhouette")} ${d?.seen ? POKEMON[m.id].name : "???"}</div><small>${m.rarete}${d?.caught ? " · capturé" : ""}</small></div>`;
    })
    .join("");
  return `<h3>Pokémon de ce palier</h3>${rows}`;
}

function adventureView(s) {
  const mode = (id, label) =>
    `<button data-action="setMode" data-mode="${id}" class="${s.mode === id ? "on" : ""}" ${modes[id].available ? "" : "disabled"}>${label}</button>`;
  const st = s.story;
  const z = ZONES[st.zone];
  const unlocked = unlockedPaliers(s);
  const byZone = {};
  unlocked.forEach((u) => (byZone[u.zone] ??= []).push(u));
  const wildList = Object.entries(byZone)
    .map(
      ([zone, list]) => `<small>Zone ${ZONES[zone].zone} — ${ZONES[zone].nom}</small>
      <div class="modes col">${list
        .map((u) => {
          const on = s.mode === "wild" && s.wild.zone === u.zone && s.wild.palier === u.palier;
          const mons = palierMons(u.zone, u.palier);
          const got = mons.filter((m) => s.dex[m.id]?.caught).length;
          return `<button data-action="wild" data-zone="${u.zone}" data-palier="${u.palier}" class="${on ? "on" : ""}">${ZONES[u.zone].paliers[u.palier - 1].lieu} <small>${got}/${mons.length}</small></button>`;
        })
        .join("")}</div>`
    )
    .join("");
  const story = st.done
    ? "Histoire terminée : tu farmes la dernière étape."
    : st.step === 5 && st.bossFailed
      ? "Le boss t'attend : farme pour devenir plus fort, puis défie-le."
      : `Prochain boss à l'étape 5-${st.palier}.`;
  return `
    <h3>Mode de jeu</h3>
    <div class="modes col">${mode("story", "Histoire")}${mode("wild", "Herbes sauvages")}${mode("arena", "Arène (bientôt)")}</div>
    <h3>Histoire</h3>
    <p>Zone ${z.zone} — ${z.nom}<br><small>Palier ${st.palier} : ${z.paliers[st.palier - 1].lieu} · étape ${st.step}-${st.palier}</small><br><small>${story}</small></p>
    <h3>Herbes sauvages</h3>
    ${wildList || "<p>Aucun palier débloqué.</p>"}
    ${wildMons(s)}
    <h3>Rencontres légendaires</h3>
    ${s.legends.length ? s.legends.map((l) => `<p>${POKEMON[l.id].name} Niv. ${l.level} : disponible, bouton sous le Pokémon.</p>`).join("") : "<p><small>Bats certains boss pour en débloquer.</small></p>"}`;
}

const views = {
  hero: (s) => `${buyModes(s)}${Object.keys(upgrades).map((k) => upgradeRow(k, s)).join("")}`,

  team: (s) => `
    <h3>Équipe ${s.team.length}/${MAX_TEAM} <small>(${fmt(teamDps())} dégâts/s)</small></h3>
    <div class="slots">${Array.from({ length: MAX_TEAM }, (_, i) => teamSlot(s.team[i], i)).join("")}</div>
    <h3>Boîte (${s.box.length})</h3>
    ${s.box.map((mon, i) => monRow(mon, `<button data-action="toTeam" data-i="${i}" ${s.team.length >= MAX_TEAM ? "disabled" : ""}>Ajouter</button>`)).join("") || "<p>Vide.</p>"}`,

  bag: (s) => `
    <div class="row"><div>${pokeballIcon()} ${shop.balls.pokeball.name}</div><b>×${s.pokeballs}</b></div>`,

  shop: (s) => `
    ${buyModes(s)}
    <div class="row col"><div><b>${shop.balls.pokeball.name}</b><br><small>${money(shop.balls.pokeball.baseCost)} l'unité</small></div>
    ${buyBtn("buyBalls", quoteBalls(s.buyMode))}</div>`,

  adventure: adventureView,

  dex: (s) => {
    const ids = Object.keys(POKEMON).sort((a, b) => a - b);
    const seen = ids.filter((id) => s.dex[id]?.seen).length;
    const caught = ids.filter((id) => s.dex[id]?.caught).length;
    return `<p>Vus : ${seen}/${ids.length} · Capturés : ${caught}/${ids.length}</p>
      <div class="dex">${ids
        .map((id) => {
          const d = s.dex[id];
          return `<div class="dexcell">${sprite(id, d?.caught ? "" : "silhouette")}<small>${d?.seen ? POKEMON[id].name : "???"}</small></div>`;
        })
        .join("")}</div>`;
  },

  card: (s) => `
    <table class="stats">
      <tr><td>PokéDollars</td><td>${money(s.money)}</td></tr>
      <tr><td>Badges</td><td>${s.badges}</td></tr>
      <tr><td>Dégâts par clic</td><td>${clickDamage().toLocaleString("fr-FR")}</td></tr>
      <tr><td>Dégâts par seconde</td><td>${fmt(teamDps())}</td></tr>
      <tr><td>Clics</td><td>${s.stats.clicks.toLocaleString("fr-FR")}</td></tr>
      <tr><td>Pokémon vaincus</td><td>${s.stats.kills.toLocaleString("fr-FR")}</td></tr>
      <tr><td>Pokémon capturés</td><td>${s.stats.captures}</td></tr>
    </table>`,

  options: () => `<button data-action="reset" class="danger">Réinitialiser la sauvegarde</button>`,
};

export function panelHTML(tab, s) {
  const t = TABS.find((x) => x.id === tab);
  return `<h2>${t.label}</h2>${views[tab](s)}`;
}
