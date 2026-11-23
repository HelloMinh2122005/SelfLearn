# Ôn Tập: 6.7.5 Admission Control và Policy

### Câu Hỏi 1: Mọi request gửi tới `kube-apiserver` phải trải qua các giai đoạn kiểm soát tuần tự nào trước khi dữ liệu được lưu vào `etcd`?

<details>
<summary>Đáp án</summary>

Mọi request gửi đến `kube-apiserver` đều phải lần lượt vượt qua **3 giai đoạn kiểm soát** trước khi được ghi nhận bền vững vào `etcd`:
1. **Authentication**: Xác thực danh tính của client gửi yêu cầu.
2. **Authorization**: Kiểm tra quyền hạn (ví dụ qua RBAC) xem client có được phép thực hiện hành động trên tài nguyên đó hay không.
3. **Admission Control**: Kiểm duyệt và có thể biến đổi nội dung chi tiết bên trong yêu cầu trước khi lưu trữ.
</details>

### Câu Hỏi 2: Tại sao cơ chế phân quyền RBAC là chưa đủ để bảo vệ cụm Kubernetes, và Admission Control giải quyết khoảng trống nào?

<details>
<summary>Đáp án</summary>

Phân quyền RBAC ở giai đoạn Authorization chỉ kiểm tra **danh tính người gửi** và xác định xem người đó có quyền thực hiện hành vi trên loại tài nguyên cụ thể hay không, nhưng **hoàn toàn không thể phân tích nội dung chi tiết bên trong cấu hình** của request.

Ví dụ: RBAC có thể cho phép kỹ sư tạo Pod trong một namespace, nhưng không thể phát hiện liệu Pod đó có cấu hình chạy với quyền quản trị tối cao, có gắn giới hạn tài nguyên CPU hay có đang kéo image từ nguồn không an toàn hay không. Admission Control giải quyết khoảng trống này bằng cách kiểm tra (và thậm chí chỉnh sửa) trực tiếp payload của đối tượng.
</details>

### Câu Hỏi 3: Admission Control can thiệp vào những loại thao tác (operations) nào và bỏ qua những thao tác nào?

<details>
<summary>Đáp án</summary>

- **Có áp dụng**: Các yêu cầu ghi hoặc sửa đổi trạng thái tài nguyên gồm `Create`, `Update`, `Delete` và `Connect`.
- **Không áp dụng**: Các thao tác chỉ đọc như `Get`, `List` hoặc `Watch`.
</details>

### Câu Hỏi 4: Quá trình Admission Control gồm những pha nào, thứ tự thực thi ra sao và điều gì xảy ra nếu một Validating Admission Controller từ chối request?

<details>
<summary>Đáp án</summary>

Quá trình Admission Control diễn ra theo **thứ tự cố định**:
1. **Pha Mutating Admission** chạy trước (gồm internal controllers và Mutating Webhooks) — có thể sửa đổi payload của đối tượng.
2. **Kiểm tra cấu trúc đối tượng (Object Schema Validation)** — kiểm tra đối tượng sau khi biến đổi có khớp định dạng OpenAPI hay không.
3. **Pha Validating Admission** chạy sau cùng (gồm internal controllers, Validating Webhooks và `ValidatingAdmissionPolicy`).

Nếu bất kỳ controller nào trong pha **Validating Admission** từ chối request, toàn bộ thao tác sẽ bị hủy bỏ ngay lập tức, không được ghi vào `etcd` và `kube-apiserver` trả về mã trạng thái **HTTP 403 Forbidden**.
</details>

### Câu Hỏi 5: Trong Dynamic Admission Control, hãy phân biệt vai trò và khả năng của `MutatingWebhookConfiguration` và `ValidatingWebhookConfiguration`.

<details>
<summary>Đáp án</summary>

Cả hai đều là cơ chế mở rộng động cho phép `kube-apiserver` gọi ra các webhook server bên ngoài qua giao thức HTTP/HTTPS, nhưng khác nhau về quyền tác động lên payload:
- **`MutatingWebhookConfiguration`** (chạy ở pha 1 - Mutating Admission): **Có khả năng sửa đổi nội dung payload** của đối tượng trước khi được lưu; thường dùng để tự động tiêm sidecar proxy container, gắn nhãn mặc định hoặc thiết lập tham số bảo mật.
- **`ValidatingWebhookConfiguration`** (chạy ở pha 2 - Validating Admission): **Không thể sửa đổi manifest** của request, chỉ có quyền đọc và đưa ra quyết định chấp thuận (allow) hoặc từ chối (deny).
</details>

