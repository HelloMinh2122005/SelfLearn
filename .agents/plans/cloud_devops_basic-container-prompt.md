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

1. Have one short `author` small job (no `LESSON`) run `python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py cloud_devops_basic/container` (offline).
2. If the checker reports any `ERROR`, stop and show it to me.

## What to do for this RUN

### Lesson runs (`RUN: 6_M` or `6_M:a-b`)
1. **Scope**: List the lesson files of this run from plan section 4 (with the topic README heading each one covers) and the section 5 claims for this topic. Show me that list in your first message.
2. **Author (write first)**: Start **one new `author` per lesson**, all in parallel (`WRITE-CTR-<lesson id>`). Authors do no research: each writes its draft at once and tags every fact. Each contract covers that one lesson completely, phrased as questions the lesson must answer:
   - its mechanisms: object model, controllers, lifecycles and request flows;
   - its commands, flags, YAML fields and `apiVersion`s, defaults, limits, feature states (`alpha`/`beta`/`stable`) and the version they apply to (Kubernetes 1.x, Helm 4 vs 3, GitLab version and tier, Podman/Docker);
   - the section 5 claims that belong to that lesson. A fact several lessons need goes to the first lesson that teaches it; name that owner in the other contracts' `OUT_OF_SCOPE`.
   - `AUTHORIZED_SOURCES` from plan section 7 (for section 7 links). `CURRICULUM_DOMAIN: DevOps`. `LESSON: <lesson id and title>`. `CLAIM_PREFIX: C<P>` (lesson `6_6_4` → `C4`). `CLAIMS: 12-25` (hard maximum 25).
   - `TARGET_COURSE: cloud_devops_basic/container`. `TARGET_FILE` is the exact path from plan section 4, for example `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_3 Kubernetes Architecture and Core Workloads/6_3_1 Kubernetes Cluster Architecture.md`. `SIZE_BUDGET: hard limit 24 KB`. `CHECKLIST_FILE: none (learner-owned, do not edit)`. Tell each author explicitly that, on this track, its usual "mark `[x]` in `CHECKLIST.md`" close step is replaced by the topic README lessons table (plan 6.3).
   - Also give each author, **in the contract up front**: a pedagogical blueprint (analogy plus core message), the lab that practises the lesson (from the topic README), and the overlap links from plan section 4 (for example 6_1_3 → Linux 3_8_1, 6_6_5 → 6_2_11).
   - Authors use the 7-section template and the section 6.2 Hands-on rules: tool versions stated, Helm 4 flags with the Helm 3 equivalent noted, and code-policy labels.
