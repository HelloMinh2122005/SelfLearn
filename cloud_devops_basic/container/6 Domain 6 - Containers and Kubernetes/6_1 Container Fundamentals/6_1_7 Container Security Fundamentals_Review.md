# Ôn Tập: 6_1_7 Container Security Fundamentals

### Câu Hỏi 1: Vì sao bảo mật container cần nhiều lớp chồng lên nhau, và bài học đề cập đến những lớp bảo mật chính nào?

<details>
<summary>Đáp án</summary>

Vì container dùng chung kernel với máy chủ nên ranh giới bảo mật cần nhiều lớp chồng lên nhau (khi đánh giá bảo mật, hai khu vực đầu tiên cần xem xét là tính bảo mật nội tại của kernel cùng hỗ trợ namespaces/cgroups, và bề mặt tấn công của daemon).

5 lớp bảo mật chính được đề cập gồm:
- **Định danh (`user namespace`, `rootless`)**: giúp `root` trong container không phải `root` thật trên máy chủ.
- **Đặc quyền (`capabilities`)**: chia nhỏ quyền `root`, bỏ bớt phần không cần thiết.
- **Syscall (`seccomp`)**: lọc các system call mà process được phép gọi.
- **Nhãn truy cập (`SELinux`/`AppArmor`)**: kiểm soát truy cập file và process theo chính sách.
- **Cấu hình (`--privileged`, mount, device)**: đảm bảo không mở quyền quá mức.
</details>

### Câu Hỏi 2: User namespace cô lập những thành phần nào và vì sao `root` (UID 0) trong container rootless không phải `root` thật trên máy chủ? Điều này có đúng với container rootful không?

<details>
<summary>Đáp án</summary>

User namespace cô lập các định danh và thuộc tính liên quan đến bảo mật: **user ID**, **group ID**, **root directory**, **keys** và **capabilities**.

Nhờ user namespace, một process có thể là user thường (không có đặc quyền) **ở bên ngoài** namespace nhưng lại mang **UID 0 (root) ở bên trong** namespace. Đó là cơ sở khiến `root` trong container rootless không phải `root` thật trên máy chủ.

Lưu ý: Điều này **chỉ đúng khi dùng user namespace/rootless**; còn container **rootful** sẽ chạy như `root` thật trên máy chủ.
</details>

### Câu Hỏi 3: Podman rootless yêu cầu cấu hình gì trên máy chủ để ánh xạ UID/GID, và bạn kiểm tra ánh xạ UID thực tế của một container đang chạy bằng cách nào?

<details>
<summary>Đáp án</summary>

Cơ chế `subuid` cho phép một user ánh xạ các dải user ID của mình vào namespace con. Podman rootless yêu cầu user phải có dải UID và GID được khai báo trong hai file `/etc/subuid` và `/etc/subgid` (nếu quên hoặc thiếu hai file này sẽ gặp lỗi ánh xạ UID).

Các bước kiểm tra thực tế:
1. Kiểm tra dải UID/GID được cấp cho user hiện tại trên máy chủ:
   ```bash
   grep "^$USER:" /etc/subuid /etc/subgid
   ```
2. Xem ánh xạ UID/GID thực tế của process container từ Linux 3.5 trở lên thông qua file `/proc/<pid>/uid_map` và `/proc/<pid>/gid_map`: lấy PID trên máy chủ bằng `podman inspect <tên>`, sau đó chạy `cat /proc/<PID>/uid_map`.
</details>

### Câu Hỏi 4: Tùy chọn `--userns=keep-id` trong Podman có tác dụng gì và hữu ích trong tình huống nào?

<details>
<summary>Đáp án</summary>

Tùy chọn `--userns=keep-id` ánh xạ user hiện tại của bạn trên máy chủ sang **cùng UID** đó ở bên trong container (ví dụ chạy `podman run --rm --userns=keep-id docker.io/library/alpine id`).

Cơ chế này đặc biệt hữu ích khi **mount thư mục** từ máy chủ vào container để giữ đồng nhất UID sở hữu giữa bên ngoài và bên trong container.
</details>

### Câu Hỏi 5: Linux capabilities là gì? Hãy nêu một ví dụ capability cụ thể và giải thích nguyên tắc áp dụng `--cap-drop` khi chạy container.

<details>
<summary>Đáp án</summary>

Linux chia đặc quyền của superuser (`root`) thành các đơn vị riêng lẻ gọi là **capabilities**, có thể bật hoặc tắt độc lập nhau. Ví dụ: `CAP_NET_ADMIN` cấp quyền cho các thao tác mạng như cấu hình interface, quản trị firewall IP hoặc sửa bảng định tuyến.

