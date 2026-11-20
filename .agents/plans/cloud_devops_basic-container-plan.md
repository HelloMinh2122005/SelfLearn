# Curriculum Build Plan: `cloud_devops_basic/container`

> Owner: `teacher-orchestrator`. This file is the **manifest** for writing the lesson files and building the lab folders of the container track (Domain 6: Docker/Podman, Kubernetes, Helm, GitLab CI/CD, observability).
> It is a plan, not curriculum. Nothing in it is a verified technical fact. The topic READMEs were drafted on 15-11-2026 **without** the squad's gates. Every fact must still pass gates G1 to G5 (`.agents/rules/05-verification-gates.md`).
> The older plan `cloud_devops_basic-plan.md` does **not** apply to this track. Its section 8 puts containers out of scope.

---

## 1. Target Layout

```text
cloud_devops_basic/container/
├── README.md                                   # track roadmap (partial edits only)
├── CHECKLIST.md                                # LEARNER self-assessment, the squad never ticks it (see 1.1)
├── .evidence/verify/WRITE-CTR-<id>-V<k>.md     # Verify Ledgers (one per verifier chunk; -RC<n> for re-checks)
├── .evidence/research/TASK-CTR-<run>-R<n>.md   # Older research-first Claim Ledgers (before 20-11-2026)
├── .evidence/WRITE-CTR-<id>.md                 # evidence index per lesson (written by authors)
├── shared/hello-svc/ , shared/scripts/          # sample app and helper scripts used by all labs
└── 6 Domain 6 - Containers and Kubernetes/
    └── 6_3 Kubernetes Architecture and Core Workloads/
        ├── README.md                           # EXISTING topic README (partial edits only)
        ├── 6_3_1 Kubernetes Cluster Architecture.md   # lesson file (new)
        └── labs/lab-6_3_1-kind-cluster-and-first-deployment/   # lab folder (LAB runs only)
```

Naming rules: English names. Use ` - ` and never `:`. Use `and` instead of `&`. No `/`, backticks, `?`, or `'` in names. File names in section 4 are final; use them exactly.

Totals: **76 lesson files** in 8 topics (6_1 to 6_8) and **33 lab folders** (6_1 to 6_8; labs 6_2_1 and 6_2_2 already exist, so 31 to build). 6_9 Capstone is the learner's own project: out of scope.

### 1.1 What is different from the other `cloud_devops_basic` courses
1. **The topic `README.md` already exists** (scope bullets + lab definitions). The squad does not write a new module README. At module close it **adds** a `## 📂 Bài Học Chi Tiết (Lessons)` section (template 6.3) right before `## 🧪 Labs`.
2. **`container/CHECKLIST.md` belongs to the learner.** Its items mean "I can do this without notes". The squad **never** ticks it and never edits its counters. Progress is recorded in the lesson header, the topic README lessons table, and the `Trạng thái` column of `container/README.md`.
3. The checker (`check_curriculum.py`) does not recognize the counter format of `container/CHECKLIST.md`, so it does not validate those counters. That is expected, and it is one more reason not to edit that file.
4. **Topic README bullets were not verified.** When a source contradicts a bullet, the lesson teaches what the source says. The author may then correct **that one bullet** in the topic README with a partial edit, and the change is listed in the run report. This is allowed for this track only.

---

## 2. Run Types

| `RUN` value | Unit of work | Precondition |
| :--- | :--- | :--- |
| `6_<M>` | All lessons of topic `6_<M>` | none |
| `6_<M>:<a>-<b>` | Lessons `6_<M>_<a>` to `6_<M>_<b>` of a large topic | none. The module close (step 7 of section 3) runs only in the part that finishes the topic. |
| `LAB 6_<M>` | All lab folders of topic `6_<M>` defined in its README | every lesson of `6_<M>` has a verifier PASS |

Recommended order (interview priority first, then the foundations):
`6_3` → `6_5:1-6` → `6_5:7-11` → `6_6:1-6` → `6_6:7-11` → `6_8` → `6_4` → `6_7:1-5` → `6_7:6-10` → `6_1:1-5` → `6_1:6-10` → `6_2:1-6` → `6_2:7-11`, then `LAB` runs in the same topic order.

