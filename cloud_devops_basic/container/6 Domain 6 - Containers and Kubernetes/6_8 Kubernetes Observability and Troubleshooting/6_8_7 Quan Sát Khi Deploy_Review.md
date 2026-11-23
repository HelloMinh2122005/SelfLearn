# Ôn Tập: 6_8_7 Quan Sát Khi Deploy

### Câu Hỏi 1: Tại sao trong Kubernetes không nên xem một đợt deploy đã hoàn tất an toàn ngay khi các Pod mới chuyển sang trạng thái sẵn sàng ban đầu?

<details>
<summary>Đáp án</summary>

Việc các Pod vượt qua kiểm tra sẵn sàng ban đầu chỉ xác nhận trạng thái khởi động cơ bản ở cấp độ nội bộ Pod. Nhiều sự cố nghiêm trọng như rò rỉ bộ nhớ, nghẽn luồng xử lý hoặc lỗi truy vấn cơ sở dữ liệu chỉ bộc lộ khi dịch vụ tiếp nhận lưu lượng người dùng thật. Vì vậy, hệ thống cần tiếp tục đo lường liên tục và đối chiếu dữ liệu vận hành giữa phiên bản mới và phiên bản hiện tại để quyết định thăng cấp phát hành (promote) hay kích hoạt khôi phục (rollback).
</details>

### Câu Hỏi 2: Thiết lập và so sánh Baseline Metrics nhằm mục đích gì, và những chỉ số cốt lõi nào được theo dõi ngay sau khi deploy?

<details>
<summary>Đáp án</summary>

Baseline Metrics giúp hệ thống thu thập và đối chiếu các chỉ số vận hành tức thời của phiên bản mới với đường cơ sở của phiên bản ổn định trước đó nhằm đánh giá độ ổn định sau triển khai. Hai nhóm chỉ số chính gồm:
- **Tỷ lệ lỗi máy chủ (HTTP 5xx Error Rate)**: Đo phần trăm yêu cầu kết thúc bằng mã lỗi 5xx trên tổng lưu lượng nhận được, giúp phát hiện ngay hiện tượng hồi quy tính năng so với mức cơ sở.
- **Độ trễ phân vị cao (`p95`, `p99`) và mức tiêu thụ tài nguyên (CPU, bộ nhớ)**: Giúp phát hiện sớm hiện tượng nghẽn luồng hoặc rò rỉ bộ nhớ trước khi container bị dừng.
</details>

### Câu Hỏi 3: So sánh Rolling Update thuần túy và Canary Release kết hợp quan sát về cách kiểm tra chất lượng, thời gian phát hiện sự cố và phạm vi ảnh hưởng?

<details>
<summary>Đáp án</summary>

- **Rolling Update thuần túy**: Bộ điều khiển mặc định chỉ kiểm tra tín hiệu sẵn sàng nội bộ của container mà không đo chất lượng phục vụ thực tế đối với yêu cầu người dùng. Do đó, sự cố tiềm ẩn thường chỉ lộ ra sau khi toàn bộ lưu lượng đã chuyển sang phiên bản mới, làm kéo dài thời gian phát hiện lỗi và khiến toàn bộ hệ thống bị gián đoạn.
- **Canary Release kết hợp quan sát**: Chỉ định tuyến một phần nhỏ lưu lượng sang phiên bản mới và tự động đánh giá chỉ số thực tế. Cách tiếp cận này giúp giới hạn tối đa phạm vi ảnh hưởng (như ví dụ chỉ rót thử rượu vang cho một vài khách ở bàn đầu tiên) và phát hiện lỗi chỉ trong vài phút.
</details>

### Câu Hỏi 4: Deployment Annotations trên Grafana giúp kỹ sư vận hành giải quyết bài toán gì khi sự cố phát sinh?

<details>
<summary>Đáp án</summary>

Deployment Annotations hiển thị các đường đánh dấu thẳng đứng kèm chú thích ngữ cảnh trực tiếp trên các bảng điều khiển thời gian thực của Grafana, giúp đối chiếu biểu đồ trước và sau thời điểm cập nhật. Nhờ đó, khi thấy độ trễ hoặc tỷ lệ lỗi tăng đột biến ngay tại vị trí đường annotation, kỹ sư trực vận hành có thể xác định ngay sự biến động bắt nguồn từ thay đổi mã nguồn vừa phát hành chứ không phải do hạ tầng mạng hay máy chủ bên ngoài.
</details>

