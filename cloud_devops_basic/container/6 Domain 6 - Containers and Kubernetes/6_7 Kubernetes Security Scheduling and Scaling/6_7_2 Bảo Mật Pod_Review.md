# Ôn Tập: 6_7_2 Bảo Mật Pod (Pod Security & Hardening)

### Câu Hỏi 1: Tại sao một container mặc dù đã được cô lập bằng cgroups và namespaces vẫn tiềm ẩn rủi ro bảo mật lớn nếu không cấu hình bảo vệ cho Pod?

<details>
<summary>Đáp án</summary>

Về bản chất, container là một tiến trình chạy trực tiếp trên nhân Linux của máy chủ host. Mặc định, nếu không có cấu hình bảo vệ, tiến trình container thường chạy dưới quyền quản trị viên tối cao (root), có thể tự do ghi đè hệ thống tệp và giữ nhiều quyền hạn nhân nguy hiểm. Nếu ứng dụng bên trong gặp lỗ hổng thực thi mã từ xa (RCE), kẻ tấn công có thể chèn mã độc vào file thực thi hoặc khai thác nhân Linux để vượt rào và chiếm quyền điều khiển máy chủ host.
</details>

### Câu Hỏi 2: Pod Security Admission (PSA) ra đời để thay thế cho cơ chế nào, và mốc phiên bản Kubernetes nào đánh dấu sự thay đổi này?

<details>
<summary>Đáp án</summary>

Pod Security Admission (PSA) tích hợp sẵn trong API Server (kết hợp với bộ tiêu chuẩn Pod Security Standards - PSS) ra đời để thay thế hoàn toàn cho **PodSecurityPolicy (PSP)**.

PSP đã bị đánh dấu *deprecate* ở phiên bản Kubernetes **v1.21** và chính thức bị **gỡ bỏ hoàn toàn từ Kubernetes v1.25**.
</details>

### Câu Hỏi 3: Bộ tiêu chuẩn Pod Security Standards (PSS) gồm những cấp độ nào và mục đích sử dụng của từng cấp độ là gì?

<details>
<summary>Đáp án</summary>

PSS chuẩn hóa chính sách an ninh thành 3 cấp độ:

1. **Privileged**: Cấp độ có phạm vi quyền hạn rộng nhất, hoàn toàn không áp đặt giới hạn bảo mật (cho phép container `privileged` hoặc dùng chung tài nguyên host). Cấp độ này chỉ dành riêng cho CNI plugin, storage driver hoặc các Pod hệ thống.
2. **Baseline**: Ngăn chặn các lỗ hổng leo thang đặc quyền cơ bản đã biết với cấu hình mặc định tối thiểu (chặn container `privileged` và các cổng chia sẻ host), nhưng vẫn cho phép container chạy dưới quyền `root` nếu image mặc định như vậy.
3. **Restricted**: Thắt chặt an ninh tối đa theo thực tiễn phòng thủ chuyên sâu cho các ứng dụng trọng yếu. Bắt buộc chạy non-root, cấm leo thang quyền hạn, yêu cầu `seccompProfile`, tước bỏ toàn bộ `capabilities` và khuyến nghị khóa hệ thống tệp gốc ở chế độ chỉ đọc.
</details>

### Câu Hỏi 4: Pod Security Admission (PSA) hoạt động ở đâu, sử dụng cơ chế nào để gắn chính sách, và 3 chế độ kiểm soát (`enforce`, `audit`, `warn`) khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

PSA là một admission controller tích hợp sẵn trong `kube-apiserver`, kiểm tra tính hợp lệ của Pod dựa trên các **nhãn (labels) gắn trực tiếp trên Namespace**.

3 chế độ kiểm soát (có thể kết hợp cùng lúc trên một Namespace) gồm:
- **`enforce`**: Từ chối tạo Pod (ví dụ trả về lỗi `403 Forbidden`) nếu Pod vi phạm tiêu chuẩn PSS đã cấu hình.
- **`audit`**: Vẫn cho phép tạo Pod vi phạm, nhưng ghi nhận sự kiện vi phạm vào Kubernetes Audit Log.
- **`warn`**: Vẫn cho phép tạo Pod vi phạm, nhưng hiển thị thông điệp cảnh báo cho người dùng trên terminal khi thực thi lệnh.

Ngoài ra, quản trị viên có thể ghim phiên bản PSS áp dụng bằng nhãn `pod-security.kubernetes.io/<mode>-version` (ví dụ `pod-security.kubernetes.io/enforce-version=latest`).
</details>

