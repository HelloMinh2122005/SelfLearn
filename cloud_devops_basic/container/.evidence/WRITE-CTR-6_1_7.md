# Evidence Index: WRITE-CTR-6_1_7

- **Task ID**: WRITE-CTR-6_1_7
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_7 Container Security Fundamentals.md`
- **Topic Title**: 6_1_7 Container Security Fundamentals
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_7.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R7.1`: User namespace cô lập định danh/thuộc tính liên quan bảo mật: user ID, group ID, root directory, keys và capabilities.
  - `R7.2`: Một process có thể là user không đặc quyền bên ngoài user namespace nhưng có user ID 0 bên trong.
  - `R7.3`: /proc/pid/uid_map và gid_map cho thấy ánh xạ user/group ID trong user namespace (từ Linux 3.5).
  - `R7.4`: subuid cho phép một user ánh xạ các dải user ID của nó sang namespace con.
  - `R7.5`: Podman rootless yêu cầu user có dải UID trong /etc/subuid và /etc/subgid.
  - `R7.6`: Linux chia đặc quyền của superuser thành các đơn vị riêng gọi là capabilities, bật/tắt độc lập.
  - `R7.7`: CAP_NET_ADMIN cho phép các thao tác mạng như cấu hình interface, quản trị firewall IP, sửa bảng định tuyến.
  - `R7.8`: podman run --cap-drop bỏ capability khỏi tập mặc định của Podman, hoặc all để bỏ hết.
  - `R7.9`: Mặc định container Docker là "unprivileged", ví dụ không chạy được Docker daemon bên trong.
  - `R7.10`: Mặc định container không được truy cập thiết bị nào.
  - `R7.11`: seccomp là tính năng kernel Linux dùng để hạn chế hành động trong container.
  - `R7.12`: Chế độ SECCOMP_SET_MODE_FILTER xác định syscall được phép bằng một chương trình BPF.
  - `R7.13`: Docker seccomp chỉ có khi Docker build kèm seccomp và kernel bật CONFIG_SECCOMP.
  - `R7.14`: Podman: tùy chọn volume z gắn nhãn chia sẻ cho nội dung dùng chung giữa nhiều container.
  - `R7.15`: Podman: tùy chọn volume Z gắn nhãn riêng, chỉ container hiện tại dùng được.
  - `R7.16`: Podman: --security-opt label=disable tắt tách nhãn cho container.
  - `R7.17`: Podman --userns keep-id ánh xạ user của máy chủ vào cùng UID trong container.
  - `R7.18`: Docker nêu bốn khu vực cần xem xét bảo mật, trong đó có tính bảo mật nội tại của kernel (namespaces, cgroups) và bề mặt tấn công của daemon.
  - `R7.19`: Docker: cờ --privileged "Give extended privileges to this container".
