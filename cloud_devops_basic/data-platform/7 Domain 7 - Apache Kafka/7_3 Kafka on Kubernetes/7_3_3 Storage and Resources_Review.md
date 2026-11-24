# Review: 7_3_3 Storage and Resources

### Câu Hỏi 1: Tại sao tốc độ I/O của ổ đĩa lại ảnh hưởng trực tiếp đến hiệu năng của Kafka broker, và `StorageClass` trong Kubernetes giải quyết vấn đề gì?

<details>
<summary>Đáp án</summary>

Mỗi Kafka broker lưu dữ liệu các partition trực tiếp xuống hệ thống tệp trên đĩa dưới dạng các tệp log ghi nối đuôi tuần tự (sequential append), nên tốc độ I/O của ổ đĩa quyết định trực tiếp độ trễ ghi và thông lượng của broker.

Trong Kubernetes, `StorageClass` là tài nguyên giúp quản trị viên định nghĩa các "hạng" lưu trữ khác nhau (ví dụ ổ đĩa SSD/NVMe IOPS cao so với ổ HDD tiêu chuẩn), mỗi hạng tương ứng với một mức chất lượng dịch vụ hoặc chính sách cấp phát riêng. Khi khai báo `PersistentVolumeClaim` (PVC) cho broker, bạn chỉ định tên `StorageClass` hiệu năng cao vào trường `storageClassName`.

</details>

### Câu Hỏi 2: Điều gì xảy ra nếu bỏ trống trường `storageClassName` khi khai báo `PersistentVolumeClaim` (PVC), và rủi ro thực tế đối với Kafka là gì?

<details>
<summary>Đáp án</summary>

Nếu bỏ trống trường `storageClassName`, Kubernetes sẽ sử dụng `StorageClass` mặc định của cluster (nếu cluster có một `StorageClass` mang annotation `storageclass.kubernetes.io/is-default-class: "true"`).

Rủi ro thực tế là PVC có thể bị gắn vào `StorageClass` mặc định có IOPS thấp, làm chậm thao tác ghi log tuần tự của Kafka broker. Vì vậy, trong môi trường thực tế cần luôn chỉ định tường minh một `StorageClass` nhanh (ví dụ `fast-ssd`).

</details>

### Câu Hỏi 3: Chế độ truy cập `ReadWriteOnce` (`RWO`) có ý nghĩa gì, và tại sao mỗi Kafka broker cần một PVC `RWO` riêng biệt thay vì dùng chung (`ReadWriteMany`)?

<details>
<summary>Đáp án</summary>

Chế độ truy cập `ReadWriteOnce` (`RWO`) quy định rằng volume đó chỉ có thể được mount ở chế độ đọc-ghi bởi một Kubernetes node duy nhất tại một thời điểm.

Hai Kafka broker không bao giờ chia sẻ chung một thư mục dữ liệu log của nhau. Việc cấp cho mỗi broker một PVC `RWO` độc lập (thay vì dùng chung chế độ `ReadWriteMany` - `RWX`) giúp tránh xung đột khóa tệp (file lock) và giữ hiệu năng I/O tách biệt cho từng broker.

</details>

### Câu Hỏi 4: Sự khác biệt giữa `resources.requests` và `resources.limits` trong cấu hình container là gì? Điều gì xảy ra nếu container sử dụng vượt quá `limits.memory`?

<details>
<summary>Đáp án</summary>

- **`resources.requests`**: Khai báo lượng CPU và RAM tối thiểu mà `kube-scheduler` sử dụng để tìm node còn đủ chỗ trống khi xếp lịch cho Pod.
- **`resources.limits`**: Đặt trần tài nguyên tối đa mà container được phép sử dụng.

Nếu một tiến trình trong container sử dụng vượt quá ngưỡng `limits.memory`, Linux kernel (OOM killer) có thể chấm dứt container đó ngay lập tức với lý do `OOMKilled`.

</details>

### Câu Hỏi 5: Làm thế nào để Pod của Kafka broker được gán lớp chất lượng dịch vụ (QoS) `Guaranteed`, và lớp này mang lại lợi ích gì?

