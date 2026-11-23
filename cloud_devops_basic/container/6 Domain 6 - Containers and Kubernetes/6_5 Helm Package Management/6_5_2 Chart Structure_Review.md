# Ôn Tập: 6_5_2 Chart Structure

### Câu Hỏi 1: Khi khởi tạo chart bằng lệnh `helm create NAME`, thành phần nào là bắt buộc và các thư mục nào được Helm bảo lưu?

<details>
<summary>Đáp án</summary>

- **Tệp bắt buộc duy nhất**: `Chart.yaml` là tệp bắt buộc cho mọi Helm chart.
- **Các thư mục được Helm bảo lưu**: `templates/`, `charts/`, và `crds/`.
- **Các tệp tùy chọn tiêu chuẩn khác**: `values.yaml`, `values.schema.json` (lưu ý: `helm create` không sinh sẵn tệp này mà phải tự tạo), `templates/_helpers.tpl`, `templates/NOTES.txt`, và `.helmignore`. Các tệp khác ngoài quy chuẩn sẽ được Helm giữ nguyên trạng.
</details>

### Câu Hỏi 2: Tệp `Chart.yaml` gồm những trường bắt buộc và tùy chọn cốt lõi nào? Helm xử lý ra sao nếu trong `Chart.yaml` có trường không xác định?

<details>
<summary>Đáp án</summary>

- **Các trường bắt buộc**:
  - `apiVersion`: Giá trị `v2` cho chart yêu cầu Helm 3 trở lên.
  - `name`: Tên của chart.
  - `version`: Phiên bản của chart theo chuẩn SemVer 2.
- **Các trường tùy chọn**:
  - `appVersion`: Phiên bản ứng dụng được đóng gói.
  - `type`: Phân loại chart (`application` hoặc `library`).
  - `kubeVersion`: Dải phiên bản Kubernetes tương thích theo chuẩn SemVer.
  - `description`: Mô tả ngắn gọn về dự án.
  - `deprecated`: Cờ boolean đánh dấu chart đã lỗi thời.
- **Trường không xác định**: Mọi trường không xác định trong `Chart.yaml` đều bị Helm bỏ qua và không truyền vào templates.
</details>

### Câu Hỏi 3: Phân biệt `version` và `appVersion` trong `Chart.yaml`? Vì sao nên bọc giá trị của `appVersion` trong dấu ngoặc kép?

<details>
<summary>Đáp án</summary>

- **`version`**: Bắt buộc phải tuân thủ chuẩn SemVer 2 (`x.y.z`), biểu thị phiên bản của gói chart và quyết định token phiên bản khi đóng gói bằng lệnh `helm package`.
- **`appVersion`**: Tùy chọn, chỉ mang tính mô tả phiên bản của ứng dụng bên trong, không bắt buộc theo SemVer và không tham gia vào việc tính toán phiên bản chart.
- **Lý do bọc ngoặc kép cho `appVersion`**: Để YAML parser hiểu giá trị là kiểu chuỗi thay vì số thực. Ví dụ, nếu viết `appVersion: 1.10` không có ngoặc kép, YAML parser có thể hiểu nhầm thành số `1.1`; viết `appVersion: "1.10"` giúp giữ nguyên giá trị chính xác.
</details>

### Câu Hỏi 4: Hai giá trị của trường `type` trong `Chart.yaml` là `application` và `library` khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **`application`** (mặc định): Là loại chart tiêu chuẩn dùng để cài đặt đầy đủ các tài nguyên ứng dụng lên cluster.
- **`library`**: Chỉ cung cấp các tiện ích hoặc hàm dùng chung cho chart khác, không thể cài đặt độc lập và thường không chứa tài nguyên Kubernetes.
- Một chart `application` có thể chuyển sang dùng làm library bằng cách đặt `type: library`.
</details>

### Câu Hỏi 5: `values.yaml` dùng để làm gì và tại sao nên bổ sung `values.schema.json` cho chart?

<details>
<summary>Đáp án</summary>

- **`values.yaml`** chứa các giá trị cấu hình mặc định cho chart, nhưng chỉ là YAML thông thường nên không tự ràng buộc kiểu dữ liệu.
- **Rủi ro khi không có schema**:
  - *Sai kiểu vẫn render được*: Ví dụ truyền `--set replicaCount=hai`, Helm vẫn render vào template và lỗi chỉ lộ ra muộn khi Kubernetes từ chối manifest lúc cài đặt.
  - *Thiếu giá trị bắt buộc*: Ví dụ quên `image.tag` dẫn tới manifest sinh ra bị thiếu thông tin và lỗi chỉ xuất hiện trên cluster (như `ImagePullBackOff`).
- **Vai trò của `values.schema.json`**: Là tệp tùy chọn sử dụng chuẩn JSON Schema Draft 7 (`https://json-schema.org/draft-07/schema#`), đặt ở thư mục gốc cạnh `Chart.yaml` và `values.yaml`. Nó giúp chặn lỗi sai kiểu hoặc thiếu trường bắt buộc ngay trên máy người dùng hoặc trong CI trước khi chạm tới cluster. Nếu muốn bắt cả lỗi gõ sai tên trường ngoài các trường đã khai báo, cần thêm `"additionalProperties": false`.
</details>

### Câu Hỏi 6: `values.schema.json` được kích hoạt trong những lệnh `helm` nào và kiểm thực trên đối tượng dữ liệu nào?

<details>
<summary>Đáp án</summary>

