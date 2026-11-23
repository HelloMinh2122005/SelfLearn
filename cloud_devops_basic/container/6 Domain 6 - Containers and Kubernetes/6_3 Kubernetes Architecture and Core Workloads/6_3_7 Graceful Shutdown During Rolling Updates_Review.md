# Ôn Tập: 6_3_7 Graceful Shutdown During Rolling Updates

### Câu Hỏi 1: Quy trình tắt mềm (Graceful Shutdown) trong Kubernetes giải quyết bài toán gì khi thực hiện Rolling Update?

<details>
<summary>Đáp án</summary>

Trong cụm Kubernetes, Pod đại diện cho các tiến trình chạy trên worker node. Quy trình tắt mềm (graceful termination) cho phép tiến trình dọn dẹp kết nối và hoàn tất các request đang xử lý dở dang thay vì bị ngắt đột ngột bằng tín hiệu `SIGKILL`. Khi thực hiện Rolling Update (thay thế Pod cũ bằng Pod mới), việc tắt Pod cũ an toàn giúp đảm bảo hệ thống đạt zero-downtime và không làm mất dữ liệu hay rơi request của người dùng.
</details>

### Câu Hỏi 2: Trình tự 6 bước trong vòng đời tắt một Pod (Pod Termination Lifecycle) diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

Khi một Pod bị xóa (qua `kubectl delete pod` hoặc Deployment scale down ReplicaSet cũ), quy trình diễn ra theo 6 bước:
1. **Đánh dấu `Terminating`**: API server gán `deletionTimestamp` cho Pod, chuyển Pod sang phase `Terminating` và bắt đầu đếm lùi `terminationGracePeriodSeconds` (mặc định 30 giây).
2. **Chạy song song 2 luồng**: Control Plane gỡ Pod khỏi `EndpointSlice` của Service (`ready: false`), đồng thời kubelet trên worker node kích hoạt quy trình tắt cục bộ.
3. **Thực thi `preStop` hook**: Nếu container có `preStop` hook và `terminationGracePeriodSeconds` khác `0`, kubelet chạy hook này đồng bộ trước khi gửi tín hiệu dừng.
4. **Gửi tín hiệu dừng mềm `SIGTERM`**: Sau khi `preStop` hoàn tất (hoặc nếu không có hook), container runtime gửi `SIGTERM` tới tiến trình PID 1 trong container để app ngừng nhận kết nối mới và xử lý nốt request dở dang.
5. **Cưỡng chế bằng `SIGKILL` khi hết hạn**: Nếu hết thời gian ân hạn mà vẫn còn tiến trình đang chạy trong Pod, container runtime gửi `SIGKILL` tới mọi tiến trình còn sót lại.
6. **Xóa khỏi API Server**: Kubelet kích hoạt xóa đối tượng Pod khỏi API server bằng cách đặt grace period về `0` (xóa ngay lập tức khỏi etcd).
</details>

### Câu Hỏi 3: Hai luồng xử lý chạy song song khi Pod chuyển sang trạng thái `Terminating` là gì và chúng có vai trò gì?

<details>
<summary>Đáp án</summary>

Ngay khi Pod được đánh dấu `Terminating`, hai luồng độc lập bắt đầu chạy song song:
- **Luồng Control Plane**: Đánh giá và gỡ Pod đang tắt khỏi các đối tượng `EndpointSlice` của Service. Các terminating endpoint được gán `ready: false` để load balancer (`kube-proxy`/Ingress) ngừng điều hướng traffic mới tới Pod này.
- **Luồng Worker Node (Kubelet)**: Kubelet trên node lập tức kích hoạt quy trình tắt cục bộ của Pod (đếm ngược grace period, chạy `preStop` hook nếu có, rồi gửi `SIGTERM` tới PID 1).
</details>

### Câu Hỏi 4: `preStop` hook hoạt động theo cơ chế nào (đồng bộ hay bất đồng bộ) và điều kiện nào để nó được thực thi?