<details>
<summary>Đáp án</summary>

Khi mọi container trong Pod đều đặt `requests` bằng đúng `limits` cho cả CPU và memory, Kubernetes sẽ gán cho Pod lớp chất lượng dịch vụ **`Guaranteed`**.

Lợi ích của lớp `Guaranteed` là giúp Pod có độ ưu tiên giữ lại cao nhất và tránh bị thu hồi (evict) khi node rơi vào tình trạng thiếu tài nguyên.

</details>

### Câu Hỏi 6: Phân biệt vai trò của **JVM Heap** và **OS Page Cache** đối với một Kafka broker?

<details>
<summary>Đáp án</summary>

- **JVM Heap**: Là vùng nhớ bên trong máy ảo Java dùng cho các đối tượng quản lý kết nối, metadata và bộ đệm xử lý của broker.
- **OS Page Cache**: Là phần RAM trống được nhân Linux tự động sử dụng để giữ tạm các khối dữ liệu tệp vừa ghi hoặc hay đọc.

</details>

### Câu Hỏi 7: Tại sao Apache Kafka khuyến nghị giữ **JVM Heap** ở mức khiêm tốn và dành phần lớn RAM cho **OS Page Cache**? Điều gì xảy ra nếu gán `-Xmx` gần bằng hoặc bằng `limits.memory`?

<details>
<summary>Đáp án</summary>

Kafka phụ thuộc rất mạnh vào **OS page cache** để đệm và phục vụ dữ liệu message trực tiếp qua hệ thống tệp thay vì tự giữ dữ liệu message trong JVM heap. Nếu cố tình cấp JVM heap quá lớn, lượng RAM còn lại cho OS page cache bị thu hẹp (khiến broker phải đọc từ đĩa chậm hơn) và thời gian tạm dừng của Garbage Collection (GC) khi quét heap sẽ tăng lên.

Nếu gán `-Xmx` bằng hoặc quá sát `limits.memory` (ví dụ `limits.memory: 8Gi` với `-Xmx8g`), hệ điều hành không còn RAM cho page cache và tổng bộ nhớ `heap + native memory` của JVM rất dễ vượt trần `limits.memory`, dẫn đến bị kernel chấm dứt với lỗi `OOMKilled`. Do đó cần giữ JVM heap khiêm tốn (ví dụ `-Xms4g -Xmx4g`) và đặt `requests.memory` / `limits.memory` lớn hơn nhiều (ví dụ `16Gi`).

</details>

### Câu Hỏi 8: `PodDisruptionBudget` (`PDB`) dùng để làm gì khi bảo trì node, và hai trường cấu hình nào được hỗ trợ trong PDB?

<details>
<summary>Đáp án</summary>

`PodDisruptionBudget` (`PDB`, thuộc nhóm API `policy/v1`) giới hạn số lượng Pod của ứng dụng được phép ngừng hoạt động cùng lúc do các gián đoạn tự nguyện (voluntary disruptions), chẳng hạn như khi quản trị viên chạy `kubectl drain` để nâng cấp hoặc bảo trì node. Khi chạy `kubectl drain`, Kubernetes Eviction API sẽ kiểm tra PDB và từ chối trục xuất (evict) Pod nếu việc đó vi phạm ngưỡng đã đặt.

Trong mỗi PDB, bạn chỉ được chọn **một trong hai** trường sau:
- `maxUnavailable`: Số lượng (hoặc phần trăm) Pod tối đa được phép không sẵn sàng cùng lúc (ví dụ `maxUnavailable: 1`).
- `minAvailable`: Số lượng (hoặc phần trăm) Pod tối thiểu phải luôn sẵn sàng.

</details>

### Câu Hỏi 9: `PodDisruptionBudget` (`PDB`) có ngăn được sự cố mất điện phần cứng hoặc lỗi kernel panic không? Điều gì xảy ra nếu cấu hình `maxUnavailable: 0`?

