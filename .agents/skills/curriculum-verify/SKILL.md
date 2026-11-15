---
name: curriculum-verify
description: >-
  Use this skill after any lesson, README, or CHECKLIST.md in a SelfLearn course is written or changed. Runs mechanical checks for links, anchors, checklist counters, and destructive rewrites. Required by the Verifier gate in .agents/rules/05-verification-gates.md.
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
| `--only FILE ...` | Checks links only in these files. Checklist counters and the rewrite guard still cover the whole course. Use it for lesson writes, fixes, and verification. Omit it when `CHECKLIST.md` or a course README changes. |
| `--no-cache` | Tests every link again. By default, links that answered successfully in the last 24 hours come from `~/.cache/curriculum-link-check.json`. Dead or unreachable links are never cached. |
| `--allow-rewrite` | Downgrades file shrink and heading loss to warnings. Use only after the learner explicitly approves that rewrite. |

## What It Checks

| Check | Fails when |
| :--- | :--- |
| Internal links and anchors | A relative file or `#heading` does not exist. |
| Local paths | A link uses `file:` or starts with `/`. |
| Checklist counters | A domain heading, tracker row, progress value, or total disagrees with the real item count. |
| Rewrite guard | A file shrinks by more than 10% against git `HEAD`, or a heading is removed or renamed. |
| External links (`--online`) | A URL returns 404 or 410. Other failures are warnings to check by hand. HTTP 429 (rate limited) is reported as a warning at once, without retrying. |

## Evidence Tools (`evidence.py`)

Cheap, deterministic checks that replace reading whole pages and whole lessons into an agent's context.

| Command | Who uses it | What it does |
| :--- | :--- | :--- |
| `evidence.py fetch '<url>' --grep '<term>' ...` | researchers, verifier | Downloads the page once (cache `~/.cache/selflearn-pages/`, 7 days, one file per URL, so it is parallel-safe), converts HTML or PDF to text, and prints only the matching lines with their line numbers. Read more with `sed -n 'a,bp' <cache path>`. |
| `evidence.py quotes <ledger.md> [--lesson <id>] [--ids R1.3,R2.7]` | researchers (before reporting), teacher (G1) | Fetches every ledger URL and checks the verbatim quote is really on the page: `FOUND`, `PARTIAL`, `MISSING`, `FETCH_ERROR`. |
| `evidence.py lesson <lesson.md> --ledger <ledger.md> ... [--quotes]` | writers (G4, offline), verifier (G5, with `--quotes`) | Checks the 7 section headings in order, the status header, Mermaid, quiz `<details>`, links in section 7, the size budget (warn at 18 KB, error at 24 KB), and that every `<!-- ev: R1.3 -->` tag points to a `VERIFIED` ledger row. Lists factual-looking lines with no tag. With `--quotes`, also checks the quotes of every tagged claim and prints the page text around each one. |

Ledger rows need an `ID` column (`R1.1`, `R2.7`) and a `Lesson` column. Older ledgers without IDs are ignored by `quotes`, and lessons with no tags are verified the old way.

## Reading the Result

- Exit code `0` means no errors. Warnings still have to be read.
- Exit code `1` means the gate failed. Fix every `ERROR`, then run the check again.
- A file reported as "not in git HEAD" cannot be restored if it is overwritten. Commit a baseline before changing it.
