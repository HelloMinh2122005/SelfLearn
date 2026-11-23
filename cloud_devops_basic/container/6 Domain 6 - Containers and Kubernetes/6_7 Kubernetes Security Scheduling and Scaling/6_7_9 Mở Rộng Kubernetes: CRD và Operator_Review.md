# Ôn Tập: 6_7_9 Mở Rộng Kubernetes: CRD và Operator

### Câu Hỏi 1: Tại sao các tài nguyên mặc định như Deployment hay StatefulSet chưa đủ để vận hành các hệ thống phân tán có trạng thái phức tạp?

<details>
<summary>Đáp án</summary>

Các tài nguyên mặc định như Pod, Deployment hay StatefulSet hoạt động tốt với ứng dụng web stateless hoặc chỉ quản lý được thứ tự khởi tạo Pod và gắn ổ đĩa (như StatefulSet). Tuy nhiên, với các hệ thống phân tán có trạng thái (stateful workloads) phức tạp như Apache Kafka hay cơ sở dữ liệu có replication, StatefulSet không hiểu được các nghiệp vụ đặc thù như bầu chọn leader, rebalance dữ liệu, hay quy trình rolling update chuyên biệt của từng ứng dụng. Do đó, Kubernetes cung cấp cơ chế mở rộng API qua **CRD** và tự động hóa vận hành qua **Operator Pattern**.
</details>

### Câu Hỏi 2: CustomResourceDefinition (CRD) là gì và nó hoạt động trong API group nào của Kubernetes?

<details>
<summary>Đáp án</summary>

**CustomResourceDefinition (CRD)** là một loại tài nguyên thuộc API group `apiextensions.k8s.io/v1`, cho phép người dùng định nghĩa thêm các kiểu tài nguyên tùy biến mới trong Kubernetes mà không cần biên dịch lại mã nguồn API server. Khi một CRD được tạo thành công trên cluster, API server tự động phơi bày các RESTful endpoint mới tương ứng cho Custom Resource đó, giúp bạn thao tác với tài nguyên mới qua `kubectl` hoặc Kubernetes client SDK như các tài nguyên gốc.
</details>

### Câu Hỏi 3: Trong một file manifest định nghĩa CRD, các trường `group`, `names`, `scope`, và `versions` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Trong `spec` của một CRD:
- **`group`**: Định danh không gian tên logic của API (ví dụ: `kafka.strimzi.io`, `cert-manager.io` hoặc `storage.example.com`).
- **`names`**: Định nghĩa các dạng tên của tài nguyên, gồm `kind` (viết hoa CamelCase, ví dụ `DatabaseBackup`), `plural` (số nhiều, ví dụ `databasebackups`), `singular` (số ít, ví dụ `databasebackup`), và có thể kèm `shortNames` (tên viết tắt như `dbbackup`).
- **`scope`**: Xác định phạm vi hoạt động của Custom Resource, nhận một trong hai giá trị là `Namespaced` (theo từng namespace) hoặc `Cluster` (toàn cluster).
- **`versions`**: Danh sách các phiên bản API của tài nguyên (ví dụ: `v1alpha1`, `v1beta1`, `v1`), trong đó chỉ định phiên bản nào đang được phục vụ (`served`) và phiên bản lưu trữ (`storage`).
</details>

### Câu Hỏi 4: Kubernetes làm thế nào để kiểm tra tính hợp lệ của dữ liệu đầu vào khi người dùng tạo một Custom Resource?

<details>
<summary>Đáp án</summary>

CRD sử dụng **OpenAPI v3 schema** được khai báo trong trường `openAPIV3Schema` (bên trong cấu hình `schema` của từng phiên bản) để kiểm tra tính hợp lệ (validation) của dữ liệu đầu vào. Ví dụ, bạn có thể quy định kiểu dữ liệu (`string`, `integer`), các trường bắt buộc (`required`), hoặc giới hạn giá trị (`minimum`, `maximum`). Nếu người dùng gửi Custom Resource sai cấu trúc hoặc vi phạm ràng buộc này, API server sẽ từ chối ngay.
</details>

### Câu Hỏi 5: Sự khác biệt giữa CRD và Custom Resource là gì? Điều gì xảy ra nếu bạn tạo CRD và Custom Resource nhưng không cài đặt controller nào?

<details>
<summary>Đáp án</summary>

- **CRD** là phần định nghĩa cấu trúc/schema (giống như một "biểu mẫu" quy định các trường thông tin).
- **Custom Resource** là đối tượng dữ liệu cụ thể được tạo ra dựa trên schema của CRD đó và lưu trữ trong `etcd`.

