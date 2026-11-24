# 01. Kubernetes: Architecture & Workloads

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt. Bấm "Đáp án" để mở.

---

### 1. Explain the Kubernetes architecture. What runs on the control plane and what runs on a worker node?
<details><summary>Đáp án</summary>

- **Control plane**
  - `kube-apiserver`: cửa ngõ duy nhất. Mọi thành phần khác đều đọc/ghi trạng thái qua API server.
  - `etcd`: kho key-value lưu toàn bộ trạng thái cluster.
  - `kube-scheduler`: chọn node cho Pod chưa được gán node.
  - `kube-controller-manager`: chạy các controller (Deployment, ReplicaSet, Node, Job...), liên tục đưa trạng thái thực tế về trạng thái mong muốn.
  - `cloud-controller-manager` (nếu chạy trên cloud): tạo load balancer, route...
- **Worker node**
  - `kubelet`: nhận PodSpec, gọi container runtime qua CRI để chạy container, chạy probe, báo trạng thái về API server.
  - `kube-proxy`: lập trình iptables/IPVS/nftables cho Service (một số CNI như Cilium có thể thay thế kube-proxy).
  - Container runtime: containerd hoặc CRI-O.
</details>

### 2. Walk me through what happens when you run `kubectl apply -f deployment.yaml`.
<details><summary>Đáp án</summary>

1. `kubectl` gửi request tới API server, xác thực bằng thông tin trong kubeconfig.
2. API server lần lượt chạy **Authentication**, **Authorization** (RBAC) rồi **Admission control** (mutating, sau đó validating).
3. Object Deployment được lưu vào **etcd**.
4. **Deployment controller** thấy Deployment mới và tạo **ReplicaSet**. **ReplicaSet controller** tạo các **Pod** (lúc này chưa có `nodeName`).
5. **Scheduler** chọn node theo hai bước filter và score, rồi ghi `nodeName` vào Pod (binding).
6. **kubelet** trên node đó thấy Pod được gán cho mình, gọi runtime để pull image, tạo sandbox mạng qua CNI, chạy container, rồi chạy probe.
7. Khi Pod Ready, EndpointSlice được cập nhật và **kube-proxy** đưa Pod vào backend của Service.
</details>

### 3. What is etcd and why is it critical? What happens if etcd loses quorum?
<details><summary>Đáp án</summary>

- etcd là key-value store phân tán, dùng thuật toán đồng thuận **Raft**. Đây là nguồn sự thật duy nhất của cluster.
- Quorum = (n/2)+1. Với 3 member chịu được 1 member lỗi, với 5 member chịu được 2. Vì vậy số member nên là số lẻ.
- Mất quorum thì etcd **không ghi được nữa**: API server không tạo, sửa hay xóa được object. **Các Pod đang chạy vẫn tiếp tục chạy** vì kubelet vẫn giữ chúng, nhưng không thể scale, deploy hay tự khôi phục.
- Vì vậy phải **backup etcd** định kỳ bằng `etcdctl snapshot save`.
</details>

### 4. Explain declarative vs imperative management and the reconciliation loop.
<details><summary>Đáp án</summary>

- **Imperative**: ra lệnh từng bước, ví dụ `kubectl run`, `kubectl scale`.
- **Declarative**: mô tả trạng thái mong muốn trong YAML (`spec`) rồi `kubectl apply`. Kubernetes tự tìm cách đạt được trạng thái đó.
- **Reconciliation loop (controller pattern)**: mỗi controller theo dõi (watch) object, so sánh `spec` (mong muốn) với `status` (thực tế), rồi hành động để hai bên khớp nhau. Ví dụ: Pod chết, ReplicaSet controller thấy thiếu replica và tạo Pod mới.
- Lợi ích: tự phục hồi (self-healing), lưu cấu hình trong Git được (nền tảng của GitOps).
</details>

### 5. What is a Pod? What do containers in the same Pod share?
<details><summary>Đáp án</summary>

- Pod là **đơn vị nhỏ nhất** mà Kubernetes schedule, gồm một hoặc nhiều container luôn được đặt chung một node.
- Các container trong một Pod **dùng chung**:
  - Network namespace: cùng IP, gọi nhau qua `localhost`, không được trùng port.
  - IPC namespace.
  - Volume được khai báo trong Pod.
