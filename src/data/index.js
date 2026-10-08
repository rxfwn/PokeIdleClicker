// Point d'entrée des données de jeu. Pour ajouter une génération :
//   1. créer src/data/genN/zones.json et src/data/genN/pokemon.json sur le modèle de gen1,
//   2. les importer ici et les ajouter à GENERATIONS.
import gen1Zones from "./gen1/zones.json" with { type: "json" };
import gen1Pokemon from "./gen1/pokemon.json" with { type: "json" };
import backgrounds from "./backgrounds.json" with { type: "json" };

const GENERATIONS = [{ id: 1, zones: gen1Zones, pokemon: gen1Pokemon }];

// Tous les Pokémon, par numéro de Pokédex national.
export const POKEMON = Object.assign({}, ...GENERATIONS.map((g) => g.pokemon));

// Zones dans l'ordre de l'histoire, toutes générations confondues.
export const ZONES = GENERATIONS.flatMap((g) =>
  g.zones.zones.map((z) => ({ ...z, gen: g.id, region: g.zones.region }))
);

// Poids d'apparition par rareté.
export const RARITIES = Object.assign({}, ...GENERATIONS.map((g) => g.zones.raretes));

export const STEPS_PER_PALIER = 5;
export const PALIERS_PER_ZONE = 5;

// Décor : cherche "gen-zone-palier", puis "gen-zone", puis la valeur par défaut.
export function backgroundFor(zoneIndex, palier) {
  const z = ZONES[zoneIndex];
  const found = backgrounds.zones[`${z.gen}-${z.zone}-${palier}`] ?? backgrounds.zones[`${z.gen}-${z.zone}`];
  return { ...backgrounds.default, ...found };
}

export const spriteSrc = (id) => {
  const s = POKEMON[id]?.sprite ?? "";
  return /^https?:/.test(s) ? s : (import.meta.env?.BASE_URL ?? "/") + s;
};
