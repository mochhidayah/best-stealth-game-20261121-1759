// Shadow Vault — level parsing, tile collision and line of sight.
// The map is plain text (see config.js); this file turns it into the
// walls, shadow pools, cases, relic spots and exit the game plays on.

function parseLevelMap(rows) {
  const walls = new Set();
  const cases = new Set();
  const shadows = new Set();
  const relics = [];
  let playerStart = { x: 2.5 * TILE, y: 2.5 * TILE };
  let exitTile = { col: 26, row: 15 };

  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const key = c + ',' + r;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') cases.add(key);
      else if (ch === 'S') shadows.add(key);
      else if (ch === 'R') relics.push({ col: c, row: r, x: (c + 0.5) * TILE, y: (r + 0.5) * TILE, taken: false, index: relics.length });
      else if (ch === 'P') playerStart = { x: (c + 0.5) * TILE, y: (r + 0.5) * TILE };
      else if (ch === 'E') exitTile = { col: c, row: r };
    }
  });
  return { walls, cases, shadows, relics, playerStart, exitTile };
}

function tileAt(level, px, py) {
  return { col: Math.floor(px / TILE), row: Math.floor(py / TILE) };
}

function isSolidTile(level, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
  return level.walls.has(col + ',' + row) || level.cases.has(col + ',' + row);
}

// Circle-vs-tiles collision: slide along walls instead of sticking.
function moveWithCollision(level, pos, dx, dy, radius) {
  const nx = pos.x + dx;
  if (!hitsSolid(level, nx, pos.y, radius)) pos.x = nx;
  const ny = pos.y + dy;
  if (!hitsSolid(level, pos.x, ny, radius)) pos.y = ny;
}

function hitsSolid(level, px, py, radius) {
  const corners = [
    [px - radius, py - radius], [px + radius, py - radius],
    [px - radius, py + radius], [px + radius, py + radius],
    [px - radius, py], [px + radius, py], [px, py - radius], [px, py + radius],
  ];
  return corners.some(([x, y]) => {
    const t = tileAt(level, x, y);
    return isSolidTile(level, t.col, t.row);
  });
}

function inShadow(level, px, py) {
  const t = tileAt(level, px, py);
  return level.shadows.has(t.col + ',' + t.row);
}

// Line of sight: step along the ray; walls and cases block vision.
function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = tileAt(level, x0 + (dx * i) / steps, y0 + (dy * i) / steps);
    if (isSolidTile(level, t.col, t.row)) return false;
  }
  return true;
}

function exitRect(level) {
  return {
    x: level.exitTile.col * TILE,
    y: level.exitTile.row * TILE,
    w: TILE,
    h: TILE,
  };
}
