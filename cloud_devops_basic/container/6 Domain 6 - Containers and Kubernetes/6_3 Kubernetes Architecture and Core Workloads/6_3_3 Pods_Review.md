# Ôn Tập: 6_3_3 Pods

### Câu Hỏi 1: Pod là gì trong Kubernetes và được khai báo cơ bản như thế nào?

<details>
<summary>Đáp án</summary>

- **Bản chất**: Pod là đơn vị tính toán nhỏ nhất có thể tạo và quản lý trong Kubernetes. Bối cảnh chia sẻ của Pod là tập hợp các Linux namespace, cgroup và cơ chế cô lập giống như một container.
- **Khai báo manifest**: Tài nguyên Pod sử dụng `apiVersion: v1`, `kind: Pod`, và định nghĩa các container ứng dụng chính dưới trường `spec.containers`.
</details>

---

### Câu Hỏi 2: Khi đặt nhiều container trong cùng một Pod, chúng chia sẻ những gì và cần lưu ý điều gì về cổng mạng (port)?

<details>
<summary>Đáp án</summary>

- **Mạng dùng chung**: Mọi container trong cùng Pod đều dùng chung một network namespace (chung địa chỉ IP và dải cổng mạng), nên có thể giao tiếp trực tiếp với nhau qua `localhost`.
- **Volume dùng chung**: Mọi container trong Pod đều có thể truy cập các volume được khai báo dùng chung để chia sẻ tệp tin.
- **Lưu ý xung đột cổng (Port Collision)**: Vì dùng chung network namespace, hai tiến trình trong cùng Pod không thể cùng bind vào một cổng mạng. Nếu bị trùng cổng, container thứ hai sẽ liên tục thất bại ở trạng thái `Terminated` hoặc `CrashLoopBackOff`. Do đó, các container trong cùng Pod phải tự điều phối để dùng các cổng riêng biệt (ví dụ: app chính dùng cổng `8080`, sidecar/helper dùng cổng `9090`).
</details>

---

### Câu Hỏi 3: Các container trong cùng một Pod chia sẻ tệp tin (ví dụ log) với nhau bằng cách nào?

<details>
<summary>Đáp án</summary>

- Các container chia sẻ dữ liệu thông qua **Shared Volume**:
  1. Khai báo một volume ở cấp Pod dưới trường `spec.volumes` (ví dụ: `emptyDir: {}` với tên `shared-logs`).
  2. Gắn (mount) volume đó vào từng container cần truy cập thông qua trường `volumeMounts` (trùng `name` và chỉ định `mountPath`, ví dụ `/var/log/app`).
- Nhờ vậy, container ứng dụng chính có thể ghi log vào thư mục dùng chung, còn container sidecar có thể đọc trực tiếp từ thư mục đó.
</details>

---

### Câu Hỏi 4: Init Container là gì và quy tắc thực thi của nó khác gì so với container ứng dụng thông thường?

<details>
<summary>Đáp án</summary>

- **Khai báo**: Init Container được định nghĩa dưới trường `spec.initContainers`.
- **Chạy hoàn tất (Run to completion)**: Init Container luôn chạy trước container ứng dụng chính và bắt buộc phải hoàn tất thành công (exit code `0`) trước khi container kế tiếp được khởi động.
- **Thực thi tuần tự**: Nếu Pod có nhiều Init Container thông thường, kubelet chạy lần lượt từng container một; cái trước thành công thì cái sau mới bắt đầu.
- **Điều kiện Ready**: Pod không thể chuyển sang trạng thái `Ready` cho đến khi toàn bộ Init Container thông thường chạy thành công.
</details>

---

### Câu Hỏi 5: Điều gì xảy ra khi Init Container thất bại hoặc bị treo không có timeout?

<details>
<summary>Đáp án</summary>

- **Khi thất bại**: Nếu Init Container thất bại trong một Pod có `restartPolicy: Always`, kubelet sẽ khởi động lại Init Container đó theo ngữ nghĩa `OnFailure`.
- **Khi bị treo không timeout**: Do Init Container chạy tuần tự và phải hoàn tất mới nhường chỗ cho bước tiếp theo, nếu một lệnh trong Init Container bị treo vô hạn thì container ứng dụng không thể khởi động và Pod sẽ kẹt mãi ở phase `Pending` (không thể `Ready`). Vì vậy, luôn cần đặt timeout cho các lệnh kiểm tra trong Init Container.
</details>

---

### Câu Hỏi 6: Native Sidecar Container là gì, đạt Stable GA từ phiên bản nào và khai báo ra sao?

<details>
<summary>Đáp án</summary>

- **Bản chất**: Native Sidecar Container là một Init Container đặc biệt nhưng vẫn tiếp tục chạy song song suốt toàn bộ vòng đời của Pod sau khi khởi động (ví dụ dùng để thu thập log).
- **Phiên bản**: Tính năng này ở trạng thái alpha tại Kubernetes `v1.28` và đạt **Stable GA từ Kubernetes `v1.33`**.
- **Cách khai báo**: Được định nghĩa bên trong `spec.initContainers` kèm cấu hình `restartPolicy: Always`.
</details>

---

### Câu Hỏi 7: Vòng đời khởi động và dừng (shutdown) của Native Sidecar Container diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

