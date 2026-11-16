@teacher-orchestrator

RUN: 6_5
<!-- One RUN per NEW conversation. Change only this value, in this order:
     Lessons: 6_3  6_5:1-6  6_5:7-11  6_6:1-6  6_6:7-11  6_8  6_4  6_7:1-5  6_7:6-10
              6_1:1-5  6_1:6-10  6_2:1-6  6_2:7-11
     Labs:    LAB 6_3  LAB 6_5  LAB 6_6  LAB 6_8  LAB 6_4  LAB 6_7  LAB 6_1
     ("6_5:1-6" = lessons 6_5_1 to 6_5_6. A LAB run needs every lesson of that topic at PASS.) -->

## Mission

Complete the **container track** in `cloud_devops_basic/container/` (Domain 6: Docker/Podman, Kubernetes, Helm, GitLab CI/CD, observability). I am preparing for a DevOps / CI/CD job on Kubernetes, Helm and GitLab CI, so these lessons must be accurate, current, and practical.

Each topic folder already has a `README.md` that defines the scope (one `### 6_M_P` heading per lesson, with bullets) and the labs (`### lab-...` definitions). Your job is to turn each `### 6_M_P` heading into one verified lesson file, and later to build each defined lab as a lab folder.

This run covers **exactly the `RUN` value above**. When it is done, report and **stop**. Do not start the next run, even if the order says what comes next. I will open a new conversation for it.

Your manifest is `.agents/plans/cloud_devops_basic-container-plan.md`. Read it completely with `read_file` before anything else. Important parts:
- section 1.1: **what is different on this track**. The topic README already exists (partial edits only). `container/CHECKLIST.md` is my self-assessment, so **never tick it or edit it**. README bullets were not verified, and you may correct a bullet the sources contradict.
- section 2: run types, the run order, and task IDs (`TASK-CTR-…`, `WRITE-CTR-…`, `LAB-CTR-…`)
- section 3: the lesson-run procedure. Section 3.1: the LAB-run procedure.
- section 4: every lesson file name, and the **overlap rules**. Use the names exactly.
- section 5: flagged claims. Research every row for this run's topic; never copy those statements as written.
- section 6: the lesson template, the Hands-on rules and code policy, and the lessons table for the topic README
- section 7: the source policy
- section 9: Definition of Done and run metrics. A verifier PASS alone is not done.

Also read before you start: `AGENTS.md`, `.agents/rules/01` to `05`, `.agents/skills/lab-builder/SKILL.md` (LAB runs), `cloud_devops_basic/container/README.md`, and the topic README of this run.

## Pre-flight (before step 1)

1. Have one short `writer` task run `git status --short cloud_devops_basic/container .agents/plans` and `python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py cloud_devops_basic/container` (offline).
2. If any file under `cloud_devops_basic/container/` is untracked or modified (the checker prints `not in git HEAD`), **stop and ask me to commit a baseline**. Rule 05 section 5 forbids editing files that are not in git `HEAD`. Do not work around it.
3. If the checker reports any `ERROR`, stop and show it to me.

## What to do for this RUN

### Lesson runs (`RUN: 6_M` or `6_M:a-b`)
1. **Scope**: List the lesson files of this run from plan section 4 (with the topic README heading each one covers) and the section 5 claims for this topic. Show me that list in your first message.
2. **Research**: Start **one new `researcher` per lesson**, all in parallel (`TASK-CTR-<lesson id>`). Each contract covers that one lesson completely, phrased as claims to prove:
   - its mechanisms: object model, controllers, lifecycles and request flows;
   - its exact commands, flags, YAML fields and `apiVersion`s, defaults, limits, feature states (`alpha`/`beta`/`stable`) and the version they apply to (Kubernetes 1.x, Helm 4 vs 3, GitLab version and tier, Podman/Docker), and runnable examples from Tier-1 pages;
   - the section 5 claims that belong to that lesson. A fact several lessons need goes to the first lesson that teaches it.
   - `AUTHORIZED_SOURCES` from plan section 7. `CURRICULUM_DOMAIN: DevOps`. `LESSON: <lesson id and title>`. `LEDGER_FILE: cloud_devops_basic/container/.evidence/research/TASK-CTR-<lesson id>.md`. `ID_PREFIX: R<P>` (lesson `6_6_4` → `R4`). `CLAIMS: 12-25` (hard maximum 25). `OPTIONAL: none`.
3. **G1 + G2**: Apply rule 05 with no shortcuts. Read only the researchers' short summaries and, where needed, line ranges of the ledger files. Each summary must include a clean `evidence.py quotes` result (no `MISSING`). The verifier checks the quotes again, so do not dispatch a separate quote check. Re-dispatch on `PARTIAL`, an empty result, a missing quote-check line, or unresolved `CONFLICT` / `NOT_FOUND`. Never write from memory to fill a gap.
4. **Write**: One `WRITE-CTR-<lesson id>` task per lesson, each to a **new** `writer` instance, all in parallel, with `LEDGER_FILES`, `CLAIM_IDS` and `SIZE_BUDGET: hard limit 24 KB`. Never paste ledger content into the contract. `TARGET_COURSE: cloud_devops_basic/container`. `TARGET_FILE` is the exact path from plan section 4, for example `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_3 Kubernetes Architecture and Core Workloads/6_3_1 Kubernetes Cluster Architecture.md`. `CHECKLIST_FILE: none (learner-owned, do not edit)`. Tell each writer explicitly that, on this track, its usual "mark `[x]` in `CHECKLIST.md` after PASS" step is replaced by the topic README lessons table (plan 6.3). Give each writer:
   - a pedagogical blueprint per lesson (analogy plus core message),
   - the lab that practises the lesson (from the topic README),
   - the overlap links from plan section 4 (for example 6_1_3 → Linux 3_8_1, 6_6_5 → 6_2_11).
   Writers use the 7-section template and the section 6.2 Hands-on rules: tool versions stated, Helm 4 flags with the Helm 3 equivalent noted, and code-policy labels.
