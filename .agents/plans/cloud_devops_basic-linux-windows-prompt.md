@teacher-orchestrator

RUN: 3_1
<!-- One RUN per NEW conversation. Change only this value, in this order:
     Linux:   3_1 3_2 3_3 3_4 3_5 3_6 3_7 3_8 3_9
     Windows: 4_1 4_2 4_3 4_4 4_5 4_6 4_7
     3_9 (7 lessons) and 4_7 (6 lessons) are the largest runs. -->

## Mission

Build the lesson folders and files for the **Linux course** in `cloud_devops_basic/linux/` (Domain 3, `3 Domain 3 - Linux Systems Realization and Diagnostics`, 32 lessons, modules 3_1 to 3_9) and the **Windows course** in `cloud_devops_basic/windows/` (Domain 4, `4 Domain 4 - Windows Systems Realization and Diagnostics`, 22 lessons, modules 4_1 to 4_7). Each module becomes one module folder holding one lesson `.md` file per checklist item, plus a module `README.md` that explains the module to me.

This run covers **exactly one module: the `RUN` value above**. When it is done, report and **stop**. Do not start the next module, even if the run order says what comes next. I will open a new conversation for it.

Your manifest is `.agents/plans/cloud_devops_basic-plan.md`. Read it completely with `read_file` before anything else. For these two courses, the important parts are:
- section 1: folder layout and naming rules
- section 3: the per-module run procedure
- section 4.3 (Linux) and 4.4 (Windows): every module folder and lesson file name, and the **overlap rules** under each table. Use those names exactly. Lessons marked `[new]` have no older text anywhere; their scope is the checklist item text plus the module's section in the course README.
- section 5: flagged claims. Research every row whose module is the `RUN` value; never copy those statements as written.
- section 6: the lesson, module README, and course-README link templates, the `linux` or `windows` Section 4 variant (including the lab-VM warning for commands that change system state), and the code policy
- section 7: the source policy (Linux row or Windows row)
- section 9: the Definition of Done and run metrics. A unit is done only when every DoD item holds. A verifier PASS alone is not done.

