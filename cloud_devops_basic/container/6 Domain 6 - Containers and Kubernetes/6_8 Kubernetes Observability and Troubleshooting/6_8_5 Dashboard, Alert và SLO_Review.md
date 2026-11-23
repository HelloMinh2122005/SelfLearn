# Ôn Tập: 6_8_5 Dashboard, Alert và SLO

### Câu Hỏi 1: Grafana đóng vai trò gì trong hệ thống quan sát Kubernetes, giao tiếp với Prometheus qua cơ chế nào và thường dùng những loại panel hiển thị nào?

<details>
<summary>Đáp án</summary>

- **Vai trò**: Grafana là tầng trực quan hóa (visualization layer) trung tâm cho toàn bộ cụm Kubernetes, giúp biến các số liệu (metrics) thành biểu đồ trực quan trên bảng điều khiển tập trung.
- **Cơ chế giao tiếp với Prometheus**: Grafana tích hợp Prometheus làm nguồn dữ liệu (Data Source) mặc định thông qua giao thức HTTP API và truy vấn số liệu chuỗi thời gian bằng ngôn ngữ **PromQL**.
- **Các loại bảng hiển thị phổ biến**: Biểu đồ đường (**Time series**), số liệu đơn vị (**Stat**) và đồng hồ đo (**Gauge**), được tổ chức theo các hàng và bảng trong Dashboard.
</details>

---

### Câu Hỏi 2: Tính năng Dashboard Variables trong Grafana giải quyết vấn đề gì và hàm `label_values()` được dùng như thế nào để lọc dữ liệu động?

<details>
<summary>Đáp án</summary>

- **Vấn đề giải quyết**: Thay vì phải tạo nhiều bảng điều khiển riêng biệt cho từng môi trường hay ứng dụng, Dashboard Variables cho phép kỹ sư lọc dữ liệu linh hoạt theo `namespace`, `workload` hoặc `pod` trên cùng một dashboard duy nhất.
- **Cách dùng hàm `label_values()`**: Hàm này trích xuất danh sách nhãn theo thời gian thực từ Prometheus để tạo giá trị cho biến. Ví dụ:
  - Biến `$namespace`: `label_values(kube_pod_info, namespace)`
  - Biến `$pod` (phụ thuộc vào namespace đã chọn): `label_values(kube_pod_info{namespace="$namespace"}, pod)`
</details>

---

### Câu Hỏi 3: Trong kiến trúc quan sát Kubernetes, Prometheus thu thập metrics từ những thành phần nào và phân phối dữ liệu đầu ra tới đâu?

<details>
<summary>Đáp án</summary>

- **Nguồn thu thập dữ liệu (Scrape Metrics)**: Prometheus định kỳ cào số liệu qua HTTP endpoint từ các ứng dụng và 3 nguồn hạ tầng/workload chính trong cụm Kubernetes:
  1. **cAdvisor**: Cung cấp số liệu CPU và CPU throttling.
  2. **kube-state-metrics**: Cung cấp trạng thái các Kubernetes workloads (Pod, Deployment...).
  3. **Kubelet**: Cung cấp thông số lưu trữ Volume/PVC.
- **Phân phối dữ liệu đầu ra**:
  - Gửi dữ liệu truy vấn **PromQL qua HTTP API** cho **Grafana** để hiển thị dashboard.
  - Đẩy các cảnh báo đang **Firing qua HTTP POST** sang **Alertmanager** để định tuyến ra Slack, PagerDuty...
  - Cung cấp dữ liệu **SLI** cho quy trình kiểm tra và quản trị **Error Budget** (quyết định cho phép phát hành hay đóng băng phát hành).
</details>

---

### Câu Hỏi 4: Vì sao Prometheus không gửi cảnh báo trực tiếp đến người dùng mà đẩy sang Alertmanager? Alertmanager đảm nhiệm những vai trò chính nào?

<details>
<summary>Đáp án</summary>

