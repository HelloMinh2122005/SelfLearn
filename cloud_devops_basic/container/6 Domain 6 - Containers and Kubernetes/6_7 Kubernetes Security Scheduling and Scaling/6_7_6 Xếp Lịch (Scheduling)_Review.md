# Ôn Tập: 6_7_6 Xếp Lịch (Scheduling)

### Câu Hỏi 1: Vai trò của `kube-scheduler` là gì và tại sao một Pod lại bị kẹt ở trạng thái `Pending`?

<details>
<summary>Đáp án</summary>

`kube-scheduler` là thành phần trong Control Plane có nhiệm vụ theo dõi các Pod mới tạo chưa được gán máy chủ (`spec.nodeName` rỗng) và lựa chọn Node tối ưu nhất trong cụm để gán Pod vào chạy.

Trạng thái `Pending` xảy ra khi `kube-scheduler` không tìm được Node nào phù hợp để gán Pod (ví dụ không có Node nào vượt qua vòng lọc tài nguyên, nhãn hoặc Taint). Điều này khác với các sự cố dừng tiến trình xảy ra bên trong container sau khi Pod đã được chạy.
</details>

### Câu Hỏi 2: Chu kỳ lập lịch của `kube-scheduler` gồm những giai đoạn nào và hoạt động ra sao?

<details>
<summary>Đáp án</summary>

Chu kỳ lập lịch của `kube-scheduler` diễn ra tuần tự qua hai giai đoạn chính trước khi gắn Pod vào Node:

1. **Giai đoạn Lọc (Filtering / Predicates)**: Scheduler kiểm tra toàn bộ danh sách Node để loại bỏ các Node không đáp ứng điều kiện bắt buộc của Pod (như CPU/RAM trống so với `requests`, các ràng buộc nhãn máy chủ, hoặc Node có Taint mà Pod chưa dung thứ). Nếu không còn Node nào vượt qua vòng lọc, Pod sẽ giữ nguyên trạng thái `Pending`.
2. **Giai đoạn Chấm Điểm (Scoring / Priorities)**: Các Node vượt qua vòng lọc được chấm điểm theo thang từ 0 đến 100 dựa trên các tiêu chí ưu tiên mềm, mức độ phân bổ đồng đều tài nguyên và độ sẵn có của image trên Node.

Sau khi chấm điểm, Node có tổng điểm cao nhất sẽ được chọn để thực hiện hành động **Binding** (ghi nhận tên Node vào Pod spec thông qua API Server), để Kubelet trên Node đó nhận việc và khởi chạy container.
</details>

### Câu Hỏi 3: `spec.nodeSelector` hoạt động như thế nào và cần chuẩn bị gì trên Node trước khi sử dụng?

<details>
<summary>Đáp án</summary>

`spec.nodeSelector` là cơ chế chọn Node đơn giản nhất trong Pod manifest, hoạt động bằng cách so khớp chính xác cặp `key-value` khai báo trong Pod với nhãn (`labels`) gắn trên Node.

Trước khi áp dụng, quản trị viên cần gắn nhãn tương ứng lên Node bằng lệnh `kubectl label nodes`, ví dụ:
`kubectl label nodes node-1 topology.kubernetes.io/zone=zone-a disktype=ssd`
</details>

### Câu Hỏi 4: Phân biệt `requiredDuringSchedulingIgnoredDuringExecution` và `preferredDuringSchedulingIgnoredDuringExecution` trong Node Affinity?

<details>
<summary>Đáp án</summary>

- **`requiredDuringSchedulingIgnoredDuringExecution`** (ràng buộc cứng): Quy định điều kiện bắt buộc mà Node phải thỏa mãn tại thời điểm lập lịch. Nếu không có Node nào đáp ứng, Pod sẽ bị từ chối lập lịch và ở trạng thái `Pending`.
- **`preferredDuringSchedulingIgnoredDuringExecution`** (ưu tiên mềm): Cho phép khai báo điều kiện ưu tiên kèm trọng số `weight` từ 1 đến 100 cho mỗi tiêu chí để cộng điểm trong giai đoạn Scoring. Nếu không có Node nào thỏa mãn điều kiện này, scheduler vẫn xếp lịch Pod vào Node khác còn khả dụng.
</details>

### Câu Hỏi 5: Hậu tố `IgnoredDuringExecution` trong Node Affinity có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Hậu tố `IgnoredDuringExecution` cho biết quy tắc Node Affinity chỉ được kiểm tra tại thời điểm lập lịch. Nếu nhãn trên Node bị thay đổi sau khi Pod đã được gán và đang chạy trên Node đó, Pod vẫn tiếp tục hoạt động bình thường mà không bị đẩy ra khỏi Node.
</details>

