# 13. Observability: Prometheus, Grafana, Logging & Tracing

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.

---

### 1. What are the three pillars of observability? Monitoring vs observability?
<details><summary>Đáp án</summary>

- **Metrics**: số liệu theo thời gian, rẻ, dùng để alert và xem xu hướng.
- **Logs**: sự kiện chi tiết, dùng để tìm hiểu chuyện gì đã xảy ra.
- **Traces**: đường đi của một request qua các service.
- **Monitoring** trả lời các câu hỏi **đã biết trước** (CPU có cao không?). **Observability** là khả năng trả lời cả những câu hỏi **chưa lường trước** từ dữ liệu hệ thống phát ra.
</details>

### 2. Explain Prometheus architecture. Pull vs push model.
<details><summary>Đáp án</summary>

- **Prometheus server** chủ động **scrape** (kéo) endpoint `/metrics` của target theo chu kỳ, lưu vào **TSDB** cục bộ, đánh giá **rule** (recording và alerting), gửi alert tới **Alertmanager**.
- Target được tìm qua **service discovery** (`kubernetes_sd_configs`, file, DNS...).
- **Exporter** chuyển metric của hệ thống bên thứ ba sang định dạng Prometheus (node_exporter, JMX exporter cho Kafka).
- **Pull**: Prometheus biết target nào "chết" (metric `up == 0`), dễ kiểm soát tải.
- **Push**: chỉ dùng **Pushgateway** cho job ngắn hạn (batch) không sống đủ lâu để bị scrape.
</details>

### 3. Explain the four metric types.
<details><summary>Đáp án</summary>

- **Counter**: chỉ tăng (reset về 0 khi restart). Ví dụ `http_requests_total`. Luôn dùng kèm `rate()` hoặc `increase()`.
- **Gauge**: tăng giảm tùy ý. Ví dụ memory, số kết nối, consumer lag.
- **Histogram**: đếm quan sát vào các **bucket** (`_bucket{le=...}`, `_sum`, `_count`). Tính quantile **phía server** và **gộp được giữa nhiều instance**.
- **Summary**: tính quantile **phía client**, **không gộp được** giữa instance.
- Với latency của nhiều replica, nên dùng histogram.
</details>

### 4. `rate()` vs `irate()` vs `increase()`.
<details><summary>Đáp án</summary>

- `rate(x[5m])`: tốc độ tăng **trung bình mỗi giây** trong cửa sổ 5 phút. Tự xử lý counter bị reset. Dùng cho alert và dashboard.
- `irate(x[5m])`: tốc độ tính từ **hai điểm cuối cùng**. Nhạy, nhiều nhiễu. Dùng cho đồ thị cần độ chi tiết cao.
- `increase(x[1h])`: **tổng tăng** trong cửa sổ (≈ `rate × số giây`).
- Cửa sổ thời gian nên ít nhất bằng 4 lần chu kỳ scrape.
</details>

### 5. Write PromQL for: request rate per service, error ratio, and p95 latency.
<details><summary>Đáp án</summary>

```promql
sum by (service) (rate(http_server_requests_seconds_count[5m]))

sum by (service) (rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
  /
sum by (service) (rate(http_server_requests_seconds_count[5m]))

histogram_quantile(0.95,
  sum by (le, service) (rate(http_server_requests_seconds_bucket[5m])))
```
Tên metric `http_server_requests_seconds_*` là của Micrometer (Spring Boot). Thư viện khác đặt tên khác.
</details>

### 6. Write PromQL to detect Pods restarting, CPU throttling and memory close to the limit.
<details><summary>Đáp án</summary>

```promql
increase(kube_pod_container_status_restarts_total[15m]) > 3

sum by (namespace, pod) (rate(container_cpu_cfs_throttled_periods_total[5m]))
  / sum by (namespace, pod) (rate(container_cpu_cfs_periods_total[5m])) > 0.25

max by (namespace, pod, container) (container_memory_working_set_bytes{container!=""})
  / max by (namespace, pod, container) (kube_pod_container_resource_limits{resource="memory"}) > 0.9
```
Metric `kube_*` đến từ **kube-state-metrics**. Metric `container_*` đến từ **cAdvisor** (tích hợp trong kubelet).
</details>

### 7. What is label cardinality and why can it break Prometheus?
<details><summary>Đáp án</summary>

Mỗi tổ hợp giá trị label là **một time series riêng**. Đặt label có giá trị không giới hạn (user ID, request ID, URL đầy đủ có tham số, email) làm số series bùng nổ, khiến Prometheus tốn RAM, chậm và có thể OOM. Label chỉ nên chứa giá trị **có giới hạn** (service, method, status code, route template).
</details>

### 8. What are recording rules and alerting rules? What does `for:` do?
<details><summary>Đáp án</summary>

