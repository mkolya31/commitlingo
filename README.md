# CommitLingo

Multilingual Conventional Commits for AI coding agents, starting with Codex.

```text
feat(auth): добавлена авторизация через GitHub
feat(auth): add GitHub authentication
```

CommitLingo reads the real changes, chooses a meaningful type/scope, and applies
the project's language rules. Russian describes a completed result; English uses
imperative wording. History helps select a language, but does not dictate grammar.

## Install and update

Requires Node.js 22.20 or newer, Git, and Codex. The npm package is prepared for
release; the following package-runner commands become available after publication:

```sh
npx commitlingo
npx commitlingo --global
npx commitlingo update
npx commitlingo update --global
```

Without `--global`, installation/update targets the current project. Global
installation targets Codex across projects. Update changes only CommitLingo in
that scope and preserves the language setting, custom locales, and review data.
The CLI installs the skill; Codex composes messages and carries out requested
Git actions. The installer wraps a pinned Skills CLI version.

Stable package versions correspond to stable skill releases pinned to a Git
commit. Updates select the latest stable release, excluding prereleases.

## Use in Codex

Ask for a message or explicitly ask for a commit:

- “Use CommitLingo to suggest a commit message.”
- “Use CommitLingo to make a commit for this change.”
- “Switch this project's commit language to English.”

A message request does not stage or commit. A commit request uses staged changes
first, preserving partial staging. With an empty index, the skill can prepare
one clearly related task; ambiguous/unrelated work requires a scope choice.
A clean repository produces no invented message, language prompt, or empty commit.

Project settings live in `.agents/commit-config.json`:

```json
{ "locale": "ru" }
```

Commit this file as the team's convention. It is independent of global skill
installation and takes precedence over history. Without a saved locale, the
skill examines up to 50 commits, excluding merges and obvious generated/template
messages. Automatic selection needs at least 5 informative messages and 80% in
one language. Otherwise it asks; there is no English or Russian fallback.

After an inferred-language message, the skill visibly offers to save the
language or choose another. The offer repeats until a setting exists. Before
creating a commit, one question lets you save/include the setting, save it
outside that commit, continue without saving, or choose another language.
Choosing another regenerates the candidate before committing.

Existing project type/scope/case/length restrictions and release presets are
respected. A local commitlint is used when available. Otherwise the skill does
baseline checking and discloses when configured commitlint could not run.
Unresolved grammar/lint conflicts stop a commit. Known issue links use project
convention, or `Refs: ...`; closing links require explicit intent to close.

## Add a language

When a locale is unavailable, choose an existing one or ask to create it.
The English template is written to `.agents/commitlingo/locales/<code>.md`.
Translate and adapt its grammar, good examples, and bad examples with corrections.
Keep `locale`, `name`, and the three section headings unchanged. A draft is not
activated merely because it exists.

Ask CommitLingo to review the completed locale. It checks structure and
consistency, then records the reviewed content's SHA-256 in
`.agents/commitlingo/locale-reviews.json`. The hash normalizes line endings to LF
but preserves every other character, including spaces. Changed content requires
another explicit review. Commit both locale and registry to share readiness.
Fluent human review remains useful: structure/hash checks cannot prove language
quality. Project locales override bundled ones; a draft override never silently
falls back to the bundled version.

After a successful review, the skill offers to select the locale and separately
to contribute it through a PR. Publication is optional. Damaged review data is
preserved and repaired only by an explicit choice; unsupported schemas are not
downgraded. See [contributing](docs/CONTRIBUTING.md) and
[manual scenarios](docs/MANUAL_TESTS.md).

## Development

```sh
npm ci
npm test
npm run check
npm run lint
npm run format:check
```

Automatic checks validate files, data-handling invariants, and the installer.
Behavior and language are evaluated separately through reproducible Codex
scenarios; no API key is required. CI runs automated checks on Windows, macOS,
and Linux. A local development CLI is available through `node bin/cli.js --help`.

The project uses OpenSpec (`spec-driven`). Current specifications are under
`openspec/specs/`. The completed implementation plan is archived under
`openspec/changes/archive/2026-11-18-create-commitlingo-skill/`; use the checked-in
OpenSpec skills for future changes. Without a global CLI:

```sh
npx --yes @fission-ai/openspec@2.1.0 validate --all
```

## Origin and license

The shared method adapts Conventional Changelog's `conventional-commit-message`.
An unchanged import was committed before adaptation, so the complete difference
is available through Git. [Upstream attribution and comparison commands](skills/commitlingo/UPSTREAM.md)
identify the exact revision, baseline commit, author, and preserved MIT/ISC
notices. CommitLingo's own contributions use the [MIT license](LICENSE).
