# Ôn Tập: 6_3_8 DaemonSets Jobs and CronJobs

### Câu Hỏi 1: Deployment phù hợp với loại workload nào, và Kubernetes cung cấp thêm những workload controller chuyên biệt nào?

<details>
<summary>Đáp án</summary>

- **Deployment** phù hợp để quản lý các workload **phi trạng thái (stateless)**, chạy liên tục và nơi mọi Pod đều có thể thay thế lẫn nhau tương đương.
- Đối với các bài toán chuyên biệt hơn, Kubernetes cung cấp 4 loại workload controller khác gồm: **DaemonSet**, **Job**, **CronJob** và **StatefulSet**.
</details>

### Câu Hỏi 2: DaemonSet là gì và vòng đời của Pod thay đổi như thế nào khi thêm node, xóa node hoặc xóa DaemonSet?

<details>
<summary>Đáp án</summary>

- **Bản chất**: DaemonSet đảm bảo tất cả (hoặc một số) Node trong cụm đều chạy **chính xác một bản sao** của Pod.
- **Khi thêm node mới**: DaemonSet controller tự động bổ sung một Pod của DaemonSet lên node đó.
- **Khi node bị loại bỏ**: Pod DaemonSet trên node đó sẽ được thu gom rác (garbage collected).
- **Khi xóa DaemonSet**: Hệ thống tự động dọn dẹp toàn bộ các Pod do DaemonSet đó tạo ra.
</details>

### Câu Hỏi 3: DaemonSet thường được dùng cho những bài toán thực tế nào và cần khai báo các trường cơ bản gì trong manifest?

<details>
<summary>Đáp án</summary>

- **Ứng dụng điển hình**: Chạy các tác vụ hạ tầng cấp node trên mỗi node của cụm như:
  - Cluster storage daemon (dịch vụ lưu trữ cụm).
  - Logs collection daemon (thu thập log như Fluentd).
  - Node monitoring daemon (giám sát tài nguyên như `node-exporter`) và mạng cụm (CNI).
- **Khai báo manifest**: Sử dụng `apiVersion: apps/v1` và `kind: DaemonSet`, trong phần `spec` định nghĩa `selector` và `template` (pod template cấp node).
</details>

### Câu Hỏi 4: DaemonSet xử lý toleration như thế nào và vì sao Pod của DaemonSet có thể bị bỏ sót trên control-plane node?

<details>
<summary>Đáp án</summary>

- **Toleration tự động**: DaemonSet controller tự động gắn sẵn các toleration (chẳng hạn `node.kubernetes.io/unschedulable:NoSchedule`) để Pod vẫn có thể chạy trên cả những node chưa sẵn sàng.
- **Cạm bẫy trên control-plane node**: Node control-plane mặc định có taint `node-role.kubernetes.io/control-plane:NoSchedule` (hoặc các node đặc thù như GPU node có taint riêng), nên sẽ chặn Pod nếu thiếu toleration phù hợp.
- **Cách khắc phục**: Nếu muốn DaemonSet chạy trên mọi node kể cả control-plane, cần bổ sung `tolerations` tương ứng vào phần Pod template (`spec.template.spec.tolerations`) trong manifest DaemonSet.
</details>

### Câu Hỏi 5: Job hoạt động theo cơ chế nào khác với Deployment khi container kết thúc với mã thoát `0`?

<details>
<summary>Đáp án</summary>

- **Deployment**: Duy trì dịch vụ chạy liên tục; bất kể container thoát vì lỗi hay thoát thành công (`exit 0`), controller đều coi là thiếu replica và tạo lại Pod mới.
- **Job (`batch/v1`)**: Đại diện cho tác vụ chạy một lần đến khi hoàn tất (**run-to-completion**). Khi container kết thúc thành công (`exit 0`), Job ghi nhận một lần hoàn thành; khi đạt đủ số `completions` chỉ định, Job chuyển sang trạng thái `Complete` và dừng hẳn (không tạo lại Pod nữa).
- **Khi xóa Job**: Toàn bộ các Pod do Job đó tạo ra cũng sẽ được dọn dẹp theo.
</details>

