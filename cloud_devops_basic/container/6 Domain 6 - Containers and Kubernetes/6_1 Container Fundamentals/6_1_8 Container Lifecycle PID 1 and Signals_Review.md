# Ôn Tập: 6_1_8 Container Lifecycle PID 1 and Signals

### Câu Hỏi 1: Vòng đời cơ bản của một container gồm những lệnh Docker và trạng thái nào? Điều gì xảy ra với lớp ghi (writable layer) khi xóa container?

<details>
<summary>Đáp án</summary>

- **Các lệnh Docker tương ứng**: `create` (tạo container), `start` (khởi động container đã dừng), `stop` (dừng container), `rm` (xóa container), và `run` (gộp cả tạo và chạy).
- **Chuỗi trạng thái rút gọn**: `created → running → exited → removed`.
- **Lớp ghi**: Khi xóa container (`rm`), toàn bộ lớp ghi (writable layer) của container sẽ bị mất.
</details>

### Câu Hỏi 2: Vì sao PID 1 trong container lại đặc biệt khi nhận Unix signal (như `SIGTERM`) so với các process thông thường?

<details>
<summary>Đáp án</summary>

Process đầu tiên trong PID namespace có PID 1 và đóng vai trò `init` của namespace đó. Theo quy tắc của Linux (`pid_namespaces(7)` và `kill(2)`):

- Chỉ những signal mà `init` **đã cài handler** mới có thể gửi được tới `init` từ các process khác trong cùng namespace (áp dụng cả cho process đặc quyền) hoặc từ namespace tổ tiên (như runtime trên máy chủ), nhằm tránh vô tình giết `init`.
- **Ngoại lệ**: `SIGKILL` và `SIGSTOP` vẫn được chuyển cưỡng bức khi gửi từ namespace tổ tiên (`SIGKILL` không thể bị bắt, chặn hay bỏ qua).
- **Hệ quả**: Nếu process chính của container (PID 1) không cài handler cho `SIGTERM`, lệnh `stop` gửi `SIGTERM` tới sẽ không có tác dụng; container chỉ dừng khi bị `SIGKILL`.
</details>

### Câu Hỏi 3: Ngoài việc xử lý signal, PID 1 (`init`) còn hai nhiệm vụ quan trọng nào khác, và điều gì xảy ra với container nếu PID 1 kết thúc?

<details>
<summary>Đáp án</summary>

Hai nhiệm vụ khác của `init` (mà ứng dụng thông thường hay bỏ qua) là:
1. **Nhận nuôi (adopt) process mồ côi (orphan)**: các process con mất cha sẽ được gán cho `init` của PID namespace.
2. **Thu dọn (`wait`) process con đã kết thúc**: nếu không gọi `wait`, các process con đã kết thúc sẽ rơi vào trạng thái **zombie**.

Nếu `init` (PID 1) kết thúc, **kernel sẽ giết mọi process còn lại trong PID namespace bằng `SIGKILL`** — tức là PID 1 chết thì cả container chết.
</details>

### Câu Hỏi 4: Cơ chế hoạt động của `docker stop` và `podman stop` diễn ra theo trình tự nào? Làm thế nào để thay đổi signal gửi đi ban đầu?

<details>
<summary>Đáp án</summary>

- **Trình tự mặc định**: Cả `docker stop` và `podman stop` đều gửi `SIGTERM` tới process chính trước để ứng dụng dọn dẹp và thoát một cách êm đẹp. Nếu hết thời gian chờ (grace period; ở `podman stop`, `--time` mặc định là **10 giây**) mà container chưa dừng, runtime sẽ gửi `SIGKILL` để buộc dừng.
- **Thay đổi signal đầu tiên**: Có thể đổi `SIGTERM` thành signal khác bằng chỉ thị `STOPSIGNAL` trong Dockerfile hoặc cờ `--stop-signal` khi chạy lệnh.
</details>

### Câu Hỏi 5: Sự khác biệt giữa **exec form** và **shell form** của `ENTRYPOINT` ảnh hưởng thế nào đến PID 1 và khả năng nhận `SIGTERM`?

<details>
<summary>Đáp án</summary>