- Mỗi container vẫn có filesystem gốc (image) và giới hạn tài nguyên riêng.
- Dùng nhiều container khi các process gắn chặt với nhau, ví dụ sidecar thu log hoặc proxy.
</details>

### 6. Why don't we create Pods directly in production?
<details><summary>Đáp án</summary>

Pod tạo trực tiếp (bare Pod) **không được ai tạo lại** khi node chết hoặc Pod bị xóa hay evict. Pod cũng không có rolling update, không scale được và không rollback được. Trong production nên dùng controller: Deployment, StatefulSet, DaemonSet, Job.
</details>

### 7. Explain the relationship between Deployment, ReplicaSet and Pod.
<details><summary>Đáp án</summary>

- **ReplicaSet** giữ đúng số Pod khớp với selector.
- **Deployment** quản lý các ReplicaSet. Mỗi lần **Pod template** thay đổi (image, env...), Deployment tạo ReplicaSet mới, scale nó lên và scale ReplicaSet cũ xuống. Đó chính là rolling update.
- ReplicaSet cũ vẫn được giữ lại (số lượng theo `revisionHistoryLimit`, mặc định 10) để rollback.
- Chỉ đổi `replicas` thì **không** tạo revision mới.
</details>

### 8. Explain a rolling update. What do `maxSurge` and `maxUnavailable` control?
<details><summary>Đáp án</summary>

- Rolling update thay Pod cũ bằng Pod mới theo từng đợt để không có downtime.
- `maxSurge`: số Pod **vượt quá** `replicas` được phép tạo thêm trong lúc update. Mặc định 25%.
- `maxUnavailable`: số Pod **được phép không sẵn sàng** trong lúc update. Mặc định 25%.
- Ví dụ `replicas: 4`, `maxSurge: 1`, `maxUnavailable: 0`: tạo 1 Pod mới, đợi nó **Ready**, xóa 1 Pod cũ, lặp lại. An toàn nhất nhưng tốn thêm tài nguyên.
- Rolling update chỉ an toàn khi **readiness probe đúng**. Nếu không, Pod chưa sẵn sàng vẫn bị coi là Ready.
</details>

### 9. How do you roll back a Deployment? How does Kubernetes know what to roll back to?
<details><summary>Đáp án</summary>

```bash
kubectl rollout history deployment/api
kubectl rollout undo deployment/api                  # về revision trước
kubectl rollout undo deployment/api --to-revision=3
kubectl rollout status deployment/api
```
Kubernetes rollback bằng cách lấy Pod template của **ReplicaSet cũ** (được giữ theo `revisionHistoryLimit`). Nếu app được deploy bằng Helm thì nên rollback bằng `helm rollback` để lịch sử Helm khớp với cluster.
</details>

### 10. RollingUpdate vs Recreate strategy: when would you use Recreate?
<details><summary>Đáp án</summary>

- **RollingUpdate** (mặc định): bản cũ và bản mới chạy song song trong một khoảng thời gian, không downtime.
- **Recreate**: xóa hết Pod cũ rồi mới tạo Pod mới, có downtime.
- Dùng Recreate khi **hai phiên bản không được chạy cùng lúc**: thay đổi schema không tương thích, app giữ lock độc quyền, hoặc volume `ReadWriteOnce` chỉ gắn được vào một node.
</details>

### 11. Deployment vs StatefulSet. Which one would you use for Kafka, Cassandra or ZooKeeper, and why?
<details><summary>Đáp án</summary>

| | Deployment | StatefulSet |
|---|---|---|
| Tên Pod | Ngẫu nhiên (`api-7d9f-xk2`) | Cố định, có thứ tự (`kafka-0`, `kafka-1`) |
| DNS | Không có DNS riêng cho từng Pod | Mỗi Pod có DNS ổn định qua headless Service |
| Storage | Thường dùng chung hoặc không có | `volumeClaimTemplates`: mỗi Pod có PVC riêng, giữ nguyên khi Pod được tạo lại |
| Thứ tự | Song song | Mặc định tạo, xóa, update theo thứ tự |

