# Evidence Index: WRITE-CTR-6_2_2

- **Task ID**: WRITE-CTR-6_2_2
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_2 Container Image Engineering/6_2_2 Build Context and dockerignore.md`
- **Topic Title**: 6_2_2 Build Context and dockerignore
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_2_2.md`
- **Gate status**: G1, G2, G3, G4 đạt. **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R2.1`: Build context là tập file mà quá trình build truy cập được.
  - `R2.2`: Đối số vị trí của lệnh build xác định context được dùng.
  - `R2.3`: Build client tìm .dockerignore ở thư mục gốc của context; file khớp mẫu bị loại khỏi context trước khi gửi tới builder.
  - `R2.4`: File ignore riêng cho Dockerfile (tên <Dockerfile>.dockerignore) được ưu tiên hơn .dockerignore ở gốc context.
  - `R2.5`: Cú pháp .dockerignore là danh sách mẫu mỗi dòng, giống file glob của shell Unix.
  - `R2.6`: Công cụ như Podman/Buildah tìm .containerignore hoặc .dockerignore trong thư mục gốc của context.
  - `R2.7`: podman build --ignorefile chỉ định đường dẫn tới file .containerignore khác.
