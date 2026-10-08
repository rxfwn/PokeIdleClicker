import { POKEMON, ZONES } from "../data/index.js";
import { spriteImg } from "./sprites.js";
import upgrades from "../data/upgrades.json";
import shop from "../data/shop.json";
import { expToNext, pokemonDps } from "../data/balance.js";
import { MAX_TEAM } from "../core/state.js";
import { TEAM_SLOT_UNLOCKS } from "../data/balance.js";
import { teamSlots, slotUnlocked } from "../game/team.js";
import { quote as upgradeQuote, blockedReason } from "../game/economy.js";
import { ITEMS, qty, holdableItems, buffLeft } from "../game/inventory.js";
import { quote as itemQuote, blocked, sellPrice, isUsable, canUse } from "../game/items.js";
import { teamDps, clickDamage, level, milestones } from "../game/hero.js";
import { modes } from "../game/modes/index.js";
import { unlockedPaliers, palierMons } from "../game/progress.js";
import { isSeen, isCaught } from "../game/dex.js";
import { money } from "./money.js";
import { TABS } from "./tabs.js";
import { dexView } from "./dexView.js";

const sprite = (id, box, cls = "") => spriteImg(id, box, { silhouette: cls === "silhouette" });

const buyModes = (s) =>
  `<div class="modes">${[1, 10, "max"]
    .map((m) => `<button data-action="buyMode" data-mode="${m}" class="${s.buyMode === m ? "on" : ""}">${m === "max" ? "XMAX" : "X" + m}</button>`)
    .join("")}</div>`;

const buyBtn = (action, q, attrs = "") =>
  `<button data-action="${action}" ${attrs} ${q.ok ? "" : "disabled"}>Acheter ×${q.count} — ${money(q.cost)}</button>`;

// Menu déroulant de filtre par catégorie (Sac et Shop).
const filterSelect = (name, s) =>
  `<select class="filter" data-filter="${name}" aria-label="Filtrer par catégorie">${shop.categories
    .map((c) => `<option value="${c.id}" ${s.filters[name] === c.id ? "selected" : ""}>${c.label}</option>`)
    .join("")}</select>`;

const inCategory = (id, cat) => cat === "all" || ITEMS[id].category === cat;
// Image d'un objet (data/shop.json), sans cadre ; absente si le fichier manque.
const itemIcon = (id, big = false) =>
  `<img class="item-icon${big ? " big" : ""}" src="${import.meta.env.BASE_URL}${ITEMS[id].image}" alt="" draggable="false" onerror="this.remove()" />`;
const empty = "<p><small>Aucun objet dans cette catégorie.</small></p>";

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
  const q = upgradeQuote(k, s.buyMode);
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

// Objet tenu : un par Pokémon de l'équipe, échangeable à tout moment.
function holdSelect(mon, i) {
  const ids = holdableItems().filter((id) => id === mon.held || qty(id) > 0);
  const opts = ids.map((id) => `<option value="${id}" ${id === mon.held ? "selected" : ""}>${ITEMS[id].name}</option>`).join("");
  return `<label class="slot-hold">Objet <select class="filter" data-hold="${i}" aria-label="Objet tenu"><option value="">—</option>${opts}</select></label>`;
}

// Case d'équipe façon écran "Pokémon" : coins coupés en escalier, nom, niveau, barre d'EXP.
function teamSlot(mon, i) {
  if (!mon && !slotUnlocked(i) && i >= teamSlots()) {
    const u = TEAM_SLOT_UNLOCKS[i];
    return `<div class="slot locked"><div class="slot-in"><span class="slot-empty">Verrouillé · zone ${u.zone}${u.palier > 1 ? `, palier ${u.palier}` : ""}</span></div></div>`;
  }
  if (!mon) return `<div class="slot empty"><div class="slot-in"><span class="slot-empty">Emplacement libre</span></div></div>`;
  const need = expToNext(mon.level);
  const dps = pokemonDps(mon.level, POKEMON[mon.id].bst);
  return `<div class="slot"><div class="slot-in">
    <div class="slot-sprite">${sprite(mon.id, "slot")}</div>
    <div class="slot-info">
      <div class="slot-top"><b>${POKEMON[mon.id].name}</b><button class="slot-btn" data-action="toBox" data-i="${i}" title="Envoyer dans la boîte">Boîte</button></div>
      <div class="slot-bar"><i>EXP</i><div class="slot-track"><div class="slot-fill" style="width:${Math.min(100, (mon.exp / need) * 100)}%"></div></div></div>
      <div class="slot-bot"><span class="lv">Niv. ${mon.level}</span><span>${mon.exp.toLocaleString("fr-FR")}/${need.toLocaleString("fr-FR")}</span><span>${fmt(dps)} dgt/s</span></div>
      ${holdSelect(mon, i)}
    </div>
  </div></div>`;
}

const monRow = (mon, button) => {
  const need = expToNext(mon.level);
  return `<div class="row"><div class="mon">${sprite(mon.id, "row")}<span>${POKEMON[mon.id].name}<br><small>Niv. ${mon.level} · EXP ${mon.exp}/${need}</small></span></div>${button}</div>`;
};

