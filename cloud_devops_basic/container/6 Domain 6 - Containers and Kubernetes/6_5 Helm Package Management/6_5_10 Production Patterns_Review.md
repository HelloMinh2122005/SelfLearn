# Ôn Tập: 6_5_10 Production Patterns

### Câu Hỏi 1: Vì sao Pod nhận cấu hình qua biến môi trường không tự cập nhật khi ConfigMap thay đổi, và annotation `checksum/config` giải quyết vấn đề này như thế nào?

<details>
<summary>Đáp án</summary>

Pod nhận cấu hình qua biến môi trường chỉ đọc giá trị khi khởi tạo, không tự cập nhật khi ConfigMap thay đổi. Đồng thời, Helm chỉ cập nhật Deployment khi **Pod template** của nó có sự thay đổi; nếu chỉ sửa ConfigMap, Deployment sẽ không tự động rollout.

Bằng cách thêm annotation `checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}` vào `spec.template.metadata.annotations` của Deployment, Helm sẽ render nội dung `configmap.yaml` và băm thành chuỗi SHA-256. Khi nội dung ConfigMap đổi, giá trị hash đổi theo, làm Pod template thay đổi và kích hoạt Deployment tự động rollout các Pod mới nhận cấu hình mới. Ngoài ra, thay đổi cấu hình này trở thành một revision có lịch sử để dễ dàng rollback khi cần.
</details>

### Câu Hỏi 2: Có những biến thể và lưu ý nào khi áp dụng checksum annotation cho trường hợp muốn luôn rollout, library chart, và Secret?

<details>
<summary>Đáp án</summary>

Theo tài liệu Helm trong bài học, có 3 biến thể chính:
1. **Luôn rollout ở mỗi lần upgrade**: Dùng annotation tạo giá trị ngẫu nhiên đổi mỗi lần render, ví dụ `rollme: {{ randAlphaNum 5 | quote }}`.
2. **Trong library chart**: Không truy cập được file qua `$.Template.BasePath`, nên phải gọi qua named template của library chart, ví dụ `include ("mylibchart.configmap") . | sha256sum`.
3. **Với Secret**: Nếu Pod nhận Secret qua biến môi trường, áp dụng mẫu băm tương tự bằng `checksum/secret` để kích hoạt rollout khi Secret thay đổi.
</details>

### Câu Hỏi 3: Vì sao nên ưu tiên ghim container image theo digest thay vì tag, cơ chế fallback giữa digest, tag và `appVersion` hoạt động ra sao, và vì sao pipeline nên truyền digest bằng `--set-string`?

<details>
<summary>Đáp án</summary>

Image tag (đặc biệt là `latest` hoặc tag phiên bản thông thường) có thể bị đẩy đè (overwrite) bằng nội dung khác, trong khi **digest** (`sha256:...`) là định danh bất biến gắn với nội dung image cụ thể.

Trong mẫu helper `_helpers.tpl`, logic chọn image reference theo thứ tự ưu tiên:
1. Nếu `.Values.image.digest` có giá trị: dùng `{{ .Values.image.repository }}@{{ .Values.image.digest }}`.
2. Nếu không có digest nhưng có `.Values.image.tag`: dùng `{{ .Values.image.repository }}:{{ .Values.image.tag }}`.
3. Nếu cả hai đều trống: fallback về `{{ .Chart.AppVersion }}` (`repository:appVersion`).

Khi CI/CD pipeline truyền digest lúc deploy, cần dùng cờ `--set-string image.digest=sha256:...` để đảm bảo Helm giữ nguyên chuỗi, không tự động ép kiểu (type coercion).
</details>

### Câu Hỏi 4: Theo chuẩn Helm Best Practices, những nhãn (labels) nào được khuyến nghị, khi nào nên dùng Label thay vì Annotation, và Helm hook thuộc loại nào?

<details>
<summary>Đáp án</summary>

Helm phân loại các nhãn chuẩn như sau:
- **Khuyến nghị (`REC`)**:
  - `app.kubernetes.io/name`: tên ứng dụng.
  - `helm.sh/chart`: tên và phiên bản chart (`{{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}`).
  - `app.kubernetes.io/managed-by`: `{{ .Release.Service }}` (giúp tìm mọi tài nguyên do Helm quản lý).
  - `app.kubernetes.io/instance`: `{{ .Release.Name }}` (phân biệt các instance của cùng một ứng dụng).
- **Tùy chọn (`OPT`)**: `app.kubernetes.io/version` (`{{ .Chart.AppVersion }}`), `app.kubernetes.io/component` (vai trò), `app.kubernetes.io/part-of` (ứng dụng cấp trên).

**Nguyên tắc phân biệt**: Dùng **label** nếu Kubernetes cần dùng để nhận diện hoặc người vận hành cần truy vấn/lọc; ngược lại dùng **annotation**. **Helm hook luôn luôn là annotation.** Lưu ý rằng Helm không bắt buộc phải có nhãn cụ thể nào mới chạy được.
</details>

