# 03. Kubernetes Troubleshooting

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt. Khi trả lời, hãy nói theo **thứ tự các bước**: quan sát, khoanh vùng, giả thuyết, kiểm chứng, khắc phục.

---

### 1. What is your general approach to troubleshooting a failing workload in Kubernetes?
<details><summary>Đáp án</summary>

1. **Phạm vi**: một Pod, một Deployment, một node hay cả cluster? Bắt đầu từ khi nào? Có trùng với lần deploy nào không?
2. **Trạng thái**: `kubectl get pods -o wide` (STATUS, RESTARTS, NODE).
3. **Sự kiện**: `kubectl describe pod` (phần Events, Last State, Exit Code) và `kubectl get events --sort-by=.lastTimestamp`.
4. **Log**: `kubectl logs` (thêm `--previous` nếu container đã restart).
5. **Bên trong**: `kubectl exec` hoặc `kubectl debug` để kiểm tra DNS, kết nối, file cấu hình.
6. **Metric**: `kubectl top`, Grafana (CPU throttling, memory, lỗi).
7. Nếu là sự cố production: **khôi phục trước** (rollback), tìm nguyên nhân gốc sau.
</details>

### 2. A Pod is in `CrashLoopBackOff`. Walk me through your debugging.
<details><summary>Đáp án</summary>

Container khởi động rồi chết, lặp đi lặp lại.
- `kubectl logs <pod> --previous`: log của lần chạy **trước khi chết**. Thường thấy exception, thiếu biến môi trường, không kết nối được DB.
- `kubectl describe pod`: xem `Last State: Terminated`, `Reason`, **Exit Code**:
  - `OOMKilled` / 137: thiếu memory.
  - 1: lỗi của ứng dụng.
  - 127: không tìm thấy lệnh (sai `command` hoặc entrypoint).
- Kiểm tra **liveness probe** có quá gắt không (app chưa kịp lên đã bị kill).
- Kiểm tra ConfigMap/Secret, quyền file, `readOnlyRootFilesystem`.
- Có thể tạm override `command: ["sleep","3600"]` rồi exec vào để thử chạy tay.
</details>

### 3. A Pod shows `ImagePullBackOff` / `ErrImagePull`. What are the possible causes?
<details><summary>Đáp án</summary>

Xem Events trong `kubectl describe pod`:
- **Sai tên hoặc tag**, image không tồn tại (lỗi `manifest unknown`, `not found`).
- **Không có quyền**: thiếu hoặc sai `imagePullSecrets`, token hết hạn (lỗi `unauthorized`, `denied`).
- **Mạng**: node không ra được registry (proxy, firewall, DNS), registry dùng cert tự ký.
- **Rate limit** của registry công cộng (Docker Hub `toomanyrequests`).
- **Sai kiến trúc** (image chỉ có amd64 nhưng node là arm64, lỗi `no matching manifest`).
</details>

### 4. A Pod is stuck in `Pending`. Why?
<details><summary>Đáp án</summary>

`kubectl describe pod` → Events `FailedScheduling`:
- **Không đủ tài nguyên** (`Insufficient cpu/memory`): request quá lớn hoặc cluster đầy.
- **Taint không được tolerate**, nodeSelector hoặc affinity không khớp node nào.
- **PVC chưa bind**: không có StorageClass, volume ở zone khác.
- Anti-affinity bắt buộc không thỏa được.
- ResourceQuota đầy. Trường hợp này Pod thường **không được tạo**. Xem Events của ReplicaSet (`kubectl describe rs`).
</details>

### 5. A Java service keeps getting `OOMKilled` (exit code 137), but the heap is set below the limit. Explain.
<details><summary>Đáp án</summary>

Memory của JVM **lớn hơn heap**: metaspace, code cache, thread stack (mỗi thread khoảng 1 MB), direct buffer (Netty, Kafka client), GC overhead, thư viện native. Tổng memory của process (RSS) vượt `limits.memory` thì **kernel** kill process. Đây không phải `java.lang.OutOfMemoryError`.

