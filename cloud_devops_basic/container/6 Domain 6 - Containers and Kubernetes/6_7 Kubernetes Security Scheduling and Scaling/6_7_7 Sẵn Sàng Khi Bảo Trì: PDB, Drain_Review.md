# Ôn Tập: 6_7_7 Sẵn Sàng Khi Bảo Trì: PDB, Drain

### Câu Hỏi 1: Tại sao không nên tắt máy chủ hoặc xóa máy ảo đột ngột khi bảo trì hạ tầng, và Kubernetes giải quyết bài toán này như thế nào?

<details>
<summary>Đáp án</summary>

Khi cần nâng cấp hệ điều hành, vá lỗi bảo mật hạt nhân hoặc bảo trì phần cứng, nếu tắt máy chủ hoặc xóa máy ảo đột ngột, toàn bộ tiến trình ứng dụng đang chạy trên máy đó sẽ bị ngắt kết nối bất ngờ, dẫn đến suy giảm chất lượng dịch vụ hoặc đánh mất giao dịch của khách hàng.

Kubernetes giải quyết bài toán này bằng một quy trình có kiểm soát gồm:
1. Cô lập máy chủ để không nhận thêm khối lượng công việc mới (`cordon`).
2. Di dời ứng dụng sang các node khỏe mạnh khác một cách có kiểm soát (`drain`).
3. Thiết lập rào chắn ngân sách gián đoạn thông qua `PodDisruptionBudget` (`PDB`) để bảo đảm số lượng bản sao khả dụng luôn đáp ứng thỏa thuận mức độ dịch vụ.
</details>

### Câu Hỏi 2: Lệnh `kubectl cordon` thực hiện chức năng gì và ảnh hưởng thế nào đến các Pod đang chạy trên node?

<details>
<summary>Đáp án</summary>

- **Chức năng**: Lệnh `kubectl cordon <node>` đánh dấu node chuyển sang trạng thái `Unschedulable` (hiển thị là `Ready,SchedulingDisabled` khi chạy `kubectl get nodes`), qua đó ngăn không cho `kube-scheduler` gán thêm bất kỳ Pod mới nào vào node này.
- **Ảnh hưởng tới Pod hiện có**: Tất cả các Pod đang chạy sẵn trên node đó vẫn tiếp tục duy trì hoạt động bình thường, không bị dừng hay tự động xóa bỏ.
</details>

### Câu Hỏi 3: Khi nào cần sử dụng lệnh `kubectl uncordon` và kết quả của thao tác này là gì?

<details>
<summary>Đáp án</summary>

- **Thời điểm sử dụng**: Thực hiện sau khi đã hoàn tất công tác bảo dưỡng máy chủ (nâng cấp hệ điều hành, bảo trì phần cứng) để đưa node quay trở lại phục vụ cụm.
- **Kết quả**: Lệnh `kubectl uncordon <node>` thực hiện thao tác hoàn tác bằng cách cập nhật `spec.unschedulable = false`, đưa node từ trạng thái `SchedulingDisabled` trở lại khả dụng (`Ready` / `Schedulable`) để `kube-scheduler` tiếp tục phân bổ các Pod mới lên node đó.
</details>

### Câu Hỏi 4: Lệnh `kubectl drain` kết hợp những thao tác nào và tại sao nó sử dụng Eviction API thay vì DELETE API?

<details>
<summary>Đáp án</summary>

- **Thao tác kết hợp**: Lệnh `kubectl drain` kết hợp hai việc: đánh dấu `cordon` node (chuyển sang `Unschedulable`) và thực hiện trục xuất (`evict`) toàn bộ các Pod đang hoạt động trên node để giải phóng máy chủ an toàn.
- **Lý do dùng Eviction API**: Quá trình trục xuất của `kubectl drain` gửi yêu cầu qua Kubernetes Eviction API (sub-resource `/eviction`) thay vì gọi trực tiếp `DELETE` API. Nhờ đó, API Server có thể chuyển tiếp yêu cầu tới `PDB Controller` để kiểm tra xem việc dừng Pod tại thời điểm hiện tại có làm số lượng bản sao khả dụng tụt xuống dưới ngưỡng an toàn hay không trước khi cho phép dừng Pod.
</details>

### Câu Hỏi 5: Khi `kubectl drain` xử lý từng Pod trên node, luồng tương tác diễn ra như thế nào trong trường hợp được PDB cho phép và trường hợp bị PDB từ chối?

