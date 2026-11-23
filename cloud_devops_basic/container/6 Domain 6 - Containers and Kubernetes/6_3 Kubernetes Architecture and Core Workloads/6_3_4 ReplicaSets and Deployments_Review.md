# Ôn Tập: 6_3_4 ReplicaSets and Deployments

### Câu Hỏi 1: Vai trò của Deployment, ReplicaSet và Pod là gì, và khi viết manifest Deployment cần khai báo những phần nào?

<details>
<summary>Đáp án</summary>

- **Phân cấp vai trò**:
  - **Pod**: Đơn vị chạy container cơ bản.
  - **ReplicaSet**: Duy trì ổn định số lượng bản sao Pod chạy đúng tại mọi thời điểm.
  - **Deployment**: Tầng trừu tượng hóa trên cùng (`apiVersion: apps/v1`, `kind: Deployment`, khác với Pod là `v1`), quản lý các ReplicaSet con và cung cấp cơ chế cập nhật Pod theo hướng khai báo.
- **Cách khai báo trong manifest**: Trong file YAML của Deployment, bạn chỉ khai báo **1 đối tượng Deployment duy nhất** (không viết riêng `ReplicaSet` hay `Pod`). Deployment controller sẽ tự tạo ReplicaSet con dựa trên `spec.replicas`, `spec.selector` và `spec.template` (nơi định nghĩa mẫu Pod).
</details>

### Câu Hỏi 2: Tại sao `spec.selector` phải khớp với nhãn của Pod template, và nhãn `pod-template-hash` có tác dụng gì?

<details>
<summary>Đáp án</summary>

- **Khớp `selector` và `template.metadata.labels`**: Khối `spec.selector.matchLabels` dùng để xác định các Pod thuộc quyền quản lý của Deployment/ReplicaSet. Các nhãn này **bắt buộc** phải khớp với nhãn trong `spec.template.metadata.labels`; nếu không khớp, API server sẽ từ chối manifest.
- **Tác dụng của `pod-template-hash`**: Deployment controller tự động băm nội dung `PodTemplate` thành mã định danh ngắn và gắn vào nhãn `pod-template-hash` trên từng ReplicaSet con (cũng như selector của nó). Nhờ đó, các ReplicaSet phiên bản cũ và mới không bị trùng lặp selector hay giành giật Pod của nhau. Người dùng không tự viết và không sửa nhãn này.
</details>

### Câu Hỏi 3: Khi nào Deployment kích hoạt một rollout mới? Việc thay đổi `spec.replicas` hoặc `metadata.annotations` có tạo revision mới không?

<details>
<summary>Đáp án</summary>

- **Điều kiện kích hoạt rollout**: Một rollout (tạo ReplicaSet mới / revision mới) **chỉ kích hoạt khi và chỉ khi** phần mẫu Pod (`.spec.template`) thay đổi (ví dụ: đổi tag image).
- **Thay đổi `spec.replicas`**: Chỉ thực hiện scale tăng hoặc giảm số lượng Pod trên ReplicaSet hiện tại, **không** kích hoạt rollout mới và không sinh revision mới.
- **Thay đổi `metadata.annotations` của Deployment** (ví dụ: `kubernetes.io/change-cause`): Do nằm bên ngoài `.spec.template` nên chỉ sửa annotation này cũng **không** kích hoạt rollout.
</details>

### Câu Hỏi 4: Chiến lược `RollingUpdate` và `Recreate` trong `.spec.strategy.type` khác nhau như thế nào? Khi nào bắt buộc phải dùng `Recreate`?

<details>
<summary>Đáp án</summary>

- **`RollingUpdate` (Mặc định)**: Cập nhật cuốn chiếu bằng cách tăng dần Pod ở ReplicaSet mới và giảm dần Pod ở ReplicaSet cũ theo cấu hình `maxSurge` và `maxUnavailable`, giúp ứng dụng duy trì hoạt động liên tục (zero-downtime).
- **`Recreate`**: Tắt và chờ xóa sạch hoàn toàn toàn bộ Pod của bản cũ trước khi tạo bất kỳ Pod nào thuộc revision mới, do đó gây gián đoạn dịch vụ hoàn toàn (downtime).
- **Khi nào bắt buộc dùng `Recreate`**: Khi cơ sở dữ liệu có thay đổi schema phá vỡ tính tương thích ngược, không cho phép hai phiên bản code cũ và mới đọc/ghi dữ liệu đồng thời.
</details>

