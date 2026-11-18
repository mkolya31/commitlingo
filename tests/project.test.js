import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { frontmatter } from '../scripts/check-package.js';
import { run } from '../skills/commitlingo/scripts/project.js';
import {
  contentHash,
  readConfig,
  readReviews,
} from '../skills/commitlingo/scripts/files.js';
import {
  changeSet,
  languageDecision,
} from '../skills/commitlingo/scripts/state.js';
import { commit, git, repository, write } from './support.js';

test('clean inspection stops before malformed config and leaves Git unchanged', (t) => {
  const root = repository(t);
  write(root, '.agents/commit-config.json', '{');
  commit(root, 'Initial commit');
  const before = git(root, 'status', '--porcelain');
  assert.equal(run(['inspect'], root).clean, true);
  assert.equal(git(root, 'status', '--porcelain'), before);
  assert.throws(() => run(['catalog'], root), /commit-config.json/u);
});

test('config uses repository root and saves only after an explicit choice', (t) => {
  const root = repository(t);
  write(root, '.agents/commit-config.json', '{"locale":"ru","other":7}');
  fs.mkdirSync(path.join(root, 'nested'));
  assert.equal(run(['catalog'], path.join(root, 'nested')).config.locale, 'ru');
  assert.throws(() => run(['set-locale', 'en'], root), /explicit user choice/u);
  run(['set-locale', 'en', '--approved'], root);
  assert.deepEqual(readConfig(root).value, { locale: 'en', other: 7 });
  assert.deepEqual(changeSet(root).staged, []);
});

test('invalid config needs explicit repair; valid missing language is a separate error', (t) => {
  const root = repository(t);
  const config = write(root, '.agents/commit-config.json', '{"locale":123}');
  assert.throws(() => run(['catalog'], root), /locale/u);
  assert.throws(() => run(['set-locale', 'ru', '--approved'], root), /locale/u);
  assert.equal(fs.readFileSync(config, 'utf8'), '{"locale":123}');
  run(['set-locale', 'ru', '--approved', '--repair'], root);
  assert.equal(readConfig(root).locale, 'ru');
  assert.throws(
    () => run(['set-locale', 'de', '--approved'], root),
    /unavailable/u,
  );
});

test('draft creation preserves existing files and does not activate the language', (t) => {
  const root = repository(t);
  const result = run(
    ['create-locale', 'de', '--name', 'Deutsch', '--approved'],
    root,
  );
  assert.match(fs.readFileSync(result.file, 'utf8'), /TODO/u);
  assert.deepEqual(frontmatter(fs.readFileSync(result.file, 'utf8')), {
    locale: 'de',
    name: 'Deutsch',
  });
  assert.equal(readConfig(root).locale, null);
  assert.equal(readReviews(root).state, 'missing');
  assert.throws(
    () => run(['create-locale', 'de', '--name', 'Deutsch', '--approved'], root),
    /exist/iu,
  );
  assert.throws(
    () =>
      run(
        ['create-locale', '../escape', '--name', 'Escape', '--approved'],
        root,
      ),
    /code/u,
  );
});

test('review records exact content, survives new calls and CRLF, and invalidates on spaces', (t) => {
  const root = repository(t);
  const file = write(
    root,
    '.agents/commitlingo/locales/de.md',
    'reviewed German rules\n',
  );
  const hash = contentHash(file);
  assert.throws(
    () => run(['record-review', 'de', '--approved', '--hash', 'stale'], root),
    /changed/u,
  );
  run(['record-review', 'de', '--approved', '--hash', hash], root);
  assert.equal(
    run(['catalog'], root).locales.find((entry) => entry.code === 'de').ready,
    true,
  );
  fs.writeFileSync(file, 'reviewed German rules\r\n');
  assert.equal(contentHash(file), hash);
  fs.appendFileSync(file, ' ');
  assert.equal(
    run(['catalog'], root).locales.find((entry) => entry.code === 'de').ready,
    false,
  );
});