- **Recording rule**: tính trước một biểu thức nặng và lưu thành series mới, giúp dashboard và alert nhanh hơn.
- **Alerting rule**: biểu thức kèm điều kiện. `for: 10m` nghĩa là điều kiện phải đúng **liên tục 10 phút** mới chuyển từ `pending` sang `firing`, tránh alert do dao động ngắn.
```yaml
- alert: HighErrorRate
  expr: job:http_errors:ratio5m > 0.05
  for: 10m
  labels: { severity: page }
  annotations:
    summary: "Error rate > 5% on {{ $labels.job }}"
```
</details>

### 9. What does Alertmanager do?
<details><summary>Đáp án</summary>

Alertmanager nhận alert từ Prometheus rồi:
- **Gom nhóm** (`group_by`): nhiều alert cùng loại thành một thông báo.
- **Khử trùng lặp**.
- **Định tuyến** (`route`) tới receiver (Slack, email, PagerDuty, Teams) theo label.
- **Inhibition**: ẩn alert phụ khi đã có alert gốc (cluster sập thì ẩn alert từng service).
- **Silence**: tạm tắt khi bảo trì.
</details>

### 10. How does Prometheus monitoring work in Kubernetes with the Prometheus Operator?
<details><summary>Đáp án</summary>

- Operator cung cấp các CRD: `Prometheus`, `Alertmanager`, **`ServiceMonitor`** (chọn **Service** để scrape theo label và tên port), **`PodMonitor`**, **`PrometheusRule`** (rule dưới dạng resource Kubernetes).
- Team ứng dụng chỉ cần thêm `ServiceMonitor` trong Helm chart của mình là metric được thu thập.
- Chart **kube-prometheus-stack** cài trọn bộ: Prometheus, Alertmanager, Grafana, node-exporter, kube-state-metrics, dashboard và rule mặc định.
- Lỗi thường gặp: label của ServiceMonitor không khớp `serviceMonitorSelector` của Prometheus, nên target không xuất hiện.
</details>

### 11. What do node_exporter, kube-state-metrics and cAdvisor each provide?
<details><summary>Đáp án</summary>

- **node_exporter**: metric của **máy** (CPU, memory, disk, filesystem, network của node).
- **kube-state-metrics**: **trạng thái object** Kubernetes đọc từ API (số replica mong muốn và sẵn sàng, Pod phase, số lần restart, request và limit, trạng thái Job).
- **cAdvisor** (trong kubelet): **mức dùng tài nguyên thực tế** của từng container (CPU, memory working set, throttling, network).
</details>

### 12. How do you expose metrics from a Spring Boot application?
<details><summary>Đáp án</summary>

Thêm `spring-boot-starter-actuator` và `micrometer-registry-prometheus`, mở endpoint `management.endpoints.web.exposure.include=health,prometheus`. Metric có ở `/actuator/prometheus`: JVM (heap, GC, thread), HTTP server, HikariCP, Kafka client. Tạo `ServiceMonitor` trỏ tới port và path đó. Có thể thêm metric nghiệp vụ bằng `MeterRegistry` (Counter, Timer).
</details>

### 13. How long does Prometheus keep data, and how do you scale it or keep data long-term?
<details><summary>Đáp án</summary>

- Mặc định giữ **15 ngày** (`--storage.tsdb.retention.time`). Prometheus là một server đơn với storage cục bộ, **không tự phân cụm**.
- Để HA thì chạy **hai bản giống nhau**.
- Để lưu dài hạn và xem toàn cục nhiều cluster: **remote write** tới **Thanos**, **Grafana Mimir**, **Cortex**, hoặc **VictoriaMetrics**. Thanos cũng có chế độ sidecar upload block lên object storage.
</details>

### 14. Explain the Four Golden Signals, RED and USE methods.
<details><summary>Đáp án</summary>

- **Four Golden Signals** (Google SRE): **Latency**, **Traffic**, **Errors**, **Saturation**.
- **RED** (cho service): **R**ate, **E**rrors, **D**uration.
- **USE** (cho tài nguyên như CPU, disk, network): **U**tilization, **S**aturation, **E**rrors.
</details>

### 15. Define SLI, SLO, SLA and error budget.
<details><summary>Đáp án</summary>

- **SLI**: chỉ số đo được, ví dụ tỉ lệ request thành công dưới 300 ms.
- **SLO**: mục tiêu cho SLI, ví dụ 99.9% mỗi 30 ngày.
- **SLA**: **cam kết hợp đồng** với khách hàng, có chế tài. Thường lỏng hơn SLO.
- **Error budget** = 100% − SLO. Ví dụ 0.1% của 30 ngày ≈ 43 phút. Còn budget thì deploy nhanh, hết budget thì ưu tiên ổn định.
- Nên alert theo **burn rate** (tốc độ tiêu budget) thay vì theo từng ngưỡng nhỏ lẻ.
</details>

