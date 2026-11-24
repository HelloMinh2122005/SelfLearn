# Review: 7_3_4 Strimzi Operator

### Câu Hỏi 1: Tại sao khi chạy Apache Kafka trên Kubernetes, các đội vận hành nên dùng Strimzi Operator thay vì tự viết cấu hình và thao tác thủ công?

<details>
<summary>Đáp án</summary>

Việc tự viết tay từng file cấu hình riêng lẻ (như `StatefulSet`) và chạy dòng lệnh thủ công để tạo topic rất dễ sai sót, đồng thời khó đồng bộ khi nâng cấp. Strimzi Operator giúp giao toàn bộ vòng đời của cụm Kafka cho Kubernetes tự động điều phối; bạn chỉ cần mô tả trạng thái mong muốn của cụm Kafka bằng các file YAML ngắn gọn, phần triển khai và vận hành phức tạp bên dưới sẽ do hệ thống tự xử lý.

</details>

### Câu Hỏi 2: Mô hình Kubernetes Operator gồm hai thành phần cốt lõi nào và vai trò của từng thành phần là gì?

<details>
<summary>Đáp án</summary>

Mô hình Kubernetes Operator kết hợp hai thành phần:
- **Custom Resource Definition (CRD)**: Cơ chế cho phép đăng ký thêm các "loại đối tượng mới" vào Kubernetes API, giúp người dùng khai báo trạng thái mong muốn bằng YAML giống như `Pod` hay `Deployment`.
- **Custom controller**: Tiến trình chạy bên trong cluster theo vòng lặp đối chiếu (reconciliation loop), liên tục theo dõi trạng thái thực tế và tự động điều chỉnh các tài nguyên Kubernetes để khớp với trạng thái mong muốn đã khai báo.

</details>

### Câu Hỏi 3: Trong Strimzi, Cluster Operator đóng vai trò gì và tự động tạo ra những tài nguyên Kubernetes nền tảng nào từ bản khai báo `Kafka`?

<details>
<summary>Đáp án</summary>

**Cluster Operator** là bộ não điều phối chính của Strimzi: nó theo dõi các tài nguyên khai báo cụm (như tài nguyên trung tâm `Kafka`) và tự động tạo, cập nhật hoặc xóa các thành phần Kubernetes bên dưới. Cụ thể, từ bản khai báo `Kafka`, Cluster Operator tự động tạo và quản lý:
- Pod lưu trạng thái (thông qua `StatefulSet` hoặc `StrimziPodSet` tùy phiên bản Strimzi).
- `PersistentVolumeClaim` (PVC) để lưu trữ dữ liệu.
- `Service` và các **listener** (cho kết nối nội bộ lẫn bên ngoài cluster, hỗ trợ cấu hình mã hóa TLS).

</details>

### Câu Hỏi 4: Khi bạn chỉnh sửa cấu hình hoặc nâng cấp phiên bản trong file YAML của cụm `Kafka`, Strimzi xử lý quá trình cập nhật như thế nào?

<details>
<summary>Đáp án</summary>

Strimzi tự động điều phối **nâng cấp cuốn chiếu (rolling update)** từng broker một thay vì khởi động lại đồng loạt, giúp tránh gây gián đoạn toàn bộ cụm Kafka.

</details>

### Câu Hỏi 5: Entity Operator trong Strimzi bao gồm những bộ điều khiển con nào và chúng tương ứng với những Custom Resource nào?

<details>
<summary>Đáp án</summary>

**Entity Operator** gồm hai bộ điều khiển con:
- **Topic Operator**: theo dõi và xử lý các Custom Resource loại **`KafkaTopic`**.
- **User Operator**: theo dõi và xử lý các Custom Resource loại **`KafkaUser`**.

</details>

### Câu Hỏi 6: Tài nguyên `KafkaTopic` dùng để khai báo những gì và Topic Operator thực hiện công việc gì?

<details>
<summary>Đáp án</summary>

- **`KafkaTopic`** là Custom Resource dùng để khai báo thông tin của một Kafka topic bằng YAML, bao gồm tên topic, số lượng `partitions`, số bản sao (`replicas`) và các cấu hình lưu giữ (ví dụ `retention.ms`).
- **Topic Operator** theo dõi các tài nguyên `KafkaTopic` trên Kubernetes và tự động đồng bộ (tạo, sửa, xóa) topic tương ứng vào cụm Kafka.

</details>

### Câu Hỏi 7: Tài nguyên `KafkaUser` dùng để khai báo những gì và User Operator xử lý ra sao để ứng dụng kết nối được vào Kafka?

<details>
<summary>Đáp án</summary>

- **`KafkaUser`** dùng để khai báo danh tính người dùng Kafka, phương thức xác thực (như `TLS` hoặc `scram-sha-512`) và danh sách quyền truy cập (ACL — Access Control List).
- **User Operator** thiết lập thông tin xác thực và quyền (ACL) tương ứng trên cụm Kafka, đồng thời tự động lưu mật khẩu hoặc chứng chỉ vào một **Kubernetes Secret** (cùng tên với `KafkaUser`) để Pod ứng dụng mount vào sử dụng.

