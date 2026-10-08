import "./style.css";
import { load, save } from "./core/save.js";
import { startLoop } from "./core/loop.js";
import { state } from "./core/state.js";
import { autoAttack, spawnEnemy } from "./game/combat.js";
import { checkBossTimer } from "./game/modes/story.js";
import { applyOffline } from "./game/offline.js";
import { BALANCE } from "./data/balance.js";
import { initUI, showOffline } from "./ui/ui.js";

const elapsed = load();
const offline = elapsed ? applyOffline(elapsed) : null;
state.legendFight = false; // un combat légendaire interrompu est à relancer
spawnEnemy(); // nouvel adversaire à chaque ouverture (un boss en cours est redéfié depuis le début)
initUI();
if (offline) showOffline(offline);

startLoop((dt) => {
  autoAttack(dt);
  checkBossTimer();
});

setInterval(save, BALANCE.save.intervalMs);
document.addEventListener("visibilitychange", () => document.hidden && save());
window.addEventListener("beforeunload", save);
