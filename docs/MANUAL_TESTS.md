# Manual Codex scenarios

These checks evaluate agent behavior and language. File/hash/unit checks alone
cannot establish message quality. No API key or model runner is required.

Create a disposable fixture with `node scripts/manual-fixture.js <case>`.
The command prints its disposable repository path under `.cache/manual/` and
the user request. Open a fresh
Codex chat rooted in that path, invoke the actual CommitLingo skill by absolute
path, and submit the request. Keep the skill path fixed across comparative runs.
Only the disposable repository may be changed. For another run create a fresh
fixture instead of resetting a user repository.

Record case, starting revision/status/config, skill revision, Codex model and
date, exact user request and replies, actual message/questions, resulting
configuration, index, and commits. Score separately: semantic truth and type,
locale grammar, and allowed actions/user path. Equivalent wording can pass.
Keep configuration questions and limitations outside the candidate.

| Case             | User request                     | Observable expectations                                                                                          |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ru-config`      | Suggest a message                | Resultative Russian, truthful new behavior, no staging/commit/save-language prompt                               |
| `history-80`     | Suggest a message                | Russian inferred from 8/10; candidate precedes visible save/other-language offer; no config write without answer |
| `initial`        | Suggest a message                | Ask a language rather than choosing from `Initial commit`                                                        |
| `empty`          | Make a commit                    | Report no changes; no candidate/config/commit/language question                                                  |
| `partial`        | Make a commit                    | Commit cached snapshot only; preserve unstaged content and exclude it from message claims                        |
| `missing-locale` | Create the missing German locale | Existing-language/create choice, English draft after creation choice, no activation/review record                |
| `corrupt-config` | Make a commit                    | Show file/error; preserve file/index/history until explicit repair; no history fallback                          |
| `hook-failure`   | Make a commit                    | Show hook failure, preserve preparation, never bypass; review hook changes before a permitted retry              |

Two optional fixtures use a real locally installed commitlint. Prepare the
test tools explicitly (the skill itself never downloads commitlint):

```sh
npm install --prefix .cache/commitlint-tools --no-package-lock --save-exact @commitlint/cli@21.2.4 @commitlint/config-conventional@21.2.4
node scripts/manual-fixture.js commitlint-ok
node scripts/manual-fixture.js commitlint-conflict
```

The first requires an accepted nonempty scope and normal Conventional Commits
validation. The second uses an intentionally incompatible Russian infinitive
rule to exercise explicit conflict handling without changing locale or lint
configuration. It must stop a commit and ask for a resolution.

For the language/config path, continue `initial` by selecting Russian, then
choose each of save/include, save separately, continue without saving, and a
different language in fresh fixtures. Verify the current message and actual
committed snapshot. Repeat the save refusal in another chat to check the offer
is not hidden permanently. Change an existing locale explicitly and verify it
overrides old history. For boundary counting use the automated 4/5, 7/10, 4/4,
ambiguous, exclusion, and 50-entry tests alongside agent classifications.

For locale authoring, translate the generated draft, retain metadata/headings,
and request review. Include a contradictory good example and an unfinished
section in separate runs: both must remain drafts. After a successful review,
decline the voluntary PR offer and verify local use still works. In another
fresh chat use the reviewed file and registry; edit a space and verify review
is required again, while CRLF/LF conversion alone preserves the hash. Exercise
corrupt/unsupported registry paths, explicit restoration/recreation with a
backup, and explicit built-in selection when a project override is unready.

For formatting and classification, use project scope/type/case restrictions,
an installed local commitlint and an unavailable configured one, a genuinely
conflicting locale rule, a runtime-support metadata change, and known closing
versus non-closing issue intent. Check the specific behavior in the corresponding
OpenSpec scenarios, including candidate warnings versus commit blocking.

Installer checks use isolated project/global directories and controlled stable
release metadata. Validate local default/explicit global selection, only
CommitLingo being updated, old-wrapper delegation to the new stable package,
immutable release SHA, no prerelease auto-selection, and unchanged user files.
CI's platform matrix is required to establish the three-platform result; a
Windows-only local run does not establish macOS/Linux verification.

Actual run records belong in `docs/verification/`. A protocol is not a passing
result. Record unrun cases as pending, never as successful behavior.
