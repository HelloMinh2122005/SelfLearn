# Ôn Tập: 6_7_8 Autoscaling

### Câu Hỏi 1: Horizontal Pod Autoscaler (HPA) là gì, hoạt động như thế nào và thường áp dụng cho những loại workload nào?

<details>
<summary>Đáp án</summary>

- **Khái niệm**: HPA là một Kubernetes controller tự động điều chỉnh số lượng bản sao Pod (`replicas`) — tức là co giãn theo chiều ngang — dựa trên mức độ sử dụng tài nguyên hoặc các số liệu đo lường quan sát được.
- **Loại workload áp dụng**: HPA thường áp dụng cho các workload như `Deployment`, `ReplicaSet`, hoặc `StatefulSet`, và đặc biệt thích hợp cho các ứng dụng không lưu trạng thái (stateless).
- **Cơ chế hoạt động**: Vòng lặp kiểm soát của HPA định kỳ truy vấn các chỉ số tải thực tế, tính toán số lượng bản sao mong muốn (`desiredReplicas`) và cập nhật lại số lượng replica vào đối tượng quản lý Pod (như Deployment) để tăng hoặc giảm Pod tương ứng.
</details>

### Câu Hỏi 2: Trong phiên bản API `autoscaling/v2`, trường `spec.metrics` của HPA hỗ trợ những loại mục tiêu đo lường (metrics) nào?

<details>
<summary>Đáp án</summary>

API `autoscaling/v2` hỗ trợ ba nhóm mục tiêu đo lường trong `spec.metrics`:
1. **`Resource`**: Theo dõi tài nguyên của Pod như `cpu` hoặc `memory` (có thể đặt ngưỡng theo phần trăm `Utilization` như `averageUtilization: 70` hoặc theo giá trị `AverageValue` như `400Mi`).
2. **`Pods`**: Theo dõi metric trung bình tính trên từng Pod.
3. **`Object` hoặc `External`**: Theo dõi metric từ một đối tượng Kubernetes khác hoặc từ nguồn bên ngoài cluster.
</details>

### Câu Hỏi 3: Vai trò của `metrics-server` và Resource Metrics API (`metrics.k8s.io`) trong quy trình hoạt động của HPA là gì? Điều gì xảy ra nếu cụm thiếu `metrics-server`?

<details>
<summary>Đáp án</summary>

- **Vai trò**: HPA không thể tự đọc trực tiếp mức tiêu thụ tài nguyên của từng container. Thay vào đó, `kubelet` (thông qua `cAdvisor`) đọc mức tiêu thụ từ `cgroups` của các Pod trên từng worker node; `metrics-server` thu thập định kỳ các số liệu này từ `kubelet`, tổng hợp lại trong cluster và cung cấp qua **Resource Metrics API (`metrics.k8s.io`)** để HPA truy vấn.
- **Khi thiếu `metrics-server`**: HPA không lấy được dữ liệu sử dụng CPU và bộ nhớ, nên các chỉ số rơi vào trạng thái không xác định (unknown) và HPA không thể thực hiện tự động co giãn.
</details>

### Câu Hỏi 4: HPA sử dụng công thức nào để tính số lượng Pod mong muốn? Cho ví dụ một Deployment đang chạy 4 Pods với ngưỡng CPU mục tiêu là 50%, nếu mức CPU trung bình đo được là 75% thì HPA sẽ tính ra bao nhiêu Pod?

<details>
<summary>Đáp án</summary>

- **Công thức chuẩn**:
  $$\text{desiredReplicas} = \lceil \text{currentReplicas} \times (\text{currentMetricValue} / \text{desiredMetricValue}) \rceil$$
  Trong đó kết quả được làm tròn lên (`ceil`) để đảm bảo cụm luôn có đủ năng lực đáp ứng nhu cầu xử lý.
- **Áp dụng vào ví dụ**:
  $$\text{desiredReplicas} = \lceil 4 \times (75 / 50) \rceil = \lceil 4 \times 1.5 \rceil = 6$$
  HPA sẽ cập nhật để mở rộng Deployment lên **6 Pods**.
</details>

