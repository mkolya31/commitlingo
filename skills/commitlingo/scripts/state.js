import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contentHash,
  localeCode,
  projectLocales,
  projectPath,
  readConfig,
  readReviews,
} from './files.js';

export function git(root, args) {
  // Git is the user's installed tool; arguments are separate and no shell is used.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
  });
}

export function gitRoot(cwd) {
  return git(cwd, ['rev-parse', '--show-toplevel']).trim();
}

function paths(root, args) {
  return git(root, args).split('\0').filter(Boolean);
}

export function changeSet(root) {
  const staged = paths(root, ['diff', '--cached', '--name-only', '-z']);
  const unstaged = paths(root, ['diff', '--name-only', '-z']);
  const untracked = paths(root, [
    'ls-files',
    '--others',
    '--exclude-standard',
    '-z',
  ]);
  return {
    staged,
    unstaged,
    untracked,
    clean: staged.length + unstaged.length + untracked.length === 0,
  };
}

export function history(root) {
  try {
    git(root, ['rev-parse', '--verify', 'HEAD']);
  } catch {
    return [];
  }
  return git(root, ['log', '-50', '--format=%H'])
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((sha) => {
      const [parents, author, message] = git(root, [
        'show',
        '-s',
        '--format=%P%x00%an%x00%B',
        sha,
      ]).split('\0');
      return {
        sha,
        merge: parents.trim().split(/\s+/u).filter(Boolean).length > 1,
        author,
        message: message.trim(),
      };
    });
}

const builtins = fileURLToPath(
  new URL('../references/locales/', import.meta.url),
);

function localeEntries(directory, project, registry) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const code = localeCode(file.slice(0, -3));
      const target = project
        ? projectPath(directory, file)
        : path.join(directory, file);
      const sha256 = contentHash(target);
      const recorded = registry.value?.locales[code]?.sha256;
      const ready =
        !project ||
        (registry.state === 'valid' && recorded?.toLowerCase() === sha256);
      return { code, file: target, sha256, ready, project };
    });
}

export function catalog(root) {
  const registry = readReviews(root);
  const shipped = localeEntries(builtins, false, registry);
  const local = localeEntries(
    projectPath(root, projectLocales),
    true,
    registry,
  );
  const entries = new Map(shipped.map((entry) => [entry.code, entry]));
  for (const entry of local) {
    entries.set(entry.code, {
      ...entry,
      builtin: entries.get(entry.code)?.file,
    });
  }
  return { registry, locales: [...entries.values()] };
}

export function inspect(root) {
  const changes = changeSet(root);
  if (changes.clean) return { root, ...changes };
  return {
    root,
    ...changes,
    config: readConfig(root),
    ...catalog(root),
    history: history(root),
  };
}

function fraction(count, total) {
  return total ? count / total : 0;
}

export function languageDecision(votes) {
  if (!Array.isArray(votes) || votes.length > 50)
    throw new Error('Classify at most 50 history entries');
  const informative = votes.filter((vote) => vote.informative === true);
  const counts = new Map();
  for (const vote of informative) {
    if (vote.language !== null) {
      const code = localeCode(vote.language);
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  const [winner, count = 0] =
    [...counts.entries()].sort((left, right) => right[1] - left[1])[0] ?? [];
  const confidence = fraction(count, informative.length);
  return {
    locale: informative.length >= 5 && confidence >= 0.8 ? winner : null,
    confidence,
    informative: informative.length,
    counts: Object.fromEntries(counts),
  };
}