IDs: writing `WRITE-CTR-<lesson id>` (claim prefix `C<P>`; older lessons used research `TASK-CTR-<lesson id>` with prefix `R<P>`), topic README edit `WRITE-CTR-<module>-README`, labs `LAB-CTR-<lab id>`.

---

## 3. Per-Run Procedure (lesson runs)

1. **Scope**: Read the topic README section of each lesson (the `### 6_M_P` heading and its bullets), section 4 of this plan, and the section 5 claims for the topic.
2. **Author (parallel, one `author` per lesson)**: each contract covers one lesson, both
   - its mechanisms (object model, controllers and lifecycles, request flows, for example how a Deployment rollout progresses, the Pod termination sequence, how Helm stores a release, how a GitLab job reaches the cluster through the agent), and
   - its exact commands, flags, YAML fields and `apiVersion`s, default values, limits, version and feature-state currency (Kubernetes minor version and `alpha`/`beta`/`stable`; Helm 4 vs Helm 3; GitLab version and tier), runnable examples from Tier-1 pages, and the section 5 claims that belong to that lesson.
   - 12–25 claim ids, hard maximum 25, `CLAIM_PREFIX: C<P>`.
   - Acceptance criteria are phrased as questions the lesson must answer. The pedagogical blueprint is in the contract.
   - **Write first** (rule 05, from 20-11-2026): the author does no research. It plans the size, writes the file once from its own knowledge, tags every fact with `<!-- ev: C<P>.<m> -->`, stays under the 24 KB hard limit, sets `Trạng thái: Bản nháp, chờ kiểm chứng`, and runs `check_curriculum.py --only`, `evidence.py lesson` (draft mode) and `evidence.py claims --chunk 10` at most 2 times.
3. **G1 (teacher, on the author report)**: mechanical exit `0`, 0 untagged lines, 12–25 claim ids, verifier chunks listed. Anything missing goes back to the same author.
4. **G2 Verify (parallel)**: one new `verifier` (`Model: "pro"`) per chunk of ≤ 10 claim ids, all at once; one per lesson has `SWEEP: yes`. Ledgers go to `cloud_devops_basic/container/.evidence/verify/`.
5. **G3 + G4 Local fix**: FAIL / NOT_FOUND ids go back to the same author, which changes only those lines; one new verifier re-checks only the changed ids. At most 2 rounds. Then the author's close step (G5).
6. **README bullet corrections** (section 1.1 rule 4), if any, are tagged and go through G2 to G5 like a lesson edit.
7. **Close** (only in the run that finishes the topic): one `author` (small job)
   - adds the lessons section (template 6.3) to the topic README,
   - sets the topic README header `Trạng thái` to `Bài học: <n>/<n> Verified (<dd-mm-yyyy>); Lab: <state>`,
   - updates the topic's `Trạng thái` cell in the table of `cloud_devops_basic/container/README.md`,
   - runs the checker once on `cloud_devops_basic/container` with `--online` and no `--only`; it must exit `0`.

### 3.1 Per-Run Procedure (`LAB` runs)
1. For each lab defined in the topic README (`### lab-6_M_N-...`), build `labs/lab-6_M_N-<slug>/` with the `lab-builder` skill layout: `README.md`, `setup/`, `solution/`, `scripts/verify.sh`, `scripts/cleanup.sh`. Use `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_2 Container Image Engineering/labs/lab-6_2_1-java-multistage-image/` as the reference for style and depth.
2. Reuse `shared/hello-svc` and `shared/scripts/` (image `selflearn.invalid/hello-svc:1.0.0` / `2.0.0`, cluster `kind` named `lab`). Do not add a second sample app unless the lab definition requires one.
3. Every command, flag, YAML field and Helm/GitLab keyword in a lab carries a claim tag and passes G1 to G5 like a lesson claim.
4. The squad does **not** run the labs. The lab README header says `> **Trạng thái kiểm chứng**: Chưa chạy thử (squad không thực thi)`, and expected outputs are marked illustrative. `verify.sh` must only read state (`kubectl get`, `helm status`, `curl`) and print `[PASS]`/`[FAIL]` lines. `cleanup.sh` must only delete what the lab created.
5. Replace the lab's row status `Định nghĩa` with `Đã tạo, chưa chạy thử` and turn the lab name into a relative link to its `README.md`.
6. The existing labs 6_2_1 and 6_2_2 are done. Do not rebuild them.