Cách xử lý:
- Dùng `-XX:MaxRAMPercentage` (ví dụ 60–75%) thay vì `-Xmx` cố định, để chừa chỗ cho phần ngoài heap.
- Bật Native Memory Tracking để đo.
- Tăng limit.
- Kiểm tra số thread.
</details>

### 6. Explain common container exit codes.
<details><summary>Đáp án</summary>

- `0`: kết thúc bình thường. Với Deployment, container thoát 0 vẫn bị restart, vì service không được phép "xong".
- `1`: lỗi chung của ứng dụng.
- `126`: lệnh không thực thi được (thiếu quyền execute).
- `127`: không tìm thấy lệnh.
- `128+N`: bị **signal N** giết. **137** = 128+9 (SIGKILL, thường do OOM hoặc hết grace period). **143** = 128+15 (SIGTERM). **139** = 128+11 (SIGSEGV).
</details>

### 7. What is `CreateContainerConfigError`?
<details><summary>Đáp án</summary>

kubelet không dựng được cấu hình container. Thường là do Pod tham chiếu **ConfigMap/Secret hoặc key không tồn tại** (ví dụ `secret "db-creds" not found` hoặc `couldn't find key PASSWORD`). Có thể vì sai namespace, sai tên, hoặc chart chưa tạo Secret. Dùng `optional: true` nếu key thực sự không bắt buộc.
</details>

### 8. Pod is `Running` but shows `0/1 READY`. What does that mean?
<details><summary>Đáp án</summary>

Container đang chạy nhưng **readiness probe fail**, nên Pod không nhận traffic từ Service. `describe` sẽ thấy `Readiness probe failed: ...`. Kiểm tra:
- Path và port của probe đúng chưa.
- App đã khởi động xong chưa (cần startup probe hoặc `initialDelaySeconds`).
- Dependency mà readiness phụ thuộc vào.
- `timeoutSeconds` quá ngắn (mặc định 1 giây) với app chậm.
</details>

### 9. A Service returns no response or connection refused. How do you debug?
<details><summary>Đáp án</summary>

1. `kubectl get endpointslices -l kubernetes.io/service-name=<svc>` (hoặc `kubectl get endpoints <svc>`). **Không có endpoint** nghĩa là selector không khớp label Pod, hoặc Pod không Ready.
2. So sánh `spec.selector` của Service với `kubectl get pods --show-labels`.
3. `targetPort` có khớp port app thật sự lắng nghe không. Xem trong Pod bằng `ss -tlnp`. App bind `127.0.0.1` thay vì `0.0.0.0` cũng gây lỗi này.
4. Gọi thẳng IP của Pod bằng một Pod debug. Gọi được thì lỗi nằm ở tầng Service hoặc kube-proxy.
5. NetworkPolicy có chặn không.
</details>

### 10. DNS resolution fails inside a Pod. What do you check?
<details><summary>Đáp án</summary>

- `kubectl exec` rồi `nslookup kubernetes.default` hoặc `nslookup <svc>.<ns>`.
- `cat /etc/resolv.conf`: nameserver có phải IP của Service `kube-dns` không, search domain có đúng không.
- Pod của CoreDNS có chạy không, log của CoreDNS (`kubectl -n kube-system logs -l k8s-app=kube-dns`).
- NetworkPolicy egress có cho port 53 UDP/TCP không.
- Tên miền bên ngoài lỗi: xem cấu hình `forward` của CoreDNS hoặc upstream DNS của node.
</details>

### 11. "Connection refused" vs "connection timed out": what does each tell you?
<details><summary>Đáp án</summary>

- **Refused**: gói tin **tới được** host nhưng **không có process nào lắng nghe** port đó (nhận RST). Thường do app chưa chạy, sai port, hoặc bind localhost.
- **Timeout**: **không có phản hồi**. Gói bị firewall hoặc NetworkPolicy bỏ (DROP), sai route, IP không tồn tại, hoặc host quá tải.
- **No route to host**: lỗi định tuyến, hoặc firewall trả ICMP unreachable.
</details>

