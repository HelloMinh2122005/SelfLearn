# Ôn Tập: 6_8_6 Tracing

### Câu Hỏi 1: Vì sao Metric và Log truyền thống gặp hạn chế khi chẩn đoán sự cố trong kiến trúc Microservices trên Kubernetes?

<details>
<summary>Đáp án</summary>

Trong mô hình Microservices, một thao tác của người dùng đi qua nhiều dịch vụ độc lập (Ingress Controller, API Gateway, dịch vụ xác thực, đơn hàng, thanh toán, hàng đợi tin nhắn, kho vận), khiến hai trụ cột quan sát truyền thống bộc lộ hạn chế:

- **Giới hạn của Metric**: Metric tổng hợp (như từ Prometheus) cho biết hệ thống đang chậm hoặc tỷ lệ lỗi tăng, nhưng không thể chỉ ra yêu cầu cụ thể nào bị nghẽn hay dịch vụ nào trong chuỗi là nguyên nhân gốc rễ.
- **Giới hạn của Log**: Dù log từ các pod được gom về một nơi tập trung, các dòng nhật ký vẫn rời rạc giữa nhiều tiến trình. Khi thiếu sợi dây liên kết xuyên suốt, kỹ sư không thể dựng lại toàn bộ hành trình của một giao dịch.

</details>

### Câu Hỏi 2: OpenTelemetry là gì và ra đời để giải quyết bài toán nào?

<details>
<summary>Đáp án</summary>

OpenTelemetry là một dự án mã nguồn mở do Cloud Native Computing Foundation (CNCF) quản lý, được hình thành từ sự sáp nhập của hai dự án **OpenTracing** và **OpenCensus**.

Dự án ra đời nhằm chuẩn hóa việc thu thập dữ liệu telemetry gồm **traces**, **metrics** và **logs** theo một tiêu chuẩn mở chung, giải quyết bài toán truy vết hành trình yêu cầu xuyên suốt hệ thống phân tán.

</details>

### Câu Hỏi 3: Trace, Span, Root Span và Child Span là gì, và chúng liên kết với nhau theo cấu trúc nào?

<details>
<summary>Đáp án</summary>

- **Trace**: Biểu diễn toàn bộ đường đi của một request xuyên qua hệ thống phân tán và được định danh bằng một chuỗi **Trace ID** duy nhất.
- **Span**: Là đơn vị công việc cơ bản trong một trace, chứa tên thao tác (`operation name`), mốc thời gian bắt đầu (`start time`) và mốc thời gian kết thúc (`end time`).
- **Root span**: Là span gốc khởi tạo đầu tiên của trace và **không có `parent_id`**.
- **Child span**: Là các span con lưu giữ định danh `parent_id` của span cha để liên kết với nhau theo cấu trúc **cây có hướng không chu trình (DAG)**.

</details>

### Câu Hỏi 4: Theo đặc tả của OpenTelemetry, Span Status gồm những giá trị nào và Span Attributes dùng để làm gì?

<details>
<summary>Đáp án</summary>

- **Span Status**: Có 3 giá trị trạng thái chuẩn phản ánh kết quả thực thi của span là **`Unset`**, **`Ok`** và **`Error`**.
- **Span Attributes**: Là tập hợp các cặp khóa-giá trị (`key-value`) gắn vào span để lưu trữ siêu dữ liệu ngữ cảnh, ví dụ như mã HTTP status hoặc câu truy vấn cơ sở dữ liệu.

</details>

### Câu Hỏi 5: Context propagation là gì và tại sao cơ chế này bắt buộc phải có trong Distributed Tracing?

<details>
<summary>Đáp án</summary>

**Context propagation** là cơ chế đóng gói và truyền tải thông tin ngữ cảnh của trace (như Trace ID và Span ID) xuyên qua các ranh giới tiến trình và kết nối mạng.

Cơ chế này bắt buộc phải có vì khi một yêu cầu di chuyển giữa các container hoặc dịch vụ độc lập qua mạng, mỗi dịch vụ cần nhận được định danh truy vết từ dịch vụ gọi trước đó để tiếp tục tạo child span gắn vào đúng cây trace ban đầu thay vì tạo ra một trace tách rời.

</details>

### Câu Hỏi 6: Theo chuẩn W3C Trace Context, HTTP header `traceparent` có cấu trúc gồm mấy trường và ý nghĩa từng trường là gì?

<details>
<summary>Đáp án</summary>

Đặc tả W3C Trace Context chuẩn hóa việc truyền ngữ cảnh qua HTTP header tên `traceparent` gồm **đúng 4 trường** phân tách bởi dấu gạch nối (`-`):

