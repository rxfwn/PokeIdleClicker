// Point d'entrée des données de jeu. Pour ajouter une génération :
//   1. créer src/data/genN/zones.json et src/data/genN/pokemon.json sur le modèle de gen1,
//   2. les importer ici et les ajouter à GENERATIONS.
import gen1Zones from "./gen1/zones.json" with { type: "json" };
import gen1Pokemon from "./gen1/pokemon.json" with { type: "json" };
import gen1Habitats from "./gen1/habitats.json" with { type: "json" };
import gen1Pokedex from "./gen1/pokedex.json" with { type: "json" };
import backgrounds from "./backgrounds.json" with { type: "json" };

const GENERATIONS = [{ id: 1, zones: gen1Zones, pokemon: gen1Pokemon, habitats: gen1Habitats, pokedex: gen1Pokedex }];

// Tous les Pokémon, par numéro de Pokédex national.
export const POKEMON = Object.assign({}, ...GENERATIONS.map((g) => g.pokemon));

// Fiches du Pokédex (catégorie, taille, poids, description, stats, évolutions), générées par scripts/build-pokedex.mjs.
export const POKEDEX = Object.assign({}, ...GENERATIONS.map((g) => g.pokedex));

// Zones dans l'ordre de l'histoire, toutes générations confondues.
export const ZONES = GENERATIONS.flatMap((g) =>
  g.zones.zones.map((z) => ({ ...z, gen: g.id, region: g.zones.region }))
);

// Poids d'apparition par rareté.
export const RARITIES = Object.assign({}, ...GENERATIONS.map((g) => g.zones.raretes));

// Lieux par habitat (paliers aquatiques, grottes, Parc Safari), toutes générations confondues.
export const HABITATS = { aquatic: [], caves: [], safari: [] };
GENERATIONS.forEach((g) => Object.keys(HABITATS).forEach((k) => HABITATS[k].push(...(g.habitats[k] ?? []))));

export const STEPS_PER_PALIER = 5;
export const PALIERS_PER_ZONE = 5;

// Décor : cherche "gen-zone-palier", puis "gen-zone", puis la valeur par défaut.
export function backgroundFor(zoneIndex, palier) {
  const z = ZONES[zoneIndex];
  const found = backgrounds.zones[`${z.gen}-${z.zone}-${palier}`] ?? backgrounds.zones[`${z.gen}-${z.zone}`];
  return { ...backgrounds.default, ...found };
}

// Sprite d'un Pokémon : une seule fonction pour tous les écrans. { shiny: true } est prêt pour plus tard
// (sprites shiny de PokeAPI, pas encore utilisés dans le jeu).
export function getSprite(id, { shiny = false } = {}) {
  if (shiny) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
  const s = POKEMON[id]?.sprite ?? "";
  return /^https?:/.test(s) ? s : (import.meta.env?.BASE_URL ?? "/") + s;
}

// Où trouver chaque Pokémon : { type: "wild", zone, palier, lieu, rarete } | { type: "legend", ... } | { type: "evolution" }.
export const LOCATIONS = {};
ZONES.forEach((z, zone) =>
  z.paliers.forEach((p) => {
    for (const m of p.pokemon_sauvages) {
      LOCATIONS[m.id] ??= { type: "wild", zone, zoneNum: z.zone, zoneNom: z.nom, palier: p.palier, lieu: p.lieu, rarete: m.rarete };
    }
    if (p.rencontre_legendaire) {
      LOCATIONS[p.rencontre_legendaire.id] = { type: "legend", zone, zoneNum: z.zone, zoneNom: z.nom, palier: p.palier, lieu: p.lieu, rarete: "légendaire", niveau: p.rencontre_legendaire.niveau };
    }
  })
);
// Aucun lieu, aucune rencontre : le Pokémon ne s'obtient que par évolution.
for (const id of Object.keys(POKEMON)) LOCATIONS[id] ??= { type: "evolution" };