### Câu Hỏi 5: Vì sao khi cấu hình HPA dựa trên phần trăm sử dụng tài nguyên (utilization) thì container trong Pod bắt buộc phải khai báo `resources.requests`?

<details>
<summary>Đáp án</summary>

- HPA tính tỷ lệ phần trăm sử dụng tài nguyên (`target average utilization`) bằng cách so sánh lượng tài nguyên tiêu thụ thực tế với giá trị `requests` (`requests.cpu` hoặc `requests.memory`) được khai báo trong Pod spec.
- Nếu thiếu `requests`, HPA không có mốc đối chiếu để quy đổi mức tiêu thụ thực tế ra tỷ lệ phần trăm, khiến bộ điều khiển từ chối thực hiện tính toán và không thể co giãn Pod dựa trên utilization.
</details>

### Câu Hỏi 6: Hiện tượng flapping là gì và HPA cung cấp cơ chế `spec.behavior` như thế nào để kiểm soát hiện tượng này?

<details>
<summary>Đáp án</summary>

- **Hiện tượng flapping**: Khi lưu lượng mạng biến động răng cưa (tăng giảm thất thường), việc HPA phản ứng quá nhanh sẽ khiến số lượng Pod bị khởi tạo rồi hủy liên tục, gây dao động và lãng phí tài nguyên tính toán.
- **Cơ chế kiểm soát qua `spec.behavior`**:
  - Cho phép cấu hình thuật toán co giãn riêng cho hai chiều `scaleUp` (tăng Pod) và `scaleDown` (giảm Pod).
  - **`stabilizationWindowSeconds`**: Thiết lập khoảng thời gian chờ làm dịu trước khi thay đổi số lượng Pod. Mặc định trong Kubernetes, `stabilizationWindowSeconds` cho `scaleDown` là **300 giây (5 phút)** nhằm tránh hủy Pod vội vàng khi tải chỉ giảm tạm thời.
  - **`policies`**: Quy định tốc độ co giãn tối đa theo phần trăm (`type: Percent`) hoặc số lượng Pod tuyệt đối (`type: Pods`) trong mỗi khoảng thời gian `periodSeconds`, kết hợp với `selectPolicy` (`Max` hoặc `Min`) để chọn chính sách áp dụng.
</details>

### Câu Hỏi 7: Vertical Pod Autoscaler (VPA) dùng để làm gì và kiến trúc cốt lõi của VPA gồm những thành phần nào?

<details>
<summary>Đáp án</summary>

- **Chức năng của VPA**: VPA thực hiện co giãn theo chiều dọc bằng cách tự động điều chỉnh giá trị `requests` và `limits` cho CPU và Memory của các Pod hiện có (thay vì tăng giảm số lượng Pod như HPA).
- **Ba thành phần kiến trúc cốt lõi**:
  1. **VPA Recommender**: Theo dõi mức sử dụng tài nguyên và tính toán mức `requests`/`limits` khuyến nghị.
  2. **VPA Updater**: Kiểm tra và quyết định khi nào cần cập nhật lại cấu hình tài nguyên cho Pod.
  3. **VPA Admission Controller**: Chặn yêu cầu khởi tạo Pod và tự động áp dụng cấu hình tài nguyên mới khi Pod được tạo lại.
</details>

### Câu Hỏi 8: Vì sao Kubernetes khuyến cáo không nên cấu hình đồng thời cả HPA và VPA trên cùng một metric tài nguyên cho cùng một workload? Khi nào có thể kết hợp cả hai?

<details>
<summary>Đáp án</summary>

- **Lý do tránh xung đột**: Nếu HPA và VPA cùng theo dõi và phản ứng trên cùng một metric (ví dụ cùng dựa trên CPU hoặc Memory utilization), cả hai bộ điều khiển sẽ tác động đồng thời (một bên thay đổi số lượng Pod, một bên thay đổi `requests`/`limits`), dẫn đến phản ứng dây chuyền làm mất kiểm soát định mức cấp phát tài nguyên trong cụm.
- **Khi nào có thể kết hợp**: Chỉ nên kết hợp HPA và VPA khi hai cơ chế theo dõi các thước đo hoàn toàn độc lập với nhau (không cùng dựa trên một chỉ số tài nguyên).
</details>