- **Lý do kiến trúc**: Trong hệ thống lớn có thể có một hoặc nhiều máy chủ Prometheus cùng đánh giá quy tắc cảnh báo. Việc đẩy toàn bộ cảnh báo qua HTTP POST API sang Alertmanager giúp quản trị cảnh báo tập trung trước khi thông báo đến con người.
- **Bốn vai trò cốt lõi của Alertmanager**:
  1. **Định tuyến (Routing)**: Chuyển cảnh báo đúng kênh nhận (ví dụ: `warning` gửi qua Slack, `critical` gửi qua PagerDuty).
  2. **Gom nhóm (Grouping)**: Gộp các cảnh báo liên quan thành một thông báo duy nhất.
  3. **Khử trùng lặp (Deduplication)**: Loại bỏ các cảnh báo trùng lặp từ nhiều nguồn.
  4. **Gửi thông báo**: Kết nối tới các hệ thống nhận cảnh báo (receivers) như Slack, PagerDuty...
</details>

---

### Câu Hỏi 5: Cơ chế Grouping (`group_by`) trong Alertmanager ngăn chặn bão tin nhắn (alert storm) ra sao? Phân biệt hai tham số `group_wait` và `group_interval`.

<details>
<summary>Đáp án</summary>

- **Cơ chế Grouping (`group_by`)**: Khi sự cố diện rộng xảy ra làm hàng loạt cảnh báo kích hoạt cùng lúc, Alertmanager gom các cảnh báo có chung bộ nhãn khai báo trong `group_by` (ví dụ `["alertname", "cluster", "namespace"]`) vào chung một thông báo duy nhất thay vì gửi hàng chục tin nhắn rời rạc.
- **Phân biệt hai tham số kiểm soát nhịp độ**:
  - `group_wait` (ví dụ `30s`): Khoảng thời gian chờ ban đầu kể từ khi cảnh báo đầu tiên xuất hiện để gom thêm các cảnh báo khác cùng nhóm trước khi gửi đi thông báo đầu tiên.
  - `group_interval` (ví dụ `5m`): Khoảng thời gian chờ trước khi gửi đi lô cảnh báo mới phát sinh tiếp theo cho cùng một nhóm đã thông báo trước đó.
</details>

---

### Câu Hỏi 6: Cơ chế Inhibition (`inhibit_rules`) hoạt động như thế nào để tránh ngập lụt cảnh báo khi một Node bị sập?

<details>
<summary>Đáp án</summary>

- **Khái niệm**: Inhibition (ức chế cảnh báo) cho phép Alertmanager tự động triệt tiêu các cảnh báo thứ cấp có mức độ nhẹ hơn khi một cảnh báo gốc nghiêm trọng hơn đang kích hoạt.
- **Cách phối hợp cấu hình trong `inhibit_rules`**:
  - `source_match`: Xác định cảnh báo gốc đang ở trạng thái Firing (ví dụ: `alertname: "NodeDown"`, `severity: "critical"`).
  - `target_match`: Xác định các cảnh báo thứ cấp cần bị dập tắt thông báo (ví dụ: các cảnh báo `severity: "warning"` như Pod crash hay Kubelet mất kết nối).
  - `equal`: Danh sách các nhãn bắt buộc phải khớp giá trị giữa cảnh báo nguồn và cảnh báo đích (ví dụ `["node", "instance"]`), đảm bảo chỉ dập tắt cảnh báo phụ trên đúng node bị sập đó.
</details>

---

### Câu Hỏi 7: Tính năng Silence trong Alertmanager khác gì so với việc sửa quy tắc cảnh báo? Hãy nêu cách dùng `amtool` để tạo khoảng lặng khi bảo trì.

<details>
<summary>Đáp án</summary>

- **Điểm khác biệt**: Silence cho phép kỹ sư tạm thời tắt thông báo của một nhóm cảnh báo trong một khoảng thời gian xác định dựa trên các biểu thức so khớp nhãn (**matchers**), mà **không cần chỉnh sửa hay triển khai lại alerting rule** trong Prometheus.
- **Thao tác với CLI `amtool`**:
  - Kiểm tra các cảnh báo đang Firing:
    `amtool --alertmanager.url=http://alertmanager:9093 alert`
  - Tạo Silence trong 2 giờ kèm lý do bảo trì:
    `amtool --alertmanager.url=http://alertmanager:9093 silence add alertname=PodFrequentlyRestarting namespace=production --duration=2h --comment="Bảo trì nâng cấp ứng dụng định kỳ"`
