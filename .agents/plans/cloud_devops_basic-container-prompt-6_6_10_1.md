@teacher-orchestrator

RUN: 6_6_10_1 (single supplementary lesson, outside the plan section 4 manifest)

## Mission

Write and verify **one new lesson** in the container track: `6_6_10_1 Flux Installation and Bootstrap`. It teaches how Flux is installed on a cluster, by hand and with `flux bootstrap gitlab`, and how enterprises do it. I need it before stage `capstone-2-platform` of my capstone (`6_9`), which installs Flux with `flux bootstrap gitlab` on a local kind cluster against GitLab.com.

This lesson is a sub-lesson of `6_6_10 GitOps Concepts`, like the existing `6_6_5_1` is a sub-lesson of `6_6_5`. Follow the same naming and evidence pattern as `6_6_5_1`.

Read first, with `read_file`, and nothing else before dispatch:
- `.agents/plans/cloud_devops_basic-container-plan.md` sections 1.1, 3, 6, 7, 9.1 (template, Hands-on rules, source policy, lesson DoD). Section 4 does not list this lesson: use the file name below.
- `AGENTS.md` and `.agents/rules/01` to `05`.
- The scope: heading `### 6_6_10_1 Cài Đặt Flux và Bootstrap (Thực Chiến)` and lab `### lab-6_6_7-flux-install-and-bootstrap` in `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_6 GitLab CI-CD and Release Strategies/README.md`.

## Pre-flight

One short `author` small job (no `LESSON`) runs `python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py cloud_devops_basic/container` (offline). If it reports any `ERROR`, stop and show me.

## Author contract (one `author`, `WRITE-CTR-6_6_10_1`)

- `LESSON: 6_6_10_1 Flux Installation and Bootstrap`
- `TARGET_COURSE: cloud_devops_basic/container`
- `TARGET_FILE: cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_6 GitLab CI-CD and Release Strategies/6_6_10_1 Flux Installation and Bootstrap.md`
- `CLAIM_PREFIX: C101` · `CLAIMS: 12-25` (hard maximum 25) · `SIZE_BUDGET: hard limit 24 KB` · `CURRICULUM_DOMAIN: DevOps`
- `CHECKLIST_FILE: none (learner-owned, do not edit)`. The topic README has no lessons table yet, so the close step only sets the lesson header `Trạng thái` and writes the evidence index `cloud_devops_basic/container/.evidence/WRITE-CTR-6_6_10_1.md` (same format as `.evidence/WRITE-6_6_5_1.md`).
- Header `Lộ trình` links to the topic README heading and to `6_6_10 GitOps Concepts.md`.
- `AUTHORIZED_SOURCES`: `fluxcd.io/flux` (docs, CLI reference `fluxcd.io/flux/cmd/`, installation, bootstrap, security, multi-tenancy, guides), `docs.gitlab.com` (deploy keys, deploy tokens, access tokens, GitLab + Flux pages), Tier-2 `github.com/fluxcd/*` (READMEs of `flux2`, `flux2-kustomize-helm-example`, `flux2-multi-tenancy`, `terraform-provider-flux`), `registry.terraform.io/providers/fluxcd/flux` for the Terraform provider, `github.com/controlplaneio-fluxcd/flux-operator` and `fluxoperator.dev` only for "what Flux Operator is", `kind.sigs.k8s.io`, `kubernetes.io/docs`. Blogs (oneuptime, Medium, dev.to), search snippets and AI summaries are not evidence.

### Questions the lesson must answer
1. What Flux installs into a cluster: which controllers (source, kustomize, helm, notification; image-reflector and image-automation as extras), the `flux-system` namespace, CRDs. What `flux check --pre` checks.
2. Manual install: what `flux install` does, how it differs from bootstrap, and the link back to `GitRepository` + `Kustomization` + deploy-token Secret already taught in `6_6_10` §4.2 (link, do not re-teach). The limitation: Flux itself is not managed from Git.
3. `flux bootstrap gitlab`: the main flags (`--owner`, `--repository`, `--branch`, `--path`, `--personal`, `--private`, `--token-auth`, `--read-write-key`, `--components-extra`, `--hostname` for self-managed GitLab), the `GITLAB_TOKEN` variable and the token scopes it needs, whether it creates the project if missing. Use the exact flag names from the CLI reference; drop any flag the page does not list.
4. What bootstrap writes to the repo (`<path>/flux-system/` files) and to the cluster (deploy key, Secret, `GitRepository` and `Kustomization` named `flux-system`). Why re-running bootstrap is idempotent and is also how Flux is upgraded.
5. Why the high-privilege token is only needed at bootstrap time, and what Flux uses afterwards (deploy key read-only by default; when read-write is needed, for example image automation).
6. `flux bootstrap git` for any Git server, one sentence.
7. Repo layout for several clusters and environments: `clusters/<name>/`, infrastructure vs apps, `dependsOn` between `Kustomization`s, as in `flux2-kustomize-helm-example`.
8. Secret decryption at bootstrap time: the SOPS key Secret must exist before a `Kustomization` with `decryption` reconciles (concept and link to the Flux SOPS guide; do not teach SOPS in depth).
9. Day-2 commands: `flux get all -A`, `flux reconcile kustomization <name> --with-source`, `flux suspend` / `flux resume`, `flux logs`, `flux uninstall` (what it removes and keeps).
10. Enterprise options (concept, one short paragraph each): Terraform/OpenTofu provider `fluxcd/flux` with `flux_bootstrap_git`; Flux Operator with `FluxInstance` (state clearly it is a ControlPlane project, not part of `fluxcd/flux2`, and say what the Flux installation page currently recommends); multi-tenancy lockdown with `serviceAccountName` impersonation and `--no-cross-namespace-refs`.
11. One comparison table: manual install vs `flux bootstrap` vs Terraform provider vs Flux Operator (who holds credentials, is Flux itself in Git, how to upgrade).

