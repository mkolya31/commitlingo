---
name: commitlingo
description: Write or create Conventional Commits using the repository's language and locale-specific grammar. Use when composing, reviewing, or executing a commit, choosing its language, or adding a locale.
license: MIT
---

# CommitLingo

For Codex with Git; project helpers require Node.js 22.20 or later.

Adapted from Conventional Changelog's `conventional-commit-message`; see
[UPSTREAM.md](UPSTREAM.md) for the exact revision and preserved notices.

Use one shared method to understand changes and choose commit metadata.
Determine language from the project, then apply the locale's grammar.
History is evidence of language and repository conventions, not a grammar guide.

## Choose the requested action

- A message request produces text without staging or committing.
- A request to make a commit authorizes preparing an unambiguous change and
  committing it. Do not ask again for general permission already given.
- An explicit language change or locale-authoring request uses its reference
  even in a clean repository; these are configuration tasks.

For a message or commit, first inspect `git status --short`, `git diff --cached`,
`git diff`, and untracked names. If there are no staged, unstaged, or untracked
changes, say there are no changes for a message or commit and stop without
language selection, configuration writes, or an empty commit.

Read [git-workflow.md](references/git-workflow.md) to select the exact change
set and when executing a commit. Then read
[project-locale.md](references/project-locale.md) to select and load a ready
locale. Read [locale-authoring.md](references/locale-authoring.md) only when a
locale is missing, unreviewed, changed, or explicitly being created/reviewed.
Resolve helper/reference paths relative to this installed skill, and settings
relative to `git rev-parse --show-toplevel`, regardless of installation or cwd.

## Commit shape

```text
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

- `type` and a nonempty description are required, separated by `: `.
- A parenthesized scope names a section of the codebase. `!` immediately before
  `:` or a `BREAKING CHANGE` footer indicates a breaking change.
- Body and footers are optional, separated by blank lines. Use them for
  important intent, compatibility/migration impact, or known tracker references.
- Footer forms are `Token: value` or `Token #value`. Tokens use hyphens instead
  of spaces, except `BREAKING CHANGE`; `BREAKING-CHANGE` is synonymous. The
  breaking footer token is uppercase. Preserve syntax tokens, task identifiers,
  code identifiers, and URLs in every language.
- Natural-language casing and grammatical form come from locale and project
  restrictions. Use concise, meaningful changelog-ready descriptions.
- Describe the actual outcome or maintenance intent. Recommend splitting
  unrelated changes instead of hiding them under an inaccurate umbrella subject.
- Backticks clarify code identifiers and non-mention `@` tokens such as scoped
  packages or decorators. Preserve their spelling and case.

## Type selection

Choose by effect, not file path. Read the repository's allowed types and release
tooling before assigning release consequences. A preset's visible/hidden types
are not universal Conventional Commits rules.

| Type       | Use when                                                  |
| ---------- | --------------------------------------------------------- |
| `feat`     | Public behavior or capability is added                    |
| `fix`      | Behavior or correctness is repaired                       |
| `perf`     | Runtime speed/memory improves without changing behavior   |
| `refactor` | Code changes while preserving behavior and public API     |
| `docs`     | Documentation prose changes only                          |
| `style`    | Formatting/whitespace changes without behavior changes    |
| `test`     | Tests change without product behavior changes             |
| `build`    | Build, packaging, dependency metadata, or tooling changes |
| `ci`       | CI workflow or automation changes only                    |
| `revert`   | An earlier change is reverted                             |
| `chore`    | Maintenance fitting no more precise accepted type         |

Use accepted aliases/custom types where appropriate; do not use `chore` as a
catch-all. Inspect tests and public usage when the impact is uncertain.

Before treating metadata, config, CI, generated files, or tests as internal,
check the contract consumers receive: runtime/platform support, exports, CLI
flags, presets, peer requirements, generated output, defaults, validation rules,
and documented APIs. Location alone does not determine impact. Runtime
dependency updates can affect the shipped graph and need release-impact
analysis; lockfile-only/tooling maintenance may be `build`.

An addition normally uses `feat`, a repair `fix`, a behavior-preserving rewrite
`refactor`. A stricter public contract or removed supported use is breaking,
even in metadata. Mark `!` and explain concrete impact/migration in a
`BREAKING CHANGE` footer when known. Do not invent release intent or add
`Release-As` merely to force a release. Consult the actual preset for other
types' bump/changelog behavior; a supposedly hidden type can still be breaking.

## Scope selection

Read commitlint configuration, workspace package names, and repository
conventions. Common locations: `.commitlintrc*`, `commitlint.config.*`, and
package.json, including locally available inherited presets. Respect accepted
types/scopes, casing, and length.

Single-package repositories usually need no scope unless meaningful subsystems
exist. In monorepos prefer the affected package's accepted scope; follow local
conventions for full versus unscoped npm names. For a coherent change affecting
several packages, use multiple scopes only when supported and validate the
separator. A meaningful shared scope can fit dependency/release work. For
repository-wide changes omit scope unless required rather than inventing
`global`. Recommend separate commits when one message would hide different
tasks or release effects.

## Construct and validate

1. Understand the selected diff and public/release effect.
2. Choose the precise accepted type and narrowest useful scope.
3. Load the locale and write description, body, and explanatory footer text
   according to its grammar. Preserve machine-readable tokens.
4. Include known tracker references using project convention. Without one use
   `Refs: <identifier-or-URL>`. Closing footers such as `Closes #123` require
   both a completed task and the user's intent to close it. Never invent a
   reference or infer closure merely from `fix`.
5. Validate the entire candidate with configured, runnable local commitlint.
   Prefer its installed executable; do not download it automatically. Feed
   multiline Unicode via stdin/a UTF-8 file without shell interpolation as
   described in the Git workflow reference.

Without commitlint, check shape, nonempty description, locale, truthfulness to
the selected diff, body/footer structure, breaking markers, known references,
and readable local type/scope/case/length constraints. Successful baseline
checking permits the requested action. If commitlint is configured but
unavailable, disclose that only baseline checking occurred, outside the message.

First try a shorter/different grammatical formulation to satisfy locale and
commitlint together. If no compatible candidate is found, show the specific
conflict and ask how to resolve it. Message-only mode may show a candidate with
a separate failed-check explanation; a commit waits for resolution. Do not
silently change locale, rewrite commitlint config, or bypass checks. Formal
validation does not prove semantic accuracy or natural language quality.

## Present the result

Give a ready-to-use message without explanation unless needed/requested. Keep
configuration offers, questions, warnings, and limitations outside the message.
If language was inferred without saved configuration, show the candidate first
and visibly offer to save the language or choose another. Before an actual
commit use the combined language/configuration choice in the Git workflow.
Report a created commit only after Git confirms success, identifying its SHA.