### 16. What makes a good alert? How do you avoid alert fatigue?
<details><summary>Đáp án</summary>

- Alert theo **triệu chứng ảnh hưởng người dùng** (tỉ lệ lỗi, latency, SLO burn), không theo mọi nguyên nhân (CPU 80% chưa chắc là vấn đề).
- Mỗi alert phải **cần hành động** và có **runbook**.
- Phân mức: gọi người trực (page) hay chỉ tạo ticket.
- Dùng `for:` để tránh dao động, gom nhóm, inhibition.
- Xem lại định kỳ: alert nào kêu mà không ai xử lý thì sửa hoặc xóa.
</details>

### 17. What can you do in Grafana besides drawing graphs?
<details><summary>Đáp án</summary>

- Nhiều **data source** (Prometheus, Loki, Elasticsearch, Tempo/Jaeger, SQL).
- **Variables / templating**: chọn namespace, service, Pod ngay trên dashboard.
- **Alerting** (Grafana-managed alerts).
- **Annotations**: đánh dấu thời điểm deploy trên đồ thị để thấy tương quan.
- **Explore**: truy vấn tự do, nhảy từ metric sang log hoặc trace liên quan.
- **Dashboard dạng code**: provisioning bằng file hoặc ConfigMap, Grafana sidecar trong kube-prometheus-stack.
</details>

### 18. Describe a centralized logging pipeline for Kubernetes.
<details><summary>Đáp án</summary>

1. Ứng dụng ghi log ra **stdout** (ưu tiên JSON có trace ID).
2. Container runtime ghi ra file trên node (`/var/log/pods/...`).
3. **Agent dạng DaemonSet** (Fluent Bit, Fluentd, Filebeat, Elastic Agent, Vector, Grafana Alloy) đọc file, gắn **metadata Kubernetes** (namespace, Pod, label), parse, rồi gửi đi.
4. (Tùy chọn) bộ đệm hoặc xử lý trung gian: Logstash, **Kafka** làm buffer.
5. Lưu trữ và đánh chỉ mục: **Elasticsearch/OpenSearch**, hoặc **Loki**.
6. Xem và truy vấn: **Kibana** hoặc **Grafana**.
</details>

### 19. Why use structured (JSON) logging?
<details><summary>Đáp án</summary>

Log có cấu trúc thì có thể **lọc và gom nhóm theo field** (`level`, `service`, `traceId`, `orderId`) mà không cần regex dễ vỡ. Stack trace nhiều dòng nằm gọn trong một sự kiện thay vì bị tách thành nhiều bản ghi. Spring Boot 3.4+ hỗ trợ structured logging sẵn (ECS, Logstash, GELF). Không ghi dữ liệu nhạy cảm (mật khẩu, token, dữ liệu cá nhân) vào log.
</details>

### 20. Multi-line Java stack traces are split into separate log records. How do you fix it?
<details><summary>Đáp án</summary>

- Cách tốt nhất: ghi log dạng **JSON**, khi đó stack trace là một field của một dòng.
- Hoặc cấu hình **multiline parser** ở agent (Fluent Bit có parser `multiline` sẵn cho Java, Filebeat dùng `multiline.pattern`) để gộp các dòng bắt đầu bằng khoảng trắng, `at `, `Caused by:` vào sự kiện trước đó.
</details>

### 21. Loki vs Elasticsearch for logs.
<details><summary>Đáp án</summary>

- **Elasticsearch**: đánh **chỉ mục toàn văn** mọi field, tìm kiếm và tổng hợp mạnh, nhưng tốn tài nguyên (RAM, disk) và phải vận hành cluster.
- **Loki**: chỉ đánh chỉ mục **label** (namespace, app), nội dung log nén lưu trên object storage. Rẻ, dễ vận hành, hợp với Grafana. Nhưng tìm toàn văn chậm hơn, và cũng phải tránh label có cardinality cao.
</details>

### 22. What is distributed tracing? Explain trace, span and context propagation. What is OpenTelemetry?
<details><summary>Đáp án</summary>

- **Trace**: toàn bộ hành trình của một request. **Span**: một đoạn công việc (gọi HTTP, query DB) có thời gian bắt đầu và kết thúc, quan hệ cha con, thuộc tính.
- **Context propagation**: truyền trace ID và span ID qua header (W3C `traceparent`) hoặc header của message Kafka.
- **OpenTelemetry**: chuẩn mở (API, SDK, giao thức OTLP, **Collector**) cho cả trace, metric và log, không phụ thuộc nhà cung cấp. Có **Java agent** tự instrument Spring, JDBC, Kafka client mà không cần sửa code. Backend: Jaeger, Tempo, Zipkin, Elastic APM.
</details>

### 23. A service's latency increased after a deployment. How do you use observability tools to find out why?
<details><summary>Đáp án</summary>

