# Review: 7_2_6 Monitoring

### Câu Hỏi 1: Mục đích của việc giám sát (Monitoring) trong Apache Kafka là gì và người vận hành cần nắm hai phần cốt lõi nào?

<details>
<summary>Đáp án</summary>

Giám sát (Monitoring) là quá trình thu thập liên tục các chỉ số sức khỏe bên trong Kafka để phát hiện sớm dấu hiệu suy giảm (như nghẽn đĩa, mất đồng bộ replica, hoặc consumer xử lý không kịp) trước khi sự cố bùng phát, ngay cả khi ứng dụng gửi tin nhắn chưa báo lỗi tức thì.

Hai phần cốt lõi cần nắm là:
1. **Xem chỉ số nào**: 5 nhóm metric sống còn (Replication, Controller & Leader, Consumer Lag, Dung lượng đĩa, và Request Latency).
2. **Lấy chỉ số đó ra bằng cách nào**: Thu thập từ JMX đưa qua Exporter vào Prometheus và trực quan hóa trên Grafana.

</details>

### Câu Hỏi 2: Kafka xuất các chỉ số nội bộ mặc định bằng cơ chế nào, MBean là gì và vì sao Prometheus không thể thu thập trực tiếp từ Kafka mà không có Exporter?

<details>
<summary>Đáp án</summary>

Kafka chạy trên JVM và mặc định sử dụng hệ thống đo lường nội bộ (Yammer Metrics / Kafka Metrics) để công bố các chỉ số qua giao thức **JMX (Java Management Extensions)** dưới dạng các đối tượng **MBean (Managed Bean)**.

**MBean** là một "ô đồng hồ đo" nằm trong bộ nhớ JVM, được định danh bằng tên miền (ví dụ `kafka.server`, `kafka.controller`), kiểu (`type`) và tên chỉ số (`name`).

Prometheus sử dụng cơ chế **pull (scrape)** định kỳ tới một endpoint HTTP `/metrics`, trong khi Kafka chỉ xuất chỉ số qua JMX chứ không tự mở sẵn trang HTTP `/metrics` theo chuẩn Prometheus. Vì vậy cần một cầu nối **Exporter** (như Prometheus JMX Exporter) để đọc MBean và chuyển đổi sang định dạng HTTP `/metrics`.

</details>

### Câu Hỏi 3: Trong nhóm chỉ số Replication, `UnderReplicatedPartitions` và `UnderMinIsrPartitionCount` đo lường điều gì và giá trị nào cho thấy hệ thống đang gặp vấn đề?

<details>
<summary>Đáp án</summary>

- **`UnderReplicatedPartitions`** (`kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions`): Đếm số partition mà không phải mọi bản sao (replica) đều nằm trong **ISR (In-Sync Replicas)**. Bình thường giá trị này phải bằng `0`. Nếu lớn hơn `0` kéo dài, có replica đang bị tụt hậu do mạng chậm, đĩa nghẽn hoặc broker ngừng chạy.
- **`UnderMinIsrPartitionCount`** (`kafka.server:type=ReplicaManager,name=UnderMinIsrPartitionCount`): Đếm số partition có số replica trong ISR thấp hơn ngưỡng `min.insync.replicas`. Khi xảy ra tình trạng này, các producer cấu hình `acks=all` có thể bị từ chối ghi.

</details>

### Câu Hỏi 4: Nhóm chỉ số Controller & Leader gồm `ActiveControllerCount`, `OfflinePartitionsCount` và `UncleanLeaderElectionsPerSec` cho biết những thông tin gì về trạng thái cụm Kafka?

<details>
<summary>Đáp án</summary>

- **`ActiveControllerCount`** (`kafka.controller:type=KafkaController,name=ActiveControllerCount`): Trả về `1` trên broker giữ vai trò Active Controller và `0` trên các broker còn lại. Một cụm khỏe mạnh chỉ có duy nhất một active controller tại mỗi thời điểm; nếu tổng toàn cụm bằng `0` hoặc lớn hơn `1`, cụm đang gặp lỗi điều phối nghiêm trọng.
- **`OfflinePartitionsCount`** (`kafka.controller:type=KafkaController,name=OfflinePartitionsCount`): Được báo cáo trên active controller, đếm số partition không có leader hoạt động. Khi lớn hơn `0`, việc đọc và ghi vào các partition đó bị gián đoạn hoàn toàn.
- **`UncleanLeaderElectionsPerSec`** (`kafka.controller:type=ControllerStats,name=UncleanLeaderElectionsPerSec`): Theo dõi tần suất bầu một replica nằm ngoài ISR lên làm leader — hành động này có thể gây mất dữ liệu chưa kịp sao chép.

</details>

### Câu Hỏi 5: Consumer Lag là gì? Vì sao không nên chỉ dựa vào JMX của phía Consumer (`records-lag-max`) để giám sát Consumer Lag trong môi trường thực tế?

<details>
<summary>Đáp án</summary>

**Consumer lag** là chênh lệch giữa offset của bản ghi mới nhất ở đầu log trên broker và offset mà nhóm consumer đã xử lý xong.

Nếu chỉ theo dõi JMX phía client consumer (`kafka.consumer:type=consumer-fetch-manager-metrics` với `records-lag-max` và `records-lag`), hệ thống giám sát sẽ bị "mù lag" khi toàn bộ consumer pod bị crash hoặc ngừng chạy — lúc này Prometheus không còn target để scrape nên biểu đồ bị ngắt quãng thay vì báo động lag tăng. Do đó, cần kết hợp thêm **Kafka Exporter** để đọc offset trực tiếp từ phía cluster và giám sát lag tập trung ngay cả khi consumer đã tắt.