### Câu Hỏi 5: Làm thế nào để gắn nhãn PSA ở cấp độ `restricted` cho cả 3 chế độ trên một Namespace tên `secure-apps` bằng `kubectl`?

<details>
<summary>Đáp án</summary>

Quản trị viên dùng lệnh `kubectl label namespace` để gắn các nhãn `pod-security.kubernetes.io/<mode>` và phiên bản tương ứng:

```bash
kubectl label namespace secure-apps \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest

kubectl label namespace secure-apps \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/audit-version=latest

kubectl label namespace secure-apps \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/warn-version=latest
```
</details>

### Câu Hỏi 6: Phân biệt phạm vi áp dụng (Pod-level vs Container-level) của các thuộc tính trong `securityContext`, và điều gì xảy ra nếu khai báo sai vị trí?

<details>
<summary>Đáp án</summary>

Trong manifest Kubernetes, các thuộc tính `securityContext` được phân tách rõ phạm vi:
- **Chỉ áp dụng ở cấp Pod (`spec.securityContext`)**: `fsGroup`.
- **Chỉ áp dụng ở cấp Container (`spec.containers[*].securityContext`)**: `allowPrivilegeEscalation`, `readOnlyRootFilesystem`, `capabilities`.
- **Áp dụng được ở cả cấp Pod và Container**: `runAsNonRoot`, `runAsUser`, `runAsGroup`, `seccompProfile`.

Nếu khai báo sai vị trí (ví dụ đặt `fsGroup` vào cấp Container hoặc đặt `readOnlyRootFilesystem` ở cấp Pod), Kubernetes sẽ báo lỗi từ chối cấu hình khi gửi manifest đến cụm.
</details>

### Câu Hỏi 7: Phân biệt vai trò của `runAsNonRoot: true`, `runAsUser`, `runAsGroup` và `fsGroup`. Tại sao chuẩn `restricted` bắt buộc `runAsUser` phải là số nguyên thay vì chuỗi tên người dùng?

<details>
<summary>Đáp án</summary>

- **`runAsNonRoot: true`**: Đóng vai trò kiểm tra điều kiện, bắt buộc tiến trình chạy với UID khác `0`. Nếu manifest chỉ đặt `runAsNonRoot: true` mà container image mặc định chạy bằng UID `0` (root), **kubelet** sẽ từ chối khởi động container.
- **`runAsUser`**: Chủ động ép tiến trình container chạy với một mã số người dùng (numeric UID) cụ thể (ví dụ `10001`).
- **`runAsGroup`**: Xác định mã số nhóm (numeric GID) cụ thể cho tiến trình container.
- **`fsGroup`** (cấp Pod): Xác định mã số nhóm bổ sung áp dụng cho Pod và tự động gán quyền sở hữu nhóm đó cho các volume được mount vào Pod.

Chuẩn `restricted` bắt buộc `runAsUser` phải là **mã số nguyên** (thay vì chuỗi như `"appuser"`) vì tại thời điểm xét duyệt manifest, **API Server không thể đọc tệp phân giải tên người dùng bên trong container image**.
</details>

### Câu Hỏi 8: Tại sao việc đặt `runAsNonRoot: true` thôi là chưa đủ mà cần kết hợp thêm `allowPrivilegeEscalation: false`?

<details>
<summary>Đáp án</summary>

`runAsNonRoot: true` chỉ đảm bảo tiến trình khởi chạy ban đầu không phải là root (UID ≠ 0), nhưng không thể ngăn hoàn toàn việc tiến trình con kích hoạt các tệp thực thi mang cờ `setuid` để tự nâng quyền lên cao hơn.

Khi cấu hình `allowPrivilegeEscalation: false` ở cấp Container, Kubernetes sẽ kích hoạt cờ **`no_new_privs`** của nhân Linux, giúp ngăn chặn tuyệt đối tiến trình con giành thêm quyền hạn cao hơn tiến trình cha.
</details>

### Câu Hỏi 9: Ý nghĩa của `capabilities: drop: ["ALL"]` và `seccompProfile: type: RuntimeDefault` trong `securityContext` là gì?

<details>
<summary>Đáp án</summary>

