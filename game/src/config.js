// GILDED EXCHANGE II — configuration: the numbers that tune the whole heist.
// One job only: constants, palette, tool and guard-kind definitions, loot.
// A real-time top-down heist across three floors of a grand art-deco bank:
// sneak past patrols and sweeping cameras, crawl the vents, slip the laser
// grids, lift the loot, crack the Crown Vault and reach the getaway van —
// or the roof helipad.
export const TILE = 40;
export const WORLD_W = 24 * TILE; // 960
export const WORLD_H = 17 * TILE; // 680
export const TOP_BAR = 40;
export const HUD_W = 320;
export const CANVAS_W = WORLD_W + HUD_W; // 1280
export const CANVAS_H = TOP_BAR + WORLD_H; // 720

export const COLORS = {
  floorLight: '#274541',
  floorDark: '#1e3633',
  floorVein: 'rgba(201, 162, 39, 0.22)',
  floorTrim: '#c9a227',
  wall: '#0d1c1e',
  wallTop: '#33524e',
  cover: '#6b4f1d',
  coverTop: '#8a6a2a',
  pillar: '#40605c',
  rug: '#5a1f2b',
  rugEdge: '#c9a227',
  shadow: '#0a1a2e',
  vent: '#0b2028',
  gold: '#ffd94a',
  goldDim: '#b8912a',
  gem: '#7fe7ff',
  jewel: '#ff5fa2',
  drone: '#3ae8d8',
  player: '#ffe9a8',
  coneCalm: 'rgba(255, 190, 60, 0.20)',
  coneAlert: 'rgba(255, 60, 40, 0.34)',
  coneEdge: 'rgba(255, 210, 90, 0.55)',
  cameraCone: 'rgba(255, 80, 200, 0.22)',
  laser: 'rgba(255, 45, 60, 0.85)',
  laserGlow: 'rgba(255, 45, 60, 0.28)',
  hudPanel: '#101d1d',
  hudLine: '#2a4a48',
  hudText: '#e8dcc0',
  hudMuted: '#8fb0a8',
  alarmLow: '#3fae6a',
  alarmMid: '#e8a13a',
  alarmHigh: '#e83a2e',
};

// Tools: every tool costs charges, and charges are earned by lifting loot,
// so the player must steal to stay equipped — tools at a cost.
export const TOOLS = {
  smoke: { key: 'Q', name: 'SMOKE BOMB', max: 3, cost: 1, desc: 'Blinds cones 6s' },
  emp: { key: 'R', name: 'EMP PULSE', max: 2, cost: 1, desc: 'Kills cameras + lasers 8s' },
  coin: { key: 'CLICK', name: 'COIN TOSS', max: 5, cost: 1, desc: 'Lures a guard' },
  decoy: { key: 'T', name: 'DECOY MOUSE', max: 2, cost: 1, desc: 'Wind-up mouse lures guards 8s' },
  pick: { key: 'E', name: 'LOCKPICK', max: 99, cost: 0, desc: 'Opens a locked door in 3s' },
};

// Guard kinds: six enemy kinds, each with its own patrol brain.
export const GUARD_KINDS = {
  patrol: { name: 'PATROLMAN', speed: 52, coneRange: 175, coneAngle: 1.25, color: '#e86a3a', desc: 'Walks his beat' },
  hound: { name: 'HOUND', speed: 92, coneRange: 120, coneAngle: 1.5, color: '#d8a13a', desc: 'Smells you close' },
  warden: { name: 'WARDEN', speed: 0, coneRange: 230, coneAngle: 1.9, color: '#b06ae8', desc: 'Sweeps a wide cone' },
  sleuth: { name: 'SLEUTH', speed: 66, coneRange: 190, coneAngle: 1.1, color: '#5aa8e8', desc: 'Hunts every noise' },
  captain: { name: 'CAPTAIN', speed: 78, coneRange: 210, coneAngle: 1.35, color: '#e83a5a', desc: 'Chases on any alarm' },
  drone: { name: 'DRONE', speed: 70, coneRange: 170, coneAngle: 1.0, color: '#3ae8d8', desc: 'Hovers its beat, EMP stuns it' },
};

export const LOOT_VALUES = { coin: 250, painting: 1200, gold: 2500, gem: 4000, safe: 6000, jewels: 50000 };
export const LOOT_NAMES = {
  coin: 'Gold Coin',
  painting: 'Gilded Portrait',
  gold: 'Gold Bar',
  gem: 'Sapphire',
  safe: 'Wall Safe',
  jewels: 'CROWN JEWELS',
};

export const FLOORS = [
  { name: 'FLOOR 1 · THE MARBLE LOBBY', sub: 'Slip past the desk guards — the Gallery stairs are north-east.' },
  { name: 'FLOOR 2 · THE GILDED GALLERY', sub: 'Portraits worth a fortune. The vault lift is behind a locked door.' },
  { name: 'FLOOR 3 · THE CROWN VAULT', sub: 'The Jewels are in the vault. Take them, then run — van or helipad.' },
];

export const DETECTION = {
  sneakFactor: 0.45, // suspicion fills this much slower while sneaking
  shadowFactor: 0.5, // standing in a shadow zone halves it again
  fillPerSec: 1.6, // full suspicion in ~0.6s of clear sight at walk speed
  decayPerSec: 0.8,
  alarmOnSpot: 26, // alarm jump when a guard fully spots you
  alarmCameraPerSec: 14,
  alarmLaserPerSec: 30, // crossing a live laser beam
  alarmDecayPerSec: 2.2,
  lockdownAt: 100,
};

export const PLAYER_SPEED = 132;
export const PLAYER_SNEAK_SPEED = 64;
export const PLAYER_VENT_SPEED = 48; // crawling the vents is slow but unseen
export const CATCH_RADIUS = 26;
export const LIVES = 3;
export const UNSEEN_BONUS = 2500; // per floor cleared without being spotted
