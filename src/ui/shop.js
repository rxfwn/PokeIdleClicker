import upgrades from "../data/upgrades.json";
import { buyUpgrade, buyPokeball, upgradeCost } from "../game/economy.js";

export function renderShop(el, state) {
  const items = ["clickDamage", "moneyBonus"].map(
    (k) =>
      `<button data-up="${k}">${upgrades[k].name} (niv ${state.upgrades[k]}) — ${upgradeCost(k)}💰</button>`
  );
  items.push(`<button data-ball>${upgrades.pokeball.name} — ${upgrades.pokeball.baseCost}💰</button>`);
  el.innerHTML = items.join("");
  el.querySelectorAll("[data-up]").forEach((b) => (b.onclick = () => buyUpgrade(b.dataset.up)));
  el.querySelector("[data-ball]").onclick = buyPokeball;
}
