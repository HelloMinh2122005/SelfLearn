# Ôn Tập: 6_7_1 Xác Thực, RBAC và ServiceAccount

### Câu Hỏi 1: Khi một yêu cầu được gửi tới Kubernetes API Server, hệ thống thực hiện hai bước kiểm soát an ninh nào và mã lỗi HTTP trả về khi thất bại ở từng bước là gì?

<details>
<summary>Đáp án</summary>

Mọi yêu cầu gửi tới Kubernetes API Server đều đi qua hai bước kiểm soát độc lập và tuần tự:

1. **Xác thực (Authentication - AuthN)**: Xác minh danh tính người gọi (qua Bearer Token, X.509 client certificate, OIDC...). Nếu xác thực thất bại (token không hợp lệ hoặc hết hạn), API Server trả về mã lỗi **`401 Unauthorized`**.
2. **Phân quyền (Authorization - AuthZ)**: Sau khi xác định được danh tính, RBAC Engine kiểm tra xem danh tính đó có được phép thực hiện thao tác (`verb`) trên tài nguyên (`resource`) tại phạm vi tương ứng hay không. Nếu không đủ quyền, hệ thống trả về mã lỗi **`403 Forbidden`**.

Chỉ khi vượt qua cả hai bước này, yêu cầu mới được xử lý và lưu trạng thái tài nguyên vào `etcd` (ví dụ trả về `201 Created` khi tạo Pod thành công).
</details>

### Câu Hỏi 2: User Account và ServiceAccount trong Kubernetes khác nhau như thế nào về cách quản lý, đối tượng sử dụng và định dạng username của ServiceAccount trong RBAC?

<details>
<summary>Đáp án</summary>

1. **User Account (dành cho con người)**: Kubernetes **không** có đối tượng lưu trữ User Account trong `etcd`. Việc xác thực danh tính con người được ủy quyền hoàn toàn cho các cơ chế bên ngoài như chứng chỉ số **X.509 client certificate** hoặc **OpenID Connect (OIDC)**.
2. **ServiceAccount (dành cho máy móc/workload)**: Là một **namespaced resource** (tài nguyên cấp namespace) được tạo và quản lý trực tiếp bên trong Kubernetes API, dùng để cấp danh tính bảo mật cho Pod workload và các pipeline CI/CD runner.
3. **Định dạng username chuẩn hóa**: Trong hệ thống phân quyền RBAC, mỗi ServiceAccount được định danh duy nhất bằng chuỗi:
   ```text
   system:serviceaccount:<namespace>:<serviceaccount-name>
   ```
</details>

### Câu Hỏi 3: Một quy tắc phân quyền (rule) trong Kubernetes RBAC được cấu thành từ bộ ba thành phần nào? Hãy giải thích ý nghĩa của từng thành phần.

<details>
<summary>Đáp án</summary>

Một rule trong Kubernetes RBAC được định hình bởi 3 thành phần cốt lõi:

1. **`apiGroups`**: Nhóm API chứa tài nguyên cần cấp quyền. Ví dụ: `""` (nhóm core API chứa `pods`, `services`, `configmaps`, `secrets`) hoặc `"apps"` (chứa `deployments`, `statefulsets`, `replicasets`).
2. **`resources`**: Loại tài nguyên cụ thể chịu tác động, ví dụ: `pods`, `pods/log`, `deployments`, `services`, `configmaps`, `secrets`.
3. **`verbs`**: Các hành động được phép thực thi trên tài nguyên đó, ví dụ: `get`, `list`, `watch`, `create`, `update`, `patch`, `delete` (hoặc `*`).
</details>

### Câu Hỏi 4: Sự khác biệt cốt lõi giữa `Role` và `ClusterRole` trong Kubernetes RBAC là gì?

<details>
<summary>Đáp án</summary>

- **`Role`**: Là tài nguyên thuộc phạm vi **namespace (namespaced)**. Danh sách các quy tắc quyền hạn định nghĩa trong `Role` chỉ có hiệu lực bên trong chính namespace chứa nó.
- **`ClusterRole`**: Là tài nguyên thuộc phạm vi **toàn cụm (cluster-scoped)**. Nó được dùng để:
  - Định nghĩa quyền cho các tài nguyên phi namespace (non-namespaced resources) như `Node`, `PersistentVolume`, `Namespace`.
  - Hoặc đóng vai trò làm khuôn mẫu quyền chuẩn có thể tái sử dụng trên toàn bộ các namespace.