---

## 4. Lesson Manifest

Folder prefix: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/`. Each lesson covers exactly the bullets under the same `### 6_M_P` heading in the topic README.

| Topic folder | Lesson files |
| :--- | :--- |
| `6_1 Container Fundamentals` | `6_1_1 Containers vs Virtual Machines` · `6_1_2 Linux Namespaces for Containers` · `6_1_3 Control Groups v2 for Containers` · `6_1_4 Images Layers and Overlay Filesystem` · `6_1_5 Open Container Initiative Specifications` · `6_1_6 Container Runtimes and Ecosystem` · `6_1_7 Container Security Fundamentals` · `6_1_8 Container Lifecycle PID 1 and Signals` · `6_1_9 Container Networking Basics` · `6_1_10 Container Data Storage` |
| `6_2 Container Image Engineering` | `6_2_1 Dockerfile Instructions` · `6_2_2 Build Context and dockerignore` · `6_2_3 Layer Caching` · `6_2_4 Multi-Stage Builds for Java` · `6_2_5 Choosing a Base Image` · `6_2_6 Image Security` · `6_2_7 Tags Digests and Versioning` · `6_2_8 Container Registries` · `6_2_9 Multi-Architecture Images` · `6_2_10 Compose for Local Development` · `6_2_11 Building Images in CI` |
| `6_3 Kubernetes Architecture and Core Workloads` | `6_3_1 Kubernetes Cluster Architecture` · `6_3_2 kubectl and API Objects` · `6_3_3 Pods` · `6_3_4 ReplicaSets and Deployments` · `6_3_5 Liveness Readiness and Startup Probes` · `6_3_6 Resource Requests Limits and QoS` · `6_3_7 Graceful Shutdown During Rolling Updates` · `6_3_8 DaemonSets Jobs and CronJobs` |
| `6_4 Kubernetes Networking Configuration and Storage` | `6_4_1 Kubernetes Network Model` · `6_4_2 Services and EndpointSlices` · `6_4_3 Cluster DNS` · `6_4_4 Ingress and Gateway API` · `6_4_5 ConfigMaps and Secrets` · `6_4_6 Volumes PersistentVolumes and StorageClasses` · `6_4_7 StatefulSets and Stateful Workloads` |
| `6_5 Helm Package Management` | `6_5_1 Helm Core Concepts` · `6_5_2 Chart Structure` · `6_5_3 Template Language` · `6_5_4 Values and Precedence` · `6_5_5 Release Lifecycle` · `6_5_6 Validating Charts Before Deploy` · `6_5_7 Dependencies Subcharts and Library Charts` · `6_5_8 Hooks and Chart Tests` · `6_5_9 Packaging and OCI Distribution` · `6_5_10 Production Chart Patterns` · `6_5_11 Helm in GitOps` |
| `6_6 GitLab CI-CD and Release Strategies` | `6_6_1 GitLab CI-CD Concepts` · `6_6_2 gitlab-ci.yml Syntax` · `6_6_3 Variables and Secrets` · `6_6_4 GitLab Runner and Executors` · `6_6_5 Building Images in GitLab CI` · `6_6_6 Testing and Quality Gates` · `6_6_7 Deploying to Kubernetes with the GitLab Agent` · `6_6_8 Release Strategies and Rollback` · `6_6_9 Versioning and Releases` · `6_6_10 GitOps Concepts` · `6_6_11 Pipeline Optimization and Troubleshooting` |
| `6_7 Kubernetes Security Scheduling and Scaling` | `6_7_1 Authentication RBAC and ServiceAccounts` · `6_7_2 Pod Security Context and Pod Security Standards` · `6_7_3 NetworkPolicy` · `6_7_4 Protecting Secrets and the Supply Chain` · `6_7_5 Admission Control and Policy` · `6_7_6 Pod Scheduling` · `6_7_7 PodDisruptionBudgets and Node Drain` · `6_7_8 Autoscaling` · `6_7_9 CRDs and the Operator Pattern` · `6_7_10 Cluster Lifecycle and Upgrades` |
| `6_8 Kubernetes Observability and Troubleshooting` | `6_8_1 Troubleshooting Workflow with kubectl` · `6_8_2 Common Failure Catalog` · `6_8_3 Logging Architecture` · `6_8_4 Metrics and Prometheus` · `6_8_5 Dashboards Alerting and SLOs` · `6_8_6 Distributed Tracing Concepts` · `6_8_7 Observability During Deployments` · `6_8_8 Node-Level Debugging` |

