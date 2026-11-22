// Floor layouts: one job only. Three hand-built rooms of the Gilded
// Exchange, each a 24 x 17 tile map plus its patrol routes, laser grids,
// vent runs and chandeliers. Legend:
//   # wall   . floor   C display case   P pillar   S shadow zone
//   R rug    A wall art   V vent grate (crawl, unseen)
//   l coin   L painting   g gold bar   m gem   s wall safe
//   J CROWN JEWELS   D locked door   E stairs up
//   X getaway van   H roof helipad   T thief start
//   1 patrolman 2 hound 3 warden 4 sleuth 5 captain 6 drone
//   K security camera
// Rows are padded with wall if a line ever comes up short, so a typo in
// one row can never shift the whole floor.
import { TILE } from './config.js';

const FLOOR_1_MAP = [
  '########################',
  '#......CC......CC...E..#',
  '#.PP.....A.....A....PP.#',
  '#......##....##........#',
  '#..l...##....##...s....#',
  '#......##....##........#',
  '#..CC......TT......CC..#',
  '#................V.....#',
  '#..##...######...V##...#',
  '#..##...#....#...V##...#',
  '#.......#....#...V.....#',
  '#..CC...#....#...VCC...#',
  '#.......######...V.....#',
  '#..l.........g...V.l...#',
  '#..VVVVVVVVVVVVVVVVVV..#',
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
  '#..L....CC....##....1..#',
  '#......##....##...A....#',
  '#.SS...##....##....SS..#',
  '#..##...##...##...##...#',
  '#.....g......l......g..#',
  '#..CC.....CC......CC...#',
  '#.4.....K.....3......K.#',
  '#..VVVVVVVVVVVVVVVVVV..#',
];

const FLOOR_3_MAP = [
  '########################',
  '#..g....CC....CC....gH.#',
  '#.SS....A.....A....SS..#',
  '#..##..V...VV....V.##V.#',
  '#..##..V...Jm....V.##V.#',
  '#..##..V...VV....V.##V.#',
  '#.....P....P.....P...V.#',
  '#..C......TT.......C..V#',
  '#....................V.#',
  '#..PP.2.CC...CC...PP.V#',
  '#.......##....##......V#',
  '#..m...##....##....m.V#',
  '#.SS...##....##....SS.V#',
  '#......CC......CC.....V#',
  '#..L..........A....L..V#',
  '#X5....K....6....K..3V.#',
  '#..VVVVVVVVVVVVVVVVVVV.#',
];

// Patrol routes per floor: tile waypoints for each spawned guard, in
// spawn order (row-major scan of the map). Wardens ignore routes —
// they stand and sweep.
const PATROLS = [
  [
    [[3, 3], [20, 3], [20, 14], [3, 14]],
    [[20, 14], [20, 3], [3, 3], [3, 14]],
  ],
  [
    [[20, 9], [20, 4], [11, 4], [11, 12]],
    [[3, 4], [11, 4], [11, 12], [3, 12]],
    [[20, 10], [12, 10], [12, 4], [20, 4]],
  ],
  [
    [[6, 9], [6, 13], [17, 13], [17, 9]],
    [[3, 13], [10, 13], [10, 7], [3, 7]],
    [[12, 7], [12, 13], [20, 13], [20, 7]],
    [[20, 7], [20, 13], [13, 13], [13, 7]],
  ],
];

// Laser grids per floor: tile-space segments. Crossing a live beam
// raises the alarm fast; EMP kills the beams along with the cameras.
const LASERS = [
  [{ ax: 15, ay: 2, bx: 15, by: 5 }],
  [
    { ax: 8, ay: 4, bx: 14, by: 4 },
    { ax: 17, ay: 6, bx: 17, by: 8 },
  ],
  [
    { ax: 6, ay: 2, bx: 18, by: 2 },
    { ax: 6, ay: 3, bx: 6, by: 5 },
    { ax: 18, ay: 3, bx: 18, by: 5 },
    { ax: 6, ay: 6, bx: 18, by: 6 },
  ],
];

