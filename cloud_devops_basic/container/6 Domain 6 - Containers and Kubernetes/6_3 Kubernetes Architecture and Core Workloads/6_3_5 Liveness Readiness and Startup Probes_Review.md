# Ôn Tập: 6_3_5 Liveness Readiness and Startup Probes

### Câu Hỏi 1: Container Probe trong Kubernetes là gì, do thành phần nào thực hiện và gồm những loại nào?

<details>
<summary>Đáp án</summary>

- **Bản chất**: Probe là phép chẩn đoán do **kubelet** thực hiện định kỳ trên container thông qua việc thực thi lệnh hoặc gửi request mạng dựa theo khai báo trong Pod spec.
- **3 loại probe**: Kubernetes phân tách thành ba loại độc lập theo mục đích sử dụng:
  1. `startupProbe`
  2. `livenessProbe`
  3. `readinessProbe`
</details>

---

### Câu Hỏi 2: `startupProbe` có mục đích gì và bảo vệ container khởi động chậm bằng cơ chế nào?

<details>
<summary>Đáp án</summary>

- **Mục đích**: Xác nhận ứng dụng bên trong container đã khởi động thành công.
- **Cơ chế che chắn**: Khi `startupProbe` được khai báo, kubelet sẽ tạm ngừng thực thi `livenessProbe` và `readinessProbe` cho đến khi `startupProbe` thành công. Nhờ đó, ứng dụng có đủ thời gian hoàn tất khởi tạo mà không bị `livenessProbe` kill nhầm hay bị `readinessProbe` thăm dò quá sớm.
- Ngay khi `startupProbe` thành công, nó dừng chạy và `livenessProbe` cùng `readinessProbe` được kích hoạt song song.
</details>

---

### Câu Hỏi 3: Khi `startupProbe` thất bại vượt ngưỡng, kubelet xử lý ra sao và cần tính thời gian khởi động tối đa của `startupProbe` như thế nào?

<details>
<summary>Đáp án</summary>

- **Khi thất bại vượt ngưỡng (`failureThreshold`)**: Kubelet sẽ tiêu diệt (kill) container và áp dụng chính sách `restartPolicy` của Pod.
- **Cách tính thời gian**: Cần đặt tích `failureThreshold * periodSeconds` đủ lớn để bao quát toàn bộ thời gian khởi động tối đa của ứng dụng (ví dụ: `failureThreshold: 30` và `periodSeconds: 10` cho phép tối đa `30 * 10 = 300` giây để khởi động).
</details>

---

### Câu Hỏi 4: `livenessProbe` dùng để giải quyết bài toán nào và hành vi của kubelet là gì khi `livenessProbe` thất bại?

<details>
<summary>Đáp án</summary>

- **Mục đích**: Xác định thời điểm cần khởi động lại container, đặc biệt để phát hiện lỗi bế tắc (**deadlock**) khi tiến trình vẫn còn sống nhưng đã bị tê liệt, không thể xử lý công việc.
- **Hành vi khi thất bại**: Nếu số lần thất bại liên tiếp vượt quá `failureThreshold`, kubelet sẽ trực tiếp khởi động lại (**restart**) container đó cục bộ.
- **Phạm vi tác động**: `livenessProbe` chỉ kích hoạt restart container cục bộ, không can thiệp trực tiếp vào việc gỡ Service endpoint.
</details>

---

### Câu Hỏi 5: `readinessProbe` hoạt động như thế nào trong suốt vòng đời container khi thất bại và khi khôi phục?

<details>
<summary>Đáp án</summary>

- **Mục đích**: Xác định thời điểm container sẵn sàng tiếp nhận lưu lượng mạng (traffic).
- **Khi thất bại**: **EndpointSlice controller** gỡ địa chỉ IP của Pod khỏi `EndpointSlice` của mọi Service liên kết để ngừng điều hướng traffic tới Pod. Kubelet **không restart** container; tiến trình bên trong vẫn tiếp tục chạy bình thường.
- **Vòng đời & khôi phục**: `readinessProbe` chạy định kỳ suốt vòng đời container. Khi probe thành công trở lại, IP của Pod sẽ được thêm lại vào `EndpointSlice` để tiếp tục nhận traffic.
</details>

---

### Câu Hỏi 6: Sự khác biệt cốt lõi giữa `livenessProbe` và `readinessProbe` là gì, và vì sao nên chạy song song cả hai trên cùng một container?

<details>
<summary>Đáp án</summary>

- **Khác biệt cốt lõi**:
  - `livenessProbe` kiểm tra tình trạng sống/deadlock nội tại của tiến trình; khi fail sẽ **restart container**.
  - `readinessProbe` kiểm tra khả năng sẵn sàng nhận traffic; khi fail chỉ **gỡ IP Pod khỏi EndpointSlice** của Service và **giữ nguyên container đang chạy**.
