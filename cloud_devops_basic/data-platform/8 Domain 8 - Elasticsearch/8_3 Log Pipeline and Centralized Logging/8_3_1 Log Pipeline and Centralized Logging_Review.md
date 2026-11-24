# Review: 8_3_1 Log Pipeline and Centralized Logging

### Câu Hỏi 1: Trên Kubernetes, ứng dụng nên ghi log ra đâu và container runtime lưu các log đó ở đâu trên node?

<details>
<summary>Đáp án</summary>

Ứng dụng được khuyến nghị ghi toàn bộ nhật ký ra hai luồng chuẩn của hệ điều hành là `stdout` (luồng đầu ra chuẩn) và `stderr` (luồng lỗi chuẩn) thay vì tự quản lý file log bên trong container.

Container runtime trên node (như `containerd` hoặc `CRI-O`) sẽ tự động chuyển hướng `stdout`/`stderr` thành các tệp log trên ổ đĩa của node tại thư mục `/var/log/pods` (và có liên kết tại `/var/log/containers`).

</details>

### Câu Hỏi 2: Lệnh `kubectl logs <pod-name>` lấy dữ liệu log bằng cách nào, và vì sao hệ thống sản xuất không thể chỉ dựa vào lệnh này?

<details>
<summary>Đáp án</summary>

Khi chạy `kubectl logs <pod-name>`, Kubernetes API server chuyển yêu cầu tới **kubelet** để đọc trực tiếp từ tệp log do container runtime lưu trên node của Pod đó.

Hệ thống sản xuất không thể chỉ dựa vào lệnh này vì kubelet và container runtime thực hiện xoay vòng (log rotation) và xóa bỏ tệp log cũ khi container bị xóa, Pod bị thu hồi (evict) hoặc bị thay thế. Do đó, log cần được thu thập và đẩy về kho tập trung ngay khi vừa sinh ra.

</details>

### Câu Hỏi 3: Vì sao agent thu log trên Kubernetes thường được triển khai dưới dạng DaemonSet, và cần áp dụng nguyên tắc quyền tối thiểu nào cho Pod agent?

<details>
<summary>Đáp án</summary>

Agent thu log chạy dạng **DaemonSet** để Kubernetes bảo đảm luôn có đúng một Pod agent chạy trên mỗi node, từ đó gom log cho toàn bộ các container trên node đó từ thư mục log cục bộ.

Theo nguyên tắc quyền tối thiểu (least privilege), Pod DaemonSet chỉ nên được gắn thư mục log trên node ở chế độ chỉ đọc (read-only) và chỉ được cấp quyền đọc metadata của Pod/Namespace thông qua Kubernetes RBAC.

</details>

### Câu Hỏi 4: Log JSON có cấu trúc (structured logging) là gì và mang lại lợi ích gì so với log văn bản tự do?

<details>
<summary>Đáp án</summary>

**Structured logging** là cách định dạng mỗi sự kiện log thành một đối tượng JSON với các khóa cố định như `@timestamp`, `level`, `service`, `trace_id` và `message`, thay vì xuất chuỗi văn bản tự do.

Cách này giúp pipeline lọc và thống kê chính xác theo từng trường dữ liệu mà không cần viết biểu thức chính quy (regex) phức tạp.

</details>

### Câu Hỏi 5: Hiện tượng mapping explosion trong Elasticsearch là gì và cách phòng tránh như thế nào?

<details>
<summary>Đáp án</summary>

Trong Elasticsearch, tên khóa JSON mặc định được ánh xạ thành các field trong mapping của index. Nếu ứng dụng sinh ra quá nhiều tên khóa động (ví dụ lấy ID ngẫu nhiên hoặc `user_id`, `request_id` làm tên khóa JSON), số lượng field sẽ tăng mất kiểm soát, gây ra **mapping explosion** — làm tốn bộ nhớ và gây áp lực lên cluster state.

Cách phòng tránh là chuẩn hóa các tên khóa JSON cố định và đặt các giá trị động (như `user_id`, `request_id`) làm **giá trị** của một khóa cố định.

</details>

