// Laser grids: one job only. A live beam is a tripwire — crossing it
// raises the alarm fast. EMP kills the beams along with the cameras.
// Vents run underneath the beams, so a thief crawling a grate slips
// straight past a grid that would catch a walker.
import { DETECTION } from './config.js';
import { inVent } from './levels.js';
import { distToSegment } from './rng.js';

// Returns the alarm rate (per second) the thief earns from lasers now.
export function laserAlarm(floor, player, disabledT) {
  if (disabledT > 0 || !player.alive) return 0;
  if (inVent(floor, player.x, player.y)) return 0;
  for (const beam of floor.lasers) {
    if (distToSegment(player.x, player.y, beam.ax, beam.ay, beam.bx, beam.by) < 10) {
      return DETECTION.alarmLaserPerSec;
    }
  }
  return 0;
}
