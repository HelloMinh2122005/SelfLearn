# Review: 7_3_5 Operations on Kubernetes

### Câu Hỏi 1: Điểm khác biệt cốt lõi khi vận hành Kafka broker trên Kubernetes so với các ứng dụng stateless là gì?

<details>
<summary>Đáp án</summary>

Khác với các ứng dụng stateless có thể tắt mở tự do, mỗi Kafka broker gắn chặt với dữ liệu trên ổ đĩa bền vững và cùng chia sẻ trách nhiệm sao lưu dữ liệu với các broker khác. Nếu khởi động lại nhiều broker cùng lúc, cấp thiếu RAM cho hệ điều hành, hoặc thêm broker mới rồi kỳ vọng tải tự chia đều, hệ thống có thể từ chối ghi dữ liệu hoặc bị lệch tải nghiêm trọng.
</details>

### Câu Hỏi 2: In-Sync Replicas (ISR) là gì và tại sao quá trình nâng cấp các Kafka broker phải thực hiện tuần tự từng node một?

<details>
<summary>Đáp án</summary>

**In-Sync Replicas (ISR)** là danh sách các bản sao (replica) của một partition đang bắt kịp dữ liệu mới nhất từ leader. Trong quá trình nâng cấp hoặc khởi động lại cụm Kafka, các broker phải được dừng và nâng cấp tuần tự từng node một thay vì dừng đồng thời nhiều broker cùng lúc để tránh làm số lượng replica đồng bộ giảm xuống dưới mức tối thiểu, gây từ chối ghi dữ liệu từ producer.
</details>

### Câu Hỏi 3: Trước khi tắt một broker để nâng cấp, quản trị viên cần đảm bảo điều kiện gì và dùng lệnh nào để kiểm tra?

<details>
<summary>Đáp án</summary>

Trước khi tắt một broker, quản trị viên cần đảm bảo không còn partition nào ở trạng thái under-replicated, tức là mọi bản sao đều đã nằm trong tập ISR.

Có thể kiểm tra bằng lệnh `kafka-topics.sh` với cờ `--under-replicated-partitions`:
```bash
kubectl exec -n kafka orders-cluster-kafka-0 -- \
  bin/kafka-topics.sh \
  --bootstrap-server orders-cluster-kafka-bootstrap:9092 \
  --describe \
  --under-replicated-partitions
```
Kết quả an toàn để tiến hành nâng cấp broker tiếp theo là **không có dòng nào được in ra** (nghĩa là mọi partition đều đã đồng bộ đủ ISR).
</details>

### Câu Hỏi 4: Với một topic có `replication.factor=3` và `min.insync.replicas=2`, chuyện gì sẽ xảy ra với các producer cấu hình `acks=all` nếu có 2 broker bị tắt cùng lúc?

<details>
<summary>Đáp án</summary>

Việc mất cùng lúc 2 trên 3 broker sẽ khiến số replica đồng bộ của mỗi partition giảm xuống còn tối đa 1, thấp hơn mức `min.insync.replicas=2` bắt buộc. Khi đó, các producer cấu hình `acks=all` sẽ bị từ chối ghi dữ liệu mới và nhận lỗi do thiếu replica đồng bộ.
</details>

### Câu Hỏi 5: Cơ chế tắt có kiểm soát (`controlled.shutdown.enable=true`) hoạt động như thế nào và Strimzi Cluster Operator hỗ trợ rolling update ra sao?

<details>
<summary>Đáp án</summary>

* Khi `controlled.shutdown.enable=true` (được bật mặc định trong Kafka), broker sẽ chủ động thông báo trước khi tắt để chuyển giao quyền leader của các partition nằm trên nó sang một follower đang nằm trong ISR, giúp giảm thiểu gián đoạn cho ứng dụng client. Sau khi khởi động lại, broker sẽ đồng bộ bù phần dữ liệu còn thiếu.
* Khi sử dụng Strimzi Operator trên Kubernetes, Cluster Operator tự động điều phối quá trình rolling update tuần tự từng Pod broker và kiểm tra trạng thái sẵn sàng của broker trước khi tiến hành khởi động lại Pod kế tiếp.
</details>

### Câu Hỏi 6: Những nguyên nhân chính nào khiến một Pod broker rơi vào trạng thái `Pending` và làm thế nào để chẩn đoán?

<details>
<summary>Đáp án</summary>

Pod broker ở trạng thái `Pending` khi Kubernetes scheduler chưa thể xếp Pod lên bất kỳ Node nào vì hai nguyên nhân chính:
1. Cụm không đủ tài nguyên đáp ứng `resources.requests` (CPU/RAM).
2. PersistentVolumeClaim (PVC) chưa chuyển sang trạng thái `Bound`.

Cách chẩn đoán:
* Chạy `kubectl describe pod <pod-name> -n <namespace>` và đọc mục `Events` ở cuối kết quả để xem thông báo như `Insufficient cpu`, `Insufficient memory` hoặc lỗi gắn volume.
* Nếu sự cố xuất phát từ ổ đĩa (PVC chưa `Bound`), chạy `kubectl describe pvc <pvc-name> -n <namespace>` để kiểm tra xem `StorageClass` có tồn tại hay provisioner có tạo được PersistentVolume tương ứng hay không.
</details>