### Câu Hỏi 6: Trong manifest của Job (`apiVersion: batch/v1`), hai tham số `spec.completions` và `spec.parallelism` có ý nghĩa và giá trị mặc định ra sao?

<details>
<summary>Đáp án</summary>

- **`spec.completions`**: Quy định tổng số Pod phải chạy thành công để Job được coi là hoàn tất.
- **`spec.parallelism`**: Quy định số lượng Pod tối đa được chạy song song cùng một lúc.
- **Giá trị mặc định**: Với non-parallel Job, nếu để trống cả `spec.completions` và `spec.parallelism` thì cả hai đều nhận giá trị mặc định là `1`. Với fixed completion Job có khai báo `completions`, nếu để trống `parallelism` thì mặc định vẫn là `1`.
</details>

### Câu Hỏi 7: Tham số `spec.backoffLimit` và `spec.ttlSecondsAfterFinished` trong Job dùng để làm gì? Điều gì xảy ra nếu bỏ qua `ttlSecondsAfterFinished`?

<details>
<summary>Đáp án</summary>

- **`spec.backoffLimit`**: Số lần thử lại tối đa khi Pod gặp lỗi trước khi Job bị đánh dấu là thất bại (`Failed`); giá trị mặc định là `6`.
- **`spec.ttlSecondsAfterFinished`**: Thời gian (tính bằng giây) để hệ thống tự động dọn dẹp và xóa Job cùng các Pod liên quan sau khi Job kết thúc (`Complete` hoặc `Failed`).
- **Rủi ro khi thiếu `ttlSecondsAfterFinished`**: Job không tự động biến mất sau khi chạy xong hoặc thất bại; lâu ngày hàng nghìn đối tượng Job và Pod cũ tích tụ sẽ làm phình to cơ sở dữ liệu `etcd`. Vì vậy nên khai báo tham số này (ví dụ `3600` cho 1 giờ) trên mọi Job.
</details>

### Câu Hỏi 8: CronJob là gì và manifest của CronJob yêu cầu những thành phần cốt lõi nào?

<details>
<summary>Đáp án</summary>

- **Bản chất**: CronJob tạo ra các đối tượng **Job** theo lịch trình lặp lại định kỳ (tương tự một dòng trong `crontab` trên Unix), tạo Job xấp xỉ một lần tại mỗi mốc thời gian của lịch biểu. Thường dùng cho sao lưu dữ liệu (backup DB), tạo báo cáo hoặc dọn dẹp định kỳ.
- **Manifest cốt lõi**: Sử dụng `apiVersion: batch/v1`, `kind: CronJob`, với trường bắt buộc `spec.schedule` viết theo cú pháp Cron (ví dụ `"*/15 * * * *"`) và `spec.jobTemplate` mô tả cấu hình của Job sẽ được sinh ra.
</details>

### Câu Hỏi 9: Hãy phân biệt 3 giá trị của `spec.concurrencyPolicy` trong CronJob và chỉ ra cạm bẫy của giá trị mặc định?

<details>
<summary>Đáp án</summary>

Khi đến lịch chạy mới mà Job của lần chạy trước vẫn chưa kết thúc:
- **`Allow` (mặc định)**: Cho phép tạo thêm Job mới chạy song song cùng lúc với Job cũ.
- **`Forbid`**: Cấm chạy đồng thời; CronJob sẽ bỏ qua (skip) lượt chạy mới cho đến khi Job cũ hoàn tất.
- **`Replace`**: Hủy bỏ Job cũ đang chạy dở và thay thế bằng Job mới.