1. **Dashboard RED** của service, có annotation deploy: latency tăng đúng lúc deploy? Ở tất cả endpoint hay chỉ một vài?
2. So sánh **phiên bản mới với cũ** (nếu đang canary) theo label `version`.
3. **Trace** các request chậm: span nào dài ra (DB, service khác, Kafka)?
4. **Tài nguyên**: CPU throttling, GC pause, memory, số thread, connection pool.
5. **Log** của phiên bản mới: warning, retry, timeout.
6. Quyết định: rollback ngay nếu ảnh hưởng người dùng. Sau đó tìm nguyên nhân gốc (query mới thiếu index, cấu hình pool đổi...).
</details>

### 24. Which metrics would you monitor for Kafka, Cassandra and Elasticsearch?
<details><summary>Đáp án</summary>

- **Kafka**:
  - `UnderReplicatedPartitions` (phải bằng 0).
  - `OfflinePartitionsCount`.
  - `ActiveControllerCount` (tổng cả cluster bằng 1).
  - Kích thước ISR co lại hoặc mở rộng.
  - Throughput vào và ra.
  - Request latency.
  - **Consumer lag** theo group (exporter như kafka-exporter, Burrow).
  - Disk usage.
- **Cassandra**:
  - Read/write latency.
  - Pending compactions.
  - Dropped messages.
  - Số tombstone mỗi lần đọc.
  - Hints.
  - Trạng thái node (`nodetool status`).
  - Heap và GC.
  - Disk.
- **Elasticsearch**:
  - Cluster health (green/yellow/red).
  - Unassigned shards.
  - Heap và GC.
  - Disk watermark.
  - Search/index latency.
  - Thread pool rejection.
- **ZooKeeper**: outstanding requests, latency, số follower đã đồng bộ (`mntr`).
</details>

### 25. What is the `up` metric and how do you alert when a target disappears?
<details><summary>Đáp án</summary>

Prometheus tự tạo `up{job, instance}` cho mỗi target: 1 là scrape thành công, 0 là thất bại. Alert `up == 0` với `for: 5m`. Nhưng nếu target **biến mất khỏi service discovery** thì sẽ không còn series nào, nên dùng thêm `absent(up{job="orders"})` hoặc so sánh số target với số kỳ vọng.
</details>

### 26. How do you correlate logs, metrics and traces during an incident?
<details><summary>Đáp án</summary>

- Gắn **label chung** (service, namespace, Pod, version) ở cả ba loại dữ liệu.
- Ghi **trace ID** vào log, và dùng **exemplars** (metric kèm trace ID mẫu) để nhảy từ điểm bất thường trên đồ thị sang trace, rồi từ trace sang log.
- Grafana hỗ trợ liên kết giữa các data source (Prometheus → Tempo → Loki/Elasticsearch).
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Prometheus: Overview](https://prometheus.io/docs/introduction/overview/): kiến trúc, mô hình pull.
- [Prometheus: Metric types](https://prometheus.io/docs/concepts/metric_types/): counter, gauge, histogram, summary.
- [Prometheus: Querying functions](https://prometheus.io/docs/prometheus/latest/querying/functions/): `rate`, `irate`, `increase`, `histogram_quantile`, `absent`.
- [Prometheus: Histograms and summaries](https://prometheus.io/docs/practices/histograms/): khi nào dùng histogram, khi nào dùng summary.
- [Prometheus: Naming and labels / cardinality](https://prometheus.io/docs/practices/naming/): đặt tên và label.
- [Prometheus: Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) và [Recording rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/): rule.
- [Prometheus: Storage](https://prometheus.io/docs/prometheus/latest/storage/): retention, remote write.
- [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/): grouping, inhibition, silence.
- [Prometheus Operator: API reference](https://prometheus-operator.dev/docs/api-reference/api/): `ServiceMonitor`, `PrometheusRule`.
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics): metric trạng thái object.
- [Grafana documentation](https://grafana.com/docs/grafana/latest/): dashboard, variables, alerting.
- [Spring Boot: Metrics (Micrometer + Prometheus)](https://docs.spring.io/spring-boot/reference/actuator/metrics.html): metric từ Spring Boot.
- [Spring Boot: Structured Logging](https://docs.spring.io/spring-boot/reference/features/logging.html#features.logging.structured): log JSON.
- [Fluent Bit: Multiline parsing](https://docs.fluentbit.io/manual/administration/configuring-fluent-bit/multiline-parsing): gộp stack trace.
- [OpenTelemetry: Concepts](https://opentelemetry.io/docs/concepts/) và [Java zero-code instrumentation](https://opentelemetry.io/docs/zero-code/java/agent/): tracing.
- [Google SRE Book: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/): Four Golden Signals.
- [Google SRE Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/): burn rate alert.
