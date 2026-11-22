// Tools: one job only. Smoke, EMP, coin toss and lockpick — what each one
// does to the world, and what it costs. Charges are earned by lifting loot.
import { TOOLS } from './config.js';
import { tileAt } from './levels.js';
import { dist } from './rng.js';
import { lureGuards } from './guards.js';

export function createToolState() {
  return { smoke: 1, emp: 1, coin: 3, pick: 99, smokeT: 0, empT: 0, picking: null };
}

// Smoke blinds every guard and camera cone for 6 seconds.
export function useSmoke(tools, guards) {
  if (tools.smoke <= 0) return false;
  tools.smoke -= 1;
  tools.smokeT = 6;
  for (const g of guards) {
    if (g.state === 'chase') g.state = 'suspicious';
    g.suspicion = Math.min(g.suspicion, 0.4);
  }
  return true;
}

// EMP kills every camera for 8 seconds.
export function useEmp(tools) {
  if (tools.emp <= 0) return false;
  tools.emp -= 1;
  tools.empT = 8;
  return true;
}

// A coin clinks onto a tile and lures nearby guards to investigate.
export function tossCoin(tools, guards, x, y) {
  if (tools.coin <= 0) return false;
  tools.coin -= 1;
  lureGuards(guards, x, y);
  return true;
}

// Lockpick: hold E beside a locked door for 3 seconds; it swings open.
export function updatePick(tools, dt, floor, player, nearDoor) {
  if (!nearDoor) {
    tools.picking = null;
    return null;
  }
  if (!tools.picking) tools.picking = { door: nearDoor, t: 0 };
  tools.picking.t += dt;
  if (tools.picking.t >= 3) {
    const door = tools.picking.door;
    door.open = true;
    door.progress = 1;
    tools.picking = null;
    return door;
  }
  nearDoor.progress = tools.picking.t / 3;
  return null;
}

export function nearestLockedDoor(floor, px, py) {
  let best = null;
  let bestD = 52;
  for (const d of floor.doors) {
    if (d.open) continue;
    const dd = dist(px, py, d.x, d.y);
    if (dd < bestD) {
      bestD = dd;
      best = d;
    }
  }
  return best;
}

export function toolLabel(key) {
  return TOOLS[key].name;
}