<details>
<summary>Đáp án</summary>

`kubectl drain` trước tiên cập nhật `spec.unschedulable = true` để `cordon` node, sau đó lặp qua từng Pod trên node và gửi yêu cầu Eviction qua `/eviction` tới API Server để `PDB Controller` kiểm tra:

- **Trường hợp ngân sách cho phép (Disruption Allowed)**:
  1. `PDB Controller` chấp thuận trục xuất.
  2. API Server yêu cầu `Kubelet` trên node cũ gửi tín hiệu dừng Pod (`SIGTERM` kèm grace period) để Pod dừng hoàn toàn một cách êm đẹp.
  3. `Deployment Controller` phát hiện thiếu bản sao và tạo Pod thay thế.
  4. `kube-scheduler` xếp lịch Pod mới lên một worker node khỏe mạnh khác.
- **Trường hợp vi phạm ngân sách (Disruption Denied)**:
  1. `PDB Controller` từ chối vì không đủ số bản sao khả dụng.
  2. API Server trả về lỗi `429 Too Many Requests`.
  3. `kubectl drain` tạm dừng, chờ đợi và thử lại định kỳ cho đến khi ngân sách cho phép hoặc hết thời gian chờ.
</details>

### Câu Hỏi 6: Hãy phân biệt Voluntary Disruption và Involuntary Disruption. PodDisruptionBudget (PDB) bảo vệ ứng dụng trước loại gián đoạn nào?

<details>
<summary>Đáp án</summary>

- **Voluntary Disruption (Gián đoạn có chủ đích)**: Là các gián đoạn do người vận hành hoặc hệ thống quản lý chủ động kích hoạt, ví dụ: chạy `kubectl drain`, bảo trì hệ điều hành máy chủ, hoặc Cluster Autoscaler thu hẹp quy mô cụm.
- **Involuntary Disruption (Gián đoạn không tự nguyện)**: Là các gián đoạn sinh ra từ sự cố bất khả kháng ngoài ý muốn, ví dụ: phần cứng hư hỏng, máy chủ sập nguồn, kernel panic hoặc đứt kết nối mạng vật lý.
- **Phạm vi bảo vệ của PDB**: `PodDisruptionBudget` **chỉ** áp dụng và bảo vệ ứng dụng trước các **Voluntary Disruption**. PDB hoàn toàn không thể ngăn ngừa hay can thiệp vào **Involuntary Disruption** (vì khi máy chủ mất nguồn hoặc chết phần cứng đột ngột, không có cơ chế phần mềm nào giữ cho Pod trên máy đó tiếp tục chạy).
</details>

### Câu Hỏi 7: Trong cấu hình `PodDisruptionBudget` (`policy/v1`), các trường `spec.selector`, `spec.minAvailable` và `spec.maxUnavailable` dùng để làm gì và có quy tắc khai báo nào cần lưu ý?

<details>
<summary>Đáp án</summary>

- **`spec.selector`**: Xác định danh sách các Pod thuộc phạm vi áp dụng ngân sách bảo vệ dựa trên nhãn (ví dụ `matchLabels`).
- **`spec.minAvailable`**: Quy định số lượng Pod tối thiểu phải luôn duy trì ở trạng thái khả dụng trong thời gian gián đoạn có chủ đích.
- **`spec.maxUnavailable`**: Quy định số lượng Pod tối đa được phép ngừng hoạt động cùng lúc.
- **Quy tắc khai báo cần lưu ý**:
  - Chỉ được phép lựa chọn khai báo **một trong hai** trường `spec.minAvailable` hoặc `spec.maxUnavailable`; việc khai báo đồng thời cả hai trường trong cùng một PDB là không hợp lệ.
  - Giá trị của hai trường này có thể được khai báo dưới dạng **số nguyên tuyệt đối** (ví dụ `2`) hoặc **tỉ lệ phần trăm** (ví dụ `50%`).
</details>

### Câu Hỏi 8: Khi chạy lệnh `kubectl get pdb`, cột `ALLOWED DISRUPTIONS` cho biết thông tin gì? Cho ví dụ minh họa.

<details>
<summary>Đáp án</summary>

Cột `ALLOWED DISRUPTIONS` cho biết số lượng Pod tối đa thuộc ứng dụng được phép gián đoạn (bị trục xuất) tại thời điểm hiện tại mà vẫn tuân thủ ngưỡng an toàn của PDB.

