# Ôn Tập: 6_7_10 Vòng Đời Cluster

### Câu Hỏi 1: Quy tắc nâng cấp phiên bản Kubernetes bắt buộc phải tuân theo nguyên tắc nào và hậu quả gì sẽ xảy ra nếu cố tình nâng cấp nhảy cóc (ví dụ từ 1.30 lên thẳng 1.32)?

<details>
<summary>Đáp án</summary>

Việc nâng cấp Kubernetes **bắt buộc phải thực hiện tuần tự từng minor version một** (ví dụ: `1.30` → `1.31` → `1.32`), tuyệt đối không được phép nhảy cóc bỏ qua bất kỳ minor version nào.

Nếu cố tình nâng cấp nhảy cóc (skip-level upgrade):
- Các công cụ quản lý cụm như `kubeadm` sẽ từ chối thực hiện và báo lỗi không tương thích.
- Nếu cố tình thay thế file nhị phân thủ công, `kube-apiserver` sẽ gặp lỗi khi đọc dữ liệu từ `etcd` do cấu trúc lưu trữ và các trường dữ liệu nội bộ giữa các phiên bản có sự khác biệt.
</details>

### Câu Hỏi 2: Thứ tự nâng cấp chuẩn giữa Control Plane và các Worker Node trong cụm Kubernetes là gì? Điều gì xảy ra nếu thực hiện ngược lại?

<details>
<summary>Đáp án</summary>

Trình tự nâng cấp chuẩn luôn phải **nâng cấp các thành phần Control Plane trước**, sau khi Control Plane hoạt động ổn định mới tiến hành **nâng cấp lần lượt từng Worker Node**.

Nếu nâng cấp Worker Node trước Control Plane, phiên bản `kubelet` trên Worker Node sẽ mới hơn `kube-apiserver`. Điều này vi phạm trực tiếp **Kubernetes Version Skew Policy** (vốn nghiêm cấm `kubelet` mới hơn `kube-apiserver`), dẫn đến lỗi đồng bộ và khiến Worker Node chuyển sang trạng thái `NotReady`.
</details>

### Câu Hỏi 3: Hãy nêu 3 bước lệnh `kubectl` cốt lõi khi bảo trì và nâng cấp từng Worker Node để đảm bảo không gián đoạn dịch vụ.

<details>
<summary>Đáp án</summary>

Để nâng cấp từng Worker Node một cách an toàn, kỹ sư thực hiện tuần tự 3 bước sau:
1. **Cô lập node (`kubectl cordon <tên-node>`)**: Đánh dấu node để ngăn `kube-scheduler` điều phối thêm Pod mới tới node này.
2. **Trục xuất an toàn các Pod hiện có (`kubectl drain <tên-node> --ignore-daemonsets --delete-emptydir-data --force`)**: Di chuyển (evict) các Pod đang chạy trên node sang các node khác còn hoạt động trước khi cập nhật gói `kubeadm`, `kubelet` và khởi động lại dịch vụ `kubelet`.
3. **Mở lại node (`kubectl uncordon <tên-node>`)**: Sau khi nâng cấp `kubelet` thành công, đưa node trở lại trạng thái sẵn sàng tiếp nhận Pod mới.
</details>

### Câu Hỏi 4: Trong thực tế vận hành, vì sao lệnh `kubectl drain` có thể bị treo giữa chừng và làm gián đoạn quy trình nâng cấp node?

<details>
<summary>Đáp án</summary>

Lệnh `kubectl drain` hoạt động thông qua cơ chế **eviction API** để trục xuất an toàn các Pod ra khỏi node. Nếu **PodDisruptionBudget (PDB)** của ứng dụng đang cấu hình điều kiện quá ngặt nghèo (không cho phép thêm Pod nào bị gián đoạn tại thời điểm đó), eviction API sẽ từ chối trục xuất Pod, khiến lệnh `kubectl drain` bị treo và quy trình nâng cấp node không thể tiếp tục.
</details>

### Câu Hỏi 5: Khi sử dụng `kubeadm` để nâng cấp cụm, các bước thực hiện trên Control Plane node khác gì so với trên Worker Node?

