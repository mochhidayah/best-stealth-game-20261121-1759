// Shadow Vault — the player: movement, sneaking, noise and pickups.
// One job: turn held keys into a position, a noise ring and a state
// the guards can react to.

function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: CONFIG.playerRadius,
    sneaking: false,
    moving: false,
    movingFast: false,
    facing: 0, // radians, for the little direction tick
    relics: 0,
    stepPhase: 0,
  };
}

function updatePlayer(player, keys, level, dt, onNoise) {
  let mx = 0;
  let my = 0;
  if (keys['arrowleft'] || keys['a']) mx -= 1;
  if (keys['arrowright'] || keys['d']) mx += 1;
  if (keys['arrowup'] || keys['w']) my -= 1;
  if (keys['arrowdown'] || keys['s']) my += 1;

  player.sneaking = !!(keys['shift']);
  player.moving = mx !== 0 || my !== 0;
  player.movingFast = player.moving && !player.sneaking;

  if (player.moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = player.sneaking ? CONFIG.playerSneakSpeed : CONFIG.playerWalkSpeed;
    player.facing = Math.atan2(my, mx);
    moveWithCollision(level, player, mx * speed * dt, my * speed * dt, player.radius);
    player.stepPhase += dt * (player.sneaking ? 5 : 9);
    // Footsteps: running is loud enough for nearby guards to hear.
    if (player.movingFast && Math.floor(player.stepPhase) % 2 === 0) {
      onNoise(player.x, player.y, CONFIG.noiseRunRadius);
    } else if (player.sneaking && Math.floor(player.stepPhase) % 4 === 0) {
      onNoise(player.x, player.y, CONFIG.noiseSneakRadius);
    }
  }
}

function playerNoiseRadius(player) {
  if (!player.moving) return 0;
  return player.sneaking ? CONFIG.noiseSneakRadius : CONFIG.noiseRunRadius;
}

function tryPickupRelics(player, level) {
  for (const relic of level.relics) {
    if (!relic.taken && Math.hypot(player.x - relic.x, player.y - relic.y) < 24) {
      relic.taken = true;
      player.relics += 1;
      return relic;
    }
  }
  return null;
}

function playerAtExit(player, level) {
  const e = exitRect(level);
  return player.x > e.x && player.x < e.x + e.w && player.y > e.y && player.y < e.y + e.h;
}