- **Ví dụ**: Với một Deployment có `replicas: 3` và một PDB cấu hình `minAvailable: 2`, khi cả 3 Pod đều khỏe mạnh thì `ALLOWED DISRUPTIONS` sẽ có giá trị là `1` (vì tổng số bản sao là 3 và tối thiểu phải giữ lại 2, nên chỉ có thể trục xuất tối đa 1 Pod tại một thời điểm).
</details>

### Câu Hỏi 9: Hiện tượng PDB Deadlock là gì, nguyên nhân nào gây ra tình trạng này và cờ `--timeout` có vai trò gì?

<details>
<summary>Đáp án</summary>

- **Khái niệm**: PDB Deadlock là tình trạng quy định ngân sách quá chặt khiến `Eviction API` liên tục từ chối yêu cầu trục xuất (`ALLOWED DISRUPTIONS: 0`), làm lệnh `kubectl drain` bị khóa và rơi vào trạng thái treo chờ vô tận.
- **Nguyên nhân phổ biến**:
  - Khai báo `minAvailable` bằng toàn bộ số bản sao hiện có (ví dụ: ứng dụng chỉ có `replicas: 1` nhưng đặt `minAvailable: 1`) hoặc `minAvailable: 100%`.
  - Khai báo `maxUnavailable: 0`.
  - Ứng dụng có nhiều bản sao nhưng các bản sao ở node khác đang bị lỗi (`CrashLoopBackOff` hoặc chưa sẵn sàng), khiến số bản sao khỏe mạnh hiện tại chạm đúng ngưỡng `minAvailable`.
- **Vai trò của `--timeout`**: Thiết lập thời gian chờ tối đa cho tiến trình `kubectl drain` (ví dụ `--timeout=5m`), giúp lệnh tự động thoát kèm mã lỗi nếu quá trình trục xuất không thể hoàn tất, tránh làm treo vô hạn các đường ống tự động hóa / CI/CD.
</details>

### Câu Hỏi 10: Theo mặc định, lệnh `kubectl drain` sẽ dừng lại hoặc từ chối xử lý khi gặp ba loại Pod nào, và cần dùng những cờ (flags) nào để xử lý chúng?

<details>
<summary>Đáp án</summary>

Theo thiết kế mặc định, `kubectl drain` sẽ dừng lại hoặc từ chối trục xuất khi gặp 3 loại Pod sau:
1. **Pod do `DaemonSet` quản lý**: Dùng cờ `--ignore-daemonsets` để bỏ qua các Pod này khi rút cạn node.
2. **Pod đang gắn ổ đĩa tạm thời `emptyDir`**: Mặc định bị từ chối do nguy cơ mất mát dữ liệu cục bộ; cần dùng cờ `--delete-emptydir-data` nếu chấp nhận xóa dữ liệu tạm này.
3. **Pod chạy độc lập (không thuộc controller nào quản lý)**: Mặc định bị từ chối xử lý; cần chỉ định cờ `--force` để ép buộc trục xuất.
</details>

### Câu Hỏi 11: Trong môi trường sản xuất (Production), cần tuân thủ những nguyên tắc thiết kế nào khi dùng PodDisruptionBudget và `kubectl drain`?

<details>
<summary>Đáp án</summary>

1. **Không tạo PDB cho ứng dụng chỉ có 1 bản sao đơn lẻ (`replicas: 1`)**: Trừ khi bạn chấp nhận rằng máy chủ chứa Pod đó sẽ không thể bị rút cạn tự động. Để nâng cấp máy chủ mà không gián đoạn dịch vụ, ứng dụng cần có tối thiểu 2 bản sao được phân bổ trên các node khác nhau.
2. **Ưu tiên cấu hình tỉ lệ phần trăm khi kết hợp Autoscaling**: Khi ứng dụng sử dụng Horizontal Pod Autoscaler (`HPA`) co giãn số lượng bản sao liên tục, việc khai báo `minAvailable` hoặc `maxUnavailable` theo tỉ lệ phần trăm sẽ linh hoạt hơn so với đặt một con số cố định.
3. **Luôn chỉ định cờ `--timeout` trong kịch bản tự động hóa**: Khi tích hợp `kubectl drain` vào pipeline CI/CD hoặc kịch bản thay thế node tự động, luôn đặt thời gian timeout tối đa để kịp thời phát hiện và cảnh báo các cấu hình PDB bị khóa.
</details>