### Câu Hỏi 6: Hai tham số `failurePolicy` và `timeoutSeconds` trong Admission Webhook Configuration có tác dụng gì?

<details>
<summary>Đáp án</summary>

- **`failurePolicy`**: Quy định hành vi của `kube-apiserver` khi webhook server không phản hồi hoặc gặp sự cố:
  - `Fail`: Từ chối toàn bộ request bị ảnh hưởng.
  - `Ignore`: Bỏ qua lỗi từ webhook và cho phép request tiếp tục đi qua pipeline.
- **`timeoutSeconds`**: Xác định thời gian tối đa `kube-apiserver` chờ phản hồi từ webhook trước khi kích hoạt `failurePolicy`. Giá trị hợp lệ từ **1 đến 30 giây**, mặc định là **10 giây**.
</details>

### Câu Hỏi 7: `ValidatingAdmissionPolicy` khắc phục những nhược điểm nào của Admission Webhook truyền thống, và đặc điểm vận hành cốt lõi của nó là gì?

<details>
<summary>Đáp án</summary>

Admission Webhook truyền thống đòi hỏi vận hành một máy chủ riêng bên ngoài, quản lý chứng chỉ TLS, chịu độ trễ truyền mạng nội bộ và tiềm ẩn rủi ro làm tê liệt cụm khi webhook gặp sự cố.

**`ValidatingAdmissionPolicy`** khắc phục triệt để các vấn đề này nhờ:
- Sử dụng ngôn ngữ biểu thức **Common Expression Language (CEL)**, chính thức đạt trạng thái **GA từ Kubernetes v1.30**.
- Chạy **in-process trực tiếp bên trong `kube-apiserver`**, loại bỏ hoàn toàn độ trễ mạng, không cần dịch vụ ngoại vi, không tốn chi phí quản lý TLS giữa API Server với Webhook và triệt tiêu rủi ro sập cụm do nghẽn mạng.
</details>

### Câu Hỏi 8: Trong tài nguyên `ValidatingAdmissionPolicy`, hãy giải thích vai trò của `spec.matchConstraints`, `spec.validations`, hai biến `object` / `oldObject`, và quy ước giá trị trả về của biểu thức CEL.

<details>
<summary>Đáp án</summary>

- **`spec.matchConstraints`**: Định nghĩa phạm vi tài nguyên mà policy áp dụng (API groups, versions, operations, resources).
- **`spec.validations`**: Chứa danh sách các biểu thức CEL (`expression`) cùng thông báo lỗi khi vi phạm (`message` hoặc `messageExpression`).
- **Biến `object` và `oldObject` trong CEL**:
  - `object`: Đại diện cho đối tượng đang được tạo mới hoặc cập nhật.
  - `oldObject`: Đại diện cho trạng thái hiện tại của đối tượng trước khi cập nhật.
- **Quy ước đánh giá**: Biểu thức trong `validations[].expression` bắt buộc phải trả về giá trị boolean **`true`** để request được chấp thuận. Nếu trả về **`false`** hoặc gặp lỗi cú pháp khi đánh giá, request bị coi là vi phạm chính sách.
</details>

### Câu Hỏi 9: Tại sao sau khi tạo `ValidatingAdmissionPolicy` ta vẫn phải tạo thêm `ValidatingAdmissionPolicyBinding`, và trường `validationActions` hỗ trợ các giá trị nào?

<details>
<summary>Đáp án</summary>

Bản thân `ValidatingAdmissionPolicy` chỉ định nghĩa logic quy tắc kiểm tra. Để chính sách thực sự được áp dụng vào cụm, người quản trị bắt buộc phải tạo tài nguyên **`ValidatingAdmissionPolicyBinding`** nhằm:
1. Liên kết policy (`policyName`) với phạm vi tài nguyên/namespace cụ thể (`matchResources`).
2. Quy định hành vi xử lý khi có vi phạm thông qua trường **`validationActions`**, hỗ trợ 3 giá trị:
   - `Deny`: Từ chối request vi phạm.
   - `Warn`: Cho phép đi qua nhưng trả về cảnh báo cho client.
   - `Audit`: Ghi nhận vi phạm vào audit log.
