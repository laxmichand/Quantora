#!/usr/bin/env node
/**
 * Jira sync helper for the CI/CD pipeline.
 *
 * Drives Quantora issues through the workflow using only transitions the Jira
 * workflow actually exposes. Because Jira Cloud cannot add statuses/transitions
 * via API, this maps logical pipeline stages to existing workflow statuses:
 *
 *   Backlog / To Do        -> "To Do"
 *   In Progress            -> "In Progress"
 *   Code Review            -> "Code Review"
 *   QA Testing / In QA     -> "In QA"
 *   QA Failed              -> "QA Failed"
 *   QA Passed              -> "Passed"
 *   Ready for Release      -> "Ready for Release" (after manual workflow wiring)
 *   Released               -> "Released"           (after manual workflow wiring)
 *   Closed                 -> "Closed"
 *
 * Issues in "QA Failed" are NOT auto-returned to "In Progress" - that move is
 * manual (user action) by design.
 *
 * Usage:
 *   node scripts/jira-sync.mjs <command> [args...]
 *
 * Commands:
 *   extract-keys [strings...]          Print Jira keys found in the given text.
 *   status <key>                       Print the issue's current status name.
 *   transition <key> <target> [note]   Move issue to a workflow status by name.
 *   comment <key> <text>               Post a comment to the issue.
 *
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN
 */

const BASE = process.env.JIRA_URL;
const AUTH = Buffer.from(`${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`).toString(
  'base64',
);
const HEADERS = {
  Authorization: `Basic ${AUTH}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const KEY_RE = /([A-Z][A-Z0-9_]{2,}-\d{1,})/g;

function fail(msg) {
  console.error(`[jira-sync] ${msg}`);
  process.exit(1);
}

async function jira(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS, ...options });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

function extractKeys(...inputs) {
  const keys = new Set();
  for (const input of inputs.flat()) {
    if (!input) continue;
    for (const m of input.matchAll(KEY_RE)) keys.add(m[1]);
  }
  return [...keys];
}

async function getTransitions(key) {
  const { res, body } = await jira(`/rest/api/2/issue/${key}/transitions`);
  if (!res.ok) fail(`get transitions for ${key}: ${res.status} ${JSON.stringify(body)}`);
  return body.transitions;
}

async function currentStatus(key) {
  const { res, body } = await jira(`/rest/api/2/issue/${key}?fields=status`);
  if (!res.ok) fail(`get status for ${key}: ${res.status}`);
  return body.fields.status?.name;
}

async function transitionTo(key, target) {
  const transitions = await getTransitions(key);
  const match = transitions.find((t) => t.to.name.toLowerCase() === target.toLowerCase());
  if (!match) {
    const available = transitions.map((t) => t.to.name).join(', ');
    console.log(`[jira-sync] ${key}: no transition to "${target}" (available: ${available})`);
    return false;
  }
  const { res, body } = await jira(`/rest/api/2/issue/${key}/transitions`, {
    method: 'POST',
    body: JSON.stringify({ transition: { id: match.id } }),
  });
  if (!res.ok) fail(`transition ${key} -> ${target}: ${res.status} ${JSON.stringify(body)}`);
  console.log(
    `[jira-sync] ${key}: ${await currentStatus(key)} -> ${target} (transition ${match.id})`,
  );
  return true;
}

async function comment(key, text) {
  const { res, body } = await jira(`/rest/api/2/issue/${key}/comment`, {
    method: 'POST',
    body: JSON.stringify({ body: text }),
  });
  if (!res.ok) fail(`comment ${key}: ${res.status} ${JSON.stringify(body)}`);
  console.log(`[jira-sync] comment posted on ${key}`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!BASE || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
    fail('JIRA_URL, JIRA_USERNAME and JIRA_API_TOKEN env vars are required');
  }

  switch (cmd) {
    case 'extract-keys':
      console.log(extractKeys(args).join('\n'));
      break;
    case 'transition': {
      const [key, target, ...note] = args;
      if (!key || !target) fail('usage: transition <key> <target> [note]');
      await transitionTo(key, target);
      if (note.length) await comment(key, note.join(' '));
      break;
    }
    case 'status': {
      const [key] = args;
      if (!key) fail('usage: status <key>');
      console.log(await currentStatus(key));
      break;
    }
    case 'comment': {
      const [key, ...text] = args;
      if (!key || !text.length) fail('usage: comment <key> <text>');
      await comment(key, text.join(' '));
      break;
    }
    default:
      fail(`unknown command "${cmd}"`);
  }
}

main().catch((e) => fail(e.message));
