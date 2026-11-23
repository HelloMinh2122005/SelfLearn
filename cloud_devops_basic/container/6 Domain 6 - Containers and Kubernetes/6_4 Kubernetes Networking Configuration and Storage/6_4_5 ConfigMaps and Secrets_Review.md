# Ôn Tập: 6_4_5 ConfigMaps and Secrets

### Câu Hỏi 1: Vì sao nên tách cấu hình và dữ liệu nhạy cảm ra khỏi container image bằng ConfigMap và Secret?

<details>
<summary>Đáp án</summary>

Một container image nên được **build một lần** và chạy thống nhất qua nhiều môi trường (dev, staging, prod), nhưng mỗi môi trường lại có cấu hình khác nhau (như địa chỉ database, mức log, mật khẩu). Nếu viết cứng các giá trị này vào image:
- Mỗi lần đổi một giá trị phải **build lại image** và phải duy trì nhiều image riêng cho từng môi trường.
- Mật khẩu nằm ngay **trong image**, nên bất kỳ ai pull được image đều có thể đọc được.

Tách cấu hình ra `ConfigMap` (cấu hình thường) và `Secret` (dữ liệu nhạy cảm) giúp ứng dụng dễ di chuyển giữa các môi trường (portable) và Pod chỉ đọc cấu hình lúc chạy.
</details>

### Câu Hỏi 2: ConfigMap là gì? Cấu trúc dữ liệu, các kiểu khóa phổ biến và giới hạn kích thước của ConfigMap như thế nào?

<details>
<summary>Đáp án</summary>

- **Bản chất**: `ConfigMap` là API object lưu dữ liệu **không nhạy cảm** dưới dạng cặp `khóa: giá trị` trong cluster.
- **Cấu trúc**: Khác với hầu hết các object khác trong Kubernetes, ConfigMap **không có `spec`**, mà chứa dữ liệu trực tiếp trong `data` (chuỗi UTF-8) hoặc `binaryData` (dữ liệu nhị phân dạng base64).
- **Hai kiểu khóa thường gặp**:
  1. Giá trị đơn (ví dụ: `GREETING: "xin chao"`).
  2. Nội dung cả một file nhiều dòng (ví dụ: `app.properties`).
- **Quy tắc & giới hạn**: Tên ConfigMap phải là DNS subdomain name hợp lệ; tên khóa gồm chữ-số và các ký tự `-`, `_`, `.`; tổng dữ liệu không vượt quá **1 MiB**.
</details>

### Câu Hỏi 3: Secret khác gì ConfigMap? Trường `stringData` và `data` trong Secret hoạt động ra sao?

<details>
<summary>Đáp án</summary>

- **Điểm giống và khác**: Secret có cấu trúc cặp `khóa: giá trị` tương tự ConfigMap và cũng được tạo độc lập với Pod, nhưng được thiết kế riêng để chứa **lượng nhỏ dữ liệu nhạy cảm** (mật khẩu, token, khóa TLS).
- **`stringData` vs `data`**:
  - `stringData`: chỉ dùng cho tiện khi viết manifest bằng tay bằng chữ thường (plaintext); khi gửi lên API server, Kubernetes sẽ tự mã hóa base64 và chuyển vào `data`.
  - `data`: chứa giá trị ở dạng **base64**. Khi đọc lại bằng `kubectl get secret <tên> -o yaml`, các giá trị hiển thị trong trường `data` đều ở dạng base64.
</details>

### Câu Hỏi 4: Theo tài liệu Kubernetes, có những cách nào để cấp dữ liệu từ ConfigMap (và Secret) vào Pod? Với 3 cách đầu, kubelet đọc dữ liệu khi nào?

<details>
<summary>Đáp án</summary>

Có **4 cách** dùng ConfigMap:
1. Làm đối số hoặc lệnh của container (`command`, `args`).
2. Làm **biến môi trường** (`env.valueFrom.configMapKeyRef`, hoặc `envFrom` để nạp toàn bộ khóa).
3. Mount thành **file chỉ đọc trong volume** (mỗi khóa thành một file).
4. Tự viết code trong ứng dụng gọi Kubernetes API để đọc (và có thể `watch` thay đổi, truy cập được cả namespace khác).

Secret cũng dùng tương tự ở 3 cách phổ biến (`secretKeyRef`, `envFrom.secretRef`, `volumes.secret`). Với **3 cách đầu**, **kubelet sử dụng dữ liệu ConfigMap/Secret tại thời điểm khởi động container**.
</details>

### Câu Hỏi 5: Phân biệt cách khai báo `env` (`configMapKeyRef` / `secretKeyRef`), `envFrom` và Volume Mount trong YAML của Pod?

