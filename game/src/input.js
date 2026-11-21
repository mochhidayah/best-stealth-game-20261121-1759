// Shadow Vault — keyboard input. One shared key table, read by the
// player update each frame; also the "any key starts" hook for audio.

const keys = {};

function bindInput(onFirstKey) {
  let started = false;
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!started) {
      started = true;
      if (onFirstKey) onFirstKey();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}

function anyMovementKey() {
  return keys['w'] || keys['a'] || keys['s'] || keys['d'] ||
    keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
}
