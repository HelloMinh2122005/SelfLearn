# Review: 8_4_1 Elasticsearch on Kubernetes

### Câu Hỏi 1: Vì sao Elasticsearch trên Kubernetes bắt buộc dùng `StatefulSet` thay vì `Deployment` xét về danh tính mạng và lưu trữ dữ liệu?

<details>
<summary>Đáp án</summary>

- `Deployment` tạo ra các Pod dùng một lần với tên ngẫu nhiên, không phù hợp với Elasticsearch vì các node cần phối hợp bầu master và lưu các shard dữ liệu trên ổ đĩa cục bộ.
- `StatefulSet` gán cho mỗi Pod một **tên cố định theo chỉ số thứ tự** (như `es-0`, `es-1`, `es-2`) kèm bản ghi DNS riêng thông qua **Headless Service** (Service không có ClusterIP riêng, trả thẳng IP của từng Pod).
- Nhờ `volumeClaimTemplates`, mỗi Pod vai trò `data` tự động sở hữu một `PersistentVolumeClaim` (`PVC`) riêng chứa các shard trên đĩa. Khi Pod bị xóa hoặc lập lịch lại sang worker node khác, Pod mới vẫn giữ nguyên danh tính và gắn lại đúng `PVC` cũ nên không bị mất dữ liệu.

</details>

### Câu Hỏi 2: Trong cụm Elasticsearch đa node, quorum của các `master-eligible` node có vai trò gì và chiến lược `RollingUpdate` mặc định của `StatefulSet` hoạt động như thế nào để bảo vệ cụm?

<details>
<summary>Đáp án</summary>

- Các node `master-eligible` (đủ điều kiện bầu master) duy trì **quorum** (số phiếu tối thiểu quá bán) để bầu ra **một master duy nhất** và tránh hiện tượng **"split-brain"** (hai nửa cụm tự bầu hai master riêng gây xung đột dữ liệu).
- Vì tắt đồng thời nhiều node dễ làm mất quorum hoặc mất bản sao shard, `StatefulSet` mặc định sử dụng chiến lược `RollingUpdate`: cập nhật **tuần tự ngược từ chỉ số cao nhất về `0`**, chờ Pod hiện tại đạt trạng thái `Ready` rồi mới chuyển sang Pod kế tiếp.

</details>

### Câu Hỏi 3: `podAntiAffinity` và `PodDisruptionBudget` (`PDB`) giúp bảo vệ cụm Elasticsearch trên Kubernetes khỏi những rủi ro gì?

<details>
<summary>Đáp án</summary>

- **`podAntiAffinity`** (với `topologyKey: kubernetes.io/hostname`): Yêu cầu scheduler đặt các Pod cùng cụm lên các worker node vật lý khác nhau. Nhờ đó tránh tình trạng nhiều Pod dồn vào một máy chủ và chết đồng loạt khi máy chủ đó gặp sự cố.
- **`PodDisruptionBudget` (`PDB`)**: Dùng `maxUnavailable` hoặc `minAvailable` để chặn lệnh `kubectl drain` trục xuất quá nhiều Pod cùng lúc khi bảo trì node, qua đó tránh làm cụm mất quorum.

</details>

### Câu Hỏi 4: Vì sao Elasticsearch yêu cầu tham số kernel `vm.max_map_count` tối thiểu `262144` và `nofile` tối thiểu `65535`? Có những cách nào để cấu hình `vm.max_map_count` trên Kubernetes?

<details>
<summary>Đáp án</summary>

- **Lý do yêu cầu**:
  - Công cụ Lucene bên dưới Elasticsearch dùng lệnh gọi `mmap` để ánh xạ tệp chỉ mục vào bộ nhớ ảo, nên Elastic yêu cầu tham số nhân Linux `vm.max_map_count` tối thiểu là `262144` trên môi trường production.
  - Lucene mở rất nhiều tệp segment đồng thời nên yêu cầu giới hạn file descriptor (`nofile`) đạt tối thiểu `65535`.
- **Hai cách cấu hình `vm.max_map_count`** (vì đây là tham số cấp kernel của worker node, không tự chỉnh được trong container thường):
  1. Cấu hình sẵn trên worker node ở tầng hệ điều hành.
  2. Dùng một `initContainer` đặc quyền (`privileged: true`) chạy lệnh `sysctl -w vm.max_map_count=262144` trước khi container chính khởi chạy.

</details>

### Câu Hỏi 5: Khi áp dụng Pod Security Standards mức `restricted` cho namespace, việc dùng `initContainer` đặc quyền để chỉnh `vm.max_map_count` gặp vấn đề gì và cách khắc phục ra sao?

<details>
<summary>Đáp án</summary>

