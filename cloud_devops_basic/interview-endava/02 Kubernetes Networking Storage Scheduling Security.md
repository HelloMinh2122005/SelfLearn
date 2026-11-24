# 02. Kubernetes: Networking, Storage, Scheduling, Scaling & Security

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.

---

## A. Networking

### 1. Explain the Kubernetes networking model.
<details><summary>Đáp án</summary>

- Mỗi Pod có **IP riêng**.
- Mọi Pod gọi được mọi Pod khác (kể cả khác node) **mà không cần NAT**.
- Agent trên node (kubelet...) gọi được mọi Pod trên node đó.
- Kubernetes chỉ định nghĩa mô hình này. Việc cấp IP và định tuyến do **CNI plugin** thực hiện.
</details>

### 2. What is a CNI plugin? Name a few and how they differ.
<details><summary>Đáp án</summary>

CNI (Container Network Interface) là chuẩn plugin mà runtime gọi khi tạo sandbox của Pod, để gắn interface mạng và cấp IP. Ví dụ:
- **Flannel**: đơn giản, overlay VXLAN, **không** hỗ trợ NetworkPolicy.
- **Calico**: routing BGP hoặc overlay, hỗ trợ NetworkPolicy.
- **Cilium**: dựa trên eBPF, có NetworkPolicy L3–L7, có thể thay kube-proxy, có observability (Hubble).
- CNI của cloud: AWS VPC CNI, Azure CNI.
</details>

### 3. Why do we need a Service? How does it find its Pods?
<details><summary>Đáp án</summary>

IP của Pod thay đổi mỗi khi Pod được tạo lại. **Service** cho một **IP ảo ổn định (ClusterIP)** và **tên DNS ổn định**, đồng thời cân bằng tải giữa các Pod.

Service chọn Pod bằng **label selector**. Control plane duy trì **EndpointSlice** chứa IP:port của các Pod **Ready** khớp selector. kube-proxy trên mỗi node đọc EndpointSlice và lập trình rule để chuyển traffic từ ClusterIP tới Pod.
</details>

### 4. Explain the Service types.
<details><summary>Đáp án</summary>

- **ClusterIP** (mặc định): chỉ truy cập được trong cluster.
- **NodePort**: mở một port (dải mặc định **30000–32767**) trên **mọi node**, chuyển vào Service.
- **LoadBalancer**: NodePort cộng với load balancer bên ngoài do cloud-controller-manager tạo. On-prem cần MetalLB hoặc tương đương.
- **ExternalName**: chỉ là bản ghi DNS CNAME tới tên bên ngoài, không proxy.
- **Headless** (`clusterIP: None`): không có IP ảo, DNS trả về IP của từng Pod.
</details>

### 5. Explain `port`, `targetPort`, `nodePort` and `containerPort`.
<details><summary>Đáp án</summary>

- `containerPort` (trong Pod): port mà app lắng nghe. Field này chủ yếu mang tính tài liệu.
- `port` (trong Service): port của ClusterIP mà client gọi tới.
- `targetPort` (trong Service): port trên Pod nhận traffic. Có thể là số hoặc **tên port**.
- `nodePort`: port mở trên node (chỉ có ở NodePort hoặc LoadBalancer).
- Lỗi hay gặp: `targetPort` không khớp port app thật sự lắng nghe, dẫn tới *connection refused*.
</details>

### 6. How does kube-proxy work?
<details><summary>Đáp án</summary>

kube-proxy chạy trên mỗi node, watch Service và EndpointSlice, rồi lập trình kernel:
- **iptables mode**: các rule DNAT chọn ngẫu nhiên một endpoint.
- **IPVS mode**: dùng bảng băm của IPVS, có nhiều thuật toán cân bằng tải.
- **nftables mode**: backend mới hơn.

kube-proxy **không nằm trên đường đi của dữ liệu**. Kernel mới là bên chuyển gói. Một số CNI (Cilium) thay thế hoàn toàn kube-proxy bằng eBPF.
</details>

### 7. How does DNS work inside a cluster? What is the effect of `ndots:5`?
<details><summary>Đáp án</summary>