**Overlap rules** (link, do not re-teach):
- `6_1_2`, `6_1_3` teach the container angle only. Kernel detail belongs to Linux `3_8_2` / `3_8_1`; link to `cloud_devops_basic/CHECKLIST.md` (or the Linux lesson file if it exists). `6_1_8` links to `3_4_1` (signals) and `1_2_5` (zombies). `6_1_9` links to Domain 2 (NAT `2_4_9`) and `5_1_8` (tcpdump).
- `6_2_11` teaches the generic trade-off (DinD vs daemonless). `6_6_5` teaches the GitLab implementation and links to `6_2_11`.
- `6_2_7` owns tag vs digest. `6_6_8` / `6_6_9` link to it for promotion.
- `6_3_5` owns probes. `6_4_2` links to it for EndpointSlice readiness.
- `6_4_4` owns Gateway API weights. `6_6_8` links to it for canary.
- `6_7_1` owns RBAC. `6_6_7` links to it for the deployer's permissions.
- `6_8_2` is a catalogue: one short entry per failure, linking to the lesson that owns the mechanism (`6_3_5`, `6_3_6`, `6_4_2`, `6_4_5`, `6_5_5`, `6_7_3`, `6_7_6`).

---

## 5. Claims to Verify (Hand to the Lesson's Author, Do Not Teach as Written)

Statements in the topic READMEs that are version-dependent, were taken from search snippets, or are easy to get wrong. They are **leads, not findings**.