- **Vấn đề**: Chuẩn bảo mật **Pod Security Standards** ở mức `restricted` của Kubernetes cấm container chạy với `privileged: true` và bắt buộc `allowPrivilegeEscalation: false`. Do đó, mọi `initContainer` đặc quyền chạy `sysctl -w vm.max_map_count=262144` sẽ bị API server từ chối và Pod không thể khởi tạo.
- **Cách khắc phục**: Cấu hình sẵn `vm.max_map_count` tối thiểu `262144` trên worker node ở tầng hệ điều hành (hoặc qua DaemonSet ở namespace có quyền), sau đó tắt `initContainer` đặc quyền trong cấu hình Pod.

</details>

### Câu Hỏi 6: Tổng `resources.limits.memory` của Pod Elasticsearch phải đủ chứa những thành phần bộ nhớ nào, và vì sao không được gán toàn bộ `limits.memory` cho JVM Heap?

<details>
<summary>Đáp án</summary>

- Tổng `resources.limits.memory` của Pod phải đủ chứa 3 thành phần:
  1. **JVM Heap**
  2. **Bộ nhớ off-heap** của JVM
  3. **OS page cache** của nhân Linux (dùng cho `mmap`)
- **Rủi ro khi gán 100% cho Heap**: Nếu đặt `-Xmx` bằng 100% giới hạn bộ nhớ Pod, bộ nhớ off-heap và OS page cache sẽ không còn chỗ; khi vượt trần cgroup này, Linux kernel sẽ chấm dứt container với trạng thái `OOMKilled` và mã thoát **exit code `137`**.
- **Nguyên tắc phân bổ**: Chỉ nên đặt JVM Heap tối đa khoảng **50% RAM khả dụng** của Pod và chừa phần còn lại cho off-heap và OS page cache.

</details>

### Câu Hỏi 7: ECK Operator (Elastic Cloud on Kubernetes) là gì và khi tạo một tài nguyên `Elasticsearch` (`elasticsearch.k8s.elastic.co/v1`), ECK tự động sinh ra những tài nguyên Kubernetes nào?

<details>
<summary>Đáp án</summary>

- **ECK Operator** là bộ điều khiển chính thức do Elastic cung cấp chạy ngay trên cụm Kubernetes, mở rộng Kubernetes API bằng các Custom Resource Definition (CRD) như `Elasticsearch` (`elasticsearch.k8s.elastic.co/v1`) và `Kibana` (`kibana.k8s.elastic.co/v1`).
- Từ đối tượng `Elasticsearch`, ECK Operator liên tục đối chiếu trạng thái (reconcile loop) và tự động tạo ra:
  - `StatefulSet` và các `Pod`
  - `PVC` (cho từng Pod dữ liệu)
  - `Service` (bao gồm cả **headless** Service và **HTTP** Service cổng `9200`)
  - `Secret` chứa chứng chỉ TLS và mật khẩu tài khoản mặc định `elastic`.

</details>

### Câu Hỏi 8: Trường `spec.nodeSets` trong CRD `Elasticsearch` dùng để làm gì và ECK thực hiện nâng cấp cụm như thế nào khi thay đổi `spec.version`?

<details>
<summary>Đáp án</summary>

- **`spec.nodeSets`**: Cho phép tách nhiều nhóm Pod với cấu hình tài nguyên, lưu trữ (`volumeClaimTemplates`) và vai trò (`node.roles` như `master`, `data`, `ingest`) riêng biệt trong cùng một cluster (ví dụ trong môi trường thật nên tách riêng `nodeSet` `master` với `count: 3` và `nodeSet` `data`).
- **Nâng cấp luân phiên an toàn**: Khi cập nhật `spec.version` hoặc cấu hình node, ECK tự động điều phối quá trình **rolling upgrade tuần tự từng Pod** và kiểm tra sức khỏe cluster giữa các bước để tránh gián đoạn hay mất shard.

</details>

### Câu Hỏi 9: Khi triển khai bằng ECK Operator, mật khẩu mặc định của tài khoản `elastic` được lưu ở đâu và làm thế nào để kiểm tra REST API qua HTTPS từ máy cá nhân?

<details>
<summary>Đáp án</summary>

- **Lấy mật khẩu**: ECK tự sinh `Secret` theo định dạng tên `<tên-cluster>-es-elastic-user` chứa mật khẩu ở khóa `elastic` (ví dụ cụm `quickstart` có Secret `quickstart-es-elastic-user`). Có thể giải mã bằng `kubectl get secret <tên-cluster>-es-elastic-user -o go-template='{{.data.elastic | base64decode}}'`.
- **Truy cập từ máy cá nhân**: Mở chuyển tiếp cổng tới HTTP Service (bật HTTPS mặc định) bằng `kubectl port-forward service/<tên-cluster>-es-http 9200:9200`, sau đó dùng `curl -k -u "elastic:${PASSWORD}" "https://localhost:9200/..."` để gọi API.

</details>

### Câu Hỏi 10: Khi một Pod Elasticsearch bị kẹt ở trạng thái `Pending`, những nguyên nhân phổ biến nào gây ra tình trạng này và cần dùng lệnh `kubectl` nào để kiểm tra?

<details>
<summary>Đáp án</summary>

