# Ôn Tập: 6_8_3 Logging

### Câu Hỏi 1: Tại sao trong Kubernetes ứng dụng phải ghi log ra `stdout` và `stderr` thay vì ghi vào tệp tin cục bộ bên trong container?

<details>
<summary>Đáp án</summary>

- **Vòng đời phù du (ephemeral lifecycle)**: Trong Kubernetes, Pod có thể bị hủy, tái tạo hoặc dịch chuyển sang node khác bất kỳ lúc nào (khi gặp sự cố phần cứng, auto-scaling hoặc nâng cấp phiên bản). Nếu ứng dụng ghi log vào hệ thống tệp bên trong container, toàn bộ lịch sử log sẽ biến mất khi container bị hủy.
- **Vận hành và kiểm soát**: Kubernetes coi log là luồng sự kiện liên tục (event streams) qua `stdout` và `stderr`. Nếu ghi vào file cục bộ bên trong container, lệnh `kubectl logs` sẽ trả về kết quả rỗng hoàn toàn, đồng thời tệp log phình to có thể làm cạn kiệt dung lượng ổ đĩa phân vùng root của container.
</details>

---

### Câu Hỏi 2: Khi ứng dụng ghi log ra `stdout`/`stderr`, thành phần nào thu thập luồng log đó ở cấp độ worker node, lưu ở đâu, và điều gì xảy ra khi Pod bị xóa hoặc bị trục xuất (evicted)?

<details>
<summary>Đáp án</summary>

- **Thành phần thu thập & vị trí lưu trữ**: Container runtime (như `containerd` hoặc `CRI-O`) chặn bắt luồng `stdout`/`stderr` của container và ghi nối tiếp vào các tệp log cục bộ trên host node tại thư mục `/var/log/pods/`.
- **Khi Pod bị xóa hoặc evicted**: Toàn bộ các tệp log cục bộ của Pod đó trên hệ thống tệp của worker node sẽ bị dọn dẹp và xóa bỏ hoàn toàn. Vì vậy, không thể dựa vào log cục bộ trên node để lưu trữ lâu dài.
</details>

---

### Câu Hỏi 3: Thành phần nào quản lý xoay vòng tệp log (log rotation) trên worker node, thông qua những tham số nào, và rủi ro gì xảy ra nếu một ứng dụng xả log liên tục không kiểm soát?

<details>
<summary>Đáp án</summary>

- **Quản lý log rotation**: `kubelet` trên từng worker node chịu trách nhiệm quản lý vòng đời xoay vòng tệp log cục bộ thông qua hai tham số cấu hình là `containerLogMaxSize` và `containerLogMaxFiles`.
- **Rủi ro cạn kiệt đĩa (Node Disk Pressure)**: Khi một dịch vụ gặp lỗi lặp vô tận và xả lượng log khổng lồ ra `stdout`, thư mục `/var/log/pods/` trên worker node có thể bị lấp đầy nhanh chóng. Điều này kích hoạt cơ chế bảo vệ của `kubelet`, gán taint `DiskPressure` lên node và trục xuất (evict) hàng loạt Pod khác.
- **Biện pháp phòng tránh**: Thiết lập cấu hình log rotation chặt chẽ trên `kubelet` (`containerLogMaxSize`, `containerLogMaxFiles`) kết hợp áp dụng `rate-limiting` trên logging agent.
</details>

---

### Câu Hỏi 4: Lệnh `kubectl logs` hoạt động theo luồng kiến trúc như thế nào để lấy được dữ liệu log trả về cho người quản trị?

<details>
<summary>Đáp án</summary>

1. Người quản trị chạy lệnh `kubectl logs`, yêu cầu được gửi tới **Kubernetes API Server**.
2. **API Server** ủy quyền (proxy) kết nối trực tiếp tới **`kubelet`** trên worker node đang lưu giữ Pod đó.
3. **`kubelet`** đọc dữ liệu từ tệp log cục bộ của Pod trên host node (`/var/log/pods/...`) và trả kết quả về cho người dùng.
</details>

---

### Câu Hỏi 5: Khi điều tra sự cố bằng `kubectl logs`, các cờ `--previous` (`-p`), `--since`, `-l` (`--selector`), `--prefix`, `-f` (`--follow`), `-c` và `--tail` có tác dụng gì?

