import { POKEMON, backgroundFor, spriteSrc } from "../data/index.js";
import types from "../data/types.json";
import { click } from "../game/combat.js";
import { canCapture } from "../game/capture.js";
import { bossInfo } from "../game/modes/story.js";
import { locationInfo, palierMons, ordinal } from "../game/progress.js";
import { wildNav } from "../game/modes/wild.js";
import { $, setHTML } from "./dom.js";

export { spriteSrc };

export const typeBadges = (id) =>
  `<div class="types">${(POKEMON[id].types ?? [])
    .map((t) => `<img class="type" src="${import.meta.env.BASE_URL}${types[t].image}" alt="${types[t].label}" title="${types[t].label}" draggable="false" />`)
    .join("")}</div>`;

const KIND_LABEL = { boss: "Boss", champion: "Champion d'arène", league: "Conseil 4 / Champion", legend: "Légendaire" };
const fmt = (n) => n.toLocaleString("fr-FR");

export function initBattle() {
  $("battle").innerHTML = `
    <div id="boss-bar"></div>
    <div id="scene">
      <div id="enemy-wrap"><img id="enemy-img" class="sprite enemy" draggable="false" alt="" /></div>
    </div>
    <div class="hpbar"><div id="hp-fill"></div></div>
    <div id="enemy-name"></div>
    <div id="enemy-types"></div>
    <div id="enemy-hp"></div>
    <div id="actions"></div>`;

  $("enemy-img").addEventListener("click", (ev) => {
    const { damage, crit } = click();
    playHit();
    floatDamage(damage, crit, ev);
  });
}

export function renderBattle(s) {
  const e = s.enemy;
  const loc = locationInfo(s);
  const pos = s.mode === "wild" ? s.wild : s.story;
  $("battle").hidden = !e;

  const bg = backgroundFor(pos.zone, pos.palier);
  const url = `url(${import.meta.env.BASE_URL}${bg.image})`;
  if ($("stage").style.getPropertyValue("--scene-bg") !== url) {
    $("stage").style.setProperty("--scene-bg", url);
    $("stage").style.setProperty("--scene-ratio", bg.ratio);
    $("stage").style.setProperty("--scene-offset", `${bg.offset}px`);
  }

  const nav = wildNav();
  // un point par palier de la zone : courant, débloqué (cliquable) ou verrouillé
  const dots = Array.from({ length: 5 }, (_, i) => {
    const p = i + 1;
    const open = ordinal(pos.zone, p, 1) <= s.storyBest;
    const cls = p === pos.palier ? "cur" : open ? "open" : "";
    return `<button class="dot ${cls}" ${open ? `data-action="wild" data-zone="${pos.zone}" data-palier="${p}"` : "disabled"} title="Palier ${p}" aria-label="Palier ${p}"></button>`;
  }).join("");
  setHTML(
    $("zone-label"),
    `<button class="arrow left" data-action="zonePrev" ${nav.canPrev ? "" : "disabled"} title="Palier précédent" aria-label="Palier précédent"></button>
     <div class="zl-text"><b>${loc.zoneName}</b><div class="dots">${dots}</div><small>${loc.lieu}</small><span>${s.mode === "wild" ? "Herbes sauvages" : loc.stepLabel}</span></div>
     <button class="arrow right" data-action="zoneNext" ${nav.canNext ? "" : "disabled"} title="Palier suivant" aria-label="Palier suivant"></button>`
  );
  renderZoneDex(s, pos);
  if (!e) return;

  const src = spriteSrc(e.id);
  const img = $("enemy-img");
  if (img.getAttribute("src") !== src) img.src = src;
  $("hp-fill").style.width = `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;
  $("enemy-name").textContent = `${POKEMON[e.id].name} Niv. ${e.level}`;
  setHTML($("enemy-types"), typeBadges(e.id));
  $("enemy-hp").textContent = `${fmt(Math.max(0, Math.ceil(e.hp)))}/${fmt(e.maxHp)} PV`;

  renderActions(s);
  renderBoss();
}

// En haut à droite : combien de Pokémon du palier en cours sont capturés.
function renderZoneDex(s, pos) {
  const mons = palierMons(pos.zone, pos.palier);
  const got = mons.filter((m) => s.dex[m.id]?.caught).length;
  setHTML($("zone-dex"), `<b>Capturés ${got}/${mons.length}</b>`);
}

// Bandeau du boss (nom, Pokémon restants) et barre du temps : rafraîchi aussi toutes les 250 ms.
export function renderBoss() {
  const b = bossInfo();
  const legend = !b && $("battle").dataset.legend;
  if (!b) return setHTML($("boss-bar"), legend ? `<b>${legend}</b>` : "");
  const pct = (b.secondsLeft / b.limit) * 100;
  setHTML(
    $("boss-bar"),
    `<b>${KIND_LABEL[b.kind]} · ${b.name}</b>
     <small>${b.trainers > 1 ? `Dresseur ${b.trainer}/${b.trainers} · ` : ""}Pokémon ${b.mon}/${b.monCount}</small>
     <div class="timer"><div class="timer-fill ${pct < 25 ? "low" : ""}" style="width:${pct}%"></div><span>${Math.ceil(b.secondsLeft)} s</span></div>`
  );
}

function renderActions(s) {
  const e = s.enemy;
  $("battle").dataset.legend = s.legendFight ? KIND_LABEL.legend : "";
  const out = [];
  if (canCapture(e)) {
    out.push(
      s.pokeballs > 0
        ? `<button data-action="capture">Lancer une Poké Ball (${s.pokeballs})</button>`
        : `<button disabled>Plus de Poké Ball</button>`
    );
  }
  if (s.legendFight) out.push(`<button data-action="legendFlee">Fuir</button>`);
  else {
    const st = s.story;
    if (s.mode === "wild") out.push(`<button data-action="setMode" data-mode="story">Reprendre l'histoire</button>`);
    if (s.mode === "story" && st.step === 5 && st.bossFailed && !st.done) {
      out.push(`<button data-action="challenge">Défier le boss</button>`);
    }
    for (const l of s.legends) {
      out.push(`<button data-action="legendStart" data-key="${l.key}">Affronter ${POKEMON[l.id].name} Niv. ${l.level}</button>`);
    }
  }
  setHTML($("actions"), out.join(""));
}

export function toast(text) {
  const el = document.createElement("span");
  el.className = "toast";
  el.textContent = text;
  el.addEventListener("animationend", () => el.remove());
  $("scene").appendChild(el);
}

function playHit() {
  const img = $("enemy-img");
  img.classList.remove("hit");
  void img.offsetWidth; // relance l'animation
  img.classList.add("hit");
}

function floatDamage(dmg, crit, ev) {
  const wrap = $("enemy-wrap");
  const r = wrap.getBoundingClientRect();
  const el = document.createElement("span");
  el.className = crit ? "dmg crit" : "dmg";
  el.textContent = `-${fmt(dmg)}${crit ? "!" : ""}`;
  el.style.left = `${ev.clientX - r.left + (Math.random() * 30 - 15)}px`;
  el.style.top = `${ev.clientY - r.top - 10}px`;
  el.addEventListener("animationend", () => el.remove());
  wrap.appendChild(el);
}
