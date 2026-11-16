# Evidence Index: WRITE-CTR-6_1_4

- **Task ID**: WRITE-CTR-6_1_4
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_4 Images Layers and Overlay Filesystem.md`
- **Topic Title**: 6_1_4 Images Layers and Overlay Filesystem
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_4.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R4.1`: Container image gồm các layer; mỗi layer là một tập thay đổi filesystem (thêm, xóa, sửa file).
  - `R4.2`: Image là bất biến: tạo xong không sửa được, chỉ tạo image mới hoặc thêm thay đổi lên trên.
  - `R4.3`: Mỗi layer, một khi tạo ra, là bất biến.
  - `R4.4`: Khi chạy container, một union filesystem được tạo, xếp các layer chồng lên nhau thành một góc nhìn thống nhất.
  - `R4.5`: Root directory của container được đặt vào thư mục hợp nhất này bằng chroot.
  - `R4.6`: Khác biệt chính giữa container và image là lớp ghi (writable layer) trên cùng.
  - `R4.7`: Mọi thao tác ghi của container nằm ở writable layer; xóa container thì lớp này bị xóa, image gốc không đổi.
  - `R4.8`: Thay đổi gồm ghi mới, sửa và xóa file đều được ghi vào lớp container mỏng này.
  - `R4.9`: overlayfs ghép hai thư mục lowerdir và upperdir thành thư mục merged tại thời điểm mount.
  - `R4.10`: workdir phải nằm cùng filesystem với upperdir.
  - `R4.11`: Nhiều lowerdir xếp chồng từ phải sang trái; nếu bỏ upperdir và workdir thì overlay chỉ đọc.
  - `R4.12`: Khi ghi hoặc đổi metadata một file ở lower, file được copy_up từ lower lên upper trước.
  - `R4.13`: Xóa file ở overlay được ghi lại bằng whiteout ở upper mà không đổi lower.
  - `R4.14`: Khi thấy whiteout ở upper, tên trùng ở lower bị bỏ qua và bản thân whiteout cũng bị ẩn.
  - `R4.15`: Layering dựa trên content-addressable storage và union filesystem.
  - `R4.16`: Image manifest chứa metadata và định danh theo nội dung (content-addressable) của các layer changeset archive.
  - `R4.17`: Image configuration chứa thông tin như tham số ứng dụng, biến môi trường; JSON này coi là bất biến vì đổi nó sẽ đổi ImageID.
  - `R4.18`: Trường User trong config là username hoặc UID mà process chạy với, làm giá trị mặc định.
  - `R4.19`: Trường WorkingDir đặt thư mục làm việc mặc định của entrypoint process.
  - `R4.20`: Docker coi pull theo digest là cách dùng định danh bất biến; tag tiện lợi và pull lại tag để lấy bản mới nhất.
  - `R4.21`: Docker Engine 29.0 trở lên dùng containerd image store mặc định cho cài mới (snapshotter thay classic storage driver).
  - `R4.22`: podman history in thông tin từng layer của image.
  - `R4.23`: Dữ liệu ghi nhiều, cần tồn tại sau container hoặc chia sẻ giữa container nên dùng Docker volume.
  - `R4.24`: Whiteout được tạo như character device 0/0 hoặc file thường kích thước 0 có xattr trusted.overlay.whiteout.
  - `R4.25`: Ví dụ mount overlay trong tài liệu kernel dùng lowerdir, upperdir, workdir và thư mục /merged.
