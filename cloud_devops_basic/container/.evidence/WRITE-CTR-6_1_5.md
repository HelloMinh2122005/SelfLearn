# Evidence Index: WRITE-CTR-6_1_5

- **Task ID**: WRITE-CTR-6_1_5
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_1 Container Fundamentals/6_1_5 Open Container Initiative Specifications.md`
- **Topic Title**: 6_1_5 Open Container Initiative Specifications
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_1_5.md`
- **Gate status**: G1 (quotes OK), G2, G3, G4 (`evidence.py lesson` 0 errors). **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R5.1`: OCI được Docker, CoreOS và các bên khác ra mắt ngày 22-06-2015.
  - `R5.2`: OCI hiện có ba đặc tả: runtime-spec, image-spec, distribution-spec.
  - `R5.3`: Runtime Specification mô tả cách chạy một "filesystem bundle" đã được giải nén trên đĩa.
  - `R5.4`: Luồng tổng quát: tải OCI Image, giải nén thành runtime filesystem bundle, rồi bundle được chạy bởi một OCI Runtime.
  - `R5.5`: Cấu hình container được chỉ định trong config.json.
  - `R5.6`: Một OCI Image gồm image manifest, image index (tùy chọn), tập filesystem layer và configuration.
  - `R5.7`: Mục tiêu của image-spec là công cụ build, vận chuyển và chuẩn bị chạy image có thể tương thích lẫn nhau.
  - `R5.8`: Image index là manifest cấp cao hơn trỏ tới danh sách manifest, thường thay đổi theo nền tảng.
  - `R5.9`: Content Descriptor gồm loại nội dung, định danh nội dung (digest) và kích thước byte.
  - `R5.10`: Distribution spec đạt v1.0 tháng 05-2020, chuẩn hóa API phân phối image.
  - `R5.11`: API lấy manifest có dạng /v2/<name>/manifests/<tag-or-digest>, trong đó giá trị là digest của manifest hoặc một tag.
  - `R5.12`: API liệt kê tag có dạng /v2/<name>/tags/list.
  - `R5.13`: runC được tặng cho OCI làm nền tảng của nỗ lực chuẩn hóa này.
  - `R5.14`: runc là công cụ CLI tạo và chạy container theo OCI specification.
  - `R5.15`: Podman làm việc với OCI Containers và Container Images.
  - `R5.16`: CRI-O cho phép kéo từ registry tuân chuẩn và chạy mọi container tuân chuẩn OCI.
