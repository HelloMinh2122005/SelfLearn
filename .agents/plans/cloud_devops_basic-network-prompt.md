@teacher-orchestrator

RUN: 2_1
<!-- One RUN per NEW conversation. Change only this value, in this order:
     2_1 2_2 2_3 2_4 2_5 2_6 2_7 2_8 5_1
     2_4 (10 lessons) and 2_7 (6 lessons) are the largest runs. -->

## Mission

Build the lesson folders and files for the **network course** in `cloud_devops_basic/network/`: Domain 2 (`2 Domain 2 - Computer Networking Core Fundamentals`, 43 lessons, modules 2_1 to 2_8) and Domain 5 (`5 Domain 5 - Wire-Level Network Inspection and Diagnostics`, 12 lessons, module 5_1). Each module becomes one module folder holding one lesson `.md` file per checklist item, plus a module `README.md` that explains the module to me.

This run covers **exactly one module: the `RUN` value above**. When it is done, report and **stop**. Do not start the next module, even if the run order says what comes next. I will open a new conversation for it.

Your manifest is `.agents/plans/cloud_devops_basic-plan.md`. Read it completely with `read_file` before anything else. For this course, the important parts are:
- section 1: folder layout and naming rules
- section 3: the per-module run procedure
- section 4.2: every network module folder and lesson file name. Use those names exactly.
- section 5: flagged README claims. Those for this course are in modules 2_2 (Ethernet preamble/SFD vs frame) and 2_5 (initial `cwnd`, `TIME_WAIT` / MSL).
- section 6: the lesson, module README, and course-README link templates, the `network` Section 4 variant, and the code policy
- section 7: the source policy, including the Networking row. **TLS 1.3 is RFC 9846 (July 2026), which obsoletes RFC 8446. Teach from RFC 9846.**
- section 9: the Definition of Done and run metrics. A unit is done only when every DoD item holds. A verifier PASS alone is not done.

Also read before you start: `AGENTS.md`, `.agents/rules/01` through `05`, `cloud_devops_basic/network/README.md` (the module's section), and `cloud_devops_basic/CHECKLIST.md` (the module's items). Module 2_8 is "Module 9" in the network README, and module 5_1 is "Module 8".

## What to do for this RUN

1. **Scope**: List the lesson files for this module from plan section 4.2, and the flagged claims for this module from plan section 5. Show me that list in your first message.
2. **Research**: Dispatch `researcher-1` and `researcher-2` in parallel with non-overlapping task contracts (`TASK-CDB-<module>-R1` / `-R2`). Put one acceptance-criteria block per lesson, phrased as claims to prove. `researcher-1` covers mechanisms, message flows, and state machines. `researcher-2` covers header fields and sizes, ports, defaults, commands and flags, and every section 5 claim for this module. `AUTHORIZED_SOURCES` comes from plan section 7 (Networking row). `CURRICULUM_DOMAIN: DevOps`.
3. **G1 + G2**: Apply `.agents/rules/05-verification-gates.md` with no shortcuts. Re-dispatch on `PARTIAL`, an empty result, or unresolved `CONFLICT` / `NOT_FOUND`. Never write from memory to fill a gap.
4. **Write**: Use one `WRITE-CDB-<lesson id>` task per lesson. `writer-1` takes odd-numbered lessons and `writer-2` even-numbered lessons. `TARGET_COURSE: cloud_devops_basic`. `TARGET_FILE` is the exact relative path built from plan sections 1 and 4.2, for example `cloud_devops_basic/network/2 Domain 2 - Computer Networking Core Fundamentals/2_1 Network Fundamentals and Models/2_1_1 How Networks Transfer Data.md`. `CHECKLIST_FILE: cloud_devops_basic/CHECKLIST.md`. Give each writer a pedagogical blueprint (analogy plus core message) per lesson. Writers use the 7-section template, the `network` Section 4 variant (Linux commands, subnet math with full working, an annotated capture or output), and the code policy from plan section 6.
5. **G5**: Call `verifier` with `Model: "pro"`, at most 3 lesson paths per call, sending only the paths, the domain, and plan section 7. On `FAIL` or `INCOMPLETE`, send the report to the writer who owns the lesson, then verify again. You cannot override a FAIL.
6. **Module overview**: Only after every lesson has a PASS, have one writer create `<module folder>/README.md` from template 6.3. It must contain no technical fact that is not already in the module's verified lessons. Run G4 and G5 on it.
7. **DoD check**: Read every lesson and its verification report, and check them against the Lesson DoD (plan 9.2). Send any lesson that misses an item back to its writer (and to the verifier again if the file changes). Do not close the module until every lesson meets 9.2 and the module meets 9.3.
8. **Close**: The writer:
   - marks the module's items `[x]` in `CHECKLIST.md` and updates every counter (Domain 2 or Domain 5 row, and TOTAL)
   - sets the header of every lesson in the module to `> **Trạng thái**: Verified (<WRITE id>, <dd-mm-yyyy>)`
   - adds the link line from template 6.4 under the module's heading in `cloud_devops_basic/network/README.md`
   - runs the checker once on the whole course; it must exit `0`.

   Then teach me the module in Vietnamese with English technical terms: core idea, the module analogy, a Mermaid map, 3 active-recall questions, and the verification results (claims passed, failed, and unverified per lesson). **Then stop.**

## Hard rules for this initiative
- You never search the web and never write files. Researchers research, writers write, and the verifier verifies.
- Lessons are written in Vietnamese with standard English technical terms. File and folder names are in English, exactly as in plan section 4.2.
- 100% relative links. Never use `file://` or `/home/...`. Paths contain spaces, so writers use `](<...>)` link syntax.
- Existing files (`CHECKLIST.md`, course READMEs) get partial edits only. Never overwrite them, and never remove or rename a heading.
- Do not "fix" technical claims in the existing course READMEs. That is out of scope (plan section 8).
- A claim sourced only from a cite-only source (Kurose & Ross, IEEE 802.1Q, other paywalled standards) stays `UNVERIFIED` and is labelled as such in the lesson.
- Do not commit or push. I will do that myself with the `git-push` skill.
- If a run cannot finish (budget, quota, blocked research), stop and report exactly which lessons are done, PASS, pending, or failed, so the next conversation can resume with the same `RUN`.

## Final report format (end of every run)
| Lesson file | WRITE id | Verifier verdict | Verify loops | Claims P / F / U | UNVERIFIED % | Lesson DoD (9.2) met? | Checklist marked |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

Then give:
- **Module DoD (9.3)**: each item ticked or failed.
- **Run metrics (9.5)**: lesson progress (module, and course-wide out of 154), first-pass PASS rate, average verify loops, research re-dispatches, UNVERIFIED ratio, flagged-claim resolution (x / 24), and checker result. Mark any metric that misses its target.
- Open issues, flagged section 5 claims and what the sources actually said, and the next `RUN` value.
