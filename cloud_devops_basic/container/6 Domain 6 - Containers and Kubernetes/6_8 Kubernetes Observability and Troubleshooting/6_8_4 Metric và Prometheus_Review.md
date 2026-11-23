# Ôn Tập: 6_8_4 Metric và Prometheus

### Câu Hỏi 1: Vì sao các lệnh kiểm tra trạng thái tức thời trên Kubernetes không đủ để chẩn đoán sự cố hiệu năng, và Prometheus giải quyết hạn chế này như thế nào?

<details>
<summary>Đáp án</summary>

Các lệnh kiểm tra thông thường chỉ chụp một lát cắt dữ liệu tại thời điểm hiện tại mà không lưu giữ ký ức theo thời gian, nên người vận hành không thể biết xu hướng biến động trước đó (như mức tăng đột biến 10 phút trước, tỉ lệ lỗi đang tăng hay giảm, độ trễ phân vị 99% hay tốc độ đầy ổ đĩa).

**Prometheus** giải quyết vấn đề này bằng cách cung cấp một hệ thống giám sát và **cơ sở dữ liệu chuỗi thời gian (TSDB - Time Series Database)** đa chiều, liên tục thu thập và lưu trữ lịch sử metric theo thời gian để phục vụ truy vấn xu hướng và cảnh báo.
</details>

### Câu Hỏi 2: Hãy phân biệt `metrics-server` và `Prometheus` về lưu trữ, lịch sử dữ liệu, loại metric, khả năng truy vấn và mục đích sử dụng?

<details>
<summary>Đáp án</summary>

Hai công cụ này phục vụ hai mục đích hoàn toàn khác nhau trong Kubernetes:

| Tiêu chí | Kubernetes `metrics-server` | Prometheus Server |
| :--- | :--- | :--- |
| **Lưu trữ** | Chỉ lưu tạm trong RAM (in-memory) | TSDB chuyên dụng lưu trên đĩa |
| **Lịch sử** | Không có (chỉ giữ giá trị mới nhất) | Lưu giữ nhiều ngày/tháng theo cấu hình retention |
| **Loại metric** | Chỉ đo CPU và RAM thô của Node/Pod | Đo mọi tầng: phần cứng, Kubernetes, tầng ứng dụng |
| **Truy vấn** | Không có ngôn ngữ truy vấn | Ngôn ngữ truy vấn mạnh mẽ PromQL |
| **Công dụng** | Phục vụ `kubectl top` và HPA cơ bản | Giám sát toàn diện, Grafana dashboard, Alertmanager |
</details>

### Câu Hỏi 3: `kubectl top` lấy dữ liệu từ đâu, và bạn sử dụng câu lệnh nào để xem nhanh mức CPU/RAM tức thời của toàn bộ Node cũng như các container trong Pod thuộc một namespace?

<details>
<summary>Đáp án</summary>

Lệnh `kubectl top` sử dụng **`metrics-server`**, thành phần thu thập số liệu CPU và bộ nhớ từ `kubelet` thông qua **Metrics API (`metrics.k8s.io`)**.

Hai lệnh thường dùng để kiểm tra nhanh:
- Xem CPU và RAM tức thời của toàn bộ Node: `kubectl top nodes`
- Xem tài nguyên của từng container trong các Pod thuộc namespace chỉ định (ví dụ `default`): `kubectl top pods -n default --containers`
</details>

### Câu Hỏi 4: Prometheus thu thập dữ liệu theo mô hình nào? Hãy phân biệt vai trò của `Node Exporter`, `kube-state-metrics` và `cAdvisor` trong cụm Kubernetes?

<details>
<summary>Đáp án</summary>

Prometheus hoạt động theo **mô hình Pull (Scrape)**: máy chủ Prometheus định kỳ gửi HTTP request tới các endpoint cấu hình sẵn để kéo dữ liệu metric dạng text.

Vai trò của 3 thành phần thu thập cốt lõi trong Kubernetes:
1. **Node Exporter**: Chạy dưới dạng `DaemonSet` trên từng node Linux, thu thập các số liệu phần cứng và hệ điều hành tầng OS (CPU, memory, disk, network) thông qua các collector của nhân Linux.
2. **kube-state-metrics (KSM)**: Lắng nghe `kube-apiserver` để tạo ra các metric phản ánh trạng thái logic của các đối tượng Kubernetes như Deployment, Pod, PVC (ví dụ: số replica mong muốn so với thực tế, trạng thái Pod phase).
3. **cAdvisor (Container Advisor)**: Được tích hợp trực tiếp vào daemon `kubelet` trên mỗi node, tự động phát hiện mọi container đang chạy và thu thập số liệu tài nguyên `cgroup` (CPU, bộ nhớ, file system, network usage).
</details>

