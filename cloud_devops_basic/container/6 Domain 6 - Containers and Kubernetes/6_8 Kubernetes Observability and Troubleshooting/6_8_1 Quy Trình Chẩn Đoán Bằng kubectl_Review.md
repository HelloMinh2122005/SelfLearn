# Ôn Tập: 6_8_1 Quy Trình Chẩn Đoán Bằng kubectl

### Câu Hỏi 1: Tại sao khi ứng dụng trên Kubernetes gặp sự cố, kỹ sư không nên xóa hoặc khởi động lại Pod ngay lập tức?

<details>
<summary>Đáp án</summary>

Việc xóa Pod vội vã sẽ làm mất dấu vết hiện trường để điều tra nguyên nhân gốc rễ. Khi Pod bị xóa, ReplicaSet sẽ tạo một Pod mới (có thể trên một Node khác), khiến thông tin trong `Last State` của Pod cũ bị mất và cờ `--previous` trong `kubectl logs` không còn đọc được log lỗi của chu kỳ chạy trước đó. Do đó, kỹ sư cần thu thập đầy đủ bằng chứng từ trên xuống trước khi can thiệp.
</details>

---

### Câu Hỏi 2: Quy trình chẩn đoán sự cố Kubernetes từ trên xuống (top-down) gồm 5 tầng nào và mỗi tầng kiểm tra nội dung gì?

<details>
<summary>Đáp án</summary>

Quy trình chẩn đoán từ trên xuống bắt đầu từ hạ tầng định tuyến và phát hành cấp cao rồi mới đi sâu xuống container và ứng dụng, gồm 5 tầng theo thứ tự:

1. **Tầng Điều Phối & Phát Hành** (Ingress, Service, Helm): Xác nhận tiến trình rollout và trạng thái phát hành bản dựng.
2. **Tầng Workload Controllers** (Deployment, ReplicaSet): So sánh số lượng bản sao mong muốn và bản sao thực tế đang sẵn sàng.
3. **Tầng Pod & Lập Lịch**: Kiểm tra việc phân bổ Node và các điều kiện trong `status.conditions`.
4. **Tầng Container & Runtime**: Phân tích mã thoát `exitCode` và lý do dừng trong `terminated`.
5. **Tầng Ứng Dụng**: Kiểm tra luồng log chuẩn `stdout`/`stderr` cùng các kết nối phụ thuộc nội bộ.
</details>

---

### Câu Hỏi 3: Theo sơ đồ luồng chẩn đoán, khi kiểm tra Pod và thấy các trạng thái `Pending`, `CrashLoopBackOff` hoặc `Not Ready`, bạn cần tập trung điều tra hướng nào?

<details>
<summary>Đáp án</summary>

Tùy vào trạng thái quan sát được ở tầng Pod, luồng chẩn đoán đi theo các nhánh tương ứng:

- **`Pending`**: Kiểm tra phần `Events` để tìm nguyên nhân Pod chưa được lập lịch (ví dụ: thiếu tài nguyên, `taint`).
- **`CrashLoopBackOff`**: Kiểm tra `Last State` và đọc `kubectl logs --previous`. Nếu cần vào bên trong để chẩn đoán sâu hơn, dùng `kubectl exec -it` (nếu container có shell) hoặc dùng `kubectl debug` với ephemeral container (nếu là image `distroless`).
- **`Not Ready`**: Kiểm tra `status.conditions` và cấu hình `readiness probes`.
</details>

---

### Câu Hỏi 4: Lệnh `kubectl get pods -o wide` cung cấp thêm những thông tin mở rộng nào so với `kubectl get pods` mặc định?

<details>
<summary>Đáp án</summary>

Khi thêm cờ `-o wide`, lệnh `kubectl get pods` hiển thị thêm các thông tin quan trọng phục vụ khoanh vùng sự cố:

- Địa chỉ IP của Pod.
- Node mà Pod được gán lập lịch.
- Trạng thái sẵn sàng (`Readiness Gates`).
- Số lần khởi động lại (`Restarts`).
</details>

---

### Câu Hỏi 5: Lệnh `kubectl describe pod <pod-name>` và `kubectl get events --sort-by=.lastTimestamp` giúp thu thập những thông tin gì?

<details>
<summary>Đáp án</summary>

