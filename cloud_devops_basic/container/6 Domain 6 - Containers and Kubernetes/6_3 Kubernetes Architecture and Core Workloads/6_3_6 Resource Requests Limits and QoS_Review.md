# Ôn Tập: 6_3_6 Resource Requests Limits and QoS

### Câu Hỏi 1: `resources.requests` và `resources.limits` trong Kubernetes khác nhau như thế nào về ý nghĩa?

<details>
<summary>Đáp án</summary>

- **`resources.requests`** là mức tài nguyên tối thiểu. Container được cam kết bảo đảm bộ nhớ ít nhất bằng mức `request` này.
- **`resources.limits`** là trần tài nguyên tối đa. Container sẽ bị chặn không được vượt quá mức `limit` này.
</details>

### Câu Hỏi 2: Kubernetes quy định đơn vị đo lường và độ mịn cho CPU và Memory như thế nào?

<details>
<summary>Đáp án</summary>

- **CPU**: `1` CPU tương đương với `1` physical core hoặc `1` vCPU. Có thể biểu diễn bằng số thập phân hoặc millicores (`0.1` CPU tương đương `100m`). Kubernetes cấm khai báo độ mịn nhỏ hơn `1m` (hoặc `0.001` CPU).
- **Memory**: Đơn vị chuẩn là Bytes. Có thể dùng hậu tố thập phân (`k`, `M`, `G`, `T`) hoặc hậu tố nhị phân lũy thừa 2 (`Ki`, `Mi`, `Gi`, `Ti`).
</details>

### Câu Hỏi 3: `requests` và `limits` được xử lý ở hai tầng kiến trúc nào trong Kubernetes?

<details>
<summary>Đáp án</summary>

Hai thông số này được xử lý ở hai tầng riêng biệt:
1. **Tầng lập lịch (`kube-scheduler`)**: Sử dụng **`requests`** để tìm node phù hợp. Scheduler bảo đảm tổng `requests` của các container đã xếp lịch không vượt quá dung lượng khả dụng của node. Nếu không có node nào đủ `requests`, Pod sẽ ở trạng thái `Pending`.
2. **Tầng thực thi trên Node (Linux kernel cgroups)**: Sử dụng **`limits`**. `kubelet` chuyển giao cho container runtime cấu hình các mức trần này vào cgroups v2 của Linux kernel (`cpu.max` và `memory.max`).
</details>

### Câu Hỏi 4: Điều gì xảy ra khi container chạm ngưỡng `limits.cpu` so với khi vượt ngưỡng `limits.memory`?

<details>
<summary>Đáp án</summary>

- **Chạm `limits.cpu` (CPU Throttling)**: CPU limit được thực thi qua cơ chế throttling (`cpu.max` / CFS Quota). Khi container tiệm cận hoặc vượt trần CPU, kernel hạn chế quyền truy cập CPU tương ứng, làm tiến trình chạy **chậm lại** chứ **không kill container**.
- **Vượt `limits.memory` (OOMKilled, `exitCode 137`)**: Memory limit được thực thi qua Linux Out-Of-Memory (OOM) killer (`memory.max`). Khi cgroup vượt memory limit, Linux OOM subsystem kích hoạt và dừng tiến trình ngay lập tức. Container bị kết liễu với `exitCode 137` và trạng thái `OOMKilled`; nếu tiến trình bị dừng là PID 1, container sẽ bị restart.
</details>

### Câu Hỏi 5: Vì sao một dịch vụ API có thể bị tăng vọt độ trễ (latency spikes) dù mức sử dụng CPU trung bình trên node vẫn thấp? Nên khắc phục ra sao?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Do cấu hình `limits.cpu` quá thấp. Khi ứng dụng đa luồng dùng hết quota CPU quá sớm trong một chu kỳ, Linux CFS sẽ bóp nghẽn chu kỳ (CPU throttling), làm tiến trình bị chậm lại từng nhịp và kéo p99 latency tăng vọt dù không gây crash.
- **Khuyến nghị**: Đặt `requests.cpu` dựa theo tải trung bình của dịch vụ, và tránh đặt `limits.cpu` quá thấp (hoặc để burst tự nhiên nếu chính sách vận hành cho phép).
</details>

### Câu Hỏi 6: Kubernetes phân loại ba lớp QoS (`Guaranteed`, `Burstable`, `BestEffort`) dựa trên điều kiện nào?

<details>
<summary>Đáp án</summary>

1. **`Guaranteed`**: Mọi container trong Pod đều phải khai báo cả CPU và memory `request` lẫn `limit` lớn hơn `0`, đồng thời `memory limit == memory request` và `cpu limit == cpu request`.
2. **`Burstable`**: Pod không thỏa điều kiện của `Guaranteed`, nhưng có ít nhất một container khai báo `request` hoặc `limit` cho memory hoặc CPU (ví dụ: chỉ đặt một loại tài nguyên, hoặc đặt `request` khác `limit`).
3. **`BestEffort`**: Pod không thỏa `Guaranteed` lẫn `Burstable`, tức là không có container nào trong Pod đặt CPU hay memory `request` hoặc `limit`.
</details>

### Câu Hỏi 7: Khi node bị áp lực thiếu tài nguyên (node pressure), Kubernetes trục xuất (evict) Pod theo thứ tự QoS nào và có điều kiện gì đối với việc tiêu thụ?