### Câu Hỏi 5: Prometheus Operator giải quyết bài toán gì trong Kubernetes, và 3 CRD cốt lõi mà nó cung cấp dùng để làm gì?

<details>
<summary>Đáp án</summary>

Trong môi trường Kubernetes biến động liên tục với các Pod sinh ra và mất đi thường xuyên, cấu hình scrape tĩnh truyền thống không đáp ứng được. **Prometheus Operator** mang tư duy quản trị **declarative** (khai báo) vào hệ thống giám sát để tự động hóa việc cấu hình mục tiêu scrape và cảnh báo.

Ba Custom Resource Definition (CRD) cốt lõi gồm:
- `ServiceMonitor`: Định nghĩa cách tự động scrape tập hợp các Kubernetes Service.
- `PodMonitor`: Định nghĩa cách tự động scrape trực tiếp các Pod.
- `PrometheusRule`: Định nghĩa các luật cảnh báo (alerting rules) hoặc recording rules theo phong cách Kubernetes YAML.
</details>

### Câu Hỏi 6: `ServiceMonitor` hoạt động như thế nào để Prometheus Server tự động thu thập metric khi triển khai một microservice mới?

<details>
<summary>Đáp án</summary>

`ServiceMonitor` chỉ định cách Prometheus Operator tự động cấu hình scrape tập hợp các Service Kubernetes thông qua:
- `spec.selector.matchLabels`: Nhãn để chọn đúng Service mục tiêu (ví dụ `app: payment-service`).
- `spec.namespaceSelector`: Chỉ định namespace chứa Service cần giám sát (ví dụ `production`).
- `spec.endpoints`: Khai báo cổng (`port`), đường dẫn metric (`path`, ví dụ `/actuator/prometheus`), chu kỳ thu thập (`interval`) và thời gian chờ (`scrapeTimeout`).

Khi bạn triển khai một microservice mới kèm `ServiceMonitor`, Prometheus Operator sẽ tự động phát hiện qua Kubernetes API và cập nhật danh bạ scrape target cho Prometheus Server mà không cần chỉnh sửa cấu hình thủ công hay khởi động lại Prometheus.
</details>

### Câu Hỏi 7: Trình bày 4 kiểu dữ liệu metric trong Prometheus và giải thích vì sao `Histogram` phổ biến hơn `Summary` trong môi trường Kubernetes?

<details>
<summary>Đáp án</summary>

Bốn kiểu dữ liệu metric cơ bản trong Prometheus:
1. **Counter**: Giá trị số tích lũy đơn điệu, chỉ tăng dần theo thời gian hoặc được đặt lại về `0` khi tiến trình khởi động lại (restart).
2. **Gauge**: Giá trị số đơn lẻ có thể tăng lên hoặc giảm xuống bất kỳ lúc nào (ví dụ: lượng RAM đang sử dụng hoặc số tiến trình đang chạy).
3. **Histogram**: Lấy mẫu các quan sát (như thời lượng yêu cầu hoặc kích thước phản hồi) và đếm chúng vào các bucket cấu hình trước, kèm theo tổng số đếm (`_count`) và tổng giá trị quan sát (`_sum`).
4. **Summary**: Lấy mẫu quan sát tương tự Histogram nhưng tính toán phân vị (quantile) trực tiếp tại phía client.

Trong Kubernetes, **`Histogram` phổ biến hơn `Summary`** vì các bucket của Histogram có thể cộng dồn qua nhiều Pod bằng PromQL (ví dụ để tính phân vị P99 trên toàn bộ một microservice nhiều replica), điều mà Summary tính sẵn tại từng client không cộng gộp chính xác được.
</details>

### Câu Hỏi 8: Hàm `rate()` và `increase()` trong PromQL khác nhau như thế nào, và chúng tự động xử lý hiện tượng gì của Counter?

<details>
<summary>Đáp án</summary>

Cả `rate()` và `increase()` đều dùng cho metric kiểu **Counter** trên một cửa sổ thời gian (range vector) và đều **tự động xử lý hiện tượng counter reset** (khi ứng dụng/container restart khiến bộ đếm quay về `0`):
- **`rate()`**: Tính toán **tốc độ tăng trung bình mỗi giây** của một counter trong khoảng thời gian xác định (ví dụ: số request/giây).
- **`increase()`**: Tính toán **mức tăng tuyệt đối** của counter trong khoảng thời gian xác định, tương đương với `rate(v[s]) * s` sau khi tính ngoại suy (ví dụ: `increase(kube_pod_container_status_restarts_total{namespace="production"}[10m])` để đếm số lần container restart trong 10 phút qua).
</details>

