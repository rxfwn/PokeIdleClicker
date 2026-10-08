// Affiche un montant avec l'icône PokéDollar.
export const money = (n) =>
  `${n.toLocaleString("fr-FR")} <img class="pokedollar" src="${import.meta.env.BASE_URL}ui/pokedollar.png" alt="PokéDollar" title="PokéDollar" />`;

export const pokeballIcon = () =>
  `<img class="pokeball" src="${import.meta.env.BASE_URL}menu/team.png?v=2" alt="Pokéball" title="Pokéball" draggable="false" />`;