- **Lý do phối hợp song song**: `readinessProbe` và `livenessProbe` có thể chạy song song độc lập trên cùng một container. Sự kết hợp này vừa giúp ngăn traffic đi vào Pod khi chưa sẵn sàng hoặc đang quá tải tạm thời, vừa đảm bảo tự động phục hồi (restart) container nếu tiến trình bị chết hoặc deadlock.
</details>

---

### Câu Hỏi 7: Kubernetes hỗ trợ 4 cơ chế thăm dò (Probe Handlers) nào và tiêu chí xác định healthy/failure của từng loại là gì?

<details>
<summary>Đáp án</summary>

1. **`httpGet`**: Gửi HTTP GET request tới `path` và `port` chỉ định của container để kiểm tra phản hồi HTTP.
2. **`tcpSocket`**: Mở kết nối socket tới cổng TCP chỉ định; kết nối thành công là healthy, thất bại là failure.
3. **`exec`**: Thực thi một lệnh tùy ý bên trong container; mã thoát (exit code) bằng `0` là healthy, khác `0` là failure.
4. **`grpc`**: Gửi yêu cầu kiểm tra theo chuẩn `gRPC HealthCheckRequest` thông qua gRPC Health Checking Protocol tới `port` chỉ định.
</details>

---

### Câu Hỏi 8: Trình bày ý nghĩa, giá trị mặc định và giới hạn của 5 tham số điều khiển Probe?

<details>
<summary>Đáp án</summary>

| Tham số | Ý nghĩa kỹ thuật | Mặc định | Giới hạn |
| :--- | :--- | :--- | :--- |
| `initialDelaySeconds` | Số giây chờ trước khi kích hoạt probe lần đầu | `0` | Không âm (`>= 0`) |
| `periodSeconds` | Chu kỳ tần suất thăm dò tính bằng giây | `10` giây | Tối thiểu `1` |
| `timeoutSeconds` | Số giây chờ phản hồi trước khi tính là timeout | `1` giây | Tối thiểu `1` |
| `failureThreshold` | Số lần thất bại liên tiếp trước khi coi là failed | `3` lần | Tối thiểu `1` |
| `successThreshold` | Số lần thành công liên tiếp để coi là khôi phục | `1` lần | Bắt buộc bằng `1` cho `livenessProbe` và `startupProbe`; `>= 1` cho `readinessProbe` |
</details>

---

### Câu Hỏi 9: Ràng buộc giá trị của tham số `successThreshold` khác nhau như thế nào giữa `livenessProbe`/`startupProbe` và `readinessProbe`?

<details>
<summary>Đáp án</summary>

- Đối với `livenessProbe` và `startupProbe`, `successThreshold` **bắt buộc phải bằng `1`** (vì chỉ cần 1 lần thành công là xác nhận tiến trình sống/khởi động xong).
- Đối với `readinessProbe`, `successThreshold` có mặc định là `1` nhưng có thể cấu hình lớn hơn hoặc bằng `1` (ví dụ yêu cầu nhiều lần thành công liên tiếp trước khi thêm lại IP vào `EndpointSlice`).
</details>

---

### Câu Hỏi 10: Trong manifest Deployment có khai báo đủ cả `startupProbe`, `livenessProbe` và `readinessProbe`, luồng thực thi diễn ra theo thứ tự nào?

<details>
<summary>Đáp án</summary>

1. Khi container bắt đầu chạy, kubelet kiểm tra xem có `startupProbe` hay không.
2. Vì có `startupProbe`, kubelet **chỉ chạy `startupProbe`** theo chu kỳ `periodSeconds`, đồng thời hoãn `livenessProbe` và `readinessProbe`.
3. Nếu `startupProbe` thất bại liên tiếp đạt `failureThreshold`, kubelet kill container theo `restartPolicy`.
4. Nếu `startupProbe` thành công, `startupProbe` kết thúc và kubelet kích hoạt **vòng lặp giám sát song song** cho cả `livenessProbe` và `readinessProbe`.
5. Trong vòng lặp song song: `livenessProbe` fail quá `failureThreshold` sẽ restart container; `readinessProbe` fail quá `failureThreshold` sẽ khiến EndpointSlice gỡ IP Pod nhưng container vẫn chạy tiếp.
</details>

---

### Câu Hỏi 11: Những câu lệnh `kubectl` nào được dùng để kiểm tra trạng thái probe, Events, EndpointSlice và test trực tiếp endpoint của Pod?

<details>
<summary>Đáp án</summary>

1. **Xem trạng thái `READY` và `RESTARTS` của Pod**:
   ```bash
   kubectl get pods -l app=order-service -o wide
   ```
