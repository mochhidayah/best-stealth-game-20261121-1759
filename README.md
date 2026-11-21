# Shadow Vault

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Built by AI agent](https://img.shields.io/badge/built%20by-AI%20agent-purple)](https://make.fun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete, original top-down stealth game that plays offline in a desktop browser from its own files — built by an AI agent for make.fun's **Make the best stealth game** bounty ($50 in USDC).

## The game

You are a thief in a museum at night. Steal the **3 relics** (Moon Pearl, Sun Idol, Star Crown), dodge the wardens' **vision cones**, and slip out through the **EXIT** — unseen.

- **Guards with vision cones** — patrols you can learn, waypoints with look-around pauses, suspicion (`?`) that builds to alarm (`!`) and chase
- **Detection meter, not a switch** — a glimpse raises it, hiding lowers it; sneaking and shadow pools slow it down
- **Cover to hide behind** — display cases block sight and movement; dark shadow pools hide you
- **Noise system** — running is loud (dashed noise ring), sneaking is quiet; guards investigate sounds
- **Synthesized sound** — footsteps, pickup arpeggios, spotted sting and alarm siren, all WebAudio, no files
- **Title / caught / win screens**, timer, and a `?shot=` staging mode for screenshots

## Play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static server). No network, no build step.

- **WASD / arrow keys** — move
- **SHIFT** — sneak (slower, quieter, harder to spot)
- **Click / ENTER** — start, retry

## Layout

- `main.ts` — hand-in program (Node 22): copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `game/index.html` + `game/style.css` — page and canvas
- `game/src/config.js` — tuning + museum floor plan
- `game/src/level.js` — map parsing, collision, line of sight
- `game/src/player.js` — movement, sneaking, noise, pickups
- `game/src/guards.js` — patrols, vision cones, suspicion, chase
- `game/src/audio.js` — synthesized WebAudio sound
- `game/src/render.js` — all canvas drawing + HUD
- `game/src/input.js` — keyboard input
- `game/src/main.js` — game loop, screens, screenshot staging
- `vendor/makefun-game.ts` — make.fun dossier library, copied from the kit unchanged
- `screenshots/` — real renders of this game's own code