<details>
<summary>Đáp án</summary>

- **`env` với `valueFrom` (`configMapKeyRef` / `secretKeyRef`)**: Chọn từng khóa cụ thể trong ConfigMap/Secret để gán vào một tên biến môi trường bạn tự đặt trong container.
- **`envFrom` (`configMapRef` / `secretRef`)**: Nạp **toàn bộ** các cặp khóa-giá trị trong ConfigMap/Secret thành các biến môi trường trong container.
- **Volume Mount (`spec.volumes` + `volumeMounts`)**: Khai báo volume trỏ tới `configMap` hoặc `secret`, sau đó gắn vào `mountPath` trong container (thường đặt `readOnly: true`). Mỗi khóa sẽ trở thành một file trong thư mục mount (hoặc chỉ mount một file đơn lẻ nếu dùng thêm `subPath`).
</details>

### Câu Hỏi 6: Khi sửa giá trị trong ConfigMap hoặc Secret đang gắn vào Pod, điều gì xảy ra với `env`/`envFrom`, volume mount cả thư mục và volume mount dùng `subPath`?

<details>
<summary>Đáp án</summary>

- **Biến môi trường (`env`, `envFrom`)**: ❌ **Không tự cập nhật**. Container giữ nguyên giá trị cũ từ lúc khởi động; chỉ đổi sau khi Pod được tạo lại (ví dụ `kubectl rollout restart`).
- **Volume mount cả thư mục**: ✅ **Tự động cập nhật sau một khoảng trễ** (thực nghiệm trong bài đo được khoảng 86 giây, nhưng đây chỉ là một lần đo, không phải thời gian bảo đảm cố định).
- **Volume mount bằng `subPath`**: ❌ **Không bao giờ tự cập nhật**. File mount bằng `subPath` vẫn giữ giá trị cũ ngay cả khi volume thường đã đổi sang giá trị mới.
</details>

### Câu Hỏi 7: Vì sao volume mount cả thư mục tự cập nhật được còn `subPath` thì không? Cơ chế cập nhật file hoạt động thế nào và ứng dụng cần làm gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế cập nhật nguyên tử (`..data` symlink)**: Trong volume mount cả thư mục, các file cấu hình thực chất là symlink trỏ qua thư mục `..data`. Khi có thay đổi, kubelet ghi dữ liệu mới vào một thư mục có dấu thời gian mới rồi **đổi symlink `..data` một lần duy nhất** sang thư mục mới đó. Nhờ vậy ứng dụng không bao giờ đọc phải trạng thái file cập nhật dở dang.
- **Lý do `subPath` không cập nhật**: `subPath` mount trực tiếp file, **bỏ qua (bypass) symlink `..data`** nên không nhận được các lần hoán đổi symlink của kubelet.
- **Độ trễ và vai trò của ứng dụng**: Độ trễ cập nhật bằng *chu kỳ đồng bộ của kubelet + độ trễ truyền cache* (tùy cấu hình `configMapAndSecretChangeDetectionStrategy` của `KubeletConfiguration`: mặc định là `watch`, hoặc theo `TTL`, hoặc gọi thẳng API server). Kubernetes chỉ cập nhật file trên volume chứ không thông báo cho tiến trình, nên **ứng dụng phải tự đọc lại file (reload)** mới dùng được giá trị mới.
</details>

### Câu Hỏi 8: Có những cách nào để làm ứng dụng nhận cấu hình mới? Nêu ưu và nhược điểm của từng cách.

<details>
<summary>Đáp án</summary>

1. **Rollout lại Pod** (dùng `kubectl rollout restart` hoặc đổi annotation chứa checksum cấu hình trong Pod template):
   - *Ưu điểm*: Chắc chắn, áp dụng được cho cả `env`, thay đổi có lịch sử và **rollback được**.
   - *Nhược điểm*: Phải restart/rolling update Pod; đòi hỏi Deployment được cấu hình tốt (readiness probe, PDB).
2. **Mount volume (không dùng `subPath`) + ứng dụng tự reload**:
   - *Ưu điểm*: Không phải restart Pod.
   - *Nhược điểm*: Độ trễ không xác định chặt; ứng dụng bắt buộc phải hỗ trợ đọc lại file; không dùng được với `subPath`; dễ xảy ra lệch phiên bản cấu hình giữa các Pod tại cùng một thời điểm.
</details>

### Câu Hỏi 9: Thuộc tính `immutable: true` trên ConfigMap/Secret có tác dụng gì và mẫu thực chiến với tên theo hash hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **Tác dụng của `immutable: true`** (từ Kubernetes v1.19):
  1. Bảo vệ ConfigMap/Secret khỏi bị sửa nhầm.
  2. **Giảm tải cho API server**, vì kubelet không cần watch thay đổi đối với các object immutable.
