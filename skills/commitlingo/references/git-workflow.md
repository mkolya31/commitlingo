# Git selection and execution

## Choose the change set

Inspect cached diff, working-tree diff, and untracked files, including content
needed to understand new files. If anything is staged, base the message and
commit only on that staged snapshot. Unstaged content may inform context but
must not leak into the message's claims or be staged automatically. Preserve
partially staged files. Do not run `git add -A` or stage whole partially staged
files as a shortcut.

If nothing is staged, consider unstaged and untracked changes. In message-only
mode identify the considered set and change neither index nor history. For a
commit request, one clearly coherent task permits automatically staging that
specific set and committing it. Multiple independent tasks or uncertain scope
require presenting a proposed split and asking before staging. Do not expand
the agreed set merely because a hook/configuration helper created another file.

## Language choice before a commit

If language was inferred and project config is absent, show the candidate first
and ask one combined question, offering:

1. Save the language and include the setting in this commit.
2. Save it as a separate working-tree change, outside this commit.
3. Continue without saving.
4. Choose a different language.

Wait for the answer. Option 1 authorizes saving and including the setting in
the selected set without another question. Option 2 saves but excludes that
new setting change from this commit. Option 3 writes no setting. Option 4
regenerates in the new locale and repeats the combined choice before creating
the commit. If history could not select a language, obtain the language first;
in commit mode also resolve saving/inclusion before execution. A saved ready
locale removes the ordinary save-language question.

Keep these questions outside the actual message. A request to commit already
authorizes the action; these are necessary choices of language and contents,
not an extra generic confirmation. Explicit saving alone does not authorize
committing configuration. If a user had already staged part of an existing
config file, preserve its original staged snapshot when excluding a newly saved
language edit; do not discard unrelated staged work.

## Execute the checked snapshot

Re-read the actual cached diff after any authorized staging. Revalidate the
message against that exact set and known commitlint/locale restrictions. If
the selected set changed unexpectedly, resolve scope before committing.

Put the complete message in a UTF-8 temporary file outside the worktree and
pass its path to the installed commitlint (`--edit <file>`) and to
`git -c i18n.commitEncoding=UTF-8 commit --file <file>`. Use literal-path file
APIs and argument arrays; do not interpolate backticks, dollar expressions,
quotes, identifiers, or untrusted text into shell commands. In PowerShell,
`[IO.File]::WriteAllText(path, message, [Text.UTF8Encoding]::new($false))`
preserves Unicode without BOM. Remove only the temporary file you created.

Do not bypass hooks or ignore an unresolved locale/commitlint conflict. If Git
fails, show the actual cause and whether a commit exists; preserve preparation
without resetting the index. Offer to address the cause and retry after it is
resolved. If a hook changed files, inspect their new diff before re-staging or
retrying, using the same scope rules. Do not blindly loop or use `--no-verify`.
After success check the resulting SHA and contents before reporting completion.