5. **G5**: Call a new `verifier` with `Model: "pro"`, at most 3 lesson paths per call, sending only the lesson paths, the ledger paths, the domain, and plan section 7. On `FAIL` or `INCOMPLETE`, send the report to the writer who owns the lesson, then start a new verifier in **re-check mode** (previous report path + the writer's changed line ranges). You cannot override a FAIL.
6. **README bullets**: If a source contradicts a bullet in the topic README, the lesson teaches the source. The owning writer then corrects that one bullet with a partial edit, and it goes through G4 and G5.
7. **DoD check**: Use the `evidence.py lesson` output and the verdict block of each verification report to check plan 9.1. Do not read whole lessons into your context; open a specific section with a line range only when an item is in doubt. Send back any lesson that misses an item.
8. **Close** (only if this run finishes the topic): one writer adds the lessons section (plan 6.3) to the topic README before `## 🧪 Labs`, updates the topic README header `Trạng thái` and the topic's row in `cloud_devops_basic/container/README.md`, and runs the checker on `cloud_devops_basic/container` with `--online` and no `--only`. It must exit `0`.

   Then teach me the run in Vietnamese with English technical terms:
   - the core idea and the topic analogy
   - a Mermaid map
   - 3 active-recall questions, at least 1 in English as an interview question
   - which `CHECKLIST.md` checkpoints I should now try to tick myself
   - the verification results

   **Then stop.**

### Lab runs (`RUN: LAB 6_M`)
1. Confirm every lesson of topic `6_M` has a verifier PASS. If not, stop and tell me which lessons are missing.
2. List the labs defined in the topic README. Labs `6_2_1` and `6_2_2` already exist: skip them.
3. Research every command, flag, YAML field, Helm and GitLab keyword the labs need (G1, G2): one new `researcher` per lab (`TASK-CTR-LAB-<lab id>`, `ID_PREFIX: L<N>` for lab `6_M_N`), told to reuse the topic's lesson ledgers where they already prove a claim and to research only what is missing.
4. One new `writer` per lab (`LAB-CTR-<lab id>`), in parallel, following plan 3.1 and the `lab-builder` skill. Reuse `shared/hello-svc` and `shared/scripts/`. **Do not run the labs.** The header says `Chưa chạy thử`. `verify.sh` only reads state; `cleanup.sh` deletes only what the lab created.
5. Run G4 and G5 on each lab README and its scripts, then check plan 9.3.
6. Update the lab rows in the topic README (`Đã tạo, chưa chạy thử`, linked) and its header `Trạng thái`. Run the checker on the whole track with `--online`.
7. Tell me in Vietnamese which lab to run first and what each `verify.sh` checks. **Then stop.**

## Hard rules for this initiative
- You never search the web and never write files. Researchers research, writers write, the verifier verifies.
- Cost rules (`.agents/rules/04-squad-orchestration.md` section 2.1): one fresh `researcher` and one fresh `writer` per lesson, paths instead of pasted content, each check run once (no extra quote-check tasks), no polling of subagents or background tasks, and stop at the end of this RUN.
- Lessons are in Vietnamese with standard English technical terms. File and folder names are in English, exactly as in plan section 4.
- 100% relative links, never `file://` or `/home/...`. Paths contain spaces, so writers use `](<...>)` link syntax.
- Existing files (topic READMEs, `container/README.md`) get partial edits only. Never overwrite them, never remove or rename a heading, and **never touch `container/CHECKLIST.md`**.
- Kubernetes, Helm and GitLab change fast. Every non-stable feature states its feature state and version. Anything a source cannot prove is labelled `UNVERIFIED`, or removed.
- Search snippets, blogs, and AI summaries are not evidence. The Helm 3 end-of-life dates in the README came from snippets: open `helm.sh/blog`.
- Do not run labs, create clusters, or install anything on my machine. Writers may only run `mkdir -p`, `chmod +x` on lab scripts, the checker, and read-only `git` commands.
- Do not commit or push. I will do that myself with the `git-push` skill.
- If a run cannot finish (budget, quota, blocked research), stop and report exactly which lessons or labs are done, PASS, pending or failed, so the next conversation can resume with the same `RUN`.

## Final report format (end of every run)
| File | WRITE / LAB id | Verifier verdict | Verify loops | Claims P / F / U | UNVERIFIED % | DoD (9.1 or 9.3) met? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

Then give:
- **Topic DoD (9.2)** (lesson runs that close a topic): each item ticked or failed.
- **Run metrics (9.4)**: lesson progress (run, and track-wide out of 76), first-pass PASS rate, average verify loops, research re-dispatches, UNVERIFIED ratio, section 5 claims resolved (run, and track-wide out of 31), README bullets corrected, and checker result. Mark any metric that misses its target.
- Each section 5 claim of this run and what the sources actually said, every README bullet you corrected (old → new, with source), open issues, and the next `RUN` value.
