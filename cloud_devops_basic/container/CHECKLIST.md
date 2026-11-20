# 📋 Checklist: Containers, Kubernetes, Helm & GitLab CI

> **Phạm vi**: Domain 6 - Containers and Kubernetes (Docker/Podman, Kubernetes, Helm, GitLab CI/CD, observability)
> **Lộ trình**: [README.md](./README.md)
> **Cách dùng**: Mỗi checkpoint là một câu **"tôi làm được / giải thích được"**. Chỉ tick khi bạn làm được **không cần xem tài liệu** (hoặc chỉ cần `--help` / `kubectl explain`). Nội dung chi tiết từng mục nằm trong README của topic tương ứng.
> **Cập nhật**: 15-11-2026

---

## 📊 Bảng Tiến Độ

| Topic | Kiến thức | Lab | Tổng | Đã xong | Tiến độ |
| :--- | :---: | :---: | :---: | :---: | :---: |
| [6_1 Container Fundamentals](#6_1-container-fundamentals) | 10 | 2 | 12 | `0 / 12` | `0%` |
| [6_2 Container Image Engineering](#6_2-container-image-engineering) | 11 | 2 | 13 | `0 / 13` | `0%` |
| [6_3 Kubernetes Architecture and Core Workloads](#6_3-kubernetes-architecture-and-core-workloads) | 8 | 4 | 12 | `0 / 12` | `0%` |
| [6_4 Kubernetes Networking Configuration and Storage](#6_4-kubernetes-networking-configuration-and-storage) | 7 | 4 | 11 | `0 / 11` | `0%` |
| [6_5 Helm Package Management](#6_5-helm-package-management) | 11 | 5 | 16 | `1 / 16` | `6%` |
| [6_6 GitLab CI-CD and Release Strategies](#6_6-gitlab-ci-cd-and-release-strategies) | 11 | 6 | 17 | `0 / 17` | `0%` |
| [6_7 Kubernetes Security Scheduling and Scaling](#6_7-kubernetes-security-scheduling-and-scaling) | 10 | 5 | 15 | `0 / 15` | `0%` |
| [6_8 Kubernetes Observability and Troubleshooting](#6_8-kubernetes-observability-and-troubleshooting) | 8 | 5 | 13 | `0 / 13` | `0%` |
| [6_9 Capstone - End-to-End Release Pipeline](#6_9-capstone---end-to-end-release-pipeline) | 7 | 5 | 12 | `0 / 12` | `0%` |
| **Tổng** | **83** | **38** | **121** | `1 / 121` | `1%` |

> Ghi chú: lab 6_2_1 và 6_2_2 đã được chạy thử khi soạn bài (Fedora 43, Podman 5.8.9). Bạn vẫn cần tự làm lại mới được tick.

---

## 🚦 Cổng Kiểm Tra Theo Giai Đoạn (Milestone Gates)

Không sang giai đoạn sau khi chưa qua cổng của giai đoạn trước.

- [ ] **Gate A: Container (sau 6_1, 6_2)**: Viết Dockerfile multi-stage non-root cho một app Java từ trang giấy trắng trong 15 phút; giải thích exit code 137 vs 143 và tag vs digest.
- [ ] **Gate B: Kubernetes cơ bản (sau 6_3, 6_4)**: Từ cluster trống, deploy service có probe, resources, ConfigMap, Service; nâng version không downtime và rollback; trong 30 phút, chỉ dùng `kubectl explain` để tra cứu.
- [ ] **Gate C: Helm (sau 6_5)**: Chuyển manifest của Gate B thành chart với values dev/prod; `upgrade --install` / `rollback`; giải thích thứ tự ưu tiên values và vì sao CI cần `--wait`.
- [ ] **Gate D: GitLab CI (sau 6_6)**: Viết `.gitlab-ci.yml` test → build image → helm verify → deploy dev/prod từ trí nhớ (cho phép tra tên keyword); giải thích `rules`, `needs`, `artifacts` vs `cache`, environment, cách job kết nối cluster.
- [ ] **Gate E: Vận hành (sau 6_7, 6_8)**: Hoàn thành lab break-and-fix 10/10 kịch bản, mỗi kịch bản ≤ 3 phút; tạo ServiceAccount deployer quyền tối thiểu.
- [ ] **Gate F: Sẵn sàng phỏng vấn (sau 6_9)**: Trình bày capstone trong 5 phút, demo một lần rollback, trả lời được bộ câu hỏi ở cuối file.

---

## 6_1 Container Fundamentals

README: [6_1 Container Fundamentals](<./6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/README.md>)

**Kiến thức**
- [ ] **6_1_1** Giải thích được container khác VM ở đâu (dùng chung kernel) và khi nào vẫn phải dùng VM.
- [ ] **6_1_2** Kể tên 8 loại namespace và dùng `lsns` / `nsenter` để vào namespace của một container.
- [ ] **6_1_3** Chỉ ra file cgroup v2 tương ứng với `--memory`, `--cpus`, `--pids-limit`; giải thích throttle CPU vs OOM kill.
- [ ] **6_1_4** Giải thích image layer, lớp ghi copy-on-write và vì sao xóa file ở lớp sau không làm image nhỏ đi.
- [ ] **6_1_5** Nêu 3 đặc tả OCI và vì sao image Docker chạy được trên containerd/CRI-O.
- [ ] **6_1_6** Vẽ chuỗi `docker` → `dockerd` → `containerd` → `runc` và chuỗi tương ứng của Podman và Kubernetes (CRI).
- [ ] **6_1_7** Giải thích rootless/user namespace, capabilities, seccomp, SELinux `:Z` và rủi ro của `--privileged`.
- [ ] **6_1_8** Giải thích vấn đề PID 1, exec form vs shell form, và đọc bảng exit code 0/1/126/127/137/143.
- [ ] **6_1_9** Mô tả đường đi của gói tin khi `-p 8080:8080` (veth, bridge/pasta, NAT) và DNS giữa container.
- [ ] **6_1_10** Chọn đúng volume / bind mount / tmpfs và xử lý lỗi quyền file khi chạy non-root.

**Lab**
- [ ] **lab-6_1_1** Tự tạo môi trường cô lập bằng `unshare` và đọc cgroup của container thật.
- [ ] **lab-6_1_2** Phân biệt JVM `OutOfMemoryError` với kernel OOM kill; tái hiện stop chậm do shell form.

## 6_2 Container Image Engineering

README: [6_2 Container Image Engineering](<./6 Domain 6 - Containers and Kubernetes/6_2 Container Image Engineering/README.md>)

**Kiến thức**
- [ ] **6_2_1** Dùng đúng `COPY`/`ADD`, `ARG`/`ENV`, `ENTRYPOINT`/`CMD`, `USER`; biết `HEALTHCHECK` không được Kubernetes dùng.
- [ ] **6_2_2** Viết `.dockerignore` và giải thích build context ảnh hưởng tốc độ build ra sao.
- [ ] **6_2_3** Sắp xếp lệnh Dockerfile để tận dụng cache; giải thích vì sao CI thường mất cache.
- [ ] **6_2_4** Viết multi-stage build Java (Maven → JRE) và dùng `--target`.
- [ ] **6_2_5** So sánh Debian/Alpine/distroless/UBI và lý do ghim phiên bản base image.
- [ ] **6_2_6** Giải thích vì sao secret trong một layer vẫn bị lộ; dùng build secret; chạy quét lỗ hổng image.
- [ ] **6_2_7** Giải thích tag vs digest và "build once, deploy many".
- [ ] **6_2_8** Push/pull với registry riêng, đọc API `/v2/...`, cấu hình `imagePullSecrets`.
- [ ] **6_2_9** Giải thích manifest list và build đa kiến trúc ở mức khái niệm.
- [ ] **6_2_10** Viết `compose.yaml` cho app + phụ thuộc và biết khi nào cần chuyển sang Kubernetes.
- [ ] **6_2_11** So sánh DinD với build không cần daemon về bảo mật.

**Lab**
- [ ] **lab-6_2_1** Tối ưu image Java: nhỏ hơn, non-root, `SIGTERM` gọn, cache dependency (`verify.sh` toàn PASS).
- [ ] **lab-6_2_2** Chứng minh tag bị ghi đè còn digest bất biến; tái hiện bẫy cache của `ARG`.

## 6_3 Kubernetes Architecture and Core Workloads

README: [6_3 Kubernetes Architecture and Core Workloads](<./6 Domain 6 - Containers and Kubernetes/6_3 Kubernetes Architecture and Core Workloads/README.md>)

**Kiến thức**
- [ ] **6_3_1** Vẽ kiến trúc control plane + node và giải thích vòng reconcile khi một Pod bị xóa.
- [ ] **6_3_2** Dùng thành thạo `kubectl` (contexts, `apply`, `diff`, `explain`, `-o jsonpath`, label selector).
- [ ] **6_3_3** Giải thích Pod nhiều container, init/sidecar container, phase vs trạng thái container, nguồn gốc `CrashLoopBackOff`.
- [ ] **6_3_4** Điều khiển rollout (`maxSurge`, `maxUnavailable`, `status`, `history`, `undo`) và giải thích vì sao tránh `:latest`.
- [ ] **6_3_5** Cấu hình readiness/liveness/startup probe đúng và kể hậu quả khi cấu hình sai.
- [ ] **6_3_6** Đặt requests/limits cho app Java, đọc QoS class, giải thích OOMKilled vs throttling.
- [ ] **6_3_7** Giải thích trình tự tắt Pod và cách tránh rơi request khi rolling update.
- [ ] **6_3_8** Chọn đúng Deployment / DaemonSet / Job / CronJob / StatefulSet cho từng loại workload.

**Lab**
- [ ] **lab-6_3_1** Dựng kind, deploy `hello-svc`, chứng minh tự hồi phục.
- [ ] **lab-6_3_2** Rolling update không lỗi request, xử lý tag sai, rollback theo revision.
- [ ] **lab-6_3_3** Chẩn đoán restart do liveness, OOMKilled, CPU throttle; tạo 3 QoS class.
- [ ] **lab-6_3_4** Chạy Job/CronJob và đọc trạng thái hoàn thành/thất bại.

## 6_4 Kubernetes Networking Configuration and Storage

README: [6_4 Kubernetes Networking, Configuration and Storage](<./6 Domain 6 - Containers and Kubernetes/6_4 Kubernetes Networking Configuration and Storage/README.md>)

**Kiến thức**
- [ ] **6_4_1** Phát biểu mô hình mạng Kubernetes và vai trò của CNI.
- [ ] **6_4_2** So sánh các loại Service, giải thích EndpointSlice và quan hệ với readiness.
- [ ] **6_4_3** Viết đúng tên DNS đầy đủ của Service và Pod StatefulSet; giải thích `ndots:5`.
- [ ] **6_4_4** So sánh Ingress với Gateway API, biết Ingress NGINX đã nghỉ hưu, cấu hình chia traffic theo trọng số.
- [ ] **6_4_5** Đưa config/secret vào Pod theo 2 cách, biết cách nào tự cập nhật, giải thích Secret chỉ là base64.
- [ ] **6_4_6** Giải thích PV/PVC/StorageClass, access mode, reclaim policy.
- [ ] **6_4_7** Giải thích vì sao Kafka/ZooKeeper/Cassandra cần StatefulSet (hoặc Operator).

**Lab**
- [ ] **lab-6_4_1** Chẩn đoán Service không có endpoint; đọc DNS trong Pod.
- [ ] **lab-6_4_2** Cập nhật ConfigMap và làm app nhận giá trị mới; tái hiện `CreateContainerConfigError`.
- [ ] **lab-6_4_3** Chia traffic 90/10 giữa hai version bằng `HTTPRoute`.
- [ ] **lab-6_4_4** Chứng minh StatefulSet giữ tên và dữ liệu khi Pod bị xóa hoặc scale.

## 6_5 Helm Package Management

README: [6_5 Helm Package Management](<./6 Domain 6 - Containers and Kubernetes/6_5 Helm Package Management/README.md>)

**Kiến thức**
- [ ] **6_5_1** Giải thích chart / release / revision / repository và khác biệt chính Helm 3 vs Helm 4.
- [ ] **6_5_2** Giải thích từng file trong chart; phân biệt `version` và `appVersion`.
- [ ] **6_5_3** Viết template dùng `include`, `toYaml | nindent`, `required`, `default`, `range`, xử lý khoảng trắng.
- [ ] **6_5_4** Nói đúng thứ tự ưu tiên values và cách tổ chức values theo môi trường.
- [ ] **6_5_5** Dùng `upgrade --install`, `--wait`, `--rollback-on-failure` (Helm 3: `--atomic`), `rollback`, `history`; gỡ release kẹt `pending-*`.
- [ ] **6_5_6** Kiểm tra chart trước khi deploy bằng `lint`, `template`, `--dry-run=server`, schema.
- [x] **6_5_7** Dùng dependency, subchart, library chart cho nhiều microservice.
- [ ] **6_5_8** Viết hook `pre-upgrade` và `helm test`, hiểu `hook-delete-policy`.
- [ ] **6_5_9** Package và push chart lên registry OCI, cài từ `oci://`.
- [ ] **6_5_10** Áp dụng checksum annotation, image theo digest, nhãn chuẩn, không để secret trong values.
- [ ] **6_5_11** Giải thích vai trò của Helm trong GitOps (Argo CD / Flux).

**Lab**
- [ ] **lab-6_5_1** Chuyển manifest thành chart có `required` cho image tag.
- [ ] **lab-6_5_2** Values dev/prod, schema, so sánh output render.
- [ ] **lab-6_5_3** Upgrade hỏng tự rollback; gỡ release kẹt; quan sát drift.
- [ ] **lab-6_5_4** Push chart lên registry OCI và cài lại từ đó.
- [ ] **lab-6_5_5** Hook migrate `pre-upgrade` và `helm test` (nâng cao).

## 6_6 GitLab CI-CD and Release Strategies

README: [6_6 GitLab CI-CD and Release Strategies](<./6 Domain 6 - Containers and Kubernetes/6_6 GitLab CI-CD and Release Strategies/README.md>)

**Kiến thức**
- [ ] **6_6_1** Giải thích pipeline/stage/job/runner, các loại pipeline, và cách tránh pipeline trùng.
- [ ] **6_6_2** Dùng đúng `rules`, `needs`, `artifacts` vs `cache`, `extends`, `include`, `resource_group`, parent-child pipeline.
- [ ] **6_6_3** Dùng biến định sẵn, biến protected/masked/File, phạm vi environment; biết cách tránh lộ secret.
- [ ] **6_6_4** Cài và đăng ký runner theo luồng mới, chọn executor phù hợp, dùng `tags`.
- [ ] **6_6_5** Build và push image trong CI, so sánh DinD vs Buildah, truyền digest sang job sau.
- [ ] **6_6_6** Thêm JUnit report, quét bảo mật, `helm lint/template` làm cổng chất lượng.
- [ ] **6_6_7** Kết nối pipeline với cluster qua GitLab agent (`ci_access`, context) và dùng environment, protected environment, manual job.
- [ ] **6_6_8** So sánh rolling / blue-green / canary / feature flag và thiết kế rollback.
- [ ] **6_6_9** Phân biệt image tag/digest, chart `version`, `appVersion`; release theo git tag.
- [ ] **6_6_10** Giải thích push-based vs pull-based (GitOps) deployment.
- [ ] **6_6_11** Gỡ lỗi job `pending`, pipeline không được tạo, biến protected không có; tối ưu thời gian pipeline.

**Lab**
- [ ] **lab-6_6_1** Runner riêng + pipeline test Maven có JUnit report và cache.
- [ ] **lab-6_6_2** Build/push image với tag SHA + SemVer, truyền digest qua dotenv.
- [ ] **lab-6_6_3** `workflow:rules`, `rules:changes`, `needs`, `include: local`.
- [ ] **lab-6_6_4** Deploy qua agent: dev tự động, prod thủ công trên tag, deploy hỏng tự rollback.
- [ ] **lab-6_6_5** Pipeline canary 10% với promote/abort (nâng cao).
- [ ] **lab-6_6_6** Thiết kế trên giấy pipeline cho 10 microservice và trình bày trong 5 phút.

## 6_7 Kubernetes Security Scheduling and Scaling

README: [6_7 Kubernetes Security, Scheduling and Scaling](<./6 Domain 6 - Containers and Kubernetes/6_7 Kubernetes Security Scheduling and Scaling/README.md>)

**Kiến thức**
- [ ] **6_7_1** Viết Role/RoleBinding quyền tối thiểu và kiểm tra bằng `kubectl auth can-i`.
- [ ] **6_7_2** Viết `securityContext` đạt mức `restricted` và áp Pod Security Admission cho namespace.
- [ ] **6_7_3** Viết NetworkPolicy default-deny + allow, nhớ mở DNS; biết điều kiện CNI.
- [ ] **6_7_4** Giải thích encryption at rest, rủi ro quyền `list` Secret, ký image.
- [ ] **6_7_5** Giải thích luồng admission và ValidatingAdmissionPolicy / policy engine.
- [ ] **6_7_6** Dùng affinity, anti-affinity, topology spread, taint/toleration; đọc lý do `Pending`.
- [ ] **6_7_7** Dùng PDB và drain an toàn; biết PDB quá chặt làm treo drain.
- [ ] **6_7_8** Cấu hình HPA, giải thích vì sao HPA cần requests và metrics-server.
- [ ] **6_7_9** Giải thích CRD và Operator pattern với ví dụ Strimzi / Prometheus Operator.
- [ ] **6_7_10** Mô tả quy trình nâng cấp cluster và kiểm tra API bị deprecate.

**Lab**
- [ ] **lab-6_7_1** ServiceAccount deployer: deploy được ở `dev`, bị chặn ở `prod`.
- [ ] **lab-6_7_2** Chạy `hello-svc` trong namespace `restricted`.
- [ ] **lab-6_7_3** Default-deny và mở đúng luồng cần thiết.
- [ ] **lab-6_7_4** HPA scale lên/xuống theo tải.
- [ ] **lab-6_7_5** Anti-affinity, taint, PDB, drain không làm giảm số Pod dưới ngưỡng.

## 6_8 Kubernetes Observability and Troubleshooting

README: [6_8 Kubernetes Observability and Troubleshooting](<./6 Domain 6 - Containers and Kubernetes/6_8 Kubernetes Observability and Troubleshooting/README.md>)

**Kiến thức**
- [ ] **6_8_1** Áp dụng quy trình chẩn đoán từ trên xuống; dùng `describe`, events, `logs --previous`, `kubectl debug`.
- [ ] **6_8_2** Với mỗi trạng thái lỗi trong danh mục, nói được 2 nguyên nhân phổ biến và lệnh xác nhận.
- [ ] **6_8_3** Giải thích log trên node, xoay vòng log, kiến trúc log tập trung, log có cấu trúc.
- [ ] **6_8_4** Phân biệt metrics-server với Prometheus; viết PromQL với `rate`, `sum by`, `histogram_quantile`; giải thích RED/USE.
- [ ] **6_8_5** Thiết kế dashboard và alert theo triệu chứng; giải thích SLI/SLO/error budget.
- [ ] **6_8_6** Giải thích trace/span và lan truyền context qua HTTP và Kafka.
- [ ] **6_8_7** Mô tả cách dùng metric để quyết định promote hoặc rollback sau deploy.
- [ ] **6_8_8** Debug ở mức node bằng `kubectl debug node`, `crictl`, `journalctl -u kubelet`.

**Lab**
- [ ] **lab-6_8_1** Break-and-fix 10/10 kịch bản, mỗi kịch bản ≤ 3 phút.
- [ ] **lab-6_8_2** Tìm quy luật lỗi từ log JSON nhiều Pod bằng `jq`.
- [ ] **lab-6_8_3** kube-prometheus-stack, PromQL, dashboard 4 panel.
- [ ] **lab-6_8_4** Alert restart chuyển `firing` trong Alertmanager.
- [ ] **lab-6_8_5** Debug Pod distroless và đọc cgroup của Pod trên node.

## 6_9 Capstone - End-to-End Release Pipeline

README: [6_9 Capstone - End-to-End Release Pipeline](<./6 Domain 6 - Containers and Kubernetes/6_9 Capstone - End-to-End Release Pipeline/README.md>)

**Tiêu chí hoàn thành**
- [ ] Commit vào nhánh mặc định tự tới staging; git tag + một cú bấm đưa đúng digest đó lên prod.
- [ ] Image ở prod tham chiếu bằng `@sha256:` khớp digest trong log job build.
- [ ] Deploy hỏng không làm prod mất phục vụ (chứng minh bằng vòng lặp `curl`).
- [ ] Rollback prod < 5 phút theo runbook.
- [ ] ServiceAccount của pipeline không có quyền ngoài namespace của nó.
- [ ] Dashboard/alert phát hiện ít nhất 2/4 sự cố diễn tập.
- [ ] Trình bày kiến trúc trong 5 phút và giải thích "vì sao" cho mọi lựa chọn.

**Giai đoạn**
- [ ] **capstone-1-foundation** Repo, chart, cluster 3 namespace, agent, RBAC.
- [ ] **capstone-2-pipeline** Pipeline đầy đủ từ MR tới prod.
- [ ] **capstone-3-observability** Dashboard và alert.
- [ ] **capstone-4-game-day** Diễn tập 4 sự cố và viết postmortem.
- [ ] **capstone-5-story** Câu chuyện STAR và cập nhật CV trung thực.

---

## 🎤 Tự Kiểm Tra Trước Phỏng Vấn

Trả lời thành tiếng bằng tiếng Anh, mỗi câu ≤ 2 phút, không xem ghi chú. (Không tính vào bảng tiến độ.)

- [ ] What happens, step by step, after `kubectl apply -f deployment.yaml`?
- [ ] A pod is in `CrashLoopBackOff`. Walk me through how you debug it.
- [ ] Readiness vs liveness vs startup probe: what goes wrong if you mix them up?
- [ ] Why did my container exit with code 137? How do you tell OOM from a failed liveness probe?
- [ ] How do requests and limits work, and how should you size them for a JVM?
- [ ] How does a rolling update avoid downtime, and what can still drop requests?
- [ ] How does a Service find its pods? What do you check when a Service returns nothing?
- [ ] Why is a Kubernetes Secret not really secret? What do you use instead?
- [ ] Explain Helm chart, release and revision. How does `helm rollback` work?
- [ ] How do you manage different values for dev and prod in Helm?
- [ ] Walk me through a GitLab CI pipeline you would build for a Java microservice.
- [ ] `rules` vs `only/except`, `needs` vs stages, `artifacts` vs `cache`?
- [ ] How does a GitLab job get access to a Kubernetes cluster securely?
- [ ] Why deploy by image digest instead of tag?
- [ ] Canary vs blue/green vs rolling: when would you choose each?
- [ ] A deployment to prod just broke. What do you do in the first 5 minutes?
- [ ] Why does Kafka (or Cassandra) run as a StatefulSet?
- [ ] What would you monitor for a microservice, and what would you alert on?