Kafka, Cassandra, ZooKeeper, Elasticsearch cần **danh tính ổn định** (broker id, địa chỉ để các node tìm nhau) và **dữ liệu riêng cho từng node**, nên dùng StatefulSet, thường qua một Operator.
</details>

### 12. Why does a StatefulSet need a headless Service?
<details><summary>Đáp án</summary>

Headless Service (`clusterIP: None`) không có IP ảo. DNS trả về trực tiếp IP của từng Pod, và mỗi Pod có bản ghi riêng: `kafka-0.kafka-headless.<ns>.svc.cluster.local`. Nhờ vậy client và các node trong cluster phân tán gọi được **đúng một Pod cụ thể**. Đây là điều bắt buộc với Kafka (client phải nói chuyện với broker leader của partition) hoặc ZooKeeper (danh sách server cố định).
</details>

### 13. What is a DaemonSet? Give real use cases.
<details><summary>Đáp án</summary>

DaemonSet đảm bảo **mỗi node (hoặc mỗi node khớp selector) chạy đúng một Pod**. Use case: agent thu log (Fluent Bit), node exporter của Prometheus, CNI agent (Calico, Cilium), kube-proxy, CSI node plugin. Node mới vào cluster sẽ tự có Pod này.
</details>

### 14. Job vs CronJob. What are `backoffLimit`, `restartPolicy` and `concurrencyPolicy`?
<details><summary>Đáp án</summary>

- **Job**: chạy tới khi hoàn thành (ví dụ migration DB, batch). `restartPolicy` chỉ được là `OnFailure` hoặc `Never`. `backoffLimit` (mặc định 6) là số lần retry trước khi Job bị đánh dấu Failed.
- **CronJob**: tạo Job theo lịch cron. `concurrencyPolicy`:
  - `Allow` (mặc định): cho chạy chồng lên nhau.
  - `Forbid`: bỏ qua lần mới nếu lần trước chưa xong.
  - `Replace`: hủy lần cũ, chạy lần mới.
</details>

### 15. Explain the Pod lifecycle phases. Is `CrashLoopBackOff` a phase?
<details><summary>Đáp án</summary>

- Phase gồm: `Pending` (đã được chấp nhận nhưng container chưa chạy, có thể đang chờ schedule hoặc pull image), `Running`, `Succeeded`, `Failed`, `Unknown` (mất liên lạc với node).
- **`CrashLoopBackOff` không phải phase.** Đó là *reason* của container ở trạng thái `Waiting`: container chết liên tục và kubelet đang chờ backoff trước khi khởi động lại. Tương tự, `ImagePullBackOff` và `CreateContainerConfigError` cũng là reason.
</details>

### 16. How does the container restart backoff work?
<details><summary>Đáp án</summary>

Với `restartPolicy: Always` hoặc `OnFailure`, kubelet khởi động lại container với độ trễ tăng dần theo cấp số nhân: 10s, 20s, 40s… **tối đa 5 phút**. Bộ đếm được reset nếu container chạy ổn định khoảng 10 phút. Vì vậy Pod lỗi lâu sẽ thấy restart "thưa" dần.
</details>

### 17. Explain liveness, readiness and startup probes. What happens when each fails?
<details><summary>Đáp án</summary>

| Probe | Câu hỏi nó trả lời | Khi fail |
|---|---|---|
| **Liveness** | Container còn "sống" không, có bị treo hay deadlock không? | kubelet **kill và restart** container |
| **Readiness** | Container sẵn sàng nhận traffic chưa? | Pod bị **gỡ khỏi endpoints của Service**, **không bị restart** |
| **Startup** | App đã khởi động xong chưa? | Khi startup probe đang chạy, **liveness và readiness bị tạm tắt**. Hết `failureThreshold` thì container bị kill |

Startup probe rất hữu ích cho app khởi động chậm như Java/Spring: nó tránh việc liveness probe kill app khi app chưa kịp khởi động.
</details>

### 18. What probe mechanisms and parameters exist? What are the defaults?
<details><summary>Đáp án</summary>