<details>
<summary>Đáp án</summary>

- **Trên Control Plane node (đầu tiên)**:
  1. Cập nhật gói `kubeadm` lên phiên bản mục tiêu.
  2. Chạy `sudo kubeadm upgrade plan` để kiểm tra kế hoạch nâng cấp.
  3. Chạy `sudo kubeadm upgrade apply <phiên-bản>` để nâng cấp `kube-apiserver`, `kube-scheduler`, `kube-controller-manager`.
  4. Cập nhật gói `kubelet` và `kubectl`, sau đó chạy `sudo systemctl daemon-reload` và `sudo systemctl restart kubelet`.
- **Trên từng Worker Node** (sau khi đã `cordon` và `drain`):
  1. Cập nhật gói `kubeadm` lên phiên bản mục tiêu.
  2. Chạy `sudo kubeadm upgrade node` (thay cho `upgrade plan` và `upgrade apply`) để áp dụng cấu hình mới cho node.
  3. Cập nhật gói `kubelet`, sau đó chạy `sudo systemctl daemon-reload` và `sudo systemctl restart kubelet`.
</details>

### Câu Hỏi 6: Theo Kubernetes Version Skew Policy (áp dụng từ Kubernetes 1.28 trở đi), quy định chênh lệch phiên bản đối với `kubelet` và `kube-proxy` so với `kube-apiserver` là gì?

<details>
<summary>Đáp án</summary>

Từ phiên bản **Kubernetes 1.28 trở đi**:
- `kubelet` (và `kube-proxy`) được hỗ trợ chênh lệch **tối đa 3 minor version cũ hơn** so với `kube-apiserver` (từ `x - 3` đến `x`). Ví dụ: nếu `kube-apiserver` đang ở bản `1.32`, các Worker Node chạy `kubelet` từ `1.29`, `1.30`, `1.31` đến `1.32` đều được hỗ trợ hoạt động bình thường.
- **Quy tắc bất di bất dịch**: Phiên bản `kubelet` và `kube-proxy` **tuyệt đối không được phép mới hơn (cao hơn)** phiên bản `kube-apiserver` đang điều khiển chúng.
</details>

### Câu Hỏi 7: Theo Kubernetes Version Skew Policy, hãy nêu giới hạn chênh lệch phiên bản cho phép của `kube-apiserver` (trong cụm HA), `kube-controller-manager`, `kube-scheduler` và `kubectl`.

<details>
<summary>Đáp án</summary>

Nếu gọi phiên bản của `kube-apiserver` là `x`:
- **`kube-apiserver` (trong cụm HA)**: Các instance `kube-apiserver` có thể chênh lệch tối đa **1 minor version** với nhau (`x - 1`, `x`) trong quá trình rolling upgrade.
- **`kube-controller-manager` và `kube-scheduler`**: Không được mới hơn `kube-apiserver`, và có thể cũ hơn tối đa **1 minor version** (`x - 1`, `x`).
- **`kubectl`**: Được hỗ trợ chênh lệch trong phạm vi **1 minor version cũ hơn hoặc mới hơn** so với `kube-apiserver` (`x - 1`, `x`, `x + 1`).
</details>

### Câu Hỏi 8: Vì sao cần rà soát các API bị deprecate hoặc gỡ bỏ trước khi nâng cấp cluster, và sự cố gì xảy ra nếu bỏ qua bước này?

<details>
<summary>Đáp án</summary>

Khi Kubernetes phát triển, các phiên bản API cũ sẽ chuyển sang trạng thái cảnh báo (deprecated) trước khi bị gỡ bỏ (removed) ở bản phát hành mới hơn. Do đó, quản trị viên cần đối chiếu tài liệu **Deprecated API Migration Guide** trước ngày nâng cấp để cập nhật các manifest sang `apiVersion` mới tương ứng.

Nếu bỏ qua bước này, sau khi nâng cấp `kube-apiserver`, các Pod đang chạy có thể vẫn hoạt động bình thường nhưng **ứng dụng không thể khởi tạo mới hoặc cập nhật** qua manifest/pipeline CI/CD (ví dụ gặp lỗi `the server could not find the requested resource` từ Kubernetes API).
</details>

