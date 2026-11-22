// Security cameras: one job only. A camera sweeps its cone back and forth;
// while the thief is inside it the alarm climbs fast. EMP kills them.
// A thief inside a vent grate is invisible to cameras too.
import { DETECTION } from './config.js';
import { hasLineOfSight, inShadow, inVent } from './levels.js';
import { dist, angleDiff } from './rng.js';

export function updateCamera(cam, dt, floor, player, disabledT) {
  if (disabledT > 0) return;
  cam.sweep += dt * 0.7 * cam.dir;
  if (cam.sweep > 1.05) {
    cam.sweep = 1.05;
    cam.dir = -1;
  } else if (cam.sweep < -1.05) {
    cam.sweep = -1.05;
    cam.dir = 1;
  }
  cam.facing = -Math.PI / 2 + cam.sweep * 0.9;
}

export function cameraSees(cam, floor, player, disabledT) {
  if (disabledT > 0 || !player.alive) return 0;
  if (inVent(floor, player.x, player.y)) return 0;
  const d = dist(cam.x, cam.y, player.x, player.y);
  if (d > 210) return 0;
  const ang = Math.atan2(player.y - cam.y, player.x - cam.x);
  if (Math.abs(angleDiff(cam.facing, ang)) > 0.55) return 0;
  if (!hasLineOfSight(floor, cam.x, cam.y, player.x, player.y)) return 0;
  let rate = DETECTION.alarmCameraPerSec * (1 - d / 320);
  if (player.sneaking) rate *= DETECTION.sneakFactor;
  if (inShadow(floor, player.x, player.y)) rate *= DETECTION.shadowFactor;
  return Math.max(rate, 2);
}
