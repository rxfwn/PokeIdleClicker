import { subscribe, notify, state } from "../core/state.js";
import { reset } from "../core/save.js";
import { buyUpgrade, buyPokeballs } from "../game/economy.js";
import { moveToTeam, moveToBox } from "../game/team.js";
import { tryCapture } from "../game/capture.js";
import { setMode } from "../game/modes/index.js";
import { chooseWild, cycleWild } from "../game/modes/wild.js";
import { challengeBoss } from "../game/modes/story.js";
import { startLegend, fleeLegend } from "../game/legends.js";
import { skillStatus, activateLegend } from "../game/hero.js";
import { $, setHTML } from "./dom.js";
import { money, pokeballIcon } from "./money.js";
import { initBattle, renderBattle, renderBoss, toast } from "./battle.js";
import { initTabs, activeTab, TABS } from "./tabs.js";
import { panelHTML } from "./panels.js";

const actions = {
  buyMode: (d) => {
    state.buyMode = d.mode === "max" ? "max" : Number(d.mode);
    notify();
  },
  buy: (d) => buyUpgrade(d.key, state.buyMode),
  buyBalls: () => buyPokeballs(state.buyMode),
  toTeam: (d) => moveToTeam(Number(d.i)),
  toBox: (d) => moveToBox(Number(d.i)),
  skill: () => activateLegend(),
  setMode: (d) => setMode(d.mode),
  zonePrev: () => cycleWild(-1),
  zoneNext: () => cycleWild(1),
  wild: (d) => chooseWild(Number(d.zone), Number(d.palier)),
  capture: () => {
    const r = tryCapture();
    if (r) toast(r.ok ? "Capturé !" : "Raté…");
  },
  challenge: () => challengeBoss(),
  legendStart: (d) => startLegend(d.key),
  legendFlee: () => fleeLegend(),
  reset: () => confirm("Effacer toute ta progression ?") && reset(),
};

export function initUI() {
  initBattle();
  initTabs(renderPanel);
  for (const id of ["panel", "skill", "actions", "zone-label"]) {
    $(id).addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-action]");
      if (b && !b.disabled) actions[b.dataset.action](b.dataset);
    });
  }
  setInterval(() => {
    renderSkill();
    renderBoss();
  }, 250);
  subscribe(render);
  render(state);
}

function renderPanel() {
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
