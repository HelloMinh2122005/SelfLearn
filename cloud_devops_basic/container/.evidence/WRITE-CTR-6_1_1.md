# Evidence Index: WRITE-CTR-6_1_1

- **Task ID**: WRITE-CTR-6_1_1
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_1 Containers vs Virtual Machines.md`
- **Topic Title**: 6_1_1 Containers vs Virtual Machines
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_1.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R1.1`: Docker mô tả container là các process bị cô lập, mỗi process cho một thành phần của ứng dụng.
  - `R1.2`: Container là một process bị cô lập cùng với các file nó cần để chạy.
  - `R1.3`: Một VM là cả một hệ điều hành với kernel, driver phần cứng, chương trình và ứng dụng riêng.
  - `R1.4`: Nhiều container trên cùng máy chủ dùng chung một kernel.
  - `R1.5`: Dựng cả VM chỉ để cô lập một ứng dụng là tốn chi phí (overhead) lớn.
  - `R1.6`: Trên cloud, máy được cấp thường là VM; một VM có container runtime có thể chạy nhiều ứng dụng container hóa, tăng mức sử dụng tài nguyên và giảm chi phí.
  - `R1.7`: Docker nêu 4 đặc tính của container, trong đó có "Isolated": container chạy cô lập nên ít ảnh hưởng tới máy chủ và container khác.
  - `R1.8`: Container "self-contained": có mọi thứ cần để chạy, không phụ thuộc gói cài sẵn trên máy chủ.
  - `R1.9`: Namespace là cơ chế kernel làm cho process trong namespace thấy một bản riêng của tài nguyên toàn cục.
  - `R1.10`: cgroup v2 có giới hạn cứng bộ nhớ qua file memory.max, là cơ chế chính để giới hạn bộ nhớ của một cgroup.
  - `R1.11`: Mặc định một container không bị giới hạn tài nguyên và dùng được bao nhiêu tùy bộ lập lịch của kernel máy chủ.
  - `R1.12`: Kubernetes cho phép chọn runtime dùng ảo hóa phần cứng cho workload cần đảm bảo bảo mật cao, đổi lại thêm overhead.
  - `R1.13`: Runtime cách ly thay thế mang lại thêm cô lập nhưng phải trả thêm overhead.
  - `R1.14`: podman run -d chạy container nền và in ID container mới.
  - `R1.15`: podman run --rm tự xóa container (và anonymous volume) khi nó thoát.
  - `R1.16`: podman run --name gán tên cho container.
  - `R1.17`: podman top hiển thị các process đang chạy của container.
  - `R1.18`: uname -r in ra kernel release.
