# Ôn Tập: 6_8_2 Danh Mục Lỗi Thường Gặp

### Câu Hỏi 1: Khi một Pod ở trạng thái `Pending` do vấn đề điều phối trên node, những nguyên nhân phổ biến nào có thể gây ra lỗi này và dùng lệnh nào để kiểm tra?

<details>
<summary>Đáp án</summary>

Trạng thái `Pending` liên quan đến việc kube-scheduler không tìm được node phù hợp để đặt Pod, thường do các nguyên nhân:
- **Thiếu tài nguyên**: Không có node nào đáp ứng đủ CPU/RAM cấu hình trong `requests`.
- **Vi phạm ràng buộc lập lịch**: Tất cả node không thỏa mãn `nodeSelector`, `nodeAffinity`, hoặc node có `taints` mà Pod không khai báo `tolerations` tương ứng.

**Lệnh kiểm tra ưu tiên**:
```bash
kubectl describe pod <pod-name> | grep -A 10 Events:
```
Mục `Events` trong đầu ra của `kubectl describe pod` sẽ hiển thị lý do chi tiết từ kube-scheduler.
</details>

### Câu Hỏi 2: Ngoài việc thiếu tài nguyên trên node, `Pending` còn xảy ra khi gặp vấn đề gì với lưu trữ và hạn ngạch? Cần chạy lệnh nào để xác nhận?

<details>
<summary>Đáp án</summary>

Pod cũng rơi vào trạng thái `Pending` khi:
- **PersistentVolumeClaim chưa được liên kết (unbound PVC)**: Do thiếu PersistentVolume khả dụng hoặc storage provisioner chưa sẵn sàng.
- **Vượt hạn ngạch `ResourceQuota`**: Việc tạo Pod vượt quá giới hạn tài nguyên cho phép của namespace.

**Lệnh kiểm tra**:
```bash
kubectl get pvc
kubectl get resourcequota -n <namespace>
```
</details>

### Câu Hỏi 3: Phân biệt nguyên nhân dẫn đến `ErrImagePull` / `ImagePullBackOff` và lỗi `exec format error`. Nêu lệnh chẩn đoán và cách tạo Secret cho private registry?

<details>
<summary>Đáp án</summary>

- **`ErrImagePull` và `ImagePullBackOff`**: Xuất hiện khi kubelet không thể tải image từ registry do sai tên image, sai tag phiên bản, thiếu khóa `imagePullSecrets` khi truy cập private registry, hoặc bị giới hạn tần suất kéo dữ liệu (rate limit) từ public registry.
- **`exec format error`**: Xảy ra do không tương thích kiến trúc CPU giữa image và node, ví dụ image được biên dịch cho `linux/arm64` nhưng chạy trên node `linux/amd64`.

**Lệnh chẩn đoán và khắc phục**:
- Kiểm tra thông báo lỗi kéo image trong Events:
  ```bash
  kubectl describe pod <pod-name> | grep -E "Image:|Failed|BackOff|Message:"
  ```
- Kiểm tra thông báo `exec format error` trong log container:
  ```bash
  kubectl logs <pod-name>
  ```
- Tạo Secret xác thực với private registry (sau đó gán vào `imagePullSecrets`):
  ```bash
  kubectl create secret docker-registry acr-secret \
    --docker-server=myregistry.azurecr.io \
    --docker-username=myuser \
    --docker-password=mypassword \
    --docker-email=devops@example.com
  ```
</details>

### Câu Hỏi 4: Trạng thái `CrashLoopBackOff` là gì, cơ chế backoff hoạt động ra sao và cần chạy những lệnh nào để tìm nguyên nhân lần dừng trước đó?

<details>
<summary>Đáp án</summary>

- **Bản chất**: `CrashLoopBackOff` xuất hiện khi container liên tục thoát bất thường hoặc thất bại bài kiểm tra liveness probe.
- **Cơ chế backoff**: Để bảo vệ tài nguyên của node, Kubernetes tự động lùi thời gian khởi động lại theo cấp số nhân (exponential backoff) từ **10 giây** đến tối đa **300 giây**.

**Lệnh kiểm tra nguyên nhân lần dừng trước đó**:
- Xem log của phiên container vừa kết thúc:
  ```bash
  kubectl logs <pod-name> --previous --tail=50
  ```
- Đọc lý do kết thúc và mã thoát trong `lastState.terminated`:
  ```bash
  kubectl describe pod <pod-name>
  kubectl get pod <pod-name> -o jsonpath='{range .status.containerStatuses[*]}{.name}{": lastState="}{.lastState.terminated.reason}{" exitCode="}{.lastState.terminated.exitCode}{"\n"}{end}'
  ```
</details>

### Câu Hỏi 5: Vì sao cấu hình Liveness Probe quá khắt khe có thể biến một sự cố nhỏ thành vòng lặp `CrashLoopBackOff` diện rộng (restart storm)?

<details>
<summary>Đáp án</summary>