1. **`version`**: Độ dài **2 ký tự hex**, giá trị quy định hiện tại là `00`.
2. **`trace-id`**: Độ dài cố định **32 ký tự hex (16 bytes)**, định danh duy nhất cho toàn bộ trace và giữ nguyên qua mọi dịch vụ.
3. **`parent-id`**: Độ dài cố định **16 ký tự hex (8 bytes)**, định danh span của tiến trình gọi trước đó.
4. **`trace-flags`**: Độ dài **2 ký tự hex (8-bit bitmap)**, trong đó giá trị `01` biểu thị cờ **`sampled`**, báo hiệu dữ liệu của trace này được thu thập.

</details>

### Câu Hỏi 7: Khi kiểm thử một dịch vụ backend bằng lệnh `curl` có đính kèm header `traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`, dịch vụ sẽ xử lý hai chuỗi định danh trong header này như thế nào?

<details>
<summary>Đáp án</summary>

Dịch vụ backend sẽ phân tích header `traceparent` theo chuẩn W3C Trace Context:

- Lấy chuỗi 32 ký tự hex (`4bf92f3577b34da6a3ce929d0e0e4736`) làm **`trace_id`** chung cho toàn bộ vết truy vết.
- Lấy chuỗi 16 ký tự hex (`00f067aa0ba902b7`) làm định danh span cha (**`parent_id`**) của tiến trình xử lý hiện tại.
- Dựa vào cờ `01` (`sampled`), dịch vụ biết rằng dữ liệu của trace này được thu thập.

</details>

### Câu Hỏi 8: Trong hệ thống xử lý bất đồng bộ qua Apache Kafka, làm thế nào để duy trì tính liên tục của một trace từ Producer sang Consumer?

<details>
<summary>Đáp án</summary>

Ngữ cảnh truy vết vượt qua ranh giới bất đồng bộ của Apache Kafka nhờ thực hiện context propagation qua **Record Headers** của message:

1. **Khi gửi thông điệp (Producer)**: Dịch vụ (như Order Service) sử dụng SDK để inject thông tin trace context (`traceparent`) vào `Record Headers` của message trước khi đẩy vào Kafka topic.
2. **Khi nhận thông điệp (Consumer)**: Dịch vụ nhận (như Notification Service) đọc `Record Headers`, trích xuất `trace_id` và `parent_id`, rồi tạo child span mới gắn vào cây phân cấp DAG ban đầu.

</details>

### Câu Hỏi 9: Tương quan chéo giữa Log và Trace (Correlation) được thực hiện bằng cách nào và mang lại lợi ích gì trong vận hành?

<details>
<summary>Đáp án</summary>

- **Cách thực hiện**: Bổ sung đồng bộ **`trace_id`** và **`span_id`** vào các bản ghi log có cấu trúc JSON. Trong các dịch vụ backend, kỹ thuật **Mapped Diagnostic Context (MDC)** hoặc **OTel Java Agent** cho phép tự động nhúng `trace_id` vào log mà không cần can thiệp vào mã nguồn nghiệp vụ.
- **Lợi ích**: Tracing chỉ ra vị trí dịch vụ bị nghẽn, còn Log ghi lại chi tiết nội dung lỗi nội bộ. Khi thấy một span bị đánh dấu lỗi trên giao diện tracing, kỹ sư có thể tra cứu tức thì toàn bộ dòng log tương ứng trong kho nhật ký mà không phải lọc thủ công theo mốc thời gian.

</details>

### Câu Hỏi 10: Phân biệt vai trò của OpenTelemetry API, OpenTelemetry SDK và OpenTelemetry Collector trong kiến trúc OpenTelemetry?

<details>
<summary>Đáp án</summary>

- **OpenTelemetry API**: Tập hợp các giao diện trừu tượng dùng trong mã nguồn để tạo span và đo đạc chỉ số một cách độc lập với nhà cung cấp.
- **OpenTelemetry SDK**: Bản cài đặt thực tế của API, chịu trách nhiệm quản lý bộ nhớ đệm, áp dụng chính sách lấy mẫu (sampling) và xuất dữ liệu ra mạng.
- **OpenTelemetry Collector**: Thành phần trung gian độc lập có nhiệm vụ tiếp nhận, xử lý và phân phối dữ liệu quan sát tới các backend lưu trữ.

</details>

### Câu Hỏi 11: Pipeline xử lý dữ liệu trong OpenTelemetry Collector gồm những thành phần nào và trong file cấu hình `otel-collector-config.yaml` mẫu, các thành phần đó thực hiện công việc gì?

<details>
<summary>Đáp án</summary>

