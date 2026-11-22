// Tools: one job only. Smoke, EMP, coin toss, decoy mouse and lockpick —
// what each one does to the world, and what it costs. Charges are earned
// by lifting loot, so the player must steal to stay equipped.
import { TOOLS } from './config.js';
import { tileAt, blocksMove } from './levels.js';
import { dist } from './rng.js';
import { lureGuards, lureToDecoy } from './guards.js';
import { makeRng } from './rng.js';

export function createToolState() {
  return { smoke: 1, emp: 1, coin: 3, decoy: 1, pick: 99, smokeT: 0, empT: 0, picking: null };
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

// EMP kills every camera and laser grid for 8 seconds — and stuns drones.
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

// The decoy mouse: a wind-up brass mouse that scurries around for 8
// seconds, drawing every guard in earshot after it as it wanders.
export function dropDecoy(tools, x, y) {
  if (tools.decoy <= 0) return null;
  tools.decoy -= 1;
  return {
    x, y, t: 8, angle: 0, dir: 0,
    rng: makeRng(Math.floor(x * 3 + y * 7 + Date.now() % 100000)),
  };
}

export function updateDecoy(decoy, dt, floor, guards) {
  if (!decoy) return null;
  decoy.t -= dt;
  if (decoy.t <= 0) return null;
  // Wander: pick a new heading every second or so, scurry along it.
  decoy.dir -= dt;
  if (decoy.dir <= 0) {
    decoy.dir = 0.8 + decoy.rng() * 0.8;
    decoy.angle = decoy.rng() * Math.PI * 2;
  }
  const step = 42 * dt;
  const nx = decoy.x + Math.cos(decoy.angle) * step;
  const ny = decoy.y + Math.sin(decoy.angle) * step;
  const { tx, ty } = tileAt(floor, nx, ny);
  // Stay inside the room: only scurry onto floor tiles.
  if (!blocksMove(floor, tx, ty)) {
    decoy.x = nx;
    decoy.y = ny;
  } else {
    decoy.dir = 0; // bumped a wall — pick a new heading next tick
  }
  lureToDecoy(guards, decoy.x, decoy.y);
  return decoy;
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
