// Game loop and state machine: one job only. Title -> play -> caught /
// win / game over, floor progression, the alarm, the lasers, the decoy
// and the tool keys. The ?shot= query freezes a staged frame for
// screenshots.
import { TOP_BAR, WORLD_W, DETECTION, UNSEEN_BONUS } from './config.js';
import { parseFloor } from './levels.js';
import { makeGuard, updateGuard } from './guards.js';
import { updateCamera, cameraSees } from './cameras.js';
import { laserAlarm } from './lasers.js';
import { createToolState, useSmoke, useEmp, tossCoin, dropDecoy, updateDecoy, updatePick, nearestLockedDoor } from './tools.js';
import { createPlayer, updatePlayer, collectLoot, atExit, atGetaway, atHelipad } from './player.js';
import { createInput } from './input.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';
import { ensureAudio, startMusic, sfxPickup, sfxAlarm, sfxLaser, sfxDecoy, sfxCaught, sfxCoin, sfxDoor, sfxWin } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1);

function newState(floorIndex) {
  const floor = parseFloor(floorIndex);
  return {
    floorIndex,
    floor,
    guards: floor.guards.map((g) => makeGuard(g, floorIndex)),
    player: createPlayer(floor.start),
    tools: createToolState(),
    decoy: null,
    coinAt: null,
    coinT: 0,
    alarm: 0,
    time: 0,
    bonus: 0, // unseen bonus: $2,500 per floor cleared without being spotted
    spotted: false, // set the moment any guard or camera fully spots the thief
    laserSfxT: 0,
    mode: 'title',
    caughtBy: null,
    frozen: false,
    alarmSounded: false,
  };
}

// Keep the loot and the thief when a floor is cleared: the heist is one run.
// A floor cleared without a single spot pays the unseen bonus.
function nextFloor(state) {
  const keep = {
    loot: state.player.loot,
    lootCount: state.player.lootCount,
    jewelsTaken: state.player.jewelsTaken,
    lives: state.player.lives,
    tools: state.tools,
    bonus: state.bonus + (state.spotted ? 0 : UNSEEN_BONUS),
  };
  const next = newState(state.floorIndex + 1);
  next.player.loot = keep.loot;
  next.player.lootCount = keep.lootCount;
  next.player.jewelsTaken = keep.jewelsTaken;
  next.player.lives = keep.lives;
  next.tools = keep.tools;
  next.bonus = keep.bonus;
  next.time = state.time;
  next.mode = 'play';
  return next;
}

let state = newState(0);
if (shotName) {
  // Staged screenshots start on the floor that shows the moment best.
  const shotFloor = shotName === 'peak' || shotName === 'win' ? 2 : shotName === 'vent' ? 1 : 0;
  state = newState(shotFloor);
  applyShot(state, shotName);
  state.mode = shotName === 'win' ? 'win' : 'play';
}

function onSpotted(g) {
  state.spotted = true;
  state.alarm = Math.min(100, state.alarm + DETECTION.alarmOnSpot);
  if (state.alarm >= 60 && !state.alarmSounded) {
    state.alarmSounded = true;
    sfxAlarm();
  }
}

function onCaught(g) {
  state.spotted = true;
  state.player.lives -= 1;
  state.caughtBy = g.name;
  sfxCaught();
  if (state.player.lives <= 0) {
    state.mode = 'gameover';
    return;
  }
  state.mode = 'caught';
  state.alarm = Math.min(100, state.alarm + 20);
  // The thief slips back to the floor entrance; the guards lose the trail.
  state.player.x = state.floor.start.x;
  state.player.y = state.floor.start.y;
  for (const gg of state.guards) {
    gg.state = 'patrol';
    gg.suspicion = 0;
    gg.x = gg.spawnX;
    gg.y = gg.spawnY;
  }
}

function onTakeLoot(item) {
  sfxPickup(item.kind);
  // Every lift earns a tool charge — steal to stay equipped.
  if (item.kind === 'painting' || item.kind === 'gold') state.tools.smoke = Math.min(3, state.tools.smoke + 1);
  if (item.kind === 'gem') state.tools.emp = Math.min(2, state.tools.emp + 1);
  if (item.kind === 'coin') state.tools.coin = Math.min(5, state.tools.coin + 1);
  if (item.kind === 'safe') state.tools.decoy = Math.min(2, state.tools.decoy + 1);
}