</details>

### Câu Hỏi 5: Khi một `ClusterRole` được gắn cho ServiceAccount thông qua `RoleBinding` (thay vì `ClusterRoleBinding`), phạm vi hiệu lực của quyền hạn đó sẽ như thế nào?

<details>
<summary>Đáp án</summary>

Khi một `ClusterRole` được liên kết thông qua **`RoleBinding`**, các quyền hạn được cấp **chỉ có hiệu lực giới hạn bên trong namespace chứa `RoleBinding` đó**.

Ngược lại, nếu sử dụng **`ClusterRoleBinding`** để gắn `ClusterRole`, đối tượng được cấp quyền sẽ có quyền thao tác trên phạm vi **toàn cụm** (bao gồm tất cả các namespace hiện có và sẽ tạo trong tương lai).
</details>

### Câu Hỏi 6: Làm thế nào để quản trị viên kiểm tra nhanh xem một ServiceAccount có quyền thực thi một thao tác cụ thể hoặc liệt kê toàn bộ quyền của nó trong một namespace mà không cần lấy token đăng nhập thực tế?

<details>
<summary>Đáp án</summary>

Quản trị viên sử dụng lệnh `kubectl auth can-i` kết hợp với cờ **Impersonation (`--as=...`)** để giả lập đứng ở góc nhìn của ServiceAccount đó:

1. **Kiểm tra một quyền cụ thể**:
   ```bash
   kubectl auth can-i <verb> <resource> \
     --as=system:serviceaccount:<ns>:<sa> \
     -n <ns>
   ```
   Ví dụ: `kubectl auth can-i create deployments --as=system:serviceaccount:payments:helm-deployer -n payments` (kết quả trả về `yes` hoặc `no`).

2. **Liệt kê toàn bộ quyền hiện có trong namespace**:
   Thêm cờ `--list`:
   ```bash
   kubectl auth can-i --list \
     --as=system:serviceaccount:<ns>:<sa> \
     -n <ns>
   ```
   Lệnh này hiển thị đầy đủ danh sách `verbs`, `resources` và `apiGroups` mà ServiceAccount sở hữu trong namespace chỉ định.
</details>

### Câu Hỏi 7: Từ phiên bản Kubernetes v1.24 trở đi, cơ chế cấp phát token cho ServiceAccount và gắn vào Pod đã thay đổi như thế nào so với trước đây?

<details>
<summary>Đáp án</summary>

1. **Không còn tự động tạo Secret token vĩnh viễn**: Từ Kubernetes v1.24, hệ thống không còn tự động sinh ra đối tượng `Secret` chứa token vĩnh viễn mỗi khi tạo một ServiceAccount mới, nhằm loại bỏ rủi ro rò rỉ credential tĩnh.
2. **Token động qua TokenRequest API & Projected Volume**: Token cấp cho Pod hiện nay được tạo động thông qua **TokenRequest API** và gắn vào container dưới dạng **projected volume (`serviceAccountToken`)**. Token này có thời hạn sử dụng ngắn hạn và được **`kubelet` tự động xoay vòng (rotate)** trước khi hết hạn.
</details>

### Câu Hỏi 8: Vì sao và bằng cách nào ta ngăn không cho Pod tự động gắn ServiceAccount token vào bên trong container?

<details>
<summary>Đáp án</summary>

- **Lý do**: Mặc định `kubelet` tự động gắn credential token của ServiceAccount vào thư mục `/var/run/secrets/kubernetes.io/serviceaccount` bên trong mọi container. Với các ứng dụng web hoặc microservice thông thường không cần giao tiếp với Kubernetes API Server, việc để sẵn token làm tăng rủi ro bị kẻ tấn công lợi dụng lỗ hổng ứng dụng để do thám hoặc xâm nhập cụm.
- **Cách cấu hình**: Thiết lập trường sau trong cấu hình **Pod spec** hoặc **ServiceAccount spec**:
  ```yaml
  automountServiceAccountToken: false
  ```
</details>

### Câu Hỏi 9: Trên Kubernetes v1.24 trở lên, nếu một CI/CD runner nằm bên ngoài cụm cần một token tĩnh để xác thực với API Server, kỹ sư phải tạo Secret như thế nào?

