# Ôn Tập: 6_4_7 StatefulSets and Stateful Workloads

### Câu Hỏi 1: Sự khác biệt cốt lõi giữa Deployment và StatefulSet là gì, và "ổn định" (stable) trong StatefulSet có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **Deployment** coi các Pod là vô danh và có thể hoán đổi cho nhau: tên Pod có hậu tố băm ngẫu nhiên, IP thay đổi, và mọi replica dùng chung một template (kể cả volume).
- **StatefulSet** dành cho các ứng dụng cần: định danh mạng ổn định và duy nhất cho từng thành viên, lưu trữ bền riêng biệt cho từng thành viên, triển khai/scale theo thứ tự, và cập nhật cuốn chiếu theo thứ tự.
- Theo tài liệu StatefulSet, **"ổn định"** nghĩa là *bền qua các lần Pod bị lên lịch lại (reschedule)*. Nếu ứng dụng không cần các bảo đảm này, bạn nên dùng Deployment hoặc ReplicaSet.
</details>

### Câu Hỏi 2: Khi một Pod trong StatefulSet (ví dụ `web-1`) bị xóa và được tạo lại, những gì được giữ nguyên và những gì thay đổi?

<details>
<summary>Đáp án</summary>

- **Giữ nguyên**:
  - Tên Pod (`web-1`).
  - Tên DNS (`web-1.web.<namespace>.svc...`).
  - PVC tương ứng (`data-web-1`) và toàn bộ dữ liệu bên trong; Pod mới mount lại đúng ổ của mình.
- **Thay đổi**:
  - Địa chỉ **IP** của Pod.
  - **`uid`** của Pod.

Vì IP vẫn thay đổi khi Pod bị tạo lại, ứng dụng phải giao tiếp bằng **tên DNS** thay vì hardcode IP.
</details>

### Câu Hỏi 3: StatefulSet đặt tên Pod theo quy tắc nào và tự động gắn các label gì lên Pod?

<details>
<summary>Đáp án</summary>

- **Quy tắc đặt tên Pod**: `<statefulset>-<ordinal>`. Với `N` replica, chỉ số `ordinal` mặc định chạy từ `0` đến `N-1` (có thể thay đổi điểm bắt đầu bằng trường `spec.ordinals.start`, stable từ Kubernetes v1.31).
- **Các label được gắn lên Pod**:
  - `statefulset.kubernetes.io/pod-name`: dùng để trỏ Service tới đúng một Pod cụ thể.
  - `apps.kubernetes.io/pod-index`: lưu chỉ số ordinal của Pod (stable từ Kubernetes v1.32).
</details>

### Câu Hỏi 4: Headless Service đóng vai trò gì trong StatefulSet? Tên DNS của từng Pod có định dạng ra sao, và chuyện gì xảy ra nếu quên tạo hoặc cấu hình sai Headless Service?

<details>
<summary>Đáp án</summary>

- **Vai trò**: StatefulSet **bắt buộc** phải có một Headless Service (`clusterIP: None`) khớp với trường `spec.serviceName`, và **bạn phải tự tạo** Service này (không tự sinh ra). Headless Service giúp DNS trả về IP của từng Pod riêng lẻ thay vì một IP cân bằng tải chung.
- **Định dạng DNS của từng Pod**: `<pod>.<service>.<namespace>.svc.<cluster-domain>` (ví dụ `web-0.web.default.svc.cluster.local`). Trong khi đó, `nslookup` tên Service headless (`web.default.svc.cluster.local`) sẽ trả về danh sách IP của tất cả các Pod.
- **Khi quên tạo hoặc cấu hình sai `serviceName` / `selector`**: Các Pod vẫn chạy nhưng không phân giải được tên miền `<pod>.<service>...`. Cần kiểm tra lại bằng `kubectl get svc` và `kubectl get endpointslices`.
</details>

### Câu Hỏi 5: `volumeClaimTemplates` hoạt động như thế nào và quy tắc đặt tên PVC được tạo ra là gì?

<details>
<summary>Đáp án</summary>

- Với mỗi entry khai báo trong `volumeClaimTemplates`, StatefulSet sẽ tạo ra **một PersistentVolumeClaim (PVC) riêng cho mỗi Pod** (thay vì dùng chung một volume).
- **Quy tắc đặt tên PVC**: `<template>-<statefulset>-<ordinal>` (ví dụ template tên `data`, StatefulSet tên `web` thì PVC là `data-web-0`, `data-web-1`, `data-web-2`...).
- Khi Pod bị xóa hoặc lên lịch lại trên node khác, Pod mới sẽ mount lại đúng PVC gắn với ordinal của mình. Lưu ý rằng việc cấp phát PV thực tế vẫn phải do PV provisioner theo `StorageClass` hoặc admin cấp sẵn đảm nhiệm.
</details>

