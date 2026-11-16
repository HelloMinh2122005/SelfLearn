# Evidence Index: WRITE-CTR-6_3_2

- **Task ID**: WRITE-CTR-6_3_2
- **Assignee**: writer-2
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_3 Kubernetes Architecture and Core Workloads/6_3_2 kubectl and API Objects.md`
- **Topic Title**: 6_3_2 kubectl and API Objects
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_3-R1.md`
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_3-R2.md`

## Claim IDs Used
- **R1 Claims**:
  - `R1.18`: Trường `apiVersion` xác định phiên bản Kubernetes API.
  - `R1.19`: Trường `kind` xác định kiểu đối tượng cụ thể.
  - `R1.20`: Trường `metadata` chứa thông tin định danh (name, UID, namespace).
  - `R1.21`: Trường `spec` mô tả trạng thái mong muốn (desired state).
  - `R1.22`: Trường `status` mô tả trạng thái thực tế hiện thời (current state).
  - `R1.23`: Namespace cung cấp cơ chế phân vùng cô lập nhóm tài nguyên trong một cluster.
  - `R1.24`: Tên tài nguyên là duy nhất trong cùng namespace, có thể trùng nhau giữa các namespace.
  - `R1.25`: Tài nguyên tầng thấp như Node, PersistentVolume là cluster-scoped (không thuộc namespace).
  - `R1.26`: Labels là cặp key/value gắn vào đối tượng Kubernetes như Pods.
  - `R1.27`: Labels cho phép ánh xạ cấu trúc tổ chức theo cơ chế ghép lỏng (loosely coupled).
  - `R1.28`: Label selector là cơ chế gom nhóm cốt lõi định danh tập hợp đối tượng.
  - `R1.29`: Selector của hai ReplicaSet không được phép trùng lặp trong cùng một namespace.
  - `R1.30`: Bộ nhãn khuyến nghị chuẩn hóa mô tả ứng dụng để dễ dàng truy vấn.

- **R2 Claims**:
  - `R2.19`: `kubectl apply` tạo và cập nhật tài nguyên thông qua tệp khai báo, khuyến nghị cho production.
  - `R2.20`: `kubectl apply -f` áp dụng manifest từ đường dẫn tệp cục bộ hoặc URL.
  - `R2.21`: `kubectl diff` so sánh live state của cluster với trạng thái khai báo trong manifest.
  - `R2.22`: `kubectl config view` hỗ trợ lọc trường có cấu trúc qua jsonpath template.
  - `R2.23`: `kubectl config get-contexts` hiển thị danh sách tất cả các context trong kubeconfig.
  - `R2.24`: `kubectl explain -R/--recursive` in cây trường con phân cấp của API schema.
  - `R2.25`: `kubectl explain pods --recursive` hiển thị toàn bộ cây trường đệ quy của Pod schema.
  - `R2.26`: `kubectl get -o wide` in thêm các cột siêu dữ liệu như IP và node name.
  - `R2.27`: `kubectl get -A/--all-namespaces` truy vấn tài nguyên trên toàn bộ các namespace trong cluster.
  - `R2.28`: `kubectl get -l/--selector` lọc tài nguyên theo nhãn với toán tử '=', '==', '!=', 'in', 'notin'.
  - `R2.29`: `kubectl run` khởi chạy trực tiếp một Pod từ container image chỉ định.
  - `R2.30`: `kubectl run` cho phép thiết lập restartPolicy với các giá trị Always, OnFailure, Never.
  - `R2.31`: Kubeconfig tổ chức thông tin kết nối gồm clusters, users, contexts, namespaces.
  - `R2.32`: Contexts trong kubeconfig định nghĩa kết hợp giữa clusters, users và namespaces.
  - `R2.33`: `kubectl config use-context` chuyển đổi context hoạt động.
  - `R2.34`: `app.kubernetes.io/name` ghi nhận tên ứng dụng.
  - `R2.35`: `app.kubernetes.io/instance` định danh bản thể cụ thể của ứng dụng.
  - `R2.36`: `app.kubernetes.io/version` xác định phiên bản ứng dụng (SemVer/hash).
  - `R2.37`: Namespace scoping chỉ áp dụng cho namespaced objects, không áp dụng cho cluster-wide objects.
  - `R2.38`: `kubectl api-resources --namespaced=true` liệt kê các tài nguyên nằm trong namespace.