<details>
<summary>Đáp án</summary>

**Không.** PDB chỉ kiểm soát các gián đoạn tự nguyện (voluntary disruptions) thông qua Kubernetes Eviction API; PDB hoàn toàn không ngăn chặn được các gián đoạn ngoài ý muốn (involuntary disruptions) như sập nguồn phần cứng, hỏng đĩa hoặc lỗi kernel panic.

Nếu cấu hình `maxUnavailable: 0` trong PDB, mọi lệnh `kubectl drain` sẽ bị chặn vĩnh viễn vì không có Pod nào được phép vắng mặt khi bảo trì.

</details>

### Câu Hỏi 10: `podAntiAffinity` hoạt động như thế nào để bảo vệ cụm Kafka khi xảy ra sự cố cấp độ node hoặc Availability Zone (AZ)?

<details>
<summary>Đáp án</summary>

`podAntiAffinity` (`spec.affinity.podAntiAffinity`) hướng dẫn `kube-scheduler` không đặt Pod mới lên cùng miền topology với các Pod đang chạy khớp với `labelSelector`:
- Khi đặt `topologyKey: kubernetes.io/hostname`, các broker sẽ được tách ra các node vật lý khác nhau, tránh việc mất điện một node làm nhiều bản sao dữ liệu biến mất cùng lúc.
- Khi đặt `topologyKey: topology.kubernetes.io/zone`, các broker được phân tán sang các Availability Zone (AZ) khác nhau để cụm chịu lỗi được ở mức zone.

</details>

### Câu Hỏi 11: So sánh hai mức độ ràng buộc của `podAntiAffinity`: `requiredDuringSchedulingIgnoredDuringExecution` và `preferredDuringSchedulingIgnoredDuringExecution`. Khi nào nên cân nhắc dùng ràng buộc mềm?

<details>
<summary>Đáp án</summary>

- **`requiredDuringSchedulingIgnoredDuringExecution`** (ràng buộc cứng): Nếu không còn node nào trống broker khác, Pod mới sẽ giữ trạng thái `Pending` thay vì chạy chung node.
- **`preferredDuringSchedulingIgnoredDuringExecution`** (ràng buộc mềm, có `weight` từ `1` đến `100`): Scheduler ưu tiên tách các broker ra node riêng nhưng vẫn cho phép đặt chung node nếu thiếu node trống.

Nên cân nhắc dùng ràng buộc mềm (`preferredDuringSchedulingIgnoredDuringExecution`) trên cụm nhỏ có số node ít hơn số broker (ví dụ cụm chỉ có 2 node nhưng chạy 3 broker) để tránh Pod thứ 3 bị treo mãi ở trạng thái `Pending`.

</details>

### Câu Hỏi 12: Sau khi áp dụng manifest `StatefulSet` và `PDB`, bạn có thể kiểm tra phân bố node, lớp QoS, thông tin PVC và hạn mức gián đoạn của PDB bằng những lệnh `kubectl` nào?

<details>
<summary>Đáp án</summary>

Có thể sử dụng các lệnh sau:
1. **Kiểm tra phân bố node và QoS class của các broker Pod**:
   ```bash
   kubectl get pods -n kafka -l app=kafka -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,QOS:.status.qosClass,STATUS:.status.phase
   ```
   Kiểm tra để thấy mỗi Pod (`kafka-0`, `kafka-1`, `kafka-2`) chạy trên một node riêng và cột `QOS` là `Guaranteed`.
2. **Kiểm tra PVC**:
   ```bash
   kubectl get pvc -n kafka
   ```
   Kiểm tra `STATUS` là `Bound`, `ACCESS MODES` là `RWO` và đúng `STORAGECLASS` đã khai báo (ví dụ `fast-ssd`).
3. **Kiểm tra trạng thái PDB**:
   ```bash
   kubectl get pdb -n kafka
   ```
   Quan sát `MAX UNAVAILABLE` (hoặc `MIN AVAILABLE`) và giá trị `ALLOWED DISRUPTIONS` hiện tại.

</details>