### 12. A rollout is stuck. How do you detect and handle it?
<details><summary>Đáp án</summary>

- `kubectl rollout status deployment/x` đứng chờ. Sau `progressDeadlineSeconds` (mặc định 600 giây), điều kiện `Progressing=False` với reason `ProgressDeadlineExceeded`.
- Nguyên nhân: Pod mới CrashLoop, readiness fail, ImagePull, không đủ tài nguyên để surge, PDB.
- Xử lý: `kubectl rollout undo` hoặc `helm rollback`, điều tra Pod mới.
- Kubernetes **không tự rollback** Deployment. Cần pipeline xử lý (`helm --rollback-on-failure` hoặc `--atomic`, Argo Rollouts).
</details>

### 13. A node is `NotReady`. What do you check?
<details><summary>Đáp án</summary>

- `kubectl describe node`: Conditions (`MemoryPressure`, `DiskPressure`, `PIDPressure`, `Ready`), heartbeat cuối.
- Trên node:
  - `systemctl status kubelet`, `journalctl -u kubelet`.
  - Container runtime (`systemctl status containerd`).
  - Disk đầy (`df -h`, `df -i`).
  - Hết memory.
  - Cert của kubelet hết hạn.
  - Mạng tới API server.
  - CNI lỗi (`network plugin not ready`).
- Pod trên node NotReady sẽ bị evict sau một khoảng thời gian (toleration mặc định `not-ready` và `unreachable` là 300 giây).
</details>

### 14. A Pod is stuck in `Terminating`. Why and how do you fix it?
<details><summary>Đáp án</summary>

- **Finalizer** chưa được gỡ (controller tương ứng không chạy).
- **Node chết**, kubelet không xác nhận được là đã xóa.
- Volume không unmount được.
- App bỏ qua SIGTERM thì vẫn bị kill sau grace period, nên đây hiếm khi là nguyên nhân treo mãi.

Xử lý: tìm nguyên nhân trước. Biện pháp cuối là `kubectl delete pod x --grace-period=0 --force`. **Cẩn thận với StatefulSet**: force delete khi node chưa chắc đã chết có thể làm **hai Pod cùng danh tính chạy đồng thời**.
</details>

### 15. A PVC is stuck in `Pending`.
<details><summary>Đáp án</summary>

`kubectl describe pvc`:
- Không có StorageClass mặc định hoặc sai tên class.
- Provisioner (CSI driver) lỗi.
- `WaitForFirstConsumer`: PVC chỉ được bind khi có Pod dùng nó. Đây là bình thường.
- Không có PV tĩnh khớp dung lượng và access mode.
- Hết quota disk ở phía cloud.
</details>

### 16. You see many Pods with status `Evicted`. What happened?
<details><summary>Đáp án</summary>

kubelet đuổi Pod vì **node thiếu tài nguyên**, thường là disk (`ephemeral-storage`: log, emptyDir, image) hoặc memory. `describe` ghi rõ `The node was low on resource: ...`. Xử lý:
- Đặt request/limit cho `ephemeral-storage`.
- Dọn log, xoay vòng log.
- Tăng disk cho node.
- Kiểm tra app ghi file tạm quá nhiều.

Pod `Evicted` của Deployment đã được thay bằng Pod mới. Pod cũ chỉ còn lại để xem lại sự cố.
</details>

### 17. A service is slow but CPU usage looks low in the dashboard. What could be happening?
<details><summary>Đáp án</summary>

- **CPU throttling**: mức dùng trung bình thấp nhưng có những đợt bùng ngắn chạm CFS quota trong mỗi chu kỳ 100 ms. Xem `container_cpu_cfs_throttled_periods_total`. Rất hay gặp với Java (JIT, GC nhiều thread) khi CPU limit thấp.
- Chờ I/O hoặc chờ dependency (DB, Kafka), connection pool cạn.
- GC pause dài.
- DNS chậm (vấn đề `ndots`).
- Pod mới nhận traffic khi JVM chưa warm-up.
</details>