</details>

### Câu Hỏi 8: Làm thế nào để chỉ định một `KafkaTopic`, `KafkaUser` hoặc `KafkaNodePool` thuộc về một cụm Kafka cụ thể?

<details>
<summary>Đáp án</summary>

Bạn cần gắn nhãn **`strimzi.io/cluster: <tên-cụm>`** trong phần `metadata.labels` của các tài nguyên `KafkaTopic`, `KafkaUser` hoặc `KafkaNodePool`. (Ví dụ: `strimzi.io/cluster: orders-cluster`).

</details>

### Câu Hỏi 9: Trong các phiên bản Strimzi hiện đại hỗ trợ KRaft, tài nguyên `KafkaNodePool` được sử dụng để làm gì?

<details>
<summary>Đáp án</summary>

`KafkaNodePool` được dùng để tách riêng cấu hình các nhóm node ra khỏi tài nguyên `Kafka`. Nó cho phép định nghĩa rõ vai trò của từng nhóm (`broker`, `controller`, hoặc gộp cả hai), số lượng `replicas`, tài nguyên CPU/RAM và cấu hình ổ đĩa (`storage`) cho từng nhóm node.

</details>

### Câu Hỏi 10: Vì sao Strimzi phù hợp với quy trình GitOps, và điều gì xảy ra nếu bạn dùng CLI tạo topic thủ công hoặc sửa trực tiếp `ConfigMap`/`Service` do Operator sinh ra?

<details>
<summary>Đáp án</summary>

- Strimzi phù hợp với GitOps vì toàn bộ hạ tầng từ cụm Kafka, topic đến user đều được khai báo bằng các file YAML chuẩn Kubernetes; do đó có thể lưu vào kho Git, rà soát qua Pull Request và triển khai tự động bằng công cụ GitOps (như Argo CD hoặc Flux).
- Nếu tạo/sửa topic bằng CLI thủ công hoặc sửa trực tiếp các tài nguyên con (`ConfigMap`, `Service`) do Operator sinh ra, vòng lặp đối chiếu của Strimzi hoặc công cụ GitOps sẽ ghi đè lại và gây lệch trạng thái so với Git. Khuyến nghị là giữ một nguồn chân lý duy nhất (Single Source of Truth) là các file YAML trong Git.

</details>

### Câu Hỏi 11: Tại sao không nên sao chép mù quáng các file YAML cũ trên mạng khi triển khai Strimzi, và cần đối chiếu thông tin nào trước khi áp dụng?

<details>
<summary>Đáp án</summary>

Vì phiên bản Strimzi thay đổi rất nhanh và ảnh hưởng trực tiếp đến cú pháp YAML cũng như kiến trúc cụm:
- Tên **`apiVersion`** của các CRD (ví dụ `kafka.strimzi.io/v1beta2` hay `v1`) có thể khác nhau tùy phiên bản Strimzi.
- Chế độ điều phối metadata bằng **KRaft** hay **ZooKeeper** phụ thuộc vào phiên bản Strimzi và Kafka (các bản Strimzi mới chuyển hẳn sang KRaft và loại bỏ ZooKeeper).
- Mỗi phiên bản Strimzi chỉ hỗ trợ một danh sách giới hạn các phiên bản Apache Kafka cụ thể.

Do đó, trước khi viết hoặc nâng cấp YAML, cần đối chiếu **Support Matrix (ma trận phiên bản)** và Release Notes của đúng phiên bản Strimzi đang cài trên trang tài liệu chính thức `strimzi.io`.

</details>

### Câu Hỏi 12: Trong cấu hình lưu trữ của Strimzi, thuộc tính `deleteClaim: true` tiềm ẩn rủi ro gì và khuyến nghị cho môi trường Production là gì?

<details>
<summary>Đáp án</summary>

- **Rủi ro**: Đặt `deleteClaim: true` sẽ khiến Strimzi tự động xóa luôn các `PersistentVolumeClaim` (PVC) chứa dữ liệu khi tài nguyên cụm bị xóa, dẫn đến mất dữ liệu.
- **Khuyến nghị**: Ở môi trường Production, luôn đặt **`deleteClaim: false`** để bảo toàn PVC ngay cả khi tài nguyên cụm bị xóa nhầm.

</details>

### Câu Hỏi 13: Khi phân quyền cho các tài khoản kết nối Kafka bằng `KafkaUser`, cần tuân thủ nguyên tắc bảo mật nào?

<details>
<summary>Đáp án</summary>

Cần tuân thủ nguyên tắc tối thiểu (**Least Privilege**): không tắt kiểm tra quyền và không cấp quyền cho mọi topic (`*`). Thay vào đó, hãy bật `authorization` trên cụm và khai báo ACL chi tiết trong từng `KafkaUser` đúng với nhu cầu của từng dịch vụ (ví dụ dịch vụ producer chỉ được cấp quyền `Write` và `Describe` trên đúng topic của nó).

</details>