- **Shell form** (ví dụ: `ENTRYPOINT java -jar app.jar`): `ENTRYPOINT` được chạy như lệnh con của `/bin/sh -c`, nên `/bin/sh -c` là PID 1 chứ không phải ứng dụng. Shell này **không chuyển tiếp signal**, vì vậy executable (`java`) không nhận được `SIGTERM` từ `docker stop`.
- **Exec form** (ví dụ: `ENTRYPOINT ["java","-jar","app.jar"]`): Executable (`java`) trực tiếp làm PID 1 và nhận được `SIGTERM` từ runtime (nếu ứng dụng/JVM có cài handler, ví dụ shutdown hook).
</details>

### Câu Hỏi 6: Tại sao container chạy `sleep 600` (không có `--init`) lại mất ~10 giây khi `podman stop` rồi thoát với mã `137`, còn khi thêm `--init` thì dừng nhanh hơn?

<details>
<summary>Đáp án</summary>

- **Khi không có `--init`**: `sleep` làm PID 1 nhưng không cài handler cho `SIGTERM`, nên `SIGTERM` từ `podman stop` không có tác dụng. Runtime phải đợi hết thời gian chờ mặc định (~10 giây) rồi mới gửi `SIGKILL`, khiến container thoát với exit code `137` (`128 + 9`).
- **Khi có `--init`**: Runtime chạy một tiến trình `init` nhỏ (ví dụ `tini`) làm PID 1 để nhận signal và chuyển tiếp xuống cho tiến trình ứng dụng, giúp container dừng nhanh (exit code dự đoán là `143` hoặc `0` tùy `init`).
</details>

### Câu Hỏi 7: Khi ứng dụng trong container sinh nhiều process con và phát sinh zombie tích tụ, giải pháp khắc phục là gì?

<details>
<summary>Đáp án</summary>

Sử dụng cờ `--init` khi chạy `docker run` / `podman run` hoặc tích hợp **`tini`** (một `init` nhỏ gọn hợp lệ cho container) làm PID 1. Tiến trình `init` này sẽ đảm nhiệm việc nhận nuôi process mồ côi và thu dọn (`wait`) các process con đã kết thúc để tránh tích tụ zombie.
</details>

### Câu Hỏi 8: Trong bảng exit code của `docker run`, các mã `125`, `126`, `127` và các mã khác (như `0` hoặc `3`) có ý nghĩa gì? Khi gặp `126` hoặc `127` cần kiểm tra gì?

<details>
<summary>Đáp án</summary>

- **`125`**: Lỗi xảy ra ở chính Docker daemon (lỗi công cụ chạy container, không phải lỗi của app bên trong).
- **`126`**: Lệnh trong container tồn tại nhưng không thể được gọi thực thi (ví dụ chạy nhầm một thư mục như `/etc`).
- **`127`**: Không tìm thấy lệnh trong container (ví dụ gõ tên lệnh không tồn tại như `foo`).
- **Các mã thoát khác** (như `0`, `3` trong `sh -c 'exit 3'`): Là exit code do chính lệnh bên trong container trả về.

Khi gặp lỗi `126` hoặc `127`, cần kiểm tra lại **đường dẫn**, **quyền thực thi** và **shebang** của entrypoint.
</details>

### Câu Hỏi 9: Công thức `128 + n` trong bash dùng để giải thích exit code nào? Hãy giải thích cụ thể mã `137` và `143`.

<details>
<summary>Đáp án</summary>

Theo quy ước của `bash`, khi một lệnh bị kết thúc bởi signal số `n`, exit code sẽ là **`128 + n`**:
- **`137 = 128 + 9`**: Tiến trình bị kết thúc bởi signal `9` (`SIGKILL`).
- **`143 = 128 + 15`**: Tiến trình bị kết thúc bởi signal `15` (`SIGTERM`).
</details>

### Câu Hỏi 10: Trong môi trường thực tế, nếu container thoát với exit code `137`, có thể kết luận ngay là do `docker stop` hết thời gian chờ hay không? Vì sao?

<details>
<summary>Đáp án</summary>

**Không thể kết luận ngay.** Exit code `137` chỉ cho biết tiến trình đã bị kết thúc bởi `SIGKILL` (`128 + 9`). Nguyên nhân có thể là do hết thời gian chờ khi `stop`, **hoặc** do bị **OOM kill** (hết bộ nhớ).

Để phân biệt chính xác, cần kiểm tra thêm trường `OOMKilled` trong kết quả `inspect` và bộ đếm `oom_kill` trong `memory.events`.
</details>
