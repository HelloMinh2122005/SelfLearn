# Ôn Tập: 6_5_6 Validating Charts Before Deploy

### Câu Hỏi 1: Chiến lược Shift-Left Validation khi kiểm tra Helm Chart là gì, và tại sao không thể chỉ dựa vào `helm template` để kết luận chart đã an toàn để deploy?

<details>
<summary>Đáp án</summary>

**Shift-Left Validation** là chiến lược phát hiện lỗi cấu hình và cú pháp sớm ngay từ máy trạm hoặc CI pipeline trước khi áp dụng vào cụm Kubernetes (phát hiện càng sớm càng ít tốn kém).

Không thể chỉ dựa vào `helm template` vì lệnh này render **hoàn toàn ngoại tuyến**: nó tự giả lập (faked) các giá trị nội cụm và bỏ qua mọi kiểm tra tính hợp lệ phía server. Nếu chart chứa Custom Resource của một CRD chưa được cài trên cluster hoặc gọi API đã bị xóa, `helm template` vẫn báo thành công, nhưng `helm upgrade` thật sẽ bị API server từ chối. Do đó cần kết hợp nhiều lớp kiểm tra khác nhau.
</details>

### Câu Hỏi 2: Trong 5 lớp kiểm tra Helm Chart trước khi deploy được nêu trong bài học, công cụ nào chạy ngoại tuyến (không cần cluster) và công cụ nào bắt buộc phải kết nối với cluster?

<details>
<summary>Đáp án</summary>

- **Chạy ngoại tuyến (không cần cluster)**:
  1. `helm lint` (`--strict`): Bắt lỗi sai cấu trúc chart, vi phạm quy ước.
  2. `values.schema.json`: Bắt lỗi values sai kiểu dữ liệu ngay lúc `install` hoặc `template`.
  3. `helm template` + `kubeconform`: Bắt lỗi manifest sai theo OpenAPI tĩnh.
- **Chạy trực tuyến (cần kết nối cluster)**:
  4. `helm upgrade --dry-run=server`: Kiểm tra xem API server có từ chối thật hay không mà không lưu thay đổi lên cụm.
  5. `helm diff` (plugin): Xem trước những thay đổi sắp xảy ra so với release đang chạy trên cụm.
</details>

### Câu Hỏi 3: Lệnh `helm lint` kiểm tra những khía cạnh nào của một chart và phân loại kết quả thông báo ra sao?

<details>
<summary>Đáp án</summary>

`helm lint` quét thư mục chart để kiểm tra xem chart có đúng cấu trúc (`well-formed`) hay không, đồng thời rà soát các vấn đề tiềm ẩn về cú pháp, cấu trúc tệp và ngữ nghĩa của chart.

Các thông báo phát ra được chia thành hai mức:
- `[ERROR]`: Lỗi nghiêm trọng khiến chart không thể cài đặt được.
- `[WARNING]`: Cảnh báo vi phạm quy ước khuyến nghị.
</details>

### Câu Hỏi 4: Các cờ `--strict`, `--with-subcharts` và `--kube-version` trong `helm lint` có tác dụng gì? Vì sao trong CI/CD pipeline bắt buộc nên dùng `--strict --with-subcharts`?

<details>
<summary>Đáp án</summary>

- `--strict`: Khiến lệnh `helm lint` thất bại ngay (trả về exit code lỗi) nếu xuất hiện bất kỳ `[WARNING]` nào.
- `--with-subcharts`: Thực hiện kiểm tra linter đệ quy cho toàn bộ các subchart phụ thuộc nằm trong thư mục `charts/`.
- `--kube-version`: Chỉ định phiên bản Kubernetes mục tiêu (ví dụ `1.37.0`) để kiểm tra capabilities và cảnh báo các API đã bị deprecate.

Trong pipeline CI/CD bắt buộc phải cấu hình `helm lint --strict --with-subcharts` vì nếu thiếu `--strict`, các cảnh báo `[WARNING]` vẫn trả về exit code 0 khiến lỗi quy chuẩn lọt vào nhánh chính; còn nếu thiếu `--with-subcharts`, linter sẽ bỏ qua các lỗi tiềm ẩn nằm trong thư mục `charts/`.
</details>

