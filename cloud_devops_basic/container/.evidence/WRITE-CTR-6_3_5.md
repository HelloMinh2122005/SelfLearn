# Evidence Index: WRITE-CTR-6_3_5

- **Task ID**: WRITE-CTR-6_3_5
- **Assignee**: writer-1
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_3 Kubernetes Architecture and Core Workloads/6_3_5 Liveness Readiness and Startup Probes.md`
- **Topic Title**: 6_3_5 Liveness Readiness and Startup Probes
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_3-R1.md`
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_3-R2.md`

## Claim IDs Used
- **R1 Claims**:
  - `R1.58`: Probe là phép kiểm tra chẩn đoán do kubelet thực hiện định kỳ trên container thông qua thực thi lệnh hoặc gửi request mạng.
  - `R1.59`: Startup probe kiểm tra xác nhận ứng dụng bên trong container đã khởi động thành công hay chưa.
  - `R1.60`: Khi startup probe được cấu hình, Kubernetes tạm ngừng thực thi liveness và readiness probe cho đến khi startup probe thành công.
  - `R1.61`: Nếu startup probe thất bại, kubelet sẽ tiêu diệt container và áp dụng chính sách restartPolicy của Pod.
  - `R1.62`: Liveness probe xác định thời điểm cần khởi động lại container, ví dụ phát hiện lỗi bế tắc (deadlock) khi tiến trình còn sống nhưng tê liệt.
  - `R1.63`: Nếu container thất bại kiểm tra liveness probe vượt quá số lần cấu hình cho phép, kubelet sẽ restart container đó.
  - `R1.64`: Readiness probe xác định thời điểm container sẵn sàng tiếp nhận lưu lượng truy cập mạng.
  - `R1.65`: Khi readiness probe trả về trạng thái thất bại, EndpointSlice controller gỡ địa chỉ IP của Pod khỏi EndpointSlice của mọi Service liên kết.
  - `R1.66`: Readiness probe tiếp tục chạy định kỳ trên container trong suốt toàn bộ vòng đời của nó chứ không chỉ chạy lúc khởi động.
  - `R1.67`: Kiểm tra TCP probe mở một socket tới cổng chỉ định của container; nếu kết nối thành công là healthy, thất bại là failure.
  - `R1.68`: Kiểm tra gRPC probe cho phép kubelet thăm dò tình trạng liveness thông qua giao thức chuẩn gRPC Health Checking Protocol.
  - `R1.69`: Startup probe cho app khởi động chậm cần đặt `failureThreshold * periodSeconds` đủ lớn để bao quát thời gian khởi động tối đa.
  - `R1.70`: Readiness và liveness probe có thể chạy song song độc lập trên cùng một container để vừa ngăn traffic vào pod chưa sẵn sàng vừa tự hồi phục khi chết.

- **R2 Claims**:
  - `R2.75`: livenessProbe exec handler executes an arbitrary command inside the container.
  - `R2.76`: livenessProbe httpGet handler performs an HTTP GET check against a path and port.
  - `R2.77`: readinessProbe and livenessProbe support tcpSocket handler opening a TCP socket connection.
  - `R2.78`: livenessProbe supports grpc handler performing standard gRPC HealthCheckRequest.
  - `R2.79`: startupProbe allows slow containers startup time bounded by failureThreshold * periodSeconds.
  - `R2.80`: Readiness probes and liveness probes can run in parallel on the same container.
  - `R2.81`: Probe exec handler field specifies a command executed inside the container.
  - `R2.82`: Probe httpGet handler field specifies an HTTP GET request to perform.
  - `R2.83`: Probe tcpSocket handler field specifies a connection check to a TCP port.
  - `R2.84`: Probe grpc handler field specifies a GRPC HealthCheckRequest.
  - `R2.85`: Probe initialDelaySeconds specifies seconds to wait before initiating probes.
  - `R2.86`: Probe periodSeconds specifies seconds between probes, defaulting to 10 with minimum 1.
  - `R2.87`: Probe timeoutSeconds specifies seconds before probe times out, defaulting to 1 with minimum 1.
  - `R2.88`: Probe failureThreshold specifies consecutive failures before failure status, defaulting to 3.
  - `R2.89`: Probe successThreshold specifies consecutive successes after failure, defaulting to 1.