- **Tự động kích hoạt**: Schema tự động chạy khi thực thi các lệnh `helm install`, `helm upgrade`, `helm lint`, và `helm template`.
- **Đối tượng kiểm thực**: Kiểm thực được áp dụng trên đối tượng `.Values` cuối cùng sau khi đã hợp nhất (bao gồm `values.yaml` cùng các giá trị truyền từ `-f` hoặc `--set`), chứ không chỉ kiểm tra riêng tệp `values.yaml` thô.
- **Ràng buộc với subchart**: Đối tượng `.Values` cuối cùng cũng được đối chiếu với schema của mọi subchart, ngăn chart cha truyền giá trị vượt quá ràng buộc của subchart.
</details>

### Câu Hỏi 7: Trong thư mục `templates/`, tệp `_helpers.tpl` và `NOTES.txt` đảm nhiệm chức năng gì?

<details>
<summary>Đáp án</summary>

- **`templates/`**: Là thư mục bảo lưu chứa các mẫu Go template để Helm render thành manifest Kubernetes.
- **`_helpers.tpl`**: Chứa các khối template và partials dùng chung trong chart; tệp này không tự sinh ra manifest Kubernetes độc lập.
- **`NOTES.txt`**: Chứa nội dung văn bản hiển thị các chỉ dẫn vận hành cho người dùng sau khi cài đặt release thành công.
</details>

### Câu Hỏi 8: Thư mục `charts/` trong một Helm Chart dùng để làm gì?

<details>
<summary>Đáp án</summary>

`charts/` là thư mục bảo lưu dùng để chứa các **subchart** phụ thuộc của chart chính.
</details>

### Câu Hỏi 9: Tệp `.helmignore` cần đặt ở đâu và có cạm bẫy gì khi viết mẫu loại trừ tệp trong thư mục con?

<details>
<summary>Đáp án</summary>

- **Vị trí & vai trò**: `.helmignore` phải đặt tại thư mục gốc của chart (cạnh `Chart.yaml`), dùng để liệt kê các tệp/thư mục bị loại trừ khi đóng gói chart.
- **Cạm bẫy khớp mẫu**: `.helmignore` sử dụng thuật toán `filepath.Match` của Go, **không hỗ trợ** cú pháp đệ quy hai dấu sao `**` như Git. Do đó, mẫu như `**/*.secret` hoặc `**/*.pem` sẽ không loại trừ được tệp trong thư mục con, dễ gây lộ thông tin nhạy cảm vào gói chart.
- **Cách khắc phục**: Khai báo rõ ràng từng cấp đường dẫn hoặc phần mở rộng, ví dụ `*.secret`, `configs/*.secret`, hoặc `tests/*`.
</details>

### Câu Hỏi 10: Thư mục `crds/` có quy tắc viết tệp và trình tự xử lý như thế nào khi chạy `helm install`?

<details>
<summary>Đáp án</summary>

- **Quy tắc nội dung**: Các tệp trong `crds/` phải là YAML thuần túy, **không được phép sử dụng templating**.
- **Trình tự xử lý khi `helm install`**: Helm nạp các CRD trong `crds/` lên cluster trước, tạm dừng chờ `kube-apiserver` kích hoạt CRD sẵn sàng, rồi mới tiến hành render các tệp trong `templates/`.
</details>

### Câu Hỏi 11: Điều gì xảy ra với các CRD trong `crds/` khi chạy `helm upgrade`, `helm rollback`, và `helm uninstall`? Cách quản trị vòng đời CRD phù hợp là gì?

<details>
<summary>Đáp án</summary>

- **Khi `upgrade` / `rollback`**: Helm không cài lại và cũng không nâng cấp các CRD nằm trong `crds/`.
- **Khi `uninstall`**: Helm không bao giờ xóa CRD để tránh kích hoạt xóa lan truyền (cascading delete) làm mất dữ liệu Custom Resource của các ứng dụng khác trên toàn cluster.
- **Cách quản trị phù hợp**: Quản trị vòng đời CRD độc lập; cập nhật CRD thủ công bằng lệnh `kubectl apply -f crds/` trước khi upgrade hoặc sử dụng Operator chuyên dụng.
</details>

### Câu Hỏi 12: Tóm tắt trình tự các bước mà Helm CLI thực hiện khi chạy lệnh `helm install` một chart có đủ `values.schema.json`, `crds/`, và `templates/`?

<details>
<summary>Đáp án</summary>

1. **Hợp nhất `.Values`**: Gộp cấu hình mặc định từ `values.yaml` với các tùy chọn từ `-f` và `--set` thành đối tượng `.Values` cuối cùng.
2. **Kiểm thực Schema**: Đối chiếu `.Values` đã hợp nhất với `values.schema.json` theo chuẩn Draft 7 (nếu sai, báo lỗi và dừng ngay).
3. **Nạp CRD tĩnh**: Nếu có thư mục `crds/`, tải các CRD YAML thuần túy lên `kube-apiserver` và chờ kích hoạt xong.
4. **Render Templates**: Đưa `.Values` đã kiểm thực qua Template Engine để render các mẫu trong `templates/` thành manifest Kubernetes.
5. **Tạo Release & Tài nguyên**: Gửi manifest tới `kube-apiserver` để tạo Release và các tài nguyên như Pods, Services.
6. **Hoàn tất**: In nội dung `templates/NOTES.txt` ra màn hình cho người vận hành.
</details>