**Cạm bẫy thực tế**: Nếu để mặc định `Allow` cho các tác vụ có thời gian xử lý lâu hơn chu kỳ lịch (ví dụ lịch chạy mỗi 5 phút nhưng backup DB mất 15 phút), nhiều Job sẽ chạy chồng chéo song song, gây nghẽn I/O và khóa cơ sở dữ liệu. Với các tác vụ như backup hoặc tính toán nhạy cảm, khuyến nghị đặt `concurrencyPolicy: Forbid`.
</details>

### Câu Hỏi 10: Các trường `successfulJobsHistoryLimit`, `failedJobsHistoryLimit` và `startingDeadlineSeconds` trong CronJob có vai trò gì?

<details>
<summary>Đáp án</summary>

- **`spec.successfulJobsHistoryLimit`**: Số lượng Job chạy thành công được giữ lại để tra cứu lịch sử (mặc định là `3`).
- **`spec.failedJobsHistoryLimit`**: Số lượng Job thất bại được giữ lại để kiểm tra lỗi (mặc định là `1`).
- **`spec.startingDeadlineSeconds`**: Hạn chót (tính bằng giây) cho phép Job được bắt đầu chạy nếu bị trễ so với lịch biểu dự kiến.
</details>

### Câu Hỏi 11: StatefulSet khác biệt cốt lõi như thế nào so với Deployment và thường dùng cho loại ứng dụng nào?

<details>
<summary>Đáp án</summary>

- **Khác biệt cốt lõi**: Trong khi **Deployment** quản lý các Pod phi trạng thái, vô danh và hoán đổi được cho nhau, thì **StatefulSet** (`apiVersion: apps/v1`) quản lý các Pod có lưu vết trạng thái, cấp **định danh mạng tuần tự cố định** (như `pod-0`, `pod-1`) và gắn kết chặt chẽ mỗi Pod với một **PersistentVolume** bền vững riêng biệt.
- **Ứng dụng điển hình**: Các hệ thống cơ sở dữ liệu phân tán hoặc lưu trạng thái như PostgreSQL HA, Kafka.
</details>

### Câu Hỏi 12: Với mỗi kịch bản thực tế sau đây, bạn nên chọn Workload Controller nào trong Kubernetes?

1. Dịch vụ REST API hoặc Microservices phi trạng thái chạy liên tục.
2. Agent thu thập log (Fluentd) hoặc giám sát tài nguyên cần chạy trên tất cả các node.
3. Script di chuyển dữ liệu (Database migration) hoặc tính toán lô chạy một lần rồi dừng.
4. Tác vụ sao lưu cơ sở dữ liệu chạy tự động vào mỗi đêm.
5. Cụm cơ sở dữ liệu phân tán (PostgreSQL HA, Kafka) cần định danh ổn định và ổ đĩa riêng cho từng node.

<details>
<summary>Đáp án</summary>

1. **Deployment** (`apps/v1`)
2. **DaemonSet** (`apps/v1`)
3. **Job** (`batch/v1`)
4. **CronJob** (`batch/v1`)
5. **StatefulSet** (`apps/v1`)
</details>

### Câu Hỏi 13: Hãy viết các câu lệnh `kubectl` thực chiến để: (1) liệt kê DaemonSet, Job và CronJob; (2) xem chi tiết một Job; (3) kích hoạt thủ công một Job từ CronJob; và (4) xóa Job/CronJob?

<details>
<summary>Đáp án</summary>

```bash
# 1. Liệt kê đồng thời DaemonSet, Job và CronJob
kubectl get ds,job,cronjob

# 2. Kiểm tra chi tiết trạng thái và sự kiện của một Job (ví dụ: batch-processor)
kubectl describe job batch-processor

# 3. Kích hoạt thủ công một lượt chạy Job ngay lập tức từ CronJob có sẵn
kubectl create job --from=cronjob/db-backup-cron manual-backup-01

# 4. Dọn dẹp tài nguyên (xóa controller sẽ tự động dọn dẹp các Pod liên quan)
kubectl delete job batch-processor && kubectl delete cronjob db-backup-cron
```
</details>