### 18. Users see 502/503 errors for a few seconds during every deployment. Why and how do you fix it?
<details><summary>Đáp án</summary>

- Pod mới nhận traffic **trước khi sẵn sàng**: thiếu hoặc sai readiness probe.
- Pod cũ bị tắt **trong khi load balancer vẫn gửi request tới**: SIGTERM và việc gỡ endpoint xảy ra song song.
- App không xử lý SIGTERM, cắt ngang request đang dở.
- Rolling update có `maxUnavailable` quá cao.

Khắc phục:
- Readiness probe chuẩn.
- `preStop` sleep vài giây.
- Graceful shutdown (Spring Boot 3.4+ bật mặc định).
- `terminationGracePeriodSeconds` đủ dài.
- `maxUnavailable: 0`.
- PDB.
</details>

### 19. How do you see logs from all Pods of a Deployment, or from a specific container?
<details><summary>Đáp án</summary>

```bash
kubectl logs deploy/api                      # một Pod của Deployment
kubectl logs -l app=api --all-containers --prefix --since=15m
kubectl logs pod/api-x -c istio-proxy        # container cụ thể
kubectl logs pod/api-x --previous            # lần chạy trước
kubectl logs -f pod/api-x --tail=100         # theo dõi liên tục
```
Khi có nhiều replica, dùng hệ thống log tập trung (Elasticsearch hoặc Loki) vì log của Pod đã bị xóa sẽ mất.
</details>

### 20. What other `kubectl` commands are essential for debugging?
<details><summary>Đáp án</summary>

```bash
kubectl get events -n app --sort-by=.lastTimestamp
kubectl get pod x -o yaml                     # spec và status đầy đủ
kubectl exec -it x -- sh
kubectl port-forward svc/api 8080:80          # gọi service từ máy mình
kubectl top pod / kubectl top node            # cần metrics-server
kubectl cp x:/tmp/heap.hprof ./heap.hprof
kubectl auth can-i --list --as=...
kubectl explain deployment.spec.strategy
kubectl diff -f manifest.yaml                 # xem thay đổi trước khi apply
```
</details>

### 21. A Spring Boot Pod is restarted every few minutes right after deployment, and logs show it was still starting. Why?
<details><summary>Đáp án</summary>

**Liveness probe** bắt đầu kiểm tra trước khi app khởi động xong. Probe fail đủ `failureThreshold` lần thì kubelet kill, app khởi động lại, và vòng lặp tiếp diễn. CPU limit thấp làm JVM khởi động càng chậm. Cách xử lý:
- Thêm **startupProbe** với `failureThreshold × periodSeconds` lớn hơn thời gian khởi động tối đa.
- Dùng endpoint `/actuator/health/liveness` và `/actuator/health/readiness`.
- Xem lại CPU request/limit.
</details>

### 22. Only some requests fail, intermittently. How do you narrow it down?
<details><summary>Đáp án</summary>

- Có phải lỗi chỉ đến từ **một Pod hoặc một node**? Lọc log và metric theo `pod` và `node`. Có thể Pod đó có cấu hình khác, hết memory, hoặc node có vấn đề mạng.
- Hai phiên bản đang chạy song song (rollout dở dang)?
- Một replica của dependency bị lỗi?
- DNS bị timeout ngắt quãng (race condition conntrack/UDP).
- Connection pool hết, hoặc kết nối keep-alive tới Pod đã chết.
- Dùng **correlation ID hoặc trace ID** để lần theo một request lỗi qua các service.
</details>

### 23. A namespace is stuck in `Terminating`.
<details><summary>Đáp án</summary>

Còn object bên trong có **finalizer** chưa được gỡ, hoặc có **APIService** (ví dụ metrics-server) không truy cập được nên Kubernetes không liệt kê hết resource để xóa. Kiểm tra `kubectl get namespace x -o yaml` (phần `status.conditions`), `kubectl api-resources --verbs=list --namespaced -o name`, và `kubectl get apiservice` xem cái nào `False`.
</details>

