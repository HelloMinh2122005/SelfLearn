# Evidence Index: PATCH-CTR-6_6_11

- **Lesson**: 6_6_11 Pipeline Optimization and Troubleshooting
- **Mode**: patch
- **Target File**: `6 Domain 6 - Containers and Kubernetes/6_6 GitLab CI-CD and Release Strategies/6_6_11 Pipeline Optimization and Troubleshooting.md`
- **Ledgers**:
  - `cloud_devops_basic/container/.evidence/verify/PATCH-CTR-6_6_11-V1.md` (`C11.21`, `C11.22`, `C11.25` PASS; `C11.23`, `C11.24` initial FAIL)
  - `cloud_devops_basic/container/.evidence/verify/PATCH-CTR-6_6_11-RC1.md` (`C11.23`, `C11.24` recheck PASS)
- **Patch Claim IDs**:
  - `C11.21`: `include:` (`local`, `project`, `remote`, `template`, `component`) gộp YAML bên ngoài vào 1 pipeline duy nhất lúc phân tích cấu hình, dùng chung `stages` và ngữ cảnh biến.
  - `C11.22`: `trigger: include` khởi tạo child pipeline độc lập trong cùng repository, có danh sách job và đồ thị riêng.
  - `C11.23`: Từ GitLab 18.2+, `strategy: mirror` phản ánh chính xác mọi trạng thái downstream pipeline; `strategy: depend` không còn được khuyến nghị.
  - `C11.24`: `trigger: project` tạo pipeline độc lập ở project khác, chỉ định nhánh qua `branch` (khuyến nghị `strategy: mirror` trên GitLab 18.2+).
  - `C11.25`: Multi-project pipeline chạy bằng ngữ cảnh, phân quyền và biến CI/CD riêng của project đích.
- **Note on Pre-existing Claims**: `C11.1`–`C11.20` là các claim nháp có từ trước trong bài (`Trạng thái: Bản nháp, chờ kiểm chứng`), chưa có verification ledger.
- **All Claim IDs in Lesson**: `C11.1`–`C11.25`
