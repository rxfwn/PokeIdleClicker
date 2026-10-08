// Écran Pokédex : compteur, filtres, grille et fiche en surimpression.
import { POKEMON, POKEDEX, LOCATIONS, ZONES } from "../data/index.js";
import { spriteImg } from "./sprites.js";
import types from "../data/types.json";
import { pokemonDps } from "../data/balance.js";
import { state } from "../core/state.js";
import { entry, isSeen, isCaught, counts } from "../game/dex.js";
import { heldDpsMult } from "../game/inventory.js";
import { chooseWild } from "../game/modes/wild.js";
import { ordinal } from "../game/progress.js";
import { $ } from "./dom.js";

const ids = () => Object.keys(POKEMON).map(Number).sort((a, b) => a - b);
const pad = (id) => `#${String(id).padStart(3, "0")}`;
const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");

// ---------- Filtres ----------

const STATUS = [["all", "Tous"], ["seen", "Vus"], ["caught", "Capturés"], ["unseen", "Non vus"]];

function zoneOptions() {
  const list = [["all", "Toutes les zones"]];
  for (const z of ZONES) list.push([String(z.zone), `Zone ${z.zone} · ${z.nom}`]);
  list.push(["legend", "Légendaires"]);
  return list;
}

const select = (name, options, value) =>
  `<select class="filter" data-filter="${name}" aria-label="Filtre">${options
    .map(([v, label]) => `<option value="${v}" ${v === value ? "selected" : ""}>${label}</option>`)
    .join("")}</select>`;

// Les filtres de type et de zone ne montrent que des Pokémon déjà vus, pour ne rien révéler.
function visible(id, f) {
  const e = entry(id);
  if (f.status === "seen" && !e.vu) return false;
  if (f.status === "caught" && !e.capture) return false;
  if (f.status === "unseen" && e.vu) return false;
  if (f.type !== "all" && !(e.vu && POKEMON[id].types.includes(f.type))) return false;
  if (f.zone !== "all") {
    const loc = LOCATIONS[id];
    const key = loc.type === "legend" ? "legend" : loc.type === "wild" ? String(loc.zoneNum) : "";
    if (!(e.vu && key === f.zone)) return false;
  }
  return true;
}

// ---------- Écran ----------

function cell(id) {
  const e = entry(id);
  const cls = e.capture ? "got" : e.vu ? "seen" : "unknown";
  const inner = `<small>${pad(id)}</small><div class="dexsprite">${spriteImg(id, "cell", { silhouette: !e.vu })}</div><small>${e.vu ? POKEMON[id].name : "???"}</small>`;
  return e.vu
    ? `<button class="dexcell ${cls}" data-action="dexOpen" data-id="${id}">${inner}</button>`
    : `<div class="dexcell ${cls}">${inner}</div>`;
}

export function dexView(s) {
  const all = ids();
  const c = counts(all);
  const f = { status: s.filters.dexStatus ?? "all", type: s.filters.dexType ?? "all", zone: s.filters.dexZone ?? "all" };
  const shown = all.filter((id) => visible(id, f));
  const typeOptions = [["all", "Tous les types"], ...Object.entries(types).map(([k, t]) => [k, t.label])];
  return `
    <div class="dexcount"><b>Vus ${c.vus} · Capturés ${c.captures} / ${c.total}</b>
      <span class="dexshiny" hidden>Shiny : ${c.vusShiny} vus · ${c.capturesShiny} capturés</span></div>
    ${select("dexStatus", STATUS, f.status)}${select("dexType", typeOptions, f.type)}${select("dexZone", zoneOptions(), f.zone)}
    <div class="dex">${shown.map(cell).join("") || "<p><small>Aucun Pokémon ne correspond.</small></p>"}</div>`;
}

// ---------- Fiche ----------

const badges = (id) =>
  `<div class="types">${POKEMON[id].types
    .map((t) => `<img class="type" src="${import.meta.env.BASE_URL}${types[t].image}" alt="${types[t].label}" title="${types[t].label}" draggable="false" />`)
    .join("")}</div>`;

const STATS = [["pv", "PV"], ["attaque", "Attaque"], ["defense", "Défense"], ["atq_spe", "Atq. Spé."], ["def_spe", "Déf. Spé."], ["vitesse", "Vitesse"]];
// Stat maximale au niveau 100 (31 IV, 252 EV, nature neutre).
const maxStat = (key, base) => (key === "pv" ? 2 * base + 204 : 2 * base + 99);

function statBars(id) {
  const st = POKEDEX[id].stats_base;
  return STATS.map(
    ([k, label]) => `<div class="dc-stat"><span>${label}</span>
      <div class="slot-track"><div class="dc-fill" style="width:${Math.min(100, (st[k] / 255) * 100)}%"></div></div>
      <b>${st[k]}</b><small>max ${maxStat(k, st[k])}</small></div>`
  ).join("");
}

// Où le trouver : zone, palier, lieu, rareté (ou rencontre légendaire / évolution).
function whereHTML(id) {
  const loc = LOCATIONS[id];
  if (loc.type === "evolution") return `<p>S'obtient uniquement par évolution.</p>`;
  const place = `Zone ${loc.zoneNum} · ${loc.zoneNom}<br>Palier ${loc.palier} : ${loc.lieu}`;
  if (loc.type === "legend") {
    return `<p>Rencontre légendaire (niveau ${loc.niveau}), débloquée en battant le boss du palier.<br>${place}</p>`;
  }
  const open = ordinal(loc.zone, loc.palier, 1) <= state.storyBest;
  return `<p>${place}<br>Rareté : <b>${loc.rarete}</b></p>
    <button class="dc-btn" data-card="goto" data-zone="${loc.zone}" data-palier="${loc.palier}" ${open ? "" : "disabled"}>${open ? "Y aller" : "Palier verrouillé"}</button>`;
}