Nếu bạn chỉ tạo CRD và Custom Resource (ví dụ yêu cầu tạo cụm Redis hay backup database) mà chưa cài đặt controller nào cho tài nguyên đó, API server vẫn kiểm tra hợp lệ và lưu Custom Resource vào `etcd` thành công, nhưng sẽ **không có Pod hay workload thực tế nào được tạo ra**, vì dữ liệu trong `etcd` chỉ là cấu hình tĩnh thụ động.
</details>

### Câu Hỏi 6: Operator Pattern là gì và nó giải quyết bài toán vận hành như thế nào?

<details>
<summary>Đáp án</summary>

**Operator Pattern** là sự kết hợp giữa một **CRD** (đóng vai trò mô tả trạng thái mong muốn theo hướng khai báo — *declarative desired state*) với một **Custom Controller** chạy liên tục trong cluster. Operator mã hóa các tri thức vận hành của con người (*human operational domain knowledge*) như sao lưu, mở rộng, hoặc phục hồi sự cố thành phần mềm tự động. Nhờ đó, khi hệ thống gặp sự cố hoặc có thay đổi cấu hình, Operator tự động đối chiếu và khôi phục mà không cần kỹ sư can thiệp thủ công.
</details>

### Câu Hỏi 7: Vòng lặp điều hòa (Reconciliation Loop) của Custom Controller gồm những bước nào?

<details>
<summary>Đáp án</summary>

Custom Controller vận hành theo một vòng lặp kín gọi là **Reconciliation loop** gồm 3 bước chính:
1. **Observe (Quan sát)**: Theo dõi trạng thái thực tế của các tài nguyên liên quan trên cluster.
2. **Diff (So sánh)**: Đối chiếu trạng thái thực tế với trạng thái mong muốn được khai báo trong `spec` của Custom Resource.
3. **Act (Thực thi)**: Thực hiện các hành động cần thiết (như tạo/cập nhật StatefulSet, Service, Pod...) để đưa trạng thái thực tế về đúng với trạng thái mong muốn, đồng thời cập nhật `status` của Custom Resource.
</details>

### Câu Hỏi 8: Operator theo dõi thay đổi từ API server bằng cơ chế nào, và vai trò của `spec` khác với `status` trong Custom Resource ra sao?

<details>
<summary>Đáp án</summary>

- **Cơ chế Watch**: Operator thiết lập kết nối streaming HTTP dài hạn với `kube-apiserver` để nhận sự kiện thay đổi của Custom Resource gần như tức thời, thay vì phải liên tục gửi truy vấn thăm dò (polling).
- **Phân tách `spec` và `status`**:
  - **`spec`**: Chứa trạng thái mong muốn (*desired state*) do người dùng khai báo.
  - **`status`**: Chứa trạng thái thực tế (*actual state*, ví dụ trường `phase`) do controller ghi nhận và cập nhật lại.
</details>

### Câu Hỏi 9: Kể tên 3 Operator phổ biến trong thực tế DevOps được nhắc tới trong bài và các CRD tiêu biểu của chúng.

<details>
<summary>Đáp án</summary>

Ba Operator tiêu chuẩn thường gặp trong môi trường production gồm:
1. **Strimzi Operator**: Cung cấp các CRD chuyên biệt (ví dụ `KafkaTopic`) để triển khai và vận hành cụm Apache Kafka trên Kubernetes.
2. **Prometheus Operator**: Giới thiệu các CRD như `ServiceMonitor`, `PodMonitor`, và `PrometheusRule` để tự động hóa cấu hình thu thập metric của Prometheus.
3. **cert-manager**: Sử dụng các CRD như `Issuer`, `ClusterIssuer`, và `Certificate` để tự động hóa việc xin cấp phát và gia hạn chứng chỉ TLS/SSL.
</details>

### Câu Hỏi 10: Các lệnh `kubectl` cơ bản nào được dùng để cài đặt CRD, kiểm tra danh sách CRD, xem schema và truy vấn Custom Resource?

<details>
<summary>Đáp án</summary>

Các lệnh `kubectl` thực chiến gồm:
- Áp dụng định nghĩa CRD (hoặc Custom Resource) vào cluster: `kubectl apply -f <file.yaml>`
- Liệt kê tất cả CRD hiện có trên cluster: `kubectl get crd`
- Tra cứu cấu trúc schema chi tiết của Custom Resource (ví dụ với `DatabaseBackup`): `kubectl explain databasebackup.spec`
- Kiểm tra Custom Resource đã tạo bằng tên đầy đủ hoặc tên rút gọn (`shortNames`, ví dụ `dbbackup`): `kubectl get dbbackup -n default`
</details>