### Claims to research, do not copy as written (from my own notes, unverified)
- "The Flux installation page says bootstrap is the recommended way to install Flux."
- "`flux bootstrap gitlab` creates a read-only deploy key by default; image automation needs `--read-write-key`."
- "After bootstrap, the token used for bootstrap can be revoked and Flux keeps syncing."
- "Bootstrap writes `gotk-components.yaml`, `gotk-sync.yaml` and `kustomization.yaml` under `<path>/flux-system/`."
- "`flux uninstall` keeps the objects that Flux applied unless told otherwise."
- "Flux Operator is maintained by ControlPlane; its docs recommend installing the operator with Helm in production."

### Pedagogical blueprint
- Analogy: opening a new branch of a restaurant chain. Manual install = the manager copies the rulebook by hand and hangs it on the wall; nobody updates the wall copy. Bootstrap = HQ installs a manager whose own job description is also kept in the HQ rulebook, so replacing or upgrading the manager is just a rulebook change. The bootstrap token = the master key HQ uses once to open the shop and then hands back; the deploy key = the read-only pass the manager keeps.
- Core message: "Everything in the cluster, including the GitOps agent itself, should be rebuildable from Git plus one command."
- Practice: `lab-6_6_7-flux-install-and-bootstrap` (topic README).
- Overlap (link, do not re-teach): `6_6_10` owns push vs pull, two-repo model, `GitRepository`/`Kustomization` basics; `6_5_11` owns `HelmRelease`; `6_6_7` owns the GitLab agent; `6_6_3` owns CI variables and token handling; `6_7_1` owns RBAC; `6_4_5` owns Secrets and external secret tools.

### Hands-on rules
- Target: kind cluster `lab`, GitLab.com Free, repo `hello-svc-env` from `6_6_10` §4.1. State the Flux CLI version the commands apply to.
- Commands not copied from a cited Tier-1 example carry `> ⚠️ Chưa chạy thử (not executed by the squad)`. Example output is marked illustrative. Commands that change a cluster carry `> ⚠️ Chỉ chạy trên cluster thử nghiệm (lab cluster only)`.
- Never print a real token; use `export GITLAB_TOKEN=<token>` placeholders.

## Verification

G1 to G5 exactly as in plan section 3 and rule 05: one new `verifier` per chunk of ≤ 10 claims (`Model: "pro"`), ledgers `cloud_devops_basic/container/.evidence/verify/WRITE-CTR-6_6_10_1-V<k>.md`, exactly one verifier with `SWEEP: yes` and `SCOPE` = the 7 README bullets of `6_6_10_1` plus the claims list above. At most 2 recheck rounds (`-RC<n>`), then report open ids to me. If a source contradicts a README bullet of `6_6_10_1`, the author corrects that bullet with a partial edit.

## Hard rules
- You never search the web and never write files.
- Do not touch `container/CHECKLIST.md`, the plan file, or any other lesson. Partial edits only to the topic README (only the `6_6_10_1` bullets, if a source contradicts them).
- 100% relative links with `](<...>)` syntax. Vietnamese text, English technical terms, English file name exactly as above.
- Do not run labs, create clusters, install anything, or run any `git` command.
- Stop after this one lesson.

## Final report
The standard table (File, WRITE id, verdict, fix rounds, claims V/F/NF at G2, first-pass fail %, minutes, DoD 9.1 met?), then: what the sources said for each claim in the list above, any README bullet corrected (old → new, source), and open issues. Then teach me the lesson in Vietnamese: core idea and analogy, a Mermaid map, 3 active-recall questions (at least 1 in English as an interview question), and which checkpoint (`6_6_10_1`, `lab-6_6_7`) I should try to tick.
