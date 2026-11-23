# Ôn Tập: 6_1_10 Container Data Storage

### Câu Hỏi 1: Điều gì xảy ra với dữ liệu ghi trực tiếp vào filesystem của container (lớp ghi - writable layer) khi container bị xóa, và image gốc có bị thay đổi không?

<details>
<summary>Đáp án</summary>

Dữ liệu ghi vào **lớp ghi** (writable layer) của container sẽ bị xóa cùng với container khi container bị xóa (`rm` hoặc bị thay thế); **image gốc không thay đổi**. Vì vậy, mọi dữ liệu cần giữ lại phải được lưu ở bên ngoài lớp ghi thông qua các cơ chế như volume, bind mount hoặc tmpfs tùy theo nhu cầu.
</details>

### Câu Hỏi 2: Ba cơ chế chính để lưu trữ hoặc đưa dữ liệu vào/ra container là gì, và đặc điểm cốt lõi phân biệt chúng ra sao?

<details>
<summary>Đáp án</summary>

Ba cơ chế gồm:
- **Volume**: Kho dữ liệu bền do Docker/runtime tạo và quản lý; đây là cơ chế **được ưu tiên** để lưu dữ liệu do container sinh ra và sử dụng.
- **Bind mount**: File hoặc thư mục **có sẵn của máy chủ** được mount trực tiếp vào container; có quyền ghi vào file trên máy chủ theo mặc định.
- **tmpfs**: Mount tạm thời **chỉ nằm trong bộ nhớ** (RAM) của máy chủ; dữ liệu và mount bị xóa khi container dừng.
</details>

### Câu Hỏi 3: Volume được tạo bằng những cách nào, vị trí lưu trữ nằm ở đâu và vì sao dữ liệu vẫn còn khi xóa container?

<details>
<summary>Đáp án</summary>

- **Cách tạo**: Có thể tạo tường minh bằng lệnh `docker volume create` hoặc để Docker tự động tạo khi tạo container/service. Trong Podman, cú pháp `-v SOURCE-VOLUME:/CONTAINER-DIR` sẽ mount một named volume vào container và tự động tạo mới nếu volume đó chưa tồn tại.
- **Vị trí**: Khi dùng volume, một thư mục **mới** được tạo trong vùng lưu trữ do runtime (Docker/Podman) quản lý trên máy chủ, thay vì dùng một thư mục có sẵn của bạn.
- **Tính bền vững**: Vì dữ liệu nằm tách biệt khỏi lớp ghi của container, khi container bị xóa (kể cả chạy với cờ `--rm`), volume vẫn tồn tại. Một container mới mount lại đúng volume đó (ví dụ `mydata`) vẫn đọc được dữ liệu cũ cho đến khi bạn chủ động xóa volume (ví dụ bằng `podman volume rm mydata`).
</details>

### Câu Hỏi 4: Với cờ `-v` trong Podman, làm sao phân biệt cú pháp tạo named volume và cú pháp tạo bind mount?

<details>
<summary>Đáp án</summary>

- `-v SOURCE-VOLUME:/CONTAINER-DIR` (truyền **tên volume**, ví dụ `-v mydata:/data`): mount một **named volume** vào container (và tạo mới nếu chưa có).
- `-v /HOST-DIR:/CONTAINER-DIR` (truyền **đường dẫn thư mục trên máy chủ**, ví dụ `-v ~/lab-data:/data`): tạo một **bind mount** từ thư mục máy chủ vào container.
</details>

### Câu Hỏi 5: Khi sử dụng bind mount, rủi ro bảo mật lớn nhất đối với máy chủ là gì và cần áp dụng thực tiễn nào để hạn chế rủi ro?

<details>
<summary>Đáp án</summary>

- **Rủi ro**: Bind mount cho phép ghi vào file của máy chủ theo mặc định, nên process bên trong container có thể tạo, sửa hoặc xóa các file hệ thống quan trọng trên máy chủ.
- **Thực tiễn sản xuất**: Chỉ mount đúng thư mục thực sự cần thiết thay vì mount phạm vi quá rộng, và cân nhắc mount ở chế độ chỉ đọc (cờ `:ro`; cần tham khảo thêm trang tài liệu `podman-run` hoặc Docker bind mounts cho cú pháp chi tiết).
</details>

