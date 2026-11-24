# Review: 7_3_1 Why StatefulSet

### Câu Hỏi 1: Sự khác biệt cốt lõi giữa ứng dụng web thông thường và Apache Kafka về mặt lưu trữ và danh tính trên Kubernetes là gì?

<details>
<summary>Đáp án</summary>

Với ứng dụng web thông thường, các Pod giống hệt nhau và có thể thay thế tự do vì dữ liệu được lưu ở cơ sở dữ liệu bên ngoài. Ngược lại, mỗi Kafka broker tự lưu các partition trực tiếp trên ổ đĩa của riêng nó và mang một danh tính gắn chặt với ổ đĩa đó.

</details>

### Câu Hỏi 2: Danh tính của một Kafka broker được lưu ở đâu trên ổ đĩa, và điều gì xảy ra nếu broker khởi động lại với tên mới hoặc gắn nhầm ổ đĩa?

<details>
<summary>Đáp án</summary>

Mỗi Kafka broker có một mã định danh duy nhất (`broker.id` ở chế độ ZooKeeper hoặc `node.id` ở chế độ KRaft), được ghi vào file `meta.properties` ngay trên ổ đĩa dữ liệu để khớp broker với các partition mà nó phụ trách. Nếu broker khởi động lại mà bị đổi tên hoặc gắn nhầm ổ đĩa khác, cụm Kafka sẽ xem đó là một máy mới hoặc từ chối ghép cụm. Vì vậy, Pod thay thế bắt buộc phải giữ lại tên cũ và gắn lại đúng ổ đĩa cũ chứa file định danh đó.

</details>

### Câu Hỏi 3: StatefulSet là gì trong Kubernetes và nó cung cấp ba cơ chế cốt lõi nào để bảo vệ danh tính Kafka broker?

<details>
<summary>Đáp án</summary>

StatefulSet là một workload API object trong Kubernetes dùng để quản lý các ứng dụng có trạng thái (stateful), đảm bảo tính duy nhất và thứ tự (ordering and uniqueness) cho tập hợp các Pod.

Ba cơ chế cốt lõi mà StatefulSet cung cấp gồm:
1. **Tên Pod cố định theo chỉ số thứ tự (Stable Pod Identity)**.
2. **DNS ổn định qua Headless Service (Stable Network Identity)**.
3. **Ổ đĩa riêng cho từng Pod (Stable Storage)**.

</details>

### Câu Hỏi 4: Quy tắc đặt tên Pod của StatefulSet hoạt động như thế nào và mang lại lợi ích gì cho Kafka?

<details>
<summary>Đáp án</summary>

Mỗi Pod trong StatefulSet nhận một chỉ số thứ tự nguyên (ordinal index) từ `0` đến `N-1`, và có tên cố định theo mẫu `<statefulset-name>-<ordinal>` (ví dụ: `kafka-0`, `kafka-1`, `kafka-2`). Nhờ tên Pod cố định, chỉ số thứ tự ở cuối tên (`0`, `1`, `2`) có thể ánh xạ trực tiếp sang định danh broker tương ứng, đồng thời Pod thay thế khi gặp sự cố vẫn giữ nguyên tên cũ.

</details>

### Câu Hỏi 5: Tại sao Kafka cần Headless Service thay vì Service thông thường, và bản ghi DNS của từng Pod trong StatefulSet có định dạng như thế nào?

<details>
<summary>Đáp án</summary>

Service thông thường chia tải ngẫu nhiên sang mọi Pod, trong khi Kafka cần kết nối đích danh tới từng broker đang giữ leader partition. Vì vậy, StatefulSet sử dụng **Headless Service** (Service cấu hình `clusterIP: None`) được khai báo qua trường `spec.serviceName`.

Mỗi Pod sẽ có một bản ghi DNS riêng ổn định theo định dạng:
`<pod-name>.<service-name>.<namespace>.svc.cluster.local` (ví dụ: `kafka-0.kafka-headless.default.svc.cluster.local`). Dù Pod chuyển sang node khác và đổi địa chỉ IP, Kubernetes DNS vẫn tự động cập nhật bản ghi trỏ về đúng Pod có tên cố định đó.

</details>

### Câu Hỏi 6: StatefulSet giải quyết bài toán cấp phát và gắn lại ổ đĩa riêng cho từng broker thông qua cơ chế nào?

<details>
<summary>Đáp án</summary>

StatefulSet sử dụng trường `spec.volumeClaimTemplates` để tự động tạo một PersistentVolumeClaim (PVC) riêng biệt cho từng Pod (ví dụ `data-kafka-0` gắn với `kafka-0`, `data-kafka-1` gắn với `kafka-1`). Khi một Pod bị xóa hoặc chuyển sang node khác, Pod thay thế giữ nguyên tên cũ và tự động gắn lại đúng PVC cũ tương ứng với chỉ số ordinal của nó, giúp dữ liệu không bị mất.

</details>

### Câu Hỏi 7: Nếu cố dùng `Deployment` để chạy cụm Kafka nhiều broker trên Kubernetes, hệ thống sẽ gặp những vấn đề gì?

<details>
<summary>Đáp án</summary>

Dùng `Deployment` sẽ gây ra ba vấn đề dây chuyền:
1. **Mất định danh mạng ổn định**: `Deployment` gắn hậu tố ngẫu nhiên vào tên Pod (ví dụ `kafka-7d9f4b8c6-x2p9q`) và cấp IP mới mỗi khi Pod tạo lại, không duy trì tên Pod hay DNS riêng cho từng broker.
2. **Không thể chia mỗi broker một PVC tự động**: `Deployment` không hỗ trợ `volumeClaimTemplates`, nên các Pod dùng chung cấu hình `volumes` của Pod template.
3. **Xung đột ổ đĩa hoặc mất dữ liệu cục bộ**: Nếu nhiều broker dùng chung một PVC `ReadWriteOnce` (RWO) trên các node khác nhau, chúng không thể cùng mount ổ đĩa đó ở chế độ đọc-ghi; còn nếu tạo PVC trống mới thì broker mất dữ liệu partition cục bộ và buộc cluster phải đồng bộ lại qua mạng hoặc mất tính khả dụng.