| Topic | README statement | Why it needs checking |
| :--- | :--- | :--- |
| 6_1 | There are 8 namespace types including `time` | Check `namespaces(7)` for the current list. |
| 6_1 | Podman 5 rootless networking defaults to `pasta`; Fedora's default OCI runtime is `crun`; Podman DNS is `aardvark-dns` | Version and distro dependent. Check docs.podman.io and the containers GitHub docs. |
| 6_1 | PID 1 ignores signals without a handler | Check `kill(2)` / `pid_namespaces(7)` wording exactly. |
| 6_2 | `HEALTHCHECK` exists only in Docker image format; OCI-format images (Podman default) drop it | Check docs.podman.io (`podman build --format`) and the Dockerfile reference. |
| 6_2 | An `ARG` used only in `ENV` did not invalidate the cache on Podman 5.8.9 | This was **observed** in lab 6_2_2, and it contradicts the Docker docs. Teach the Docker docs, and present the Podman behaviour as a lab observation with version and date. |
| 6_2 | Docker allows an insecure `localhost` registry by default | Check the dockerd `--insecure-registries` reference. |
| 6_3 | Latest Kubernetes is 1.37 (1.37.1 on 15-09-2026); 3 minor versions are supported; about 3 releases per year | Check kubernetes.io/releases at research time; numbers move. |
| 6_3 | Native sidecar = init container with `restartPolicy: Always`, and its feature state | Check the Sidecar Containers page for the version it became stable. |
| 6_3 | Default `terminationGracePeriodSeconds` is 30; endpoint removal runs in parallel with `preStop` | Check Pod Lifecycle "Termination of Pods". |
| 6_4 | kube-proxy modes: iptables, nftables, ipvs, and their status | Mode status changed across recent releases. State the version. |
| 6_4 | Ingress NGINX controller was retired in March 2026; Gateway API is the recommended path | The README date came from secondary coverage plus the 11-11-2025 kubernetes.io blog. Open the official blog posts. |
| 6_4 | ConfigMap volume updates propagate with a delay, but not with `subPath`; env vars never update | Check the ConfigMaps page. |
| 6_4 | kind ships a default StorageClass `standard` (local-path provisioner) | Check kind docs. |
| 6_4 | `persistentVolumeClaimRetentionPolicy` and its feature state | Check the StatefulSets page. |
| 6_5 | Helm 4.0.0 released 12-11-2025; Helm 3 bug fixes ended 09-09-2026; security fixes until 10-02-2027 | The Helm 3 dates came from **search snippets only**. Open helm.sh/blog. |
| 6_5 | Helm 4: `--atomic` → `--rollback-on-failure`, `--force` → `--force-replace`; server-side apply is the default for new installs | Check helm.sh/docs/overview and the command references. |
| 6_5 | `--dry-run=server` exists; Helm does not upgrade CRDs in `crds/` | Check helm.sh command reference and the CRD best-practices page. |
| 6_5 | Helm release Secrets carry the label `owner=helm` | Check the Helm docs or the Helm source (Tier-2). |
| 6_6 | `rules` replaces `only/except` | Check the current status of `only/except` (deprecated or not). |
| 6_6 | Runner registration tokens are deprecated in favour of runner authentication tokens | Check the version in which the old flow was removed or disabled. |
| 6_6 | Kaniko's original Google repository was archived in 2025 | Open the GitHub repository itself, and check what docs.gitlab.com recommends now. |
| 6_6 | Some security scanners need a paid tier | Check each feature's "Tier" line on docs.gitlab.com. |
| 6_6 | Certificate-based cluster integration is deprecated (not removed); agent context is `<path/to/agent-project>:<agent-name>` | Check the agent CI/CD workflow page and the deprecations page. |
| 6_6 | `release` keyword behaviour (release-cli vs glab) and GitLab–Flux integration | Both changed recently. Check docs.gitlab.com. |
| 6_6 | The example `.gitlab-ci.yml` in the topic README (not executed): `$CI_OPEN_MERGE_REQUESTS` workflow pattern, `buildah push --digestfile`, `artifacts:reports:dotenv` | Every keyword and flag must be proven before reuse in a lesson. |
| 6_7 | No auto-created long-lived ServiceAccount token Secrets since v1.24; PodSecurityPolicy removed in v1.25 | Check the service-accounts and PSP pages. |
| 6_7 | Whether kind's default CNI (kindnet) enforces NetworkPolicy | Version dependent. Check kind docs and release notes. |
| 6_7 | ValidatingAdmissionPolicy is stable; in-place Pod resize feature state | Check each page's feature-state banner. |
| 6_7 | metrics-server on kind needs `--kubelet-insecure-tls` | Check the metrics-server README (Tier-2); never teach it as safe for production. |
| 6_8 | Metric names `kube_pod_container_status_restarts_total`, `container_cpu_cfs_throttled_periods_total` | Check kube-state-metrics docs and cAdvisor metric docs. |
| 6_8 | `kubectl debug node/...` mounts the node filesystem at `/host` | Check "Debugging Kubernetes Nodes With Kubectl". |

---

## 6. File Templates

### 6.1 Lesson file: 7 sections

```markdown
# <6_M_P> <Lesson Title>

> **Khóa học**: Cloud DevOps Basic — Containers and Kubernetes
> **Phân nhóm**: 6 Domain 6 - Containers and Kubernetes › <Topic folder name>
> **Chủ đề**: <one line>
> **Phiên bản áp dụng**: <for example Kubernetes 1.37, Helm 4.x, GitLab 18.x Free, Podman 5.x>
> **Trạng thái**: Verified (<WRITE id>, <dd-mm-yyyy>) | Draft
> **Phạm vi**: [Topic README](./README.md#ANCHOR) · **Checkpoint của người học**: [CHECKLIST](../../CHECKLIST.md#ANCHOR)
<!-- ANCHOR = GitHub slug of the lesson's `### 6_M_P` heading in the topic README, and of the topic's `## 6_M ...` heading in CHECKLIST.md (for example `6_3-kubernetes-architecture-and-core-workloads`). -->

