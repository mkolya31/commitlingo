---
locale: '__LOCALE__'
name: '__NAME__'
---

## Grammar rules

TODO: Translate and adapt these instructions to this language. Keep the three
section headings and metadata keys unchanged. Remove every TODO only when the
section is complete. Creating this file does not activate the locale.

Describe which grammatical forms naturally communicate a delivered change.
English uses imperative phrases such as `add authentication`; your language
may use a different construction. Specify agreement, casing, punctuation, and
terminology. Cover the description, normal body sentences, and explanatory
text following footer tokens. Preserve `feat`, `fix`, scope names,
`BREAKING CHANGE`, tracker identifiers, code identifiers, and URLs.

## Good examples

TODO: Replace these English descriptions with natural examples following your
rules, including features, fixes, maintenance, and a breaking change.

```text
feat(auth): add GitHub authentication
fix(parser): preserve empty values
refactor(config): extract settings loading
feat(cli)!: require Node.js 22.20

BREAKING CHANGE: Node.js 22.20 or newer is required; upgrade the runtime.
```

## Bad examples

TODO: Add examples that violate your language's rules. Explain each problem
and provide a corrected message. Translate/adapt the explanations as well.

- `fix: update stuff` is vague. Correction: `fix(auth): preserve refreshed tokens`.
- `feat: TODO` is unfinished. Replace with a concrete, grammatically correct
  delivered change.
