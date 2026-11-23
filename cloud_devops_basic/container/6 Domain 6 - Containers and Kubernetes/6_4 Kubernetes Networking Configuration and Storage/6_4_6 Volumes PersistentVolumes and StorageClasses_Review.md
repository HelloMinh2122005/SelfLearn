# Ôn Tập: 6_4_6 Volumes PersistentVolumes and StorageClasses

### Câu Hỏi 1: Kubernetes phân chia vòng đời dữ liệu thành hai cấp độ nào, và dữ liệu trong `emptyDir` có bị mất khi container gặp sự cố không?

<details>
<summary>Đáp án</summary>

Kubernetes tách hai nhu cầu lưu trữ dựa trên vòng đời:
- **Volume gắn trong Pod spec** (`emptyDir`, `configMap`, `secret`, `projected`, `downwardAPI`...): vòng đời gắn chặt với **Pod**, dùng cho thư mục tạm, chia sẻ dữ liệu giữa các container trong cùng Pod hoặc nạp cấu hình.
- **PersistentVolume (PV) / PersistentVolumeClaim (PVC)**: vòng đời **độc lập với Pod**, dùng cho dữ liệu cần tồn tại lâu hơn Pod (như database, Kafka, tệp người dùng).

Với `emptyDir`, thư mục rỗng được tạo khi Pod được gán vào node và dùng chung giữa các container trong Pod. Nếu container bị crash và được restart **trong cùng Pod**, dữ liệu trong `emptyDir` **vẫn còn**. Dữ liệu chỉ mất khi **Pod** bị xóa hoặc tạo lại.
</details>

### Câu Hỏi 2: Nêu đặc điểm và mục đích sử dụng của `emptyDir` (với `medium: Memory` và `sizeLimit`), `configMap`/`secret`, `projected` và `hostPath`?

<details>
<summary>Đáp án</summary>

- **`emptyDir`**: mặc định lưu trên đĩa của node; nếu cấu hình `medium: Memory` sẽ dùng RAM (`tmpfs`). Có thể đặt `sizeLimit` để giới hạn dung lượng (nếu không đặt `sizeLimit`, `emptyDir` và `hostPath` không bị giới hạn dung lượng và không có sự cô lập giữa các container).
- **`configMap` và `secret`**: nạp cấu hình hoặc thông tin bí mật vào Pod dưới dạng file; trong đó `secret` dùng `tmpfs`.
- **`projected`**: gộp nhiều nguồn (`secret`, `configMap`, `downwardAPI`, `serviceAccountToken`) vào chung một thư mục duy nhất.
- **`hostPath`**: gắn trực tiếp một thư mục của **node** vào Pod. Loại này tiềm ẩn rủi ro bảo mật và làm Pod bị bám vào node, chỉ nên dùng có chủ đích (ví dụ DaemonSet log agent hoặc môi trường lab).
</details>

### Câu Hỏi 3: Phân biệt vai trò của PersistentVolume (PV), PersistentVolumeClaim (PVC) và StorageClass. Quan hệ Binding giữa PVC và PV hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **PersistentVolume (PV)**: đại diện cho phần lưu trữ **thật** trong cluster (một ổ đĩa, một thư mục NFS...), do quản trị viên tạo (cấp phát tĩnh) hoặc hệ thống tự tạo (cấp phát động).
- **PersistentVolumeClaim (PVC)**: là **yêu cầu** lưu trữ của ứng dụng (dung lượng, access mode, StorageClass), do đội phát triển ứng dụng tạo.
- **StorageClass**: là **mẫu cấp phát** quy định `provisioner` (CSI driver), `parameters`, `reclaimPolicy`, `volumeBindingMode`, và `allowVolumeExpansion`, do quản trị viên hoặc nhà cung cấp cloud định nghĩa.

Quan hệ giữa Pod, PVC và PV là: `Pod → (volume persistentVolumeClaim) → PVC ⇄ PV → ổ đĩa thật`. Việc **Binding giữa PVC và PV là 1:1 và độc quyền**: khi một PVC đã bound với một PV, không PVC nào khác có thể dùng chung PV đó (ngay cả khi PV có dung lượng lớn hơn mức PVC yêu cầu). Nếu chưa có PV phù hợp, PVC sẽ chờ vô hạn.
</details>

### Câu Hỏi 4: Cấp phát động (Dynamic Provisioning) khác gì với cấp phát tĩnh (Static Provisioning), và StorageClass mặc định hoạt động ra sao?

<details>
<summary>Đáp án</summary>

