import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { installSkills, resolveSource } from 'skills';

const repository = 'mkolya31/commitlingo';
const packageName = 'commitlingo-skill';
const registry = `https://registry.npmjs.org/${packageName}`;

export function stableVersion(version) {
  return (
    typeof version === 'string' &&
    /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(version)
  );
}

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

export function latestStable(document) {
  const versions = Object.keys(document.versions ?? {})
    .filter(stableVersion)
    .sort(compareVersions);
  const latest = versions.at(-1);
  if (!latest)
    throw new Error('No published stable CommitLingo release is available');
  return latest;
}

async function json(fetcher, url) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok)
    throw new Error(
      `${url}: HTTP ${response.status}; no release was installed`,
    );
  return response.json();
}

export async function releaseMetadata(version, fetcher) {
  if (!stableVersion(version))
    throw new Error('A stable package version is required');
  const release = await json(fetcher, `${registry}/${version}`);
  if (
    release.name !== packageName ||
    release.version !== version ||
    !/^[a-f0-9]{40}$/iu.test(release.gitHead ?? '')
  ) {
    throw new Error(
      'Release metadata must match the package version and include an immutable gitHead SHA',
    );
  }
  const sha = release.gitHead.toLowerCase();
  const sourcePackage = await json(
    fetcher,
    `https://raw.githubusercontent.com/${repository}/${sha}/package.json`,
  );
  if (sourcePackage.name !== packageName || sourcePackage.version !== version) {
    throw new Error(
      'Package and skill source versions differ; refusing installation',
    );
  }
  return { version, sha };
}

export async function installRelease(version, options) {
  const {
    cwd,
    scope,
    fetcher = fetch,
    resolve = resolveSource,
    install = installSkills,
  } = options;
  const release = await releaseMetadata(version, fetcher);
  const source = await resolve(repository, { cwd, ref: release.sha });
  try {
    if (source.source.commit?.toLowerCase() !== release.sha)
      throw new Error('Fetched skill source does not match the release SHA');
    const result = await install(source, {
      cwd,
      scope,
      agents: ['codex'],
      skills: ['commitlingo'],
      mode: 'copy',
      duplicates: 'error',
      symlinks: 'reject',
      telemetry: false,
    });
    if (result.failed.length || result.installed.length !== 1) {
      throw new Error(
        `CommitLingo installation failed: ${result.failed.map((failure) => failure.message).join('; ') || 'no Codex target installed'}`,
      );
    }
    return { version, sha: release.sha, scope, path: result.installed[0].path };
  } finally {
    await source.dispose();
  }
}

export function delegateVersion(version, scope, cwd) {
  if (!stableVersion(version))
    throw new Error('Cannot delegate to a prerelease or invalid version');
  const executable = process.env.npm_execpath;
  if (!executable)
    throw new Error(
      'Run updates through npx commitlingo-skill update so the matching package can be launched',
    );
  const npmCli = path.join(path.dirname(executable), 'npm-cli.js');
  if (!fs.existsSync(npmCli))
    throw new Error('Cannot locate the npm CLI used by npx');
  const args = [
    npmCli,
    'exec',
    '--yes',
    `--package=${packageName}@${version}`,
    '--',
    packageName,
  ];
  if (scope === 'global') args.push('--global');
  const result = spawnSync(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `Version-matched installer exited with status ${result.status}`,
    );
  return { delegated: version, scope };
}

function parseCommand(argv) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      global: { type: 'boolean' },
      help: { type: 'boolean' },
      version: { type: 'boolean' },
    },
  });
  const command = positionals[0] ?? 'install';
  if (positionals.length > 1 || !['install', 'update'].includes(command))
    throw new Error(
      'Use commitlingo-skill [--global] or commitlingo-skill update [--global]',
    );
  return { command, values, scope: values.global ? 'global' : 'project' };
}

export async function runInstaller(argv, options) {
  const { command, values, scope } = parseCommand(argv);
  if (values.help)
    return {
      help: 'npx commitlingo-skill [--global]\nnpx commitlingo-skill update [--global]',
    };
  if (values.version) return { version: options.version };
  const fetcher = options.fetcher ?? fetch;
  if (command === 'update') {
    const latest = latestStable(await json(fetcher, registry));
    if (latest !== options.version)
      return (options.delegate ?? delegateVersion)(latest, scope, options.cwd);
  }
  return installRelease(options.version, { ...options, fetcher, scope });
}