### Câu Hỏi 5: Vì sao phải tách riêng `selectorLabels` khỏi bộ `labels` đầy đủ, và điều gì xảy ra nếu đưa `app.kubernetes.io/version` hoặc `helm.sh/chart` vào `Deployment.spec.selector.matchLabels`?

<details>
<summary>Đáp án</summary>

Trường `spec.selector` của một Deployment là **bất biến (immutable)** sau khi Deployment đã được tạo trên Kubernetes. 

Nếu bạn đưa các nhãn thay đổi theo từng lần phát hành như `app.kubernetes.io/version` hoặc `helm.sh/chart` vào `spec.selector.matchLabels`, khi thực hiện `helm upgrade` sang phiên bản mới, selector mới sẽ không khớp với selector cũ. Kubernetes sẽ từ chối cập nhật (làm lệnh upgrade bị lỗi) hoặc buộc phải xóa và tạo lại Deployment.

Vì vậy, mẫu chuẩn của `helm create` tách riêng:
- `selectorLabels` (bất biến, chỉ gồm `app.kubernetes.io/name` và `app.kubernetes.io/instance`) dùng cho `Deployment.spec.selector.matchLabels` (và cũng có mặt trong Pod/Deployment `metadata.labels`).
- `labels` đầy đủ (bao gồm cả `version`, `helm.sh/chart`, `managed-by`) chỉ gắn vào `metadata.labels` của Deployment và Pod template.
</details>

### Câu Hỏi 6: Nêu hai rủi ro bảo mật khi đưa Secret thật vào `values.yaml` của chart và các hướng xử lý an toàn thay thế?

<details>
<summary>Đáp án</summary>

Đưa Secret thật vào `values.yaml` (hoặc `values-prod.yaml`) gây lộ thông tin ở **hai nơi**:
1. **Lộ trong Git**: File values được commit lên repository và lưu vĩnh viễn trong lịch sử Git.
2. **Lộ trong lịch sử release của Helm**: Helm lưu lại toàn bộ values đã cung cấp vào Secret trạng thái release (dạng `sh.helm.release.v1.*`) trong cluster; bất kỳ ai có quyền RBAC đọc Secret trong namespace đó đều có thể xem được.

**Giải pháp an toàn**:
- Chart chỉ tham chiếu tên Secret đã tồn tại sẵn qua một biến như `existingSecret`, còn Secret thật được tạo và quản lý ngoài chart bởi công cụ chuyên dụng (External Secrets Operator, Secrets Store CSI Driver, v.v.).
- Nếu buộc phải truyền giá trị tạm thời qua CI bằng biến được bảo vệ (protected/masked) với `--set` hoặc `--set-file`, cần hiểu rằng giá trị vẫn đi vào lịch sử release nên phải siết chặt phân quyền RBAC đọc Secret trong namespace của release.
- Cẩn trọng khi dùng mẫu tạo `imagePullSecret` từ values (`kubernetes.io/dockerconfigjson` + `b64enc`) vì thông tin đăng nhập registry vẫn nằm trong values.
</details>

### Câu Hỏi 7: Hàm `required` giúp ích gì khi viết template Helm, và quy tắc sử dụng `quote` giữa kiểu chuỗi (string) với kiểu số (number) khác nhau thế nào?

<details>
<summary>Đáp án</summary>

- **Hàm `required`**: Ép buộc một giá trị phải được cung cấp (không được rỗng/thiếu) và trả về thông báo lỗi tùy chỉnh nếu thiếu, ví dụ: `{{ required "image.repository là bắt buộc" .Values.image.repository }}`. Điều này giúp bắt lỗi cấu hình ngay ở bước `helm template` hoặc `helm lint` trước khi gửi manifest lên cluster. (Khi kết hợp với mẫu `digest`/`tag`, cần đặt `required` hợp lý để nhánh `@digest` hoặc `:tag` đều được kiểm tra đúng.)
- **Quy tắc `quote`**:
  - **Chuỗi (string)**: **Luôn `quote`** (ví dụ: `value: {{ .Chart.AppVersion | quote }}`).
  - **Số (number)**: **Không `quote`** (ví dụ: `replicas: {{ .Values.replicaCount }}`), vì tài liệu Helm cảnh báo việc quote giá trị số có thể gây lỗi parse trong Kubernetes.
  - Nên kết hợp `values.schema.json`, `helm lint`, và `helm template` để kiểm tra kiểu dữ liệu sớm.
</details>

### Câu Hỏi 8: Cú pháp `include ... | nindent N` dùng để làm gì, và vì sao các hàm `env`/`expandenv` của Sprig không dùng được trong Helm template?

<details>
<summary>Đáp án</summary>

- **`include ... | nindent N`**: Gọi một named template (như `hello-svc.labels` hoặc `hello-svc.selectorLabels`), sau đó xuống dòng và thụt lề toàn bộ khối kết quả vào đúng `N` dấu cách, giúp khối YAML được chèn khớp chính xác cấu trúc phân cấp của file template cha.
- **Hàm `env` và `expandenv` của Sprig**: Bị Helm loại bỏ hoàn toàn khỏi công cụ template vì **lý do bảo mật** (tránh việc template đọc và làm lộ các biến môi trường trên máy hoặc runner đang chạy lệnh Helm).
</details>

