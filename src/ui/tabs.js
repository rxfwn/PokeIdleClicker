import { $ } from "./dom.js";

export const TABS = [
  { id: "hero", label: "Héros", color: "#c23b3b", on: "#fff" }, // rouge
  { id: "team", label: "Équipe", color: "#3f9c52", on: "#fff" }, // vert
  { id: "bag", label: "Sac", color: "#d9a521", on: "#1a1a2a" }, // jaune
  { id: "shop", label: "Shop", color: "#e07a2e", on: "#fff" }, // orange (7e onglet)
  { id: "adventure", label: "Aventure", color: "#2a9d9d", on: "#fff" }, // turquoise
  { id: "dex", label: "Pokédex", color: "#8450b8", on: "#fff" }, // violet
  { id: "card", label: "Carte dresseur", color: "#3f68c9", on: "#fff" }, // bleu
  { id: "options", label: "Options", color: "#4b4b5c", on: "#fff" }, // gris foncé
];

// Un onglet est toujours ouvert : le panneau ne se ferme jamais.
let active = "hero";
export const activeTab = () => active;

// onChange est appelé quand l'onglet ouvert change.
export function initTabs(onChange) {
  const nav = $("tabs");
  nav.innerHTML = TABS.map(
    (t, i) => `<button class="tab" data-tab="${t.id}" style="--c:${t.color};--i:${i}" title="${t.label}" aria-label="${t.label}"><span class="tab-shape"><img src="${import.meta.env.BASE_URL}menu/${t.id}.png?v=2" alt="" draggable="false" /></span></button>`
  ).join("");

  const refresh = () =>
    nav.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === active));

  nav.addEventListener("click", (ev) => {
    const b = ev.target.closest(".tab");
    if (!b || b.dataset.tab === active) return;
    active = b.dataset.tab;
    refresh();
    onChange(active);
  });
  refresh();
}
