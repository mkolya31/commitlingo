#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  backup,
  configPath,
  contentHash,
  localeCode,
  projectLocales,
  projectPath,
  readConfig,
  readJson,
  readReviews,
  validateReviews,
  writeJson,
} from './files.js';
import { catalog, git, gitRoot, inspect, languageDecision } from './state.js';

function approved(options) {
  if (!options.approved)
    throw new Error(
      'This write requires an explicit user choice; pass --approved only after that choice',
    );
}

function selected(root, code) {
  const entry = catalog(root).locales.find(
    (candidate) => candidate.code === localeCode(code),
  );
  if (!entry)
    throw new Error(
      `Locale ${code} is unavailable; choose an existing locale or create it`,
    );
  return entry;
}

function setLocale(root, code, options) {
  approved(options);
  const entry = selected(root, code);
  const useBuiltin = options.builtin && (entry.builtin || !entry.project);
  if (!entry.ready && !useBuiltin)
    throw new Error(`${entry.file}: explicit locale review is required`);
  let config;
  try {
    config = readConfig(root);
  } catch (error) {
    if (!options.repair) throw error;
    config = { file: projectPath(root, configPath), value: {} };
  }
  writeJson(config.file, { ...config.value, locale: code });
  return { file: config.file, locale: code, committed: false };
}

function createLocale(root, code, options) {
  approved(options);
  localeCode(code);
  if (typeof options.name !== 'string' || !options.name.trim())
    throw new Error('Provide the language display name with --name');
  const target = projectPath(root, `${projectLocales}/${code}.md`);
  const template = fs.readFileSync(
    new URL('../assets/locale-template.md', import.meta.url),
    'utf8',
  );
  const content = template
    .replace(/'__LOCALE__'/u, JSON.stringify(code))
    .replace(/'__NAME__'/u, JSON.stringify(options.name));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, { flag: 'wx' });
  return { file: target, ready: false };
}

function writableReviews(root, options) {
  const registry = readReviews(root);
  if (['valid', 'missing'].includes(registry.state)) return registry;
  if (registry.state === 'unsupported') throw new Error(registry.error);
  if (!options.recreate)
    throw new Error(
      `${registry.error}; choose restore from Git or explicit review with --recreate`,
    );
  return {
    ...registry,
    backup: backup(registry.file),
    value: { version: 1, locales: {} },
  };
}

function recordReview(root, code, options) {
  approved(options);
  const file = projectPath(root, `${projectLocales}/${localeCode(code)}.md`);
  const sha256 = contentHash(file);
  if (options.hash !== sha256)
    throw new Error(
      'Review hash is missing or content changed; read and review the current file first',
    );
  const registry = writableReviews(root, options);
  registry.value.locales[code] = { sha256 };
  writeJson(registry.file, registry.value);
  return {
    file,
    registry: registry.file,
    sha256,
    backup: registry.backup,
    ready: true,
  };
}

function restoreReviews(root, options) {
  approved(options);
  if (!options.ref) throw new Error('Choose a Git revision with --ref');
  const commit = git(root, [
    'rev-parse',
    '--verify',
    '--end-of-options',
    `${options.ref}^{commit}`,
  ]).trim();
  const raw = git(root, [
    'show',
    `${commit}:.agents/commitlingo/locale-reviews.json`,
  ]);
  const value = validateReviews(JSON.parse(raw));
  const current = readReviews(root);
  if (current.state === 'unsupported') throw new Error(current.error);
  const saved = fs.existsSync(current.file) ? backup(current.file) : undefined;
  writeJson(current.file, value);
  return { backup: saved, ...catalog(root) };
}

export function run(argv, cwd = process.cwd()) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      root: { type: 'string' },
      approved: { type: 'boolean' },
      repair: { type: 'boolean' },
      recreate: { type: 'boolean' },
      hash: { type: 'string' },
      name: { type: 'string' },
      ref: { type: 'string' },
      votes: { type: 'string' },
      builtin: { type: 'boolean' },
    },
  });
  const [command, code] = positionals;
  if (command === 'decide') return languageDecision(readJson(values.votes));
  const root = gitRoot(values.root ?? cwd);
  const actions = {
    inspect: () => inspect(root),
    catalog: () => ({ config: readConfig(root), ...catalog(root) }),
    'set-locale': () => setLocale(root, code, values),
    'create-locale': () => createLocale(root, code, values),
    'record-review': () => recordReview(root, code, values),
    'restore-reviews': () => restoreReviews(root, values),
  };
  if (!Object.hasOwn(actions, command))
    throw new Error(
      'Choose inspect, catalog, decide, set-locale, create-locale, record-review, or restore-reviews',
    );
  return actions[command]();
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])
) {
  try {
    console.log(JSON.stringify(run(process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
