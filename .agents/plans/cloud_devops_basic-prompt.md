@teacher-orchestrator

RUN: PHASE-0
<!-- Change RUN for each session: PHASE-0, then one module ID at a time in this order:
     1_1 1_2 1_3 1_4 1_5 1_6 1_7 1_8 | 2_1 2_2 2_3 2_4 2_5 2_6 2_7 2_8 | 3_1 3_2 3_3 3_4 3_5 3_6 3_7 3_8 3_9 | 4_1 4_2 4_3 4_4 4_5 4_6 4_7 | 5_1 -->

## Mission

Build the lesson folders and files for the 4 courses in `cloud_devops_basic/` (`os`, `network`, `linux`, `windows`). Each module in a course README becomes one module folder. That folder holds one lesson `.md` file per checklist item, plus a module `README.md` that explains the module to me.

Your manifest is `.agents/plans/cloud_devops_basic-plan.md`. Read it completely with `read_file` before anything else. It defines:
- the target folder layout and naming rules (section 1)
- Phase 0 checklist repairs (section 2)
- the per-module run procedure (section 3)
- every module folder and lesson file name (section 4). Use those names exactly.
- claims in the existing READMEs that must be researched, not copied (section 5)
- the lesson, module README, and course-README link templates (section 6)
- the source policy (section 7) and what is out of scope (section 8)
- the **Definition of Done and run metrics** (section 9). A unit is done only when every DoD item holds. A verifier PASS alone is not done.

Also read before you start: `AGENTS.md`, `.agents/rules/01` through `05`, the course README that owns the module, and `cloud_devops_basic/CHECKLIST.md`.

## What to do for this RUN

### If RUN = PHASE-0
1. Dispatch one writing task `WRITE-CDB-P0` to one new `writer` that carries out the table in plan section 2 exactly (P0-1 to P0-9), using partial `edit_file` edits only. No research is needed, because no technical claim changes.
2. That `writer` runs `python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py cloud_devops_basic --online` and repeats until it exits `0`.
3. Ask me (with `ask_question`) to approve or reject the **Classical OS theory** source proposal in plan section 7. Record my answer in your report. Domain 1 runs depend on it.
4. Check the Phase 0 DoD (plan 9.1) item by item. Report back with: the writer's report, the checker's output summary, my source-policy decision, and the 9.1 checklist with each item ticked or failed. Stop.

### If RUN = a module ID (for example `1_4`)
Follow plan section 3 for that one module only, using the steps below:
1. **Scope**: List the lesson files for this module from plan section 4 and the flagged claims for this module from plan section 5. Show me that list in your first message.
2. **Research**: Start **one new `researcher` per lesson**, all in parallel (`TASK-CDB-<lesson id>`). Each contract covers that one lesson completely (mechanisms and definitions, plus its exact numbers, defaults, commands and flags), phrased as claims to prove, plus the section 5 claims that belong to that lesson. A fact several lessons need goes to the first lesson that teaches it. `LESSON: <lesson id and title>`. `LEDGER_FILE: cloud_devops_basic/.evidence/research/TASK-CDB-<lesson id>.md`. `ID_PREFIX: R<P>` (lesson `2_3_4` → `R4`). `CLAIMS: 12-25` (hard maximum 25). `OPTIONAL: none`. `AUTHORIZED_SOURCES` comes from plan section 7. `CURRICULUM_DOMAIN: DevOps`.
3. **G1 + G2**: Apply `.agents/rules/05-verification-gates.md` with no shortcuts. Read only the researchers' short summaries; each must include a clean `evidence.py quotes` result (no `MISSING`). The verifier checks the quotes again, so do not dispatch a separate quote check. Re-dispatch on `PARTIAL`, an empty result, a missing quote-check line, or unresolved `CONFLICT` / `NOT_FOUND`. Never write from memory to fill a gap.
4. **Write**: Use one `WRITE-CDB-<lesson id>` task per lesson. Each task goes to a **new** `writer` instance, all in parallel, with `LEDGER_FILES`, `CLAIM_IDS` and `SIZE_BUDGET: hard limit 24 KB`. `TARGET_COURSE: cloud_devops_basic`. `TARGET_FILE` is the exact relative path built from plan sections 1 and 4. `CHECKLIST_FILE: cloud_devops_basic/CHECKLIST.md`. Give each writer a pedagogical blueprint (analogy plus core message) per lesson. Writers use the 7-section template and the course-specific Section 4 variant and code policy from plan section 6.
5. **G5**: Call `verifier` with `Model: "pro"`, at most 3 lesson paths per call, sending only the lesson paths, the ledger paths, the domain, and plan section 7. On `FAIL` or `INCOMPLETE`, send the report to the writer who owns the lesson, then start a new verifier in re-check mode (previous report path + changed line ranges). You cannot override a FAIL.
6. **Module overview**: Only after every lesson has a PASS, have one writer create `<module folder>/README.md` from template 6.3. It must contain no technical fact that is not already in the module's verified lessons. Run G4 and G5 on it.
7. **DoD check**: Check every lesson against the Lesson DoD (plan 9.2) from the `evidence.py lesson` output and the verdict block of its verification report. Do not read whole lessons into your context; open a section with a line range only when an item is in doubt. Send any lesson that misses an item back to its writer (and to the verifier again if the file changes). Do not close the module until every lesson meets 9.2 and the module meets 9.3.
8. **Close**: The writer marks the module's items `[x]` in `CHECKLIST.md`, updates every counter, and adds the link line from template 6.4 under the module's heading in the course README. The checker must exit `0`. Then teach me the module in Vietnamese with English technical terms: core idea, the module analogy, a Mermaid map, 3 active-recall questions, and the verification results (claims passed, failed, and unverified per lesson).

## Hard rules for this initiative
- Cost rules (`.agents/rules/04-squad-orchestration.md` section 2.1): one fresh `researcher` and one fresh `writer` per lesson, ledger paths instead of pasted ledgers, each check run once (no extra quote-check tasks), no polling of subagents or background tasks, lessons under the 24 KB hard limit (no soft target) with an `ev` tag on every fact, and stop at the end of this RUN.
- You never search the web and never write files. Researchers research, writers write, and the verifier verifies.
- Lessons are written in Vietnamese with standard English technical terms. File and folder names are in English, exactly as in plan section 4.
- 100% relative links. Never use `file://` or `/home/...`. Paths contain spaces, so writers use `](<...>)` link syntax.
- Existing files (`CHECKLIST.md`, course READMEs) get partial edits only. Never overwrite them, and never remove or rename a heading.
- Do not "fix" technical claims in the existing course READMEs. That is out of scope (plan section 8).
- A claim sourced only from a cite-only textbook stays `UNVERIFIED` and is labelled as such in the lesson.
- Do not commit or push. I will do that myself with the `git-push` skill.
- If a run cannot finish (budget, blocked research), stop and report exactly which lessons are done, PASS, pending, or failed, so the next session can resume with the same `RUN`.

## Final report format (end of every run)
| Lesson file | WRITE id | Verifier verdict | Verify loops | Claims P / F / U | UNVERIFIED % | Lesson DoD (9.2) met? | Checklist marked |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

Then give:
- **Module DoD (9.3)**: each item ticked or failed.
- **Run metrics (9.5)**: lesson progress (module and course-wide out of 154), first-pass PASS rate, average verify loops, research re-dispatches, UNVERIFIED ratio, flagged-claim resolution (x / 24), and checker result. Mark any metric that misses its target.
- open issues, flagged section 5 claims and what the sources actually said, and the next `RUN` value.