### Câu Hỏi 6: Trường `podManagementPolicy` với giá trị mặc định `OrderedReady` hoạt động ra sao và khác gì với `Parallel`?

<details>
<summary>Đáp án</summary>

- **`OrderedReady` (mặc định)**:
  - Khi **tạo / scale up**: tạo tuần tự từ `0 → N-1`. Pod `k` chỉ được tạo sau khi mọi Pod trước nó đã ở trạng thái `Running` và `Ready` (nếu có đặt `minReadySeconds` thì phải đạt trạng thái *available*).
  - Khi **thu hồi / scale down**: xóa theo thứ tự ngược `N-1 → 0`. Một Pod chỉ bị xóa khi các Pod có ordinal lớn hơn nó đã tắt hoàn toàn.
- **`Parallel`**:
  - Tạo hoặc xóa **tất cả Pod cùng lúc**, không chờ Pod trước đạt trạng thái Ready hay tắt xong, nhưng vẫn giữ nguyên danh tính (tên, DNS, PVC ổn định).
  - Khi kết hợp `Parallel` với `RollingUpdate` và `maxUnavailable > 1`, controller có thể cập nhật nhiều Pod cùng lúc ("bursting") và các Pod có thể Ready không theo thứ tự.
</details>

### Câu Hỏi 7: StatefulSet hỗ trợ các chiến lược cập nhật (`spec.updateStrategy.type`) nào và cách hoạt động của từng loại?

<details>
<summary>Đáp án</summary>

Có 3 chiến lược trong `spec.updateStrategy.type`:
1. **`RollingUpdate` (mặc định)**: Tự động xóa và tạo lại từng Pod theo thứ tự **từ ordinal lớn xuống nhỏ**. Mỗi lần xử lý một Pod (mặc định `rollingUpdate.maxUnavailable` là `1`, không được đặt `0`; trường `maxUnavailable` là Beta từ v1.37 và bật mặc định), chờ Pod mới đạt `Running` + `Ready` (và `minReadySeconds` nếu có) rồi mới chuyển sang Pod có ordinal nhỏ hơn tiếp theo.
2. **`OnDelete`**: Controller **không tự động cập nhật** các Pod đang chạy khi template thay đổi. Chỉ khi bạn xóa thủ công một Pod, controller mới tạo lại Pod đó theo template mới.
3. **`Recreate`** *(Alpha từ v1.37, tắt mặc định qua feature gate `StatefulSetRecreateStrategy`)*: Xóa **tất cả** Pod hiện có rồi mới tạo lại theo template mới; chiến lược này gây downtime.
</details>

### Câu Hỏi 8: Tham số `rollingUpdate.partition` dùng để làm gì và hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế**: Khi đổi Pod template, chỉ những Pod có **ordinal ≥ `partition`** mới được cập nhật lên phiên bản mới. Các Pod có **ordinal < `partition`** sẽ giữ nguyên phiên bản cũ, kể cả khi bị xóa đi và tạo lại thì vẫn dùng phiên bản cũ.
- **Mục đích**: Dùng cho **staged rollout / canary / phased rollout**. Ví dụ với 3 replica (`0, 1, 2`), đặt `partition: 2` sẽ chỉ cập nhật `web-2` sang revision mới (`status.updateRevision` khác `status.currentRevision`). Sau khi kiểm tra thấy `web-2` ổn định, bạn hạ `partition` xuống (ví dụ về `0`) để cập nhật tiếp các Pod còn lại từ ordinal lớn xuống nhỏ.
</details>

### Câu Hỏi 9: Khi một bản `RollingUpdate` bị lỗi khiến Pod mới không bao giờ đạt trạng thái `Ready` (với `OrderedReady`), vì sao StatefulSet bị kẹt và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân bị kẹt**: Với `OrderedReady` + `RollingUpdate`, controller dừng lại chờ Pod vừa cập nhật đạt `Ready` trước khi đi tiếp. Vì Pod lỗi không thể `Ready`, quá trình rollout bị đứng mãi.
- **Cách khắc phục (Forced rollback)**: Chỉ sửa lại (revert) Pod template về cấu hình đúng là **chưa đủ** vì controller vẫn đang kẹt chờ Pod hỏng trước đó. Bạn phải **revert template về phiên bản đúng VÀ xóa thủ công các Pod đang chạy cấu hình hỏng**, khi đó controller mới tạo lại chúng bằng template đúng. Ngoài ra, nên dùng `partition`/canary và cấu hình probe chuẩn để phát hiện lỗi sớm trên Pod ordinal cao.
</details>

