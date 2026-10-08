// Animation de capture à partir des planches de balls (public/anim/ball-<objet>.png, 21 images de 20×23 px).
// Images : 0-2 orbe blanc, 3-4 transition, 5-6 sphère rouge, 7-8 ball qui se ferme, 9 ball ouverte,
// 10 ball fermée, 11-15 lueur dorée (capture réussie), 16-18 ball penchée, 19-20 ball sombre.
import { $ } from "./dom.js";
import { toast } from "./battle.js";

const FW = 20; // largeur d'une image dans la planche
const FH = 23;
const SCALE = 3;
const BOX_W = FW * SCALE;
const BOX_H = FH * SCALE;

// Ligne de planche par ball ; les autres utilisent la Poké Ball.
const KNOWN = ["pokeball", "great-ball", "ultra-ball", "master-ball", "nest-ball", "net-ball", "quick-ball", "safari-ball", "dusk-ball", "timer-ball", "repeat-ball"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Lance l'animation puis appelle onDone() (qui applique le résultat) avant de rendre l'ennemi.
export async function playCapture({ ball, ok }, onDone) {
  const scene = $("scene");
  const enemy = $("enemy-img");
  const base = import.meta.env.BASE_URL;
  const el = document.createElement("div");
  el.className = "ball-anim";
  el.style.backgroundImage = `url(${base}anim/ball-${KNOWN.includes(ball) ? ball : "pokeball"}.png)`;
  scene.appendChild(el);

  const frame = (i) => (el.style.backgroundPosition = `${-i * BOX_W}px 0`);
  const place = (x, y) => {
    el.style.left = `${x - BOX_W / 2}px`;
    el.style.top = `${y - BOX_H / 2}px`;
  };
  const cycle = (frames, ms) => {
    let i = 0;
    frame(frames[0]);
    const t = setInterval(() => frame(frames[++i % frames.length]), ms);
    return () => clearInterval(t);
  };

  const sr = scene.getBoundingClientRect();
  const er = enemy.getBoundingClientRect();
  const cx = er.left + er.width / 2 - sr.left; // centre du Pokémon
  const cy = er.top + er.height / 2 - sr.top;
  const groundY = er.bottom - sr.top - BOX_H / 2 - 6; // posée au pied du Pokémon
  const startX = 50;
  const startY = sr.height - 10;

  // 1. Lancer : la ball tourne en volant jusqu'au Pokémon
  place(startX, startY);
  const stopSpin = cycle([10, 16, 17, 18], 70);
  await el.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: `translate(${(cx - startX) * 0.55}px, ${(cy - startY) * 0.55 - 90}px)`, offset: 0.55 },
      { transform: `translate(${cx - startX}px, ${cy - startY}px)` },
    ],
    { duration: 650, easing: "ease-out", fill: "forwards" }
  ).finished;
  stopSpin();
  el.getAnimations().forEach((a) => a.cancel());
  place(cx, cy);

  // 2. La ball s'ouvre, le Pokémon devient lumière blanche et est aspiré
  frame(9);
  enemy.style.transition = "filter 0.2s, transform 0.4s ease-in, opacity 0.4s ease-in";
  enemy.style.filter = "brightness(0) invert(1)";
  await sleep(220);
  enemy.style.transform = "scale(0.08)";
  enemy.style.opacity = "0";
  await sleep(420);
  for (const f of [8, 7, 10]) {
    frame(f);
    await sleep(110);
  }

  // 3. La ball tombe au sol en rebondissant
  const dy = groundY - cy;
  await el.animate(
    [
      { transform: "translateY(0)", easing: "ease-in" },
      { transform: `translateY(${dy}px)`, offset: 0.55, easing: "ease-out" },
      { transform: `translateY(${dy - 14}px)`, offset: 0.78, easing: "ease-in" },
      { transform: `translateY(${dy}px)` },
    ],
    { duration: 600, fill: "forwards" }
  ).finished;
  await sleep(250);

  // 4. La ball se secoue (3 fois si la capture réussit, sinon 1 ou 2)
  const shakes = ok ? 3 : 1 + Math.floor(Math.random() * 2);
  for (let n = 0; n < shakes; n++) {
    for (const f of [16, 17, 18, 17]) {
      frame(f);
      await sleep(95);
    }
    await sleep(300);
  }

  // 5. Résultat
  if (ok) {
    toast("Capturé !");
    for (let n = 0; n < 2; n++)
      for (const f of [11, 12, 13, 14, 15, 14, 13, 12]) {
        frame(f);
        await sleep(55);
      }
    frame(10);
    await sleep(200);
    onDone();
    enemy.style.cssText = ""; // le suivant apparaît (ou le Pokémon est remplacé)
    await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }).finished;
  } else {
    toast("Raté…");
    frame(9);
    enemy.style.filter = "brightness(0) invert(1)";
    enemy.style.opacity = "1";
    enemy.style.transform = "scale(1)";
    await sleep(120);
    enemy.style.filter = "none";
    await sleep(350);
    onDone();
    enemy.style.cssText = "";
    await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }).finished;
  }
  el.remove();
}