Also read before you start: `AGENTS.md`, `.agents/rules/01` through `05`, the course README (`cloud_devops_basic/linux/README.md` or `cloud_devops_basic/windows/README.md`; "Module N" in a course README is module `3_N` or `4_N`), and `cloud_devops_basic/CHECKLIST.md` (the module's items).

## Pre-flight (before step 1)

Have `writer-1` run `python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py cloud_devops_basic` (offline). If it reports `heading removed or renamed` errors for `CHECKLIST.md`, `linux/README.md`, or `windows/README.md`, these come from the 14-11-2026 course expansion that I have not committed yet. **Stop and ask me to commit** before you continue. Do not work around it with `--allow-rewrite`.

## What to do for this RUN

1. **Scope**: List the lesson files for this module from plan section 4.3 or 4.4 (with each lesson's checklist ID), and the flagged claims for this module from plan section 5. Show me that list in your first message.
2. **Research**: Dispatch `researcher-1` and `researcher-2` in parallel with non-overlapping task contracts (`TASK-CDB-<module>-R1` / `-R2`). Put one acceptance-criteria block per lesson, phrased as claims to prove.
   - `researcher-1`: mechanisms, data structures, lifecycles, and how components interact (for example the boot sequence, the access check against a DACL, how systemd stops a unit).
   - `researcher-2`: exact commands, flags, file paths, config directives, numeric values and ranges, defaults, version and platform currency (kernel version, distro, systemd version, Windows version, PowerShell edition), runnable examples from Tier-1 pages (man7 `EXAMPLES` sections, Microsoft Learn cmdlet examples), and every section 5 claim for this module.
   - `AUTHORIZED_SOURCES` comes from plan section 7 (Linux row or Windows row). `CURRICULUM_DOMAIN: DevOps`.
3. **G1 + G2**: Apply `.agents/rules/05-verification-gates.md` with no shortcuts. Re-dispatch on `PARTIAL`, an empty result, or unresolved `CONFLICT` / `NOT_FOUND`. Never write from memory to fill a gap.
4. **Write**: Use one `WRITE-CDB-<lesson id>` task per lesson. `writer-1` takes odd-numbered lessons and `writer-2` even-numbered lessons. `TARGET_COURSE: cloud_devops_basic`. `TARGET_FILE` is the exact relative path built from plan sections 1 and 4.3 / 4.4, for example `cloud_devops_basic/linux/3 Domain 3 - Linux Systems Realization and Diagnostics/3_1 Linux Command-Line Foundations Filesystem Hierarchy and Packages/3_1_1 Filesystem Hierarchy Standard and Everything is a File.md`. `CHECKLIST_FILE: cloud_devops_basic/CHECKLIST.md`. Give each writer a pedagogical blueprint (analogy plus core message) per lesson, and tell it where the lesson connects to the theory in `cloud_devops_basic/os/` (for example 3_3_3 → 1_2_2, 3_3_4 → 1_6_7, 4_3_4 → 1_6_5) so the lesson links back with a relative link. Writers use the 7-section template, the course's Section 4 variant, and the code policy from plan section 6:
   - **Linux**: commands with annotated output marked as illustrative; state the distro family when commands or paths differ (Debian/Ubuntu vs RHEL/Fedora); lab-VM warning on commands that change system state.
   - **Windows**: state the Windows version and the PowerShell edition (5.1 or 7.x) for every example; mark commands that need an elevated prompt; lab-VM warning on commands that change system state.
5. **G5**: Call `verifier` with `Model: "pro"`, at most 3 lesson paths per call, sending only the lesson paths, the ledger paths, the domain, and plan section 7. On `FAIL` or `INCOMPLETE`, send the report to the writer who owns the lesson, then start a new verifier in re-check mode (previous report path + changed line ranges). You cannot override a FAIL.
6. **Module overview**: Only after every lesson has a PASS, have one writer create `<module folder>/README.md` from template 6.3. It must contain no technical fact that is not already in the module's verified lessons. Run G4 and G5 on it.
7. **DoD check**: Check every lesson against the Lesson DoD (plan 9.2) from the `evidence.py lesson` output and the verdict block of its verification report. Do not read whole lessons into your context; open a section with a line range only when an item is in doubt. Send any lesson that misses an item back to its writer (and to the verifier again if the file changes). Do not close the module until every lesson meets 9.2 and the module meets 9.3.
8. **Close**: The writer:
   - marks the module's items `[x]` in `CHECKLIST.md` and updates every counter (Domain 3 or Domain 4 row, and TOTAL). Other sessions may have ticked items in other domains: re-read the file and recount; never overwrite their counts.
   - sets the header of every lesson in the module to `> **Trạng thái**: Verified (<WRITE id>, <dd-mm-yyyy>)`
   - adds the link line from template 6.4 under the module's heading in `cloud_devops_basic/linux/README.md` or `cloud_devops_basic/windows/README.md`
   - runs the checker once on the whole course with `--online`; it must exit `0`.

   Then teach me the module in Vietnamese with English technical terms: core idea, the module analogy, a Mermaid map, 3 active-recall questions, and the verification results (claims passed, failed, and unverified per lesson). **Then stop.**

## Hard rules for this initiative
- Cost rules (`.agents/rules/04-squad-orchestration.md` section 2.1): one fresh subagent per task, ledger paths instead of pasted ledgers, no polling of subagents or background tasks, lessons 12–18 KB (hard limit 24 KB) with an `ev` tag on every fact, and stop at the end of this RUN.
- You never search the web and never write files. Researchers research, writers write, and the verifier verifies.
- Lessons are written in Vietnamese with standard English technical terms. File and folder names are in English, exactly as in plan section 4.3 / 4.4.
- 100% relative links. Never use `file://` or `/home/...`. Paths contain spaces, so writers use `](<...>)` link syntax.
- Existing files (`CHECKLIST.md`, course READMEs) get partial edits only. Never overwrite them, and never remove or rename a heading.
- Do not "fix" technical claims in the existing course READMEs. That is out of scope (plan section 8). Report README statements the sources contradict in the final report instead.
- Respect the overlap rules in plan 4.3 / 4.4: the SSH protocol, firewalls, and network commands are taught in Domains 2 and 5. Link to them; do not re-teach them.
- A claim sourced only from a cite-only source (*Windows Internals*, *Understanding the Linux Kernel*, other paywalled books) stays `UNVERIFIED` and is labelled as such in the lesson.
- Do not commit or push. I will do that myself with the `git-push` skill.
- If a run cannot finish (budget, quota, blocked research), stop and report exactly which lessons are done, PASS, pending, or failed, so the next conversation can resume with the same `RUN`.

## Final report format (end of every run)
| Lesson file | WRITE id | Verifier verdict | Verify loops | Claims P / F / U | UNVERIFIED % | Lesson DoD (9.2) met? | Checklist marked |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

Then give:
- **Module DoD (9.3)**: each item ticked or failed.
- **Run metrics (9.5)**: lesson progress (module, and course-wide out of 154), first-pass PASS rate, average verify loops, research re-dispatches, UNVERIFIED ratio, flagged-claim resolution (x / 24), and checker result. Mark any metric that misses its target.
- Open issues, flagged section 5 claims and what the sources actually said, README statements the sources contradict, and the next `RUN` value.