- **`capabilities: drop: ["ALL"]`** (cấp Container): Tước bỏ toàn bộ các Linux capabilities mặc định của container nhằm thu hẹp tối đa bề mặt tấn công.
- **`seccompProfile: type: RuntimeDefault`** (cấp Pod hoặc Container): Áp dụng hồ sơ lọc lệnh gọi hệ thống (syscall) mặc định của container runtime để chặn các syscall nguy hiểm tác động lên nhân Linux.
</details>

### Câu Hỏi 10: Khi bật `readOnlyRootFilesystem: true`, tại sao ứng dụng Java / Spring Boot thường bị sập khi khởi động và giải pháp khắc phục chuẩn là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: `readOnlyRootFilesystem: true` khóa toàn bộ hệ thống tệp gốc của container ở chế độ chỉ đọc để ngăn chặn việc ghi hoặc chỉnh sửa tệp trái phép. Tuy nhiên, ứng dụng Java hoặc Spring Boot chạy máy chủ web nhúng (như Tomcat nhúng) bắt buộc phải có quyền ghi vào thư mục `/tmp` để tạo file PID, domain socket, bung file nén và xử lý tệp tạm. Khi `/tmp` bị khóa chỉ đọc, ứng dụng sẽ gặp lỗi và sập ngay khi khởi động.
- **Cách khắc phục**: Kết hợp `readOnlyRootFilesystem: true` với một volume **`emptyDir: {}`** và mount riêng vào đường dẫn **`/tmp`** của container. Volume `emptyDir` được khởi tạo rỗng khi Pod được tạo, cho phép ghi dữ liệu tạm thời, và có vòng đời gắn liền hoàn toàn với Pod trên Worker Node.
</details>

### Câu Hỏi 11: Mô tả luồng xử lý từ lúc người dùng chạy `kubectl apply -f pod.yaml` cho tới khi Pod an toàn chạy trên Worker Node.

<details>
<summary>Đáp án</summary>

1. Người dùng gửi yêu cầu `kubectl apply -f pod.yaml` tới **`kube-apiserver`**.
2. Bộ kiểm soát **Pod Security Admission (PSA)** kiểm tra nhãn bảo mật trên Namespace (ví dụ `pod-security.kubernetes.io/enforce`).
3. Nếu Pod vi phạm chuẩn (ví dụ `enforce=restricted`), PSA từ chối tạo Pod ngay lập tức (`403 Forbidden`). Nếu hợp lệ, cấu hình Pod được lưu vào **`etcd`**.
4. **`Kubelet`** trên Worker Node nhận thông tin và khởi chạy Pod với các ranh giới bảo mật đã cấu hình: gán `fsGroup` ở cấp Pod, áp dụng UID/GID non-root, kích hoạt cờ `no_new_privs`, `seccomp`, khóa Root Filesystem ở chế độ Read-Only, đồng thời gắn volume `emptyDir` có quyền Read-Write vào thư mục `/tmp`.
</details>

### Câu Hỏi 12: Sau khi triển khai Pod đạt chuẩn `restricted` và gắn `emptyDir` vào `/tmp`, làm sao để kiểm chứng nhanh bằng `kubectl` cả hai cơ chế: (1) khóa ghi Root Filesystem vs cho phép ghi `/tmp`, và (2) PSA từ chối Pod vi phạm?

<details>
<summary>Đáp án</summary>

1. **Kiểm chứng `readOnlyRootFilesystem` và `/tmp`**: Dùng `kubectl exec` vào Pod để thử tạo file ở hai vị trí:
   - Thử ghi vào thư mục gốc `/app`: `kubectl exec -it springboot-secure-app -n secure-apps -- touch /app/hack.sh` → Lệnh **thất bại** do hệ thống tệp gốc ở chế độ Read-Only.
   - Thử ghi vào `/tmp`: `kubectl exec -it springboot-secure-app -n secure-apps -- touch /tmp/valid-temp.log` → Lệnh **thành công** nhờ volume `emptyDir`.
2. **Kiểm chứng PSA chặn Pod vi phạm**: Chạy thử một Pod cấu hình `privileged: true` trong Namespace `secure-apps` (đang đặt `enforce=restricted`), ví dụ:
   ```bash
   kubectl run privileged-test \
     --image=busybox:1.36 \
     --namespace=secure-apps \
     --restart=Never \
     --overrides='{"spec":{"containers":[{"name":"test","image":"busybox:1.36","securityContext":{"privileged":true}}]}}'
   ```
   API Server sẽ lập tức từ chối tiếp nhận yêu cầu vì vi phạm chính sách `restricted`.
</details>