### Câu Hỏi 6: Log đa dòng (multiline log) gây ra vấn đề gì nếu không được xử lý, và agent khắc phục bằng cách nào?

<details>
<summary>Đáp án</summary>

Với log đa dòng (như Java hoặc Python stack trace có dòng đầu báo lỗi và các dòng sau thụt lề `at ...`), nếu thiếu quy tắc xử lý, agent sẽ tách từng dòng thành nhiều sự kiện log rời rạc, làm mất thông tin nguyên nhân lỗi khi lọc.

Để khắc phục, cần cấu hình bộ lọc **multiline** tại agent nhằm gộp các dòng nối tiếp thành một log event duy nhất trước khi gửi đi.

</details>

### Câu Hỏi 7: Các agent thu thập và xử lý log phổ biến (Fluent Bit, Filebeat/Elastic Agent, Fluentd, Logstash) khác nhau chủ yếu ở điểm nào?

<details>
<summary>Đáp án</summary>

- **Fluent Bit**: Viết bằng C, tiêu thụ ít RAM/CPU, rất phù hợp chạy dạng DaemonSet trên Kubernetes để thu thập và chuyển tiếp log.
- **Filebeat / Elastic Agent**: Thuộc hệ sinh thái Elastic, theo dõi tệp log trên host và gửi tới Elasticsearch, Logstash hoặc Kafka.
- **Fluentd và Logstash**: Mạnh về hệ thống plugin và biến đổi dữ liệu phức tạp; riêng Logstash chạy trên JVM nên tốn nhiều tài nguyên hơn và thường được dùng làm bộ xử lý tập trung.

</details>

### Câu Hỏi 8: Một pipeline thu log Kubernetes tiêu chuẩn gồm 4 bước nào và nhiệm vụ của từng bước là gì?

<details>
<summary>Đáp án</summary>

4 bước của một pipeline thu log Kubernetes tiêu chuẩn gồm:
1. **Input**: Theo dõi tệp log mới sinh (ví dụ qua plugin `tail`) và ghi nhớ vị trí dòng đã đọc.
2. **Parser**: Tách phần vỏ CRI của container runtime, gộp log đa dòng và giải mã chuỗi JSON.
3. **Filter / Enrich**: Dùng Kubernetes filter để gắn thêm metadata như `namespace`, `pod_name`, `labels` vào từng bản ghi.
4. **Output**: Nén theo lô (batch) và gửi tới đích nhận như Elasticsearch hoặc bộ đệm Kafka.

</details>

### Câu Hỏi 9: Back-pressure trong log pipeline là gì và cần cấu hình gì ở agent để tránh rủi ro khi hiện tượng này xảy ra?

<details>
<summary>Đáp án</summary>

**Back-pressure (áp lực ngược)** xảy ra khi đích nhận (như Elasticsearch) xử lý chậm hoặc gián đoạn, khiến bộ đệm RAM/đĩa của agent đầy dần và buộc agent phải hãm tốc độ đọc tệp nguồn (có thể dẫn đến mất log nếu tệp log gốc trên node bị xoay vòng trước khi kịp đọc).

Ở phía agent, cần cấu hình giới hạn bộ đệm RAM (như tham số `Mem_Buf_Limit` trong Fluent Bit); nếu không đặt giới hạn khi Elasticsearch chậm kéo dài, Pod agent có thể ngốn hết bộ nhớ và bị tắt (`OOMKilled`).

</details>

### Câu Hỏi 10: Khi nào nên đặt Apache Kafka làm bộ đệm trung gian trong log pipeline, và đánh đổi của kiến trúc này là gì?

<details>
<summary>Đáp án</summary>

Apache Kafka (thành phần tùy chọn cho hệ thống lớn) nên được đặt giữa agent và tầng ghi Elasticsearch khi lưu lượng log biến động mạnh hoặc cần khả năng phát lại dữ liệu. Kafka giúp tách rời producer với consumer, hấp thụ đột biến lưu lượng và lưu giữ log theo thời gian retention để đọc lại (replay) khi Elasticsearch bảo trì hoặc quá tải.

Đánh đổi là đội ngũ vận hành phải quản lý và giám sát thêm cụm Kafka (topic, partition, consumer lag).

</details>