- **Lưu ý quan trọng**: Khi đã đặt `immutable: true`, **không thể hoàn tác** và không sửa được `data`/`binaryData`; muốn thay đổi chỉ có thể **xóa và tạo lại** (đồng thời nên tạo lại các Pod đang tham chiếu tới object đã xóa).
- **Mẫu thực chiến**: Đặt tên ConfigMap theo phiên bản hoặc hash (ví dụ `app-config-7f3a1c`) kèm `immutable: true`. Khi đổi cấu hình, tạo một ConfigMap mới với tên mới và sửa Deployment trỏ sang tên mới — Deployment sẽ tự rollout sạch sẽ và rollback rất đơn giản. (Ngoài ra với Helm có thể dùng mẫu checksum annotation `sha256sum` của ConfigMap trong Pod template để kích hoạt rollout.)
</details>

### Câu Hỏi 10: Lỗi `CreateContainerConfigError` xảy ra khi nào? Làm sao chẩn đoán và khắc phục?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Pod tham chiếu tới một **ConfigMap/Secret không tồn tại** hoặc một **khóa (key) không tồn tại** bên trong chúng, trong khi không cấu hình `optional: true`.
- **Phân biệt**: Đây là lỗi **cấu hình lúc tạo container**, khác với `ImagePullBackOff` (lỗi kéo image) và `CrashLoopBackOff` (container chạy rồi bị thoát/crash).
- **Chẩn đoán**: Dùng `kubectl describe pod <tên-pod>`, phần `Events` sẽ hiển thị thông báo cụ thể như `Error: couldn't find key ... in Secret ...` hoặc `Error: configmap "..." not found`.
- **Khắc phục**: Tạo bổ sung ConfigMap/Secret hoặc khóa còn thiếu, hoặc đặt `optional: true` nếu khóa đó thực sự không bắt buộc.
</details>

### Câu Hỏi 11: Kể tên các loại (`type`) Secret phổ biến trong Kubernetes và mục đích của từng loại.

<details>
<summary>Đáp án</summary>

- **`Opaque`** *(mặc định)*: Lưu dữ liệu tùy ý dạng key-value.
- **`kubernetes.io/dockerconfigjson`**: Lưu cấu hình đăng nhập container registry (`~/.docker/config.json`) dùng cho `spec.imagePullSecrets` (tạo nhanh bằng `kubectl create secret docker-registry`).
- **`kubernetes.io/tls`**: Lưu chứng chỉ và khóa TLS (`tls.crt`, `tls.key`), dùng cho Ingress hoặc Gateway.
- **`kubernetes.io/basic-auth`**, **`kubernetes.io/ssh-auth`**: Lưu thông tin xác thực Basic Auth hoặc SSH.
- **`kubernetes.io/service-account-token`**: Lưu token của ServiceAccount.
</details>

### Câu Hỏi 12: Vì sao nói Secret mặc định trong Kubernetes không thực sự "bảo mật" như tên gọi? Cần áp dụng những biện pháp tối thiểu nào?

<details>
<summary>Đáp án</summary>

- **Sự thật về mức độ an toàn của Secret mặc định**:
  1. **Base64 chỉ là encoding, không phải mã hóa**: Bất kỳ ai lấy được Secret đều giải mã ra plaintext ngay lập tức bằng `base64 -d`.
  2. **Lưu không mã hóa trong `etcd`**: Mặc định dữ liệu Secret nằm trong etcd ở dạng không mã hóa (trừ khi bật encryption at rest).
  3. **Phạm vi truy cập rộng nếu phân quyền lỏng**: Ai có quyền đọc Secret qua API (hoặc truy cập etcd), hoặc **bất kỳ ai được quyền tạo Pod trong namespace** (kể cả gián tiếp qua Deployment) đều có thể đọc được mọi Secret của namespace đó.
- **4 biện pháp tối thiểu theo tài liệu Kubernetes**:
  1. Bật **Encryption at Rest** cho Secret.
  2. Áp dụng **RBAC đặc quyền tối thiểu** (kiểm soát chặt quyền `get`/`list`/`watch` Secret và quyền tạo Pod).
  3. Giới hạn Secret cho đúng container/namespace cần dùng.
  4. Cân nhắc sử dụng **nhà cung cấp Secret bên ngoài**.
</details>

### Câu Hỏi 13: Secret khi mount dạng volume lưu trên loại filesystem nào? Vì sao thực tế sản xuất thường ưu tiên mount Secret dạng file hơn truyền qua biến môi trường (`env`)?

