// Shadow Vault — game loop, screens and screenshot staging.
// States: title -> playing -> caught | won. The ?shot= query param
// stages a scene (start / play / alert / win) so screenshots show the
// game at its best without a human having to play it first.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const level = parseLevelMap(LEVEL_MAP);
const player = createPlayer(level.playerStart);
const guards = GUARD_PATROLS.map(createGuard);

let state = 'title'; // title | playing | caught | won
let elapsed = 0;
let time = 0;
let message = '';
let messageTimer = 0;
let lastTs = 0;
let wasSpotted = false;
let footstepTimer = 0;
let shotMode = null;

function showMessage(text, secs) {
  message = text;
  messageTimer = secs || 2.5;
}

function resetGame() {
  const p = createPlayer(level.playerStart);
  player.x = p.x; player.y = p.y; player.relics = 0; player.sneaking = false;
  level.relics.forEach((r) => { r.taken = false; });
  guards.forEach((g, i) => {
    const fresh = createGuard(GUARD_PATROLS[i]);
    Object.assign(g, fresh);
  });
  elapsed = 0;
  wasSpotted = false;
  stopAlarm();
}

function startGame() {
  resetGame();
  state = 'playing';
  showMessage('Steal all 3 relics, then reach the EXIT.', 3);
}

function stageShot(mode) {
  shotMode = mode;
  if (mode === 'start') {
    state = 'title';
  } else if (mode === 'play') {
    state = 'playing';
    // Mid-heist: one relic taken, thief creeping past a patrolling guard.
    level.relics[0].taken = true;
    player.relics = 1;
    player.x = 9.5 * TILE; player.y = 8.5 * TILE;
    player.sneaking = true;
    guards[0].x = 8.5 * TILE; guards[0].y = 5.5 * TILE; guards[0].dir = Math.PI / 2;
    guards[1].x = 20.5 * TILE; guards[1].y = 8.5 * TILE; guards[1].dir = Math.PI;
    showMessage('Relic 1/3 — stay out of the cones!', 99);
  } else if (mode === 'alert') {
    state = 'playing';
    level.relics[0].taken = true;
    level.relics[1].taken = true;
    player.relics = 2;
    player.x = 13.5 * TILE; player.y = 8.5 * TILE;
    player.sneaking = false;
    guards[1].x = 16.5 * TILE; guards[1].y = 8.5 * TILE; guards[1].dir = Math.PI;
    guards[1].state = 'alerted';
    guards[1].suspicion = 100;
    guards[1].lastSeen = { x: player.x, y: player.y };
    startAlarm();
    showMessage('SPOTTED! Break line of sight!', 99);
  } else if (mode === 'win') {
    state = 'won';
    level.relics.forEach((r) => { r.taken = true; });
    player.relics = 3;
    player.x = 26.5 * TILE; player.y = 15.5 * TILE;
    elapsed = 187;
  }
}

function update(dt) {
  time += dt;
  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0) message = '';
  }
  if (state !== 'playing') return;
  elapsed += dt;

  updatePlayer(player, keys, level, dt, (x, y, radius) => {
    guards.forEach((g) => guardHearsNoise(g, x, y, radius));
  });

  // Footstep sounds, timed to the stride.
  if (player.moving) {
    footstepTimer -= dt;
    if (footstepTimer <= 0) {
      playFootstep(player.sneaking);
      footstepTimer = player.sneaking ? 0.55 : 0.34;
    }
  }

  let spotted = false;
  for (const guard of guards) {
    updateGuard(guard, player, level, dt);
    if (guard.state === 'alerted') spotted = true;
    if (guardCaughtPlayer(guard, player)) {
      state = 'caught';
      playCaught();
      stopAlarm();
      return;
    }
  }
  if (spotted && !wasSpotted) {
    playSpotted();
    startAlarm();
    showMessage('SPOTTED! Break line of sight!', 2.5);
  }
  if (!spotted && wasSpotted) stopAlarm();
  wasSpotted = spotted;

  const relic = tryPickupRelics(player, level);
  if (relic) {
    playPickup();
    showMessage(RELIC_NAMES[relic.index] + ' stolen! (' + player.relics + '/' + CONFIG.relicsToWin + ')', 2.5);
    if (player.relics >= CONFIG.relicsToWin) showMessage('All relics! Reach the EXIT!', 3);
  }

  if (player.relics >= CONFIG.relicsToWin && playerAtExit(player, level)) {
    state = 'won';
    playWin();
    stopAlarm();
  }
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, level);
  drawExit(ctx, level, player.relics >= CONFIG.relicsToWin);
  drawRelics(ctx, level, time);
  for (const guard of guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, player, level, time);
  drawHud(ctx, player, guards, elapsed, message);

  if (state === 'title') {
    drawOverlay(ctx, STORY_LINES[0], STORY_LINES.slice(1).concat(['Press ENTER or click to start']), '#ffd75a');
  } else if (state === 'caught') {
    drawOverlay(ctx, 'CAUGHT!', ['The wardens found you in the vault.', 'Press ENTER to try again — quieter this time.'], '#ff463c');
  } else if (state === 'won') {
    drawOverlay(ctx, 'CLEAN GETAWAY!', [
      'All ' + CONFIG.relicsToWin + ' relics stolen in ' + formatTime(elapsed) + ' — unseen.',
      'Press ENTER to run it again, faster and quieter.',
    ], '#7dffb0');
  }
}

function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function onKeyStart() {
  ensureAudio();
  if (state === 'title' || state === 'caught' || state === 'won') {
    if (keys['enter'] || anyMovementKey() || keys[' ']) startGame();
  }
}

bindInput(onKeyStart);
canvas.addEventListener('click', () => {
  ensureAudio();
  if (state !== 'playing') startGame();
});

// Screenshot staging: ?shot=start|play|alert|win
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) stageShot(shot);

requestAnimationFrame(loop);