### Câu Hỏi 5: Tệp `values.schema.json` dùng để làm gì, tuân theo tiêu chuẩn nào và được kích hoạt khi nào?

<details>
<summary>Đáp án</summary>

`values.schema.json` là tệp tùy chọn đặt trong chart nhằm áp đặt định nghĩa JSON Schema lên cấu trúc tệp `values.yaml` và các giá trị cấu hình do người dùng cung cấp (ví dụ: quy định trường bắt buộc qua `required`, kiểu dữ liệu `integer`/`string`, giới hạn `minimum`/`maximum`, hoặc danh sách giá trị hợp lệ `enum`).

- **Tiêu chuẩn**: Sử dụng **JSON Schema Draft 7** (`https://json-schema.org/draft-07/schema#`).
- **Thời điểm kích hoạt**: Việc kiểm tra kiểu dữ liệu tự động kích hoạt khi chạy `helm install`, `helm template` (và `helm lint`), giúp chặn lỗi sai kiểu dữ liệu sớm ngay tại máy trạm mà không cần kết nối tới cluster.
</details>

### Câu Hỏi 6: Lệnh `helm template [NAME] [CHART]` hoạt động như thế nào, và các cờ `--dry-run`, `--show-only`, `--include-crds`, `--output-dir`, `--disable-openapi-validation` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

`helm template` render các template cục bộ mà không kết nối tới cluster và mặc định in kết quả manifest YAML ra `stdout`. Các giá trị vốn phải tra cứu từ cluster sẽ được giả lập cục bộ.

Ý nghĩa các cờ quan trọng:
- `--dry-run`: Nhận giá trị `client` hoặc `server` (mặc định là `client`). `--dry-run=client` mô phỏng phía client và tránh mọi kết nối tới cluster.
- `--show-only`: Chỉ xuất manifest sinh ra từ file template được chỉ định (ví dụ `templates/deployment.yaml`).
- `--include-crds`: Đưa cả các CRD vào phần output.
- `--output-dir`: Ghi các manifest đã render ra tệp trên đĩa (ví dụ `./rendered`) thay vì in ra `stdout`.
- `--disable-openapi-validation`: Bỏ qua việc kiểm tra template đã render đối chiếu với Kubernetes OpenAPI Schema.
</details>

### Câu Hỏi 7: `kubeconform` hoạt động theo cơ chế nào để thẩm định manifest, và các cờ `-strict`, `-summary`, `-schema-location` dùng để làm gì?

<details>
<summary>Đáp án</summary>

API của Kubernetes được định nghĩa bằng đặc tả OpenAPI. `kubeconform` chuyển đổi các OpenAPI schemas này thành **JSON Schemas** để kiểm tra các file manifest YAML với tốc độ cao theo cú pháp `kubeconform [OPTION]... [FILE OR FOLDER]...`.

Ý nghĩa các cờ:
- `-strict`: Từ chối các thuộc tính không tồn tại trong schema và loại bỏ các khóa bị trùng lặp.
- `-summary`: In báo cáo tổng kết chi tiết số lượng tài nguyên hợp lệ và không hợp lệ.
- `-schema-location`: Chỉ định nguồn schema (mặc định trỏ tới kho `yannh/kubernetes-json-schema`). Có thể trỏ tới vị trí từ xa hoặc thư mục cục bộ (ví dụ `/opt/schemas/{{ .ResourceKind }}_{{ .ResourceAPIVersion }}.json`) để kiểm tra CRD hoặc chạy ngoại tuyến.
</details>

### Câu Hỏi 8: Giới hạn kỹ thuật của `kubeconform` là gì và cần kết hợp với bước nào để khắc phục?

<details>
<summary>Đáp án</summary>

`kubeconform` chỉ thẩm định manifest dựa trên **OpenAPI/JSON Schema tĩnh**, nên **không đánh giá được các bước kiểm tra động ở runtime của Kubernetes controllers**.

Cụ thể, `kubeconform` không thể phát hiện các lỗi như:
- Tham chiếu tới `ConfigMap` hoặc `Secret` không tồn tại trên cụm.
- Vượt hạn ngạch `ResourceQuota`.
- Bị chặn bởi Admission Webhook.

