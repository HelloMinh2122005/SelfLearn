# Evidence Index: WRITE-CTR-6_2_3

- **Task ID**: WRITE-CTR-6_2_3
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_2 Container Image Engineering/6_2_3 Layer Caching.md`
- **Topic Title**: 6_2_3 Layer Caching
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_2_3.md`
- **Gate status**: G1, G2, G3, G4 đạt. **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R3.1`: Layer được dùng lại từ cache nếu lệnh và các file nó phụ thuộc không đổi kể từ lần build trước.
  - `R3.2`: Nếu một layer thay đổi thì mọi layer sau nó cũng bị ảnh hưởng.
  - `R3.3`: Khi một layer đổi, mọi layer phía sau phải build lại, dù chúng không build ra gì khác.
  - `R3.4`: Theo tài liệu Docker: nếu giá trị ARG khác lần build trước thì "cache miss" xảy ra ở lần dùng đầu tiên, không phải lúc khai báo.
  - `R3.5`: Nội dung cache mount tồn tại giữa các lần build mà không làm mất instruction cache; chỉ nên dùng để tăng hiệu năng.
  - `R3.6`: Với RUN dùng bind mount, mtime của file không được tính vào checksum cache.
  - `R3.7`: Cache backend (ngoài cache cục bộ BuildKit) phải được export và import tường minh.
  - `R3.8`: podman/buildah build --cache-from chỉ có tác dụng khi chỉ định --layers.
  - `R3.9`: podman build --cache-from dùng repository làm nguồn cache và cố kéo cache image thay vì chạy lại bước build.
  - `R3.10`: podman build --cache-to chỉ định repository từ xa để lưu cache image.