</details>

### Câu Hỏi 6: Khi giám sát dung lượng đĩa (Disk Usage) của Kafka, vì sao ngoài chỉ số `Log Size` trong JMX ta vẫn phải theo dõi dung lượng trống ở tầng hệ điều hành (OS)?

<details>
<summary>Đáp án</summary>

Kafka lưu dữ liệu theo các file log segment trên đĩa trong thư mục `log.dirs`, và MBean `kafka.log:type=Log,name=Size` chỉ ghi nhận dung lượng log của từng topic/partition.

Nếu các file khác trên máy chủ chiếm hết phân vùng đĩa chứa `log.dirs`, broker vẫn có thể bị sập dù dung lượng log Kafka báo cáo chưa chạm ngưỡng. Vì vậy cần kết hợp giám sát dung lượng đĩa trống ở tầng hệ điều hành (OS, ví dụ qua **Node Exporter**) để cảnh báo kịp thời trước khi hết đĩa.

</details>

### Câu Hỏi 7: Chỉ số `TotalTimeMs` trong nhóm Request Latency đo lường điều gì, áp dụng cho những loại request nào và được chia nhỏ thành những chặng nào?

<details>
<summary>Đáp án</summary>

MBean `kafka.network:type=RequestMetrics,name=TotalTimeMs` đo tổng thời gian từ khi broker nhận được request mạng đến khi gửi xong phản hồi, giúp chẩn đoán khi ứng dụng phản ánh "Kafka chậm". Cần theo dõi trên ba loại request mạng chính là **`Produce`**, **`FetchConsumer`**, và **`FetchFollower`**.

Ở mức chi tiết để định vị nút thắt, `TotalTimeMs` được chia nhỏ thành 5 chặng:
1. `RequestQueueTimeMs`: Thời gian chờ trong hàng đợi vào.
2. `LocalTimeMs`: Thời gian xử lý/ghi đĩa cục bộ.
3. `RemoteTimeMs`: Thời gian chờ follower replicate.
4. `ResponseQueueTimeMs`: Thời gian chờ trong hàng đợi ra.
5. `ResponseSendTimeMs`: Thời gian gửi phản hồi qua mạng.

</details>

### Câu Hỏi 8: Prometheus JMX Exporter hoạt động theo cơ chế nào để kết nối Kafka Broker với Prometheus và Grafana?

<details>
<summary>Đáp án</summary>

**Prometheus JMX Exporter** chạy dưới dạng một **Java agent** (`-javaagent`, nạp qua biến môi trường `KAFKA_OPTS` khi khởi chạy broker) gắn trực tiếp vào tiến trình JVM của Kafka Broker. Agent này đọc các JMX MBean theo tệp cấu hình YAML và mở một cổng HTTP `/metrics` (ví dụ cổng `9404`).

Sau đó, **Prometheus** thực hiện cơ chế **pull (scrape)** định kỳ tới endpoint `/metrics` để lưu vào cơ sở dữ liệu chuỗi thời gian (TSDB) và đánh giá cảnh báo, còn **Grafana** kết nối tới Prometheus để dùng PromQL vẽ bảng điều khiển cho 5 nhóm chỉ số.

</details>

### Câu Hỏi 9: Phần `rules` trong file cấu hình YAML của JMX Exporter có tác dụng gì và rủi ro "bùng nổ cardinality" xảy ra khi nào?

<details>
<summary>Đáp án</summary>

Khối `rules` trong file YAML (ví dụ `kafka-jmx-config.yml`) sử dụng biểu thức chính quy (`pattern`) để chọn lọc các MBean cần xuất, đồng thời đặt tên metric, kiểu (`type`) và nhãn (`labels`) theo chuẩn Prometheus.

Nếu cấu hình rule quá rộng (chẳng hạn dùng `pattern: ".*"`) trên một cụm có hàng nghìn partition, JMX Exporter sẽ phản xạ và xuất ra hàng chục nghìn chuỗi thời gian chi tiết theo từng partition/client mỗi lần scrape. Điều này gây **bùng nổ cardinality**, làm tăng cao CPU của broker, tốn RAM và khiến Prometheus quá tải hoặc scrape bị timeout. Cách xử lý là áp dụng nguyên tắc **whitelist**, chỉ giữ lại các MBean cốt lõi.

</details>

### Câu Hỏi 10: Khi triển khai Kafka trên Kubernetes bằng Strimzi Operator và khi nâng cấp phiên bản Kafka, cần lưu ý những điểm cấu hình giám sát nào?

<details>
<summary>Đáp án</summary>

- **Trên Kubernetes với Strimzi Operator**: Trong tài nguyên CRD `Kafka`, Strimzi tích hợp sẵn hai phần cấu hình chính là `spec.kafka.metricsConfig` (loại `jmxPrometheusExporter`, trỏ tới ConfigMap chứa rules YAML) để xuất metric JMX của broker và `spec.kafkaExporter` để bật xuất chỉ số consumer lag tự động.
- **Lưu ý về phiên bản**: Tên của một số JMX MBean (chẳng hạn các metric ở controller giữa kiến trúc ZooKeeper và KRaft) và cấu hình `metricsConfig` phụ thuộc vào phiên bản Kafka hoặc Strimzi đang sử dụng. Khi nâng cấp, luôn phải đối chiếu tài liệu chính thức của đúng phiên bản và kiểm tra lại dữ liệu trên `/metrics` ở môi trường staging.

</details>
