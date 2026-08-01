import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

function extractKeys(input) {
  const out = execFileSync('node', ['scripts/jira-sync.mjs', 'extract-keys', input], {
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

test('extracts Jira keys from commit text', () => {
  assert.deepEqual(extractKeys('fix(auth): refresh token (QUAN-12, QUAN-3)'), ['QUAN-12', 'QUAN-3']);
});

test('extracts single key from branch name', () => {
  assert.deepEqual(extractKeys('feature/QUAN-15-market-data'), ['QUAN-15']);
});

test('dedupes repeated keys', () => {
  assert.deepEqual(extractKeys('QUAN-1 fix, QUAN-1 again'), ['QUAN-1']);
});