### Câu Hỏi 11: Trên Kibana, Data View và KQL dùng để làm gì? Hãy nêu 4 bước chẩn đoán sự cố cơ bản trên Kibana Discover.

<details>
<summary>Đáp án</summary>

- **Data View** (trước đây là Index Pattern): Khai báo mẫu tên các index hoặc data stream cần truy vấn (ví dụ `k8s-logs-*`) cùng trường thời gian chuẩn.
- **KQL (Kibana Query Language)**: Ngôn ngữ truy vấn dùng tại màn hình **Discover** để lọc log theo từng trường (như `service`, `level`, `trace_id`) trong khung thời gian chọn từ Time Picker.

Quy trình chẩn đoán sự cố gồm 4 bước:
1. Nhận cảnh báo tăng lỗi bất thường và mở Kibana Discover theo đúng khung thời gian sự cố.
2. Lọc các bản ghi lỗi (ví dụ theo `service` và `level: "error"`) để lấy mã `trace_id` đại diện của request thất bại.
3. Xóa bộ lọc mức lỗi và tìm theo `trace_id` đó để xem toàn bộ chuỗi log đi qua các service liên quan.
4. Khoanh vùng service phát sinh lỗi đầu tiên và xác định nguyên nhân gốc.

</details>

### Câu Hỏi 12: Sự khác biệt cốt lõi trong chiến lược lập chỉ mục giữa Grafana Loki và Elasticsearch là gì?

<details>
<summary>Đáp án</summary>

- **Grafana Loki**: Chỉ lập chỉ mục cho tập **nhãn (labels)** gắn với luồng log (như `namespace`, `pod`, `app`); phần nội dung log được nén và lưu thành các khối (**chunks**).
- **Elasticsearch**: Lập chỉ mục toàn bộ nội dung văn bản và các trường JSON bằng **inverted index** (cho trường text) và doc values (cho việc lọc và thống kê).

</details>

### Câu Hỏi 13: So sánh Grafana Loki và Elasticsearch về chi phí tài nguyên, tốc độ tìm kiếm full-text và rủi ro cấu hình, từ đó rút ra tiêu chí lựa chọn từng công cụ?

<details>
<summary>Đáp án</summary>

- **Chi phí tài nguyên**: Loki có index nhỏ nên ít tốn RAM/đĩa khi lưu lượng lớn; Elasticsearch tốn nhiều RAM, CPU và đĩa hơn để phân tích và lưu index.
- **Tìm full-text**: Loki phải quét và giải nén các chunk khớp nhãn (chậm hơn nếu khoảng thời gian rộng); Elasticsearch tìm full-text và chạy aggregation trên mọi trường rất nhanh.
- **Rủi ro cấu hình**: Với Loki, đưa các giá trị có độ phân tán cao / quá nhiều giá trị độc nhất (như `trace_id`, `user_id`) vào **label** sẽ làm phình stream, gây quá tải bộ nhớ và index. Với Elasticsearch, dùng quá nhiều tên khóa JSON động gây **mapping explosion**.

**Tiêu chí lựa chọn**: Chọn Loki khi ưu tiên chi phí lưu trữ thấp và truy vấn theo ngữ cảnh dịch vụ trong khung thời gian ngắn; chọn Elasticsearch khi cần tìm kiếm full-text nhanh và thống kê linh hoạt trên nhiều trường.

</details>

### Câu Hỏi 14: Cách truy vấn tìm mã `trace_id` bằng LogQL trên Grafana Loki khác gì so với KQL trên Kibana/Elasticsearch?

<details>
<summary>Đáp án</summary>

Trên Kibana (Elasticsearch), người dùng có thể lọc trực tiếp theo các trường JSON đã được lập chỉ mục bằng KQL, ví dụ: `trace_id: "tr-9f82a1"`.

Trên Grafana Loki, truy vấn LogQL phải chọn bộ nhãn dịch vụ trước để thu hẹp các chunk liên quan rồi mới dùng toán tử lọc dòng (`|=`) để tìm chuỗi bên trong nội dung chunk, ví dụ: `{namespace="prod", app="order-svc"} |= "tr-9f82a1"`.

</details>
