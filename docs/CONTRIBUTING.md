# Contributing

Add a language under `skills/commitlingo/references/locales/<code>.md` without
rewriting the shared generation method. Use the shipped locales as format
examples, and read the English template under `assets/` for the intended coverage.

Keep `locale` equal to the filename stem and `name` a nonempty display name.
Retain `Grammar rules`, `Good examples`, `Bad examples`. Include grammar/case
rules for the description, body, and explanatory footer text; examples of
features, fixes, maintenance, and breaking changes; and bad examples with an
explanation and correction. Preserve Conventional Commits tokens and identifiers.
Adapt grammar naturally rather than translating English imperative mechanically.

Run the development checks and document a manual Codex scenario for the language.
Assess whether the message is accurate and natural, not whether its exact text
matches one expected string. A fluent speaker should review the language.
Do not include a consuming project's configuration or review registry in a PR
for a bundled locale. Those belong to that project, not the installed skill.

Project-local translations can be contributed voluntarily after explicit review.
Opening or sending a PR is a separate user action, never a side effect of review.

The upstream baseline is deliberately preserved in Git. Keep its notices and
attribution; review upstream changes against the pinned source rather than
blindly replacing the adaptation. Never format the imported license text.