## 1. Khái Niệm Cốt Lõi & Bản Chất Kỹ Thuật (Core Concepts & Technical Deep Dive)
## 2. Ví Dụ Đời Sống Thực Tế Dễ Hiểu (Intuitive Real-World Analogies)
## 3. Kiến Trúc, Luồng Hoạt Động & Hình Ảnh Trực Quan (Architecture, Diagrams & Visual Media)
## 4. Thực Hành (Hands-on)
## 5. Cạm Bẫy Thực Tế & Thực Tiễn Sản Xuất (Production Gotchas & Best Practices)
## 6. Câu Hỏi Củng Cố Kiến Thức (Active Recall Quiz)
## 7. 📚 Nguồn Tài Liệu Chính Thống (Tier-1 Official References)
```

`AGENTS.md` section 5 describes an Azure-CLI lesson. This track uses the squad's **7-section** template because it is not Azure.

### 6.2 Section 4 (Hands-on) for this track
- Commands for `podman` (with the `docker` equivalent when it differs), `kubectl`, `helm`, and `.gitlab-ci.yml` snippets. Target environment: a local `kind` cluster named `lab` and the `shared/hello-svc` image. GitLab examples assume GitLab.com Free plus a project runner, unless the lesson says otherwise.
- Every example states the tool versions it applies to. Helm examples use Helm 4 flags and give the Helm 3 equivalent in a note.
- Prefer manifests and pipelines taken from Tier-1 examples (kubernetes.io, helm.sh, docs.gitlab.com) and cite the page.
- Point to the lab that practises the lesson (for example "Thực hành sâu: lab-6_3_2 ..." in the topic README).
- **Code policy**: The squad does not execute anything. Code not taken from a cited Tier-1 example carries `> ⚠️ Chưa chạy thử (not executed by the squad)`. Example output is marked illustrative. Commands that change a shared or real cluster carry `> ⚠️ Chỉ chạy trên cluster thử nghiệm (lab cluster only)`.

### 6.3 Lessons section added to the topic README (partial edit, before `## 🧪 Labs`)

```markdown
## 📂 Bài Học Chi Tiết (Lessons)

| Bài | Mục tiêu một dòng | Trạng thái |
| :--- | :--- | :--- |
| [6_3_1 Kubernetes Cluster Architecture](<./6_3_1 Kubernetes Cluster Architecture.md>) | ... | Verified (dd-mm-yyyy) |
```

---

## 7. Source Policy for This Track

| Area | Tier-1 sources (open the page) |
| :--- | :--- |
| Kubernetes | `kubernetes.io/docs`, `kubernetes.io/blog` (official project blog), `kubernetes.io/releases`, `kind.sigs.k8s.io`, `gateway-api.sigs.k8s.io`. Tier-2: `github.com/kubernetes/*`, `github.com/kubernetes-sigs/*` (READMEs, KEPs in `kubernetes/enhancements`). |
| Containers | `docs.docker.com`, `docs.podman.io`, `github.com/opencontainers/*` (runtime, image, distribution specs), `github.com/containers/*` docs (buildah, crun, netavark, pasta), `docs.kernel.org`, `man7.org/linux/man-pages`. |
| Java in containers | `docs.oracle.com/en/java/javase/21` (the `java` command options), `openjdk.org/jeps`. |
| Helm | `helm.sh/docs`, `helm.sh/blog`. Tier-2: `github.com/helm/helm`. |
| GitLab | `docs.gitlab.com` (CI/CD, runner, agent, environments, registry, deprecations pages). Tier-2: `gitlab.com/gitlab-org/*`. |
| Observability | `prometheus.io/docs`, `grafana.com/docs`, `opentelemetry.io/docs`, `www.w3.org/TR/trace-context`. Tier-2: `github.com/kubernetes/kube-state-metrics`, `github.com/kubernetes-sigs/metrics-server`, `github.com/prometheus-community/helm-charts`. |
| Ecosystem projects (official docs of each project) | `trivy.dev/docs`, `docs.sigstore.dev`, `cert-manager.io/docs`, `strimzi.io/docs`, `kyverno.io/docs`, `open-policy-agent.github.io/gatekeeper`, `argo-cd.readthedocs.io`, `fluxcd.io/flux`, `argoproj.github.io/argo-rollouts`, `docs.flagger.app`, `external-secrets.io`. Use them only for "what this project does". Kubernetes behaviour must be proven from kubernetes.io. |
| Not evidence | Blogs, Medium, dev.to, vendor marketing, Stack Overflow, AI summaries, search snippets. Baeldung / Martin Fowler only as labelled Tier-3 illustration (rule 02). |

---

## 8. Out of Scope