- **Cấp phát động**: PVC chỉ định `storageClassName`, sau đó provisioner của StorageClass đó sẽ tự động tạo ra một PV khớp với yêu cầu.
- **Cấp phát tĩnh**: quản trị viên tạo sẵn PV trước. Nếu PVC muốn dùng PV tĩnh mà không muốn rơi vào StorageClass mặc định của cluster, PVC phải khai báo tường minh `storageClassName: ""`.

**StorageClass mặc định** được đánh dấu bằng annotation `storageclass.kubernetes.io/is-default-class: "true"`. Khi PVC không ghi trường `storageClassName`, nó sẽ sử dụng StorageClass mặc định này. Một cluster có thể không có default StorageClass; nếu có nhiều StorageClass cùng được đánh dấu là default, bản **mới tạo nhất** sẽ được sử dụng.
</details>

### Câu Hỏi 5: Cơ chế Storage Object in Use Protection bảo vệ PVC/PV như thế nào, và một PV trải qua các trạng thái vòng đời nào?

<details>
<summary>Đáp án</summary>

**Storage Object in Use Protection** sử dụng các finalizer để ngăn việc xóa nhầm gây mất dữ liệu:
- PVC đang được Pod sử dụng sẽ mang finalizer `kubernetes.io/pvc-protection`.
- PV đang ở trạng thái bound sẽ mang finalizer `kubernetes.io/pv-protection`.
Khi người dùng xóa các đối tượng này trong lúc vẫn đang được sử dụng, việc xóa sẽ bị hoãn lại cho đến khi không còn Pod/PVC nào dùng nữa.

**Vòng đời của PV** gồm 4 trạng thái:
1. `Available`: PV sẵn sàng, chưa gắn với PVC nào (thường thấy ở PV tĩnh tạo sẵn).
2. `Bound`: PV đã gắn kết 1:1 với một PVC.
3. `Released`: PVC đã bị xóa nhưng PV vẫn chưa được thu hồi tài nguyên.
4. `Failed`: quá trình thu hồi tự động PV gặp lỗi.
</details>

### Câu Hỏi 6: Ý nghĩa của 4 Access Modes (`RWO`, `ROX`, `RWX`, `RWOP`) là gì?

<details>
<summary>Đáp án</summary>

- **`ReadWriteOnce` (`RWO`)**: cho phép mount ở chế độ đọc-ghi (read-write) bởi **một node**; nhiều Pod nằm trên **cùng một node** đó vẫn có thể dùng chung volume.
- **`ReadOnlyMany` (`ROX`)**: cho phép mount ở chế độ chỉ đọc (read-only) bởi **nhiều node**.
- **`ReadWriteMany` (`RWX`)**: cho phép mount ở chế độ đọc-ghi (read-write) bởi **nhiều node**.
- **`ReadWriteOncePod` (`RWOP`)**: cho phép mount ở chế độ đọc-ghi bởi **đúng một Pod duy nhất** trong toàn bộ cluster (ổn định từ Kubernetes v1.29 và tài liệu nêu chỉ hỗ trợ với **CSI volume**).
</details>

### Câu Hỏi 7: Vì sao `ReadWriteOnce` (RWO) không có nghĩa là "chỉ một Pod", và cần lưu ý những giới hạn thực tế nào khi dùng Access Modes?

<details>
<summary>Đáp án</summary>

`RWO` giới hạn theo phạm vi **node**, không phải Pod. Nếu nhiều Pod chạy trên **cùng một node**, chúng vẫn có thể mount và ghi đồng thời vào cùng một volume `RWO`. Do đó, với các ứng dụng không chịu được việc ghi đồng thời (như nhiều loại database), không nên giả định `RWO` sẽ tự bảo vệ mà cần dùng `RWOP` (khi driver hỗ trợ).

Các lưu ý quan trọng khác từ tài liệu:
- Access mode dùng để **khớp PVC với PV** (và đôi khi giới hạn nơi PV được mount), nhưng **không bảo vệ quyền ghi sau khi đã mount** (ví dụ một PV khai báo `ROX` không tự động bảo đảm ngăn việc ghi ở tầng mount).
- Một volume chỉ có thể được mount bằng **một** access mode tại một thời điểm.
- Khả năng hỗ trợ access mode phụ thuộc vào **volume plugin/CSI driver** (ví dụ Azure Files/NFS hỗ trợ `RWX`, HostPath chỉ hỗ trợ `RWO`, còn CSI thì tùy từng driver). Không nên dựa vào `RWOP` với các volume không phải CSI ngoài môi trường thử nghiệm.
</details>

### Câu Hỏi 8: `reclaimPolicy` có những giá trị nào và quyết định điều gì khi xóa PVC? Giá trị mặc định của StorageClass là gì?

<details>
<summary>Đáp án</summary>

