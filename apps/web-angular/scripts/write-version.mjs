import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(appRoot, 'package.json'), 'utf8'));
const version = pkg.version || '0.0.0';

const gitSha =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  git(() => execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(), 'unknown');
const gitRef =
  process.env.VERCEL_GIT_COMMIT_REF ||
  git(() => execSync('git branch --show-current', { encoding: 'utf8' }).trim(), 'main');
const buildTime = new Date().toISOString();

function git(fn, fallback) {
  try {
    return fn() || fallback;
  } catch {
    return fallback;
  }
}

const info = { version, gitSha, gitRef, buildTime };

const generatedDir = resolve(appRoot, 'src/generated');
mkdirSync(generatedDir, { recursive: true });

writeFileSync(
  resolve(generatedDir, 'version.ts'),
  [
    'export interface BuildVersion {',
    '  version: string;',
    '  gitSha: string;',
    '  gitRef: string;',
    '  buildTime: string;',
    '}',
    '',
    'export const buildVersion: BuildVersion = {',
    `  version: '${info.version}',`,
    `  gitSha: '${info.gitSha}',`,
    `  gitRef: '${info.gitRef}',`,
    `  buildTime: '${info.buildTime}',`,
    '};',
    '',
  ].join('\n'),
);

writeFileSync(resolve(appRoot, 'src/assets/version.json'), JSON.stringify(info, null, 2) + '\n');

console.log(
  `[version] v${info.version} · ${info.gitSha.slice(0, 7)} · ${info.gitRef} · ${info.buildTime}`,
);
