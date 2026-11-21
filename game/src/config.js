// Shadow Vault — tuning constants and the museum floor plan.
// Every number here is original to this game; the map is drawn as text
// so a level tweak is one character, not a code change.

const TILE = 32;
const COLS = 30;
const ROWS = 19;
const VIEW_W = COLS * TILE; // 960
const VIEW_H = ROWS * TILE; // 608

const CONFIG = {
  tile: TILE,
  playerRadius: 11,
  playerWalkSpeed: 132, // px per second
  playerSneakSpeed: 72,
  guardWalkSpeed: 62,
  guardChaseSpeed: 118,
  guardVisionRange: 185,
  guardVisionHalfAngle: 0.61, // ~35 degrees each side
  guardTurnSpeed: 2.4,
  detectFillClose: 62, // detection points per second, point blank
  detectFillFar: 22, // detection points per second, at max range
  detectDecay: 34,
  sneakFactor: 0.45, // sneaking multiplies detection fill
  shadowFactor: 0.3, // standing in a shadow zone multiplies detection fill
  suspectAt: 35, // detection level where a guard gets suspicious
  caughtAt: 100,
  noiseRunRadius: 95,
  noiseSneakRadius: 26,
  chaseLoseTime: 4.0, // seconds without seeing the player before giving up
  relicsToWin: 3,
};

// Map legend:
//   # wall   . floor   S shadow pool (dark, hides you)
//   C display case (cover: blocks movement and sight)
//   R relic  P player start  E exit door
const LEVEL_MAP = [
  '##############################',
  '#........#........#..........#',
  '#.P......#...R....#....C.....#',
  '#........#........#..........#',
  '#..CC....D....CC..D....CC....#',
  '#........#........#..........#',
  '###.######.########.######.###',
  '#....S..........C............#',
  '#.C......#...R....#....C.....#',
  '#....S...#........#....S.....#',
  '#........D...CC...D..........#',
  '#..C.....#........#....C.....#',
  '###.######.########.######.###',
  '#......S.#....C...#....S.....#',
  '#.C......#........#....C.....#',
  '#.....R..#...C....#.....E....#',
  '#........#........#..........#',
  '#..S.....#...CC...#....S.....#',
  '##############################',
];

// Guard patrols: tile waypoints, walked in order and back again.
const GUARD_PATROLS = [
  { waypoints: [[2, 3], [13, 3], [13, 5], [2, 5]], pause: 1.1, tint: '#e74c3c' },
  { waypoints: [[16, 8], [27, 8], [27, 10], [16, 10]], pause: 0.9, tint: '#e67e22' },
  { waypoints: [[2, 14], [12, 14], [12, 16], [2, 16]], pause: 1.2, tint: '#e74c3c' },
  { waypoints: [[26, 7], [26, 17]], pause: 1.6, tint: '#9b59b6' },
];

const RELIC_NAMES = ['Moon Pearl', 'Sun Idol', 'Star Crown'];

const STORY_LINES = [
  'SHADOW VAULT',
  'Steal 3 relics. Dodge the cones. Slip out unseen.',
  'WASD / arrows — move    SHIFT — sneak (slow, quiet, hard to spot)',
  'Stay out of the yellow cones. Shadows hide you. Running makes noise.',
];