<details>
<summary>Đáp án</summary>

- **Điều kiện thực thi**: Container phải khai báo `preStop` hook và giá trị `terminationGracePeriodSeconds` của Pod phải khác `0`.
- **Cơ chế hoạt động**: `preStop` hook chạy **đồng bộ** (synchronous) trong container và bắt buộc phải hoàn tất trước khi kubelet kích hoạt container runtime gửi tín hiệu `SIGTERM` tới ứng dụng.
- **Cách dùng phổ biến**: Kỹ sư thường cấu hình `preStop: exec` để chạy shell command dọn dẹp hoặc trì hoãn quá trình gửi `SIGTERM`.
</details>

### Câu Hỏi 5: Điều gì xảy ra nếu `preStop` hook bị treo hoặc chạy vượt quá `terminationGracePeriodSeconds`?

<details>
<summary>Đáp án</summary>

- Nếu `preStop` hook bị treo, Pod sẽ giữ nguyên ở phase `Terminating` cho tới khi hết thời gian `terminationGracePeriodSeconds`.
- Nếu `preStop` hook vẫn đang chạy tại thời điểm grace period vừa hết hạn, kubelet sẽ yêu cầu thêm **một khoảng gia hạn nhỏ duy nhất là 2 giây**.
- Sau khoảng gia hạn này, nếu container vẫn chưa thoát, container runtime sẽ gửi tín hiệu `SIGKILL` để cưỡng chế tắt toàn bộ tiến trình còn lại.
</details>

### Câu Hỏi 6: Khi nào cần điều chỉnh `terminationGracePeriodSeconds` và cần thiết lập giá trị này như thế nào?

<details>
<summary>Đáp án</summary>

Mặc định `terminationGracePeriodSeconds` là **30 giây**. Nếu `preStop` hook hoặc quá trình dọn dẹp của ứng dụng cần nhiều thời gian hơn mức mặc định (ví dụ app cần 40 giây để xả buffer hoặc hoàn tất giao dịch cơ sở dữ liệu), bạn bắt buộc phải tăng `terminationGracePeriodSeconds` trong Pod `spec`.

Nguyên tắc thiết lập là `terminationGracePeriodSeconds` phải **lớn hơn tổng thời gian chạy của `preStop` cộng với thời gian dọn dẹp thực tế của ứng dụng** (ví dụ: đặt `45` giây cho 5 giây `preStop` + 35 giây dọn dẹp app) để tránh bị `SIGKILL` ngắt giữa chừng.
</details>

### Câu Hỏi 7: Vì sao khi Rolling Update, ứng dụng đã xử lý `SIGTERM` nhưng client vẫn có thể gặp lỗi `502 Bad Gateway` hoặc `Connection Refused`? Cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân (Race Condition)**: Luồng gỡ `EndpointSlice` trên Control Plane/cập nhật bảng định tuyến (`iptables`/`kube-proxy`/Ingress) cần có độ trễ mạng nhất định để lan truyền tới các node. Trong khi đó, nếu không có `preStop`, kubelet gửi `SIGTERM` tới PID 1 gần như tức thì. Nếu ứng dụng đóng listening socket ngay khi nhận `SIGTERM`, các request đang bay tới IP cũ trong khoảng trễ mạng sẽ bị từ chối, gây ra lỗi `Connection Refused` hoặc `502 Bad Gateway`.
- **Giải pháp**: Thêm `preStop` sleep (ví dụ `preStop: exec: command: ["/bin/sh", "-c", "sleep 5"]`, khoảng 5–10 giây). Hook này giữ chân kubelet chưa gửi `SIGTERM` vội, giúp ứng dụng tiếp tục nhận và xử lý nốt các request đang bay trong khi hệ thống mạng hoàn tất việc gỡ IP khỏi `EndpointSlice`.
</details>

### Câu Hỏi 8: Sự khác biệt cốt lõi giữa tín hiệu `SIGTERM` và `SIGKILL` trong chuẩn POSIX Linux là gì?

