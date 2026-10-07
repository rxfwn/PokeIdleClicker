// Boucle de jeu : appelle onTick(dtSecondes) ~10 fois par seconde.
export function startLoop(onTick, hz = 10) {
  let last = performance.now();
  return setInterval(() => {
    const now = performance.now();
    onTick((now - last) / 1000);
    last = now;
  }, 1000 / hz);
}
