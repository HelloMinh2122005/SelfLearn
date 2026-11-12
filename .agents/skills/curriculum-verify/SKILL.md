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
python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py <course-folder> --online
```

| Option | Effect |
| :--- | :--- |
| `--online` | Also tests every external link. Required for the Verifier gate. |
| `--allow-rewrite` | Downgrades file shrink and heading loss to warnings. Use only after the learner explicitly approves that rewrite. |

## What It Checks

| Check | Fails when |
| :--- | :--- |
| Internal links and anchors | A relative file or `#heading` does not exist. |
| Local paths | A link uses `file:` or starts with `/`. |
| Checklist counters | A domain heading, tracker row, progress value, or total disagrees with the real item count. |
| Rewrite guard | A file shrinks by more than 10% against git `HEAD`, or a heading is removed or renamed. |
| External links (`--online`) | A URL returns 404 or 410. Other failures are warnings to check by hand. |

## Reading the Result

- Exit code `0` means no errors. Warnings still have to be read.
- Exit code `1` means the gate failed. Fix every `ERROR`, then run the check again.
- A file reported as "not in git HEAD" cannot be restored if it is overwritten. Commit a baseline before changing it.
