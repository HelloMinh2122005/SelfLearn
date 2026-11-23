# Ôn Tập: 6_7_4 Bảo Vệ Secret và Chuỗi Cung Ứng

### Câu Hỏi 1: Mặc định Kubernetes lưu trữ Secret như thế nào và điều này gây ra rủi ro bảo mật gì?

<details>
<summary>Đáp án</summary>

Mặc định, Kubernetes Secret lưu dữ liệu dạng key-value được mã hóa bằng **Base64** (chứ không phải mã hóa cryptographic), và `kube-apiserver` ghi các Secret vào `etcd` dưới dạng văn bản thô (**plaintext**).

Rủi ro bảo mật là bất kỳ ai có quyền truy cập trực tiếp vào ổ đĩa host của `etcd` hoặc file snapshot backup của `etcd` đều có thể đọc toàn bộ nội dung Secret mà không cần đi qua cơ chế xác thực RBAC của API server.
</details>

### Câu Hỏi 2: Để kích hoạt Encryption at rest cho Secret trong `etcd`, quản trị viên cần cấu hình những thành phần nào?

<details>
<summary>Đáp án</summary>

Quản trị viên cần tạo file cấu hình **`EncryptionConfiguration`** (theo chuẩn `apiserver.config.k8s.io/v1`, khai báo tài nguyên `secrets` và danh sách `providers`), sau đó truyền đường dẫn file này vào tiến trình `kube-apiserver` thông qua cờ dòng lệnh **`--encryption-provider-config`** (ví dụ trong manifest `/etc/kubernetes/manifests/kube-apiserver.yaml`).
</details>

### Câu Hỏi 3: Kubernetes hỗ trợ những encryption provider nào trong `EncryptionConfiguration`, và thứ tự khai báo trong danh sách `providers` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Trong `EncryptionConfiguration`, Kubernetes hỗ trợ các provider như `aescbc`, `secretbox`, `aesgcm`, `kms` và `identity` (đại diện cho dữ liệu không mã hóa).

Thứ tự trong danh sách `providers` rất quan trọng:
- **Provider đứng đầu tiên** được dùng để mã hóa khi ghi dữ liệu mới vào `etcd`.
- **Các provider phía sau** được dùng để giải mã dữ liệu đã được ghi trước đó. Ví dụ, đặt `identity: {}` ở phía sau `aescbc` giúp API server vẫn đọc được các Secret cũ chưa kịp mã hóa.
</details>

### Câu Hỏi 4: Trong môi trường sản xuất (production), Kubernetes khuyến nghị dùng provider nào cho Encryption at rest, KMS v2 cải thiện gì, và các dịch vụ managed Kubernetes hỗ trợ ra sao?

<details>
<summary>Đáp án</summary>

- **Khuyến nghị production**: Sử dụng provider **`kms`** (Key Management Service) để ủy quyền việc quản lý và lưu trữ khóa mã hóa cho hệ thống KMS chuyên dụng bên ngoài cụm.
- **KMS v2** (hỗ trợ ổn định từ **Kubernetes v1.29**): Cải thiện hiệu năng giải mã, hỗ trợ cache khóa DEK (Data Encryption Key) cục bộ và tự động xoay vòng khóa (**key rotation**) mà không cần khởi động lại `kube-apiserver`.
- **Managed Kubernetes**: AKS, EKS và GKE tích hợp sẵn tùy chọn mã hóa `etcd` với dịch vụ KMS đám mây tương ứng là **Azure Key Vault**, **AWS KMS** và **Google Cloud KMS**.
</details>

### Câu Hỏi 5: Vì sao sau khi bật `EncryptionConfiguration`, các Secret cũ trong `etcd` vẫn chưa được bảo vệ, và cách xử lý thực tế là gì?

<details>
<summary>Đáp án</summary>

`kube-apiserver` chỉ thực hiện mã hóa khi một đối tượng được **ghi mới hoặc cập nhật**. Các Secret đã tồn tại từ trước trong `etcd` sẽ không tự động được mã hóa lại và vẫn nằm dưới dạng plaintext.

Để khắc phục ngay sau khi bật encryption provider, quản trị viên phải chạy lệnh đọc toàn bộ Secret và ghi lại để API server mã hóa chúng thành ciphertext:
```bash
kubectl get secrets -A -o json | kubectl replace -f -
```
</details>

### Câu Hỏi 6: Trong Kubernetes RBAC, tài nguyên `secrets` thuộc API group nào, và vì sao quyền `list` hoặc `watch` Secret lại nguy hiểm hơn nhiều so với quyền `get`?

<details>
<summary>Đáp án</summary>

Tài nguyên `secrets` thuộc **core API group** (khai báo bằng chuỗi rỗng `""` trong `apiGroups`).