<details>
<summary>Đáp án</summary>

- **`SIGTERM` (Signal 15)**: Là tín hiệu dừng mềm chuẩn. Ứng dụng có thể bắt (`catch`) tín hiệu này để chủ động ngừng nhận kết nối mới, hoàn tất công việc dở dang và giải phóng tài nguyên trước khi tự thoát.
- **`SIGKILL` (Signal 9)**: Là tín hiệu cưỡng chế từ nhân Linux (kernel). Tiến trình **không thể bắt, chặn hay bỏ qua** (`cannot be caught, blocked, or ignored`), dẫn tới việc tiến trình bị tiêu diệt ngay lập tức mà không có cơ hội dọn dẹp.
</details>

### Câu Hỏi 9: Công thức tính mã thoát (exit code) của tiến trình khi bị kết thúc bởi signal trong Linux/Bash là gì, và sự khác nhau giữa Exit Code `143` và `137`?

<details>
<summary>Đáp án</summary>

Trong Linux và Bash, khi một lệnh/tiến trình bị hủy bởi fatal signal số hiệu $N$, mã thoát được tính theo công thức **`128 + N`**:
- **Exit code `143` (`128 + 15`)**: Tiến trình tắt theo `SIGTERM` (Signal 15). Đây là dấu hiệu tắt mềm chuẩn mực, có kiểm soát.
- **Exit code `137` (`128 + 9`)**: Tiến trình bị tiêu diệt cưỡng chế bởi `SIGKILL` (Signal 9). Nguyên nhân thường là do Pod hết thời gian `terminationGracePeriodSeconds` mà chưa tự thoát, hoặc bị **Linux OOM Killer** (hết bộ nhớ) kết thúc.
</details>

### Câu Hỏi 10: Vì sao một ứng dụng (ví dụ Java) đã viết shutdown hook đầy đủ nhưng khi xóa Pod vẫn treo đủ 30 giây rồi chết với Exit Code `137`? Khắc phục thế nào?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Kubelet chỉ gửi tín hiệu `SIGTERM` tới tiến trình mang **PID 1** của container. Nếu Dockerfile dùng shell wrapper (như `ENTRYPOINT ./run.sh`) mà không dùng `exec`, tiến trình shell sẽ giữ PID 1 và thường không chuyển tiếp (forward) tín hiệu `SIGTERM` xuống tiến trình ứng dụng con (ví dụ JVM). Ứng dụng không hay biết mình cần dừng, dẫn đến hết 30 giây grace period và bị runtime gửi `SIGKILL` tiêu diệt (Exit Code `137`), gây mất dữ liệu bộ đệm.
- **Cách khắc phục**:
  - Sử dụng dạng JSON exec array trong Dockerfile (ví dụ: `ENTRYPOINT ["java", "-jar", "app.jar"]`) để ứng dụng trực tiếp giữ PID 1.
  - Hoặc thêm từ khóa `exec` trước lệnh khởi chạy ứng dụng bên trong shell script.
</details>

### Câu Hỏi 11: Bạn dùng những lệnh `kubectl` nào để kiểm tra quá trình gỡ `EndpointSlice` và thanh tra `exitCode` của container sau khi tắt Pod?

<details>
<summary>Đáp án</summary>

1. **Theo dõi Pod tắt trong quá trình Rolling Update**:
   ```bash
   kubectl get pods -n production -w
   ```
2. **Quan sát `EndpointSlice` đặt trạng thái `ready: false` cho Pod đang tắt**:
   ```bash
   kubectl get endpointslices -l kubernetes.io/service-name=web-api -n production -o wide
   ```
3. **Thanh tra `exitCode` của các container đã dừng** (để xác nhận thoát êm `143`/`0` hay bị kill `137`):
   ```bash
   kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[*].state.terminated.exitCode}{"\n"}{end}'
   ```
</details>
