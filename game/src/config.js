// GILDED EXCHANGE — configuration: the numbers that tune the whole heist.
// One job only: constants, palette, tool definitions and guard-kind stats.
// The game is a real-time top-down stealth heist in three floors of a
// grand art-deco bank: sneak past patrols and sweeping cameras, lift the
// loot, crack the Crown Vault and reach the getaway van.
export const TILE = 40;
export const WORLD_W = 24 * TILE; // 960
export const WORLD_H = 17 * TILE; // 680
export const TOP_BAR = 40;
export const HUD_W = 320;
export const CANVAS_W = WORLD_W + HUD_W; // 1280
export const CANVAS_H = TOP_BAR + WORLD_H; // 720

export const COLORS = {
  floorLight: '#1d3a3a',
  floorDark: '#17302f',
  floorTrim: '#c9a227',
  wall: '#0f1f22',
  wallTop: '#2c4a4a',
  cover: '#6b4f1d',
  coverTop: '#8a6a2a',
  pillar: '#3d5a5a',
  rug: '#5a1f2b',
  rugEdge: '#c9a227',
  shadow: '#0a1a26',
  gold: '#ffd94a',
  goldDim: '#b8912a',
  gem: '#7fe7ff',
  jewel: '#ff5fa2',
  player: '#ffe9a8',
  playerSneak: '#cfe8ff',
  coneCalm: 'rgba(255, 190, 60, 0.20)',
  coneAlert: 'rgba(255, 60, 40, 0.34)',
  coneEdge: 'rgba(255, 210, 90, 0.55)',
  cameraCone: 'rgba(255, 80, 200, 0.22)',
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
  smoke: { key: 'Q', name: 'SMOKE BOMB', max: 3, cost: 1, desc: 'Blinds cones for 6s' },
  emp: { key: 'R', name: 'EMP PULSE', max: 2, cost: 1, desc: 'Kills cameras for 8s' },
  coin: { key: 'CLICK', name: 'COIN TOSS', max: 5, cost: 1, desc: 'Lures a guard to the spot' },
  pick: { key: 'E', name: 'LOCKPICK', max: 99, cost: 0, desc: 'Opens a locked door in 3s' },
};

// Guard kinds: five enemy kinds, each with its own patrol brain.
export const GUARD_KINDS = {
  patrol: { name: 'PATROLMAN', speed: 52, coneRange: 175, coneAngle: 1.25, color: '#e86a3a', desc: 'Walks his beat' },
  hound: { name: 'HOUND', speed: 92, coneRange: 120, coneAngle: 1.5, color: '#d8a13a', desc: 'Smells you close' },
  warden: { name: 'WARDEN', speed: 0, coneRange: 230, coneAngle: 1.9, color: '#b06ae8', desc: 'Sweeps a wide cone' },
  sleuth: { name: 'SLEUTH', speed: 66, coneRange: 190, coneAngle: 1.1, color: '#5aa8e8', desc: 'Hunts every noise' },
  captain: { name: 'CAPTAIN', speed: 78, coneRange: 210, coneAngle: 1.35, color: '#e83a5a', desc: 'Chases on any alarm' },
};

export const LOOT_VALUES = { coin: 250, painting: 1200, gold: 2500, gem: 4000, jewels: 50000 };
export const LOOT_NAMES = {
  coin: 'Gold Coin',
  painting: 'Gilded Portrait',
  gold: 'Gold Bar',
  gem: 'Sapphire',
  jewels: 'CROWN JEWELS',
};

export const FLOORS = [
  { name: 'FLOOR 1 · THE MARBLE LOBBY', sub: 'Slip past the desk guards — the Gallery stairs are north-east.' },
  { name: 'FLOOR 2 · THE GILDED GALLERY', sub: 'Portraits worth a fortune. The vault lift is behind a locked door.' },
  { name: 'FLOOR 3 · THE CROWN VAULT', sub: 'The Jewels are in the vault. Take them, then run for the van.' },
];

export const DETECTION = {
  sneakFactor: 0.45, // suspicion fills this much slower while sneaking
  shadowFactor: 0.5, // standing in a shadow zone halves it again
  fillPerSec: 1.6, // full suspicion in ~0.6s of clear sight at walk speed
  decayPerSec: 0.8,
  alarmOnSpot: 26, // alarm jump when a guard fully spots you
  alarmCameraPerSec: 14,
  alarmDecayPerSec: 2.2,
  lockdownAt: 100,
};

export const PLAYER_SPEED = 132;
export const PLAYER_SNEAK_SPEED = 64;
export const CATCH_RADIUS = 26;
export const LIVES = 3;
