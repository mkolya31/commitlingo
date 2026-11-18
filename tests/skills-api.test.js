import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { installSkills } from 'skills';
import { repository, write } from './support.js';

test('real Skills CLI API copies only CommitLingo and preserves consuming-project data on reinstall', async (t) => {
  const root = repository(t);
  const retained = [
    ['.agents/commit-config.json', '{"locale":"de"}'],
    ['.agents/commitlingo/locales/de.md', 'project translation'],
    ['.agents/commitlingo/locale-reviews.json', '{"version":1,"locales":{}}'],
    ['.agents/skills/unrelated/SKILL.md', 'unrelated skill'],
  ];
  for (const [file, content] of retained) write(root, file, content);
  const source = fileURLToPath(
    new URL('../skills/commitlingo/', import.meta.url),
  );
  const options = {
    cwd: root,
    scope: 'project',
    mode: 'copy',
    agents: ['codex'],
    skills: ['commitlingo'],
    telemetry: false,
  };
  const first = await installSkills(source, options);
  assert.deepEqual(first.failed, []);
  assert.equal(first.installed.length, 1);
  assert.equal(first.installed[0].scope, 'project');
  assert.ok(
    path
      .resolve(first.installed[0].path)
      .startsWith(path.resolve(root) + path.sep),
  );
  write(
    root,
    path.relative(root, first.installed[0].path) + '/stale.txt',
    'old release file',
  );
  const second = await installSkills(source, options);
  assert.deepEqual(second.failed, []);
  assert.equal(
    fs.existsSync(path.join(second.installed[0].path, 'stale.txt')),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(second.installed[0].path, 'scripts/project.js')),
    true,
  );
  for (const [file, content] of retained)
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), content);
});
