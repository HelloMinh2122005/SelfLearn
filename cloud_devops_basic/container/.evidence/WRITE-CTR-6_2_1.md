# Evidence Index: WRITE-CTR-6_2_1

- **Task ID**: WRITE-CTR-6_2_1
- **Assignee**: main session (không dùng subagent), 16-11-2026
- **Target File**: `cloud_devops_basic/container/6 Domain 6 - Containers and Kubernetes/6_2 Container Image Engineering/6_2_1 Dockerfile Instructions.md`
- **Topic Title**: 6_2_1 Dockerfile Instructions
- **Ledger Files**:
  - `cloud_devops_basic/container/.evidence/research/TASK-CTR-6_2_1.md`
- **Gate status**: G1, G2, G3, G4 đạt. **G5 (verifier độc lập): CHƯA CHẠY**.

## Claim IDs Used
  - `R1.1`: FROM khởi tạo một build stage mới và đặt base image; Dockerfile hợp lệ phải bắt đầu bằng FROM.
  - `R1.2`: RUN thực thi lệnh để tạo một layer mới trên image hiện tại.
  - `R1.3`: COPY chép file/thư mục mới từ <src> vào filesystem của image tại <dest>.
  - `R1.4`: ADD có thể lấy nguồn từ build context, URL từ xa hoặc Git repository.
  - `R1.5`: ADD và COPY về chức năng giống nhau nhưng phục vụ mục đích hơi khác.
  - `R1.6`: WORKDIR đặt thư mục làm việc cho RUN, CMD, ENTRYPOINT, COPY, ADD theo sau; tự tạo nếu chưa tồn tại.
  - `R1.7`: USER đặt user (hoặc UID) và tùy chọn group (hoặc GID) mặc định cho phần còn lại của stage; dùng cho RUN và khi chạy ENTRYPOINT/CMD.
  - `R1.8`: EXPOSE cho Docker biết container lắng nghe cổng nào lúc chạy; mặc định giao thức là TCP.
  - `R1.9`: EXPOSE không thực sự publish cổng; nó chỉ là tài liệu.
  - `R1.10`: LABEL thêm metadata dạng key-value cho image.
  - `R1.11`: ENV đặt biến môi trường, có hiệu lực cho mọi lệnh sau đó trong build stage.
  - `R1.12`: Khác ARG, giá trị ENV luôn được lưu trong image đã build.
  - `R1.13`: ARG định nghĩa biến truyền lúc build bằng cờ --build-arg.
  - `R1.14`: Biến ARG không được lưu vào image đã build như biến ENV.
  - `R1.15`: Một Dockerfile chỉ có một CMD hiệu lực; nếu có nhiều CMD thì chỉ CMD cuối có tác dụng.
  - `R1.16`: Quy tắc phối hợp: cần ít nhất một trong CMD hoặc ENTRYPOINT; ENTRYPOINT khi dùng container như chương trình; CMD là tham số mặc định và bị ghi đè khi chạy với tham số khác.
  - `R1.17`: Cách dùng ENTRYPOINT tốt nhất là đặt lệnh chính của image, rồi dùng CMD làm cờ mặc định.
  - `R1.18`: Exec form được parse như mảng JSON nên phải dùng dấu nháy kép.
  - `R1.19`: Exec form không tự gọi shell nên không có xử lý shell như thay thế biến.
  - `R1.20`: ENTRYPOINT dạng shell chạy như lệnh con của /bin/sh -c, không chuyển signal, executable không phải PID 1 và không nhận SIGTERM từ docker stop.
  - `R1.21`: HEALTHCHECK cho Docker biết cách kiểm tra container còn hoạt động.
  - `R1.22`: podman build --format: oci (image-spec v1.0) là mặc định; docker (version 2, schema 2) là lựa chọn khác.
  - `R1.23`: Nhãn OCI org.opencontainers.image.source là URL lấy mã nguồn build image.
  - `R1.24`: Nhãn OCI org.opencontainers.image.revision là định danh revision của source control.
  - `R1.25`: Nhãn OCI org.opencontainers.image.version là phiên bản của phần mềm đóng gói.
  - `R1.26`: Nhãn OCI org.opencontainers.image.created là thời điểm build image theo RFC 3339.