// Chandeliers per floor: tile positions for the warm glow pools.
const CHANDELIERS = [
  [{ x: 6, y: 2 }, { x: 18, y: 2 }, { x: 12, y: 8 }],
  [{ x: 12, y: 2 }, { x: 6, y: 9 }, { x: 18, y: 11 }],
  [{ x: 12, y: 7 }, { x: 6, y: 13 }, { x: 18, y: 13 }],
];

// The Crown Vault's steel ring on floor 3: tiles around the Jewels.
const VAULT_RING = [
  { x: 10, y: 3 }, { x: 11, y: 3 }, { x: 12, y: 3 },
  { x: 10, y: 4 }, { x: 12, y: 4 },
  { x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 },
];

const KIND_BY_CHAR = { 1: 'patrol', 2: 'hound', 3: 'warden', 4: 'sleuth', 5: 'captain', 6: 'drone' };
const LOOT_BY_CHAR = { l: 'coin', L: 'painting', g: 'gold', m: 'gem', s: 'safe', J: 'jewels' };

export function parseFloor(index) {
  const raw = [FLOOR_1_MAP, FLOOR_2_MAP, FLOOR_3_MAP][index];
  const width = Math.max(...raw.map((r) => r.length));
  const rows = raw.map((r) => (r.length < width ? r + '#'.repeat(width - r.length) : r.slice(0, width)));
  const walls = new Set();
  const covers = [];
  const pillars = [];
  const shadows = [];
  const vents = [];
  const rugs = [];
  const arts = [];
  const loot = [];
  const doors = [];
  const guards = [];
  const cameras = [];
  const lasers = (LASERS[index] || []).map((seg) => ({
    ax: seg.ax * TILE + TILE / 2,
    ay: seg.ay * TILE + TILE / 2,
    bx: seg.bx * TILE + TILE / 2,
    by: seg.by * TILE + TILE / 2,
  }));
  const chandeliers = (CHANDELIERS[index] || []).map((c) => ({ x: c.x * TILE + TILE / 2, y: c.y * TILE + TILE / 2 }));
  const vaultRing = index === 2 ? VAULT_RING.map((v) => ({ x: v.x * TILE + TILE / 2, y: v.y * TILE + TILE / 2 })) : [];
  let start = { x: 12 * TILE + TILE / 2, y: 8 * TILE + TILE / 2 };
  let exit = null;
  let getaway = null;
  let helipad = null;

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      const key = x + ',' + y;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') covers.push({ x: cx, y: cy, tx: x, ty: y });
      else if (ch === 'P') pillars.push({ x: cx, y: cy });
      else if (ch === 'S') shadows.push({ x: cx, y: cy, tx: x, ty: y });
      else if (ch === 'V') vents.push({ x: cx, y: cy, tx: x, ty: y });
      else if (ch === 'R') rugs.push({ x: cx, y: cy });
      else if (ch === 'A') arts.push({ x: cx, y: cy });
      else if (ch === 'D') doors.push({ x: cx, y: cy, tx: x, ty: y, open: false, progress: 0 });
      else if (ch === 'T') start = { x: cx, y: cy };
      else if (ch === 'E') exit = { x: cx, y: cy, tx: x, ty: y };
      else if (ch === 'X') getaway = { x: cx, y: cy, tx: x, ty: y };
      else if (ch === 'H') helipad = { x: cx, y: cy, tx: x, ty: y };
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
    vents,
    rugs,
    arts,
    loot,
    doors,
    guards,
    cameras,
    lasers,
    chandeliers,
    vaultRing,
    start,
    exit,
    getaway,
    helipad,
    width: rows[0].length,
    height: rows.length,
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

// Inside a vent grate the thief cannot be seen at all — by guards,
// cameras or lasers. The price is crawling speed.
export function inVent(floor, px, py) {
  const { tx, ty } = tileAt(floor, px, py);
  return floor.vents.some((v) => v.tx === tx && v.ty === ty);
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
