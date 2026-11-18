# Verification — 2026-11-18

Environment: Windows/PowerShell, Node.js 24.14.1, npm 11.11.0.

- `npx @kolyach/eslint-config init` was invoked; it exited 1 because
  `eslint.config.mjs` already exists. Inspection confirmed that ESLint imports
  `@kolyach/eslint-config` and Prettier uses its preset. Those settings were
  preserved; lint and formatting checks pass.
- `npm run lint`, `npm run format:check`, `npm run check`: passed. ESLint emits
  the existing React auto-detection warning in this non-React project.
- `npm test`: 26 passed, 0 failed. Coverage includes both install scopes,
  exact package/executable delegation for project/global updates, rejection of
  the old package name in registry and source metadata, help, and real Skills
  API installation/reinstallation preserving project data and unrelated skills.
- `node bin/cli.js --help`: shows `npx commitlingo-skill` and update with
  optional `--global`.
- `npm pack --dry-run --json`: `commitlingo-skill@0.1.0`, 21 files; includes
  `bin/cli.js`, installer, original `skills/commitlingo` tree and notices.
- OpenSpec strict validation: passed.

## External CI status

The existing workflow was inspected: Windows, macOS, Linux with Node.js
22.20.0 and 24, including the disposable-runner global install check and npm
pack dry run. This implementation is local and has not been committed/pushed
by this session, so no CI run for this revision exists to verify. macOS, Linux,
Node.js 22.20.0 and the disposable-runner global installation are unverified
for these changes. Prior CI results do not establish success for this revision.

No publication was attempted. Registry acceptance of `commitlingo-skill` and
real installation from the published package remain unverified.