- Cơ chế: `httpGet` (mã 200–399 là thành công), `tcpSocket`, `exec` (exit code 0 là thành công), `grpc`.
- Tham số và mặc định: `initialDelaySeconds: 0`, `periodSeconds: 10`, `timeoutSeconds: 1`, `failureThreshold: 3`, `successThreshold: 1` (với liveness và startup bắt buộc là 1).
- Thời gian tối đa cho app khởi động khi dùng startup probe ≈ `failureThreshold × periodSeconds`.
</details>

### 19. Why is it dangerous for a liveness probe to check downstream dependencies like the database or Kafka?
<details><summary>Đáp án</summary>

Nếu DB chậm hoặc chết, liveness probe của **mọi** Pod đều fail và kubelet restart toàn bộ. Restart không sửa được DB nhưng tạo thêm tải khởi động và làm sự cố lan rộng (cascading failure). Nguyên tắc:
- Liveness chỉ kiểm tra chính process (ví dụ JVM còn phản hồi).
- Readiness có thể phản ánh việc app chưa phục vụ được, nhưng cũng nên cẩn thận vì nếu mọi Pod đều unready thì Service không còn backend nào.
</details>

### 20. Init containers vs sidecar containers. What is a native sidecar?
<details><summary>Đáp án</summary>

- **Init container**: chạy **tuần tự, tới khi xong**, trước các container chính. Ví dụ: chờ dependency sẵn sàng, chạy migration, tải config. Một init container fail thì Pod không khởi động.
- **Sidecar**: chạy **song song** suốt vòng đời Pod. Ví dụ: proxy của service mesh, agent đẩy log.
- **Native sidecar**: khai báo trong `initContainers` với `restartPolicy: Always`. Container này khởi động trước container chính, chạy suốt vòng đời Pod và tắt sau container chính. Cách này giải quyết vấn đề Job không bao giờ kết thúc vì sidecar còn chạy. Tính năng beta từ 1.29 và GA ở 1.33.
</details>

### 21. Describe what happens when a Pod is deleted (graceful termination). Why do we often add a `preStop` sleep?
<details><summary>Đáp án</summary>

1. Pod chuyển sang `Terminating`. **Đồng thời**:
   - Pod bị gỡ khỏi EndpointSlice, và kube-proxy hoặc ingress cập nhật sau một khoảng trễ nhỏ.
   - kubelet chạy `preStop` hook (nếu có), rồi gửi **SIGTERM** tới PID 1 của mỗi container.
2. kubelet chờ tối đa `terminationGracePeriodSeconds` (mặc định **30s**), sau đó gửi **SIGKILL**.

Vì việc gỡ endpoint và việc gửi SIGTERM xảy ra **song song**, app có thể đã tắt trong khi load balancer vẫn còn gửi request tới, gây lỗi 502/503 khi deploy. Một lệnh `sleep` ngắn trong `preStop` cho hạ tầng mạng kịp cập nhật. App cũng phải **xử lý SIGTERM** (Spring Boot: graceful shutdown).
</details>

### 22. Labels vs annotations vs selectors.
<details><summary>Đáp án</summary>

- **Label**: cặp key/value dùng để **chọn và nhóm** object. Service, Deployment, NetworkPolicy chọn Pod bằng label.
- **Selector**: biểu thức lọc theo label (`app=api`, `env in (prod,staging)`).
- **Annotation**: metadata **không dùng để chọn**, thường do tool đọc. Ví dụ: `prometheus.io/scrape`, cấu hình ingress, `checksum/config`, ghi chú build id.
- Lưu ý: `spec.selector` của Deployment **không sửa được** sau khi tạo (immutable).
</details>

### 23. What do namespaces isolate and what don't they isolate?
<details><summary>Đáp án</summary>

- Namespace cô lập **tên** object, **RBAC** (Role và RoleBinding theo namespace), **ResourceQuota** và **LimitRange**.
- Namespace **không** cô lập:
  - **Mạng**: mặc định Pod ở namespace khác vẫn gọi được nhau, muốn chặn phải dùng NetworkPolicy.
  - **Node**: Pod ở các namespace khác nhau vẫn chạy chung node.
  - Tài nguyên cấp cluster: Node, PersistentVolume, StorageClass, ClusterRole, CRD, Namespace.
