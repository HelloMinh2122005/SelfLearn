### VERIFY LEDGER: WRITE-6_8_3 chunk V1
**Verifier**: `verifier`, mode full

| ID | Lesson | Claim as written | URL + section | Quote | Applies to | Status | Correct statement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C3.1 | 6_8_3 | Kubernetes quy định các ứng dụng chạy trong container ghi dữ liệu log ra hai luồng xuất chuẩn là standard output (stdout) và standard error (stderr) | https://kubernetes.io/docs/concepts/cluster-administration/logging/#how-nodes-handle-container-logs | "A container runtime handles and redirects any output generated to a containerized application's stdout and stderr streams." | Kubernetes 1.21+ | VERIFIED | |
| C3.2 | 6_8_3 | Container runtime chặn bắt stdout/stderr và ghi nối tiếp vào các tệp log trên host node tại thư mục /var/log/pods/ | https://kubernetes.io/docs/concepts/cluster-administration/logging/#system-component-logs | "By default, kubelet directs your container runtime to write logs into directories within /var/log/pods." | Kubernetes 1.21+ | VERIFIED | |
| C3.3 | 6_8_3 | Kubelet trên từng worker node quản lý log rotation cục bộ thông qua các tham số cấu hình containerLogMaxSize và containerLogMaxFiles | https://kubernetes.io/docs/concepts/cluster-administration/logging/#log-rotation | "The kubelet is responsible for rotating container logs and managing the logging directory structure... You can configure two kubelet configuration settings, containerLogMaxSize (default 10Mi) and containerLogMaxFiles (default 5), using the kubelet configuration file." | Kubernetes 1.21+ | VERIFIED | |
| C3.4 | 6_8_3 | Khi một Pod bị xóa khỏi node hoặc bị trục xuất (evicted), toàn bộ tập tin log cục bộ của Pod đó trên worker node sẽ bị dọn dẹp và xóa bỏ | https://kubernetes.io/docs/concepts/cluster-administration/logging/#how-nodes-handle-container-logs | "If a pod is evicted from the node, all corresponding containers are also evicted, along with their logs." | Kubernetes 1.21+ | VERIFIED | |
| C3.5 | 6_8_3 | Lệnh kubectl logs gửi yêu cầu đến API Server, API Server ủy quyền kết nối trực tiếp đến kubelet trên worker node lưu giữ Pod để lấy dữ liệu log | https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/#api-server-to-kubelet | "The connections from the API server to the kubelet are used for: Fetching logs for pods." | Kubernetes 1.21+ | VERIFIED | |
| C3.6 | 6_8_3 | Khi container crash, cờ --previous (hoặc -p) trong kubectl logs cho phép trích xuất log của container instance trước đó vừa bị chấm dứt | https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#logs | "previous p false If true, print the logs for the previous instance of the container in a pod if it exists." | kubectl / Kubernetes 1.21+ | VERIFIED | |
| C3.7 | 6_8_3 | Cờ --since trong kubectl logs hỗ trợ lọc và chỉ hiển thị các dòng log được ghi nhận trong một khoảng thời gian tương đối đã chỉ định | https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#logs | "since 0s Only return logs newer than a relative duration like 5s, 2m, or 3h. Defaults to all logs." | kubectl / Kubernetes 1.21+ | VERIFIED | |
| C3.8 | 6_8_3 | Cờ -l (hoặc --selector) cho phép người vận hành lọc và gom log từ tất cả các Pod khớp với nhãn (label) được cung cấp | https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#logs | "selector l Selector (label query) to filter on, supports '=', '==', and '!='.(e.g. -l key1=value1,key2=value2). Matching objects must satisfy all of the specified label constraints." | kubectl / Kubernetes 1.21+ | VERIFIED | |
| C3.9 | 6_8_3 | Khi tổng hợp log từ nhiều Pod hoặc nhiều container cùng lúc, cờ --prefix tự động bổ sung tiền tố định danh gồm tên Pod và tên container ở đầu mỗi dòng xuất | https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#logs | "prefix false Prefix each log line with the log source (pod name and container name)" | kubectl / Kubernetes 1.21+ | VERIFIED | |
| C3.10 | 6_8_3 | Cờ -f (hoặc --follow) duy trì kết nối luồng dữ liệu liên tục để hiển thị ngay khi có dòng log mới xuất hiện theo thời gian thực | https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#logs | "follow f false Specify if the logs should be streamed." | kubectl / Kubernetes 1.21+ | VERIFIED | |

#### Notes
- C3.1: Verified against official Kubernetes Logging Architecture documentation (how nodes handle container logs).
- C3.2: Verified against official Kubernetes Logging Architecture documentation (system component logs, pod log directory).
- C3.3: Verified against official Kubernetes Logging Architecture documentation (log rotation section).
- C3.4: Verified against official Kubernetes Logging Architecture documentation (how nodes handle container logs).
- C3.5: Verified against official Kubernetes Architecture documentation (Communication between Nodes and the Control Plane: API server to kubelet).
- C3.6: Verified against official kubectl commands reference (kubectl logs flags).
- C3.7: Verified against official kubectl commands reference (kubectl logs flags).
- C3.8: Verified against official kubectl commands reference (kubectl logs flags).
- C3.9: Verified against official kubectl commands reference (kubectl logs flags).
- C3.10: Verified against official kubectl commands reference (kubectl logs flags).