<details>
<summary>Đáp án</summary>

- `--previous` (`-p`): Lấy log của container instance trước đó vừa bị chấm dứt/crash thay vì container mới khởi động lại (rất hữu ích khi debug `CrashLoopBackOff`).
- `--since`: Lọc và chỉ hiển thị các dòng log được ghi nhận trong một khoảng thời gian tương đối đã chỉ định (ví dụ: `--since=10m`).
- `-l` (`--selector`): Lọc và gom log từ tất cả các Pod khớp với nhãn (label) được cung cấp (ví dụ: `-l app=hello-svc`).
- `--prefix`: Tự động bổ sung tiền tố định danh gồm tên Pod và tên container ở đầu mỗi dòng khi gom log từ nhiều Pod hoặc nhiều container.
- `-f` (`--follow`): Duy trì kết nối luồng dữ liệu liên tục để theo dõi log theo thời gian thực.
- `-c`: Chỉ định tên container cụ thể cần lấy log trong một Pod có nhiều container.
- `--tail`: Giới hạn số dòng log gần nhất được hiển thị (ví dụ: `--tail=50`).
</details>

---

### Câu Hỏi 6: Tại sao trong hệ thống phân tán nên xuất log ở định dạng Single-line JSON thay vì văn bản tự do (plain text), đặc biệt khi ứng dụng phát sinh stack trace nhiều dòng?

<details>
<summary>Đáp án</summary>

- **Vấn đề của plain text**: Log văn bản tự do gây khó khăn cho việc tìm kiếm, lọc tự động. Khi xuất lỗi Exception có stack trace nhiều dòng với ký tự xuống dòng vật lý, container runtime và logging agent sẽ coi mỗi dòng là một sự kiện log độc lập — gọi là hiện tượng **vỡ dòng (line splitting)**. Một lỗi duy nhất bị xé thành hàng chục bản ghi rời rạc, làm sai lệch số liệu cảnh báo và vô hiệu hóa truy vấn lọc.
- **Lợi ích của Single-line JSON**: Mỗi sự kiện log là một dòng JSON hợp lệ duy nhất kết thúc bằng một ký tự xuống dòng. Toàn bộ stack trace được mã hóa (thay ký tự xuống dòng bên trong bằng `\n`) và gói gọn trong trường `"message"`, giúp parser nhận diện chính xác toàn bộ stack trace là một sự kiện log duy nhất.
</details>

---

### Câu Hỏi 7: Một bản ghi log có cấu trúc chuẩn mực (Structured Logging) cần chứa những trường dữ liệu thiết yếu nào và ý nghĩa của từng trường là gì?

<details>
<summary>Đáp án</summary>

Một bản ghi log chuẩn mực cần có các trường thiết yếu sau:
- `timestamp`: Thời gian phát sinh sự kiện theo chuẩn ISO 8601 hoặc RFC 3339.
- `level`: Mức độ nghiêm trọng của sự kiện (như `INFO`, `WARN`, `ERROR`).
- `service`: Tên dịch vụ xuất log.
- `version`: Phiên bản ứng dụng.
- `trace_id`: Mã định danh vết phân tán (distributed tracing).
- `request_id`: Mã định danh yêu cầu HTTP.
- `message`: Nội dung thông điệp mô tả sự kiện.
</details>

---

### Câu Hỏi 8: Khi cụm Kubernetes chưa triển khai hệ thống logging tập trung, người vận hành có thể dùng cách nào để lọc nhanh các bản ghi lỗi `ERROR` từ log JSON một dòng ngay trên terminal?

<details>
<summary>Đáp án</summary>

Có thể kết hợp lệnh `kubectl logs` qua đường ống (`|`) với tiện ích dòng lệnh **`jq`** để lọc các trường JSON và định dạng kết quả trực quan theo thời gian thực. Ví dụ:

```bash
kubectl logs -l app=hello-svc --prefix --since=10m | jq -r 'select(.level=="ERROR") | "\(.timestamp) [\(.service)] [\(.trace_id)] \(.message)"'
```
</details>

---

### Câu Hỏi 9: Vì sao kiến trúc Logging Agent chạy dưới dạng `DaemonSet` được xem là mô hình thu thập log tập trung phổ biến và tối ưu nhất trên Kubernetes, và nó đọc log bằng cơ chế nào?

