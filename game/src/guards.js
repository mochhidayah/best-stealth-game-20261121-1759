// Shadow Vault — guards: patrols, vision cones, suspicion and chase.
// A guard has four moods: patrol, suspicious (heard or glimpsed something),
// alerted (saw you clearly) and searching (lost you, checks the last spot).
// Detection is a meter, not a switch: a glimpse raises it, hiding lowers it.

function createGuard(patrol) {
  const [c0, r0] = patrol.waypoints[0];
  return {
    waypoints: patrol.waypoints.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE })),
    tint: patrol.tint,
    pause: patrol.pause,
    x: (c0 + 0.5) * TILE,
    y: (r0 + 0.5) * TILE,
    dir: 0, // facing angle, radians
    wpIndex: 1,
    waitTimer: 0,
    state: 'patrol', // patrol | suspicious | alerted | searching
    suspicion: 0, // 0..100, shared detection meter is the max across guards
    lastSeen: null,
    loseTimer: 0,
    investigate: null,
    bobPhase: Math.random() * 6,
  };
}

function guardSeesPlayer(guard, player, level) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONFIG.guardVisionRange) return 0;
  let angleDiff = Math.atan2(dy, dx) - guard.dir;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  if (Math.abs(angleDiff) > CONFIG.guardVisionHalfAngle) return 0;
  if (!hasLineOfSight(level, guard.x, guard.y, player.x, player.y)) return 0;
  // Closer = spotted faster; sneaking and shadows slow the meter down.
  const closeness = 1 - dist / CONFIG.guardVisionRange;
  let fill = CONFIG.detectFillFar + (CONFIG.detectFillClose - CONFIG.detectFillFar) * closeness;
  if (player.sneaking) fill *= CONFIG.sneakFactor;
  if (inShadow(level, player.x, player.y)) fill *= CONFIG.shadowFactor;
  return fill;
}

function guardHearsNoise(guard, nx, ny, radius) {
  if (guard.state === 'alerted') return;
  if (Math.hypot(nx - guard.x, ny - guard.y) <= radius + 40) {
    guard.investigate = { x: nx, y: ny };
    if (guard.state === 'patrol') guard.state = 'suspicious';
  }
}

function updateGuard(guard, player, level, dt) {
  guard.bobPhase += dt * 6;
  const seen = guardSeesPlayer(guard, player, level);

  if (seen > 0) {
    guard.suspicion = Math.min(CONFIG.caughtAt, guard.suspicion + seen * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.loseTimer = 0;
    if (guard.suspicion >= CONFIG.suspectAt && guard.state === 'patrol') guard.state = 'suspicious';
    if (guard.suspicion >= CONFIG.caughtAt) guard.state = 'alerted';
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - CONFIG.detectDecay * dt);
    if (guard.state === 'suspicious' && guard.suspicion <= 2) guard.state = 'patrol';
  }

  if (guard.state === 'alerted') {
    // Chase the last seen spot; give up after a few seconds blind.
    const target = guard.lastSeen || { x: player.x, y: player.y };
    guard.loseTimer += dt;
    if (guard.loseTimer > CONFIG.chaseLoseTime) {
      guard.state = 'searching';
      guard.investigate = { x: target.x, y: target.y };
    }
    moveGuardToward(guard, target, CONFIG.guardChaseSpeed, level, dt);
    return guard.suspicion;
  }

  const target = guard.state === 'suspicious' || guard.state === 'searching'
    ? guard.investigate
    : guard.waypoints[guard.wpIndex];

  if (!target) return guard.suspicion;

  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    if (guard.state === 'patrol') {
      if (guard.waitTimer <= 0) guard.waitTimer = guard.pause;
      guard.waitTimer -= dt;
      if (guard.waitTimer <= 0) {
        guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
        guard.waitTimer = 0;
      }
      // Look around while waiting at a waypoint: scan left and right.
      guard.dir += Math.sin(guard.bobPhase * 0.5) * 0.02;
    } else {
      // Reached the noise spot, found nothing: look around, then resume.
      guard.dir += dt * 1.2;
      guard.waitTimer += dt;
      if (guard.waitTimer > 2.2) {
        guard.state = 'patrol';
        guard.investigate = null;
        guard.waitTimer = 0;
        guard.wpIndex = nearestWaypoint(guard);
      }
    }
    return guard.suspicion;
  }
  guard.waitTimer = 0;
  moveGuardToward(guard, target, CONFIG.guardWalkSpeed, level, dt);
  return guard.suspicion;
}

function nearestWaypoint(guard) {
  let best = 0;
  let bestDist = Infinity;
  guard.waypoints.forEach((w, i) => {
    const d = Math.hypot(w.x - guard.x, w.y - guard.y);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function moveGuardToward(guard, target, speed, level, dt) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;
  const want = Math.atan2(dy, dx);
  let diff = want - guard.dir;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const turn = Math.max(-CONFIG.guardTurnSpeed * dt, Math.min(CONFIG.guardTurnSpeed * dt, diff));
  guard.dir += turn;
  const step = Math.min(dist, speed * dt);
  const pos = { x: guard.x, y: guard.y };
  moveWithCollision(level, pos, Math.cos(guard.dir) * step, Math.sin(guard.dir) * step, 12);
  guard.x = pos.x;
  guard.y = pos.y;
}

function guardCaughtPlayer(guard, player) {
  return guard.state === 'alerted' && Math.hypot(guard.x - player.x, guard.y - player.y) < 26;
}

function maxSuspicion(guards) {
  return guards.reduce((m, g) => Math.max(m, g.suspicion), 0);
}