- **CoreDNS** phục vụ DNS. Tên đầy đủ của Service là `<svc>.<ns>.svc.cluster.local`. Trong cùng namespace chỉ cần gọi `<svc>`.
- `/etc/resolv.conf` của Pod có `search <ns>.svc.cluster.local svc.cluster.local cluster.local` và `options ndots:5`.
- `ndots:5` nghĩa là tên có **ít hơn 5 dấu chấm** sẽ được thử ghép với từng search domain trước. Gọi `api.example.com` có thể sinh ra vài truy vấn thừa trước khi ra đúng kết quả, làm tăng latency và tải CoreDNS.
- Cách giảm: dùng FQDN có dấu chấm ở cuối (`api.example.com.`) hoặc chỉnh `dnsConfig`.
</details>

### 8. Ingress vs Service of type LoadBalancer. What is the Gateway API?
<details><summary>Đáp án</summary>

- **LoadBalancer Service**: mỗi Service một LB, hoạt động ở L4, tốn tiền khi có nhiều service.
- **Ingress**: một điểm vào **L7** cho nhiều Service, định tuyến theo host/path, TLS termination. Ingress **cần một Ingress controller** (bản thân object Ingress không tự làm gì).
- **Gateway API**: API kế nhiệm Ingress, tách vai trò rõ hơn (`GatewayClass` cho nhà cung cấp hạ tầng, `Gateway` cho người vận hành cluster, `HTTPRoute` cho dev), hỗ trợ chia traffic theo trọng số, header matching, nhiều giao thức. API Ingress đã bị đóng băng, không thêm tính năng.
- **Cập nhật:** dự án **Ingress-NGINX** (`kubernetes/ingress-nginx`) đã thông báo ngừng phát triển vào 11/2025. Bảo trì "best-effort" kéo dài tới 03/2026, sau đó không còn bản phát hành hay bản vá bảo mật. Khuyến nghị chuyển sang Gateway API hoặc Ingress controller khác.
</details>

### 9. Describe the path of an HTTP request from a user's browser to a Pod.
<details><summary>Đáp án</summary>

1. DNS phân giải `app.example.com` ra IP của load balancer bên ngoài.
2. TCP và TLS tới LB. LB chuyển tới NodePort hoặc trực tiếp tới Pod của **Ingress/Gateway controller**.
3. Controller terminate TLS (nếu cấu hình), so khớp host/path và chọn Service.
4. Controller gửi tới endpoint (IP Pod) của Service, thường gửi thẳng tới Pod thay vì qua ClusterIP.
5. Gói tin đi qua mạng do CNI dựng (có thể là overlay giữa các node) tới Pod.
6. App xử lý và trả về theo đường ngược lại.
</details>

### 10. How do NetworkPolicies work? What is the default behavior?
<details><summary>Đáp án</summary>

- **Mặc định cho phép tất cả.**
- Khi một Pod bị **chọn** bởi ít nhất một NetworkPolicy có `policyTypes: Ingress`, Pod đó chỉ nhận traffic được policy cho phép. Egress cũng tương tự.
- Các policy **cộng dồn** (phép hợp), không có rule "deny" riêng lẻ.
- **Cần CNI hỗ trợ** (Calico, Cilium). Với Flannel, tạo NetworkPolicy cũng **không có tác dụng**.
- Mẫu default deny:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress }
spec:
  podSelector: {}
  policyTypes: [Ingress]
