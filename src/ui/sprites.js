// Affichage des sprites en pixel art net : les sprites sont rognés à leur contenu (sw × sh dans pokemon.json)
// et agrandis d'un facteur ENTIER, le plus grand qui tient dans la boîte (au plus `cap`).
// Un sprite plus grand que la boîte est réduit au lieu de déborder.
import { POKEMON, getSprite } from "../data/index.js";

// Boîtes [largeur, hauteur, facteur max] selon l'endroit où le sprite est affiché.
export const BOX = {
  enemy: [330, 250, 4],
  slot: [92, 86, 3],
  row: [92, 60, 2],
  cell: [86, 92, 2],
  card: [190, 170, 3],
  evo: [92, 70, 2],
};

export function spriteDims(id, box) {
  const [bw, bh, cap] = BOX[box] ?? box;
  const w = POKEMON[id]?.sw ?? 96;
  const h = POKEMON[id]?.sh ?? 96;
  const fit = Math.min(bw / w, bh / h);
  const k = fit >= 1 ? Math.min(cap, Math.floor(fit)) : fit;
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

export function spriteImg(id, box, { cls = "", silhouette = false, shiny = false } = {}) {
  const { w, h } = spriteDims(id, box);
  return `<img class="sprite ${cls} ${silhouette ? "silhouette" : ""}" src="${getSprite(id, { shiny })}" width="${w}" height="${h}" alt="${POKEMON[id]?.name ?? ""}" draggable="false" />`;
}