<details>
<summary>Đáp án</summary>

- **Lý do bắt buộc dùng thu thập tập trung**: Vì tệp log cục bộ trên worker node sẽ bị xóa sạch khi Pod bị hủy hoặc trục xuất, hệ thống production phải đẩy log về kho lưu trữ tập trung để bảo toàn dữ liệu điều tra.
- **Ưu điểm của `DaemonSet`**: Triển khai đúng một Pod agent trên mỗi worker node để thu thập log cho toàn bộ các container trên node đó, giúp tối ưu tài nguyên nhất và không cần sửa đổi mã nguồn ứng dụng (zero code changes).
- **Cơ chế truy cập log**: Logging agent DaemonSet gắn kết thư mục `/var/log/pods` (và `/var/log/containers`) từ máy chủ worker node vào container agent thông qua cơ chế **`hostPath` volume** ở chế độ chỉ đọc (`readOnly: true`).
</details>

---

### Câu Hỏi 10: Trong quy trình thu thập log tập trung cấp cụm, những công cụ nào thường đóng vai trò làm Logging Agent, quá trình xử lý trước khi lưu gồm bước gì, và dữ liệu được đẩy về đâu để lưu trữ và trực quan hóa?

<details>
<summary>Đáp án</summary>

- **Logging Agent phổ biến**: Fluent Bit, Fluentd và OpenTelemetry Collector.
- **Quá trình xử lý của Agent**: Thu thập log từ node, bóc tách cấu trúc (parse) và làm giàu siêu dữ liệu (**enrich metadata** như `namespace`, tên Pod, nhãn/labels).
- **Lưu trữ & đánh chỉ mục tập trung**: Elasticsearch, OpenSearch hoặc Grafana Loki.
- **Giao diện truy vấn & trực quan hóa**: Kibana hoặc Grafana Dashboard.
</details>

---

### Câu Hỏi 11: So sánh 3 mô hình thu thập log (DaemonSet Agent, Sidecar Container, Ghi trực tiếp từ ứng dụng) về mức tiêu thụ tài nguyên, mức xâm lấn mã nguồn và trường hợp áp dụng phù hợp?

<details>
<summary>Đáp án</summary>

- **Logging Agent Node (`DaemonSet`)**:
  - *Tài nguyên*: Tối ưu nhất (1 agent duy nhất cho toàn bộ node).
  - *Xâm lấn mã nguồn*: Không xâm lấn (zero code changes).
  - *Áp dụng*: Tiêu chuẩn cho hầu hết cụm production.
- **Sidecar Logging Container**:
  - *Tài nguyên*: Tốn tài nguyên (mỗi Pod phải gánh thêm 1 container phụ).
  - *Xâm lấn mã nguồn*: Cần cấu hình bổ sung trong Pod manifest (có nguy cơ mất log nếu cả Pod bị xóa đồng thời).
  - *Áp dụng*: Phù hợp cho ứng dụng legacy không thể sửa code, chỉ ghi log ra file nội bộ (ví dụ dùng sidecar `tail` file đó ra `stdout` của sidecar).
- **Ghi trực tiếp từ ứng dụng (tích hợp SDK)**:
  - *Tài nguyên*: Tốn CPU/RAM của chính container ứng dụng.
  - *Xâm lấn mã nguồn*: Rất cao (phụ thuộc thư viện trong source code; có thể mất log chưa kịp flush qua network khi crash).
  - *Áp dụng*: Trường hợp đặc thù ngoài hạ tầng Kubernetes.
</details>

---

### Câu Hỏi 12: Trong môi trường production, cần lưu ý nguyên tắc bảo mật nào khi ghi log để tránh rò rỉ dữ liệu nhạy cảm và thông tin định danh người dùng (PII)?

<details>
<summary>Đáp án</summary>

- **Thông tin tuyệt đối không được ghi vào log**: Mật khẩu tài khoản, chuỗi kết nối cơ sở dữ liệu, API key, token xác thực bí mật, số thẻ thanh toán và dữ liệu định danh người dùng (PII).
- **Giải pháp phòng ngừa**: Thiết lập quy tắc lọc và làm mờ dữ liệu (**masking / sanitization**) ngay tại ứng dụng hoặc thông qua bộ lọc (filter) của logging agent trước khi gửi dữ liệu về kho lưu trữ tập trung.
</details>