- **Khi khởi động**: Native Sidecar chạy trước container ứng dụng chính (theo thứ tự trong `initContainers`), nhưng sau khi khởi động xong thì nó **tiếp tục chạy và không chặn** các Init Container kế tiếp hay container ứng dụng chính bắt đầu.
- **Khi dừng Pod**: Kubelet gửi tín hiệu `SIGTERM` để dừng container ứng dụng chính trước, đồng thời **trì hoãn tắt Native Sidecar** cho đến khi container ứng dụng chính đã dừng hoàn toàn rồi mới gửi `SIGTERM` để tắt Sidecar.
</details>

---

### Câu Hỏi 8: Hãy phân biệt giữa Pod Phase và Container State?

<details>
<summary>Đáp án</summary>

- **Pod Phase (`status.phase`)**:
  - **Phạm vi**: Phản ánh giai đoạn vòng đời tổng thể của đối tượng Pod trên cụm.
  - **5 giá trị**: `Pending`, `Running`, `Succeeded`, `Failed`, `Unknown`.
- **Container State (`status.containerStatuses[].state`)**:
  - **Phạm vi**: Độc lập với Pod Phase, phản ánh tiến trình cụ thể của từng container bên trong Pod.
  - **3 giá trị**: `Waiting`, `Running`, `Terminated`.
- *Lưu ý thực tế*: Một Pod có thể đang ở phase `Running`, nhưng container bên trong lại có thể ở state `Waiting` (ví dụ lý do `CrashLoopBackOff`) khiến ứng dụng vẫn không truy cập được.
</details>

---

### Câu Hỏi 9: Khi container ở trạng thái `Waiting` hoặc `Terminated`, ta có thể đọc được thông tin chi tiết nào?

<details>
<summary>Đáp án</summary>

- **Trạng thái `Waiting`**: Cung cấp trường `reason` mô tả lý do container đang bị chặn chưa thể chạy (ví dụ: `CrashLoopBackOff`).
- **Trạng thái `Terminated`**: Cung cấp lý do kết thúc (`reason`), mã thoát (`exitCode`), cùng thời gian thực thi của container.
</details>

---

### Câu Hỏi 10: `spec.restartPolicy` của Pod hỗ trợ những giá trị nào và giá trị mặc định là gì?

<details>
<summary>Đáp án</summary>

- Trường `spec.restartPolicy` áp dụng ở cấp Pod và hỗ trợ 3 giá trị: `Always`, `OnFailure`, và `Never`.
- Giá trị mặc định là `Always`.
</details>

---

### Câu Hỏi 11: `CrashLoopBackOff` có phải là lỗi của Kubernetes không? Cơ chế hoạt động và điều kiện reset của nó là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất**: `CrashLoopBackOff` **không phải** là lỗi của Kubernetes, mà là cơ chế tự vệ của kubelet nhằm tránh làm quá tải Node khi một container liên tục bị crash và khởi động lại.
- **Cơ chế độ trễ lũy tiến (Exponential Backoff)**: Khi container crash liên tục, kubelet áp dụng độ trễ tăng dần theo hàm mũ (`10s`, `20s`, `40s`,...) và tối đa là `300 giây` trước mỗi lần restart tiếp theo. Trong thời gian chờ này, container ở trạng thái `Waiting` với `reason` là `CrashLoopBackOff`.
- **Điều kiện reset**: Nếu container chạy ổn định không lỗi trong **10 phút**, kubelet sẽ đặt lại (reset) bộ đếm thời gian restart backoff delay về ban đầu.
</details>

---

### Câu Hỏi 12: Triết lý "Cattle vs Pets" áp dụng cho Pod như thế nào và vì sao không nên tạo "Pod trần" (Naked Pods)?

<details>
<summary>Đáp án</summary>

- **Cattle vs Pets**:
  - *Pets (Thú cưng)* là máy chủ truyền thống được cấu hình riêng và sửa chữa thủ công khi gặp sự cố.
  - *Cattle (Gia súc)* là cách Kubernetes quản lý Pod theo đàn bằng nhãn (labels): khi Pod gặp lỗi, hệ thống sẽ hủy và thay thế bằng Pod mới chứ không sửa tay lên Pod đang chạy.
- **Hiểm họa của Pod trần (Naked Pods)**: Nếu tạo trực tiếp manifest `kind: Pod` mà không qua controller, Pod đó **không thể tự phục hồi sang Node khác** khi máy chủ (Node) chứa nó bị hỏng, ngay cả khi đã đặt `restartPolicy: Always`. Vì vậy, luôn phải quản lý Pod thông qua controller như Deployment, StatefulSet hoặc DaemonSet.
</details>

---

### Câu Hỏi 13: Khi chẩn đoán sự cố Pod (kẹt `Pending` hoặc `CrashLoopBackOff`), ta thường dùng những lệnh `kubectl` nào trong bài học?

<details>
<summary>Đáp án</summary>

- `kubectl get pods -o wide`: Liệt kê Pod kèm địa chỉ IP và Pod Phase.
- `kubectl describe pod <tên-pod>`: Kiểm tra chi tiết Pod Phase, Conditions và Events (rất hữu ích khi Pod kẹt `Pending` do Init Container).
- `kubectl get pod <tên-pod> -o jsonpath=...`: Trích xuất nhanh `.status.containerStatuses[*].state`, `.state.waiting.reason`, hoặc `.state.terminated.exitCode` và `.state.terminated.reason`.
- `kubectl logs -p`: Xem lại log của container ở lần chạy trước khi bị crash để tìm nguyên nhân gốc từ ứng dụng.
</details>
