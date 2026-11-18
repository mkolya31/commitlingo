# Upstream attribution

CommitLingo adapts `conventional-commit-message` by dangreen from the
[Conventional Changelog project](https://github.com/conventional-changelog/conventional-changelog).

- Upstream revision: `0cdedf882b7d2c86ea8e03ce0c4fafc597fa2108`.
- [Original skill](https://github.com/conventional-changelog/conventional-changelog/blob/0cdedf882b7d2c86ea8e03ce0c4fafc597fa2108/skills/conventional-commit-message/SKILL.md).
- [Original repository license](https://github.com/conventional-changelog/conventional-changelog/blob/0cdedf882b7d2c86ea8e03ce0c4fafc597fa2108/LICENSE.md).

The original skill declares `license: MIT` in its frontmatter. The upstream
repository's license file contains the ISC license and identifies the
conventional-changelog team as the copyright holder. These differing notices
are preserved as found; this attribution does not relabel all upstream content
as exclusively MIT. The unmodified ISC text is distributed in
[`references/licenses/upstream-ISC.md`](references/licenses/upstream-ISC.md).

CommitLingo's own contributions are covered by the project's MIT license.
The original authors' notices remain applicable to the borrowed material.

The initial import retains the upstream skill unchanged in commit
`109ff169ddff5df73dba34d47c96a81b8e87c88f`. Its skill blob is
`6ca54772c4afcf0d73cb397470d140b4296e843d`, verified against GitHub's contents API.
The original file's SHA-256 is
`5cadc330a3828187218cbe3f29a1401c7c2a923783332fffbb5a410988e9f372`.

Inspect the baseline and compare it with the adaptation:

```sh
git show 109ff169ddff5df73dba34d47c96a81b8e87c88f:skills/commitlingo/SKILL.md
git diff 109ff169ddff5df73dba34d47c96a81b8e87c88f -- skills/commitlingo
```

CommitLingo adds project locale selection/review, language-specific grammar,
scoped Git workflows, and installation. It separates upstream release-preset
heuristics from the general Conventional Commits contract. English grammatical
preferences live in `en.md`, rather than governing every locale. Future upstream
changes are reviewed against this pinned revision instead of copied blindly.
