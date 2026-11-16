# Evidence Index: WRITE-CTR-6_1_6

- **Task ID**: WRITE-CTR-6_1_6
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_6 Container Runtimes and Ecosystem.md`
- **Topic Title**: 6_1_6 Container Runtimes and Ecosystem
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_6.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R6.1`: dockerd lắng nghe Docker API request và quản lý image, container, network, volume.
  - `R6.2`: Docker client gửi lệnh như docker run tới dockerd để dockerd thực hiện.
  - `R6.3`: Podman là công cụ không cần daemon (daemonless).
  - `R6.4`: conmon là chương trình giám sát và kênh liên lạc giữa container manager (Podman, CRI-O) và OCI runtime (runc, crun) cho một container.
  - `R6.5`: conmon khởi chạy runtime như tiến trình con của nó.
  - `R6.6`: runc là công cụ CLI tạo và chạy container theo OCI specification.
  - `R6.7`: README của crun nêu crun nhanh hơn runc và dùng bộ nhớ ít hơn nhiều (số liệu do chính dự án đo).
  - `R6.8`: Cần cài container runtime vào mỗi node để Pod chạy được.
  - `R6.9`: Kubernetes 1.37 yêu cầu runtime tuân thủ CRI (Container Runtime Interface).
  - `R6.10`: Dockershim bị gỡ khỏi Kubernetes từ bản 1.24.
  - `R6.11`: Trang runtime của Kubernetes liệt kê containerd, CRI-O, Docker Engine, Mirantis Container Runtime.
  - `R6.12`: CRI-O mô tả mình là container runtime nhẹ dành cho Kubernetes.
  - `R6.13`: containerd tự mô tả là container runtime chuẩn công nghiệp, nhấn mạnh đơn giản, bền vững, di động.
  - `R6.14`: Docker Engine 29.0 trở lên dùng containerd image store mặc định cho cài mới.
  - `R6.15`: Kubernetes cho chọn runtime khác nhau cho từng Pod để cân bằng hiệu năng và bảo mật (RuntimeClass).
  - `R6.16`: kubectl get nodes -o wide có cột CONTAINER-RUNTIME hiển thị runtime và phiên bản.
