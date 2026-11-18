import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function git(root, ...args) {
  // These tests intentionally exercise the installed Git in disposable repositories.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function repository(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'commitlingo-test-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'CommitLingo Test');
  git(root, 'config', 'user.email', 'test@example.invalid');
  git(root, 'config', 'commit.gpgsign', 'false');
  git(root, 'config', 'core.autocrlf', 'false');
  t.after(() => {
    const resolved = fs.realpathSync(root);
    if (
      !resolved.startsWith(
        fs.realpathSync(os.tmpdir()) + path.sep + 'commitlingo-test-',
      )
    ) {
      throw new Error('Refusing cleanup outside the test temporary directory');
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return root;
}

export function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

export function commit(root, message) {
  git(root, 'add', '--', '.');
  git(root, 'commit', '-qm', message);
}
