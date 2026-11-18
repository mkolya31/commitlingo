import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commit, git, write } from '../tests/support.js';

const requests = {
  'ru-config': 'Use CommitLingo to suggest a commit message.',
  'history-80': 'Use CommitLingo to suggest a commit message.',
  initial: 'Use CommitLingo to suggest a commit message.',
  empty: 'Use CommitLingo to make a commit.',
  partial: 'Use CommitLingo to make a commit.',
  'missing-locale':
    'Use CommitLingo to make a commit in the configured project language.',
  'corrupt-config': 'Use CommitLingo to make a commit.',
  'hook-failure': 'Use CommitLingo to make a commit.',
  'commitlint-ok': 'Use CommitLingo to suggest a commit message.',
  'commitlint-conflict': 'Use CommitLingo to make a commit.',
};

function setupCommitlint(root, conflict) {
  const modules = fileURLToPath(
    new URL('../.cache/commitlint-tools/node_modules/', import.meta.url),
  );
  if (!fs.existsSync(modules))
    throw new Error(
      'Install the documented optional commitlint test tools first',
    );
  fs.symlinkSync(
    modules,
    path.join(root, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  write(root, '.gitignore', 'node_modules\n');
  const config = conflict
    ? 'module.exports = { plugins: [{ rules: { "require-infinitive": ({ subject }) => [typeof subject === "string" && subject.startsWith("добавить "), "subject must start with добавить"] } }], rules: { "require-infinitive": [2, "always"] } };\n'
    : `module.exports = ${JSON.stringify({ extends: [path.join(modules, '@commitlint/config-conventional/lib/index.js')], rules: { 'scope-enum': [2, 'always', ['auth']], 'scope-empty': [2, 'never'], 'header-max-length': [2, 'always', 72] } })};\n`;
  write(root, '.commitlintrc.cjs', config);
  commit(root, 'test: configure local commitlint');
}

function base(root, name) {
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'Scenario Author');
  git(root, 'config', 'user.email', 'scenario@example.invalid');
  git(root, 'config', 'commit.gpgsign', 'false');
  git(root, 'config', 'core.autocrlf', 'false');
  write(root, 'auth.js', 'export const providers = ["password"];\n');
  if (!['history-80', 'initial'].includes(name))
    write(root, '.agents/commit-config.json', '{"locale":"ru"}\n');
  commit(root, 'Initial commit');
}

function setupHistory(root) {
  for (let index = 0; index < 10; index++) {
    write(root, 'history.txt', `${index}\n`);
    const message =
      index < 8
        ? `docs: уточнено описание раздела ${index}`
        : `docs: clarify section ${index}`;
    commit(root, message);
  }
}

export function createFixture(name) {
  if (!Object.hasOwn(requests, name))
    throw new Error(`Choose ${Object.keys(requests).join(', ')}`);
  const workspace = fileURLToPath(
    new URL('../.cache/manual/', import.meta.url),
  );
  fs.mkdirSync(workspace, { recursive: true });
  const root = fs.mkdtempSync(path.join(workspace, `${name}-`));
  base(root, name);
  if (name.startsWith('commitlint-'))
    setupCommitlint(root, name === 'commitlint-conflict');
  if (name === 'history-80') setupHistory(root);
  if (name === 'missing-locale') {
    write(root, '.agents/commit-config.json', '{"locale":"de"}\n');
    commit(root, 'build: выбран язык проекта');
  }
  if (name === 'corrupt-config') {
    write(root, '.agents/commit-config.json', '{"locale":"ru"');
    commit(root, 'build: изменена настройка языка');
  }
  if (name !== 'empty') {
    write(
      root,
      'auth.js',
      'export const providers = ["password", "github"];\n',
    );
    git(root, 'add', '--', 'auth.js');
  }
  if (name === 'partial')
    fs.appendFileSync(
      path.join(root, 'auth.js'),
      'export const experimentalCache = true;\n',
    );
  if (name === 'hook-failure') {
    write(
      root,
      '.git/hooks/pre-commit',
      '#!/bin/sh\nprintf "hook blocks commit\\n" >&2\nexit 1\n',
    );
    // Only this disposable test hook needs to be executable by Git.
    // eslint-disable-next-line sonarjs/file-permissions
    fs.chmodSync(path.join(root, '.git/hooks/pre-commit'), 0o755);
  }
  return { root, request: requests[name] };
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])
) {
  console.log(JSON.stringify(createFixture(process.argv[2]), null, 2));
}