### Câu Hỏi 5: Trong chiến lược `RollingUpdate`, hai tham số `maxSurge` và `maxUnavailable` có ý nghĩa, giá trị mặc định và cách tính như thế nào?

<details>
<summary>Đáp án</summary>

- **`maxSurge`** (mặc định **25%**): Số lượng hoặc tỉ lệ phần trăm Pod tối đa có thể tạo **vượt mức** `spec.replicas` mong muốn trong quá trình cập nhật (giá trị phần trăm được **làm tròn lên**). Ví dụ: với `replicas: 4` và `maxSurge: 25%`, hệ thống được tạo thừa tối đa `4 × 25% = 1` Pod, tức tổng số Pod tối đa là 5.
- **`maxUnavailable`** (mặc định **25%**): Số lượng hoặc tỉ lệ phần trăm Pod tối đa có thể **không khả dụng** trong quá trình cập nhật (giá trị phần trăm được **làm tròn xuống**). Ví dụ: với `replicas: 4` và `maxUnavailable: 25%`, hệ thống được thiếu tối đa `4 × 25% = 1` Pod, tức luôn duy trì tối thiểu 3 Pod phục vụ.
</details>

### Câu Hỏi 6: Tại sao không thể cấu hình đồng thời `maxSurge: 0` và `maxUnavailable: 0`?

<details>
<summary>Đáp án</summary>

- API server sẽ từ chối cấu hình này vì hai điều kiện mâu thuẫn nhau và gây bế tắc hoàn toàn cho quá trình rollout:
  - `maxSurge: 0` cấm tạo thêm Pod mới trước khi giảm Pod cũ.
  - `maxUnavailable: 0` cấm xóa Pod cũ trước khi có Pod mới sẵn sàng thay thế.
- **Thực tiễn**: Cần đảm bảo ít nhất một trong hai giá trị phải lớn hơn `0` (chuẩn phổ biến là giữ mặc định `25%` cho cả hai).
</details>

### Câu Hỏi 7: Tham số `minReadySeconds` dùng để làm gì, giá trị mặc định là bao nhiêu và nên cấu hình thế nào trong thực tế?

<details>
<summary>Đáp án</summary>

- **Ý nghĩa**: `minReadySeconds` quy định số giây tối thiểu một Pod mới phải duy trì trạng thái `Ready` (không bị crash) để được Deployment controller coi là khả dụng (`available`).
- **Giá trị mặc định**: `0` giây.
- **Vấn đề khi để mặc định `0`**: Ngay khi probe vừa báo pass, controller coi Pod mới là khả dụng và xóa ngay Pod cũ. Điều này có thể cắt lưu lượng quá nhanh khi ứng dụng vừa lên vẫn đang nạp cache hoặc vừa báo Ready xong lại sập, gây gián đoạn dịch vụ.
- **Thực tiễn**: Nên khai báo `minReadySeconds` khoảng **10 đến 30 giây** để tạo khoảng đệm an toàn kiểm chứng độ ổn định của Pod mới trước khi tiếp tục thay các Pod cũ.
</details>

### Câu Hỏi 8: Khi rollout bị kẹt vượt quá `progressDeadlineSeconds`, Kubernetes phản ứng ra sao và kỹ sư cần xử lý thế nào?

<details>
<summary>Đáp án</summary>

- **Cấu hình `progressDeadlineSeconds`**: Là số giây tối đa chờ đợi trước khi đánh dấu rollout bị đình trệ (mặc định **600 giây**, và bắt buộc phải lớn hơn `minReadySeconds`).
- **Phản ứng của Kubernetes**: Khi hết hạn, Deployment controller gán condition `type: Progressing`, `status: "False"`, và `reason: ProgressDeadlineExceeded`. Kubernetes **không tự động sửa lỗi hay tự rollback**, mà chỉ ghi nhận trạng thái để con người hoặc công cụ bên ngoài xử lý.
- **Cách xử lý**: Kỹ sư hoặc CI/CD pipeline dùng lệnh `kubectl rollout status --timeout=600s` để phát hiện lỗi timeout, sau đó chủ động chạy `kubectl rollout undo` để quay về phiên bản ổn định trước đó.
</details>

### Câu Hỏi 9: Tham số `revisionHistoryLimit` có vai trò gì và chuyện gì xảy ra nếu đặt bằng `0`?

<details>
<summary>Đáp án</summary>