</details>

---

### Câu Hỏi 8: Thuộc tính `for` trong alerting rule của Prometheus hoạt động như thế nào và giúp khắc phục hiện tượng gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế chuyển trạng thái**: Khi biểu thức PromQL (`expr`) vượt ngưỡng, cảnh báo không gửi đi ngay mà bước vào trạng thái **Pending**. Chỉ khi điều kiện đó duy trì đúng liên tục hết khoảng thời gian quy định trong thuộc tính `for` (ví dụ `for: 5m` hoặc `for: 10m`), cảnh báo mới chuyển sang trạng thái **Firing** và được gửi tới Alertmanager.
- **Hiện tượng được khắc phục**: Giúp ngăn chặn tình trạng **cảnh báo chập chờn (alert flapping)** gây ra bởi các biến động ngắn hạn, tức thời của metric (như lúc ứng dụng khởi động, chạy Garbage Collection hoặc batch job ngắn hạn).
</details>

---

### Câu Hỏi 9: Phân biệt cảnh báo theo triệu chứng (symptom-based) và cảnh báo theo nguyên nhân kỹ thuật (cause-based). Vì sao SRE ưu tiên symptom-based alerting?

<details>
<summary>Đáp án</summary>

- **Cảnh báo theo triệu chứng (Symptom-based)**: Cảnh báo dựa trên tác động thực tế mà người dùng cuối đang gánh chịu, ví dụ tỷ lệ lỗi HTTP 5xx tăng cao hoặc độ trễ phản hồi vượt ngưỡng.
- **Cảnh báo theo nguyên nhân kỹ thuật (Cause-based)**: Cảnh báo dựa trên thông số hạ tầng nội bộ, ví dụ CPU chạm ngưỡng cao.
- **Lý do SRE ưu tiên symptom-based**: Tài nguyên như CPU tăng cao trong ngắn hạn có thể là trạng thái xử lý tải bình thường và không ảnh hưởng tới người dùng. Việc báo động liên tục theo nguyên nhân kỹ thuật tạo ra nhiều báo động giả, dẫn đến **kiệt sức vì báo động (alert fatigue)** và khiến kỹ sư trực ca dần phớt lờ cả những sự cố nghiêm trọng thật sự.
</details>

---

### Câu Hỏi 10: Thế nào là một cảnh báo có tính thực thi (Actionable Alert) theo chuẩn SRE, và trường `runbook_url` trong `PrometheusRule` có vai trò gì?

<details>
<summary>Đáp án</summary>

- **Actionable Alert**: Là cảnh báo mà khi gửi trực tiếp đến kỹ sư trực ca (on-call engineer), người nhận hiểu rõ vấn đề đang ảnh hưởng tới hệ thống và có thể hành động xử lý ngay, thay vì chỉ nhận thông tin chung chung không rõ hướng khắc phục.
- **Vai trò của `runbook_url`**: Thuộc tính `runbook_url` trong phần `annotations` của `PrometheusRule` gắn liên kết trực tiếp đến tài liệu hướng dẫn quy trình xử lý sự cố (runbook). Điều này giúp kỹ sư trực ca không bị lúng túng khi sự cố `critical` xảy ra (đặc biệt vào ban đêm) và rút ngắn thời gian khôi phục dịch vụ.
</details>

---

### Câu Hỏi 11: Bộ tứ cảnh báo Kubernetes kinh điển theo dõi những tình trạng nào và dựa trên các metrics cốt lõi nào?

<details>
<summary>Đáp án</summary>

Bốn cảnh báo nền tảng trong Kubernetes gồm:
1. **Pod restart liên tục**: Dùng metric `kube_pod_container_status_restarts_total` kết hợp hàm `increase()` hoặc `rate()` để phát hiện container khởi động lại nhiều lần do lỗi ứng dụng hoặc thiếu bộ nhớ.
2. **Deployment thiếu replica khả dụng**: So sánh `kube_deployment_status_replicas_available` với `kube_deployment_spec_replicas` (từ `kube-state-metrics`) để nhận biết workload không đạt đủ số bản sao mong muốn.
3. **CPU throttling cao**: Tính tỷ lệ `container_cpu_cfs_throttled_periods_total` trên `container_cpu_cfs_periods_total` (từ `cAdvisor`) để phát hiện container bị kernel bóp nghẽn CPU do chạm giới hạn (`limits`).
4. **PersistentVolumeClaim (PVC) sắp đầy**: Tính tỷ lệ `kubelet_volume_stats_available_bytes` chia cho `kubelet_volume_stats_capacity_bytes` (từ `Kubelet`) để cảnh báo sớm trước khi hết dung lượng ổ đĩa.
</details>

