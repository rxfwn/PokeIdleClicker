import { subscribe, notify, state } from "../core/state.js";
import { reset } from "../core/save.js";
import { buyUpgrade } from "../game/economy.js";
import { buyItem, sellItem, useItem, useCandy, equip } from "../game/items.js";
import { buffActive } from "../game/inventory.js";
import { moveToTeam, moveToBox } from "../game/team.js";
import { beginCapture, endCapture } from "../game/capture.js";
import { playCapture } from "./captureAnim.js";
import { setMode } from "../game/modes/index.js";
import { chooseWild, cycleWild, cycleZone } from "../game/modes/wild.js";
import { challengeBoss } from "../game/modes/story.js";
import { startLegend, fleeLegend } from "../game/legends.js";
import { skillStatus, activateLegend } from "../game/hero.js";
import { $, setHTML } from "./dom.js";
import { money, pokeballIcon } from "./money.js";
import { initBattle, renderBattle, renderBoss, refreshActions } from "./battle.js";
import { initTabs, activeTab, TABS } from "./tabs.js";
import { panelHTML } from "./panels.js";
import { openDexCard, initDexCard } from "./dexView.js";

const actions = {
  buyMode: (d) => {
    state.buyMode = d.mode === "max" ? "max" : Number(d.mode);
    notify();
  },
  buy: (d) => buyUpgrade(d.key, state.buyMode),
  buyItem: (d) => buyItem(d.id, state.buyMode),
  sellItem: (d) => sellItem(d.id),
  useItem: (d) => useItem(d.id),
  candyChoose: (d) => {
    state.useItem = d.id;
    notify();
  },
  candyGive: (d) => useCandy(state.useItem, d.list, Number(d.i)),
  candyCancel: () => {
    state.useItem = null;
    notify();
  },
  toTeam: (d) => moveToTeam(Number(d.i)),
  toBox: (d) => moveToBox(Number(d.i)),
  skill: () => activateLegend(),
  setMode: (d) => setMode(d.mode),
  zonePrev: () => cycleWild(-1),
  zoneNext: () => cycleWild(1),
  zonePrevZone: () => cycleZone(-1),
  zoneNextZone: () => cycleZone(1),
  wild: (d) => chooseWild(Number(d.zone), Number(d.palier)),
  capture: (d) => {
    const r = beginCapture(d.ball); // la ball est lancée : le résultat s'applique à la fin de l'animation
    if (r) playCapture(r, () => endCapture(r));
  },
  challenge: () => challengeBoss(),
  legendStart: (d) => startLegend(d.key),
  legendFlee: () => fleeLegend(),
  dexOpen: (d) => openDexCard(Number(d.id)),
  reset: () => confirm("Effacer toute ta progression ?") && reset(),
};

export function initUI() {
  initBattle();
  initDexCard();
  initTabs(renderPanel);
  for (const id of ["panel", "skill", "actions", "zone-label"]) {
    $(id).addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-action]");
      if (b && !b.disabled) actions[b.dataset.action](b.dataset);
    });
  }
  $("panel").addEventListener("change", (ev) => {
    const hold = ev.target.closest("select[data-hold]");
    if (hold) {
      hold.blur();
      return equip(Number(hold.dataset.hold), hold.value || null);
    }
    const sel = ev.target.closest("select[data-filter]");
    if (!sel) return;
    state.filters[sel.dataset.filter] = sel.value;
    sel.blur();
    notify();
  });
  setInterval(() => {
    renderSkill();
    renderBoss();
    refreshActions();
    if (activeTab() === "bag" && ["click", "team", "speed", "crit", "repel", "lure"].some((k) => buffActive(k))) renderPanel(); // compte à rebours des effets
  }, 250);
  subscribe(render);
  render(state);
}

function renderPanel() {
  if (document.activeElement?.matches?.("#panel select")) return; // ne pas fermer une liste ouverte
  const tab = activeTab();
  const t = TABS.find((x) => x.id === tab);
  $("panel").style.setProperty("--c", t.color);
  $("panel").style.setProperty("--on", t.on);
  $("panel").style.setProperty("--pd", t.on === "#fff" ? "invert(1)" : "none"); // icône ₽ blanche ou noire
  setHTML($("panel"), panelHTML(tab, state));
}

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

function renderSkill() {
  const st = skillStatus();
  const label = !st ? "" : st.activeLeft ? `Légende Vivante : ×10 (${st.activeLeft}s)` : st.cooldownLeft ? `Légende Vivante : recharge ${clock(st.cooldownLeft)}` : "Légende Vivante : activer";
  setHTML($("skill"), st ? `<button data-action="skill" ${st.activeLeft || st.cooldownLeft ? "disabled" : ""}>${label}</button>` : "");
}

function render(s) {
  setHTML($("topbar"), `<span>${money(s.money)}</span> <span>${pokeballIcon()} ${s.pokeballs}</span>`);
  renderBattle(s);
  renderPanel();
  renderSkill();
}

// Message affiché au retour : ce que l'équipe a gagné pendant l'absence.
export function showOffline(info) {
  const h = Math.floor(info.seconds / 3600);
  const m = Math.floor((info.seconds % 3600) / 60);
  const modal = $("modal");
  modal.hidden = false;
  modal.innerHTML = `<div class="modal-box">
    <h2>Bon retour !</h2>
    <p>Pendant ton absence (${h ? `${h} h ` : ""}${m} min${info.capped ? ", plafonné à 8 h" : ""}), ton équipe a vaincu ${info.kills.toLocaleString("fr-FR")} Pokémon.</p>
    <p>${money(info.money)} · ${info.exp.toLocaleString("fr-FR")} EXP par Pokémon</p>
    <button id="modal-ok">OK</button>
  </div>`;
  $("modal-ok").onclick = () => (modal.hidden = true);
}
