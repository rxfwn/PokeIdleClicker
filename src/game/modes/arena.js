// Mode Arène (à faire) : re-défier les champions déjà battus à difficulté croissante.
// Architecture prévue :
//   - state.badgeLevels[zone] = niveau du badge, qui monte à chaque victoire ;
//   - chaque niveau de badge donne +X % de dégâts aux Pokémon du type de l'arène (à brancher dans hero.js) ;
//   - un combat d'arène réutilise les dresseurs de story.bossTrainers() avec niveaux et PV augmentés (data/balance.js).
// Un mode expose : id, available, spawn(), onClear(enemy), farmLevel().
export const arena = {
  id: "arena",
  available: false,
  spawn() {},
  onClear() {},
  farmLevel: () => 1,
};
