import { build } from 'vite';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('[InterviewIQ Client] Starting production build...');

// 1. Resolve and run TypeScript compiler
const tscCandidates = [
  path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc'),
  path.join(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc'),
];

const tscBin = tscCandidates.find((p) => fs.existsSync(p));

console.log('[InterviewIQ Client] Running TypeScript typecheck...');
let tscResult;
if (tscBin) {
  tscResult = spawnSync(process.execPath, [tscBin, '-p', '.'], {
    stdio: 'inherit',
    cwd: __dirname,
  });
} else {
  tscResult = spawnSync('tsc', ['-p', '.'], {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true,
  });
}

if (tscResult.status !== 0) {
  console.error('[InterviewIQ Client] TypeScript compilation failed with code:', tscResult.status);
  process.exit(tscResult.status || 1);
}

// 2. Run Vite build via programmatic API
console.log('[InterviewIQ Client] Running Vite production bundle...');
try {
  await build({ root: __dirname });
  console.log('[InterviewIQ Client] Build completed successfully.');
} catch (err) {
  console.error('[InterviewIQ Client] Vite build failed:', err);
  process.exit(1);
}