### Câu Hỏi 6: Pod Anti-Affinity (`podAntiAffinity`) giải quyết bài toán gì và sử dụng tham số nào để xác định phạm vi phân tách?

<details>
<summary>Đáp án</summary>

Pod Anti-Affinity (`podAntiAffinity`) giúp bảo đảm tính sẵn sàng cao cho dịch vụ phân tán bằng cách ngăn các Pod có cùng nhãn được xếp lịch vào cùng một đơn vị hạ tầng (chẳng hạn không chạy hai Pod chủ chốt trên cùng một máy chủ hoặc cùng một zone).

Cơ chế này sử dụng tham số `topologyKey` (ví dụ `kubernetes.io/hostname` để tách theo từng Node hoặc `topology.kubernetes.io/zone` để tách theo từng vùng khả dụng) nhằm xác định đơn vị topology cần tránh xếp chung.
</details>

### Câu Hỏi 7: Tham số `maxSkew` và `whenUnsatisfiable` trong `topologySpreadConstraints` có tác dụng gì?

<details>
<summary>Đáp án</summary>

`topologySpreadConstraints` kiểm soát mức độ phân tán đồng đều của Pod trên các vùng topology (như các zone):

- **`maxSkew`**: Xác định độ chênh lệch tối đa cho phép về số lượng Pod giữa hai nhóm topology bất kỳ (ví dụ `maxSkew: 1` cho phép số Pod giữa các zone chênh nhau tối đa 1 Pod).
- **`whenUnsatisfiable`**: Quy định cách xử lý khi việc xếp lịch vi phạm `maxSkew`, gồm hai giá trị:
  - `DoNotSchedule`: Không xếp lịch Pod (giữ ở trạng thái `Pending`) nếu vi phạm `maxSkew`.
  - `ScheduleAnyway`: Vẫn xếp lịch Pod nhưng ưu tiên chọn Node giúp giảm thiểu độ lệch nhất có thể.
</details>

### Câu Hỏi 8: Khi cần chia đều 6 bản sao (replicas) trên 3 vùng khả dụng, vì sao nên dùng `topologySpreadConstraints` thay vì `podAntiAffinity` mức cứng?

<details>
<summary>Đáp án</summary>

Có hai lý do chính:

1. **Khả năng phân bổ theo tỷ lệ**: Quy tắc chống trùng lặp cứng (`podAntiAffinity`) mang tính nhị phân — chỉ cho phép tối đa 1 Pod duy nhất trên mỗi đơn vị topology (mỗi zone). Khi có 6 bản sao mà chỉ có 3 zone, 3 Pod đầu sẽ chiếm 3 zone và 3 Pod còn lại sẽ bị kẹt ở trạng thái `Pending`. Ngược lại, `topologySpreadConstraints` với `maxSkew: 1` cho phép đặt 2 Pod trên mỗi zone một cách cân bằng.
2. **Hiệu năng của `kube-scheduler`**: `podAntiAffinity` mức cứng buộc scheduler phải tính toán so khớp chéo trên toàn bộ tập hợp Pod trong cụm lớn, dễ gây quá tải scheduler; dùng `topologySpreadConstraints` giúp giảm tải tính toán cho bộ điều phối.
</details>

### Câu Hỏi 9: Mối quan hệ giữa Taint và Toleration là gì và cú pháp gán Taint lên Node như thế nào?

<details>
<summary>Đáp án</summary>

Trái ngược với Affinity dùng để thu hút Pod về Node, **Taint** được gắn trên Node để chủ động xua đuổi các Pod không phù hợp, còn **Toleration** được khai báo trong Pod spec để cho phép Pod "chịu đựng" (dung thứ) Taint tương ứng và vượt qua vòng lọc của scheduler. Lưu ý rằng Toleration chỉ cho phép Pod có quyền đi vào Node mang Taint chứ không ép buộc Pod phải chọn Node đó.

Taint được gán trên Node bằng lệnh `kubectl taint nodes` theo định dạng `<key>=<value>:<effect>` hoặc `<key>:<effect>`, ví dụ:
`kubectl taint nodes node-1 dedicated=gpu:NoSchedule`
</details>

### Câu Hỏi 10: Phân biệt ba hiệu lực (effect) của Taint: `NoSchedule`, `PreferNoSchedule` và `NoExecute`?

<details>
<summary>Đáp án</summary>