### Câu Hỏi 9: Vì sao dùng `randAlphaNum` để tự sinh mật khẩu trong Secret của chart dễ gây sự cố khi nâng cấp, và làm thế nào để tránh?

<details>
<summary>Đáp án</summary>

Trong Helm, toàn bộ template được render lại mỗi khi chạy `helm upgrade`. Nếu template Secret sử dụng hàm tạo giá trị ngẫu nhiên như `randAlphaNum`, mỗi lần upgrade có thể sinh ra một mật khẩu mới khác với lần trước, làm Secret bị ghi đè và khiến các kết nối hoặc ứng dụng đang dùng mật khẩu cũ bị lỗi.

**Cách khắc phục**:
- Tốt nhất là tạo và quản lý các Secret bền vững **bên ngoài chart** (dùng `existingSecret`).
- Hoặc dùng hàm `lookup` trong template để kiểm tra Secret đã tồn tại trên cluster và giữ lại giá trị cũ (lưu ý quan trọng: `lookup` không có tác dụng khi chạy offline bằng `helm template`).
</details>

### Câu Hỏi 10: Annotation `helm.sh/resource-policy: keep` có tác dụng gì và vì sao không nên lạm dụng?

<details>
<summary>Đáp án</summary>

Annotation `helm.sh/resource-policy: keep` báo cho Helm biết **không được xóa** tài nguyên đó khi thực hiện `helm uninstall`, hoặc khi một lần `helm upgrade` / `helm rollback` dẫn đến việc loại bỏ tài nguyên đó khỏi manifest. Nó hữu ích với các tài nguyên chứa dữ liệu quan trọng cần giữ lại như PersistentVolumeClaim (PVC) hoặc Secret gốc.

**Lý do không nên lạm dụng**:
- Tài nguyên được giữ lại sẽ trở thành **tài nguyên mồ côi (orphaned)** — Helm không còn quản lý nó nữa.
- Nếu sau đó cài đặt lại chart hoặc dùng `helm install --replace` trên release đã gỡ mà tài nguyên cũ vẫn còn tồn tại trong namespace, có thể gây xung đột tên hoặc lỗi triển khai. Do đó, cần giới hạn sử dụng và ghi rõ quy trình dọn dẹp thủ công.
</details>

### Câu Hỏi 11: Lệnh `helm upgrade --install` giải quyết vấn đề gì trong CI/CD, và biến `SOURCE_DATE_EPOCH` dùng để làm gì khi đóng gói chart?

<details>
<summary>Đáp án</summary>

- **`helm upgrade --install <release> <chart> -f values.yaml`**: Thực hiện cài đặt nếu release chưa tồn tại, hoặc nâng cấp nếu release đã có. Lệnh này có tính chất **idempotent**, giúp pipeline CI/CD dùng chung một câu lệnh duy nhất cho cả lần triển khai đầu tiên và các lần cập nhật sau.
- **`SOURCE_DATE_EPOCH`**: Mặc định khi chạy `helm package`, file `.tgz` đầu ra lưu lại thời gian sửa đổi (mtime) của các file nguồn, khiến việc đóng gói lại cùng một nội dung ở hai thời điểm hoặc hai máy khác nhau cho ra file `.tgz` có checksum khác nhau. Helm tôn trọng biến môi trường `SOURCE_DATE_EPOCH` (số nguyên không âm tính bằng giây theo UTC, ví dụ `SOURCE_DATE_EPOCH=$(git log -1 --pretty=%ct) helm package ./hello-svc`). Nhờ đó, cùng một commit sẽ tạo ra gói archive tái lập (reproducible) với mã `sha256sum` giống hệt nhau; nếu truyền giá trị không hợp lệ, lệnh sẽ báo lỗi.
</details>

### Câu Hỏi 12: Ngoài checksum, digest, nhãn chuẩn và bảo mật Secret, danh sách kiểm tra (Production Checklist) trong bài học còn nhắc tới những hạng mục nào cho một Helm chart chuẩn sản xuất?

<details>
<summary>Đáp án</summary>

Theo bảng danh sách kiểm tra chart sản xuất trong bài học, một chart hoàn chỉnh cần đảm bảo thêm các hạng mục sau:
1. **Phiên bản rõ ràng**: Tăng `version` mỗi khi nội dung chart thay đổi; giữ `appVersion` phản ánh đúng phiên bản ứng dụng.
2. **Kiểm tra sức khỏe (Probes)**: Tham số hóa `readinessProbe`, `livenessProbe` và `startupProbe`.
3. **Tài nguyên (Resources)**: Đặt giá trị mặc định hợp lý cho `resources.requests` và `resources.limits`.
4. **Tắt êm (Graceful Shutdown)**: Cấu hình `terminationGracePeriodSeconds` và `preStop` hook khi cần.
5. **Kiểm tra trước khi deploy**: Kết hợp `values.schema.json`, `helm lint --strict`, `helm template`, và `helm upgrade --dry-run=server`.
6. **Phân phối an toàn**: Đẩy và cài đặt chart qua OCI registry, ghim digest khi cài đặt.
</details>