// Liste des Pokémon du palier en cours : capturé, vu ou inconnu.
function wildMons(s) {
  const pos = s.mode === "wild" ? s.wild : s.story;
  const rows = palierMons(pos.zone, pos.palier)
    .map((m) => {
      return `<div class="row"><div class="mon">${sprite(m.id, "row", isCaught(m.id) ? "" : "silhouette")}<span>${isSeen(m.id) ? POKEMON[m.id].name : "???"}</span></div><small>${m.rarete}${isCaught(m.id) ? " · capturé" : ""}</small></div>`;
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
          const got = mons.filter((m) => isCaught(m.id)).length;
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

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

// Une ligne du Shop : prix, effet, condition de déblocage, bouton d'achat.
function shopRow(id, s) {
  const it = ITEMS[id];
  const why = blocked(id);
  const q = itemQuote(id, s.buyMode);
  const label = { soon: "Bientôt", locked: "Verrouillé", owned: "Déjà acquis" }[why];
  const lot = it.lot ? ` le lot de ${it.lot}` : "";
  const price = id === "pokeball" ? `${money(q.cost / q.count)} (monte à chaque achat)` : `${money(it.price)}${lot}`;
  const note = why === "locked" ? `<small class="lock">Débloqué : ${it.unlockLabel}</small>` : "";
  const have = qty(id) > 0 ? ` <small>possédé ×${qty(id)}</small>` : "";
  return `<div class="row col upgrade ${why ?? ""}"><div class="uhead item">${itemIcon(id, true)}<div><b>${it.name}</b>${have}<br><small>${it.effect}</small><br><small>Prix : ${price}</small>${note ? `<br>${note}` : ""}</div></div>
    <button data-action="buyItem" data-id="${id}" ${q.ok ? "" : "disabled"}>${label ?? `Acheter ×${q.count} — ${money(q.cost)}`}</button></div>`;
}

const EFFECT_NAMES = { click: "Attaque +", team: "Atq. Spé. +", speed: "Vitesse +", crit: "Muscle +", repel: "Repousse", lure: "Parfum" };

// Effets temporaires en cours, avec le temps restant.
function activeEffects(s) {
  const rows = Object.keys(EFFECT_NAMES)
    .filter((k) => buffLeft(k) > 0)
    .map((k) => `<div class="row"><div>${EFFECT_NAMES[k]}</div><b>${clock(buffLeft(k))}</b></div>`);
  if (s.buffs.honey) rows.push(`<div class="row"><div>Miel</div><b>prochain Pokémon</b></div>`);
  return rows.length ? `<h3>Effets en cours</h3>${rows.join("")}` : "";
}

// Choix du Pokémon qui reçoit un bonbon.
function candyTarget(s) {
  const id = s.useItem;
  const rows = (list, label) =>
    s[list].map((mon, i) => monRow(mon, `<button data-action="candyGive" data-list="${list}" data-i="${i}">Donner</button>`));
  const all = [...rows("team"), ...rows("box")];
  return `<h3>${ITEMS[id].name} ×${qty(id)}</h3><p><small>${ITEMS[id].effect} : choisis un Pokémon.</small></p>
    ${all.join("") || "<p>Aucun Pokémon.</p>"}
    <button data-action="candyCancel" class="danger">Annuler</button>`;
}

function bagRow(id, s) {
  const it = ITEMS[id];
  const btns = [];
  if (isUsable(id)) {
    btns.push(
      it.candy
        ? `<button data-action="candyChoose" data-id="${id}">Utiliser</button>`
        : `<button data-action="useItem" data-id="${id}" ${canUse(id) ? "" : "disabled"}>Utiliser</button>`
    );
  }
  if (sellPrice(id) > 0) btns.push(`<button data-action="sellItem" data-id="${id}">Vendre (${money(sellPrice(id))})</button>`);
  return `<div class="row col upgrade"><div class="uhead item">${itemIcon(id, true)}<div><b>${it.name}</b> <small>×${qty(id)}</small><br><small>${it.effect}</small></div></div>
    ${btns.length ? `<div class="btns">${btns.join("")}</div>` : ""}</div>`;
}

function bagView(s) {
  if (s.useItem && qty(s.useItem) > 0) return candyTarget(s);
  const rows = Object.keys(ITEMS)
    .filter((id) => inCategory(id, s.filters.bag) && qty(id) > 0)
    .map((id) => bagRow(id, s));
  return `${activeEffects(s)}${filterSelect("bag", s)}${rows.join("") || empty}`;
}

const views = {
  hero: (s) => `${buyModes(s)}${Object.keys(upgrades).map((k) => upgradeRow(k, s)).join("")}`,

  team: (s) => `
    <h3>Équipe ${s.team.length}/${teamSlots()} <small>(${fmt(teamDps())} dégâts/s)</small></h3>
    <div class="slots">${Array.from({ length: MAX_TEAM }, (_, i) => teamSlot(s.team[i], i)).join("")}</div>
    <h3>Boîte (${s.box.length})</h3>
    ${s.box.map((mon, i) => monRow(mon, `<button data-action="toTeam" data-i="${i}" ${s.team.length >= teamSlots() ? "disabled" : ""}>Ajouter</button>`)).join("") || "<p>Vide.</p>"}`,

  bag: bagView,

  shop: (s) => {
    const rows = Object.keys(ITEMS)
      .filter((id) => ITEMS[id].price != null && inCategory(id, s.filters.shop))
      .map((id) => shopRow(id, s));
    return `${filterSelect("shop", s)}${buyModes(s)}${rows.join("") || empty}`;
  },

  adventure: adventureView,

  dex: dexView,

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