- `6_9 Capstone`: the learner's own project.
- Ticking or editing `cloud_devops_basic/container/CHECKLIST.md` (section 1.1).
- Rebuilding labs 6_2_1 and 6_2_2, or running any lab.
- Cloud-provider-specific Kubernetes (EKS/AKS/GKE) beyond one comparison sentence in `6_3_1`.
- Kafka, Cassandra, ZooKeeper administration. `6_4_7` and `6_7_9` explain only why they run as StatefulSets or Operators.
- Git and version control. The learner manages them.

---

## 9. Definition of Done and Metrics

A DoD item is a gate. A metric is reported but never blocks on its own. A verifier PASS is necessary but not sufficient.

### 9.1 Lesson DoD (each of the 76 lesson files)
- [ ] The file exists at the exact path and name from section 4. The header from 6.1 is complete, including **Phiên bản áp dụng**, and both header links resolve.
- [ ] All 7 sections are present, in order, and none is empty.
- [ ] Every bullet under the lesson's `### 6_M_P` heading in the topic README is explained in section 1, or listed as out of scope with a reason.
- [ ] At least 1 analogy (section 2) and at least 1 Mermaid diagram (section 3).
- [ ] Section 4 has at least 1 command, manifest or pipeline snippet, follows 6.2, and has the code-policy labels.
- [ ] Section 5 has at least 2 production gotchas.
- [ ] Section 6 has 2 to 3 scenario questions with answers in `<details>`. At least one is phrased like an interview question.
- [ ] Section 7 has at least 2 links to specific Tier-1 pages and no `generic homepage citation` warning.
- [ ] The verify ledgers are saved under `cloud_devops_basic/container/.evidence/verify/`, and the evidence index at `cloud_devops_basic/container/.evidence/WRITE-CTR-<id>.md`.
- [ ] `evidence.py lesson <file> --ledger <V1 … Vk RC…>` exits `0`: size ≤ 24 KB, every tag resolves to a VERIFIED row.
- [ ] Header `Trạng thái` is `Đã kiểm chứng (verifier PASS, <date>)`, not `Bản nháp`.
- [ ] The checker exits `0` with `--online --only "<file>"` (run once before reporting, and by the verifier).
- [ ] The verifier returns `PASS` on the final version. Any later edit needs a new verifier run.
- [ ] Every claim id in the final lesson is `VERIFIED`. `NOT_FOUND` facts were removed, not kept with a label.
- [ ] Every feature mentioned that is not `stable` / GA states its feature state and the version.
- [ ] Every section 5 claim for this lesson is resolved, and the resolution is in the run report.

### 9.2 Topic DoD (lesson runs)
- [ ] Every lesson of the topic meets 9.1.
- [ ] The topic README has the lessons section from 6.3 linking every lesson, and its header `Trạng thái` is updated.
- [ ] Any corrected README bullet has a verifier PASS and is listed in the report.
- [ ] `container/README.md` shows the new status for the topic.
- [ ] The checker exits `0` on `cloud_devops_basic/container` with `--online`.
- [ ] The teacher taught the topic and posted the final report.

### 9.3 Lab DoD (`LAB` runs, each lab)
- [ ] The folder follows the `lab-builder` layout and the README follows its template, including Objective, Time & Cost, Prerequisites, Architecture (Mermaid), Steps, Acceptance Criteria, Teardown, References.
- [ ] It implements every step and checkpoint of the lab definition in the topic README.
- [ ] `verify.sh` only reads state, prints one `[PASS]`/`[FAIL]` line per acceptance criterion, and exits non-zero on any failure. `cleanup.sh` deletes only what the lab created. Both start with `set -euo pipefail` or explain why not.
- [ ] Header says `Chưa chạy thử`. Expected outputs are labelled illustrative.
- [ ] Verifier PASS on the README and scripts. The checker exits `0`.

### 9.4 Run Metrics (reported every run)

| Metric | Target |
| :--- | :--- |
| Lesson progress (run and track-wide, out of 76) | 100% of the run at close |
| First-pass PASS rate | ≥ 70% |
| Average verify loops per lesson | ≤ 2 |
| Author send-backs at G1 | report only |
| First-pass FAIL + NOT_FOUND rate at G2 (write-first drafts) | ≤ 30% of claims; above that, review rule 04 point 12 |
| Section 5 claims resolved (run / track-wide out of 31) | all claims of the run |
| README bullets corrected | report only |
| Checker result | exit 0, 0 errors |
