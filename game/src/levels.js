// Floor layouts: one job only. Three hand-built rooms of the Gilded
// Exchange, each a 24 x 17 tile map plus its patrol routes. Legend:
//   # wall   . floor   C cover (desk/crate)   P pillar   S shadow zone
//   R rug    A wall art   l coin   L painting   g gold bar   m gem
//   J CROWN JEWELS   D locked door   E stairs up   X getaway van
//   T thief start   1 patrolman 2 hound 3 warden 4 sleuth 5 captain
//   K security camera   V vault door (decor)
import { TILE } from './config.js';

const FLOOR_1_MAP = [
  '########################',
  '#......CC......CC...E..#',
  '#.PP.....A.....A....PP.#',
  '#......##....##........#',
  '#..l...##....##...l....#',
  '#......##....##........#',
  '#..CC......TT......CC..#',
  '#......................#',
  '#..##...######....##...#',
  '#..##...#....#....##...#',
  '#.......#....#....L....#',
  '#..CC...#....#....CC...#',
  '#.......######.........#',
  '#..l.........g.....l...#',
  '#......CC......CC......#',
  '#.1........K.........2.#',
  '#......................#',
];

const FLOOR_2_MAP = [
  '########################',
  '#..L....CC....CC....L..#',
  '#.SS..........A.....SS.#',
  '#..##..P...P....P..##..#',
  '#.....P....m....P......#',
  '#..C......CC.......C...#',
  '#.................D....#',
  '#..PP...TT...CC...D..E.#',
  '#.................D....#',
  '#..L....CC....##.......#',
  '#......##....##...A....#',
  '#.SS...##....##....SS..#',
  '#..##...##...##...##...#',
  '#.....g......l......g..#',
  '#..CC.....CC......CC...#',
  '#.4.....K.....3......K.#',
  '#......................#',
];

const FLOOR_3_MAP = [
  '########################',
  '#..g....CC....CC....g..#',
  '#.SS....A.....A....SS..#',
  '#..##..V...VV....V.##..#',
  '#..##..V...Jm....V.##..#',
  '#..##..V...VV....V.##..#',
  '#.....P....P.....P.....#',
  '#..C......TT.......C...#',
  '#......................#',
  '#..PP...CC...CC...PP...#',
  '#.......##....##.......#',
  '#..m...##....##....m...#',
  '#.SS...##....##....SS..#',
  '#......CC......CC......#',
  '#..L..........A....L...#',
  '#X5....K....2....K..3..#',
  '#......................#',
];

// Patrol routes per floor: tile waypoints for each spawned guard, in
// spawn order. Wardens ignore routes (they stand and sweep).
const PATROLS = [
  [
    [[3, 3], [20, 3], [20, 14], [3, 14]],
    [[20, 14], [20, 3], [3, 3], [3, 14]],
  ],
  [
    [[3, 4], [11, 4], [11, 12], [3, 12]],
    [[20, 10], [12, 10], [12, 4], [20, 4]],
  ],
  [
    [[3, 7], [10, 7], [10, 13], [3, 13]],
    [[20, 7], [20, 13], [13, 13], [13, 7]],
  ],
];

const KIND_BY_CHAR = { 1: 'patrol', 2: 'hound', 3: 'warden', 4: 'sleuth', 5: 'captain' };
const LOOT_BY_CHAR = { l: 'coin', L: 'painting', g: 'gold', m: 'gem', J: 'jewels' };

export function parseFloor(index) {
  const raw = [FLOOR_1_MAP, FLOOR_2_MAP, FLOOR_3_MAP][index];
  const walls = new Set();
  const covers = [];
  const pillars = [];
  const shadows = [];
  const rugs = [];
  const arts = [];
  const vaults = [];
  const loot = [];
  const doors = [];
  const guards = [];
  const cameras = [];
  let start = { x: 12 * TILE + TILE / 2, y: 8 * TILE + TILE / 2 };
  let exit = null;
  let getaway = null;

  for (let y = 0; y < raw.length; y++) {
    for (let x = 0; x < raw[y].length; x++) {
      const ch = raw[y][x];
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      const key = x + ',' + y;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') covers.push({ x: cx, y: cy, tx: x, ty: y });
      else if (ch === 'P') pillars.push({ x: cx, y: cy });
      else if (ch === 'S') shadows.push({ x: cx, y: cy, tx: x, ty: y });
      else if (ch === 'R') rugs.push({ x: cx, y: cy });
      else if (ch === 'A') arts.push({ x: cx, y: cy });
      else if (ch === 'V') vaults.push({ x: cx, y: cy });
      else if (ch === 'D') doors.push({ x: cx, y: cy, tx: x, ty: y, open: false, progress: 0 });
      else if (ch === 'T') start = { x: cx, y: cy };
      else if (ch === 'E') exit = { x: cx, y: cy, tx: x, ty: y };
      else if (ch === 'X') getaway = { x: cx, y: cy, tx: x, ty: y };
      else if (ch === 'K') cameras.push({ x: cx, y: cy, facing: -Math.PI / 2, sweep: 0, dir: 1 });
      else if (KIND_BY_CHAR[ch]) {
        guards.push({ kind: KIND_BY_CHAR[ch], x: cx, y: cy, spawnX: cx, spawnY: cy });
      } else if (LOOT_BY_CHAR[ch]) {
        loot.push({ kind: LOOT_BY_CHAR[ch], x: cx, y: cy, taken: false, bob: Math.random() * 6 });
      }
    }
  }

  // Attach patrol routes in spawn order (wardens stand still).
  const routes = PATROLS[index];
  guards.forEach((g, i) => {
    g.route = (routes[i] || [[g.spawnX / TILE, g.spawnY / TILE]]).map(([tx, ty]) => ({
      x: tx * TILE + TILE / 2,
      y: ty * TILE + TILE / 2,
    }));
    g.routeIndex = 0;
  });

  return {
    index,
    walls,
    covers,
    pillars,
    shadows,
    rugs,
    arts,
    vaults,
    loot,
    doors,
    guards,
    cameras,
    start,
    exit,
    getaway,
    width: raw[0].length,
    height: raw.length,
  };
}

// Tile helpers shared by movement, vision and rendering.
export function tileAt(floor, px, py) {
  return { tx: Math.floor(px / TILE), ty: Math.floor(py / TILE) };
}

export function isWall(floor, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= floor.width || ty >= floor.height) return true;
  return floor.walls.has(tx + ',' + ty);
}

export function isClosedDoor(floor, tx, ty) {
  return floor.doors.some((d) => d.tx === tx && d.ty === ty && !d.open);
}

export function blocksSight(floor, tx, ty) {
  return isWall(floor, tx, ty) || isClosedDoor(floor, tx, ty);
}

export function blocksMove(floor, tx, ty) {
  return isWall(floor, tx, ty) || isClosedDoor(floor, tx, ty);
}

export function inShadow(floor, px, py) {
  const { tx, ty } = tileAt(floor, px, py);
  return floor.shadows.some((s) => s.tx === tx && s.ty === ty);
}

// Line of sight: sample along the segment; walls and closed doors block.
export function hasLineOfSight(floor, ax, ay, bx, by) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const { tx, ty } = tileAt(floor, ax + (bx - ax) * t, ay + (by - ay) * t);
    if (blocksSight(floor, tx, ty)) return false;
  }
  return true;
}