```
- Khi chặn egress, nhớ cho phép DNS (port 53 tới CoreDNS).
</details>

### 11. Why might gRPC or HTTP/2 traffic be unevenly balanced across Pods behind a ClusterIP Service?
<details><summary>Đáp án</summary>

kube-proxy cân bằng tải ở **L4, theo kết nối**, không theo request. gRPC/HTTP/2 giữ **một kết nối lâu dài** và multiplex nhiều request trên đó, nên mọi request dồn vào một Pod. Pod mới scale lên cũng không nhận traffic. Cách xử lý:
- Cân bằng tải phía client (headless Service + gRPC client LB).
- Dùng L7 proxy hoặc service mesh.
- Giới hạn tuổi thọ kết nối (max connection age).
</details>

### 12. What does `externalTrafficPolicy: Local` do?
<details><summary>Đáp án</summary>

Với NodePort/LoadBalancer:
- `Cluster` (mặc định): node nhận traffic có thể chuyển tiếp sang Pod ở node khác. Có thêm một hop và **mất IP nguồn** của client (bị SNAT).
- `Local`: chỉ gửi tới Pod trên **chính node đó**. **Giữ IP nguồn** và bớt một hop, nhưng node không có Pod sẽ fail health check của LB, và tải có thể lệch giữa các node.
</details>

## B. Storage

### 13. Name common volume types and when to use them.
<details><summary>Đáp án</summary>

- `emptyDir`: tạm thời, sống cùng Pod, dùng chung giữa các container trong Pod (cache, scratch). Có thể dùng RAM (`medium: Memory`).
- `configMap`, `secret`, `projected`, `downwardAPI`: đưa cấu hình vào dưới dạng file.
- `persistentVolumeClaim`: dữ liệu bền vững.
- `hostPath`: mount thư mục của node. Rủi ro bảo mật, chỉ dùng cho agent hệ thống.
</details>

### 14. PV vs PVC vs StorageClass. What is dynamic provisioning?
<details><summary>Đáp án</summary>

- **PersistentVolume (PV)**: một phần storage thật (disk cloud, NFS...), là tài nguyên cấp cluster.
- **PersistentVolumeClaim (PVC)**: **yêu cầu** storage của người dùng (dung lượng, access mode, class).
- **StorageClass**: mô tả "loại" storage và provisioner (driver CSI).
- **Dynamic provisioning**: khi tạo PVC chỉ định StorageClass, provisioner **tự tạo PV**, không cần admin tạo trước.
- `volumeBindingMode: WaitForFirstConsumer` hoãn việc tạo volume tới khi Pod được schedule, tránh trường hợp disk nằm ở zone khác với node.
</details>

### 15. Explain access modes and reclaim policies.
<details><summary>Đáp án</summary>

- Access mode:
  - `ReadWriteOnce` (RWO): đọc ghi từ **một node**.
  - `ReadOnlyMany` (ROX).
  - `ReadWriteMany` (RWX): nhiều node cùng ghi, cần NFS, CephFS, Azure Files...
  - `ReadWriteOncePod` (RWOP): chỉ một Pod.
- Reclaim policy khi PVC bị xóa:
  - `Delete`: xóa luôn disk. Mặc định với dynamic provisioning.
  - `Retain`: giữ disk để khôi phục thủ công.
- Với dữ liệu quan trọng (Kafka, Cassandra), cân nhắc dùng `Retain`.
</details>

### 16. When a StatefulSet is scaled down or deleted, what happens to its PVCs?
<details><summary>Đáp án</summary>

Mặc định PVC tạo từ `volumeClaimTemplates` **không bị xóa**. Đây là thiết kế có chủ đích để bảo vệ dữ liệu, nên scale lên lại thì Pod gắn lại đúng PVC cũ. Muốn tự xóa thì cấu hình `persistentVolumeClaimRetentionPolicy` (`whenDeleted`, `whenScaled`: `Retain` hoặc `Delete`). Hệ quả: PVC "mồ côi" có thể tốn tiền nếu không dọn.
</details>

### 17. What is CSI?
<details><summary>Đáp án</summary>

Container Storage Interface là chuẩn để nhà cung cấp storage viết driver **bên ngoài mã nguồn Kubernetes**. Driver gồm một controller plugin (tạo, xóa, attach volume, snapshot) và một node plugin (mount volume vào node, chạy dưới dạng DaemonSet). Driver in-tree cũ đã được chuyển dần sang CSI.
</details>

## C. Scheduling

### 18. How does the scheduler choose a node?
<details><summary>Đáp án</summary>

Hai giai đoạn:
1. **Filtering**: loại node không đủ điều kiện (không đủ request CPU/memory, taint không được tolerate, nodeSelector hoặc affinity không khớp, volume ở zone khác, port bị trùng).
2. **Scoring**: chấm điểm các node còn lại (cân bằng tài nguyên, spread, affinity mềm, image đã có sẵn trên node) rồi chọn điểm cao nhất.

Không còn node nào qua được filter thì Pod ở trạng thái `Pending`, và Events ghi `FailedScheduling` kèm lý do.
</details>

### 19. nodeSelector vs node affinity.
<details><summary>Đáp án</summary>

- `nodeSelector`: khớp chính xác label, đơn giản.
- **Node affinity**: biểu thức phong phú hơn (`In`, `NotIn`, `Exists`...) và có hai loại:
  - `requiredDuringSchedulingIgnoredDuringExecution`: bắt buộc.
  - `preferredDuringSchedulingIgnoredDuringExecution`: ưu tiên, có trọng số.
- "IgnoredDuringExecution" nghĩa là label của node đổi sau khi Pod đã chạy thì Pod **không bị đuổi**.
</details>

### 20. How would you make sure three Kafka brokers never run on the same node or zone?
<details><summary>Đáp án</summary>

- **Pod anti-affinity** bắt buộc với `topologyKey: kubernetes.io/hostname` để mỗi node chỉ có một broker. Dùng `topology.kubernetes.io/zone` để trải ra theo zone.
- Hoặc dùng **`topologySpreadConstraints`** với `maxSkew: 1` và `whenUnsatisfiable: DoNotSchedule`.
- Kèm **PDB** để thao tác drain không đưa xuống quá một broker cùng lúc.
- Lưu ý: anti-affinity bắt buộc mà số node ít hơn số replica thì Pod thừa sẽ Pending.
</details>

### 21. Explain taints and tolerations and the three effects.
<details><summary>Đáp án</summary>

- **Taint** gắn lên node để "đẩy" Pod ra. **Toleration** gắn lên Pod để chấp nhận taint đó.
- Ba effect:
  - `NoSchedule`: không schedule Pod mới không có toleration.
  - `PreferNoSchedule`: cố gắng tránh.
  - `NoExecute`: đuổi cả Pod **đang chạy** không có toleration (có thể đặt `tolerationSeconds`).
- Toleration chỉ **cho phép** Pod vào node có taint, không **bắt buộc** Pod vào đó. Muốn dành riêng node cho một nhóm Pod thì kết hợp taint, toleration và node affinity.
</details>

### 22. `kubectl cordon` vs `drain` vs adding a taint.
<details><summary>Đáp án</summary>

- `cordon`: đánh dấu node là **unschedulable**. Pod đang chạy vẫn ở nguyên.
- `drain`: cordon rồi **evict** các Pod (tôn trọng PDB và grace period). Cần `--ignore-daemonsets`, và `--delete-emptydir-data` nếu Pod có emptyDir.
- Taint `NoExecute`: đuổi Pod theo toleration, không qua Eviction API nên **không tôn trọng PDB**.
- `uncordon`: cho schedule lại.
</details>

### 23. What are Pod priority and preemption?
<details><summary>Đáp án</summary>

`PriorityClass` gán độ ưu tiên cho Pod. Khi Pod ưu tiên cao bị Pending vì thiếu tài nguyên, scheduler có thể **preempt** (đuổi) các Pod ưu tiên thấp hơn để lấy chỗ. Thành phần hệ thống dùng `system-cluster-critical` và `system-node-critical`. Lạm dụng priority cao có thể khiến workload thường bị đuổi liên tục.
</details>

### 24. What is node-pressure eviction?
<details><summary>Đáp án</summary>

kubelet theo dõi tín hiệu `memory.available`, `nodefs.available`, `imagefs.available`, inode, PID. Khi vượt ngưỡng eviction, kubelet **chủ động đuổi Pod** để bảo vệ node. Pod bị đuổi có `Status: Failed, Reason: Evicted`. Thứ tự đuổi dựa trên mức dùng vượt request và priority. Khác với OOM kill của kernel: OOM kill chỉ giết **process** trong container, còn eviction đuổi **cả Pod**.
</details>

## D. Scaling

### 25. How does the Horizontal Pod Autoscaler work?
<details><summary>Đáp án</summary>

- Cứ khoảng 15 giây, HPA controller đọc metric (CPU/memory từ **metrics-server**, hoặc custom/external metric qua adapter như Prometheus Adapter hoặc KEDA).
- Công thức: `desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)`.
- CPU utilization được tính **theo phần trăm của request**, nên Pod **phải có CPU request**.
- Có dung sai (mặc định 10%) và cửa sổ ổn định khi scale down (mặc định 300 giây) để tránh dao động liên tục (flapping).
- API hiện tại là `autoscaling/v2`.
</details>

### 26. HPA is not scaling. What would you check?
<details><summary>Đáp án</summary>

- `kubectl describe hpa`: có `<unknown>` metric không, có điều kiện `ScalingActive=False` không.
- metrics-server có chạy không (`kubectl top pods`).
- Pod có khai báo **request** không.
- Đã chạm `maxReplicas` chưa.
- Pod mới bị Pending vì cluster hết chỗ thì cần Cluster Autoscaler.
- Metric chọn sai: app bị nghẽn ở I/O hay DB thì CPU không tăng.
</details>

### 27. HPA vs VPA vs Cluster Autoscaler.
<details><summary>Đáp án</summary>

- **HPA**: thay **số Pod**.
- **VPA**: điều chỉnh **request/limit** của Pod (thường phải tạo lại Pod). Không nên dùng chung với HPA trên cùng metric CPU/memory.
- **Cluster Autoscaler** (hoặc Karpenter): thêm node khi có Pod Pending vì thiếu tài nguyên, bớt node khi node rảnh.
</details>

### 28. Can you autoscale Kafka brokers with an HPA like a stateless service?
<details><summary>Đáp án</summary>

Không đơn giản như vậy. Thêm broker **không tự chuyển partition sang**. Phải chạy **partition reassignment** (Strimzi có Cruise Control) và việc này sinh ra traffic replication lớn. Bớt broker thì phải chuyển partition đi trước, nếu không sẽ mất replica. Thứ nên autoscale là **consumer**, theo consumer lag (KEDA), và số consumer có ích tối đa bằng số partition.
</details>

## E. Security

### 29. Explain authentication, authorization and admission control in the API server.
<details><summary>Đáp án</summary>

1. **Authentication**: bạn là ai? Có thể là client cert, bearer token, ServiceAccount token, OIDC.
2. **Authorization**: bạn có được làm việc này không? Thường là RBAC.
3. **Admission control**: request hợp lệ có cần **sửa** không (mutating, ví dụ inject sidecar, thêm giá trị mặc định) và có được **chấp nhận** không (validating, ví dụ Pod Security Admission, OPA Gatekeeper, Kyverno, ValidatingAdmissionPolicy).
</details>

### 30. Explain RBAC objects. Role vs ClusterRole, RoleBinding vs ClusterRoleBinding.
<details><summary>Đáp án</summary>

- **Role**: tập quyền (verbs trên resources) **trong một namespace**.
- **ClusterRole**: tập quyền cấp cluster, hoặc template dùng lại được cho nhiều namespace.
- **RoleBinding**: gán Role hoặc ClusterRole cho subject (User, Group, ServiceAccount) **trong một namespace**.
- **ClusterRoleBinding**: gán ClusterRole trên **toàn cluster**.
- RBAC chỉ có **allow**, không có deny.
- Kiểm tra quyền: `kubectl auth can-i create deployments -n prod --as=system:serviceaccount:ci:deployer`.
</details>

### 31. How would you give a GitLab CI job permission to deploy to a namespace, following least privilege?
<details><summary>Đáp án</summary>

- Tạo **ServiceAccount** `deployer` trong namespace đích, cùng một **Role** chỉ có các verb cần thiết trên các resource mà chart dùng (deployments, services, configmaps, secrets, ingresses, và secrets mà Helm dùng để lưu release), rồi tạo **RoleBinding**.
- Không dùng `cluster-admin` cho CI.
- Cấp credential **ngắn hạn**: token sinh qua TokenRequest, OIDC, hoặc **GitLab agent for Kubernetes**, thay vì token tĩnh lưu mãi trong biến CI.
- Mỗi cluster hoặc môi trường dùng credential riêng. Biến chứa credential prod đặt **protected** để chỉ chạy được trên nhánh hoặc tag được bảo vệ.
</details>

### 32. What is a ServiceAccount? How are its tokens provided to Pods?
<details><summary>Đáp án</summary>

ServiceAccount là danh tính cho **process trong Pod** khi gọi API server. Mỗi namespace có SA `default`. Token được mount qua **projected volume**, là token **có thời hạn và gắn với đối tượng sử dụng** (bound token, tự xoay vòng), không còn là Secret token vĩnh viễn như các phiên bản cũ. Pod không cần gọi API thì đặt `automountServiceAccountToken: false`.
</details>

### 33. Which `securityContext` settings would you apply to a typical microservice?
<details><summary>Đáp án</summary>

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }
  seccompProfile: { type: RuntimeDefault }
```
Nếu app cần ghi tạm (ví dụ thư mục `/tmp` của Java) thì mount `emptyDir` vào đó.
</details>