- **`NoSchedule`**: Ngăn chặn các Pod mới không có Toleration tương ứng được xếp lịch vào Node, nhưng không ảnh hưởng đến các Pod đang chạy sẵn trên Node đó.
- **`PreferNoSchedule`**: Phiên bản mềm của `NoSchedule`; scheduler cố gắng tránh xếp Pod không có Toleration vào Node mang Taint này, nhưng vẫn xếp nếu không còn lựa chọn Node nào khác.
- **`NoExecute`**: Không chỉ ngăn Pod mới chưa dung thứ mà còn trục xuất (`evict`) ngay lập tức các Pod đang chạy trên Node nếu Pod đó không có Toleration khớp với Taint.
</details>

### Câu Hỏi 11: Trường `tolerationSeconds` trong Pod spec được dùng trong trường hợp nào?

<details>
<summary>Đáp án</summary>

`tolerationSeconds` được sử dụng kết hợp với Taint có effect `NoExecute`. Trường này chỉ định khoảng thời gian (tính bằng giây) mà Pod vẫn được phép tiếp tục chạy trên Node sau khi Node bị gán Taint `NoExecute` trước khi bị trục xuất khỏi Node.
</details>

### Câu Hỏi 12: `PriorityClass` và cơ chế Preemption hoạt động như thế nào khi cụm thiếu tài nguyên?

<details>
<summary>Đáp án</summary>

`PriorityClass` (`apiVersion: scheduling.k8s.io/v1`) là đối tượng ở phạm vi toàn cụm (cluster-scoped) dùng để định nghĩa mức độ ưu tiên của Pod thông qua một số nguyên integer trong trường `value` (giá trị `value` càng lớn thì độ ưu tiên của Pod càng cao).

Khi cụm không đủ tài nguyên để xếp lịch cho một Pod có độ ưu tiên cao, cơ chế **Preemption** (chiếm dụng) của `kube-scheduler` sẽ tìm và trục xuất các Pod có độ ưu tiên thấp hơn đang chạy để giải phóng tài nguyên cho Pod ưu tiên cao đó.
</details>

### Câu Hỏi 13: Khi phát hiện Pod bị kẹt ở trạng thái `Pending`, dùng lệnh nào để kiểm tra nguyên nhân và đọc thông tin ở phần nào?

<details>
<summary>Đáp án</summary>

Sử dụng lệnh `kubectl describe pod <tên-pod>` và kiểm tra phần **`Events`** ở cuối đầu ra (tìm các bản ghi `Warning` với Reason `FailedScheduling`, ví dụ `0/3 nodes available: ...`). Đây là nơi chính yếu cho biết vì sao các Node bị loại ở giai đoạn lọc ban đầu.
</details>

### Câu Hỏi 14: Các thông báo lỗi `FailedScheduling` phổ biến trong phần `Events` của Pod có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **`Insufficient cpu` hoặc `Insufficient memory`**: Các Node không đủ lượng CPU hoặc bộ nhớ trống để đáp ứng khai báo `requests` của Pod.
- **`node(s) had untolerated taint`**: Node mang Taint xua đuổi mà Pod chưa khai báo Toleration tương ứng để chịu đựng.
- **`didn't match PodTopologySpread` hoặc `didn't match Pod anti-affinity rules`**: Vị trí khả dụng hiện tại vi phạm ràng buộc phân tán vùng (`topologySpreadConstraints`) hoặc quy tắc chống chạy chung (`podAntiAffinity`) của Pod.
</details>

### Câu Hỏi 15: Trong vận hành thực tế (Production), những cạm bẫy nào cần tránh khi cấu hình Scheduling?

<details>
<summary>Đáp án</summary>

1. **Lạm dụng ràng buộc cứng (`required...`)**: Đặt quá nhiều điều kiện cứng khiến Pod không thể lập lịch khi một số Node gặp sự cố; trừ yêu cầu phần cứng đặc thù như GPU, nên ưu tiên điều kiện mềm kèm trọng số để bảo đảm tính sẵn sàng.
2. **Dùng Pod Anti-Affinity mức cứng trên cụm lớn**: Buộc scheduler so khớp chéo toàn bộ Pod gây quá tải bộ điều phối; nên thay bằng `topologySpreadConstraints` để giảm tải tính toán.
3. **Quên cấu hình Toleration cho DaemonSet hạ tầng**: Khi gắn Taint lên Node chuyên dụng, nếu các DaemonSet mạng hoặc thu thập log không có Toleration phù hợp, Node mới sẽ không có kết nối mạng hoặc thiếu dịch vụ nền tảng.
4. **Cấp `PriorityClass` quá cao mà thiếu khai báo tài nguyên chính xác**: Có thể khiến Pod liên tục chiếm dụng và trục xuất các dịch vụ khác, gây bất ổn định dây chuyền trong toàn cụm.
</details>
