# Ôn Tập: 6_3_1 Kubernetes Cluster Architecture

### Câu Hỏi 1: Kubernetes là gì và kiến trúc tổng thể của một cụm Kubernetes được phân chia như thế nào?

K8S là 1 nền tảng điều phối và quản lý container phân tán. Gồm 2 thành phần chính:
- Control Plane: Dùng để quản lý và điều hành toàn bộ cluster
- Worker Node: Các máy chủ trực tiếp thực thi container

Trong Control Plane có 5 thành phần:
- kube-apiserver: Nơi tiếp nhận API của toàn cụm, mọi API request đều đi qua đây. Kubernetes áp dụng mô hình hub-and-spoke, trong đó kube-apiserver là trung tâm (hub) duy nhất.
- etcd: CSDL của cụm, lưu trữ các API object thể hiện trạng thái mong muốn của cụm
- kube-scheduler: Theo dõi các Pod mới tạo chưa có Node, tìm và gán vào Node phù hợp
- kube-control-manager: Chạy các tiến trình controller để đảm bảo trạng thái hiện tại của cụm (Node, Pod,...) khớp với trạng thái mong muốn trong etcd
- cloud-control-manager: Tương tự kube-control-manager nhưng dùng để đồng bộ các tài nguyên cloud (LB, Route, Node,...).

Trong Worker Node gồm 3 thành phần chính:
- kubelet: agent đại diện node gửi/nhận lệnh từ kube-apiserver, theo dõi, ra lệnh cho container runtime theo chuẩn CRI. Quản lý pod, báo cáo trạng thái của Node
- Container Runtime: Dùng để chạy các container, trực tiếp pull, push, run,...
- kube-proxy: Viết các network rule, routing, load balance bên trong Node, dựa vào Service (Node + etcd) và EndpointSlice (DS IP và port của Pod đang ready), để Linux Kernel dựa vào các rule này mà chuyển tiếp gói tin đến các Pod phù hợp. 

Các đối tượng cơ bản bên trong 1 worker node như:
- Pod: Đơn vị nhỏ nhất, trực tiếp chạy container
- Service, địa chỉ IP và cân bằng tải cho Pod pool
- Ingress/Gateway API: Cổng nhận HTTP/HTTPS từ ngoài Internet và điều hướng vào đúng Service trong Cluster
- ConfigMap/Secret/PersistentVolume: Nơi...


### Câu Hỏi 9: `kube-proxy` và CNI Plugins đảm nhận vai trò gì về mạng trên Worker Node?

<details>
<summary>Đáp án</summary>

- **`kube-proxy`**: Chạy trên từng node, quan sát cấu hình Service & Endpoints từ Kubernetes API để phản ánh Service và thực hiện chuyển tiếp lưu lượng mạng **TCP, UDP, SCTP** tới các Pod backend.
- **CNI Plugins**: Container runtime phải được cấu hình để nạp plugin CNI (Container Network Interface) nhằm hiện thực hóa mô hình mạng phẳng của Kubernetes cho các Pod.
</details>

### Câu Hỏi 10: Mô hình khai báo (Declarative) và vòng lặp điều hòa (Reconcile Loop) hoạt động như thế nào khi một Pod đang chạy bị xóa đột ngột?

<details>
<summary>Đáp án</summary>

Theo **mô hình khai báo (Declarative)**, người dùng chỉ khai báo trạng thái mong muốn (**Desired State** trong trường `spec`), còn các controller chạy **vòng lặp điều hòa (Reconcile Loop)** liên tục đối chiếu với trạng thái thực tế (**Observed State**) để kéo hệ thống về đúng mong muốn.

