# Evidence Index: WRITE-CTR-6_3_1

- **Task ID**: WRITE-CTR-6_3_1
- **Assignee**: writer-1
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_3 Kubernetes Architecture and Core Workloads/6_3_1 Kubernetes Cluster Architecture.md`
- **Topic Title**: 6_3_1 Kubernetes Cluster Architecture
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_3-R1.md`
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_3-R2.md`

## Claim IDs Used
- **R1 Claims**:
  - `R1.1`: `kube-apiserver` là thành phần control plane cốt lõi cung cấp HTTP API để giao tiếp với toàn bộ cluster.
  - `R1.2`: `etcd` là kho lưu trữ key-value phân tán, có tính nhất quán cao và sẵn sàng cao cho mọi dữ liệu của API server.
  - `R1.3`: `kube-scheduler` quan sát các Pod mới tạo chưa được gán node và chọn node phù hợp nhất để chạy Pod.
  - `R1.4`: `kube-controller-manager` thực thi các tiến trình controller điều khiển để duy trì hành vi của Kubernetes API.
  - `R1.5`: `cloud-controller-manager` nhúng logic điều khiển đặc thù của nhà cung cấp điện toán đám mây vào cluster.
  - `R1.6`: Kubernetes áp dụng mô hình "hub-and-spoke": mọi truy cập API từ các node (hoặc Pods) đều kết thúc tại API server; không thành phần control plane nào khác mở service từ xa.
  - `R1.7`: Các thành phần control plane nội bộ cũng giao tiếp với API server thông qua cổng HTTPS bảo mật.
  - `R1.8`: Kết nối từ API server tới kubelet trên worker node được dùng cho việc lấy log, kubectl attach/exec, và port-forward.
  - `R1.9`: Các thành phần chạy trên worker node gồm có kubelet, container runtime, và kube-proxy.
  - `R1.10`: Container Runtime Interface (CRI) là giao diện plugin cho phép kubelet sử dụng đa dạng runtime mà không cần biên dịch lại core Kubernetes.
  - `R1.11`: `kubelet` đóng vai trò là client kết nối tới container runtime thông qua giao thức gRPC.
  - `R1.12`: `kube-proxy` chạy trên từng node để phản ánh các Service trong Kubernetes API và thực hiện chuyển tiếp luồng TCP, UDP, SCTP.
  - `R1.13`: Container Runtime phải được cấu hình để nạp plugin CNI nhằm hiện thực hóa mô hình mạng của Kubernetes.
  - `R1.14`: Controller trong Kubernetes là vòng lặp điều khiển liên tục quan sát trạng thái thực tế và kéo nó về gần với trạng thái mong muốn (desired state).
  - `R1.15`: Node control plane tự dựng (kubeadm) là máy chủ lưu trữ các thành phần control plane gồm etcd và API server.
  - `R1.16`: `kind` chạy cluster Kubernetes cục bộ phục vụ kiểm thử và học tập bằng cách dùng các Docker container đóng vai trò là node.
  - `R1.17`: Dự án Kubernetes duy trì các nhánh phát hành và hỗ trợ bản vá cho 3 phiên bản minor gần nhất.

- **R2 Claims**:
  - `R2.1`: The Kubernetes project maintains release branches for the three most recent minor releases.
  - `R2.2`: Kubernetes minor releases from 1.19 onwards receive approximately one year of patch support.
  - `R2.3`: Kubernetes release versions follow Semantic Versioning formatted as x.y.z.
  - `R2.4`: Kubernetes releases that have reached end-of-life no longer receive bug fixes or security updates.
  - `R2.5`: Kubernetes release cycle changed from four releases per year to three releases per year.
  - `R2.6`: Kubernetes officially adheres to a cadence of three releases per calendar year.
  - `R2.7`: A Kubernetes release cycle has an approximate length of 15 weeks.
  - `R2.8`: kind runs a local Kubernetes cluster by running Docker containers as cluster nodes.
  - `R2.9`: Creating a Kubernetes cluster in kind is initiated using the kind create cluster command.
  - `R2.10`: kind allows assigning a custom cluster context name using the --name flag.
  - `R2.11`: kind allows pre-loading local container images into cluster nodes with kind load docker-image.
  - `R2.12`: kind uses a specialized node-image container to run Kubernetes control plane and worker components.
  - `R2.13`: The Container Runtime Interface (CRI) enables kubelet to use runtimes without recompiling Kubernetes.
  - `R2.14`: CRI defines the primary gRPC communication protocol between kubelet and container runtimes.
  - `R2.15`: The kubelet connects to the local container runtime over gRPC acting as a client.
  - `R2.16`: Kubelet specifies the runtime gRPC endpoint using the --container-runtime-endpoint flag.
  - `R2.17`: Kubernetes v1.26 and later strictly requires container runtimes to support the v1 CRI API.
  - `R2.18`: Kubelet refuses to register a node if its container runtime does not support the v1 CRI API.