### Câu Hỏi 6: `tmpfs` mount hoạt động như thế nào khi container dừng và ảnh hưởng thế nào đến bộ nhớ của container?

<details>
<summary>Đáp án</summary>

- **Khi container dừng**: `tmpfs` chỉ lưu dữ liệu tạm thời trong bộ nhớ máy chủ (trong Podman có thể gắn bằng `--tmpfs`, ví dụ `--tmpfs /scratch`). Khi container dừng, mount bị xóa và toàn bộ file ghi trong đó không còn.
- **Ảnh hưởng bộ nhớ**: Dữ liệu trong `tmpfs` **được tính vào giới hạn bộ nhớ cgroup** của container. Nếu ghi quá nhiều dữ liệu vào `tmpfs`, container có thể bị hết bộ nhớ (OOM). Do đó trong thực tế cần đặt kích thước `tmpfs` hợp lý và tính phần dung lượng này vào giới hạn `--memory`.
</details>

### Câu Hỏi 7: Vì sao container chạy ở chế độ rootless hoặc non-root thường gặp lỗi không ghi được (Permission Denied) vào thư mục được mount từ máy chủ?

<details>
<summary>Đáp án</summary>

Khi chạy container rootless hoặc bằng user không phải root, cơ chế **user namespace** làm cho **UID bên trong container khác với UID trên máy chủ**. Do khác UID sở hữu, process trong container có thể không có quyền ghi vào thư mục máy chủ được mount vào.
</details>

### Câu Hỏi 8: Podman cung cấp những tùy chọn nào để giải quyết vấn đề quyền sở hữu file (UID/GID) và SELinux khi mount dữ liệu cho container rootless/non-root?

<details>
<summary>Đáp án</summary>

- `--userns=keep-id`: ánh xạ user của bạn trên máy chủ sang **cùng UID** bên trong container.
- Tùy chọn volume `U` / `chown`: đổi đệ quy chủ sở hữu của volume nguồn dựa trên UID/GID của container. (Ngoài ra có thể tự chỉnh quyền của thư mục nguồn).
- Trên hệ thống dùng **SELinux** (như Fedora/RHEL), thêm hậu tố `:Z` (ví dụ `-v ~/lab-data:/data:Z`) để gắn nhãn **riêng**, đảm bảo chỉ container hiện tại được phép dùng thư mục đó.
</details>

### Câu Hỏi 9: Ngoài `-v` và `--tmpfs`, Podman hỗ trợ cú pháp `--mount=type=...` với những loại mount nào theo tài liệu trang `latest`?

<details>
<summary>Đáp án</summary>

Theo trang tài liệu `latest` của Podman được nêu trong bài, `--mount=type=...` hỗ trợ các loại: `artifact`, `bind`, `devpts`, `glob`, `image`, `ramfs`, `tmpfs` và `volume`. (Danh sách cụ thể phụ thuộc vào phiên bản Podman bạn sử dụng).
</details>

### Câu Hỏi 10: Trong các tình huống thực tế sau, bạn nên chọn cơ chế lưu trữ nào và cần lưu ý gì?
1. Lưu dữ liệu cho database hoặc file upload của ứng dụng.
2. Đưa thư mục mã nguồn có sẵn trên máy cá nhân vào container để lập trình (dev).
3. Lưu dữ liệu tạm thời, ghi nhanh và không cần giữ lại sau khi container dừng.

<details>
<summary>Đáp án</summary>

1. **Database / file upload**: Chọn **Volume** (cơ chế được ưu tiên cho dữ liệu cần tồn tại lâu dài, ghi nhiều hoặc chia sẻ; nếu triển khai trên Kubernetes thì dùng `PersistentVolume`).
2. **Mã nguồn khi dev**: Chọn **Bind mount** để gắn thư mục có sẵn từ máy chủ vào container, đồng thời lưu ý rủi ro bảo mật vì container có quyền ghi lên file máy chủ theo mặc định.
3. **Dữ liệu tạm thời**: Chọn **tmpfs** để lưu trên bộ nhớ và tự động mất khi container dừng, đồng thời tính toán dung lượng hợp lý vào giới hạn `--memory` của container.
</details>
