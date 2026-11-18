import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const skill = path.join(root, 'skills/commitlingo');

export function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(text);
  assert.ok(match, 'YAML frontmatter is required');
  return parse(match[1]);
}

export function validateLocale(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n?/gu, '\n');
  const metadata = frontmatter(text);
  for (const key of ['locale', 'name']) {
    assert.equal(
      typeof metadata[key],
      'string',
      `${file}: ${key} must be a string`,
    );
    assert.ok(metadata[key].trim(), `${file}: ${key} must be nonempty`);
  }
  assert.equal(metadata.locale, path.basename(file, '.md'));
  for (const heading of ['Grammar rules', 'Good examples', 'Bad examples']) {
    const body = text.split(`## ${heading}\n`)[1]?.split('\n## ')[0];
    assert.ok(body?.trim(), `${file}: ${heading} must be filled in`);
  }
  assert.ok(
    !/\bTODO\b/u.test(text) && !text.includes('{{'),
    `${file}: unfinished locale`,
  );
  return metadata;
}

function validateLinks(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const part of text.split('](').slice(1)) {
    const closing = part.indexOf(')');
    if (closing < 0) continue;
    const link = part.slice(0, closing);
    if (/^(?:https?:|#)/u.test(link)) continue;
    assert.ok(
      fs.existsSync(path.resolve(path.dirname(file), link.split('#')[0])),
      `${file}: broken link ${link}`,
    );
  }
}

export function checkPackage() {
  const metadata = frontmatter(
    fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8'),
  );
  assert.equal(metadata.name, 'commitlingo');
  assert.ok(metadata.description?.trim());
  for (const entry of fs.readdirSync(path.join(skill, 'references/locales'))) {
    validateLocale(path.join(skill, 'references/locales', entry));
  }
  for (const relative of [
    'SKILL.md',
    'UPSTREAM.md',
    'references/project-locale.md',
    'references/locale-authoring.md',
    'references/git-workflow.md',
  ]) {
    validateLinks(path.join(skill, relative));
  }
  const license = fs.readFileSync(
    path.join(skill, 'references/licenses/upstream-ISC.md'),
  );
  assert.equal(
    createHash('sha256').update(license).digest('hex'),
    'e54b21b65dabc985399a1ce251ae30a57955b1078cee75a0ec1e9b0eb58277ba',
  );
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  assert.equal(pkg.name, 'commitlingo-skill');
  assert.deepEqual(pkg.bin, { 'commitlingo-skill': 'bin/cli.js' });
  assert.ok(fs.existsSync(path.join(root, pkg.bin['commitlingo-skill'])));
  assert.match(
    pkg.dependencies.skills,
    /^\d+\.\d+\.\d+$/u,
    'Skills CLI must be pinned exactly',
  );
  for (const relative of [
    'examples/commit-config.json',
    'examples/locale-reviews.json',
  ]) {
    JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  }
  return 'Skill structure, locale metadata, links, license bytes, dependency pin, and examples passed';
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])
) {
  console.log(checkPackage());
}
