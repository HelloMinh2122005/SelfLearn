# Ôn Tập: 6_5_5 Release Lifecycle

### Câu Hỏi 1: Vì sao trong môi trường production ta nên dùng `helm upgrade` thay vì xóa đi cài lại hoặc sửa trực tiếp bằng `kubectl edit`?

<details>
<summary>Đáp án</summary>

Nếu xóa release đi cài lại sẽ gây sập dịch vụ (downtime), còn sửa tay trực tiếp bằng `kubectl edit` sẽ gây ra sự trôi dạt cấu hình (config drift) so với mã nguồn và làm mất dấu vết lịch sử. Trong khi đó, `helm upgrade` tiếp nhận release hiện có và thực hiện nâng cấp xâm lấn tối thiểu (least invasive upgrade), chỉ cập nhật những phần thay đổi kể từ release trước đó để tránh downtime và giữ nguyên lịch sử phát hành.
</details>

### Câu Hỏi 2: Cờ `--install` (`-i`) và `--create-namespace` trong lệnh `helm upgrade --install` có tác dụng gì khi chạy trong pipeline CI/CD?

<details>
<summary>Đáp án</summary>

- Cờ `-i` (`--install`) mang lại tính lũy đẳng (idempotent): Helm sẽ cài đặt release mới nếu release chưa tồn tại, hoặc nâng cấp release nếu đã tồn tại từ trước.
- Cờ `--create-namespace` tự động tạo namespace đích nếu namespace đó chưa tồn tại trên Kubernetes cluster.
</details>

### Câu Hỏi 3: Lệnh `helm history` dùng để làm gì và cờ `--max` có giá trị mặc định là bao nhiêu?

<details>
<summary>Đáp án</summary>

Lệnh `helm history RELEASE_NAME` dùng để in ra lịch sử các revision đã phát hành của một release (gồm số revision, thời gian cập nhật, trạng thái, chart, app version và mô tả). Cờ `--max` dùng để giới hạn số lượng revision tối đa hiển thị, với giá trị mặc định là `256`.
</details>

### Câu Hỏi 4: Quy tắc tăng số revision trong Helm hoạt động như thế nào, và điều gì xảy ra với lịch sử khi bạn thực hiện `helm rollback`?

<details>
<summary>Đáp án</summary>

Lịch sử phát hành của Helm tuân thủ nguyên lý bất biến với revision tăng tuần tự (bắt đầu từ `1`): mỗi lần chạy `helm install`, `helm upgrade` hoặc `helm rollback`, số revision luôn tăng thêm `1` và không bao giờ ghi đè lịch sử. Khi chạy `helm rollback`, Helm không xóa revision bị lỗi và cũng không lùi số thứ tự, mà tạo ra một **Revision mới** mang cấu hình của revision mục tiêu (ví dụ: đang ở Revision 3 và rollback về Revision 1 sẽ sinh ra Revision 4).
</details>

### Câu Hỏi 5: Cú pháp của lệnh `helm rollback` là gì? Nếu bỏ qua số revision (hoặc đặt bằng `0`) và nếu muốn xem nguồn gốc rollback trong `helm history` thì làm thế nào?

<details>
<summary>Đáp án</summary>

- Cú pháp chuẩn: `helm rollback <RELEASE> [REVISION] [flags]`.
- Nếu bỏ qua `[REVISION]` hoặc đặt bằng `0`, Helm sẽ tự động rollback về release liền trước đó.
- Khi xem lại lịch sử bằng `helm history`, thêm cờ `--show-rollback-revision` sẽ bổ sung cột `ROLLBACK` hiển thị số revision nguồn gốc của thao tác rollback.
</details>

### Câu Hỏi 6: Máy trạng thái của release (`helm status`) gồm những trạng thái nào? Ý nghĩa của `deployed`, `superseded` và nhóm trạng thái `pending-*` (`IsPending()`) là gì?

<details>
<summary>Đáp án</summary>

Các trạng thái hợp lệ được báo cáo qua `helm status` gồm: `unknown`, `deployed`, `uninstalled`, `superseded`, `failed`, `uninstalling`, `pending-install`, `pending-upgrade` và `pending-rollback`.
- `deployed`: Release đã được áp dụng thành công lên Kubernetes cluster.
- `superseded`: Revision cũ đã lỗi thời và bị thay thế bởi một revision mới hơn.
- Nhóm trạng thái chuyển tiếp (`pending-install`, `pending-upgrade`, `pending-rollback`): Cho biết release đang trong quá trình thực thi một thao tác chưa hoàn tất. Helm dùng hàm nội bộ `IsPending()` để kiểm tra xem revision gần nhất có đang nằm trong nhóm trạng thái chuyển tiếp này hay không.
</details>

### Câu Hỏi 7: Vì sao lỗi `another operation (install/upgrade/rollback) is in progress` xuất hiện khi job CI bị hủy ngang, và cơ chế khóa bi quan (pessimistic lock) hoạt động ra sao?

<details>
<summary>Đáp án</summary>