### Câu Hỏi 7: Trạng thái `CrashLoopBackOff` có ý nghĩa gì và dùng lệnh nào để xem nhật ký lỗi của lần chạy vừa bị sập trước đó?

<details>
<summary>Đáp án</summary>

`CrashLoopBackOff` xảy ra khi container bên trong Pod khởi chạy rồi thoát với mã lỗi, khiến kubelet liên tục khởi động lại container theo chu kỳ thời gian chờ tăng dần theo cấp số nhân (exponential backoff).

Để đọc nhật ký lỗi của lần chạy vừa bị sập ngay trước đó, quản trị viên sử dụng lệnh `kubectl logs` kèm cờ `--previous`:
```bash
kubectl logs <pod-name> -n <namespace> --previous
```
*(Có thể thêm `-c <container-name>`, ví dụ `-c kafka`, nếu Pod có nhiều container).*
</details>

### Câu Hỏi 8: Lỗi `OOMKilled` (`Exit Code: 137`) xảy ra khi nào và tại sao việc đặt `resources.limits.memory` quá sát với JVM Heap (`-Xmx`) trên Kafka lại dễ dẫn đến lỗi này?

<details>
<summary>Đáp án</summary>

Khi container tiêu thụ bộ nhớ vượt quá giới hạn khai báo trong `resources.limits.memory`, nhân Linux sẽ chấm dứt tiến trình và `kubectl describe pod` ghi nhận lý do `OOMKilled` với mã thoát `137`.

Đối với Kafka, tiến trình chỉ dùng một phần bộ nhớ cho JVM Heap và phụ thuộc lớn vào **Page Cache** của hệ điều hành để đệm đọc/ghi đĩa. Nếu đặt `limits.memory` quá sát (hoặc bằng đúng) kích thước JVM Heap (`-Xmx`), hệ điều hành không còn đủ khoảng trống RAM cho Page Cache và bộ nhớ ngoài heap, dẫn đến tình trạng `OOMKilled` khi lưu lượng tăng cao.
</details>

### Câu Hỏi 9: Khi mở rộng cụm Kafka đang hoạt động (scale out) bằng cách thêm broker mới, các partition cũ và topic mới được phân bổ như thế nào?

<details>
<summary>Đáp án</summary>

Khi tăng thêm số lượng broker cho cụm Kafka đang chạy, Kafka **không tự động di chuyển hay cân bằng lại** các partition đã được tạo trước đó sang các broker mới. Các broker mới thêm vào chỉ tự động nhận các partition của những topic được tạo mới sau thời điểm mở rộng cụm.
</details>

### Câu Hỏi 10: Để phân phối lại dữ liệu của các topic hiện có sang broker mới sau khi mở rộng cụm, quản trị viên dùng công cụ gì và trải qua các bước nào?

<details>
<summary>Đáp án</summary>

Quản trị viên dùng công cụ `kafka-reassign-partitions.sh` kèm tệp JSON kế hoạch phân bổ qua 3 bước chính:
1. `--generate`: Sinh kế hoạch phân bổ partition mới dựa trên danh sách topic và danh sách broker mới.
2. `--execute`: Thực thi di chuyển dữ liệu partition theo tệp kế hoạch JSON.
3. `--verify`: Kiểm tra trạng thái tiến độ và xác nhận hoàn tất quá trình tái phân bổ.

*(Phương án tự động trên Kubernetes)*: Khi dùng Strimzi, có thể tích hợp Cruise Control để tự động tính toán đề xuất phân bổ lại và thực thi cân bằng partition thông qua tài nguyên `KafkaRebalance`.
</details>

### Câu Hỏi 11: Tại sao cần cấu hình giới hạn băng thông (`--throttle`) khi tái phân bổ partition, và việc gỡ giới hạn này diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

Quá trình di chuyển dữ liệu partition tạo ra lưu lượng sao chép rất lớn qua mạng và ổ đĩa giữa các broker. Nếu thực thi `kafka-reassign-partitions.sh --execute` không có `--throttle` (unthrottled reassignment), lưu lượng sao chép có thể bão hòa băng thông mạng và IOPS đĩa, làm nghẽn producer và consumer đang hoạt động.

Sau khi quá trình di chuyển hoàn tất, khi chạy lệnh kiểm tra với cờ `--verify`, công cụ sẽ tự động gỡ bỏ giới hạn băng thông trên các broker (`Clearing broker-level throttles`).
</details>

### Câu Hỏi 12: Nguyên tắc phân quyền tối thiểu (Least Privilege) được áp dụng như thế nào khi kiểm tra nhật ký và trạng thái Pod Kafka trên Kubernetes?

<details>
<summary>Đáp án</summary>

Khi kiểm tra nhật ký (`kubectl logs`) hay mô tả trạng thái Pod/PVC (`kubectl describe`), quản trị viên chỉ nên cấp quyền đọc giới hạn trong namespace riêng của cụm Kafka thay vì dùng tài khoản quản trị toàn cụm, nhằm tránh rủi ro thao tác xóa nhầm ổ đĩa hoặc tài nguyên đang chạy.
</details>