Khi thiết lập `initialDelaySeconds` quá ngắn hoặc `timeoutSeconds` quá thấp cho các ứng dụng khởi động chậm (như Java Spring Boot), mỗi khi tải tăng làm ứng dụng phản hồi chậm, liveness probe sẽ đánh giá container thất bại. Kubelet lập tức khởi động lại container dù ứng dụng chỉ đang nghẽn tạm thời, tạo ra vòng lặp khởi động lại liên tục (**restart storm**) làm sập toàn bộ dịch vụ.
</details>

### Câu Hỏi 6: Giải thích ý nghĩa các mã thoát (exit code) `137`, `143` và `1` hoặc `2`. Làm sao phân biệt nguyên nhân exit code `137` ở cấp Pod và cấp Node?

<details>
<summary>Đáp án</summary>

- **Exit code `137`** (`128 + 9`, tín hiệu `SIGKILL`): Tiến trình bị hệ điều hành cưỡng chế dừng ngay lập tức, phổ biến nhất do Linux OOM Killer kích hoạt khi container dùng RAM vượt `limits.memory` hoặc node cạn kiệt RAM.
- **Exit code `143`** (`128 + 15`, tín hiệu `SIGTERM`): Hệ thống yêu cầu tiến trình dừng duyên dáng (graceful shutdown).
- **Exit code `1` hoặc `2`**: Thường phản ánh lỗi ứng dụng bên trong như sai cấu hình khởi chạy, thiếu biến môi trường hoặc ngoại lệ runtime chưa được xử lý.

**Cách phân biệt nguyên nhân `OOMKilled` (exit code `137`)**:
- **Cấp Pod**: Chạy `kubectl describe pod <pod-name>`. Nếu `Last State -> Terminated` có `Reason: OOMKilled`, container đã vượt `limits.memory` và bị cgroup gửi `SIGKILL`. Có thể theo dõi mức dùng thực tế bằng `kubectl top pod <pod-name> --containers`.
- **Cấp Node**: Chạy `kubectl describe node <node-name>`. Nếu điều kiện `MemoryPressure` là `True` (kèm log `dmesg -T` hoặc `journalctl -k` ghi nhận Linux kernel OOM Killer), nguyên nhân do worker node cạn kiệt RAM vật lý.
</details>

### Câu Hỏi 7: Lỗi `CreateContainerConfigError` xuất hiện khi nào và sử dụng lệnh gì để kiểm tra chi tiết?

<details>
<summary>Đáp án</summary>

Trạng thái `CreateContainerConfigError` (ở mức Container Waiting) xảy ra khi container không thể khởi tạo vì:
- Pod tham chiếu đến một **ConfigMap** hoặc **Secret** không tồn tại trong namespace.
- Tên khóa cấu hình khai báo trong trường `valueFrom` không tìm thấy trong dữ liệu của ConfigMap hoặc Secret tương ứng.

**Lệnh kiểm tra**:
```bash
kubectl describe pod <pod-name> | grep -A 5 "CreateContainerConfigError"
```
</details>

### Câu Hỏi 8: Khi nào Pod chuyển sang trạng thái `Evicted`, và tại sao việc bỏ trống khai báo `requests` lại gây nguy cơ Eviction diện rộng?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân `Evicted`**: Kubelet chủ động thu hồi và đẩy Pod ra khỏi node để giải phóng tài nguyên khi node gặp các áp lực cục bộ như thiếu bộ nhớ (`MemoryPressure`), thiếu dung lượng ổ đĩa (`DiskPressure`), hoặc cạn định danh tiến trình (`PIDPressure`). Có thể kiểm tra chi tiết qua `kubectl get pod <name> -o yaml`.
- **Cạm bẫy bỏ trống `requests`**: Pod không khai báo `requests` sẽ bị xếp vào nhóm chất lượng dịch vụ thấp nhất là **`BestEffort`**. Khi node gặp `MemoryPressure`, kubelet ưu tiên trục xuất toàn bộ Pod `BestEffort` đầu tiên trước các nhóm **`Burstable`** và **`Guaranteed`**, gây gián đoạn hàng loạt Pod cùng lúc.
</details>

### Câu Hỏi 9: Một Pod có trạng thái `Running` nhưng cột `READY` là `0/1` có ý nghĩa gì? Sự cố này ảnh hưởng thế nào đến Service và Ingress, và cần kiểm tra bằng các lệnh nào?

<details>
<summary>Đáp án</summary>

- **Ý nghĩa**: Container vẫn đang chạy (`Running`), nhưng bài kiểm tra **`readinessProbe`** thất bại nên Pod chưa sẵn sàng nhận lưu lượng (`0/1`).
- **Ảnh hưởng tới luồng mạng**: Kubelet lập tức loại bỏ địa chỉ IP của Pod khỏi danh sách **Endpoints** của Service. Khi Service không còn Endpoint nào sẵn sàng, lưu lượng từ client gửi qua Ingress Controller sẽ nhận lỗi **HTTP 503 Service Unavailable**, hoặc nhận lỗi từ chối kết nối (**connection refused**) từ tầng mạng `kube-proxy`.

