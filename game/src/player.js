// The thief: one job only. Movement, sneaking, vent crawling, loot
// pickup, lives and the two getaways. Collision is circle-vs-tile
// against walls and closed doors.
import { PLAYER_SPEED, PLAYER_SNEAK_SPEED, PLAYER_VENT_SPEED, LOOT_VALUES } from './config.js';
import { tileAt, blocksMove, inVent } from './levels.js';
import { clamp, dist } from './rng.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: -Math.PI / 2,
    sneaking: false,
    inVent: false,
    alive: true,
    lives: 3,
    loot: 0,
    lootCount: 0,
    jewelsTaken: false,
    moving: false,
    stepT: 0,
  };
}

export function updatePlayer(p, dt, input, floor) {
  if (!p.alive) return;
  let dx = 0;
  let dy = 0;
  if (input.down('KeyW', 'ArrowUp')) dy -= 1;
  if (input.down('KeyS', 'ArrowDown')) dy += 1;
  if (input.down('KeyA', 'ArrowLeft')) dx -= 1;
  if (input.down('KeyD', 'ArrowRight')) dx += 1;
  p.sneaking = input.down('ShiftLeft', 'ShiftRight');
  p.inVent = inVent(floor, p.x, p.y);
  p.moving = dx !== 0 || dy !== 0;
  if (!p.moving) return;

  const len = Math.hypot(dx, dy);
  const speed = (p.inVent ? PLAYER_VENT_SPEED : p.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED) * dt;
  const nx = p.x + (dx / len) * speed;
  const ny = p.y + (dy / len) * speed;
  p.facing = Math.atan2(dy, dx);
  p.stepT += dt;

  // Axis-separated collision so the thief slides along walls.
  const r = 13;
  const tryX = { x: nx, y: p.y };
  const tryY = { x: p.x, y: ny };
  if (!circleBlocked(floor, tryX.x, tryX.y, r)) p.x = nx;
  if (!circleBlocked(floor, tryY.x, tryY.y, r)) p.y = ny;
}

function circleBlocked(floor, x, y, r) {
  const { tx, ty } = tileAt(floor, x, y);
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      if (!blocksMove(floor, tx + ox, ty + oy)) continue;
      const cx = clamp(x, (tx + ox) * 40, (tx + ox + 1) * 40);
      const cy = clamp(y, (ty + oy) * 40, (ty + oy + 1) * 40);
      if (dist(x, y, cx, cy) < r) return true;
    }
  }
  return false;
}

// Loot is pocketed by walking over it. The Crown Jewels are the prize:
// taking them opens both getaways and arms the final chase.
export function collectLoot(p, floor, onTake) {
  for (const item of floor.loot) {
    if (item.taken) continue;
    if (dist(p.x, p.y, item.x, item.y) < 26) {
      item.taken = true;
      p.loot += LOOT_VALUES[item.kind];
      p.lootCount += 1;
      if (item.kind === 'jewels') p.jewelsTaken = true;
      onTake(item);
    }
  }
}

export function atExit(p, floor) {
  return floor.exit && dist(p.x, p.y, floor.exit.x, floor.exit.y) < 30;
}

export function atGetaway(p, floor) {
  return floor.getaway && dist(p.x, p.y, floor.getaway.x, floor.getaway.y) < 34;
}

export function atHelipad(p, floor) {
  return floor.helipad && dist(p.x, p.y, floor.helipad.x, floor.helipad.y) < 34;
}
