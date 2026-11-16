# Evidence Index: WRITE-CTR-6_1_3

- **Task ID**: WRITE-CTR-6_1_3
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_3 Control Groups v2 for Containers.md`
- **Topic Title**: 6_1_3 Control Groups v2 for Containers
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_3.md`
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_1.md` (dùng R1.11)
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R1.11`: Mặc định một container không bị giới hạn tài nguyên và dùng được bao nhiêu tùy bộ lập lịch của kernel máy chủ.
  - `R3.1`: cgroup v2 chỉ có một hierarchy duy nhất (khác v1).
  - `R3.2`: memory.max là giới hạn cứng bộ nhớ, mặc định "max", cơ chế chính để giới hạn bộ nhớ của cgroup.
  - `R3.3`: Khi bộ nhớ cgroup chạm giới hạn và không giảm được, OOM killer được gọi trong cgroup đó.
  - `R3.4`: memory.events có trường oom_kill đếm số process của cgroup bị OOM killer giết.
  - `R3.5`: memory.current là tổng bộ nhớ cgroup và các cgroup con đang dùng.
  - `R3.6`: memory.peak ghi mức dùng bộ nhớ tối đa kể từ khi tạo cgroup hoặc lần reset gần nhất.
  - `R3.7`: cpu.max có dạng "$MAX $PERIOD", mặc định "max 100000"; "max" nghĩa là không giới hạn.
  - `R3.8`: cpu.weight mặc định 100, dải [1, 10000] với nhóm không idle.
  - `R3.9`: cpu.weight chia CPU theo tỉ lệ cho các nhóm đang hoạt động (kiểu "weight").
  - `R3.10`: pids.max là giới hạn cứng số process, mặc định "max".
  - `R3.11`: fork() hoặc clone() trả -EAGAIN nếu tạo process mới sẽ vi phạm chính sách PID của cgroup.
  - `R3.12`: Khi dùng cờ giới hạn tài nguyên, Docker sửa cài đặt cgroup của container trên máy chủ.
  - `R3.13`: Podman: --pids-limit giới hạn số pid của container, -1 là không giới hạn, mặc định 2048 nếu hệ thống hỗ trợ pids cgroup controller.
  - `R3.14`: Podman: --memory đặt giới hạn bộ nhớ cho container.
  - `R3.15`: Podman: --cpus mặc định 0.0 là không giới hạn và là cách viết tắt của --cpu-period và --cpu-quota.
  - `R3.16`: Docker: --cpus="1.5" tương đương --cpu-period="100000" và --cpu-quota="150000".
  - `R3.17`: Kubernetes: giới hạn cpu được thực thi bằng throttling; chạm giới hạn thì kernel hạn chế truy cập CPU.
  - `R3.18`: Kubernetes: giới hạn memory do kernel thực thi bằng OOM kill, và chỉ khi kernel phát hiện áp lực bộ nhớ.
  - `R3.19`: Bash: lệnh bị kết thúc bởi tín hiệu n có exit status 128+n.
  - `R3.20`: SIGKILL không thể bị bắt, chặn hay bỏ qua.
  - `R3.21`: /proc/pid/cgroup mô tả các control group mà process thuộc về; mỗi hierarchy một dòng dạng hierarchy-ID:controller-list:cgroup-path.
  - `R3.22`: podman inspect có thể dùng --format với Go template; ví dụ {{.State.OOMKilled}}.
  - `R3.23`: Podman: tùy chọn --memory không được hỗ trợ trên hệ thống rootless dùng cgroups v1.
  - `R3.24`: Podman: ở một số hệ thống, người dùng không phải root có thể không được đổi giới hạn CPU.
  - `R3.25`: Trong /proc/pid/cgroup, với hierarchy cgroup v2 trường hierarchy-ID là 0 và trường controller-list rỗng; trường thứ ba là đường dẫn cgroup.
  - `R3.26`: cgroup v2 hierarchy được mount bằng mount -t cgroup2 none $MOUNT_POINT.