---

### Câu Hỏi 12: Phân biệt SLI, SLO và SLA. Tại sao chuẩn SRE luôn yêu cầu đặt chỉ tiêu SLA thấp hơn (lỏng hơn) chỉ tiêu SLO?

<details>
<summary>Đáp án</summary>

- **SLI (Service Level Indicator)**: Chỉ số định lượng đo lường trực tiếp mức độ phục vụ thực tế của dịch vụ, thường tính bằng tỷ lệ số sự kiện tốt (`good events`) trên tổng số sự kiện hợp lệ (`valid events`).
- **SLO (Service Level Objective)**: Mục tiêu độ tin cậy cam kết **nội bộ** của đội ngũ kỹ thuật, thể hiện bằng giá trị mục tiêu của SLI trong một chu kỳ đo lường xác định (ví dụ `99.9%`).
- **SLA (Service Level Agreement)**: Hợp đồng kinh doanh hoặc thỏa thuận **pháp lý** với khách hàng, đi kèm điều khoản bồi thường tài chính nếu dịch vụ không đạt cam kết.
- **Vì sao SLA phải thấp hơn SLO**: Đặt SLA lỏng hơn SLO (ví dụ SLO `99.9%`, SLA `99.5%`) giúp tạo ra một **vùng đệm an toàn**. Nhờ đó, khi hệ thống vừa có dấu hiệu suy giảm dưới ngưỡng mục tiêu nội bộ (SLO), đội ngũ kỹ thuật kịp thời phát hiện và xử lý trước khi chạm ngưỡng vi phạm hợp đồng kinh doanh (SLA) và chịu phạt tài chính.
</details>

---

### Câu Hỏi 13: Error Budget (ngân sách sai số) được tính bằng công thức nào và giúp ích gì cho việc ra quyết định kỹ thuật?

<details>
<summary>Đáp án</summary>

- **Công thức**: `Error Budget = 100% - SLO` (ví dụ nếu SLO là `99.9%`, thì Error Budget là `0.1%`).
- **Ý nghĩa & Giá trị**:
  - Error Budget đại diện cho mức độ không hoàn hảo tối đa mà dịch vụ được phép xảy ra trong chu kỳ đo lường mà chưa làm người dùng không hài lòng.
  - Nó đóng vai trò thước đo định lượng giúp cân bằng giữa **tốc độ đổi mới** và **độ ổn định**: khi vẫn còn ngân sách sai số (`Budget > 0%`), đội ngũ có thể tự tin triển khai tính năng mới; khi ngân sách bị tiêu hao nhanh, cần ưu tiên tăng cường độ tin cậy.
</details>

---

### Câu Hỏi 14: Chính sách đóng băng phát hành (Deployment Freeze Policy) được kích hoạt khi nào và đội ngũ kỹ thuật cần thực hiện những gì?

<details>
<summary>Đáp án</summary>

- **Thời điểm kích hoạt**: Khi **Error Budget** trong chu kỳ đo lường bị **cạn kiệt hoàn toàn (về mức 0%)** — tức là chỉ số SLI thực tế đã tụt xuống dưới ngưỡng SLO cam kết.
- **Hành động bắt buộc của đội ngũ kỹ thuật**:
  1. Đình chỉ toàn bộ việc triển khai các tính năng mới để không tạo thêm rủi ro dẫn tới vi phạm SLA pháp lý.
  2. Chuyển hướng nguồn lực kỹ thuật sang điều tra nguyên nhân gốc rễ, vá lỗi, bổ sung test tự động và củng cố độ ổn định hệ thống.
  3. Chỉ gỡ bỏ lệnh đóng băng khi bước sang chu kỳ đo lường mới hoặc khi SLI phục hồi vượt ngưỡng SLO.
</details>