Sự khác biệt về mức độ rủi ro giữa `get` và `list`/`watch`:
- Quyền **`get`** có thể giới hạn cho từng Secret cụ thể bằng cách khai báo danh sách **`resourceNames`** trong `Role`.
- Quyền **`list`** hoặc **`watch`** không thể hạn chế bằng `resourceNames`, nên cho phép người dùng hoặc ServiceAccount đọc và tải về toàn bộ nội dung của tất cả Secret trong namespace đó. Nếu ServiceAccount có quyền `list Secret` bị chiếm đoạt, toàn bộ mật khẩu, token và khóa bí mật trong namespace sẽ bị lộ.
</details>

### Câu Hỏi 7: Kubernetes RBAC có cho phép giới hạn một ServiceAccount chỉ được đọc một key cụ thể bên trong trường `data` của Secret hay không?

<details>
<summary>Đáp án</summary>

**Không.** Kubernetes RBAC không hỗ trợ phân quyền ở mức trường dữ liệu (**field-level authorization**), do đó không thể hạn chế quyền truy cập vào các key cụ thể bên trong trường `data` của một đối tượng Secret.
</details>

### Câu Hỏi 8: Làm thế nào để kiểm tra thực tế bằng `kubectl` xem một ServiceAccount có quyền `get` đúng một Secret cụ thể và không có quyền `list` toàn bộ Secret trong namespace hay không?

<details>
<summary>Đáp án</summary>

Sử dụng lệnh `kubectl auth can-i` kèm tham số `--as` trỏ tới ServiceAccount. Ví dụ với ServiceAccount `payment-sa` và Secret `payment-api-token` trong namespace `backend`:

```bash
# Kiểm tra quyền đọc đúng Secret cụ thể (kỳ vọng: yes)
kubectl auth can-i get secret/payment-api-token --as=system:serviceaccount:backend:payment-sa -n backend

# Kiểm tra quyền list toàn bộ Secret trong namespace (kỳ vọng: no)
kubectl auth can-i list secrets --as=system:serviceaccount:backend:payment-sa -n backend
```
</details>

### Câu Hỏi 9: Tấn công chuỗi cung ứng container (`image tampering`) là gì, và tại sao phải ký và tham chiếu image theo digest `sha256` thay vì mutable tag?

<details>
<summary>Đáp án</summary>

Tấn công chuỗi cung ứng container (`container supply chain attack`) xảy ra khi kẻ tấn công can thiệp sửa đổi image trên registry hoặc đánh tráo tag image (**image tampering**).

Các tag như `latest` hay `v1.0.0` mang tính khả biến (**mutable**), nghĩa là kẻ tấn công hoặc quy trình build khác có thể ghi đè (tag overwrite) một image chứa mã độc lên cùng tag đó trong khi chữ ký cũ vẫn hiển thị hợp lệ trên registry. Ngược lại, **digest SHA256** (`image@sha256:...`) là mã băm bất biến đại diện cho nội dung chính xác của image, đảm bảo image chạy trên cụm khớp đúng với image đã được kiểm tra và ký số.
</details>

### Câu Hỏi 10: Cosign là gì, nó lưu chữ ký số ở đâu, và quy trình 3 bước tạo khóa, ký và xác thực image bằng Cosign diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

**Cosign** là công cụ dòng lệnh thuộc dự án nguồn mở **Sigstore**, dùng để ký số và xác thực chữ ký cho OCI container image. Cosign lưu trữ chữ ký trực tiếp vào **OCI registry** dưới dạng một **OCI artifact** liên kết với mã băm digest (SHA256) của image mà không làm thay đổi image gốc.

Quy trình 3 bước thực chiến với Cosign:
1. **Tạo cặp khóa**: `cosign generate-key-pair` (tạo ra `cosign.key` và `cosign.pub`).
2. **Ký image theo digest SHA256**: `cosign sign --key cosign.key <image>@sha256:...`
3. **Xác thực chữ ký trước khi deploy**: `cosign verify --key cosign.pub <image>@sha256:...`
</details>

### Câu Hỏi 11: Thành phần nào trong Kubernetes chịu trách nhiệm kiểm tra chữ ký Cosign trước khi cho phép Pod được tạo, và điều gì xảy ra nếu chữ ký không hợp lệ?

<details>
<summary>Đáp án</summary>

Kubernetes sử dụng **Admission Controller** (như **admission webhook** hoặc **`ValidatingAdmissionPolicy`** kết hợp cùng công cụ chính sách như **Kyverno** hoặc **Gatekeeper**) để tải chữ ký và public key từ OCI registry nhằm xác thực image khi Pod Spec được gửi lên.

Nếu chữ ký hợp lệ và khớp với digest của image, Pod được phép khởi tạo; nếu không có chữ ký hoặc chữ ký không hợp lệ, Admission Controller sẽ chặn lại và từ chối tạo Pod (**Admission Denied**).
</details>