<details>
<summary>Đáp án</summary>

- **Thứ tự trục xuất (Eviction)**:
  1. Đầu tiên là **`BestEffort`**.
  2. Tiếp theo là **`Burstable`**.
  3. Cuối cùng mới đến **`Guaranteed`** (được bảo vệ tối đa).
- **Điều kiện tiêu thụ**: Khi xảy ra trục xuất do áp lực tài nguyên, chỉ những Pod đang tiêu thụ vượt quá mức `request` đã cam kết mới là đối tượng bị evict.
</details>

### Câu Hỏi 8: Sự khác nhau giữa `LimitRange` và `ResourceQuota` trong quản trị tài nguyên cấp namespace là gì?

<details>
<summary>Đáp án</summary>

- **`LimitRange`**: Là chính sách admission ràng buộc phân bổ tài nguyên cho **từng Pod/Container** trong namespace thông qua các ngưỡng tối thiểu (`min`), tối đa (`max`), hạn mức mặc định (`default`) và yêu cầu mặc định (`defaultRequest`).
- **`ResourceQuota`**: Là chính sách giới hạn **tổng mức tiêu thụ tài nguyên gộp** của toàn bộ namespace dưới trường `spec.hard` (ví dụ tổng `requests.cpu`, `requests.memory`, `limits.cpu`, `limits.memory`, và số lượng `pods`).
</details>

### Câu Hỏi 9: Điều gì xảy ra nếu namespace đã cấu hình `ResourceQuota` cho CPU/memory nhưng không có `LimitRange`, và một Pod mới được tạo mà không khai báo `resources.limits`?

<details>
<summary>Đáp án</summary>

- **Hiện tượng**: Pod mới sẽ bị API server **từ chối ngay tại bước admission** và không thể tạo được.
- **Nguyên nhân**: Khi `ResourceQuota` có giới hạn CPU hoặc memory, Kubernetes bắt buộc mọi Pod mới trong namespace đó phải khai báo `limit` cho tài nguyên tương ứng.
- **Cách khắc phục**: Luôn tạo kèm một `LimitRange` có khai báo `default` và `defaultRequest` trong namespace để hệ thống tự động gán giá trị mặc định cho các Pod không ghi rõ tài nguyên.
</details>

### Câu Hỏi 10: Các cờ JVM `UseContainerSupport`, `-XX:MaxRAMPercentage` và `-XX:InitialRAMPercentage` có tác dụng và giá trị mặc định như thế nào trong container Linux?

<details>
<summary>Đáp án</summary>

- **`UseContainerSupport`**: Bật mặc định trên Linux, giúp JVM tự động nhận diện số processor và giới hạn memory của container thay vì đọc tài nguyên của máy host.
- **`-XX:MaxRAMPercentage`**: Cấu hình kích thước Java Heap tối đa theo phần trăm memory limit của container (mặc định là **`25%`**).
- **`-XX:InitialRAMPercentage`**: Cấu hình kích thước Java Heap khởi tạo theo phần trăm RAM (mặc định là **`1.5625%`**).
</details>

### Câu Hỏi 11: Vì sao một Pod Java đặt `-XX:MaxRAMPercentage=90.0` vẫn bị `OOMKilled` (`exitCode 137`) dù mức sử dụng Java Heap chưa chạm tới giới hạn `limits.memory`? Nên cấu hình tỷ lệ này bao nhiêu?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Giới hạn cgroup `memory.max` đo **toàn bộ bộ nhớ của tiến trình**, bao gồm cả **Java Heap** lẫn phần **Non-Heap** (Metaspace, thread stacks, direct byte buffers, JIT cache, native memory). Nếu dành tới 90% cho Heap, 10% còn lại sẽ không đủ khi vùng Non-Heap mở rộng, làm tổng bộ nhớ vượt trần `memory.max` và bị Linux OOM killer kết liễu với `exitCode 137`.
- **Khuyến nghị**: Cấu hình `-XX:MaxRAMPercentage` (ví dụ qua biến môi trường `JAVA_TOOL_OPTIONS`) ở mức **`70% - 75%`**, bảo lưu **`25% - 30%`** dung lượng cho Non-Heap và hệ điều hành.
</details>

### Câu Hỏi 12: Bạn dùng các lệnh `kubectl` nào để kiểm tra QoS class của Pod, xác minh nguyên nhân `OOMKilled` (`exitCode 137`) và theo dõi mức tiêu thụ `ResourceQuota`?

<details>
<summary>Đáp án</summary>

- **Xem QoS class của các Pod**:
  ```bash
  kubectl get pods -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
  ```
  *(Hoặc dùng `kubectl describe pod <tên-pod>` để xem chi tiết `QoS Class`, `Limits`, `Requests`).*
- **Kiểm tra trạng thái `OOMKilled` và `exitCode 137`**:
  ```bash
  kubectl get pod <tên-pod> -o jsonpath='{.status.containerStatuses[*].lastState.terminated}'
  ```
- **Kiểm tra mức sử dụng `ResourceQuota` trong namespace**:
  ```bash
  kubectl describe resourcequota <tên-quota> -n <namespace>
  ```
</details>
