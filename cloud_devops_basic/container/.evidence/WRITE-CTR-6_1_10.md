# Evidence Index: WRITE-CTR-6_1_10

- **Task ID**: WRITE-CTR-6_1_10
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_10 Container Data Storage.md`
- **Topic Title**: 6_1_10 Container Data Storage
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_10.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R10.1`: Docker volume là kho dữ liệu bền do Docker tạo và quản lý.
  - `R10.2`: Volume có thể tạo bằng docker volume create hoặc Docker tạo khi tạo container/service.
  - `R10.3`: Volume là cơ chế được ưu tiên để lưu dữ liệu do container sinh ra và dùng.
  - `R10.4`: Bind mount gắn file/thư mục của máy chủ vào container; volume thì tạo thư mục mới trong vùng lưu trữ của Docker.
  - `R10.5`: Bind mount mặc định có quyền ghi vào file trên máy chủ.
  - `R10.6`: Hệ quả bảo mật của bind mount: process trong container có thể tạo/sửa/xóa file hệ thống quan trọng trên máy chủ.
  - `R10.7`: tmpfs mount là tạm thời, chỉ nằm trong bộ nhớ máy chủ, bị xóa khi container dừng.
  - `R10.8`: Dữ liệu tmpfs tính vào giới hạn bộ nhớ cgroup của container.
  - `R10.9`: Podman -v tạo bind mount từ thư mục máy chủ; -v <volume>:<dir> mount named volume, tạo mới nếu chưa có.
  - `R10.10`: Podman --tmpfs gắn một tmpfs vào container.
  - `R10.11`: Podman --mount=type=... hỗ trợ các loại: artifact, bind, devpts, glob, image, ramfs, tmpfs, volume.
  - `R10.12`: Podman tùy chọn volume U/chown đổi đệ quy chủ sở hữu của volume nguồn theo UID/GID của container.
  - `R10.13`: Podman --userns keep-id ánh xạ user của bạn sang cùng UID trong container.
  - `R10.14`: Podman tùy chọn volume z gắn nhãn chia sẻ; Z gắn nhãn riêng chỉ container hiện tại dùng được.
  - `R10.15`: Lớp ghi của container bị xóa cùng container; dữ liệu cần tồn tại sau container nên dùng volume.