Nguyên tắc thực hành là **bỏ những capability không cần thiết**:
- Trong Podman, dùng `--cap-drop=<capability>` để bỏ một capability khỏi tập mặc định, hoặc `--cap-drop=all` để bỏ hết (Docker cũng hỗ trợ cặp cờ `--cap-add` và `--cap-drop`).
- Ví dụ: nếu chạy `podman run --rm --cap-drop=all docker.io/library/alpine sh -c 'ip link set lo down; echo exit=$?'`, thao tác mạng sẽ không thành công vì đã bỏ hết capability (trong khi lệnh này cần `CAP_NET_ADMIN`).
</details>

### Câu Hỏi 6: Cơ chế `seccomp` hoạt động như thế nào, khác gì với capabilities, và cần điều kiện gì để Docker sử dụng được tính năng này?

<details>
<summary>Đáp án</summary>

- **Cách hoạt động**: `seccomp` (Secure Computing mode) là tính năng của kernel Linux giúp hạn chế hành động trong container. Ở chế độ `SECCOMP_SET_MODE_FILTER`, các system call được phép gọi sẽ do một chương trình **BPF** quy định.
- **Khác biệt với capabilities**: `capabilities` chia nhỏ và bật/tắt các **đặc quyền** của `root`, còn `seccomp` **lọc trực tiếp các system call** mà process được phép gọi. Hai cơ chế này bổ sung cho nhau.
- **Điều kiện trên Docker**: Tính năng `seccomp` chỉ khả dụng khi Docker được build kèm hỗ trợ seccomp và kernel của máy chủ có bật `CONFIG_SECCOMP`.
</details>

### Câu Hỏi 7: Trên hệ thống bật SELinux (như Fedora/RHEL), vì sao bind mount thường bị lỗi "permission denied" dù quyền Unix đúng? Sự khác nhau giữa `:z` và `:Z` là gì?

<details>
<summary>Đáp án</summary>

Khi SELinux đang bật (như mặc định trên Fedora/RHEL), container cần nhãn SELinux phù hợp mới đọc/ghi được thư mục bind mount. Nếu nhãn SELinux của thư mục trên máy chủ không khớp với container, hệ thống sẽ báo lỗi "permission denied" dù quyền Unix (rwx) đã đúng.

Để Podman tự gắn nhãn phù hợp khi mount (ví dụ `-v /tmp/data:/data:Z`), ta dùng:
- **`:z`**: gắn **nhãn chia sẻ**, cho phép nội dung được **nhiều container dùng chung**.
- **`:Z`**: gắn **nhãn riêng**, chỉ **container hiện tại** dùng được.
</details>

### Câu Hỏi 8: Tùy chọn `--security-opt label=disable` có tác dụng gì và thực tiễn sản xuất khuyến nghị sử dụng ra sao?

<details>
<summary>Đáp án</summary>

Tùy chọn `--security-opt label=disable` sẽ **tắt cơ chế tách nhãn SELinux** cho container đó.

Trong thực tiễn sản xuất, **không nên dùng tùy chọn này một cách tùy tiện**; hãy ưu tiên dùng nhãn `:Z` (riêng) hoặc `:z` (chia sẻ) khi bind mount thay vì tắt SELinux, và chỉ coi `label=disable` là phương án cuối cùng.
</details>

### Câu Hỏi 9: Mặc định container Docker có được truy cập thiết bị trên máy chủ không? Cờ `--privileged` thay đổi điều gì, vì sao nên tránh và giải pháp thay thế là gì?

<details>
<summary>Đáp án</summary>

Mặc định, container Docker ở trạng thái **"unprivileged"** — không được phép truy cập bất kỳ thiết bị (device) nào trên máy chủ (đây cũng là lý do mặc định không chạy được Docker daemon bên trong container).

Khi bật cờ `--privileged`, container được **mở rộng quyền** ("Give extended privileges to this container"), phá vỡ giới hạn bảo mật mặc định nên cần tránh sử dụng cho tiện.

**Giải pháp thay thế trong thực tế**: Thay vì bật `--privileged`, chỉ cấp đúng phần quyền hoặc thiết bị thực sự cần thiết bằng **`--cap-add`** và **`--device`**.
</details>

### Câu Hỏi 10: Ngoài việc ưu tiên chạy container ở chế độ rootless, thực tiễn khuyến nghị đối với user bên trong container image là gì?

<details>
<summary>Đáp án</summary>

Bên cạnh việc ưu tiên chạy container ở chế độ rootless khi có thể, thực tiễn sản xuất khuyến nghị cấu hình để **chạy ứng dụng bằng một user không phải `root` ngay bên trong container image** nhằm giảm thiểu rủi ro đặc quyền.
</details>
