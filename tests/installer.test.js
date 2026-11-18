import assert from 'node:assert/strict';
import test from 'node:test';
import {
  installRelease,
  latestStable,
  releaseMetadata,
  runInstaller,
} from '../lib/installer.js';

const sha = 'a'.repeat(40);
function dependencies() {
  const calls = [];
  let disposed = false;
  const options = {
    cwd: 'isolated-project',
    version: '0.1.0',
    fetcher: async (url) => {
      calls.push({ fetch: url });
      return {
        ok: true,
        json: async () => ({
          name: 'commitlingo',
          version: '0.1.0',
          gitHead: sha,
        }),
      };
    },
    resolve: async (source, args) => {
      calls.push({ resolve: source, args });
      return {
        source: { commit: sha },
        dispose: async () => {
          disposed = true;
        },
      };
    },
    install: async (source, args) => {
      calls.push({ install: args });
      return { failed: [], installed: [{ path: 'isolated-installed-skill' }] };
    },
  };
  return { options, calls, disposed: () => disposed };
}

test('plain install pins source SHA and targets only project Codex CommitLingo', async () => {
  const fixture = dependencies();
  const result = await runInstaller([], fixture.options);
  assert.equal(result.sha, sha);
  assert.equal(result.scope, 'project');
  assert.deepEqual(fixture.calls.find((call) => call.resolve).args, {
    cwd: fixture.options.cwd,
    ref: sha,
  });
  const settings = fixture.calls.find((call) => call.install).install;
  assert.deepEqual(settings.agents, ['codex']);
  assert.deepEqual(settings.skills, ['commitlingo']);
  assert.equal(settings.scope, 'project');
  assert.equal(settings.mode, 'copy');
  assert.equal(fixture.disposed(), true);
});

test('global flag is explicit and supported for update of current stable release', async () => {
  const fixture = dependencies();
  const initialFetch = fixture.options.fetcher;
  fixture.options.fetcher = async (url) =>
    url.endsWith('/commitlingo')
      ? {
          ok: true,
          json: async () => ({ versions: { '0.1.0': {}, '0.2.0-beta.1': {} } }),
        }
      : initialFetch(url);
  const result = await runInstaller(['update', '--global'], fixture.options);
  assert.equal(result.scope, 'global');
  assert.equal(
    fixture.calls.find((call) => call.install).install.scope,
    'global',
  );
});

test('old wrapper delegates to exact newest stable package with unchanged scope', async () => {
  const fixture = dependencies();
  fixture.options.fetcher = async () => ({
    ok: true,
    json: async () => ({
      versions: { '0.1.0': {}, '1.2.0': {}, '2.0.0-beta.1': {} },
    }),
  });
  fixture.options.delegate = (version, scope, cwd) => ({ version, scope, cwd });
  assert.deepEqual(await runInstaller(['update'], fixture.options), {
    version: '1.2.0',
    scope: 'project',
    cwd: fixture.options.cwd,
  });
  assert.equal(fixture.calls.length, 0);
});

test('version mismatch is rejected before any skill resolution or mutation', async () => {
  const fixture = dependencies();
  fixture.options.fetcher = async () => ({
    ok: true,
    json: async () => ({ name: 'commitlingo', version: '9.0.0', gitHead: sha }),
  });
  await assert.rejects(runInstaller([], fixture.options), /metadata/u);
  assert.equal(
    fixture.calls.some((call) => call.install || call.resolve),
    false,
  );
});

test('mismatched source commit is rejected and temporary source disposed', async () => {
  const fixture = dependencies();
  fixture.options.resolve = async () => ({
    source: { commit: 'b'.repeat(40) },
    dispose: async () => fixture.calls.push({ disposed: true }),
  });
  await assert.rejects(
    installRelease('0.1.0', { ...fixture.options, scope: 'project' }),
    /release SHA/u,
  );
  assert.ok(fixture.calls.some((call) => call.disposed));
  assert.equal(
    fixture.calls.some((call) => call.install),
    false,
  );
});

test('install API failures are not reported as successful installs', async () => {
  const fixture = dependencies();
  fixture.options.install = async () => ({
    installed: [],
    failed: [{ message: 'target refused' }],
  });
  await assert.rejects(runInstaller([], fixture.options), /target refused/u);
  assert.equal(fixture.disposed(), true);
});

test('prereleases and unpinned releases never become implicit installation sources', async () => {
  assert.equal(
    latestStable({ versions: { '1.9.0': {}, '1.10.0': {}, '2.0.0-rc.1': {} } }),
    '1.10.0',
  );
  assert.throws(
    () => latestStable({ versions: { '1.0.0-beta.1': {} } }),
    /stable/u,
  );
  await assert.rejects(
    releaseMetadata('1.0.0-beta.1', async () => {
      throw new Error('must not fetch');
    }),
    /stable/u,
  );
  await assert.rejects(
    releaseMetadata('0.1.0', async () => ({
      ok: true,
      json: async () => ({ name: 'commitlingo', version: '0.1.0' }),
    })),
    /gitHead/u,
  );
});

test('help, version and invalid arguments perform no network or installation', async () => {
  const fixture = dependencies();
  assert.match(
    (await runInstaller(['--help'], fixture.options)).help,
    /--global/u,
  );
  assert.equal(
    (await runInstaller(['--version'], fixture.options)).version,
    '0.1.0',
  );
  await assert.rejects(
    runInstaller(['unknown'], fixture.options),
    /Use commitlingo/u,
  );
  await assert.rejects(
    runInstaller(['--local'], fixture.options),
    /Unknown option/u,
  );
  assert.equal(fixture.calls.length, 0);
});