- **Vai trò**: `revisionHistoryLimit` quy định số lượng ReplicaSet cũ (mỗi ReplicaSet tương ứng một revision) được Deployment giữ lại để phục vụ cho việc rollback. Giá trị mặc định là **10**.
- **Nếu đặt `revisionHistoryLimit: 0`**: Toàn bộ ReplicaSet lịch sử cũ sẽ bị xóa sạch, khiến bạn **không thể thực hiện rollback** về các phiên bản trước đó nữa.
</details>

### Câu Hỏi 10: Làm thế nào để theo dõi tiến trình rollout, xem lịch sử revision và hiển thị nguyên nhân thay đổi trong cột `CHANGE-CAUSE`?

<details>
<summary>Đáp án</summary>

- **Theo dõi tiến trình rollout**: Dùng `kubectl rollout status deployment/<tên-deployment>`.
- **Xem lịch sử các revision**: Dùng `kubectl rollout history deployment/<tên-deployment>` (hoặc thêm `--revision=<số>` để xem chi tiết một revision cụ thể).
- **Hiển thị cột `CHANGE-CAUSE`**: Sử dụng annotation `kubernetes.io/change-cause` trong `metadata.annotations` của Deployment, hoặc cập nhật bằng CLI trước/cùng lúc đổi image:
  ```bash
  kubectl annotate deployment/order-service kubernetes.io/change-cause="Upgrade to v1.4.3" --overwrite
  kubectl set image deployment/order-service app=registry.example.com/order-service:1.4.3
  ```
</details>

### Câu Hỏi 11: Các lệnh `kubectl rollout` nào dùng để hoàn tác (rollback), tạm dừng/tiếp tục và khởi động lại toàn bộ Pod?

<details>
<summary>Đáp án</summary>

- **Hoàn tác về revision liền trước**: `kubectl rollout undo deployment/<tên-deployment>`.
- **Hoàn tác về một revision chỉ định**: `kubectl rollout undo deployment/<tên-deployment> --to-revision=<số>`.
- **Tạm dừng và tiếp tục rollout**: `kubectl rollout pause deployment/<tên-deployment>` để tạm dừng, và `kubectl rollout resume deployment/<tên-deployment>` để chạy tiếp.
- **Khởi động lại cuốn chiếu toàn bộ Pod**: `kubectl rollout restart deployment/<tên-deployment>`.
</details>

### Câu Hỏi 12: Ba giá trị của `imagePullPolicy` hoạt động ra sao và quy tắc gán ngầm định khi bỏ trống trường này là gì?

<details>
<summary>Đáp án</summary>

- **Ba giá trị của `imagePullPolicy`**:
  - `IfNotPresent`: Chỉ kéo image từ registry khi chưa có sẵn trong bộ nhớ đệm (cache) trên Node.
  - `Always`: Luôn gửi yêu cầu tới runtime để kiểm tra và kéo image từ registry mỗi khi khởi chạy container.
  - `Never`: Không bao giờ kéo image từ xa, yêu cầu image phải có sẵn ở máy cục bộ trên Node.
- **Quy tắc gán ngầm định khi bỏ trống**:
  - Nếu image sử dụng tag `:latest`, Kubernetes tự gán `Always`.
  - Nếu image sử dụng tag khác `:latest` (ví dụ `:1.4.2`), Kubernetes tự gán `IfNotPresent`.
</details>

### Câu Hỏi 13: Tại sao đẩy bản build mới lên registry với tag `:latest` rồi chạy `kubectl apply` lại khiến hệ thống không cập nhật mã mới, và giải pháp chuẩn là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Deployment chỉ kích hoạt rollout khi `.spec.template` thay đổi. Khi manifest vẫn giữ nguyên chuỗi `image: app:latest`, mã băm `pod-template-hash` của template không đổi nên Deployment controller không tạo ReplicaSet mới và không tạo Pod mới.
- **Lưu ý về `imagePullPolicy: Always`**: Dù tag `:latest` tự động nhận `imagePullPolicy: Always`, cơ chế này chỉ kéo image khi **có Pod mới được khởi chạy**, chứ bản thân nó không tự kích hoạt tạo Pod mới.
- **Giải pháp thực tiễn**: Tránh dùng `:latest` trong production; luôn sử dụng **tag phiên bản cố định/bất biến** (ví dụ `:1.4.2`) hoặc **image digest** để mọi lần phát hành đều thay đổi `.spec.template` và kích hoạt rollout rõ ràng.
</details>