</details>

### 24. ConfigMap vs Secret. How can a Pod consume them?
<details><summary>Đáp án</summary>

- ConfigMap dùng cho cấu hình không nhạy cảm, Secret dùng cho mật khẩu, token, cert. Cả hai giới hạn khoảng 1 MiB.
- Cách dùng:
  - Biến môi trường (`env.valueFrom`, `envFrom`).
  - File mount qua volume.
  - Tham số dòng lệnh (qua biến môi trường).
- Secret có cơ chế riêng: kiểu `kubernetes.io/dockerconfigjson` cho `imagePullSecrets`, kiểu `kubernetes.io/tls` cho Ingress.
</details>

### 25. If you update a ConfigMap, will running Pods see the change?
<details><summary>Đáp án</summary>

- Dùng qua **biến môi trường**: **không**. Phải restart Pod.
- Mount qua **volume**: **có, nhưng có độ trễ** (theo chu kỳ đồng bộ của kubelet và cache). App phải tự đọc lại file.
- Mount bằng **`subPath`**: **không** được cập nhật.
- Cách làm phổ biến: `kubectl rollout restart deployment/x`, hoặc trong Helm thêm annotation `checksum/config` vào Pod template để mỗi lần config đổi thì Pod tự rolling.
</details>

### 26. Are Kubernetes Secrets secure by default?
<details><summary>Đáp án</summary>

Chưa đủ an toàn:
- Dữ liệu chỉ được **base64** (mã hóa ký tự, không phải mã hóa bảo mật).
- Mặc định lưu **không mã hóa trong etcd**, trừ khi bật encryption at rest (`EncryptionConfiguration`, KMS provider).

Biện pháp:
- RBAC giới hạn ai được `get/list secrets` (quyền `list` cũng đọc được nội dung).
- Không commit Secret vào Git. Dùng Sealed Secrets, SOPS, External Secrets Operator hoặc Vault.
- Không in Secret ra log của CI.
</details>

### 27. Requests vs limits. Which one does the scheduler use?
<details><summary>Đáp án</summary>

- **Request**: lượng tài nguyên được **đảm bảo**. **Scheduler chỉ dùng request** để chọn node: tổng request trên node phải nhỏ hơn hoặc bằng allocatable.
- **Limit**: mức **tối đa** container được dùng, do kernel cưỡng chế qua cgroups.
- Đơn vị: CPU tính bằng core (`500m` = 0.5 core), memory tính bằng byte (`512Mi`).
- Request đặt quá cao thì lãng phí và Pod dễ Pending. Đặt quá thấp thì node bị overcommit, dễ bị evict.
</details>

### 28. What happens when a container exceeds its CPU limit vs its memory limit?
<details><summary>Đáp án</summary>

- **CPU** là tài nguyên nén được: vượt limit thì bị **throttle** (CFS quota, `cpu.max` trong cgroup v2). App **chậm lại nhưng không chết**. Dấu hiệu: latency tăng, metric `container_cpu_cfs_throttled_periods_total` tăng.
- **Memory** không nén được: vượt limit thì kernel **OOM kill** process. Container bị restart, `Last State: Terminated, Reason: OOMKilled, Exit Code: 137`.
</details>

### 29. Explain the Pod QoS classes and how they affect eviction.
<details><summary>Đáp án</summary>

- **Guaranteed**: **mọi** container có request = limit cho cả CPU và memory.
- **Burstable**: có ít nhất một request hoặc limit nhưng không đủ điều kiện Guaranteed.
- **BestEffort**: không container nào đặt request hay limit.

Khi node thiếu tài nguyên (node-pressure eviction), kubelet ưu tiên evict Pod dùng **vượt request** nhiều nhất và có priority thấp. Thực tế BestEffort bị evict trước, Guaranteed bị evict sau cùng. Workload quan trọng như database và Kafka nên chạy ở mức Guaranteed.
</details>

### 30. What are LimitRange and ResourceQuota?
<details><summary>Đáp án</summary>

