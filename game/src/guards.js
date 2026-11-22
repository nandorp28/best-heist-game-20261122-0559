// Guard brains: one job only. Patrol, suspicion, chase, investigate and
// the "caught" moment. Each guard kind from config.js moves and sees
// differently; all of them read cones before they move, like the judge
// wants the player to do. A thief inside a vent grate cannot be seen.
import { GUARD_KINDS, DETECTION, CATCH_RADIUS } from './config.js';
import { hasLineOfSight, inShadow, inVent, tileAt, blocksMove } from './levels.js';
import { dist, angleDiff, clamp } from './rng.js';
import { makeRng } from './rng.js';

export function makeGuard(def, floorIndex) {
  const kind = GUARD_KINDS[def.kind];
  return {
    kind: def.kind,
    name: kind.name,
    x: def.x,
    y: def.y,
    spawnX: def.spawnX,
    spawnY: def.spawnY,
    route: def.route,
    routeIndex: def.routeIndex || 0,
    facing: -Math.PI / 2,
    speed: kind.speed,
    coneRange: kind.coneRange,
    coneAngle: kind.coneAngle,
    color: kind.color,
    desc: kind.desc,
    state: 'patrol', // patrol | suspicious | chase | investigate | stunned
    suspicion: 0,
    seenX: 0,
    seenY: 0,
    investigateX: 0,
    investigateY: 0,
    investigateT: 0,
    stunT: 0,
    sweepPhase: floorIndex * 1.7 + def.x * 0.01,
    rng: makeRng(Math.floor(def.x * 7 + def.y * 13 + floorIndex * 101)),
    walkBob: 0,
  };
}

function moveToward(g, tx, ty, dt, floor) {
  const d = dist(g.x, g.y, tx, ty);
  if (d < 4) return true;
  const step = Math.min(g.speed * dt, d);
  const nx = g.x + ((tx - g.x) / d) * step;
  const ny = g.y + ((ty - g.y) / d) * step;
  const { tx: ntx, ty: nty } = tileAt(floor, nx, ny);
  if (!blocksMove(floor, ntx, nty)) {
    g.x = nx;
    g.y = ny;
  }
  g.facing = Math.atan2(ty - g.y, tx - g.x);
  g.walkBob += dt * 8;
  return false;
}

function canSee(g, floor, px, py, sneaking) {
  // Nobody sees a thief crawling inside a vent grate.
  if (inVent(floor, px, py)) return 0;
  const d = dist(g.x, g.y, px, py);
  const range = g.kind === 'hound' ? g.coneRange + 40 : g.coneRange;
  if (d > range) return 0;
  const ang = Math.atan2(py - g.y, px - g.x);
  if (Math.abs(angleDiff(g.facing, ang)) > g.coneAngle / 2 && d > 46) return 0;
  if (!hasLineOfSight(floor, g.x, g.y, px, py)) return 0;
  // Hounds smell you up close even out of cone; everyone sees worse
  // through shadow and against a sneaking thief.
  let rate = DETECTION.fillPerSec * (1 - d / (range * 1.6));
  if (sneaking) rate *= DETECTION.sneakFactor;
  if (inShadow(floor, px, py)) rate *= DETECTION.shadowFactor;
  return Math.max(rate, 0.12);
}