Khi một Pod bị xóa hoặc dừng đột ngột, trình tự phối hợp diễn ra như sau:
1. `kube-apiserver` ghi nhận Pod bị xóa/dừng và cập nhật trạng thái vào `etcd`.
2. `kube-controller-manager` phát hiện `Observed State` (ví dụ: 2 Pods) không khớp với `Desired State` (ví dụ: 3 Pods), liền gửi yêu cầu lên API server tạo một Pod mới (chưa gán node) và lưu vào `etcd`.
3. `kube-scheduler` phát hiện Pod mới chưa được gán node, chọn Worker Node phù hợp (Binding) và cập nhật thông tin gán node qua `kube-apiserver` vào `etcd`.
4. `kubelet` trên node được chọn phát hiện có Pod mới gán cho mình, gọi gRPC (qua chuẩn CRI) yêu cầu container runtime khởi chạy container.
5. Khi container chạy thành công, `kubelet` báo cáo trạng thái `Running` về `kube-apiserver` để cập nhật vào `etcd`, đưa hệ thống trở lại `Observed = Desired`.
</details>

### Câu Hỏi 11: Việc quản lý hạ tầng Control Plane khác nhau như thế nào giữa Managed K8s, `kubeadm` và `kind`?

<details>
<summary>Đáp án</summary>

- **Managed K8s (EKS, AKS, GKE)**: Nhà cung cấp dịch vụ đám mây quản lý hoàn toàn hạ tầng Control Plane.
- **`kubeadm`**: Kỹ sư phải tự quản lý các máy chủ Control Plane (nơi chạy `etcd` và `kube-apiserver`).
- **`kind`**: Công cụ chạy cụm Kubernetes cục bộ phục vụ kiểm thử, bằng cách sử dụng các Docker container làm node dựa trên `node-image`.
</details>

### Câu Hỏi 12: Trong thực hành khởi tạo và thanh tra cluster bằng `kind` và `kubectl`, các lệnh kiểm tra sau có tác dụng gì?

<details>
<summary>Đáp án</summary>

- `kind create cluster --name lab-arch`: Khởi tạo cụm Kubernetes cục bộ tên `lab-arch` bằng Docker container (chuẩn bị node image, khởi chạy control-plane, cài CNI, StorageClass) và cấu hình context `kubectl` thành `kind-lab-arch`.
- `kubectl get nodes -o wide`: Kiểm tra danh sách các node trong cụm kèm thông tin chi tiết như phiên bản Kubernetes.
- `kind load docker-image my-custom-app:v1.0.0 --name lab-arch`: Nạp trực tiếp container image cục bộ vào các node của cụm `kind` mà không cần push lên registry bên ngoài.
- `kubectl get pods -n kube-system -o wide`: Liệt kê các Pod thành phần Control Plane và `kube-proxy` đang chạy trong namespace `kube-system`.
- `ps aux | grep kubelet | grep -- "--container-runtime-endpoint"`: Kiểm tra tham số socket gRPC của container runtime đang được cấu hình cho tiến trình `kubelet`.
</details>

### Câu Hỏi 13: Kubernetes quy định chuẩn đánh số phiên bản, chu kỳ phát hành và thời hạn hỗ trợ như thế nào? Điều gì xảy ra khi cụm rơi vào trạng thái End-of-Life (EOL)?

<details>
<summary>Đáp án</summary>

- **Quy chuẩn phiên bản**: Tuân theo chuẩn Semantic Versioning dạng `x.y.z`.
- **Chu kỳ phát hành**: Có 3 phiên bản được phát hành mỗi năm dương lịch, mỗi chu kỳ kéo dài xấp xỉ 15 tuần.
- **Thời hạn hỗ trợ**: Từ bản 1.19 trở đi, mỗi bản minor nhận được khoảng **1 năm** hỗ trợ bản vá; dự án duy trì nhánh phát hành và vá lỗi cho **3 phiên bản minor gần nhất**.
- **Rủi ro khi rơi vào EOL**: Phiên bản chạm mốc End-of-Life (ví dụ một cụm chạy quá 1 năm không nâng cấp) sẽ không còn nhận được bất kỳ bản sửa lỗi hay bản vá bảo mật (CVE) nào.
- **Khuyến nghị vận hành**: Lên lịch nâng cấp cluster định kỳ mỗi 3 đến 4 tháng (nâng cấp tuần tự từng minor version và kiểm tra container runtime hỗ trợ v1 CRI API) để luôn nằm trong vùng hỗ trợ của 3 bản minor mới nhất.
</details>
