import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { validateLocale } from '../scripts/check-package.js';
import { readReviews } from '../skills/commitlingo/scripts/files.js';
import {
  history,
  languageDecision,
} from '../skills/commitlingo/scripts/state.js';
import { commit, repository, write } from './support.js';

test('locale structure supports quoted names and rejects mismatched IDs and empty values', (t) => {
  const root = repository(t);
  const body =
    '\n## Grammar rules\nNatural grammar.\n## Good examples\nfeat: support input\n## Bad examples\nWrong: stuff. Correction: feat: support input\n';
  const file = write(
    root,
    'de.md',
    '---\nlocale: de\nname: "Deutsch"\n---\n' + body,
  );
  assert.equal(validateLocale(file).name, 'Deutsch');
  fs.writeFileSync(
    file,
    fs.readFileSync(file, 'utf8').replaceAll('\n', '\r\n'),
  );
  assert.equal(validateLocale(file).locale, 'de');
  fs.writeFileSync(file, '---\nlocale: en\nname: Deutsch\n---\n' + body);
  assert.throws(() => validateLocale(file));
  fs.writeFileSync(file, '---\nlocale: de\nname: 123\n---\n' + body);
  assert.throws(() => validateLocale(file), /string/u);
  fs.writeFileSync(file, '---\nlocale: de\nname: ""\n---\n' + body);
  assert.throws(() => validateLocale(file), /nonempty/u);
});

test('invalid registry values do not establish review readiness', (t) => {
  const root = repository(t);
  const file = write(
    root,
    '.agents/commitlingo/locale-reviews.json',
    '{"version":1,"locales":[]}',
  );
  assert.equal(readReviews(root).state, 'invalid');
  fs.writeFileSync(file, '{"version":1,"locales":{"de":{"sha256":"xyz"}}}');
  assert.equal(readReviews(root).state, 'invalid');
  fs.writeFileSync(file, '{"version":"1","locales":{}}');
  assert.equal(readReviews(root).state, 'invalid');
  fs.writeFileSync(file, '{"version":2,"locales":{}}');
  assert.equal(readReviews(root).state, 'unsupported');
});

test('history window remains at 50 before any semantic exclusions', (t) => {
  const root = repository(t);
  for (let index = 0; index < 52; index++) {
    write(root, 'history.txt', `${index}\n`);
    commit(root, `docs: history entry ${index}`);
  }
  const entries = history(root);
  assert.equal(entries.length, 50);
  assert.match(entries[0].message, /51$/u);
  assert.match(entries.at(-1).message, /2$/u);
});

test('80-percent boundaries and exclusions use only informative classifications', () => {
  const votes = (ru, en) => [
    ...Array.from({ length: ru }, () => ({
      informative: true,
      language: 'ru',
    })),
    ...Array.from({ length: en }, () => ({
      informative: true,
      language: 'en',
    })),
  ];
  assert.equal(languageDecision(votes(8, 2)).locale, 'ru');
  assert.equal(languageDecision(votes(7, 3)).locale, null);
  assert.equal(
    languageDecision([...votes(4, 1), { informative: false, language: 'en' }])
      .locale,
    'ru',
  );
  assert.equal(languageDecision([]).locale, null);
});