- **`kubectl describe pod <pod-name>`**: Trích xuất chi tiết cấu hình Pod, phần `Events` ghi nhận các thông điệp từ `scheduler` và `kubelet`, cùng khối `State` và `Last State` của từng container.
- **`kubectl get events --sort-by=.lastTimestamp`**: Liệt kê toàn bộ sự kiện trong namespace và sắp xếp theo thứ tự thời gian tăng dần dựa trên mốc thời gian gần nhất (`lastTimestamp`), giúp theo dõi chính xác trình tự diễn biến sự cố.
</details>

---

### Câu Hỏi 6: Trong lệnh `kubectl logs`, ba tùy chọn `-c <container-name>`, `--previous` (`-p`), và `-l <selector> --prefix` được dùng để giải quyết tình huống nào?

<details>
<summary>Đáp án</summary>

- **`-c <container-name>`**: Chỉ định rõ tên container cần xem log trong một Pod có nhiều container (multi-container Pod).
- **`--previous` (hoặc `-p`)**: Đọc luồng log của container ở chu kỳ chạy trước đó, rất hữu ích ngay sau khi container bị crash hoặc restart để thấy thông báo lỗi trước khi dừng.
- **`-l <selector> --prefix`**: Gom log từ nhiều Pod có cùng nhãn (label) khớp với selector và tự động gắn tiền tố tên Pod vào đầu mỗi dòng log để dễ phân biệt nguồn log.
</details>

---

### Câu Hỏi 7: Phân biệt mục đích sử dụng của `kubectl exec -it` và `kubectl port-forward`.

<details>
<summary>Đáp án</summary>

- **`kubectl exec -it <pod-name> -c <container-name> -- <command>`**: Khởi tạo một phiên dòng lệnh tương tác trực tiếp bên trong một container đang chạy (ví dụ mở `/bin/sh`) để kiểm tra môi trường thực thi bên trong container.
- **`kubectl port-forward pod/<pod-name> <local-port>:<pod-port>`**: Thiết lập đường hầm chuyển tiếp cổng từ máy trạm trực tiếp tới cổng mạng của Pod, giúp kiểm thử hoặc truy cập dịch vụ trong Pod mà không cần phơi lộ Service ra ngoài.
</details>

---

### Câu Hỏi 8: Lệnh `kubectl top pods` và `kubectl top nodes` dựa vào thành phần nào để hoạt động và có những hạn chế nào cần lưu ý trong production?

<details>
<summary>Đáp án</summary>

Hai lệnh này thu thập chỉ số tiêu thụ CPU và Memory tức thời thông qua Metrics API do thành phần `metrics-server` cung cấp.

Hai lưu ý thực tế cần tránh:
1. Lệnh sẽ trả về lỗi nếu cụm Kubernetes chưa triển khai `metrics-server`.
2. Công cụ này chỉ đo mức sử dụng tức thời tại thời điểm gọi, không lưu trữ lịch sử và không thay thế cho các hệ thống giám sát chuyên sâu như Prometheus.
</details>

---

### Câu Hỏi 9: Hãy liệt kê 4 điều kiện cốt lõi trong `status.conditions` của Pod và giải thích ý nghĩa kỹ thuật của từng điều kiện.

<details>
<summary>Đáp án</summary>

Mảng `status.conditions` phản ánh vòng đời của Pod qua 4 điều kiện cốt lõi (giá trị mong muốn là `True`):

1. **`PodScheduled`**: Scheduler đã phân bổ Pod vào một Node đáp ứng đủ yêu cầu tài nguyên.
2. **`Initialized`**: Tất cả init containers đã hoàn thành thành công mà không gặp lỗi.
3. **`ContainersReady`**: Toàn bộ container ứng dụng trong Pod đã vượt qua kiểm tra readiness probe.
4. **`Ready`**: Pod hoàn toàn sẵn sàng nhận lưu lượng truy cập từ Service endpoints.
</details>

---

### Câu Hỏi 10: Vì sao một Pod có thể hiển thị `ContainersReady = True` nhưng `Ready = False`, và điều này gây ra hệ quả gì?

<details>
<summary>Đáp án</summary>

`ContainersReady = True` chỉ có nghĩa là toàn bộ container trong Pod đã vượt qua readiness probe. Tuy nhiên, Pod vẫn có thể nhận `Ready = False` nếu chưa vượt qua các tiêu chí kiểm tra bổ sung được cấu hình trong `readiness gates`.