### Câu Hỏi 9: Mệnh đề `sum by (...)` trong PromQL thực hiện thao tác gì đối với các time series và các nhãn (labels)?

<details>
<summary>Đáp án</summary>

Mệnh đề `sum by (<danh_sách_nhãn>)` thực hiện **gom nhóm và tính tổng** giá trị của các time series có cùng giá trị ở các nhãn được chỉ định, đồng thời **loại bỏ tất cả các nhãn khác** không nằm trong danh sách của `by`.

Ví dụ trong `sum by (service) (rate(http_requests_total[5m]))`, PromQL sẽ cộng gộp tốc độ request từ mọi Pod/instance có cùng nhãn `service` thành một chuỗi duy nhất cho mỗi service và bỏ qua các nhãn như `pod`, `instance`, hay `status`.
</details>

### Câu Hỏi 10: Trong PromQL, hàm `histogram_quantile()` dùng để làm gì, và vì sao khi tính P99 cho nhiều Pod bắt buộc phải giữ lại nhãn `le`?

<details>
<summary>Đáp án</summary>

Hàm `histogram_quantile(φ, ...)` tính toán **phân vị thứ `φ`** (với `0 ≤ φ ≤ 1`, ví dụ `0.95` cho P95 hoặc `0.99` cho P99) từ các bucket của metric kiểu Histogram theo nguyên lý nội suy tuyến tính. Chỉ số P99 cho biết ngưỡng thời gian mà 99% request hoàn thành nhanh hơn mức đó, giúp phát hiện độ trễ ở nhóm người dùng chậm nhất mà giá trị trung bình `avg()` thường che khuất.

Câu truy vấn chuẩn cho P99 trên toàn hệ thống là:
```promql
histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
```
Trong đó **bắt buộc phải dùng `sum by (le)`** để giữ lại nhãn `le` (less than or equal - ranh giới trên của từng bucket), vì `histogram_quantile()` cần các bucket với ranh giới `le` để nội suy ra giá trị phân vị.
</details>

### Câu Hỏi 11: Phương pháp luận giám sát RED gồm những thành phần nào, áp dụng cho đối tượng gì, và viết như thế nào bằng PromQL?

<details>
<summary>Đáp án</summary>

Phương pháp **RED** (do Tom Wilkie phát triển) tập trung giám sát **microservices** từ góc độ dịch vụ khách hàng với 3 thành phần:
1. **Rate** (tốc độ yêu cầu mỗi giây):
   ```promql
   sum by (service) (rate(http_requests_total[5m]))
   ```
2. **Errors** (số lượng hoặc tỉ lệ yêu cầu thất bại, ví dụ HTTP 5xx theo %):
   ```promql
   (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100
   ```
3. **Duration** (thời gian xử lý yêu cầu, thường đo bằng P99):
   ```promql
   histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
   ```
</details>

### Câu Hỏi 12: Hãy phân biệt phương pháp luận giám sát USE và 4 Golden Signals của Google SRE?

<details>
<summary>Đáp án</summary>

- **Phương pháp USE** (của Brendan Gregg) tập trung vào giám sát **tài nguyên phần cứng và hạ tầng hệ thống** với 3 khía cạnh:
  - **Utilization**: Tỉ lệ thời gian hoặc dung lượng tài nguyên đang bận.
  - **Saturation**: Mức độ quá tải hoặc hàng đợi đang chờ xử lý.
  - **Errors**: Số lỗi phần cứng hoặc thiết bị.

- **Bốn Golden Signals của Google SRE** là bộ chỉ số cốt lõi cho hệ thống hướng người dùng, gồm:
  - **Latency**: Độ trễ xử lý yêu cầu.
  - **Traffic**: Lưu lượng nhu cầu gửi đến hệ thống.
  - **Errors**: Tỉ lệ yêu cầu bị lỗi.
  - **Saturation**: Độ bão hòa mức sử dụng tài nguyên sắp chạm ngưỡng giới hạn.
</details>

### Câu Hỏi 13: Để một ứng dụng Java Spring Boot xuất metric theo định dạng Prometheus tại endpoint `/actuator/prometheus`, cần tích hợp thư viện và cấu hình những gì?

<details>
<summary>Đáp án</summary>

