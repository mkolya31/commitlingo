---
locale: en
name: English
---

## Grammar rules

Use imperative verb phrases describing the delivered change: `add`, `fix`,
`preserve`, `remove`, `support`. Prefer active phrases over passive wording.
These English preferences do not govern other locales. Do not copy past-tense
grammar merely because it appears in old commits.

Start the description lower-case unless a proper noun or identifier requires
case; omit a trailing period. Follow project case/length constraints. Describe
the concrete outcome rather than `update stuff`. Body text can use normal
sentences to explain intent, consequences, and migration. Explain breaking
impact after the literal `BREAKING CHANGE:` token. Preserve type/scope tokens,
tracker identifiers, code identifiers, and URLs.

## Good examples

```text
feat(auth): add GitHub authentication
fix(parser): preserve references from multiline footers
perf(cache): reduce disk reads
refactor(config): extract settings loading
docs: clarify language selection
build(deps): update build dependencies
feat(cli)!: require Node.js 22.20

BREAKING CHANGE: Node.js 22.20 or newer is required; upgrade the runtime.
```

## Bad examples

- `feat(auth): added authentication` copies past-tense wording.
  Correction: `feat(auth): add authentication`.
- `fix: fixes the bug` is vague and uses third-person wording.
  Correction: `fix(auth): preserve refreshed tokens`.
- `chore: update stuff` hides intent and may conceal release impact.
  For a CLI bug: `fix(cli): handle empty arguments`.
