import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { delegateVersion } from '../lib/installer.js';
import { repository, write } from './support.js';

test('version-matched update uses Node argument arrays and keeps exact version and scope', (t) => {
  const root = repository(t);
  const previous = process.env.npm_execpath;
  t.after(() => {
    if (previous === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = previous;
  });
  const npmCli = write(
    root,
    'tools with spaces/npm-cli.js',
    'require("node:fs").writeFileSync("delegated.json", JSON.stringify(process.argv.slice(2)));\n',
  );
  process.env.npm_execpath = path.join(path.dirname(npmCli), 'npx-cli.js');
  assert.deepEqual(delegateVersion('1.2.3', 'global', root), {
    delegated: '1.2.3',
    scope: 'global',
  });
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(root, 'delegated.json'), 'utf8')),
    [
      'exec',
      '--yes',
      '--package=commitlingo@1.2.3',
      '--',
      'commitlingo',
      '--global',
    ],
  );
  assert.throws(
    () => delegateVersion('1.2.3;echo injected', 'project', root),
    /invalid/u,
  );
  fs.writeFileSync(npmCli, 'process.exitCode = 5;\n');
  assert.throws(() => delegateVersion('1.2.3', 'project', root), /status 5/u);
});
