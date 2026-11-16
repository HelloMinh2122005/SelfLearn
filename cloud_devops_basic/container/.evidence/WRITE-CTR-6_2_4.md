# Evidence Index: WRITE-CTR-6_2_4

- **Task ID**: WRITE-CTR-6_2_4
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_2 Container Image Engineering/6_2_4 Multi-Stage Builds for Java.md`
- **Topic Title**: 6_2_4 Multi-Stage Builds for Java
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_2_4.md`
- **Gate status**: G1, G2, G3, G4 đạt. **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R4.1`: Multi-stage build dùng nhiều lệnh FROM; mỗi FROM bắt đầu một stage mới và có thể chọn lọc chép artifact giữa các stage, bỏ lại mọi thứ không muốn có trong image cuối.
  - `R4.2`: Multi-stage giúp giảm kích thước image cuối bằng cách tách biệt việc build và sản phẩm cuối.
  - `R4.3`: Kết quả là image production nhỏ; không có công cụ build nào nằm trong image cuối.
  - `R4.4`: COPY có thể lấy nguồn từ build context, build stage, named context hoặc một image.
  - `R4.5`: Có thể dừng ở một stage cụ thể bằng docker build --target; hữu ích để debug một stage hoặc dựng stage kiểm thử.
  - `R4.6`: JVM: -XX:MaxRAMPercentage đặt heap tối đa theo phần trăm; mặc định 25 phần trăm.
  - `R4.7`: jlink lắp ráp và tối ưu một tập module cùng phụ thuộc thành custom runtime image.
  - `R4.8`: Distroless chỉ chứa ứng dụng và phụ thuộc runtime, không có package manager, shell hay chương trình khác của một bản phân phối chuẩn.