### Câu Hỏi 9: Cluster Autoscaler và Karpenter giải quyết bài toán gì khác với HPA và VPA? Khi nào chúng được kích hoạt?

<details>
<summary>Đáp án</summary>

- **Điểm khác biệt**: HPA và VPA co giãn ở cấp độ **Pod** (số lượng Pod hoặc kích thước tài nguyên của Pod). Trong khi đó, Cluster Autoscaler và Karpenter co giãn ở cấp độ **hạ tầng Node** (tăng hoặc giảm các worker node vật lý/máy ảo trong cluster).
- **Thời điểm kích hoạt**: Khi nhu cầu tải vượt quá tổng dung lượng tài nguyên của toàn bộ các node hiện có — thường thể hiện qua việc các Pod mới tạo bị rơi vào trạng thái `Pending` do thiếu tài nguyên — Cluster Autoscaler hoặc Karpenter sẽ tự động cấp phát và bổ sung thêm worker node vào cụm để lập lịch cho các Pod đó.
</details>

### Câu Hỏi 10: Tính năng In-place Pod Resource Resize (`InPlacePodVerticalScaling`) giải quyết hạn chế gì khi thay đổi tài nguyên cho Pod?

<details>
<summary>Đáp án</summary>

- Tính năng In-place Pod Resource Resize (bật qua feature gate `InPlacePodVerticalScaling`) cho phép cập nhật trực tiếp các trường `resources.requests` và `resources.limits` của container trong một Pod đang chạy **mà không cần khởi động lại (restart) Pod**.
- Cơ chế này cập nhật giới hạn tài nguyên trực tiếp xuống tầng nhân hệ điều hành, giúp tránh làm gián đoạn tiến trình ứng dụng đang xử lý.
</details>

### Câu Hỏi 11: Trong thực hành với `kubectl`, làm thế nào để tạo nhanh một HPA, xem trạng thái co giãn hiện tại và kiểm tra chi tiết các sự kiện co giãn của HPA?

<details>
<summary>Đáp án</summary>

- **Tạo nhanh HPA bằng CLI**:
  ```bash
  kubectl autoscale deployment order-api --min=2 --max=10 --cpu-percent=80
  ```
  Lệnh này tạo nhanh HPA cho Deployment `order-api` với số lượng Pod tối thiểu là 2, tối đa là 10, và ngưỡng CPU mục tiêu là 80%.
- **Xem danh sách và trạng thái tổng quan**:
  ```bash
  kubectl get hpa
  ```
  Giúp quan sát cột `TARGETS` (mức tải hiện tại so với mục tiêu, ví dụ `45%/70%`), `MINPODS`, `MAXPODS`, và số `REPLICAS` hiện hành.
- **Xem chi tiết sự kiện và lý do co giãn**:
  ```bash
  kubectl describe hpa order-api-hpa
  ```
  Giúp kiểm tra chi tiết cấu hình, điều kiện hoạt động và các sự kiện (Events) tăng/giảm Pod của HPA.
</details>

### Câu Hỏi 12: Trong quy trình GitOps (như Argo CD, Flux) hoặc triển khai bằng Helm, việc khai báo cứng `spec.replicas` trong file YAML Deployment sẽ gây ra vấn đề gì với HPA và cách khắc phục chuẩn là gì?

<details>
<summary>Đáp án</summary>

- **Vấn đề xung đột**: Khi HPA tự động tăng hoặc giảm số lượng Pod trên cluster, mỗi chu kỳ đồng bộ của GitOps (`sync`) hoặc `helm upgrade` sẽ so sánh với giá trị `spec.replicas` tĩnh khai báo trong Git và ghi đè lại số Pod về giá trị cố định đó. Hai cơ chế sẽ liên tục giằng co qua lại.
- **Cách khắc phục chuẩn**:
  1. Xóa hoàn toàn trường `spec.replicas` khỏi file manifest Deployment (hoặc đặt điều kiện trong template Helm để bỏ qua trường này khi bật autoscaling) để GitOps/Helm không quản lý số lượng bản sao.
  2. Hoặc cấu hình công cụ GitOps bỏ qua sự chênh lệch (`ignore differences`) đối với trường `spec.replicas`.
</details>