**Lệnh kiểm tra**:
- Kiểm tra điều kiện trạng thái và lỗi probe trên Pod:
  ```bash
  kubectl describe pod <pod-name> | grep -A 10 Conditions:
  ```
- Xác nhận danh sách IP trong Endpoints của Service:
  ```bash
  kubectl get endpoints <service-name>
  ```
</details>

### Câu Hỏi 10: Những nguyên nhân nào thường gây lỗi định tuyến mạng tầng Service và lỗi giao tiếp giữa các Pod khác namespace? Cần kiểm tra những trường nào?

<details>
<summary>Đáp án</summary>

- **Lỗi định tuyến nội bộ Service**:
  - Trường `spec.selector` của Service không khớp với nhãn `metadata.labels` của Pod (ví dụ thừa ký tự hoặc khoảng trắng; Kubernetes không báo lỗi cú pháp khi tạo Service nên lỗi này xảy ra âm thầm và gây HTTP 503).
  - Trường `spec.ports[].targetPort` của Service không khớp với cổng mạng mà ứng dụng thực tế đang lắng nghe.
- **Lỗi giao tiếp khác namespace**:
  - Không dùng tên miền đầy đủ **FQDN** theo chuẩn `<service-name>.<namespace>.svc.cluster.local`.
  - Lưu lượng bị chặn bởi quy tắc **NetworkPolicy** khi namespace áp dụng chính sách mặc định từ chối (default deny).

**Lệnh kiểm tra khớp nhãn và Endpoints**:
```bash
kubectl get service <service-name> -o jsonpath='{.spec.selector}'
kubectl get pods --show-labels
kubectl get endpoints <service-name>
```
</details>

### Câu Hỏi 11: Tại sao Pod hoặc Namespace có thể bị kẹt ở trạng thái `Terminating`? Cần gỡ `finalizers` như thế nào và vì sao không nên vội vàng dùng `--force --grace-period=0` khi node `NotReady`?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân Pod kẹt `Terminating`**: Tiến trình trong hook `preStop` bị treo quá thời gian gia hạn, Pod còn `metadata.finalizers` chưa được controller hoàn tất xử lý, hoặc worker node chứa Pod mất kết nối (`NotReady`).
- **Nguyên nhân Namespace kẹt `Terminating`**: Bên trong namespace còn tài nguyên con chứa finalizers chưa giải phóng, hoặc một API service mở rộng (CRD) mất phản hồi khiến control plane không thể dọn dẹp sạch.

**Lệnh kiểm tra và gỡ `finalizers`**:
- Với Pod:
  ```bash
  kubectl get pod <pod-name> -o jsonpath='{.metadata.finalizers}'
  kubectl patch pod <pod-name> -p '{"metadata":{"finalizers":null}}'
  ```
- Với Namespace:
  ```bash
  kubectl get namespace <namespace-name> -o json | \
    jq '.spec.finalizers = []' | \
    kubectl replace --raw "/api/v1/namespaces/<namespace-name>/finalize" -f -
  ```

**Cạm bẫy `--force --grace-period=0` khi node `NotReady`**: Lệnh này chỉ xóa bản ghi Pod trong `etcd` chứ không dừng tiến trình thực tế đang chạy trên worker node. Nếu Pod thuộc StatefulSet hoặc gắn volume `ReadWriteOnce (RWO)`, Pod mới được tạo trên node khác sẽ gắn cùng volume đó, gây tranh chấp dữ liệu (**split-brain**) hoặc hỏng file system.
</details>

### Câu Hỏi 12: Trạng thái `ProgressDeadlineExceeded` trên Deployment xảy ra khi nào? Ngoài ra, hãy nêu các lỗi CI/CD và Helm phổ biến cùng cách xử lý khóa release bị treo của Helm?

<details>
<summary>Đáp án</summary>

- **`ProgressDeadlineExceeded`**: Xuất hiện khi Deployment controller nhận thấy ReplicaSet phiên bản mới không đạt đủ số lượng Pod sẵn sàng trong thời hạn quy định (mặc định **600 giây**).
  - Kiểm tra bằng:
    ```bash
    kubectl rollout status deployment/<deployment-name>
    kubectl describe deployment <deployment-name> | grep -A 5 Conditions:
    ```
- **Các lỗi CI/CD và Helm phổ biến**:
  - Lỗi `Forbidden` do ServiceAccount thiếu quyền RBAC.
  - Lỗi timeout của cờ `--wait` khi Pod chưa đạt trạng thái sẵn sàng kịp thời hạn.
  - Lỗi `another operation is in progress` khi phiên Helm trước bị ngắt giữa chừng và để lại Secret mang trạng thái `pending-upgrade` làm khóa.

**Cách xử lý lỗi khóa Helm bị treo**:
1. Liệt kê các Secret release của Helm (`owner=helm`):
   ```bash
   kubectl get secret -l owner=helm,name=<release-name> --sort-by=.metadata.creationTimestamp
   ```
2. Xác định Secret mới nhất đang bị kẹt trạng thái pending và xóa đi để release trở về trạng thái ổn định trước đó:
   ```bash
   kubectl delete secret <pending-release-secret-name>
   ```
</details>