### Câu Hỏi 5: Để đẩy sự kiện đánh dấu mốc triển khai lên Grafana qua API, cần gọi endpoint nào và payload JSON phải gồm những trường thông tin cơ bản nào?

<details>
<summary>Đáp án</summary>

Cần gửi yêu cầu HTTP tới endpoint `POST /api/annotations` của **Grafana Annotations API**. Bản tin JSON gửi lên bao gồm:
- `text`: Chuỗi mô tả nội dung sự kiện (ví dụ tên ứng dụng và phiên bản triển khai).
- `time`: Mốc thời gian Unix epoch tính theo mili-giây (dạng số nguyên).
- `tags`: Mảng các nhãn để phân loại sự kiện (ví dụ môi trường, tên dịch vụ).
</details>

### Câu Hỏi 6: Trong kịch bản Bash dùng `curl` gửi annotation từ pipeline GitLab CI/CD, cần cấu hình những HTTP header nào và lấy mốc thời gian `time` bằng lệnh gì?

<details>
<summary>Đáp án</summary>

Khi gọi `curl -s -f -X POST "${GRAFANA_URL}/api/annotations"`, kịch bản cần truyền hai header bắt buộc:
- `Authorization: Bearer ${GRAFANA_TOKEN}` để xác thực với Grafana.
- `Content-Type: application/json` để khai báo định dạng dữ liệu JSON.

Mốc thời gian Unix epoch tính theo mili-giây được lấy bằng lệnh `date +%s%3N` và truyền vào trường `"time"` dưới dạng số nguyên.
</details>

### Câu Hỏi 7: Các bộ điều khiển Progressive Delivery như Argo Rollouts hoặc Flagger mở rộng Kubernetes bằng cách nào, và tài nguyên `Rollout` có vai trò gì?

<details>
<summary>Đáp án</summary>

Argo Rollouts và Flagger mở rộng Kubernetes thông qua các tài nguyên tùy biến nhằm tự động hóa việc phân tích chỉ số và điều phối lưu lượng. Trong đó, tài nguyên `Rollout` thay thế trực tiếp tài nguyên `Deployment` tiêu chuẩn của Kubernetes, cho phép điều khiển từng bước dịch chuyển lưu lượng sang phiên bản mới theo chiến lược canary.
</details>

### Câu Hỏi 8: Trong cấu hình các bước canary (`steps`) của `Rollout`, hai thuộc tính `setWeight` và `pause` phối hợp với nhau như thế nào?

<details>
<summary>Đáp án</summary>

Thuộc tính `setWeight` chỉ định phần trăm lưu lượng mạng được dẫn sang phiên bản mới (ví dụ `10`, `30`, `60`), còn thuộc tính `pause` (kèm `duration` như `2m`, `5m`) tạm dừng tiến trình phát hành tại mức lưu lượng đó để hệ thống có đủ thời gian thu thập và hoàn tất phân tích số liệu trước khi chuyển sang bước tiếp theo.
</details>

### Câu Hỏi 9: Tài nguyên `AnalysisTemplate` trong Argo Rollouts dùng để định nghĩa những thành phần nào?

<details>
<summary>Đáp án</summary>

`AnalysisTemplate` là bản thiết kế định nghĩa các quy tắc đánh giá chỉ số tự động, bao gồm:
- Nguồn dữ liệu và câu truy vấn PromQL (ví dụ truy vấn tỷ lệ lỗi HTTP 5xx từ Prometheus).
- Khoảng thời gian kiểm tra lặp lại (`interval`).
- Ngưỡng đánh giá thành công (`successCondition`, ví dụ `result[0] < 0.01`).
- Các giới hạn thất bại cho phép (`failureLimit` và `consecutiveErrorLimit`).
</details>

### Câu Hỏi 10: Trong `AnalysisTemplate`, tham số `failureLimit` và `consecutiveErrorLimit` có ý nghĩa gì, và vì sao nên đặt `failureLimit` lớn hơn 0 (ví dụ bằng 3)?

<details>
<summary>Đáp án</summary>