<details>
<summary>Đáp án</summary>

- **Lưu trữ của Secret volume**: Kubelet mount Secret volume bằng **`tmpfs` (trên RAM)** nên dữ liệu không ghi xuống đĩa của node. Quyền truy cập file có thể siết chặt bằng `defaultMode` (trong thí nghiệm của bài, mặc định là `644`).
- **Vì sao hạn chế truyền Secret qua biến môi trường (`env`)**: Biến môi trường dễ bị rò rỉ ra ngoài qua log ứng dụng, `kubectl describe`, error dump hoặc bị kế thừa sang các tiến trình con. Mount thành file chỉ đọc (trên `tmpfs`) kết hợp `defaultMode` chặt giúp kiểm soát quyền đọc tốt hơn khi ứng dụng hỗ trợ đọc từ file.
</details>

### Câu Hỏi 14: Vì sao dùng `kubectl apply -f` với manifest Secret chứa `stringData` lại gây rò rỉ plaintext, và cách phòng tránh là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Khi dùng `kubectl apply -f`, `kubectl` lưu **toàn bộ manifest gốc** — bao gồm cả giá trị `stringData` ở dạng **plaintext** — vào annotation `kubectl.kubernetes.io/last-applied-configuration` của chính Secret đó. Vì vậy dù trường `stringData` không xuất hiện khi chạy `kubectl get secret -o yaml`, kẻ có quyền đọc Secret vẫn thấy nguyên văn mật khẩu trong metadata annotations.
- **Cách phòng tránh**:
  - Tạo Secret bằng lệnh `kubectl create secret ... --from-literal` / `--from-file` / `--from-env-file` (không dùng `apply`), hoặc dùng công cụ quản lý Secret bên ngoài.
  - Tuyệt đối không commit manifest chứa Secret plaintext (hay base64) vào Git.
</details>

### Câu Hỏi 15: Làm sao nạp file `.env` vào Secret? Quy trình xử lý của `kubectl`, vị trí lưu trữ và các lưu ý định dạng/Git gồm những gì?

<details>
<summary>Đáp án</summary>

- **Pod không đọc trực tiếp file `.env`**: Cần nạp file `.env` vào Secret bằng lệnh `kubectl create secret generic <tên> --from-env-file=.env`, rồi cho Pod dùng Secret đó qua `envFrom.secretRef` hoặc volume.
- **Quy trình của `kubectl`**:
  1. Đọc file `.env` trên máy local (file `.env` gốc vẫn giữ nguyên, không bị sửa hay xóa).
  2. Dựng object Secret trong bộ nhớ với giá trị đã mã hóa base64.
  3. Gửi object lên API server để lưu trong **`etcd`** của control plane (và nếu chưa bật encryption at rest thì nó vẫn không được mã hóa).
- **Quy tắc định dạng quan sát được**: Mỗi dòng dạng `VAR=VAL`; dòng bắt đầu bằng `#` và dòng trống bị bỏ qua; dấu nháy không được xử lý riêng nên trở thành một phần của giá trị (ví dụ `A="x"` giữ nguyên cả dấu ngoặc kép).
- **Lưu ý Git**: Luôn thêm `.env` vào `.gitignore` trước khi `git add`, và không để output base64 hay mật khẩu thật vào các file được commit.
</details>

### Câu Hỏi 16: Có những hướng tiếp cận nào để quản lý Secret ngoài Git và đánh đổi khái quát của từng hướng?

<details>
<summary>Đáp án</summary>

- **External Secrets Operator**: Đồng bộ secret từ kho bên ngoài (Key Vault, Secrets Manager, Vault...) thành object `Secret` trong cluster. *Đánh đổi*: Cần cài operator + cấu hình quyền truy cập kho ngoài, và Secret cuối cùng vẫn nằm trong `etcd`.
- **Secrets Store CSI Driver**: Mount secret từ kho ngoài trực tiếp vào Pod thông qua CSI volume (có tùy chọn đồng bộ sang Secret). *Đánh đổi*: Phụ thuộc vào driver và provider cụ thể.
- **Sealed Secrets**: Mã hóa bất đối xứng Secret để có thể commit file đã mã hóa vào Git an toàn; controller trong cluster sẽ giải mã. *Đánh đổi*: Phải quản lý khóa của controller và kiểm tra tình trạng duy trì của dự án.
- **HashiCorp Vault**: Dùng kho lưu trữ bí mật chuyên dụng tích hợp với Kubernetes. *Đánh đổi*: Đòi hỏi hạ tầng vận hành riêng.
</details>
