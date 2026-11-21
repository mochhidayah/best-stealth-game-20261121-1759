// Shadow Vault — every pixel the game draws: floor, walls, shadows,
// vision cones, guards, relics, the exit and the HUD. Canvas 2D only,
// no images: the museum is drawn from shapes and gradients.

function drawFloor(ctx, level) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * TILE;
      const y = r * TILE;
      const key = c + ',' + r;
      if (level.walls.has(key)) {
        ctx.fillStyle = '#2c2f45';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#3a3e5c';
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = '#23263a';
        ctx.fillRect(x, y + TILE - 3, TILE, 3);
        continue;
      }
      const checker = (c + r) % 2 === 0;
      ctx.fillStyle = checker ? '#1d2033' : '#1a1d2e';
      ctx.fillRect(x, y, TILE, TILE);
      if (level.shadows.has(key)) {
        ctx.fillStyle = 'rgba(8, 12, 40, 0.55)';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = 'rgba(90, 120, 255, 0.25)';
        ctx.strokeRect(x + 1.5, y + 1.5, TILE - 3, TILE - 3);
      }
      if (level.cases.has(key)) {
        ctx.fillStyle = '#4a3421';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = '#6b4c2f';
        ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
        ctx.fillStyle = 'rgba(180, 220, 255, 0.35)';
        ctx.fillRect(x + 7, y + 7, TILE - 14, 6);
      }
    }
  }
  // Room labels, painted on the floor so the level reads at a glance.
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200, 210, 255, 0.28)';
  ctx.fillText('GALLERY', 4.5 * TILE, 1.4 * TILE);
  ctx.fillText('VAULT', 13.5 * TILE, 1.4 * TILE);
  ctx.fillText('ARCHIVE', 24.5 * TILE, 1.4 * TILE);
}

function drawExit(ctx, level, relicsDone) {
  const e = exitRect(level);
  const open = relicsDone;
  ctx.save();
  ctx.fillStyle = open ? '#1f7a4d' : '#5a2e2e';
  ctx.fillRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
  ctx.strokeStyle = open ? '#7dffb0' : '#c0392b';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCK', e.x + TILE / 2, e.y + TILE / 2 + 4);
  if (open) {
    ctx.fillStyle = 'rgba(125, 255, 176, 0.25)';
    ctx.fillRect(e.x, e.y, e.w, e.h);
  }
  ctx.restore();
}

function drawRelics(ctx, level, time) {
  for (const relic of level.relics) {
    if (relic.taken) continue;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + relic.index * 2);
    const glow = ctx.createRadialGradient(relic.x, relic.y, 2, relic.x, relic.y, 26);
    glow.addColorStop(0, 'rgba(255, 215, 90, ' + (0.55 + 0.3 * pulse) + ')');
    glow.addColorStop(1, 'rgba(255, 215, 90, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y, 26, 0, Math.PI * 2);
    ctx.fill();
    // A faceted gem: diamond with a bright core.
    ctx.save();
    ctx.translate(relic.x, relic.y + Math.sin(time * 2 + relic.index) * 2);
    ctx.fillStyle = '#ffd75a';
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(4, 0); ctx.lineTo(0, 11); ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(RELIC_NAMES[relic.index], relic.x, relic.y + 24);
  }
}

function drawVisionCone(ctx, guard) {
  const range = CONFIG.guardVisionRange;
  const half = CONFIG.guardVisionHalfAngle;
  const hot = guard.state === 'alerted';
  const warm = guard.state === 'suspicious' || guard.state === 'searching';
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.dir - half, guard.dir + half);
  ctx.closePath();
  const grad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, range);
  const col = hot ? '255, 70, 60' : warm ? '255, 170, 60' : '255, 220, 90';
  grad.addColorStop(0, 'rgba(' + col + ', 0.30)');
  grad.addColorStop(1, 'rgba(' + col + ', 0.05)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

function drawGuard(ctx, guard, time) {
  drawVisionCone(ctx, guard);
  // Body: a patrolling warden with a cap and a lantern dot.
  const bob = Math.sin(guard.bobPhase) * 1.5;
  ctx.save();
  ctx.translate(guard.x, guard.y + bob);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 9, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.tint;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1e2a';
  ctx.beginPath();
  ctx.arc(0, -2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.tint;
  ctx.fillRect(-8, -9, 16, 4);
  // Facing tick: a little nose showing where he looks.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.cos(guard.dir) * 8, Math.sin(guard.dir) * 8);
  ctx.lineTo(Math.cos(guard.dir) * 14, Math.sin(guard.dir) * 14);
  ctx.stroke();
  ctx.restore();
  // State mark: ? when suspicious, ! when alerted.
  if (guard.state === 'suspicious' || guard.state === 'searching') {
    drawMark(ctx, guard.x, guard.y - 24, '?', '#ffb03a');
  } else if (guard.state === 'alerted') {
    drawMark(ctx, guard.x, guard.y - 24, '!', '#ff463c');
  }
}

function drawMark(ctx, x, y, ch, color) {
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeText(ch, x, y);
  ctx.fillText(ch, x, y);
}

function drawPlayer(ctx, player, level, time) {
  const hidden = inShadow(level, player.x, player.y);
  const noiseR = playerNoiseRadius(player);
  if (noiseR > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (player.sneaking ? 0.12 : 0.25) + ')';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, noiseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 9, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded thief: dark cloak, pale face, gold trim.
  ctx.fillStyle = hidden ? '#2e4a6b' : '#3d6fb4';
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(10, 8);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2d8a7';
  ctx.beginPath();
  ctx.arc(0, -4, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d6fb4';
  ctx.beginPath();
  ctx.arc(0, -6, 6.5, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#ffd75a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(Math.cos(player.facing) * 6, Math.sin(player.facing) * 6);
  ctx.lineTo(Math.cos(player.facing) * 12, Math.sin(player.facing) * 12);
  ctx.stroke();
  ctx.restore();
  if (hidden) {
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9db8ff';
    ctx.fillText('HIDDEN', player.x, player.y - 20);
  }
}

function drawHud(ctx, player, guards, elapsed, message) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 12, 24, 0.85)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = '#e8ecff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SHADOW VAULT', 12, 22);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#ffd75a';
  ctx.fillText('Relics ' + player.relics + '/' + CONFIG.relicsToWin, 190, 22);
  ctx.fillStyle = '#e8ecff';
  ctx.fillText('Time ' + formatTime(elapsed), 300, 22);
  // Detection meter: the hottest guard's suspicion.
  const heat = maxSuspicion(guards);
  ctx.fillStyle = '#333';
  ctx.fillRect(430, 10, 180, 14);
  ctx.fillStyle = heat >= CONFIG.caughtAt ? '#ff463c' : heat >= CONFIG.suspectAt ? '#ffb03a' : '#7dffb0';
  ctx.fillRect(430, 10, 180 * (heat / 100), 14);
  ctx.strokeStyle = '#888';
  ctx.strokeRect(430, 10, 180, 14);
  ctx.fillStyle = '#e8ecff';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(heat >= CONFIG.caughtAt ? 'SPOTTED!' : heat >= CONFIG.suspectAt ? 'SUSPICIOUS' : 'UNSEEN', 618, 22);
  if (message) {
    ctx.fillStyle = '#ffd75a';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(message, VIEW_W - 12, 22);
  }
  ctx.restore();
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 22, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent || '#ffd75a';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 60);
  ctx.fillStyle = '#e8ecff';
  ctx.font = '17px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 16 + i * 28));
  ctx.restore();
}
