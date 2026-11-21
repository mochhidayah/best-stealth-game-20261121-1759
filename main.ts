// Shadow Vault — hand-in program (Node 22, standard library only).
// Copies this repo's game/ and screenshots/ into the output directory
// and writes dossier.json with the vendored make.fun library, so the
// judge can read the game from its screenshots and source outline.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader: /output is used instead (MAKEFUN_OUTPUT_DIR unset).

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output: game/ and screenshots/ are copied whole, nothing else.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
const shotsDir = join(repoRoot, 'screenshots');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// Refuse early with a plain message when the entry is incomplete:
// the dossier builder throws a bare DossierError for missing screenshots,
// which hides which part of the hand-in is at fault.
const shotNamesEarly = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)) : [];
if (shotNamesEarly.length < 3) {
  throw new Error('Shadow Vault hand-in needs 3 or 4 screenshots in screenshots/ (found ' + shotNamesEarly.length + ').');
}

// The scorer's own caps: text capped at 160 KiB, at most 4 screenshots
// of 256 KiB each, game/ at most 993 files / 48 MiB, paths under 1000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// Small human-readable confirmation on stdout (not part of the entry).
const shotNames = readdirSync(join(outputDir, 'screenshots')).sort();
console.log('Shadow Vault handed in: ' + shotNames.length + ' screenshots, dossier ' + dossier.length + ' bytes.');