**Hệ quả trực tiếp**: Khi `Ready = False`, Pod chưa đủ điều kiện tiếp nhận traffic mạng, nên endpoint controller sẽ không đưa (hoặc loại bỏ) Pod khỏi danh sách Endpoints của Service. Người dùng/client sẽ không được điều phối lưu lượng tới Pod này.
</details>

---

### Câu Hỏi 11: Trường `containerStatuses[].lastState.terminated` lưu trữ thông tin gì và làm sao trích xuất nhanh `exitCode` bằng `kubectl`?

<details>
<summary>Đáp án</summary>

Cấu trúc `containerStatuses[].lastState.terminated` ghi lại thông tin về lần dừng gần nhất trước đó của container, đặc biệt là nguyên nhân tắt qua chuỗi `reason` (ví dụ `OOMKilled`, `Error`) và mã thoát số nguyên `exitCode` (kèm `containerID`, `startedAt`, `finishedAt`).

Để lấy nhanh `exitCode` mà không cần duyệt toàn bộ file YAML, ta sử dụng JSONPath:

```bash
kubectl get pod <pod-name> -o jsonpath='{.status.containerStatuses[*].lastState.terminated.exitCode}'
```
</details>

---

### Câu Hỏi 12: Ephemeral container là gì, có những đặc điểm giới hạn nào, và cần quyền RBAC gì để chạy `kubectl debug`?

<details>
<summary>Đáp án</summary>

Ephemeral containers là các container tạm thời được khai báo trong trường `ephemeralContainers` của Pod nhằm phục vụ việc chẩn đoán trực tiếp trên Pod đang chạy.

**Các giới hạn kỹ thuật của ephemeral container**:
- Không hỗ trợ cấu hình cổng mạng.
- Không có probes (liveness/readiness/startup probes).
- Không tự động khởi động lại khi kết thúc.

**Yêu cầu RBAC**: Tài khoản thực thi lệnh `kubectl debug` bắt buộc phải có quyền tương tác với tài nguyên con `pods/ephemeralcontainers`.
</details>

---

### Câu Hỏi 13: Khi container ứng dụng dùng base image `distroless` (không có shell), lệnh `kubectl debug` với cờ `--target` giúp chẩn đoán như thế nào?

<details>
<summary>Đáp án</summary>

Với Pod dùng image `distroless`, lệnh `kubectl exec` không thể mở shell vì bên trong không có `/bin/sh` hay các tiện ích mạng. Thay vào đó, ta dùng:

```bash
kubectl debug -it <target-pod> --image=nicolaka/netshoot --target=<container-name>
```

Lệnh này chèn một ephemeral container chứa đầy đủ công cụ debug (như `nicolaka/netshoot`) vào Pod đang chạy mà không làm thay đổi hay khởi động lại container chính. Cờ `--target=<container-name>` cho phép ephemeral container chia sẻ không gian tiến trình (process namespace) với container mục tiêu để quan sát tiến trình và kiểm tra kết nối mạng (ví dụ dùng `nslookup`).
</details>

---

### Câu Hỏi 14: Cờ `--copy-to=<new-pod>` trong `kubectl debug` dùng để làm gì và khi nào nên áp dụng?

<details>
<summary>Đáp án</summary>

Cờ `--copy-to=<new-pod>` tạo ra một bản sao mới của Pod để người vận hành có thể thay đổi câu lệnh khởi chạy (ví dụ chuyển sang `-- sh`), thay đổi biến môi trường hoặc đổi container image mà không làm ảnh hưởng đến Pod gốc.

Cách này phù hợp khi Pod gốc bị crash ngay khi khởi động hoặc bạn cần thử nghiệm thay đổi cấu hình khởi chạy của container để điều tra nguyên nhân lỗi.
</details>

---

### Câu Hỏi 15: Lệnh `kubectl debug node/<node-name> -it --image=<debug-image>` hoạt động theo cơ chế nào?

<details>
<summary>Đáp án</summary>

Khi cần chẩn đoán trực tiếp ở tầng Node, lệnh `kubectl debug node/<node-name> -it --image=<debug-image>` (ví dụ `--image=busybox`) sẽ khởi tạo một Pod đặc quyền chạy trên Node được chỉ định và gắn kết toàn bộ hệ thống tệp gốc (root filesystem) của Node vào thư mục `/host` bên trong Pod debug đó.
</details>
