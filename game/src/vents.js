// Vents: one job only. What a vent grate means for the thief: slow
// crawling, invisible to every eye and beam, and the label the renderer
// shows while the thief is inside one.
import { inVent } from './levels.js';

export function thiefInVent(floor, player) {
  return inVent(floor, player.x, player.y);
}

export function ventLabel() {
  return 'IN THE VENTS — UNSEEN';
}