### 24. The CI job fails with `Error from server (Forbidden): deployments.apps is forbidden: User "system:serviceaccount:ci:deployer" cannot patch...`
<details><summary>Đáp án</summary>

Đây là lỗi **RBAC**: ServiceAccount dùng trong CI thiếu quyền `patch` trên `deployments` trong namespace đó. Kiểm tra bằng `kubectl auth can-i patch deployments -n <ns> --as=system:serviceaccount:ci:deployer`. Sửa Role hoặc RoleBinding (thêm verb hoặc resource, đúng namespace). Không cấp `cluster-admin` cho nhanh. Đọc kỹ thông báo lỗi: nó ghi rõ **ai, verb gì, resource gì, namespace nào**.
</details>

### 25. `kubectl` returns `x509: certificate signed by unknown authority` or `certificate has expired`.
<details><summary>Đáp án</summary>

- Sai CA trong kubeconfig (dùng nhầm kubeconfig của cluster khác), hoặc proxy công ty chặn và ký lại TLS.
- Cert của API server hoặc của client **hết hạn**. Với kubeadm: `kubeadm certs check-expiration` và `kubeadm certs renew`.
- Không bao giờ dùng `--insecure-skip-tls-verify` trong pipeline production.
</details>

### 26. After a Helm upgrade, the new Pods are healthy but the application behaves like the old version. What could be wrong?
<details><summary>Đáp án</summary>

- **Tag image mutable** (`latest`, `1.2`) + `IfNotPresent`: node dùng lại image cũ trong cache.
- Values không đổi tag (truyền sai file values, `--reuse-values` giữ lại tag cũ).
- Chỉ ConfigMap thay đổi nên Pod không restart (thiếu annotation checksum).
- Cache ở CDN hoặc ingress.
- Kiểm tra: `kubectl get pod -o jsonpath='{..imageID}'` (digest thật), `helm get values`, `helm get manifest`.
</details>

### 27. How would you troubleshoot high memory usage that grows until OOM over several days?
<details><summary>Đáp án</summary>

- Biểu đồ `container_memory_working_set_bytes` dạng răng cưa tăng dần là dấu hiệu rò rỉ memory.
- Với Java, xem heap sau GC có tăng không: tăng là rò heap. Heap ổn mà RSS tăng là rò native memory (direct buffer, thread).
- Lấy heap dump trước khi Pod chết (`jcmd <pid> GC.heap_dump`, hoặc `-XX:+HeapDumpOnOutOfMemoryError` ghi ra volume), phân tích bằng Eclipse MAT.
- Tạm thời: tăng limit hoặc restart định kỳ để giảm ảnh hưởng, nhưng vẫn phải tìm nguyên nhân gốc.
</details>

### 28. A Pod cannot reach an external API, but works from your laptop.
<details><summary>Đáp án</summary>

Kiểm tra theo từng lớp từ bên trong Pod:
- DNS (`nslookup`).
- `curl -v`: lỗi refused, timeout hay TLS?
- NetworkPolicy egress.
- Egress của node: NAT gateway, firewall, security group.
- Cần proxy công ty (`HTTPS_PROXY` / `NO_PROXY`).
- Bên ngoài chỉ cho phép (whitelist) một số IP, nên cần biết IP egress của cluster.
- TLS: cert của CA nội bộ chưa có trong truststore của container (Java dùng `cacerts`).
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Debug Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/): CrashLoop, Pending, ImagePull.
- [Debug Running Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/): `kubectl debug`, ephemeral container.
- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/): Service không hoạt động.
- [Debugging DNS Resolution](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/): debug DNS.
- [Determine the Reason for Pod Failure](https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/): termination message, exit code.
- [Troubleshooting Clusters](https://kubernetes.io/docs/tasks/debug/debug-cluster/): node NotReady, thành phần control plane.
- [Deployments: Failed Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#failed-deployment): `progressDeadlineSeconds`.
- [Certificate Management with kubeadm](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/): kiểm tra và gia hạn cert.