Cần thực hiện 2 bước:
1. **Thêm 2 dependency** vào dự án Spring Boot:
   - `spring-boot-starter-actuator` (cung cấp các endpoint quản trị của Spring Boot Actuator).
   - `micrometer-registry-prometheus` (chuyển đổi metric sang định dạng Prometheus).
2. **Mở endpoint trong tệp `application.properties`**:
   ```properties
   management.endpoints.web.exposure.include=health,info,prometheus
   management.endpoint.prometheus.enabled=true
   ```
Sau khi cấu hình, ứng dụng sẽ cung cấp dữ liệu metric tại đường dẫn `/actuator/prometheus` để Prometheus Server scrape.
</details>

### Câu Hỏi 14: Bẫy bùng nổ nhãn (Cardinality Explosion) trong Prometheus là gì, nguyên nhân từ đâu và cách phòng tránh?

<details>
<summary>Đáp án</summary>

Trong TSDB của Prometheus, mỗi tổ hợp giá trị nhãn (**label set**) duy nhất sẽ tạo ra một time series độc lập.

- **Nguyên nhân & Hậu quả**: Nếu gắn các định danh có tập giá trị vô hạn (như `user_id`, `order_id`) vào label của metric, hệ thống sẽ sinh ra hàng triệu time series riêng biệt, làm máy chủ Prometheus cạn kiệt RAM và sập tiến trình.
- **Cách phòng tránh**: Chỉ đặt nhãn cho các thuộc tính có tập giá trị hữu hạn và kiểm soát được, chẳng hạn như mã lỗi HTTP, HTTP method hoặc tên service.
</details>

### Câu Hỏi 15: Vì sao không được dùng hàm `rate()` lên metric kiểu `Gauge` (như lượng RAM đang dùng `node_memory_Active_bytes`), và nên thay bằng hàm nào?

<details>
<summary>Đáp án</summary>

Metric kiểu `Gauge` có thể tăng lên và giảm xuống tự nhiên. Hàm `rate()` chỉ được thiết kế cho kiểu `Counter`: khi thấy giá trị hiện tại nhỏ hơn giá trị trước đó (như khi RAM được giải phóng và giảm xuống), `rate()` sẽ **lầm tưởng bộ đếm vừa bị reset về `0`** và tự động tính bù trừ ngoại suy, tạo ra các đỉnh số liệu ảo sai lệch hoàn toàn trên đồ thị.

Để đo mức độ biến thiên của metric kiểu `Gauge`, cần sử dụng hàm **`deriv()`** hoặc **`delta()`**.
</details>

### Câu Hỏi 16: Khi dùng hàm `rate()`, điều gì xảy ra nếu đặt cửa sổ thời gian (range vector) bằng hoặc ngắn hơn chu kỳ scrape, và quy tắc thực hành tốt là gì?

<details>
<summary>Đáp án</summary>

Hàm `rate()` yêu cầu **tối thiểu 2 điểm mẫu dữ liệu** nằm trong cửa sổ thời gian để tính tốc độ tăng.

- **Vấn đề**: Nếu chu kỳ scrape là 15 giây mà bạn đặt cửa sổ `[10s]` hoặc `[15s]`, chỉ cần có một chút trễ mạng nhẹ, cửa sổ đó sẽ chỉ bắt được 1 điểm mẫu hoặc 0 điểm mẫu, khiến đồ thị bị ngắt đoạn hoặc báo không có dữ liệu.
- **Quy tắc thực hành tốt**: Đặt cửa sổ range vector **tối thiểu gấp 2 lần và tốt nhất là gấp 4 lần** chu kỳ scrape (ví dụ: dùng `[1m]` cho chu kỳ scrape 15 giây để đảm bảo có khoảng 4 điểm mẫu).
</details>

### Câu Hỏi 17: Mặc định Prometheus lưu trữ dữ liệu TSDB trong bao lâu, và cần cấu hình những cờ nào để tránh đầy phân vùng đĩa?

<details>
<summary>Đáp án</summary>

Mặc định Prometheus giữ dữ liệu trong **15 ngày**, điều này có thể làm đầy phân vùng đĩa nếu lượng metric lớn.

Để kiểm soát dung lượng và giúp TSDB chủ động dọn dẹp dữ liệu cũ khi chạm ngưỡng, luôn thiết lập 2 cờ giới hạn sau:
- `--storage.tsdb.retention.time`: Thời gian lưu trữ tối đa (ví dụ: `30d`).
- `--storage.tsdb.retention.size`: Hạn mức dung lượng tối đa trên đĩa (ví dụ: `50Gi`).
</details>