3. **G1 (draft)**: on each author report: `DRAFT READY`, mechanical exit `0`, 0 untagged lines, 12–25 claim ids, verifier chunks listed. Otherwise send the gap back to the same author.
4. **G2 (parallel verification)**: as soon as a lesson passes G1, start **one new `verifier` per chunk** (`Model: "pro"`), all lessons together. Contract: lesson path, `CLAIM_IDS`, `VERIFY_LEDGER: cloud_devops_basic/container/.evidence/verify/WRITE-CTR-<lesson id>-V<k>.md`, `AUTHORIZED_SOURCES` from plan section 7, `MODE: full`. Exactly one verifier per lesson has `SWEEP: yes` and `SCOPE` = the lesson's README bullets plus its section 5 claims.
5. **G3 + G4 (local fix)**: send each lesson's FAIL / NOT_FOUND ids and "tags to add" to the author who owns it. It changes only those lines. Then one new verifier with `MODE: recheck` checks only the changed ids (`-RC<n>` ledger). At most 2 rounds; then report the open ids to me. You cannot override a FAIL. After PASS, the author runs the close step (G5) with the ledgers in order `V1 … Vk RC1 …`.
6. **README bullets**: If a source contradicts a bullet in the topic README, the lesson teaches the source. The owning author then corrects that one bullet with a partial edit, and it goes through G4 and G5.
7. **DoD check**: Use the `evidence.py lesson` output and the verdict block of each verification report to check plan 9.1. Do not read whole lessons into your context; open a specific section with a line range only when an item is in doubt. Send back any lesson that misses an item.
8. **Close** (only if this run finishes the topic): one `author` small job adds the lessons section (plan 6.3) to the topic README before `## 🧪 Labs`, updates the topic README header `Trạng thái` and the topic's row in `cloud_devops_basic/container/README.md`, and runs the checker on `cloud_devops_basic/container` with `--online` and no `--only`. It must exit `0`.

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
3. One new `author` per lab (`LAB-CTR-<lab id>`, `CLAIM_PREFIX: C<N>` for lab `6_M_N`), in parallel. It writes the lab at once and tags every command, flag, YAML field, Helm and GitLab keyword the learner runs, like a lesson fact.
4. The author builds the lab following plan 3.1 and the `lab-builder` skill. Reuse `shared/hello-svc` and `shared/scripts/`. **Do not run the labs.** The header says `Chưa chạy thử`. `verify.sh` only reads state; `cleanup.sh` deletes only what the lab created.
5. Run G1 to G5 on each lab README and its scripts as for a lesson (parallel verifiers per chunk, local fixes), then check plan 9.3.
6. Update the lab rows in the topic README (`Đã tạo, chưa chạy thử`, linked) and its header `Trạng thái`. Run the checker on the whole track with `--online`.
7. Tell me in Vietnamese which lab to run first and what each `verify.sh` checks. **Then stop.**

## Hard rules for this initiative
- You never search the web and never write files. Authors research and write, the verifier verifies.
- Cost rules (`.agents/rules/04-squad-orchestration.md` section 2.1): one fresh `author` per lesson, paths instead of pasted content, each check run once (no extra quote-check tasks), no polling of subagents or background tasks, and stop at the end of this RUN.
- Lessons are in Vietnamese with standard English technical terms. File and folder names are in English, exactly as in plan section 4.
- 100% relative links, never `file://` or `/home/...`. Paths contain spaces, so authors use `](<...>)` link syntax.
- Existing files (topic READMEs, `container/README.md`) get partial edits only. Never overwrite them, never remove or rename a heading, and **never touch `container/CHECKLIST.md`**.
- Kubernetes, Helm and GitLab change fast. Every non-stable feature states its feature state and version. Anything a source cannot prove (`NOT_FOUND`) is removed.
- Search snippets, blogs, and AI summaries are not evidence. The Helm 3 end-of-life dates in the README came from snippets: open `helm.sh/blog`.
- Do not run labs, create clusters, or install anything on my machine. Authors may only run `evidence.py`, the checker, `mkdir -p`, `chmod +x` on lab scripts, and `grep`/`sed -n` on ledger and cache files.
- Do not run any `git` command. I manage version control myself.
- If a run cannot finish (budget, quota, blocked research), stop and report exactly which lessons or labs are done, PASS, pending or failed, so the next conversation can resume with the same `RUN`.

## Final report format (end of every run)
| File | WRITE / LAB id | Verifier verdict | Fix rounds | Claims V / F / NF at G2 | First-pass fail % | Minutes (draft / verify / fix) | DoD (9.1 or 9.3) met? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

Then give:
- **Topic DoD (9.2)** (lesson runs that close a topic): each item ticked or failed.
- **Run metrics (9.4)**: lesson progress (run, and track-wide out of 76), first-pass PASS rate, average verify loops, author send-backs at G1, first-pass FAIL + NOT_FOUND rate at G2, wall-clock minutes per phase, section 5 claims resolved (run, and track-wide out of 31), README bullets corrected, and checker result. Mark any metric that misses its target.
- Each section 5 claim of this run and what the sources actually said, every README bullet you corrected (old → new, with source), open issues, and the next `RUN` value.
