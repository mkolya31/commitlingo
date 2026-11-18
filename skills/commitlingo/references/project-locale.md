# Project language

The helper is `<skill>/scripts/project.js`, using only Node built-ins. It never
stages files or commits. Resolve `<skill>` to the actual installed folder and
quote absolute paths in commands. Read the selected locale's entire Markdown
file, including examples, before writing a message.

```text
node <skill>/scripts/project.js inspect --root <repository>
node <skill>/scripts/project.js catalog --root <repository>
```

`inspect` checks Git changes first; a clean result stops message/commit work
before configuration is loaded. `catalog` also works for explicit configuration
requests in clean repositories. Errors are not evidence of an absent setting.

## Resolve language

Read `<repo>/.agents/commit-config.json`. An existing `locale` must be a nonempty
language-code string. Malformed JSON, incorrect types, and empty values stop
generation/commit: show the path/error and offer repair with user consent;
never silently fall back to history. Valid but unavailable codes open two
choices: choose an available language or create that locale.

Saved project locale takes precedence over history and personal/global
preferences. Scope of installation never selects the team's language.
Project locales under `.agents/commitlingo/locales/` override bundled files
under `<skill>/references/locales/`. A project file is usable only when reviewed
against its current hash. If it is a draft/changed, offer explicit review or
explicit selection of a bundled alternative; never silently bypass it.
`catalog` reports both the selected file and a `builtin` alternative when one
exists. See locale-authoring.md for review/registry errors.

If locale is absent, inspect at most the most recent 50 commits, including
merge commits in that window before exclusions. Do not scan farther to fill the
sample. Exclude merges, clearly generated bot/template messages, and generic
`Initial commit` entries. Classify language from ordinary prose, excluding
type/scope prefixes, URLs, references, and code identifiers. History does not
override the locale's grammar. Evaluate language semantically, not by Latin
letters in identifiers or Cyrillic alone. New locales use the same method.

For reproducible counting, write a temporary JSON array of classifications:
`[{"informative":true,"language":"ru"}, ...]`, one entry per inspected commit.
An uninformative entry has `informative:false`; genuinely ambiguous ordinary
prose can use `language:null` and still counts in the informative denominator.

```text
node <skill>/scripts/project.js decide --votes <temporary-json-file>
```

Select a language only with at least 5 informative messages and at least 80%
for one language. 8/10 and 4/5 qualify; 7/10, 4/4, no history, or only templates
require asking the user. Excluded entries are not votes. Show the actual
evidence rather than inventing confidence. When the inferred language has no
ready locale, offer the missing-locale choices instead of an English default.

## Make saving visible

With confident history and no setting, generate the candidate first, then
visibly offer to save that language as the project's commit language or choose
another installed language. Repeat this offer on each future invocation without
saved config, even after a refusal. Silence does not permit writing config.

In message-only mode an explicit language choice (including an answer when
history was uncertain) saves the project setting and regenerates the message if
needed; it does not stage or commit the file. A refusal to save leaves it alone.
In commit mode, follow the combined choice in git-workflow.md before committing;
choosing a different language regenerates first, and saving remains a separate
branch of that combined choice. With a saved ready locale, do not ask to save it
again. An explicit request to change the project language replaces that setting.

After the appropriate explicit choice:

```text
node <skill>/scripts/project.js set-locale ru --root <repository> --approved
```

The helper preserves other fields of valid config and never commits. Use
`--repair` only after explicit consent to replace malformed configuration with
the selected valid locale. Use `--builtin` only after explicit selection of the
bundled locale instead of an unreviewed override; it does not disable the
project override for future invocations. The setting remains a versioned team
file, not a hidden personal preference.
