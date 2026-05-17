# /update-meta

Audit CLAUDE.md and the command files in light of what was just built. Run this at the end of every session, before `/commit`.

The goal is to keep CLAUDE.md and the commands accurate as the library grows. Each session produces new patterns, decisions, and constraints — this command surfaces the ones that aren't documented yet, and flags anything that is now stale.

---

## What to do

### Step 1 — Understand what changed this session

Run `git diff --stat HEAD` and `git status` to see which files were added or modified. For each area touched (build, router, store, SW, a component, a command, etc.), note:
- What was built or changed
- Any non-obvious decisions made during implementation
- Any constraints or patterns that emerged from debugging or testing

Do not read the full diff — use it as a map to know which CLAUDE.md sections and command files to check.

### Step 2 — Audit CLAUDE.md

Read only the sections of CLAUDE.md that relate to what was built this session. For each section, check:

**GAP** — something discovered or established this session that is not captured in CLAUDE.md:
- A new architectural constraint (e.g. "dist/ must be self-contained")
- A pattern that will apply to future work (e.g. "page components must include `<main>`")
- A decision with a non-obvious rationale (e.g. "symlinks dereferenced in cpSync")
- A non-negotiable rule that emerged from a bug or failed approach

**STALE** — existing content that no longer accurately reflects the codebase:
- A description that no longer matches the implementation
- A step or rule that was superseded by a different approach
- A file path, API shape, or command name that changed

**OK** — section audited and accurate. State this explicitly so it is clear you checked it.

Do not audit sections unrelated to this session's work — stay scoped.

### Step 3 — Audit command files

Read the command files that were used or are relevant to what was built. Check:

- Do the steps still match how the work was actually done?
- Are there missing steps that emerged from this session (e.g. a check we ran manually that should be in the command)?
- Are there steps that reference paths, APIs, or patterns that changed?
- Does the report format still match what is useful?

Also check: is there a command file that should exist but doesn't, based on a repeating pattern in this session?

### Step 4 — Report findings

Use this format:

```
## CLAUDE.md

### <Section name>
GAP: <what is missing and why it matters>
Proposed addition:
  "<exact text to add, indented>"

### <Section name>
STALE: <what no longer matches and what it should say>
Proposed replacement:
  "<old text>"
  →
  "<new text>"

### <Section name>
OK

---
## Commands

### <command-name>.md
GAP / STALE / OK — <same format>

---
## Missing commands
<name> — <one-line description of what it would do and why it is needed>
```

Report only. Do not apply changes. Wait for the developer to confirm which findings to act on, then apply all approved changes in one pass.

### Step 5 — Apply approved changes

Once the developer confirms which findings to apply:
- Edit CLAUDE.md for each approved gap or stale finding
- Edit the relevant command files
- If a missing command is approved, create the command file using the same structure as existing commands
- Run a final `grep` check to ensure no leftover stale text remains from replaced sections
- Report what was changed