### Câu Hỏi 10: Theo mặc định, điều gì xảy ra với PVC khi bạn xóa Pod, scale down StatefulSet, hoặc xóa hẳn StatefulSet? Việc này có thể gây ra "bẫy" thực tế nào?

<details>
<summary>Đáp án</summary>

- **Hành vi mặc định**: Trong cả ba trường hợp (**xóa Pod**, **scale down**, hay **xóa hẳn StatefulSet**), các **PVC đều KHÔNG bị xóa** (Kubernetes ưu tiên an toàn dữ liệu hơn việc dọn dẹp tự động). Khi scale up trở lại hoặc tạo lại StatefulSet cùng tên, các Pod sẽ mount lại đúng các PVC cũ.
- **Cạm bẫy thực tế**: Nếu bạn xóa StatefulSet để "làm lại từ đầu" nhưng quên xóa PVC, rồi tạo lại StatefulSet cùng tên, các Pod mới sẽ **mount lại PVC cũ và "hồi sinh" dữ liệu đã lỗi thời** mà bạn tưởng đã xóa. Muốn bắt đầu sạch, cần kiểm tra kỹ và xóa thủ công các PVC đó hoặc cấu hình chính sách retention phù hợp sau khi đã tính đến backup.
</details>

### Câu Hỏi 11: Làm thế nào để tự động xóa PVC khi scale down hoặc xóa StatefulSet, và cần thận trọng điều gì khi sử dụng?

<details>
<summary>Đáp án</summary>

- Dùng trường `spec.persistentVolumeClaimRetentionPolicy` (stable từ Kubernetes v1.32) với hai thuộc tính:
  - `whenDeleted`: `Retain` (mặc định) hoặc `Delete` — áp dụng khi **StatefulSet bị xóa** (xóa toàn bộ PVC của StatefulSet đó).
  - `whenScaled`: `Retain` (mặc định) hoặc `Delete` — áp dụng khi **scale down** (chỉ xóa PVC của các Pod bị thu hồi).
- **Cảnh báo**: Giá trị `Delete` sẽ **xóa dữ liệu thật trên volume**. Chỉ nên dùng trong môi trường lab hoặc trong production khi bạn đã có cơ chế backup/restore rõ ràng và hiểu rõ hậu quả mất dữ liệu.
</details>

### Câu Hỏi 12: Khi cần xóa một StatefulSet, vì sao nên scale về 0 trước? Và tại sao không nên đặt `terminationGracePeriodSeconds: 0`?

<details>
<summary>Đáp án</summary>

- **Thứ tự tắt khi xóa StatefulSet**: Khi chạy lệnh xóa StatefulSet trực tiếp, Kubernetes **không có bảo đảm** về thứ tự tắt Pod. Nếu muốn các Pod tắt êm và đúng thứ tự ngược (`N-1 → 0`), bạn nên **scale StatefulSet về `0` replica trước**, chờ tất cả Pod tắt hoàn toàn rồi mới xóa StatefulSet.
- **Về `terminationGracePeriodSeconds`**: Không nên đặt giá trị `0` trong thực tế vì việc force-delete/tắt ngay lập tức không an toàn cho các workload có trạng thái (dễ gây hỏng dữ liệu hoặc chưa kịp ngắt kết nối/flush đĩa; chỉ dùng grace period ngắn trong lab nếu ứng dụng như `sleep` làm PID 1 bỏ qua `SIGTERM`).
</details>

### Câu Hỏi 13: Vì sao các hệ thống phân tán như Kafka, ZooKeeper, Cassandra hay Elasticsearch cần StatefulSet mà không thể chạy tốt bằng Deployment?

<details>
<summary>Đáp án</summary>

Trong các hệ thống phân tán lưu trạng thái, mỗi node là một thực thể riêng biệt chứ không giống nhau hoàn toàn:
1. **ID thành viên cố định gắn với dữ liệu trên đĩa** (ví dụ `node.id` của Kafka, `myid` của ZooKeeper): Deployment tạo tên Pod ngẫu nhiên nên sau khi restart node không biết "mình là ai". StatefulSet cung cấp `ordinal` ổn định để ánh xạ trực tiếp thành ID.
2. **Địa chỉ mạng riêng từng thành viên** (cho peer discovery, bầu chọn quorum, `advertised.listeners` của Kafka): Service ClusterIP thông thường chỉ cân bằng tải ẩn danh khiến client/node không chọn được đúng broker hay leader. Headless Service + DNS `<pod>.<service>...` giải quyết việc tìm đúng từng thành viên.
3. **Dữ liệu riêng từng thành viên, không chia sẻ**: `volumeClaimTemplates` cấp một PVC riêng cho mỗi Pod và gắn lại đúng ổ đó khi reschedule.
4. **Khởi động và nâng cấp tuần tự, chờ node trước khỏe**: `OrderedReady`, `RollingUpdate` theo ordinal và `partition` giúp bảo vệ tính ổn định của cụm khi nâng cấp.
</details>