- **LimitRange** (theo namespace): đặt request/limit **mặc định**, min và max cho **từng** container hoặc Pod.
- **ResourceQuota** (theo namespace): giới hạn **tổng** tài nguyên của namespace (tổng CPU/memory request, số Pod, số PVC, số Service LoadBalancer...).
- Khi có quota CPU/memory, Pod **bắt buộc** khai báo request/limit, nếu không sẽ bị từ chối. Vì vậy thường dùng kèm LimitRange để có giá trị mặc định.
</details>

### 31. What is a static Pod?
<details><summary>Đáp án</summary>

Static Pod do **kubelet trực tiếp quản lý** từ file manifest trên node (thường ở `/etc/kubernetes/manifests`), không qua API server. API server chỉ hiển thị bản "mirror" chỉ đọc. Cluster tạo bằng kubeadm chạy chính control plane (apiserver, etcd, scheduler, controller-manager) dưới dạng static Pod.
</details>

### 32. What is the CRI? Kubernetes removed dockershim. Can images built with Docker still run?
<details><summary>Đáp án</summary>

- **CRI** (Container Runtime Interface) là API gRPC mà kubelet dùng để nói chuyện với runtime: containerd, CRI-O.
- dockershim bị gỡ ở **Kubernetes 1.24**, nên kubelet không gọi Docker Engine trực tiếp nữa.
- **Image build bằng Docker vẫn chạy bình thường** vì image theo chuẩn **OCI**. Thứ bị ảnh hưởng chỉ là những gì phụ thuộc vào Docker socket trên node, ví dụ CI mount `/var/run/docker.sock`.
</details>

### 33. Explain `imagePullPolicy` and its defaults.
<details><summary>Đáp án</summary>

- `Always`: lần nào khởi động cũng hỏi registry digest mới nhất.
- `IfNotPresent`: dùng image có sẵn trên node.
- `Never`.
- Mặc định: tag `:latest` hoặc không ghi tag thì là `Always`, còn lại là `IfNotPresent`.
- Bài học: **không dùng tag mutable** như `latest` hay tag ghi đè. Hãy dùng tag theo commit SHA hoặc digest, nếu không các node có thể chạy những phiên bản khác nhau.
</details>

### 34. `kubectl apply` vs `create` vs `replace` vs `patch`.
<details><summary>Đáp án</summary>

- `create`: imperative, báo lỗi nếu object đã tồn tại.
- `apply`: declarative, tạo hoặc cập nhật bằng three-way merge (cấu hình apply lần trước, trạng thái thực tế, file mới), hoặc server-side apply (`--server-side`) có quản lý *field ownership*.
- `replace`: thay **toàn bộ** object. Những field không có trong file sẽ bị mất.
- `patch`: sửa một phần (strategic merge, JSON merge, JSON patch).
- Trong pipeline nên dùng `apply` hoặc Helm để chạy lại nhiều lần vẫn cho cùng kết quả (idempotent).
</details>

### 35. What is a CRD and what is an Operator? Give examples relevant to this platform.
<details><summary>Đáp án</summary>

- **CRD** (CustomResourceDefinition) mở rộng API Kubernetes bằng loại object mới, ví dụ `Kafka`, `KafkaTopic`.
- **Operator** = CRD + controller tự viết, chứa **kiến thức vận hành** của một phần mềm: cách deploy, scale, rolling upgrade, backup, failover. Operator chạy reconcile loop giống controller có sẵn.
- Ví dụ: **Strimzi** (Kafka), **cass-operator / K8ssandra** (Cassandra), **ECK** (Elasticsearch), **Prometheus Operator** (`ServiceMonitor`, `PrometheusRule`).
</details>

### 36. What is a kubeconfig? How do you work with multiple clusters?
<details><summary>Đáp án</summary>

- kubeconfig (mặc định `~/.kube/config` hoặc biến `KUBECONFIG`) gồm ba phần: `clusters` (endpoint, CA), `users` (cert, token, exec plugin) và `contexts` (cặp cluster + user + namespace mặc định).
- Làm việc nhiều cluster:
  - `kubectl config get-contexts`, `kubectl config use-context prod-eu`, hoặc ghi rõ `--context` trong từng lệnh. Trong pipeline nên ghi rõ để tránh deploy nhầm cluster.
  - Có thể gộp nhiều file bằng `KUBECONFIG=a:b`.