### 34. What are Pod Security Standards? What replaced PodSecurityPolicy?
<details><summary>Đáp án</summary>

- Ba mức: **Privileged** (không giới hạn), **Baseline** (chặn các leo thang quyền đã biết), **Restricted** (siết chặt theo best practice).
- **Pod Security Admission** áp dụng các mức này theo **label của namespace**, ví dụ `pod-security.kubernetes.io/enforce=restricted`, với ba chế độ `enforce`, `audit`, `warn`.
- PodSecurityPolicy bị **gỡ ở 1.25**.
</details>

### 35. How do you pull images from a private registry such as GitLab Container Registry?
<details><summary>Đáp án</summary>

Tạo Secret kiểu `docker-registry`:
```bash
kubectl create secret docker-registry gitlab-reg \
  --docker-server=registry.gitlab.com --docker-username=<deploy-token-user> \
  --docker-password=<deploy-token> -n app
```
Sau đó tham chiếu Secret qua `imagePullSecrets` trong Pod spec, hoặc gắn vào ServiceAccount. Nên dùng **deploy token** chỉ có quyền `read_registry`, không dùng token cá nhân.
</details>

### 36. How would you secure the software supply chain from commit to cluster?
<details><summary>Đáp án</summary>

- Quét dependency và image (Trivy, Grype, công cụ quét có sẵn của GitLab).
- Sinh **SBOM**.
- **Ký image** (cosign/Sigstore) và **kiểm tra chữ ký** bằng admission policy.
- Chỉ cho phép image từ registry tin cậy, tham chiếu theo **digest**.
- Base image tối giản, chạy non-root.
- Protected branch, review bắt buộc, secret quản lý tập trung.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Cluster Networking](https://kubernetes.io/docs/concepts/cluster-administration/networking/): mô hình mạng và CNI.
- [Service](https://kubernetes.io/docs/concepts/services-networking/service/): các loại Service, port, targetPort.
- [Virtual IPs and Service Proxies](https://kubernetes.io/docs/reference/networking/virtual-ips/): các chế độ của kube-proxy.
- [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/): DNS trong cluster.
- [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) và [Gateway API](https://kubernetes.io/docs/concepts/services-networking/gateway/): điểm vào L7.
- [Ingress NGINX Retirement: What You Need to Know](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/): thông báo chính thức từ Kubernetes blog.
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/): NetworkPolicy.
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/): PV, PVC, access mode, reclaim policy.
- [Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/) và [Taints and Tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/): scheduling.
- [Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/): trải Pod theo node và zone.
- [Node-pressure Eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/): eviction khi node thiếu tài nguyên.
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/): HPA.
- [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/): RBAC.
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/): các mức bảo mật Pod.
