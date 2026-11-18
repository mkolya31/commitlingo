import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const configPath = '.agents/commit-config.json';
export const reviewsPath = '.agents/commitlingo/locale-reviews.json';
export const projectLocales = '.agents/commitlingo/locales';

export function localeCode(value) {
  if (
    typeof value !== 'string' ||
    !/^[a-zA-Z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/u.test(value)
  ) {
    throw new Error('locale must be a nonempty language code, not a path');
  }
  return value;
}

export function projectPath(root, relative) {
  const base = fs.realpathSync(root);
  const target = path.resolve(base, relative);
  const inside = (candidate) =>
    candidate === base || candidate.startsWith(base + path.sep);
  if (!inside(target)) throw new Error('Path escapes the project');
  let ancestor = target;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  if (!inside(fs.realpathSync(ancestor)))
    throw new Error('Symlink escapes the project');
  return target;
}

export function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: ${error.message}`, { cause: error });
  }
}

export function readConfig(root) {
  const file = projectPath(root, configPath);
  const value = readJson(file);
  if (value === null && !fs.existsSync(file))
    return { file, value: {}, locale: null };
  if (!object(value))
    throw new Error(`${file}: configuration must be an object`);
  if (value.locale === undefined) return { file, value, locale: null };
  try {
    return { file, value, locale: localeCode(value.locale) };
  } catch (error) {
    throw new Error(`${file}: ${error.message}`, { cause: error });
  }
}

export function contentHash(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n?/gu, '\n');
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function validateReviews(value) {
  if (!object(value)) throw new Error('Review registry must be an object');
  if (value.version !== 1)
    throw new Error('Review registry version must equal 1');
  if (!object(value.locales)) throw new Error('locales must be an object');
  for (const [code, entry] of Object.entries(value.locales)) {
    localeCode(code);
    if (
      !object(entry) ||
      typeof entry.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/iu.test(entry.sha256)
    ) {
      throw new Error(`${code}: sha256 must contain 64 hexadecimal characters`);
    }
  }
  return value;
}

export function readReviews(root) {
  const file = projectPath(root, reviewsPath);
  if (!fs.existsSync(file))
    return { file, state: 'missing', value: { version: 1, locales: {} } };
  let value;
  try {
    value = readJson(file);
  } catch (error) {
    return { file, state: 'corrupt', error: error.message };
  }
  if (
    object(value) &&
    typeof value.version === 'number' &&
    value.version !== 1
  ) {
    return {
      file,
      state: 'unsupported',
      error: `${file}: unsupported registry version; update CommitLingo`,
    };
  }
  try {
    return { file, state: 'valid', value: validateReviews(value) };
  } catch (error) {
    return { file, state: 'invalid', error: `${file}: ${error.message}` };
  }
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      flag: 'wx',
    });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function backup(file) {
  const target = `${file}.${randomUUID()}.bak`;
  fs.copyFileSync(file, target, fs.constants.COPYFILE_EXCL);
  return target;
}
