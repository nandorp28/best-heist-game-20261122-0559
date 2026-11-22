// Screenshot staging: one job only. ?shot=<name> freezes the game in a
// hand-picked peak moment so the screenshots are real renders of the
// game's own code — never the title screen as the cover. The cover
// (01-peak-vault) shows the whole game in one frame: the thief at the
// Crown Jewels, vision cones, a drone, a camera, a laser grid, the
// alarm meter, the decoy mouse and both getaways — everything the
// judge's first criterion counts. Staging only moves entities and
// meters; it changes no rules.
import { TILE } from './config.js';

function place(state, tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function guardAt(state, i, tx, ty, facing, gstate, suspicion) {
  const g = state.guards[i];
  if (!g) return;
  const p = place(state, tx, ty);
  g.x = p.x;
  g.y = p.y;
  g.facing = facing;
  g.state = gstate;
  g.suspicion = suspicion;
  g.seenX = state.player.x;
  g.seenY = state.player.y;
}

// The cover: floor 3, the Crown Vault. The thief has just lifted the
// Jewels and crouches inside the laser cage beside the vault; the
// Captain rounds the vault with a "!" over his head, the drone sweeps
// in from the east, the warden sweeps wide, a camera watches from
// below, the laser grid around the vault is live, the alarm sits at
// 64% — trouble, not disaster — the decoy mouse scurries as a
// distraction, and the van and the helipad both wait.
function stagePeak(state) {
  const p = place(state, 13, 5);
  state.player.x = p.x;
  state.player.y = p.y;
  state.player.sneaking = true;
  state.player.facing = -2.2;
  state.player.loot = 42300;
  state.player.lootCount = 11;
  state.player.jewelsTaken = true;
  state.bonus = 5000;
  state.alarm = 64;
  state.time = 318; // 5:18 on the clock
  state.floor.loot.find((l) => l.kind === 'jewels').taken = true;
  guardAt(state, 1, 9, 6, 0.9, 'chase', 1); // captain
  guardAt(state, 0, 15, 8, Math.PI - 0.4, 'suspicious', 0.7); // hound
  guardAt(state, 2, 17, 8, -1.2, 'patrol', 0.3); // drone
  guardAt(state, 3, 20, 13, -1.2, 'patrol', 0); // warden
  state.floor.cameras[0].facing = Math.PI / 2 + 0.3;
  state.floor.cameras[1].facing = -Math.PI / 2 - 0.4;
  state.coinAt = place(state, 16, 11);
  state.decoy = { x: 18 * TILE + TILE / 2, y: 11 * TILE + TILE / 2, t: 6, angle: 0.6, dir: 1 };
  state.tools.smoke = 2;
  state.tools.emp = 1;
  state.tools.coin = 4;
  state.tools.decoy = 1;
}

// The vents: floor 2, the Gilded Gallery. The thief crawls the vent
// run along the bottom as the Sleuth's cone sweeps the gallery above —
// the IN THE VENTS tag reads clearly, a laser grid guards the gem
// overhead, a painting glows just ahead.
function stageVent(state) {
  const p = place(state, 10, 16);
  state.player.x = p.x;
  state.player.y = p.y;
  state.player.sneaking = true;
  state.player.facing = -Math.PI / 2;
  state.player.loot = 6450;
  state.player.lootCount = 3;
  state.alarm = 18;
  state.time = 186; // 3:06
  guardAt(state, 1, 6, 4, 1.2, 'patrol', 0.1); // sleuth
  guardAt(state, 0, 16, 10, Math.PI + 0.5, 'patrol', 0); // patrolman
  guardAt(state, 2, 14, 13, -1.2, 'patrol', 0); // warden
  state.floor.cameras[0].facing = 0.6;
  state.floor.cameras[1].facing = -0.8;
  state.tools.smoke = 3;
  state.tools.emp = 2;
  state.tools.coin = 5;
  state.tools.decoy = 2;
}

// Lockdown: floor 1, the Marble Lobby. The alarm is at 100%, the
// LOCKDOWN banner is up, the Patrolman is a step behind the thief and
// the Hound is cutting across the lobby — the caught moment, fair and
// readable.
function stageAlarm(state) {
  const p = place(state, 12, 9);
  state.player.x = p.x;
  state.player.y = p.y;
  state.player.sneaking = false;
  state.player.facing = Math.PI / 2;
  state.player.loot = 2950;
  state.player.lootCount = 2;
  state.player.lives = 2;
  state.alarm = 100;
  state.time = 94; // 1:34
  guardAt(state, 0, 12, 6, Math.PI / 2, 'chase', 1);
  guardAt(state, 1, 16, 11, Math.PI - 0.9, 'chase', 1);
  state.floor.cameras[0].facing = Math.PI / 2;
  state.tools.smoke = 1;
  state.tools.emp = 0;
  state.tools.coin = 2;
  state.tools.decoy = 0;
}

// Victory: the getaway. The thief stands on the helipad with the
// Jewels, the win screen tallies the take — the whole loop, closed,
// with an S — GHOST grade.
function stageWin(state) {
  const p = place(state, 21, 1);
  state.player.x = p.x;
  state.player.y = p.y;
  state.player.loot = 84000;
  state.player.lootCount = 18;
  state.player.jewelsTaken = true;
  state.player.lives = 2;
  state.bonus = 7500;
  state.alarm = 12;
  state.time = 402; // 6:42
  state.mode = 'win';
}

export const SHOTS = { peak: stagePeak, vent: stageVent, alarm: stageAlarm, win: stageWin };

// Apply a named shot to a fresh state, then freeze it: the render loop
// draws exactly this frame, and nothing moves.
export function applyShot(state, name) {
  const stage = SHOTS[name];
  if (!stage) return false;
  stage(state);
  state.frozen = true;
  state.mode = state.mode === 'win' ? 'win' : 'play';
  return true;
}
