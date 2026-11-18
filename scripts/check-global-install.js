import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSupportedAgents, installSkills } from 'skills';

// Global writes are tested only on the disposable GitHub-hosted runner account.
if (process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error(
    'Run this check on a disposable GitHub Actions runner, not a developer account',
  );
}
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'commitlingo-global-check-'));
const configFile = path.join(cwd, '.agents/commit-config.json');
fs.mkdirSync(path.dirname(configFile), { recursive: true });
fs.writeFileSync(configFile, '{"locale":"ru"}');
const agent = getSupportedAgents().find(
  (candidate) => candidate.id === 'codex',
);
assert.ok(agent.globalSkillsDir);
const existing = fs.existsSync(agent.globalSkillsDir)
  ? fs
      .readdirSync(agent.globalSkillsDir)
      .filter((name) => name !== 'commitlingo')
      .sort()
  : [];
const source = fileURLToPath(
  new URL('../skills/commitlingo/', import.meta.url),
);
const result = await installSkills(source, {
  cwd,
  scope: 'global',
  agents: ['codex'],
  skills: ['commitlingo'],
  mode: 'copy',
  telemetry: false,
});
assert.deepEqual(result.failed, []);
assert.equal(result.installed.length, 1);
assert.equal(result.installed[0].scope, 'global');
assert.ok(
  fs.existsSync(path.join(result.installed[0].path, 'scripts/project.js')),
);
assert.equal(fs.readFileSync(configFile, 'utf8'), '{"locale":"ru"}');
assert.equal(
  fs.existsSync(path.join(cwd, '.agents/skills/commitlingo')),
  false,
);
assert.deepEqual(
  fs
    .readdirSync(agent.globalSkillsDir)
    .filter((name) => name !== 'commitlingo')
    .sort(),
  existing,
);
console.log(
  'Global Codex installation preserved project configuration and other skill entries',
);
