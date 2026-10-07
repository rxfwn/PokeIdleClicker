import pokemon from "../data/pokemon.json";
import { subscribe, state } from "../core/state.js";
import { click } from "../game/combat.js";
import { tryCapture } from "../game/capture.js";
import { renderShop } from "./shop.js";

const $ = (id) => document.getElementById(id);

export function initUI() {
  subscribe(render);
  render(state);
}

function render(s) {
  $("topbar").textContent = `💰 ${s.money}   ⚪ ${s.pokeballs}   Zone: ${s.zone}`;

  const e = s.enemy;
  $("battle").innerHTML = e
    ? `<h2>${pokemon[e.id].name}</h2>
       <progress max="${e.maxHp}" value="${Math.max(e.hp, 0)}"></progress>
       <button id="hit">Attaquer</button>
       <button id="catch">Capturer</button>`
    : `<button id="hit">Chercher dans les herbes</button>`;
  $("hit").onclick = click;
  if ($("catch")) $("catch").onclick = tryCapture;

  renderShop($("shop"), s);
  $("team").textContent = "Équipe : " + (s.team.map((id) => pokemon[id].name).join(", ") || "vide");
}