Để khắc phục, cần kết hợp `kubeconform` ở tầng CI tĩnh cùng `helm upgrade --dry-run=server` ở tầng tiền kiểm tra môi trường trước khi deploy.
</details>

### Câu Hỏi 9: Sự khác biệt cốt lõi giữa `--dry-run=client` và `--dry-run=server` là gì?

<details>
<summary>Đáp án</summary>

- `--dry-run=client`: Mô phỏng hoàn toàn ở phía client, không kết nối tới cluster, tự giả lập dữ liệu nội cụm và bỏ qua mọi kiểm tra hợp lệ phía server.
- `--dry-run=server`: Gửi yêu cầu trực tiếp lên `kube-apiserver` thật để xác thực toàn diện (kiểm tra API hợp lệ, CRD đã cài hay chưa, kiểm tra động phía server...) nhưng **không lưu lại thay đổi** trên cụm Kubernetes. Cần có kết nối mạng và quyền RBAC tới cluster đích để chạy chế độ này.
</details>

### Câu Hỏi 10: Plugin `helm-diff` dùng để làm gì? Nêu câu lệnh cài đặt và sự khác nhau giữa `helm diff upgrade` với `helm diff revision`.

<details>
<summary>Đáp án</summary>

Plugin `helm-diff` giúp hiển thị trước sự khác biệt về manifest trước khi thực hiện thay đổi trên cluster.

- **Cài đặt plugin**: `helm plugin install https://github.com/databus23/helm-diff`
- **`helm diff upgrade`**: So sánh sự khác biệt giữa **release đang chạy trên cụm** với **manifest dự kiến được render từ chart template** (ví dụ: `helm diff upgrade my-release ./my-chart --values values-production.yaml`).
- **`helm diff revision`**: So sánh manifest giữa revision mới nhất với một revision chỉ định, hoặc giữa **hai revision lịch sử** với nhau (cú pháp: `helm diff revision [flags] RELEASE REVISION1 REVISION2`).
</details>

### Câu Hỏi 11: Theo sơ đồ quy trình Shift-Left Validation đa tầng trong bài học, một chart đi qua 4 tầng kiểm tra theo thứ tự nào trước khi được triển khai thật?

<details>
<summary>Đáp án</summary>

1. **Tầng 1 — Static Linting (Local / CI)**: Chạy `helm lint --strict --with-subcharts` và kiểm tra dữ liệu đầu vào bằng `values.schema.json`.
2. **Tầng 2 — Offline Render & OpenAPI Check (CI Runner)**: Khi tầng 1 pass, dùng `helm template` để render ra các Manifest YAML ngoại tuyến, rồi đưa qua `kubeconform -strict -summary`.
3. **Tầng 3 — Server Simulation & Diff (Cluster Access)**: Khi tầng 2 pass, dùng `helm diff upgrade` để xem thay đổi và chạy `helm upgrade --dry-run=server` để kiểm chứng với API server.
4. **Tầng 4 — Áp Dụng Thực Tế (Deployment)**: Sau khi bước `--dry-run=server` được phê duyệt, mới chạy `helm upgrade --install` để deploy thật.
</details>

### Câu Hỏi 12: Trong CI/CD, lệnh `helm template my-app ./chart | kubeconform -strict -summary` báo `Errors: 0`, nhưng khi `helm upgrade --install` lên cụm Kubernetes lại báo lỗi `no matches for kind "Certificate" in version "cert-manager.io/v1"`. Nguyên nhân và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: `helm template` render cục bộ nên bỏ qua kiểm tra API phía server; còn `kubeconform` khi dùng kho schema mặc định chỉ thẩm định các tài nguyên lõi của Kubernetes nên không nhận biết được CRD `Certificate` vốn chưa được cài đặt trên cụm.
- **Cách khắc phục**:
  1. Cấu hình cờ `-schema-location` trong `kubeconform` để nạp thêm schema của CRD cần kiểm tra ở tầng ngoại tuyến.
  2. Bổ sung bước kiểm tra `helm upgrade --dry-run=server` để gửi manifest lên `kube-apiserver` thật xác thực trước khi tiến hành deploy.
</details>