</details>

### Câu Hỏi 10: So sánh hai công cụ quản trị chính sách nguồn mở phổ biến là OPA Gatekeeper và Kyverno.

<details>
<summary>Đáp án</summary>

- **OPA Gatekeeper**:
  - Sử dụng ngôn ngữ truy vấn **Rego** để viết logic chính sách.
  - Tích hợp với `kube-apiserver` thông qua `ValidatingWebhookConfiguration` để thực thi các tài nguyên `ConstraintTemplate` và `Constraint`.
- **Kyverno**:
  - Thiết kế dành riêng cho Kubernetes, cho phép viết chính sách trực tiếp bằng **cú pháp YAML tiêu chuẩn** mà không cần học thêm ngôn ngữ chính sách riêng biệt.
  - Hỗ trợ cả 3 khả năng: **validate** (kiểm tra), **mutate** (biến đổi) và **generate** (tự động sinh tài nguyên).
</details>

### Câu Hỏi 11: Trong ví dụ thực hành của bài học, biểu thức CEL `!c.image.endsWith(':latest') && c.image.contains(':')` và phần `namespaceSelector` trong `ValidatingAdmissionPolicyBinding` có tác dụng gì?

<details>
<summary>Đáp án</summary>

- **Biểu thức CEL** (áp dụng qua `object.spec.containers.all(c, ...)`): Đảm bảo **mọi container** trong Pod đều không được dùng tag `:latest` (`!c.image.endsWith(':latest')`) và bắt buộc phải chỉ định rõ nhãn phiên bản (`c.image.contains(':')`). Nếu chạy `kubectl run insecure-pod --image=nginx:latest`, request sẽ bị từ chối.
- **`namespaceSelector`** với toán tử `NotIn` cho `["kube-system", "kube-public"]` trên nhãn `kubernetes.io/metadata.name`: Loại trừ các namespace hệ thống cốt lõi khỏi phạm vi áp dụng policy, tránh ảnh hưởng đến các thành phần hạ tầng của cụm.
</details>

### Câu Hỏi 12: Trình bày 3 thực tiễn sản xuất (Best Practices) quan trọng cần tuân thủ khi vận hành Admission Control để tránh sự cố cho cụm Kubernetes.

<details>
<summary>Đáp án</summary>

1. **Phòng tránh khóa chết cụm do Webhook (Deadlock & Cluster Outage)**:
   - Nếu Webhook có `failurePolicy: Fail`, chạy dưới dạng Pod ngay trong cụm và áp dụng cho toàn bộ namespace, khi cụm khởi động lại, API Server muốn tạo lại Webhook Pod nhưng lại phải chờ chính Webhook đó phê duyệt → xảy ra khóa chết vòng tròn.
   - *Cách phòng tránh*: Luôn cấu hình bộ lọc loại trừ các namespace hệ thống nòng cốt; nếu lỡ xảy ra deadlock, tạm thời chuyển sang `Ignore` hoặc xóa Webhook từ control plane rồi bổ sung bộ lọc loại trừ.
2. **Triển khai chính sách mới an toàn qua chế độ cảnh báo**:
   - Không đặt chế độ chặn (`Deny`) ngay từ ngày đầu. Hãy chạy ở chế độ cảnh báo (`Warn`) và ghi nhật ký (`Audit`) trước để theo dõi tác động lên workload đang chạy, sau đó mới chuyển sang chặn nghiêm ngặt.
3. **Đảm bảo tính bất biến (Idempotency) cho Mutating Webhook**:
   - Khi gọi Mutating Webhook nhiều lần trên cùng một đối tượng, payload sau khi sửa đổi phải ổn định và không tiếp tục thay đổi ở các lần gọi tiếp theo, tránh vòng lặp vô tận giữa các controller và tăng tải đột biến lên `kube-apiserver`.
</details>