Để chống xung đột khi nhiều tiến trình cập nhật chạy đồng thời, Helm áp dụng cơ chế khóa bi quan thông qua biến `errPending` với thông báo `another operation (install/upgrade/rollback) is in progress`. Trước khi thực thi, `helm upgrade` kiểm tra điều kiện `lastRelease.Info.Status.IsPending()`; nếu revision gần nhất đang ở trạng thái pending thì lệnh thất bại ngay lập tức. Khi job CI bị kill hoặc timeout giữa chừng, Secret lưu metadata của release bị kẹt ở trạng thái `pending-upgrade`, kích hoạt khóa bi quan và chặn cứng mọi lần deploy tiếp theo.
</details>

### Câu Hỏi 8: Quy trình xử lý thực tế khi release bị kẹt ở trạng thái `pending-upgrade` và cách phòng tránh deadlock trong pipeline CI/CD là gì?

<details>
<summary>Đáp án</summary>

Quy trình gỡ khóa bi quan gồm 3 bước:
1. Liệt kê các Secret lưu metadata của Helm trong namespace: `kubectl get secrets -n <namespace> -l owner=helm` để tìm Secret của revision bị kẹt (dạng `sh.helm.release.v1.<release>.v<rev>`).
2. Xóa Secret của revision bị kẹt dở dang: `kubectl delete secret sh.helm.release.v1.<release>.v<rev> -n <namespace>`.
3. Chạy lại lệnh deploy trong pipeline bình thường.

Để phòng tránh deadlock do chạy đồng thời, thực tiễn tốt nhất là cấu hình concurrency trong CI/CD để giới hạn chỉ chạy tối đa **1 job deploy tại một thời điểm** cho mỗi namespace.
</details>

### Câu Hỏi 9: Tại sao không nên chạy `helm upgrade` mà thiếu `--wait`? Chức năng của `--wait`, `--timeout` và `--rollback-on-failure` là gì?

<details>
<summary>Đáp án</summary>

Nếu không có `--wait`, Helm sẽ báo thành công ngay khi vừa gửi xong manifest lên API Server; nếu sau đó Pod rơi vào `CrashLoopBackOff`, pipeline vẫn báo xanh giả tạo.
- `--wait`: Chờ toàn bộ tài nguyên chuyển sang trạng thái sẵn sàng (ready) trong giới hạn thời gian `--timeout`. Khi dùng `--wait` đơn lẻ, Helm áp dụng chiến lược mặc định là `watcher`.
- `--timeout`: Thời gian tối đa chờ các thao tác Kubernetes hoàn tất, mặc định là `5m0s`.
- `--rollback-on-failure`: Tự động rollback về release thành công trước đó nếu quá trình nâng cấp bị lỗi, đồng thời tự động đặt `--wait` sang chiến lược `watcher`.
</details>

### Câu Hỏi 10: Trong Helm 4, hai cờ `--atomic` và `--force` đã được đổi tên thành gì, và vì sao không nên lạm dụng `--force-replace`?

<details>
<summary>Đáp án</summary>

Helm 4 đổi tên cờ `--atomic` thành `--rollback-on-failure`, và đổi tên `--force` thành `--force-replace` (các tên cờ cũ vẫn dùng được nhưng sẽ kèm cảnh báo deprecated).

Không nên lạm dụng `--force-replace` vì cờ này ép xóa đi tạo lại tài nguyên thay vì thực hiện rolling update, dẫn đến nguy cơ đứt kết nối và gián đoạn dịch vụ. Chỉ nên sử dụng cờ này khi cần thay đổi các trường bất biến (immutable) của Kubernetes.
</details>

### Câu Hỏi 11: Cơ chế Three-Way Merge (Helm 3) và Server-Side Apply - SSA (Helm 4) xử lý config drift như thế nào?

<details>
<summary>Đáp án</summary>

- **Three-Way Strategic Merge Patch (Helm 3)**: Khi nâng cấp, Helm đánh giá đồng thời 3 nguồn gồm manifest cũ, live state đang chạy trên cluster và manifest mới, nhờ đó bảo toàn được các thay đổi ngoài luồng (như số lượng replicas do HPA tự điều chỉnh hoặc chỉnh sửa qua `kubectl edit`).
- **Server-Side Apply - SSA (Helm 4)**: Được Helm 4 sử dụng mặc định khi cài đặt chart mới, giúp tối ưu hóa việc quản lý quyền sở hữu trường và phân giải xung đột cấu hình trực tiếp tại Kubernetes API Server.
</details>

### Câu Hỏi 12: Làm thế nào để xem trước các thay đổi (tương tự `terraform plan`) trước khi chạy `helm upgrade`, và cần thêm cờ gì để phát hiện drift với trạng thái thực tế trên cluster?

<details>
<summary>Đáp án</summary>

Helm mặc định không có lệnh `plan`, thay vào đó người dùng sử dụng plugin `helm-diff` với lệnh `helm diff upgrade <release> <chart>`. Tuy nhiên, mặc định lệnh này chỉ so sánh manifest của release đã triển khai gần nhất với manifest mới render từ chart. Để kiểm tra config drift với tài nguyên đang chạy thực tế trên cluster theo cơ chế three-way merge, cần bổ sung cờ `--three-way-merge` (hoặc thiết lập biến môi trường `HELM_DIFF_THREE_WAY_MERGE=true`).
</details>