### Câu Hỏi 14: StatefulSet có tự lo backup, replication hay bảo vệ cụm khi drain node không? Cần làm gì thêm ở môi trường production?

<details>
<summary>Đáp án</summary>

- **Không**. StatefulSet chỉ cung cấp **danh tính ổn định + ổ đĩa ổn định** (điều kiện cần). Việc sao chép dữ liệu (replication), bầu chọn leader, cấu hình quorum, `min.insync.replicas`, tái cân bằng và backup/restore đều là trách nhiệm của **ứng dụng hoặc Operator** và người vận hành.
- **Rủi ro về `ReadWriteOnce` (RWO), Topology và Drain Node**:
  - PV dạng `ReadWriteOnce` chỉ gắn vào một node; ràng buộc topology/`nodeAffinity` có thể khiến Pod bị kẹt ở trạng thái `Pending` nếu node/zone đó hết tài nguyên hoặc đạt giới hạn số disk (như Azure Disk).
  - Khi drain node, nếu quá nhiều thành viên bị tắt cùng lúc, cụm có thể mất quorum.
- **Thực tiễn khuyến nghị**: Dùng `volumeBindingMode: WaitForFirstConsumer`, trải đều Pod qua các zone/node bằng topology spread / anti-affinity, đảm bảo đủ dung lượng ở mỗi zone, dùng **PodDisruptionBudget (PDB)** để bảo vệ quorum khi gián đoạn tự nguyện, và diễn tập kế hoạch backup/restore.
</details>

### Câu Hỏi 15: Từ Apache Kafka 4.0 trở lên, vai trò của ZooKeeper thay đổi như thế nào khi triển khai trên Kubernetes?

<details>
<summary>Đáp án</summary>

- Theo công bố chính thức của Apache Kafka (18-03-2025), **Kafka 4.0** là phiên bản đầu tiên chạy **hoàn toàn không cần ZooKeeper**, mặc định chạy ở chế độ **KRaft**.
- Do đó, khi triển khai Kafka 4.x mới, bạn **không cần triển khai cụm ZooKeeper** đi kèm nữa mà dựng cụm KRaft (với các node đóng vai trò controller/broker). ZooKeeper chỉ còn gặp ở các phiên bản Kafka cũ (trước 4.0) hoặc ở các hệ thống khác dùng nó để điều phối.
</details>

### Câu Hỏi 16: Trong thực tế vận hành Kafka (hoặc Cassandra, Elasticsearch), vì sao thường dùng Operator (như Strimzi) thay vì tự viết StatefulSet thuần? Strimzi quản lý Pod Kafka bên dưới bằng tài nguyên gì?

<details>
<summary>Đáp án</summary>

- **Vì sao dùng Operator**: Theo tài liệu Strimzi (1.3.1), việc triển khai Kafka trực tiếp bằng `StatefulSet` và `Service` rất dễ xảy ra lỗi cấu hình và tốn thời gian (*error-prone and time-consuming*). Khi dùng Operator như Strimzi, bạn chỉ cần khai báo các custom resource mức cao (như `Kafka`, `KafkaNodePool`), còn Operator sẽ tự động lo triển khai, cấu hình cụm, nâng cấp, cũng như quản lý topic và user.
- **Cơ chế bên dưới của Strimzi**: Strimzi quản lý các Pod Kafka thông qua custom resource riêng của nó là **`StrimziPodSet`** (viết tắt `sps`), **không** dùng tài nguyên `StatefulSet` chuẩn của Kubernetes. Các tính chất danh tính và ổ đĩa ổn định vẫn được giữ nguyên, và tài liệu Strimzi nhấn mạnh **tuyệt đối không được tạo, sửa hay xóa `StrimziPodSet` thủ công**.
- Ngoài ra, ở các tổ chức lớn, nhiều đội ngũ chọn sử dụng dịch vụ quản lý (managed services trên Azure/AWS) thay vì tự vận hành database/queue trong Kubernetes để tối ưu chi phí vận hành.
</details>
