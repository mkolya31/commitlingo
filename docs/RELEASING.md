# Stable release contract

This repository prepares a package; publishing is a separate action. Release
from a clean committed revision whose `package.json` contains the intended
stable version. The npm registry's version metadata must contain the full
40-character `gitHead` pointing to that revision. That commit's package name
and version must match the published package. Preserve the upstream attribution
and license text in the bundled skill.

The wrapper reads its own stable version's registry metadata, fetches that
commit's package metadata, and refuses a version mismatch or missing SHA before
installation. It passes the exact SHA to the pinned Skills API, checks the
resolved commit, and installs only `commitlingo` for `codex` with explicit scope.
It does not install from the current main/develop branch. The package includes
the complete skill for inspection and local development, but a published
installation is resolved from the verified immutable Git source.

`update` finds the newest stable numeric release in npm metadata. If its version
differs from the running wrapper, it invokes that exact npm package through the
npm CLI used by npx, preserving project/global scope. The new wrapper then
installs its own matching skill revision. It does not upgrade every skill,
choose a prerelease from a dist-tag, or silently reuse an old wrapper with
unmatched skill contents. `node bin/cli.js --help` works for development;
version-changing updates should be invoked through npx.

Before a release, require passing CI on Windows, macOS, and Linux at the minimum
Node.js version and Node.js 24, plus recorded manual Codex scenarios. Verify
the dry-run package manifest includes `bin`, `lib`, the skill, attribution, and
license text. Run the global-install check only on disposable CI accounts.
Keep project settings, custom locales, and their registry outside the installed
skill; installing/updating must preserve them.

Do not mark an unrun platform or manual scenario as passed. The first release
cannot be installed from npm until its package and immutable source revision
have actually been published. Testing controlled metadata and temporary source
trees validates the installer without publishing a pretend release.
