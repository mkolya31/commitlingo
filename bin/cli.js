#!/usr/bin/env node
import fs from 'node:fs';
import { runInstaller } from '../lib/installer.js';

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
try {
  const result = await runInstaller(process.argv.slice(2), {
    cwd: process.cwd(),
    version: pkg.version,
  });
  console.log(result.help ?? JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