<details>
<summary>Đáp án</summary>

Kỹ sư phải chủ động tạo một `Secret` thuộc loại **`kubernetes.io/service-account-token`** kèm annotation **`kubernetes.io/service-account.name`** trỏ tới tên ServiceAccount tương ứng (trong cùng namespace):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: helm-deployer-static-token
  namespace: payments
  annotations:
    kubernetes.io/service-account.name: "helm-deployer"
type: kubernetes.io/service-account-token
```

Sau khi apply, kỹ sư có thể trích xuất và giải mã token bằng lệnh:
```bash
kubectl get secret helm-deployer-static-token -n payments -o jsonpath='{.data.token}' | base64 --decode
```
</details>

### Câu Hỏi 10: Khi cấu hình RBAC tối thiểu cho tài khoản CI deployer chạy lệnh `helm upgrade --install --wait`, tại sao `Role` bắt buộc phải có quyền đối với `secrets` và quyền đọc trên `pods`?

<details>
<summary>Đáp án</summary>

1. **Quyền đối với `secrets` (`get`, `list`, `watch`, `create`, `update`, `patch`, `delete`)**:
   Helm 3 lưu trữ toàn bộ trạng thái release và lịch sử revision dưới dạng **Kubernetes Secret** (mặc định) ngay trong namespace nơi ứng dụng được triển khai. Nếu thiếu quyền thao tác trên `secrets`, lệnh `helm upgrade` hoặc `helm install` sẽ bị chặn ngay lập tức với lỗi `403 Forbidden`.
2. **Quyền đọc đối với `pods` (`get`, `list`, `watch`, có thể kèm `pods/log`)**:
   Khi bật cờ `--wait`, Helm phải liên tục theo dõi trạng thái sẵn sàng (Ready) của các Pod thuộc Deployment/StatefulSet. Nếu thiếu quyền đọc `pods`, dù tài nguyên ứng dụng đã được tạo và chạy, Helm vẫn sẽ chờ đến khi hết hạn thời gian (thường là 5 phút) rồi báo lỗi timeout.
</details>

### Câu Hỏi 11: Tại sao việc sử dụng `ClusterRoleBinding` (quyền quản trị toàn cụm) cho pipeline CI/CD được xem là một cạm bẫy bảo mật nghiêm trọng?

<details>
<summary>Đáp án</summary>

Việc dùng `ClusterRoleBinding` để cấp quyền quản trị toàn cụm cho pipeline CI/CD vi phạm nghiêm trọng **nguyên tắc đặc quyền tối thiểu (Least Privilege)**. Nếu token của CI runner bị rò rỉ, kẻ tấn công không chỉ kiểm soát được namespace của ứng dụng đang deploy mà có thể chiếm đoạt toàn bộ tài nguyên và bí mật (Secrets) của tất cả các dự án và namespace khác trong cụm.

Giải pháp đúng là tạo `Role` giới hạn tài nguyên cần thiết và gắn qua `RoleBinding` trong đúng namespace triển khai (ví dụ namespace `payments`).
</details>

### Câu Hỏi 12: Hãy đối chiếu các thành phần cốt lõi của Kubernetes RBAC với mô hình Microsoft Azure Cloud RBAC (định danh workload, tập hợp quyền, gán quyền, và phản hồi khi thiếu quyền).

<details>
<summary>Đáp án</summary>

| Tiêu chí | Kubernetes RBAC | Microsoft Azure Cloud RBAC |
| :--- | :--- | :--- |
| **Định danh workload** | `ServiceAccount` trong namespace | `Service Principal` / `Managed Identity` trong Microsoft Entra ID |
| **Tập hợp quyền** | `Role` (namespace) hoặc `ClusterRole` (cụm) | `Role Definition` (Built-in hoặc Custom Role) |
| **Gán quyền** | `RoleBinding` hoặc `ClusterRoleBinding` | `Role Assignment` gắn với Scope (Resource Group, Subscription) |
| **Lỗi khi thiếu quyền** | HTTP `403 Forbidden` kèm thông báo chi tiết verb và resource bị chặn | Lỗi `AuthorizationFailed` (HTTP `403`) từ Azure Resource Manager |
</details>
