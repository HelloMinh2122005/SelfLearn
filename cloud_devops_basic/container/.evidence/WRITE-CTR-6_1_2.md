# Evidence Index: WRITE-CTR-6_1_2

- **Task ID**: WRITE-CTR-6_1_2
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_2 Linux Namespaces for Containers.md`
- **Topic Title**: 6_1_2 Linux Namespaces for Containers
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_2.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R2.1`: Namespace bao một tài nguyên toàn cục trong một lớp trừu tượng để process trong namespace thấy bản cô lập riêng.
  - `R2.2`: Linux có 8 loại namespace, mỗi loại ứng với một cờ CLONE_NEW*: cgroup, IPC, mount, network, PID, time, user, UTS.
  - `R2.3`: Time namespace có handle /proc/pid/ns/time, xuất hiện từ Linux 5.6.
  - `R2.4`: Mỗi process có thư mục /proc/pid/ns/ chứa một mục cho mỗi namespace hỗ trợ setns(2).
  - `R2.5`: Nội dung symlink trong /proc/pid/ns là chuỗi gồm loại namespace và số inode (ví dụ uts:[4026531838]).
  - `R2.6`: Process đầu tiên tạo bằng CLONE_NEWPID có PID 1 và là process "init" của namespace đó.
  - `R2.7`: Khi init của một PID namespace kết thúc, kernel giết mọi process trong namespace bằng SIGKILL.
  - `R2.8`: Process mồ côi được gán lại (reparent) cho init của PID namespace của cha nó.
  - `R2.9`: Một thiết bị mạng vật lý chỉ thuộc đúng một network namespace.
  - `R2.10`: Cặp thiết bị veth hoạt động như đường ống nối các network namespace.
  - `R2.11`: Khi một network namespace bị giải phóng, các thiết bị veth bên trong bị hủy.
  - `R2.12`: lsns liệt kê thông tin về mọi namespace đang truy cập được hoặc về một namespace cụ thể.
  - `R2.13`: unshare chạy một chương trình trong namespace mới.
  - `R2.14`: nsenter chạy một chương trình trong các namespace đã có (chỉ định bằng tùy chọn dòng lệnh).
  - `R2.15`: unshare -p/--pid tạo PID namespace mới.
  - `R2.16`: unshare -f/--fork chạy chương trình như tiến trình con của unshare, hữu ích khi tạo PID namespace mới.
  - `R2.17`: unshare -u/--uts tạo UTS namespace mới.
  - `R2.18`: unshare -n/--net tạo network namespace mới.
  - `R2.19`: nsenter -t/--target chỉ định process đích để lấy ngữ cảnh namespace (đọc từ /proc/pid/ns/*).
  - `R2.20`: nsenter -n/--net vào network namespace; không đối số thì vào network namespace của process đích.
  - `R2.21`: lsns -t lọc theo loại namespace; hỗ trợ mnt, net, ipc, user, pid, uts, cgroup, time.
  - `R2.22`: Cột "Isolates" của namespaces(7) cho cgroup, IPC, network, mount: cgroup root directory; System V IPC và POSIX message queues; network devices, stacks, ports; mount points.
  - `R2.23`: Cột "Isolates" cho PID, time, user, UTS: process IDs; boot và monotonic clocks; user và group IDs; hostname và NIS domain name.
  - `R2.24`: Tạo PID namespace bền vững (persistent) sẽ lỗi nếu không chỉ định --fork.
  - `R2.25`: Trang unshare(1) ở mục --pid nhắc xem thêm các tùy chọn --fork và --mount-proc.