</details>

### Câu Hỏi 8: Chính sách tạo và xóa Pod mặc định (`OrderedReady`) của StatefulSet hoạt động ra sao và khác gì với tùy chọn `Parallel`?

<details>
<summary>Đáp án</summary>

- **`OrderedReady` (mặc định)**: Tạo Pod tuần tự từ `0` đến `N-1` (chờ mỗi Pod đạt trạng thái `Running` và `Ready` trước khi tạo Pod tiếp theo) và xóa theo thứ tự ngược lại từ `N-1` về `0`.
- **`Parallel`**: Cho phép StatefulSet tạo hoặc xóa toàn bộ các Pod cùng lúc mà không cần chờ Pod trước đạt trạng thái `Ready`, giúp tăng tốc khởi tạo khi các broker không phụ thuộc thứ tự boot.

*(Lưu ý: `podManagementPolicy: Parallel` chỉ áp dụng cho việc tạo mới hoặc xóa hàng loạt Pod, không làm `RollingUpdate` cập nhật song song).*

</details>

### Câu Hỏi 9: Các chiến lược cập nhật (`RollingUpdate`, `OnDelete`) và tham số `partition` trong StatefulSet hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **`RollingUpdate` (mặc định)**: Cập nhật lần lượt từng Pod theo thứ tự ordinal giảm dần (từ `N-1` về `0`), chỉ chuyển sang Pod tiếp theo khi Pod vừa cập nhật đã `Running` và `Ready`.
- **Tham số `spec.updateStrategy.rollingUpdate.partition` (mặc định là `0`)**: Giới hạn cập nhật chỉ áp dụng cho các Pod có ordinal lớn hơn hoặc bằng giá trị `partition`. Nhờ đó, bạn có thể thử nghiệm cấu hình mới theo kiểu canary trên một vài broker trước (ví dụ cụm 3 broker đặt `partition: 2` để cập nhật thử `kafka-2` trước, giữ nguyên `kafka-0` và `kafka-1`).
- **`OnDelete`**: Giữ nguyên các Pod đang chạy khi StatefulSet template thay đổi; Pod chỉ nhận phiên bản mới khi bạn xóa thủ công từng Pod đó.

</details>

### Câu Hỏi 10: Hành vi mặc định của Kubernetes với PVC khi xóa hoặc thu nhỏ (scale down) StatefulSet là gì, và có thể gặp cạm bẫy vận hành nào?

<details>
<summary>Đáp án</summary>

Theo mặc định, khi xóa StatefulSet hoặc thu nhỏ `replicas`, Kubernetes **không tự động xóa các PVC** đã tạo từ `volumeClaimTemplates` nhằm tránh mất dữ liệu ngoài ý muốn. Hành vi này có thể điều chỉnh qua trường `spec.persistentVolumeClaimRetentionPolicy` với hai tùy chọn `whenDeleted` và `whenScaled` (mặc định là `Retain`, có thể đặt thành `Delete`).

**Cạm bẫy vận hành**: Nếu bạn xóa StatefulSet mà không dọn PVC thủ công, ổ đĩa vẫn tiếp tục tính phí lưu trữ và một StatefulSet tạo lại cùng tên sau này sẽ gắn nhầm vào dữ liệu cũ. Trên production, nên giữ hành vi `Retain` mặc định để an toàn và chỉ xóa PVC thủ công sau khi đã xác nhận ngừng dùng hẳn cụm.

</details>

### Câu Hỏi 11: Khi viết YAML manifest kết hợp Headless Service và StatefulSet, những cặp trường nào bắt buộc phải khớp tên với nhau?

<details>
<summary>Đáp án</summary>

1. Trường `spec.serviceName` của StatefulSet phải khớp với `metadata.name` của Headless Service.
2. Trường `volumeMounts[].name` trong container phải khớp với `metadata.name` của phần tử tương ứng trong `volumeClaimTemplates`.

</details>

### Câu Hỏi 12: Khi xóa một Pod của StatefulSet bằng lệnh `kubectl delete pod kafka-1`, điều gì xảy ra với Pod mới và PVC tương ứng?

<details>
<summary>Đáp án</summary>

StatefulSet controller sẽ tự động tạo lại Pod mới mang đúng tên `kafka-1` và gắn lại đúng PVC `data-kafka-1` trước đó. Khi kiểm tra bằng `kubectl get pods,pvc`, bạn sẽ thấy Pod `kafka-1` có tuổi (`AGE`) mới chỉ vài giây, nhưng PVC `data-kafka-1` vẫn giữ nguyên tuổi cũ và trỏ đến cùng volume cũ, chứng tỏ ổ đĩa dữ liệu không bị thay thế.

</details>

### Câu Hỏi 13: Ngoài vai trò của StatefulSet, vì sao khi vận hành Kafka ở quy mô lớn trên production người ta thường dùng thêm Operator (như Strimzi Operator)?

<details>
<summary>Đáp án</summary>

StatefulSet chỉ xử lý phần danh tính ổn định và ổ đĩa riêng cho từng broker. Ở quy mô lớn, các tác vụ chuyên sâu hơn cho Kafka như cấu hình mạng listener, quản lý chứng chỉ hay điều phối nâng cấp an toàn thường được tự động hóa thông qua Operator như Strimzi Operator.

</details>