### Câu Hỏi 9: Phân biệt mục đích sử dụng và cách quét cơ bản giữa hai công cụ `Pluto` và `kubent` (kube-no-trouble).

<details>
<summary>Đáp án</summary>

Cả hai công cụ đều giúp phát hiện tự động các tài nguyên đang dùng Kubernetes API đã bị deprecate hoặc gỡ bỏ, nhưng khác nhau về phạm vi và cách kiểm tra:
- **`Pluto`**: Kiểm tra các file manifest tĩnh (lệnh `pluto detect-files -d ./manifests/ -t k8s=<version>`) hoặc các Helm release trong cluster (lệnh `pluto detect-helm -t k8s=<version>`), rất phù hợp để tích hợp vào pipeline CI/CD.
- **`kubent` (kube-no-trouble)**: Quét trực tiếp các tài nguyên đang chạy thực tế trong cluster (hoặc các manifest tĩnh) bằng lệnh `kubent` để phát hiện những đối tượng đang sử dụng phiên bản API lỗi thời.
</details>

### Câu Hỏi 10: Trong cluster Kubernetes tự dựng, `etcd` đóng vai trò gì và các lệnh `etcdctl` nào được dùng để sao lưu, kiểm tra và phục hồi dữ liệu?

<details>
<summary>Đáp án</summary>

Trong cluster tự dựng, **`etcd` là cơ sở dữ liệu duy nhất lưu trữ toàn bộ trạng thái của cluster**, nên việc sao lưu trước khi bảo trì hoặc nâng cấp là bắt buộc.

Các bước thao tác với `etcdctl` (cần thiết lập `export ETCDCTL_API=3`):
1. **Sao lưu snapshot**: Chạy `etcdctl snapshot save <đường-dẫn-file>` kèm các tham số `--endpoints`, `--cacert`, `--cert`, `--key`.
2. **Kiểm tra tính toàn vẹn snapshot**: Chạy `etcdctl snapshot status <đường-dẫn-file> --write-out=table`.
3. **Phục hồi dữ liệu**: Chạy `etcdctl snapshot restore <đường-dẫn-file> --data-dir=<thư-mục-mới>` để phục hồi dữ liệu ra một thư mục mới trước khi cấu hình `etcd` trỏ tới thư mục đó.
</details>

### Câu Hỏi 11: Theo thực tiễn tốt nhất khi vận hành sản xuất, vì sao không nên chỉ lưu bản snapshot của `etcd` trên ổ đĩa cục bộ của máy chủ Control Plane?

<details>
<summary>Đáp án</summary>

Bản snapshot `etcd` cần được chuyển ngay sang một **hệ thống lưu trữ ngoài độc lập** thay vì chỉ giữ trên đĩa cứng cục bộ của máy chủ Control Plane. Lý do là nếu máy chủ Control Plane gặp sự cố hỏng hóc phần cứng, bản sao lưu nằm trên chính đĩa cứng đó cũng sẽ bị mất theo, khiến cluster không thể phục hồi lại trạng thái trước khi xảy ra thảm họa.
</details>

### Câu Hỏi 12: Công cụ `Velero` bổ sung giải pháp sao lưu gì cho cụm Kubernetes bên cạnh snapshot `etcd`, và nó sử dụng cơ chế nào để sao lưu PersistentVolume?

<details>
<summary>Đáp án</summary>

**Velero** là giải pháp sao lưu và phục hồi thảm họa (Backup & Disaster Recovery) mã nguồn mở cho Kubernetes, giúp sao lưu ở mức ứng dụng và dữ liệu lưu trữ:
- Sao lưu các tài nguyên cluster dưới dạng manifest lên **object storage**.
- Chụp snapshot **PersistentVolume** thông qua chuẩn **CSI (Container Storage Interface)**.

Ví dụ thực tế, có thể sao lưu một namespace cụ thể kèm volume bằng lệnh `velero backup create <tên-backup> --include-namespaces <namespace> --snapshot-volumes --wait` và kiểm tra chi tiết bằng `velero backup describe <tên-backup> --details`.
</details>