test('corrupt registry stays untouched until recreation with a preserved backup', (t) => {
  const root = repository(t);
  const file = write(root, '.agents/commitlingo/locales/de.md', 'reviewed\n');
  const registry = write(
    root,
    '.agents/commitlingo/locale-reviews.json',
    '{broken',
  );
  const args = [
    'record-review',
    'de',
    '--approved',
    '--hash',
    contentHash(file),
  ];
  assert.throws(() => run(args, root), /recreate/u);
  assert.equal(fs.readFileSync(registry, 'utf8'), '{broken');
  const result = run([...args, '--recreate'], root);
  assert.equal(fs.readFileSync(result.backup, 'utf8'), '{broken');
  assert.equal(readReviews(root).state, 'valid');
});

test('unsupported registry is not downgraded and does not disable builtins', (t) => {
  const root = repository(t);
  const file = write(
    root,
    '.agents/commitlingo/locales/ru.md',
    'custom rules\n',
  );
  const registry = write(
    root,
    '.agents/commitlingo/locale-reviews.json',
    '{"version":2,"locales":{}}',
  );
  const locales = run(['catalog'], root).locales;
  assert.equal(locales.find((entry) => entry.code === 'en').ready, true);
  assert.equal(locales.find((entry) => entry.code === 'ru').ready, false);
  assert.ok(locales.find((entry) => entry.code === 'ru').builtin);
  assert.throws(
    () =>
      run(
        [
          'record-review',
          'ru',
          '--approved',
          '--recreate',
          '--hash',
          contentHash(file),
        ],
        root,
      ),
    /update CommitLingo/u,
  );
  assert.equal(JSON.parse(fs.readFileSync(registry, 'utf8')).version, 2);
  run(['set-locale', 'ru', '--builtin', '--approved'], root);
  assert.equal(readConfig(root).locale, 'ru');
});

test('restoring from Git rechecks hashes against current files', (t) => {
  const root = repository(t);
  const file = write(root, '.agents/commitlingo/locales/de.md', 'first\n');
  run(['record-review', 'de', '--approved', '--hash', contentHash(file)], root);
  commit(root, 'test: add reviewed locale');
  write(root, '.agents/commitlingo/locale-reviews.json', '{broken');
  fs.appendFileSync(file, 'changed\n');
  const result = run(['restore-reviews', '--ref', 'HEAD', '--approved'], root);
  assert.equal(
    result.locales.find((entry) => entry.code === 'de').ready,
    false,
  );
  assert.equal(fs.readFileSync(result.backup, 'utf8'), '{broken');
});

test('partial staging is observed without changing either snapshot', (t) => {
  const root = repository(t);
  const file = write(root, 'file.txt', 'one\n');
  commit(root, 'Initial commit');
  fs.writeFileSync(file, 'two\n');
  git(root, 'add', '--', 'file.txt');
  fs.writeFileSync(file, 'three\n');
  const before = git(root, 'diff', '--cached');
  const result = run(['inspect'], root);
  assert.deepEqual(result.staged, ['file.txt']);
  assert.deepEqual(result.unstaged, ['file.txt']);
  assert.equal(git(root, 'diff', '--cached'), before);
  assert.equal(fs.readFileSync(file, 'utf8'), 'three\n');
});

test('language counting respects minimum, threshold and ambiguous prose', () => {
  const ru = { informative: true, language: 'ru' };
  const en = { informative: true, language: 'en' };
  assert.equal(languageDecision([ru, ru, ru, ru, en]).locale, 'ru');
  assert.equal(languageDecision([ru, ru, ru, en, en]).locale, null);
  assert.equal(languageDecision([ru, ru, ru, ru]).locale, null);
  assert.equal(
    languageDecision([ru, ru, ru, ru, { informative: true, language: null }])
      .locale,
    'ru',
  );
  assert.equal(
    languageDecision([{ informative: false, language: 'en' }]).locale,
    null,
  );
  assert.throws(
    () => languageDecision(Array.from({ length: 51 }, () => ru)),
    /50/u,
  );
});
