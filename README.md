# PokéClicker

Clicker Pokémon en pixel art, jeu web (Vite + JavaScript).

- **Mode herbes sauvages** : tu joues Sacha, chaque clic blesse le Pokémon rencontré. L'argent sert à améliorer le perso et à acheter des Pokéballs.
- **Capture** : les Pokémon capturés rejoignent l'équipe (6 max) et attaquent automatiquement.
- **Mode histoire** : à venir.

## Lancer le projet

```bash
npm install
npm run dev
```

## Structure et répartition

| Dossier | Contenu | Responsable |
| --- | --- | --- |
| `src/core/`, `src/game/` | état, boucle, sauvegarde, combat, économie, capture, équipe | **Personne 1** (logique) |
| `src/ui/`, `src/style.css`, `index.html` | affichage, boutique, écran d'équipe, animations | **Personne 2** (interface) |
| `src/data/`, `public/sprites/` | `pokemon.json`, `zones.json`, `upgrades.json`, sprites | **Personne 3** (contenu / art) |

Chacun travaille surtout dans son dossier, ce qui évite les conflits git.

### Règles d'interface entre les parties
- La logique (`game/`) ne touche jamais au DOM. Elle modifie `state` puis appelle `notify()`.
- L'UI (`ui/`) lit `state` et appelle les fonctions de `game/`. Elle ne modifie jamais `state` directement.
- Tout le contenu (Pokémon, zones, prix) vit dans `src/data/*.json`, pas dans le code.

## Ajouter du contenu (Personne 3)
1. Dépose le sprite dans `public/sprites/` (ex. `gastly.png`).
2. Ajoute le Pokémon dans `src/data/pokemon.json`.
3. Ajoute-le dans les `spawns` d'une zone de `src/data/zones.json`.

## Workflow git
Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Crédits
Sprites : [PMDCollab](https://sprites.pmdcollab.org), [Pokémon DB](https://pokemondb.net/sprites).
Pokémon est une marque de Nintendo / Game Freak. Projet de fans non commercial.

## Roadmap
- [ ] MVP : clic, argent, buffs, capture, équipe auto, sauvegarde (squelette présent)
- [ ] Sprites affichés dans l'UI
- [ ] Choix de la zone, plus de zones
- [ ] Gestion de la boîte / équipe dans l'UI
- [ ] Mode histoire

## Modes de jeu

- **Histoire** : 9 zones × 5 paliers × 5 étapes (affichées "étape-palier", ex. 3-2). L'étape 5 est un boss avec un minuteur ; s'il n'est pas battu à temps, on farme puis on le redéfie. Mini-boss (paliers 1-4), champion d'arène (palier 5), Conseil 4 + Champion pour la Ligue.
- **Herbes sauvages** : on farme un palier déjà débloqué, argent et EXP sans fin, capture possible quand le Pokémon est affaibli.
- **Arène** (à venir) : architecture prévue dans `src/game/modes/arena.js`.

## Données et équilibrage

| Fichier | Contenu |
| --- | --- |
| `src/data/gen1/zones.json` | zones, paliers, Pokémon sauvages, boss, champions, légendaires |
| `src/data/gen1/pokemon.json` | Pokémon (nom, types, stats de base, sprite) |
| `src/data/upgrades.json` | améliorations du héros |
| `src/data/shop.json` | objets du Shop (Poké Ball…) |
| `src/data/backgrounds.json` | décors par zone / palier |
| `src/data/balance.js` | **toutes les formules** : PV, gains, EXP, DPS, capture, coûts, sauvegarde, gain hors ligne |

Ajouter une génération : créer `src/data/gen2/zones.json` et `pokemon.json` sur le modèle de `gen1`, puis les ajouter à `GENERATIONS` dans `src/data/index.js`.

Sauvegarde automatique toutes les 10 s ; au retour, l'équipe a farmé pendant l'absence (plafonné à 8 h).