- `consecutiveErrorLimit` xác định số lần lỗi liên tiếp được phép xảy ra (ví dụ do mạng chập chờn khi truy vấn Prometheus) trước khi tính là một lượt đánh giá thất bại.
- `failureLimit` giới hạn tổng số lượt đánh giá thất bại được phép trước khi hủy đợt phát hành.

Nên đặt `failureLimit` lớn hơn `0` (như `3`) thay vì `0` để tránh bẫy báo động giả do nhiễu mạng tạm thời hoặc biến động tức thời; bộ điều khiển chỉ quyết định rollback khi lỗi duy trì qua nhiều chu kỳ kiểm tra liên tiếp.
</details>

### Câu Hỏi 11: Trong luồng kiến trúc khép kín, Argo Rollouts Controller ra quyết định Promote hay Automated Rollback dựa trên kết quả từ Prometheus như thế nào?

<details>
<summary>Đáp án</summary>

Sau khi CI/CD gửi annotation lên Grafana và áp dụng `Rollout`, Argo Rollouts Controller điều phối Service Mesh / Ingress định tuyến một phần nhỏ lưu lượng sang Pod mới và liên tục truy vấn PromQL tới Prometheus (qua `AnalysisRun`):
- **Nếu chỉ số vượt ngưỡng lỗi cho phép (Failure)**: Bộ điều khiển tự động đình chỉ phát hành, chuyển 100% lưu lượng về lại phiên bản cũ (**Automated Rollback**) và đánh dấu trạng thái Rollout là `Degraded`.
- **Nếu chỉ số đạt chuẩn an toàn (Success)**: Bộ điều khiển tiếp tục tăng dần tỷ lệ lưu lượng sang phiên bản mới (**Promote**) cho đến khi hoàn tất phát hành.
</details>

### Câu Hỏi 12: Cạm bẫy dung lượng mẫu nhỏ (Low-Traffic Sample Bias) là gì và cách khắc phục trong câu truy vấn PromQL như thế nào?

<details>
<summary>Đáp án</summary>

Khi lưu lượng đi qua phiên bản mới quá nhỏ (như trong giờ thấp điểm), mẫu số của phép tính tỷ lệ lỗi trở nên quá nhỏ. Lúc này, chỉ một vài yêu cầu lỗi ngẫu nhiên cũng khiến phần trăm lỗi tăng vọt và kích hoạt rollback nhầm.

Cách khắc phục là bổ sung điều kiện lọc ngưỡng lưu lượng tối thiểu ở mẫu số và giá trị mặc định `0` cho tử số trong PromQL, ví dụ:
```promql
(sum(rate(http_requests_total{status=~"5.."}[2m])) or vector(0))
/
(sum(rate(http_requests_total[2m])) > 10)
```
</details>

### Câu Hỏi 13: Tại sao các metric do ứng dụng xuất ra bắt buộc phải gắn nhãn (label) phân biệt phiên bản giữa nhóm Pod Canary và nhóm Pod Baseline?

<details>
<summary>Đáp án</summary>

Nhãn phiên bản cụ thể trên từng metric giúp câu truy vấn PromQL phân tách rạch ròi ranh giới dữ liệu giữa nhóm Pod mới (Canary) và nhóm Pod cũ (Baseline). Nếu thiếu nhãn phân biệt, phép tính sẽ hòa lẫn số liệu của cả hai phiên bản vào nhau, làm mất tính chính xác của việc đo lường và đánh giá độc lập.
</details>

### Câu Hỏi 14: Hiện tượng khởi động nguội (Cold-Start Penalty) gây ra rủi ro gì khi đánh giá sau deploy và cách phòng tránh trong thực tế là gì?

<details>
<summary>Đáp án</summary>

Các ứng dụng chạy trên máy ảo Java hoặc cần nạp dữ liệu vào bộ nhớ đệm ban đầu thường có độ trễ phản hồi cao trong giai đoạn mới khởi động. Nếu hệ thống bắt đầu chấm điểm metric ngay lập tức, độ trễ cao tạm thời này có thể dẫn đến đánh giá sai và hủy bỏ đợt phát hành oan. Cách phòng tránh là thiết lập khoảng thời gian làm ấm tài nguyên thích hợp trước khi kích hoạt quy trình phân tích chỉ số.
</details>