`reclaimPolicy` quyết định số phận của PV và dữ liệu phía sau khi PVC bị xóa (PV cấp phát động sẽ thừa kế policy này từ StorageClass):
- **`Delete`**: PV **và** tài nguyên lưu trữ thật phía sau đều bị xóa theo. Đây là giá trị **mặc định của StorageClass** nếu không khai báo.
- **`Retain`**: PV chuyển sang trạng thái `Released`, dữ liệu **được giữ lại**, và quản trị viên phải thu hồi thủ công.
- **`Recycle`**: đã bị **deprecated**; tài liệu khuyến nghị dùng cấp phát động thay thế.

Trong môi trường production, dữ liệu quan trọng nên dùng StorageClass `Retain` (hoặc đổi policy của PV) kết hợp backup/snapshot định kỳ để tránh xóa nhầm PVC hoặc namespace làm mất ổ đĩa.
</details>

### Câu Hỏi 9: Sau khi xóa PVC dùng StorageClass `Retain`, vì sao PV ở trạng thái `Released` chưa thể tự gắn cho PVC mới, và quản trị viên xử lý hoặc đổi `reclaimPolicy` trực tiếp trên PV bằng cách nào?

<details>
<summary>Đáp án</summary>

Khi PVC bị xóa với `reclaimPolicy: Retain`, PV chuyển sang trạng thái `Released` nhưng trường `spec.claimRef` trên PV vẫn còn trỏ về tên và namespace của PVC cũ (ví dụ `default/keep-me`). Vì còn `claimRef` này, PV không ở trạng thái `Available` nên không thể tự động bind cho PVC mới.

Để tái sử dụng PV đang `Released`, quản trị viên cần kiểm tra/xử lý dữ liệu trước, sau đó gỡ bỏ trường `claimRef` thủ công (theo hướng dẫn mục *Reclaiming* trong tài liệu Persistent Volumes). Nếu muốn thay đổi `reclaimPolicy` trực tiếp trên một PV đang tồn tại (ví dụ từ `Delete` sang `Retain`), có thể dùng lệnh `kubectl patch pv`.
</details>

### Câu Hỏi 10: Phân biệt hai chế độ `volumeBindingMode` là `Immediate` và `WaitForFirstConsumer`. Vì sao `WaitForFirstConsumer` quan trọng với storage phụ thuộc topology?

<details>
<summary>Đáp án</summary>

- **`Immediate`** (mặc định nếu không khai báo): PV được bind và cấp phát **ngay khi PVC được tạo**, trước khi biết Pod sẽ chạy ở đâu. Điều này dễ dẫn đến việc tạo ổ đĩa ở một vùng (zone) hoặc node mà Pod không thể lập lịch chạy tới được.
- **`WaitForFirstConsumer`**: **trì hoãn** việc bind và cấp phát PV cho đến khi có **Pod đầu tiên sử dụng PVC** được tạo. Khi đó `kube-scheduler` sẽ chọn node phù hợp cho Pod trước, rồi ổ đĩa mới được tạo đúng theo topology (zone/node) của Pod.

Lưu ý theo tài liệu: khi sử dụng `WaitForFirstConsumer`, **không được đặt tường minh `nodeName`** trong Pod spec.
</details>

### Câu Hỏi 11: Khi vừa tạo PVC thấy trạng thái `Pending` với sự kiện `waiting for first consumer to be created before binding`, có phải hệ thống đang lỗi không? Mô tả luồng hoạt động từ lúc tạo PVC đến khi Pod `Running` với `WaitForFirstConsumer`.

<details>
<summary>Đáp án</summary>

**Không phải lỗi.** Đây là trạng thái bình thường khi PVC sử dụng StorageClass có `volumeBindingMode: WaitForFirstConsumer` và chưa có Pod nào dùng nó.

Luồng cấp phát động diễn ra theo các bước:
1. Người dùng tạo PVC → `kube-apiserver` ghi nhận PVC ở trạng thái `Pending` chờ consumer đầu tiên.
2. Người dùng tạo Pod tham chiếu đến PVC đó → `kube-scheduler` chọn node phù hợp cho Pod (có xét đến topology).
3. `kube-apiserver` thông báo cho Provisioner/CSI biết đã có consumer cùng node được chọn.
4. Provisioner/CSI tạo ổ đĩa/thư mục thật, sau đó tạo đối tượng PV (gắn `claimRef` trỏ về PVC và `nodeAffinity`).
5. PVC ⇄ PV chuyển sang trạng thái `Bound`.
6. `kubelet` thực hiện attach/mount volume vào Pod và Pod chuyển sang trạng thái `Running`.
</details>

### Câu Hỏi 12: Để mở rộng dung lượng một PVC (Volume Expansion) cần đáp ứng những điều kiện gì? Có thể thu nhỏ PVC hoặc mở rộng PVC trên StorageClass `standard` của `kind` không?