- **Các nguyên nhân phổ biến**:
  - Worker node thiếu CPU/RAM theo `requests` của Pod.
  - Vướng quy tắc `podAntiAffinity` do không đủ worker node trống để phân bổ tách biệt.
  - `PVC` chưa đạt trạng thái `Bound` (do thiếu `StorageClass` hoặc không đủ dung lượng/PV).
- **Lệnh kiểm tra**: Dùng `kubectl describe pod <tên-pod>` (xem mục Events) và `kubectl get pvc` (hoặc `kubectl get pvc,pv`).

</details>

### Câu Hỏi 11: Hai nguyên nhân phổ biến nhất khiến Pod Elasticsearch rơi vào vòng lặp `CrashLoopBackOff` là gì và kiểm tra bằng lệnh nào?

<details>
<summary>Đáp án</summary>

- **Hai nguyên nhân phổ biến nhất**:
  1. **`OOMKilled` (exit code `137`)**: Tiến trình vượt quá `resources.limits.memory` của cgroup container do thiếu RAM cho JVM Heap + off-heap + OS page cache.
  2. **Lỗi bootstrap checks** khi chạy nhiều node: Chưa đáp ứng yêu cầu hệ thống như `vm.max_map_count` dưới `262144` hoặc `nofile` dưới `65535`.
- **Lệnh kiểm tra**: Dùng `kubectl describe pod <tên-pod>` (kiểm tra Exit Code `137`) và `kubectl logs <tên-pod> -c elasticsearch` (đọc nhật ký lỗi bootstrap check).

</details>

### Câu Hỏi 12: Khi Pod đã ở trạng thái `Running` nhưng cụm Elasticsearch vẫn hoạt động bất thường, cần kết hợp `kubectl` với những Elasticsearch REST API nào để chẩn đoán?

<details>
<summary>Đáp án</summary>

- Kết hợp kiểm tra hạ tầng qua `kubectl` (`get pods`, `describe`, `logs`, `get events`) với 2 REST API của Elasticsearch:
  1. **`GET /_cluster/health`**: Kiểm tra trạng thái màu cụm (`green` / `yellow` / `red`) và số lượng `unassigned_shards`.
  2. **`GET /_cluster/allocation/explain`**: Xem lý do chi tiết giải thích vì sao các shard chưa được phân bổ.

</details>

### Câu Hỏi 13: Vì sao cấu hình `persistentVolumeReclaimPolicy: Delete` lại nguy hiểm cho dữ liệu Elasticsearch, và tại sao chuyển sang `Retain` vẫn chưa đủ nếu thiếu Snapshot?

<details>
<summary>Đáp án</summary>

- **Rủi ro của `Delete`**: Khi `PersistentVolume` dùng `persistentVolumeReclaimPolicy: Delete`, việc xóa nhầm `PVC` (chẳng hạn xóa nhầm đối tượng `Elasticsearch` hoặc xóa nhầm namespace) sẽ kéo theo xóa luôn ổ đĩa vật lý chứa toàn bộ shard dữ liệu.
- **Vai trò của `Retain` và Snapshot**:
  - Đặt `Retain` giúp giữ lại ổ đĩa vật lý để cứu dữ liệu thủ công khi `PVC` bị xóa.
  - Tuy nhiên, vẫn **bắt buộc phải cấu hình Snapshot định kỳ** lên kho đối tượng ngoài cluster (như S3, GCS hoặc Azure Blob) qua **Snapshot Lifecycle Management (SLM)** để phục hồi khi xảy ra lỗi logic hoặc hỏng phần cứng.

</details>

### Câu Hỏi 14: Hãy so sánh 4 phương án triển khai Elasticsearch (Tự viết `StatefulSet`, Helm chart cộng đồng, ECK Operator, và Dịch vụ quản lý ngoài cluster) về vận hành Day-2 và trường hợp phù hợp.

<details>
<summary>Đáp án</summary>

| Phương án | Vận hành Day-2 | Phù hợp khi nào |
| :--- | :--- | :--- |
| **Tự viết `StatefulSet`** | Thủ công toàn bộ (chứng chỉ TLS, thứ tự nâng cấp). | Học tập cơ chế nền tảng. |
| **Helm chart cộng đồng** | Hạn chế, thiếu đối chiếu trạng thái liên tục. | Đã quen Helm và vận hành cụm đơn giản. |
| **ECK Operator** | Tự động hóa liên tục (TLS, `nodeSets`, rolling upgrade an toàn). | Muốn chạy ngay trên Kubernetes với độ tin cậy cao. |
| **Dịch vụ quản lý ngoài cluster** | Nhà cung cấp lo nâng cấp, vá lỗi, sao lưu; không phải vận hành Pod/PVC hay kernel node (nhưng chi phí cao hơn, ít tùy biến hạ tầng và traffic qua ranh giới mạng ngoài K8s). | Đội ngũ nhỏ, muốn giảm rủi ro vận hành stateful. |

</details>