</details>

### 37. What does `kubectl rollout restart` actually do?
<details><summary>Đáp án</summary>

Lệnh này thêm hoặc cập nhật annotation `kubectl.kubernetes.io/restartedAt` trong **Pod template**. Pod template thay đổi nên Deployment tạo ReplicaSet mới và **rolling update** theo đúng strategy, không xóa tất cả Pod cùng lúc. Lệnh hay dùng để nạp lại ConfigMap/Secret đọc qua biến môi trường.
</details>

### 38. How do you debug a container image that has no shell (distroless)?
<details><summary>Đáp án</summary>

Dùng **ephemeral container**:
```bash
kubectl debug -it pod/api-xyz --image=busybox:1.36 --target=api
```
Container debug được gắn vào Pod đang chạy và dùng chung process namespace với container đích nhờ `--target`. Có thể chạy `ps`, `wget`, `nslookup`. Ngoài ra `kubectl debug node/<node> -it --image=...` tạo Pod debug trên node.
</details>

### 39. What is a PodDisruptionBudget and when does it matter?
<details><summary>Đáp án</summary>

PDB giới hạn số Pod của một ứng dụng bị **gián đoạn tự nguyện** cùng lúc, qua `minAvailable` hoặc `maxUnavailable`. Gián đoạn tự nguyện là `kubectl drain`, nâng cấp node, cluster autoscaler thu hẹp. PDB **không** chặn được node chết đột ngột.

Với Kafka, ZooKeeper, Cassandra, PDB là bắt buộc để khi drain node không làm mất quorum hoặc mất ISR. Cẩn thận: PDB đặt quá chặt (ví dụ `maxUnavailable: 0`) sẽ khiến drain bị kẹt mãi.
</details>

### 40. What is the Downward API?
<details><summary>Đáp án</summary>

Downward API đưa thông tin của chính Pod vào container qua env hoặc file: tên Pod, namespace, IP Pod, tên node, label/annotation, request/limit. Ví dụ: đưa `metadata.name` vào log để biết dòng log đến từ Pod nào, hoặc đưa `limits.memory` cho app tự cấu hình.
</details>

### 41. Explain the difference between a container's `command`/`args` in Kubernetes and `ENTRYPOINT`/`CMD` in Docker.
<details><summary>Đáp án</summary>

- `command` trong Kubernetes **ghi đè `ENTRYPOINT`**.
- `args` **ghi đè `CMD`**.
- Chỉ đặt `args` thì vẫn dùng `ENTRYPOINT` của image với tham số mới.
- Đặt `command` mà không có `args` thì `CMD` của image bị bỏ qua.
</details>

### 42. What is the difference between `kubectl logs` showing nothing and the app writing logs to a file inside the container?
<details><summary>Đáp án</summary>

`kubectl logs` chỉ đọc **stdout/stderr** của container (runtime ghi ra file trên node, thường ở `/var/log/pods/...`). Nếu app ghi log vào file trong container thì `kubectl logs` trống và agent thu log ở cấp node (Fluent Bit) cũng không thấy. Chuẩn cloud-native (12-factor) là **ghi log ra stdout**, tốt nhất ở dạng JSON có cấu trúc.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/): các thành phần control plane và node.
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/): rolling update, rollback, `maxSurge` và `maxUnavailable`.
- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/): danh tính ổn định, `volumeClaimTemplates`.
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/): phase, restart policy, backoff, termination.
- [Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/): cấu hình probe và giá trị mặc định.
- [Sidecar Containers](https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/): native sidecar.
- [Resource Management for Pods and Containers](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/): requests và limits.
- [Pod Quality of Service Classes](https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/): các lớp QoS.
- [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/) và [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/): cấu hình và dữ liệu nhạy cảm.
- [Disruptions (PDB)](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/): PodDisruptionBudget.
- [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) và [Operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/): CRD và Operator.