<details>
<summary>Đáp án</summary>

Để mở rộng dung lượng PVC, StorageClass phải khai báo `allowVolumeExpansion: true` **và** driver lưu trữ (CSI/plugin) phải hỗ trợ tính năng này. Về nguyên tắc, Kubernetes **chỉ hỗ trợ tăng dung lượng, không hỗ trợ thu nhỏ**.

Trên cụm `kind` với StorageClass mặc định `standard` (`rancher.io/local-path`), `allowVolumeExpansion` đang là `false`. Do đó, nếu thử tăng dung lượng bằng `kubectl patch pvc`, hệ thống sẽ từ chối với lỗi `Forbidden: only dynamically provisioned pvc can be resized and the storageclass that provisions the pvc must support resize`.
</details>

### Câu Hỏi 13: Trên môi trường Azure Kubernetes Service (AKS), khi nào nên chọn Azure Disk và khi nào chọn Azure Files? Cần lưu ý gì về các StorageClass tích hợp sẵn của AKS?

<details>
<summary>Đáp án</summary>

Theo tài liệu Microsoft Learn được đề cập trong bài:
- **Azure Disk**: chỉ mount ở chế độ `ReadWriteOnce` (một node tại một thời điểm) và có giới hạn số lượng volume gắn trên mỗi node tùy theo VM SKU.
- **Azure Files**: sử dụng khi cần nhiều node cùng truy cập và ghi dữ liệu chung (`ReadWriteMany`, qua SMB 3.1.1 hoặc NFS 4.1). Lưu ý thêm là PV không được chia sẻ giữa Windows Pod và Linux Pod.

Về **StorageClass tích hợp sẵn trên AKS** (như `managed-csi` mặc định, `managed-csi-premium`, `azurefile-csi`...):
- Các class này có mặc định `reclaimPolicy: Delete`.
- AKS sẽ **tự động reconcile và ghi đè mọi chỉnh sửa** nếu bạn sửa trực tiếp lên các StorageClass tích hợp. Do đó, nếu muốn dùng `Retain` hoặc cấu hình SKU khác (ví dụ `Premium_ZRS` hay LRS), bạn bắt buộc phải **tạo một StorageClass mới** (như `managed-premium-retain` dùng `provisioner: disk.csi.azure.com`).
</details>

### Câu Hỏi 14: StorageClass `standard` của `kind` hoạt động như thế nào phía dưới hạ tầng và vì sao không được dùng nó (hoặc `hostPath`) cho môi trường production?

<details>
<summary>Đáp án</summary>

Trên `kind`, StorageClass mặc định `standard` sử dụng provisioner `rancher.io/local-path` với `reclaimPolicy: Delete`, `volumeBindingMode: WaitForFirstConsumer` và không cho mở rộng. PV tạo ra thực chất chỉ là một thư mục nằm ngay trên **ổ đĩa của node container** (tại `/var/local-path-provisioner/...`) và được ghim cố định vào node đó bằng `nodeAffinity` (`kubernetes.io/hostname`).

**Không dùng `standard` của `kind` hay `hostPath` cho production** vì dữ liệu bị trói chặt vào đĩa cục bộ của một node duy nhất, không có cơ chế sao lưu và không chịu được sự cố mất node. Trong production, cần dùng CSI driver của nền tảng thực tế (như Azure Disk/Files, AWS EBS...) kết hợp sao lưu và kiểm thử khôi phục.
</details>

### Câu Hỏi 15: Trong thực hành YAML và `kubectl`, làm thế nào để gắn một PVC vào Pod và dùng những lệnh nào để kiểm tra StorageClass, trạng thái PVC/PV cùng sự kiện `Pending`?

<details>
<summary>Đáp án</summary>

Trong file YAML của Pod:
- Khai báo volume dưới `spec.volumes` trỏ tới tên PVC qua `persistentVolumeClaim: { claimName: <tên-pvc> }`.
- Gắn volume đó vào container qua `volumeMounts` với `name` trùng khớp và `mountPath` mong muốn.

Các lệnh `kubectl` kiểm tra quan trọng trong bài:
- `kubectl get storageclass` (hoặc `kubectl get sc <tên> -o yaml`): xem danh sách StorageClass, provisioner, `reclaimPolicy`, `volumeBindingMode`, `allowVolumeExpansion`.
- `kubectl get pvc,pv`: kiểm tra trạng thái `Pending`, `Bound`, `Released` và thông tin claim.
- `kubectl describe pvc <tên-pvc>`: xem mục `Events` để biết nguyên nhân PVC đang `Pending` (ví dụ `waiting for first consumer to be created before binding`).
</details>