OTel Collector xử lý dữ liệu telemetry qua một pipeline gồm **3 thành phần kế tiếp nhau**:

1. **`receivers`**: Tiếp nhận dữ liệu đầu vào. Trong cấu hình mẫu, receiver `otlp` lắng nghe giao thức gRPC ở cổng `4317` và HTTP ở cổng `4318`.
2. **`processors`**: Xử lý dữ liệu trung gian. Trong cấu hình mẫu, processor `batch` thực hiện gom lô (`send_batch_size: 1024`, `timeout: 5s`).
3. **`exporters`**: Xuất dữ liệu ra ngoài. Trong cấu hình mẫu, exporter `otlp/tempo` đẩy trace về Tempo (`tempo.monitoring.svc.cluster.local:4317`) và `debug` in chi tiết để kiểm tra.

</details>

### Câu Hỏi 12: OpenTelemetry Collector có những mô hình triển khai nào trên Kubernetes, giao thức OTLP dùng các cổng mặc định nào và các backend mã nguồn mở phổ biến cho trace là gì?

<details>
<summary>Đáp án</summary>

- **Hai mô hình triển khai OTel Collector**:
  - **Agent**: Chạy dạng `DaemonSet` trên từng node hoặc dạng `Sidecar` đi kèm pod ứng dụng.
  - **Gateway**: Chạy thành một cụm Collector tập trung.
- **Cổng mặc định của giao thức OTLP (OpenTelemetry Protocol)**: Cổng **`4317`** cho **gRPC** và cổng **`4318`** cho **HTTP**.
- **Backend lưu trữ và trực quan hóa trace mã nguồn mở phổ biến**: **Jaeger** và **Grafana Tempo**.

</details>

### Câu Hỏi 13: So sánh Head-based Sampling và Tail-based Sampling — vì sao Tail-based Sampling tại Collector Gateway giúp tối ưu chi phí mà vẫn không bỏ sót lỗi?

<details>
<summary>Đáp án</summary>

- **Head-based Sampling**: Quyết định thu thập hay bỏ qua được đưa ra ngay tại **Ingress**, trước khi biết yêu cầu có phát sinh lỗi hoặc bị chậm hay không. Dù giảm tải mạng tức thì, cách này có nguy cơ bỏ sót các trace bị lỗi ở tầng dịch vụ phía sau nếu yêu cầu đó không nằm trong tỷ lệ mẫu chọn ngẫu nhiên.
- **Tail-based Sampling**: Tất cả dịch vụ tạm thời gửi span về **OpenTelemetry Collector Gateway**. Bộ xử lý Collector chỉ quyết định giữ lại các trace có span bị lỗi (`Error`) hoặc có thời gian phản hồi vượt ngưỡng trễ. Nhờ đó, hệ thống bắt trọn vẹn các sự cố thực tế mà không lãng phí dung lượng lưu trữ cho các yêu cầu bình thường.

</details>

### Câu Hỏi 14: Vì sao việc đẩy tác vụ sang Worker Thread Pool trong xử lý bất đồng bộ nội bộ có thể làm đứt đoạn cây truy vết, và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân đứt đoạn**: Khi một dịch vụ chuyển giao tác vụ sang một nhóm luồng nền (**Worker Thread Pool**) mà quên sao chép đối tượng ngữ cảnh (trace context), luồng mới sẽ không đọc được mã vết của luồng gọi ban đầu. Các span con sinh ra trong luồng nền lúc này sẽ biến thành một root span mới hoàn toàn tách rời, làm cây phân cấp truy vết bị đứt đoạn.
- **Cách khắc phục**: Sử dụng các **wrapper thực thi** của OpenTelemetry SDK để tự động truyền tiếp ngữ cảnh sang luồng nền mới.

</details>

### Câu Hỏi 15: Rủi ro bảo mật nào có thể phát sinh từ Span Attributes và kỹ sư vận hành cần xử lý rủi ro đó ở đâu?

<details>
<summary>Đáp án</summary>

- **Rủi ro bảo mật (lộ PII)**: Nếu ứng dụng tự động đưa toàn bộ câu truy vấn cơ sở dữ liệu hoặc nội dung gói tin vào **Span Attributes**, các thông tin nhạy cảm như mật khẩu hay số thẻ tín dụng sẽ bị hiển thị trực tiếp trên giao diện giám sát chung.
- **Cách khắc phục**: Cần áp dụng **bộ xử lý (processor)** tại **OpenTelemetry Collector** để biến đổi hoặc che giấu dữ liệu nhạy cảm trước khi xuất dữ liệu ra các backend lưu trữ bên ngoài.

</details>