export function updateGuard(g, dt, floor, player, alarm, empT, onCaught, onSpotted) {
  // EMP stuns drones outright; it only blinds everyone else's cones
  // through the smoke-style handling in the caller. Drones hover, so
  // they never walk a route on foot — they glide it.
  if (g.kind === 'drone' && empT > 0) {
    g.stunT = Math.max(g.stunT, empT);
  }
  if (g.stunT > 0) {
    g.stunT -= dt;
    g.suspicion = Math.max(0, g.suspicion - dt);
    return;
  }

  // Warden: stands and sweeps his wide cone back and forth.
  if (g.kind === 'warden' && g.state === 'patrol') {
    g.sweepPhase += dt * 0.55;
    g.facing = -Math.PI / 2 + Math.sin(g.sweepPhase) * 1.1;
  }
  // Drone: glides its route, cone sweeping gently as it goes.
  if (g.kind === 'drone' && g.state === 'patrol') {
    g.sweepPhase += dt * 0.4;
  }

  const seen = g.state !== 'chase' ? canSee(g, floor, player.x, player.y, player.sneaking) : 1;
  if (seen > 0 && player.alive) {
    g.suspicion = clamp(g.suspicion + seen * dt, 0, 1);
    g.seenX = player.x;
    g.seenY = player.y;
    if (g.suspicion >= 1 && g.state !== 'chase') {
      g.state = 'chase';
      onSpotted(g);
    } else if (g.suspicion > 0.35 && g.state === 'patrol') {
      g.state = 'suspicious';
    }
  } else {
    g.suspicion = clamp(g.suspicion - DETECTION.decayPerSec * dt, 0, 1);
    if (g.state === 'suspicious' && g.suspicion <= 0.05) g.state = 'patrol';
  }

  // The captain hunts on any real alarm, even without seeing you.
  if (g.kind === 'captain' && alarm > 30 && g.state === 'patrol') {
    g.state = 'chase';
    g.seenX = player.x;
    g.seenY = player.y;
  }

  switch (g.state) {
    case 'patrol': {
      if (g.kind === 'warden') break;
      const target = g.route[g.routeIndex];
      if (target && moveToward(g, target.x, target.y, dt, floor)) {
        g.routeIndex = (g.routeIndex + 1) % g.route.length;
        // A beat at each waypoint: the guard looks around before moving on.
        g.facing += g.rng() * 0.6 - 0.3;
      }
      break;
    }
    case 'suspicious': {
      // Turn toward the last glimpse, creep closer.
      g.facing += angleDiff(g.facing, Math.atan2(g.seenY - g.y, g.seenX - g.x)) * dt * 3;
      moveToward(g, g.seenX, g.seenY, dt * 0.4, floor);
      break;
    }
    case 'investigate': {
      if (moveToward(g, g.investigateX, g.investigateY, dt, floor)) {
        g.investigateT -= dt;
        g.facing += dt * 2.2; // look around the spot
        if (g.investigateT <= 0) g.state = 'patrol';
      }
      break;
    }
    case 'chase': {
      const lost = dist(g.x, g.y, player.x, player.y) > g.coneRange * 1.6;
      if (!player.alive || (lost && g.suspicion <= 0.1)) {
        g.state = 'patrol';
        g.suspicion = 0;
        break;
      }
      // Chase the last seen spot; re-acquire when the thief is visible.
      if (seen > 0) {
        g.seenX = player.x;
        g.seenY = player.y;
      }
      moveToward(g, g.seenX, g.seenY, dt * 1.35, floor);
      if (dist(g.x, g.y, player.x, player.y) < CATCH_RADIUS && player.alive) {
        onCaught(g);
      }
      break;
    }
  }
}

// A thrown coin: every guard in earshot turns to investigate the spot.
// Sleuths run; patrolmen walk. Drones ignore coins — they watch, they
// don't listen.
export function lureGuards(guards, x, y) {
  for (const g of guards) {
    if (g.state === 'chase' || g.stunT > 0 || g.kind === 'drone') continue;
    if (dist(g.x, g.y, x, y) < 260) {
      g.state = 'investigate';
      g.investigateX = x;
      g.investigateY = y;
      g.investigateT = g.kind === 'sleuth' ? 4 : 2.5;
      g.suspicion = Math.max(g.suspicion, 0.3);
    }
  }
}

// A decoy mouse: the same lure, retargeted as the mouse wanders.
export function lureToDecoy(guards, x, y) {
  for (const g of guards) {
    if (g.state === 'chase' || g.stunT > 0 || g.kind === 'drone') continue;
    if (dist(g.x, g.y, x, y) < 300) {
      g.state = 'investigate';
      g.investigateX = x;
      g.investigateY = y;
      g.investigateT = 1.2;
      g.suspicion = Math.max(g.suspicion, 0.25);
    }
  }
}