### Câu Hỏi 11: Khi đóng gói ứng dụng bằng Helm chart, thư mục `crds/` hoạt động như thế nào khi chạy `helm install`, `helm upgrade` và `helm uninstall`?

<details>
<summary>Đáp án</summary>

- Trong Helm chart, thư mục `crds/` đặt ở gốc chart dùng để chứa các file định nghĩa CRD.
- Khi chạy **`helm install`**, Helm tự động cài đặt các CRD trong `crds/` lên cluster **trước khi** render các template khác, đảm bảo API server đã nhận diện schema trước khi các Custom Resource trong `templates/` được tạo.
- Khi chạy **`helm upgrade`** hoặc **`helm uninstall`**, Helm **cố ý không tự động nâng cấp hoặc xóa** các CRD trong `crds/` nhằm tránh rủi ro làm mất toàn bộ dữ liệu Custom Resource liên quan đang chạy trên cluster.
</details>

### Câu Hỏi 12: Nếu một phiên bản Helm chart mới có bổ sung trường cấu hình cho CRD, làm thế nào để nâng cấp an toàn mà không bị API server từ chối Custom Resource mới?

<details>
<summary>Đáp án</summary>

Vì `helm upgrade` không cập nhật CRD trong thư mục `crds/`, nếu nâng cấp trực tiếp, schema trên cluster vẫn là bản cũ và API server sẽ báo lỗi không nhận diện được trường mới. Để khắc phục, quản trị viên (hoặc pipeline CI/CD) cần:
1. Chủ động áp dụng file CRD mới nhất trước bằng lệnh: `kubectl apply -f <path-to-new-crd>` (hoặc tách CRD thành một Helm chart độc lập riêng để quản lý).
2. Sau đó mới chạy `helm upgrade <release-name> <chart-path>` để nâng cấp release.
</details>

### Câu Hỏi 13: Điều gì xảy ra nếu quản trị viên chạy lệnh `kubectl delete crd` đối với một CRD đang dùng trên production, và cách phòng ngừa rủi ro này là gì?

<details>
<summary>Đáp án</summary>

- **Hậu quả**: Khi một CRD bị xóa khỏi cluster, Kubernetes sẽ tự động xóa **tất cả** các Custom Resource instances thuộc CRD đó trên mọi namespace cùng toàn bộ dữ liệu của chúng trong `etcd`, dẫn đến controller dọn dẹp các workload phụ thuộc và gây gián đoạn hệ thống.
- **Cách phòng ngừa**: Không cấp quyền xóa tài nguyên `customresourcedefinitions` cho pipeline CI/CD hoặc các `ServiceAccount` thông thường; chỉ giới hạn quyền này cho quản trị viên cluster trong các phiên bảo trì đặc biệt.
</details>

### Câu Hỏi 14: Finalizers trong Custom Resource có tác dụng gì, tại sao đôi khi tài nguyên bị treo ở trạng thái `Terminating`, và xử lý khẩn cấp thế nào?

<details>
<summary>Đáp án</summary>

- **Tác dụng**: **Finalizers** ngăn Kubernetes xóa Custom Resource ngay lập tức để chờ controller hoàn tất việc dọn dẹp các tài nguyên phụ trợ trước khi thực sự gỡ bỏ object khỏi cluster.
- **Nguyên nhân bị treo `Terminating`**: Nếu Operator bị ngừng hoạt động hoặc gặp sự cố mạng nên không thể dọn dẹp và gỡ khóa finalizer, Custom Resource sẽ bị kẹt vô hạn ở trạng thái `Terminating`.
- **Xử lý khẩn cấp**: Khi đã xác nhận hạ tầng bên ngoài an toàn, quản trị viên có thể xóa bỏ danh sách finalizers bằng lệnh patch, ví dụ:
  ```bash
  kubectl patch dbbackup orders-db-backup -p '{"metadata":{"finalizers":[]}}' --type=merge
  ```
</details>

### Câu Hỏi 15: Cần áp dụng nguyên tắc phân quyền nào cho ServiceAccount của Operator khi triển khai trong môi trường doanh nghiệp?

<details>
<summary>Đáp án</summary>

Cần áp dụng **nguyên tắc đặc quyền tối thiểu (Least Privilege)**: tránh gán quyền quản trị tối cao toàn cluster (như `cluster-admin` qua `ClusterRoleBinding`) cho `ServiceAccount` của Operator. Nếu Operator chỉ cần quản trị tài nguyên trong một namespace nhất định, hãy sử dụng **`Role`** và **`RoleBinding`** để giới hạn phạm vi tác động trong đúng namespace đó.
</details>