// Mon meilleur exemplaire (équipe ou boîte) : niveau et DPS.
function gameStats(id) {
  const mine = [...state.team.map((m) => ({ m, lieu: "dans l'équipe" })), ...state.box.map((m) => ({ m, lieu: "dans la boîte" }))].filter((x) => x.m.id === id);
  if (!mine.length) return `<p>Aucun exemplaire.</p>`;
  const best = mine.reduce((a, b) => (b.m.level > a.m.level ? b : a));
  const bst = POKEMON[id].bst;
  const dps = pokemonDps(best.m.level, bst) * heldDpsMult(best.m);
  return `<p>Meilleur exemplaire ${best.lieu} (${mine.length} possédé${mine.length > 1 ? "s" : ""})<br>
    Niv. <b>${best.m.level}</b> · DPS actuel <b>${fmt(dps)}</b> · DPS au niv. 100 : ${fmt(pokemonDps(100, bst))}</p>`;
}

// Chaîne d'évolution : chaque Pokémon selon son propre état ; seuls ceux qui existent dans le jeu apparaissent.
// Un Pokémon absent du jeu (Pichu, par exemple) est retiré et ses évolutions remontent d'un cran.
function prune(node) {
  const kids = node.evolvesTo.flatMap(prune);
  return node.id in POKEMON ? [{ id: node.id, evolvesTo: kids }] : kids;
}

function evoNode(node, current) {
  const e = entry(node.id);
  const sprite = spriteImg(node.id, "evo", { silhouette: !e.vu });
  const me = `<div class="evo-me ${node.id === current ? "cur" : ""}">${
    e.vu ? `<button class="evo-btn" data-card="open" data-id="${node.id}" title="${POKEMON[node.id].name}">${sprite}</button>` : sprite
  }<small>${e.vu ? POKEMON[node.id].name : "???"}</small></div>`;
  if (!node.evolvesTo.length) return me;
  return `${me}<span class="evo-arrow"></span><div class="evo-kids">${node.evolvesTo.map((k) => `<div class="evo-row">${evoNode(k, current)}</div>`).join("")}</div>`;
}

function evolutionHTML(id) {
  const roots = prune(POKEDEX[id].evolutions);
  if (roots.every((r) => !r.evolvesTo.length)) return `<p>Aucune évolution.</p>`;
  return roots.map((r) => `<div class="evo-row">${evoNode(r, id)}</div>`).join("");
}

function collectionHTML(id) {
  const e = entry(id);
  const date = e.premiereCapture ? new Date(e.premiereCapture).toLocaleDateString("fr-FR") : "—";
  return `<p>Capturés : <b>${e.nombreCaptures}</b> · Première capture : <b>${date}</b> · Niveau max : <b>${e.niveauMax || "—"}</b></p>`;
}

const mask = "???";

export function cardHTML(id) {
  const e = entry(id);
  const full = e.capture;
  const d = POKEDEX[id];
  return `<div class="dc-box"><div class="dc-in">
    <button class="dc-close" data-card="close" aria-label="Fermer">×</button>
    <div class="dc-head">
      <div class="dc-sprite">${spriteImg(id, "card")}</div>
      <div class="dc-title">
        <small>${pad(id)}</small>
        <h2>${POKEMON[id].name}</h2>
        <small>${full ? d.categorie : mask}</small>
        ${full ? badges(id) : `<small>Types : ${mask}</small>`}
        <div class="dc-shiny" hidden><button data-card="normal" class="on">Normal</button><button data-card="shiny">Shiny</button></div>
      </div>
    </div>
    <h3>Où le trouver</h3>${whereHTML(id)}
    ${
      full
        ? `<div class="dc-two"><p>Taille : <b>${fmt(d.taille)} m</b></p><p>Poids : <b>${fmt(d.poids)} kg</b></p></div>
           <h3>Description</h3><p>${d.description}</p>
           <h3>Stats de base</h3>${statBars(id)}
           <h3>Dans mon équipe</h3>${gameStats(id)}
           <h3>Évolutions</h3>${evolutionHTML(id)}
           <h3>Collection</h3>${collectionHTML(id)}`
        : `<div class="dc-two"><p>Taille : ${mask}</p><p>Poids : ${mask}</p></div>
           <h3>Description</h3><p>${mask}</p><h3>Stats de base</h3><p>${mask}</p><p><small>Capture ce Pokémon pour remplir sa fiche.</small></p>`
    }
  </div></div>`;
}

// ---------- Ouverture / fermeture ----------

let current = null;

export function openDexCard(id) {
  if (!isSeen(id)) return;
  current = id;
  const el = $("dexcard");
  el.innerHTML = cardHTML(id);
  el.hidden = false;
}

export function closeDexCard() {
  current = null;
  $("dexcard").hidden = true;
}

export function initDexCard() {
  const el = $("dexcard");
  el.addEventListener("click", (ev) => {
    if (ev.target === el) return closeDexCard(); // clic à l'extérieur de la fiche
    const b = ev.target.closest("[data-card]");
    if (!b || b.disabled) return;
    const a = b.dataset.card;
    if (a === "close") closeDexCard();
    else if (a === "open") openDexCard(Number(b.dataset.id));
    else if (a === "goto") {
      chooseWild(Number(b.dataset.zone), Number(b.dataset.palier));
      closeDexCard();
    }
    // "normal" / "shiny" : emplacement du futur bouton Normal / Shiny (caché pour l'instant)
  });
  document.addEventListener("keydown", (ev) => ev.key === "Escape" && current !== null && closeDexCard());
}
