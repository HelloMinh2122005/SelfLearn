# Evidence Index: WRITE-CTR-6_1_8

- **Task ID**: WRITE-CTR-6_1_8
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_8 Container Lifecycle PID 1 and Signals.md`
- **Topic Title**: 6_1_8 Container Lifecycle PID 1 and Signals
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_8.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R8.1`: Chỉ các signal mà init đã đăng ký handler mới gửi được tới init của PID namespace từ thành viên khác, kể cả process đặc quyền.
  - `R8.2`: Process ở namespace tổ tiên chỉ gửi được signal tới init của PID namespace con nếu init có handler cho signal đó.
  - `R8.3`: SIGKILL và SIGSTOP là ngoại lệ: được chuyển cưỡng bức khi gửi từ PID namespace tổ tiên.
  - `R8.4`: kill(2): signal duy nhất gửi được tới PID 1 là signal mà init đã cài handler.
  - `R8.5`: Process đầu tiên trong PID namespace có PID 1 và là init của namespace.
  - `R8.6`: Process mồ côi được gán lại cho init của PID namespace của cha nó.
  - `R8.7`: Khi init của PID namespace kết thúc, kernel giết mọi process trong namespace bằng SIGKILL.
  - `R8.8`: Child đã kết thúc mà cha chưa wait sẽ ở trạng thái zombie.
  - `R8.9`: docker stop: process chính nhận SIGTERM, sau thời gian chờ thì SIGKILL.
  - `R8.10`: Signal đầu tiên của docker stop có thể đổi bằng STOPSIGNAL hoặc --stop-signal.
  - `R8.11`: podman stop mặc định gửi SIGTERM rồi SIGKILL sau thời gian chờ; --time mặc định 10 giây.
  - `R8.12`: ENTRYPOINT dạng shell chạy như lệnh con của /bin/sh -c, không chuyển signal; executable không phải PID 1 và không nhận SIGTERM từ docker stop.
  - `R8.13`: podman run --init chạy một init trong container để chuyển signal và thu dọn process.
  - `R8.14`: docker run --init dùng init làm PID 1, đảm nhiệm việc thu dọn zombie.
  - `R8.15`: tini là một init nhỏ nhưng hợp lệ cho container.
  - `R8.16`: docker run: exit code 125 nghĩa là lỗi ở chính Docker daemon.
  - `R8.17`: docker run: exit code 126 nghĩa là lệnh trong container không thể được gọi thực thi.
  - `R8.18`: docker run: exit code 127 nghĩa là không tìm thấy lệnh trong container.
  - `R8.19`: Exit code khác 125, 126, 127 là exit code của lệnh trong container.
  - `R8.20`: Bash: lệnh bị kết thúc bởi signal n có exit status 128+n.
  - `R8.21`: SIGKILL và SIGSTOP không thể bị bắt, chặn hay bỏ qua.
  - `R8.22`: docker container start khởi động một hoặc nhiều container đã dừng.
  - `R8.23`: docker container rm xóa một hoặc nhiều container.