function tick(dt) {
  if (state.frozen) return;
  if (state.mode !== 'play') return;
  state.time += dt;

  // Tool timers.
  if (state.tools.smokeT > 0) state.tools.smokeT -= dt;
  if (state.tools.empT > 0) state.tools.empT -= dt;
  if (state.coinT > 0) {
    state.coinT -= dt;
    if (state.coinT <= 0) state.coinAt = null;
  }
  if (state.laserSfxT > 0) state.laserSfxT -= dt;

  updatePlayer(state.player, dt, input, state.floor);
  collectLoot(state.player, state.floor, onTakeLoot);

  // Tools.
  if (input.wasPressed('KeyQ')) {
    if (useSmoke(state.tools, state.guards)) sfxCoin();
  }
  if (input.wasPressed('KeyR')) {
    if (useEmp(state.tools)) sfxCoin();
  }
  if (input.wasPressed('KeyT')) {
    const d = dropDecoy(state.tools, state.player.x, state.player.y);
    if (d) {
      state.decoy = d;
      sfxDecoy();
    }
  }
  const click = input.takeClick();
  if (click && click.x < WORLD_W && click.y > TOP_BAR) {
    const wx = click.x;
    const wy = click.y - TOP_BAR;
    if (tossCoin(state.tools, state.guards, wx, wy)) {
      state.coinAt = { x: wx, y: wy };
      state.coinT = 5;
      sfxCoin();
    }
  }
  // Lockpick: hold E beside a locked door.
  const door = nearestLockedDoor(state.floor, state.player.x, state.player.y);
  if (input.down('KeyE') && door) {
    const opened = updatePick(state.tools, dt, state.floor, state.player, door);
    if (opened) sfxDoor();
  } else {
    state.tools.picking = null;
    if (door) door.progress = 0;
  }

  // The decoy mouse scurries and re-lures guards as it wanders.
  state.decoy = updateDecoy(state.decoy, dt, state.floor, state.guards);

  // Guards and cameras.
  for (const g of state.guards) {
    updateGuard(g, dt, state.floor, state.player, state.alarm, state.tools.empT, onCaught, onSpotted);
  }
  for (const cam of state.floor.cameras) {
    updateCamera(cam, dt, state.floor, state.player, state.tools.empT);
    const seen = cameraSees(cam, state.floor, state.player, state.tools.empT);
    if (seen > 0) {
      state.spotted = true;
      state.alarm = Math.min(100, state.alarm + seen * dt);
      if (state.alarm >= 60 && !state.alarmSounded) {
        state.alarmSounded = true;
        sfxAlarm();
      }
    }
  }
  // Laser grids: crossing a live beam trips the alarm fast.
  const laserRate = laserAlarm(state.floor, state.player, state.tools.empT);
  if (laserRate > 0) {
    state.spotted = true;
    state.alarm = Math.min(100, state.alarm + laserRate * dt);
    if (state.laserSfxT <= 0) {
      sfxLaser();
      state.laserSfxT = 0.5;
    }
    if (state.alarm >= 60 && !state.alarmSounded) {
      state.alarmSounded = true;
      sfxAlarm();
    }
  }
  // Alarm cools when nobody sees you.
  const anyChase = state.guards.some((g) => g.state === 'chase');
  if (!anyChase && state.alarm > 0) {
    state.alarm = Math.max(0, state.alarm - DETECTION.alarmDecayPerSec * dt);
    if (state.alarm < 60) state.alarmSounded = false;
  }
  // Lockdown at full alarm: every guard hunts.
  if (state.alarm >= DETECTION.lockdownAt) {
    for (const g of state.guards) {
      if (g.state === 'patrol') {
        g.state = 'chase';
        g.seenX = state.player.x;
        g.seenY = state.player.y;
      }
    }
  }

  // Floor progression and the two getaways.
  if (state.floorIndex < 2 && atExit(state.player, state.floor)) {
    state = nextFloor(state);
    sfxDoor();
  } else if (state.floorIndex === 2 && state.player.jewelsTaken && (atGetaway(state.player, state.floor) || atHelipad(state.player, state.floor))) {
    state.mode = 'win';
    sfxWin();
  }
}

function keyActions() {
  if (input.wasPressed('Space', 'Enter')) {
    ensureAudio();
    startMusic();
    if (state.mode === 'title') state.mode = 'play';
    else if (state.mode === 'caught') state.mode = 'play';
  }
  if (input.wasPressed('KeyR')) {
    if (state.mode === 'gameover' || state.mode === 'win') {
      const keepTime = state.mode === 'win';
      state = newState(0);
      if (!keepTime) state.mode = 'title';
    }
  }
  if (input.wasPressed('KeyP')) {
    if (state.mode === 'play') state.mode = 'paused';
    else if (state.mode === 'paused') state.mode = 'play';
  }
  if (state.mode === 'title') {
    const click = input.takeClick();
    if (click) {
      ensureAudio();
      startMusic();
      state.mode = 'play';
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  keyActions();
  tick(dt);
  drawGame(ctx, state);
  input.endFrame();
  if (!state.frozen) requestAnimationFrame(frame);
}

// A frozen staged shot renders exactly once.
if (state.frozen) {
  drawGame(ctx, state);
} else {
  requestAnimationFrame(frame);
}
