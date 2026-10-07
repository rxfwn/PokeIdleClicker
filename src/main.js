import "./style.css";
import { load, save } from "./core/save.js";
import { startLoop } from "./core/loop.js";
import { autoAttack, spawnEnemy } from "./game/combat.js";
import { state } from "./core/state.js";
import { initUI } from "./ui/ui.js";

load();
if (!state.enemy) spawnEnemy();
initUI();

startLoop((dt) => autoAttack(dt));
setInterval(save, 5000);