2. **Xem chi tiết cấu hình Probes và Events**:
   ```bash
   kubectl describe pod <pod-name> | grep -E "Liveness|Readiness|Startup|Events:" -A 10
   ```
3. **Xem danh sách IP đang có trong `EndpointSlice`**:
   ```bash
   kubectl get endpointslices -l kubernetes.io/service-name=order-service -o yaml
   ```
4. **Kiểm tra phản hồi HTTP trực tiếp qua `port-forward`**:
   ```bash
   kubectl port-forward pod/<pod-name> 8080:8080 &
   curl -i http://localhost:8080/healthz/liveness
   ```
</details>

---

### Câu Hỏi 12: Hiện tượng "Cascading Failure" xảy ra thế nào khi `livenessProbe` kiểm tra Database ngoại vi, và giải pháp chuẩn là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế gây sập dây chuyền**:
  1. Database ngoại vi bị quá tải tạm thời, khiến endpoint kiểm tra phản hồi chậm vượt quá `timeoutSeconds`.
  2. `livenessProbe` của toàn bộ các Pod đồng loạt thất bại vượt ngưỡng `failureThreshold`.
  3. Kubelet trên toàn cụm đồng loạt restart tất cả các container ứng dụng.
  4. Hàng loạt container khởi động lại cùng lúc và ồ ạt gửi truy vấn kết nối lại vào Database (**thundering herd**), làm Database sập hoàn toàn.
- **Giải pháp chuẩn**: `livenessProbe` chỉ được kiểm tra trạng thái **nội tại** của tiến trình (phát hiện deadlock). Việc kiểm tra phụ thuộc tài nguyên ngoài (như Database) phải đặt ở **`readinessProbe`** để chỉ tạm ngắt lưu lượng vào Pod mà không restart container.
</details>

---

### Câu Hỏi 13: Tại sao không nên chỉ tăng `initialDelaySeconds` của `livenessProbe` mà nên dùng `startupProbe` cho ứng dụng khởi động chậm (như Java)?

<details>
<summary>Đáp án</summary>

- Nếu chỉ dùng `livenessProbe`:
  - Đặt `initialDelaySeconds` quá ngắn: kubelet thăm dò trước khi app khởi động xong, kill container liên tục và đẩy Pod vào vòng lặp `CrashLoopBackOff`.
  - Đặt `initialDelaySeconds` quá dài (ví dụ `90s` cho app thường khởi động `60s`): nếu container bị crash hoặc deadlock ngay ở giây thứ 5, kubelet vẫn phải chờ hết 90 giây mới phát hiện và can thiệp; mặt khác nếu app hôm đó khởi động chậm đột xuất lên 95 giây thì vẫn bị kill ở giây thứ 90.
- **Ưu thế của `startupProbe`**: `startupProbe` che chắn cả `livenessProbe` và `readinessProbe` với quỹ thời gian `failureThreshold * periodSeconds` đủ lớn. Ngay khi app khởi động xong sớm hơn mức tối đa, `startupProbe` pass và kích hoạt `livenessProbe` cùng `readinessProbe` ngay lập tức.
</details>

---

### Câu Hỏi 14: Nguyên nhân gây ra hiện tượng "Flapping Traffic" ở `readinessProbe` là gì và cần cấu hình tham số thế nào để ổn định?

<details>
<summary>Đáp án</summary>

- **Hiện tượng & Nguyên nhân**: Khi có đột biến lưu lượng, Pod liên tục bị thêm vào rồi lại gỡ khỏi `EndpointSlice`. Nguyên nhân là đặt `timeoutSeconds: 1` và `failureThreshold: 1` cho `readinessProbe` — chỉ cần một nhịp trễ nhỏ là Pod lập tức bị ngắt lưu lượng.
- **Giải pháp**: Thiết lập `failureThreshold: 2-3` kết hợp `timeoutSeconds: 2-3` để tạo độ dung sai ổn định trước các dao động ngắn hạn.
</details>

---

### Câu Hỏi 15: Dùng `exec` handler cho probe có thể gây ra rủi ro tài nguyên gì trên node và giải pháp thay thế khuyến nghị là gì?

<details>
<summary>Đáp án</summary>

- **Rủi ro tài nguyên**: Mỗi lần chạy `exec` probe, kubelet phải tạo (fork) một tiến trình mới bên trong container. Nếu `periodSeconds` đặt quá dày trên nhiều container, hệ thống có thể bị cạn kiệt PID hoặc tăng đột biến tải CPU trên node.
- **Giải pháp khuyến nghị**: Ưu tiên sử dụng các probe qua kết nối mạng nhẹ nhàng hơn như `httpGet`, `tcpSocket` hoặc `grpc` thay vì tạo tiến trình bằng `exec`.
</details>
