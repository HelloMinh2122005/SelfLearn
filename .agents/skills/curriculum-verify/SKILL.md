---
name: curriculum-verify
description: >-
  Use this skill after any lesson, README, or CHECKLIST.md in a SelfLearn course is written or changed. Runs mechanical checks for links, anchors, and checklist counters. Required by the Verifier gate in .agents/rules/05-verification-gates.md.
---

# Curriculum Verify Skill

This skill runs the mechanical half of the release gate. It does not judge whether a technical claim is true. That is the `verifier` agent's job.

## Usage

Run from the repository root:

```bash
python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py <course-folder> --only "<lesson file>"            # while drafting (offline, ~1 s)
python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py <course-folder> --online --only "<lesson file>"   # once before reporting, and in the verifier
```

Run it in the foreground. It finishes in seconds, so never move it to the background and poll it.

| Option | Effect |
| :--- | :--- |
| `--online` | Also tests external links. Required for G4 and the Verifier gate. |
| `--only FILE ...` | Checks links only in these files. Checklist counters still cover the whole course. Use it for lesson writes, fixes, and verification. Omit it when `CHECKLIST.md` or a course README changes. |
| `--no-cache` | Tests every link again. By default, links that answered successfully in the last 24 hours come from `~/.cache/curriculum-link-check.json`. Dead or unreachable links are never cached. |

## What It Checks

| Check | Fails when |
| :--- | :--- |
| Internal links and anchors | A relative file or `#heading` does not exist. |
| Local paths | A link uses `file:` or starts with `/`. |
| Checklist counters | A domain heading, tracker row, progress value, or total disagrees with the real item count. |
| External links (`--online`) | A URL returns 404 or 410. Other failures are warnings to check by hand. HTTP 429 (rate limited) is reported as a warning at once, without retrying. |

## Evidence Tools (`evidence.py`)

Cheap, deterministic checks that replace reading whole pages and whole lessons into an agent's context.

| Command | Who uses it | What it does |
| :--- | :--- | :--- |
| `evidence.py fetch '<url>' --grep '<term>' ...` | verifier | Downloads the page once (cache `~/.cache/selflearn-pages/`, 7 days, one file per URL, so it is parallel-safe), converts HTML or PDF to text, and prints only the matching lines with their line numbers. Read more with `sed -n 'a,bp' <cache path>`. |
| `evidence.py claims <lesson.md> [--ids C5.1,C5.2] [--chunk 10]` | author (chunks for the report), verifier (its own ids) | Prints each claim id with the line or block it covers, with line numbers, so nobody reads the whole lesson. `--chunk N` splits all ids into groups of N, one per parallel verifier. |
| `evidence.py quotes <ledger.md> [--lesson <id>] [--ids C5.3,C5.7]` | verifier, once on its own ledger (plus once after fixing `MISSING` rows) | Fetches every ledger URL and checks the verbatim quote is really on the page: `FOUND`, `PARTIAL`, `MISSING`, `FETCH_ERROR`. `NOT_FOUND` rows are skipped. |
| `evidence.py lesson <lesson.md> [--ledger <ledger.md> ...] [--quotes]` | author (draft mode, no `--ledger`; final gate with every verify ledger), verifier (sweep, draft mode) | Checks the 7 section headings in order, the status header, Mermaid, quiz `<details>`, links in section 7, the size hard limit (error over 24 KB), and lists factual-looking lines with no tag. Draft mode also errors above 25 author claim ids. With `--ledger`, every `<!-- ev: C5.3 -->` tag must point to a `VERIFIED` row; ledgers given later override earlier ones for the same id (re-check ledgers go last). `--base <copy>` (edit to an existing lesson; `<copy>` is the lesson saved before the edit): errors if more than `--max-deleted` (3) old lines changed, checks tags only on added lines, and turns the size limit into a warning. |

Ledger rows need an `ID` column (`C5.1` for write-first lessons from 20-11-2026, `C5.101`+ for facts found by the sweep verifier; older lessons use `R4.1`, labs `L2.3`, legacy ledgers `R1`/`R2`) and a `Lesson` column. A `|` inside a quote is written `\|`. Older ledgers without IDs are ignored by `quotes`, and lessons with no tags are verified the old way.

## Run Cost (`run_cost.py`)

```bash
python3 .agents/skills/curriculum-verify/scripts/run_cost.py                      # last 3 SelfLearn runs
python3 .agents/skills/curriculum-verify/scripts/run_cost.py --root <id> --lessons 6
```

Reads the Antigravity transcripts in `~/.gemini/antigravity/brain` and prints, per run and per agent role: instances, model calls, tokens (including cache reads), share, cache-read %, output tokens, largest context, and the models that actually ran. Run it after each RUN to compare against the baseline in `.agents/rules/04-squad-orchestration.md` section 2.1.

## Reading the Result

- Exit code `0` means no errors. Warnings still have to be read.
- Exit code `1` means the gate failed. Fix every `ERROR`, then run the check again.
