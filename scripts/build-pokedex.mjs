// Génère src/data/gen<N>/pokedex.json depuis PokeAPI. À lancer à la main, une seule fois par génération :
//   node scripts/build-pokedex.mjs --gen 1
//   node scripts/build-pokedex.mjs --from 152 --to 251 --out src/data/gen2/pokedex.json
// Les réponses de l'API sont gardées dans scripts/.cache/ : relancer le script ne refait pas les requêtes.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "scripts", ".cache");
const API = "https://pokeapi.co/api/v2";

// Plages d'identifiants par génération.
const GENERATIONS = { 1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493], 5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025] };

const TYPES_FR = {
  normal: "Normal", fighting: "Combat", flying: "Vol", poison: "Poison", ground: "Sol", rock: "Roche", bug: "Insecte", ghost: "Spectre",
  steel: "Acier", fire: "Feu", water: "Eau", grass: "Plante", electric: "Électrik", psychic: "Psy", ice: "Glace", dragon: "Dragon", dark: "Ténèbres", fairy: "Fée",
};

const STAT_KEYS = { hp: "pv", attack: "attaque", defense: "defense", "special-attack": "atq_spe", "special-defense": "def_spe", speed: "vitesse" };

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const gen = arg("gen");
let [from, to] = gen ? GENERATIONS[gen] ?? [] : [Number(arg("from")), Number(arg("to"))];
if (!from || !to) {
  console.error("Usage : node scripts/build-pokedex.mjs --gen 1   |   --from 152 --to 251 [--out chemin.json]");
  process.exit(1);
}
const out = arg("out") ?? path.join(ROOT, "src", "data", `gen${gen ?? "X"}`, "pokedex.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Requête avec cache disque, nouvelles tentatives et petite pause pour ménager l'API.
async function getJson(url) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, crypto.createHash("md5").update(url).digest("hex") + ".json");
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "pokeclicker-build-pokedex/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
      const data = await res.json();
      fs.writeFileSync(file, JSON.stringify(data));
      await sleep(120);
      return data;
    } catch (e) {
      lastError = e;
      await sleep(800 * (attempt + 1));
    }
  }
  throw lastError;
}

const idFromUrl = (url) => Number(url.split("/").filter(Boolean).pop());
const fr = (list) => list.find((x) => x.language.name === "fr");
const clean = (text) => text.replace(/[\n\f­]+/g, " ").replace(/\s+/g, " ").trim();

// Arbre d'évolution : { id, evolvesTo: [ ... ] }
const tree = (node) => ({ id: idFromUrl(node.species.url), evolvesTo: node.evolves_to.map(tree) });

async function build(id) {
  const [p, s] = await Promise.all([getJson(`${API}/pokemon/${id}`), getJson(`${API}/pokemon-species/${id}`)]);
  const chain = await getJson(s.evolution_chain.url);
  const flavor = s.flavor_text_entries.find((e) => e.language.name === "fr");
  const stats = {};
  for (const st of p.stats) stats[STAT_KEYS[st.stat.name]] = st.base_stat;
  return {
    id,
    nom: fr(s.names)?.name ?? p.name,
    categorie: fr(s.genera)?.genus ?? "",
    types: p.types.sort((a, b) => a.slot - b.slot).map((t) => TYPES_FR[t.type.name]),
    taille: p.height / 10, // décimètres -> mètres
    poids: p.weight / 10, // hectogrammes -> kilogrammes
    description: flavor ? clean(flavor.flavor_text) : "",
    stats_base: stats,
    evolutions: tree(chain.chain),
  };
}

const ids = Array.from({ length: to - from + 1 }, (_, i) => from + i);
const result = {};
let done = 0;
// 4 requêtes en parallèle au maximum
const queue = [...ids];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const id = queue.shift();
      result[id] = await build(id);
      if (++done % 20 === 0 || done === ids.length) console.log(`${done}/${ids.length}`);
    }
  })
);

const sorted = Object.fromEntries(ids.map((id) => [id, result[id]]));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(sorted, null, 1) + "\n");
console.log(`${ids.length} Pokémon écrits dans ${path.relative(ROOT, out)}`);
