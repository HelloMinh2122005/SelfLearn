# Ôn Tập: 6_6_5_1 Container Lifecycle and Daemonless Build Internals

### Câu Hỏi 1: Bản chất của một OCI/Docker Image và một Container đang chạy khác gì so với máy ảo (VM)?

<details>
<summary>Đáp án</summary>

- **OCI/Docker Image**: Là một tập hợp file lưu trữ tĩnh trên đĩa theo chuẩn mở (**OCI Image Specification**), không phải máy ảo và không chứa nhân hệ điều hành (kernel) riêng. Khi nằm yên, image không tiêu tốn tài nguyên chạy.
- **Container đang chạy**: Không phải máy ảo; nó chính là một **tiến trình Linux bình thường chạy trực tiếp trên nhân (kernel) của máy host**, nhưng bị cách ly góc nhìn (bởi **Linux Namespaces**) và giới hạn tài nguyên (bởi **Cgroups**).

</details>

### Câu Hỏi 2: Trong kiến trúc client-server của Docker Engine, `docker` CLI giao tiếp với `dockerd` như thế nào và vì sao gắn `/var/run/docker.sock` vào container CI lại tiềm ẩn rủi ro bảo mật nghiêm trọng?

<details>
<summary>Đáp án</summary>

- **Cách giao tiếp**: Lệnh `docker` gõ trên terminal chỉ là CLI client, không tự build hay chạy container. Trên Linux, CLI gửi yêu cầu dưới dạng REST API tới tiến trình nền `dockerd` (Docker daemon) thông qua UNIX socket `/var/run/docker.sock`.
- **Rủi ro trong CI/CD**: Vì `dockerd` chạy với quyền `root` và lắng nghe tại socket này, bất kỳ job CI nào được mount và có thể ghi vào `/var/run/docker.sock` đều có thể yêu cầu `dockerd` mount thư mục `/` của host vào một container mới — điều này tương đương với việc chiếm quyền `root` toàn bộ máy chủ. Để đảm bảo nguyên tắc *least privilege*, nên chuyển sang mô hình daemonless/rootless như Buildah hoặc Rootless BuildKit.

</details>

### Câu Hỏi 3: File `.dockerignore` có vai trò gì trong bước chuẩn bị build context của `docker build`?

<details>
<summary>Đáp án</summary>

Khi chạy `docker build`, `docker` CLI đọc file `.dockerignore` (chẳng hạn loại trừ `.git`, `target/`, `*.md`) để loại bỏ các file/thư mục khớp mẫu ra khỏi **build context** trước khi gửi dữ liệu tới builder. Điều này giúp tránh truyền các file không cần thiết lên quá trình build.

</details>

### Câu Hỏi 4: Quá trình truyền build context và thực thi `Dockerfile` của BuildKit (mặc định từ Docker Engine 23.0 trên Linux) khác gì so với legacy builder (`DOCKER_BUILDKIT=0`)?

<details>
<summary>Đáp án</summary>

- **Truyền build context**:
  - *Legacy builder (`DOCKER_BUILDKIT=0`)*: CLI đóng gói toàn bộ build context còn lại (sau khi lọc qua `.dockerignore`) thành một tarball và gửi lên `dockerd` qua endpoint `POST /build`.
  - *BuildKit (mặc định từ Docker Engine 23.0)*: Client chỉ truyền những file thực sự cần thiết theo yêu cầu của builder, giúp tối ưu hóa việc truyền context.
- **Thực thi `Dockerfile` & lưu layer**:
  - *Legacy builder*: `dockerd` giải nén build context, đọc tuần tự từng chỉ thị `Dockerfile`, tạo container trung gian tạm thời cho các bước như `RUN`, commit thay đổi thành layer chỉ đọc rồi xóa container trung gian.
  - *BuildKit*: Giải `Dockerfile` thông qua đồ thị phụ thuộc **LLB** để chạy song song các nhánh độc lập, tối ưu bỏ qua các bước không ảnh hưởng kết quả cuối, đồng thời lưu snapshot/cache theo đồ thị LLB và xuất các layer blob (`tar`, `tar+gzip`, `tar+zstd`, `estargz`) khi export hoặc push.

</details>

### Câu Hỏi 5: Cấu trúc tĩnh của một OCI / Docker Image gồm những thành phần nào và vai trò của từng phần là gì?

<details>
<summary>Đáp án</summary>

Một image theo chuẩn OCI Image Specification gồm 3 thành phần tĩnh:

1. **Layer filesystem (`tar`, `tar+gzip`, hoặc `tar+zstd`)**: Các lớp file tăng thêm hoàn toàn chỉ đọc (read-only), có thể dùng chung giữa nhiều image.
2. **Image Config JSON**: Lưu cấu hình chạy mặc định (`Env`, `Cmd`, `Entrypoint`, `WorkingDir`) và `rootfs.diff_ids` (mã băm của từng layer ở trạng thái chưa nén).
3. **Image Manifest JSON**: Danh mục liệt kê các layer (`tar`, `tar+gzip`, hoặc `tar+zstd`) và trỏ tới Image Config JSON tương ứng theo digest.

</details>

### Câu Hỏi 6: Image ID được xác định như thế nào trong classic storage driver của Docker, và có điểm gì khác biệt theo chuẩn OCI Image Spec hiện hành? Làm sao dùng CLI để kiểm tra Image ID và số layer của một image?

<details>
<summary>Đáp án</summary>

- **Cách xác định Image ID**:
  - Với classic storage driver của Docker, Image ID (`.Id`) là digest tính từ **Image Config JSON**.
  - Tuy nhiên, theo OCI Image Spec hiện hành, các công cụ đã có sự phân kỳ: nhiều công cụ và `containerd` image store sử dụng digest của **Image Manifest** hoặc **Image Index** làm định danh.
- **Lệnh CLI kiểm tra**:
  ```bash
  docker image inspect hello-svc:1.0 --format '{{.Id}} | Layers: {{len .RootFS.Layers}}'
  ```

</details>

### Câu Hỏi 7: Điều gì xảy ra bên trong OverlayFS và OCI layer archive nếu một chỉ thị `RUN` sau xóa một file đã được tạo ở chỉ thị `RUN` trước đó? Vì sao đây là một cạm bẫy trong thực tế và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Mỗi chỉ thị `RUN` tạo ra một layer chỉ đọc bất biến, nên file gốc vẫn nằm nguyên trong layer cũ (`lowerdir`). Khi `RUN` sau xóa file đó:
  - Bên trong OverlayFS, hệ thống chỉ tạo một **whiteout** trong `upperdir` (dưới dạng character device `0/0` hoặc extended attribute `trusted.overlay.whiteout`).
  - Khi đóng gói thành OCI layer changeset tar, marker này trở thành một entry dạng `.wh.<tên_file>` để ẩn file khỏi góc nhìn hợp nhất (`merged`).
- **Hậu quả thực tế**: Dữ liệu (kể cả file nhạy cảm như secret key hay file tạm dung lượng lớn) thực chất không hề bị xóa khỏi image; người tải image vẫn có thể trích xuất lại từ layer cũ.
- **Cách khắc phục**: Gộp các thao tác tải – sử dụng – xóa vào **cùng một chỉ thị `RUN`**, hoặc sử dụng **multi-stage build**.

</details>

### Câu Hỏi 8: Lệnh `docker run` gửi những yêu cầu API nào tới `dockerd`, và trước khi khởi chạy ứng dụng, máy chủ cần chuẩn bị 3 lớp hạ tầng nào?

<details>
<summary>Đáp án</summary>

Lệnh `docker run` gửi tuần tự hai yêu cầu REST API tới `dockerd`:
1. `POST /containers/create`: Tạo cấu trúc container ở trạng thái `created`.
2. `POST /containers/{id}/start`: Khởi chạy tiến trình ứng dụng.

Trước khi khởi chạy, máy chủ chuẩn bị 3 lớp hạ tầng:
1. **Mount OverlayFS (`overlay2`)**: Xếp các layer image chỉ đọc làm `lowerdir`, tạo thư mục ghi mới `upperdir` (cùng thư mục nháp `workdir`) và hợp nhất thành điểm mount `merged` để container nhìn thấy.
2. **Thiết lập mạng (`bridge` mặc định)**: Trên bridge `docker0`, Docker tạo một cặp giao diện mạng ảo `veth` pair (một đầu đưa vào container thành `eth0`, đầu kia gắn vào `docker0`) và cấu hình `iptables` NAT để chuyển tiếp cổng (port forwarding) cũng như cấp đường ra mạng.
3. **Xuất file `config.json` chuẩn OCI**: Xuất toàn bộ thông số container ra file `config.json` (kèm thư mục `rootfs`) tuân thủ chuẩn `opencontainers/runtime-spec`.

</details>

### Câu Hỏi 9: Hãy mô tả vai trò của từng thành phần trong chuỗi thực thi `dockerd` → `containerd` → `containerd-shim` → `runc`. Vì sao `runc` lại tự thoát ngay sau khi khởi chạy ứng dụng?

<details>
<summary>Đáp án</summary>

- **`dockerd`**: Nhận lệnh từ CLI và gửi yêu cầu tạo, quản lý vòng đời container tới `containerd` thông qua giao thức **gRPC**.
- **`containerd`**: Điều phối vòng đời container; với mỗi container, nó khởi tạo một tiến trình shim (trên Runtime v2 là `containerd-shim-runc-v2`).
- **`containerd-shim`**: Đóng vai trò là **tiến trình cha (parent process)** trực tiếp của tiến trình container trên host, có nhiệm vụ giữ các luồng I/O và thu nhận mã thoát (exit status), đồng thời gọi `runc`.
- **`runc`**: OCI runtime mặc định, đọc `config.json` và `rootfs` để dựng container (tạo namespaces, cgroups, `pivot_root`, `execve`). Ngay khi tiến trình ứng dụng khởi chạy xong, `runc` hoàn thành nhiệm vụ thiết lập nên lập tức thoát (`exit`), nhường lại quyền làm tiến trình cha cho `containerd-shim` nhằm tiết kiệm tài nguyên và tách rời daemon quản lý khỏi tiến trình ứng dụng.

</details>

### Câu Hỏi 10: Việc khởi động lại `containerd` hoặc `dockerd` có làm tắt các container đang chạy hay không?

<details>
<summary>Đáp án</summary>

- **Khởi động lại `containerd`**: Không làm container chết, vì `containerd-shim` đã đóng vai trò là tiến trình cha trực tiếp giữ I/O và exit status của container sau khi `runc` thoát.
- **Khởi động lại `dockerd`**: Container chỉ tiếp tục sống nếu máy chủ có bật cấu hình **`live-restore`**. Ở trạng thái mặc định (không bật `live-restore`), việc tắt hoặc khởi động lại `dockerd` sẽ dừng các container đang chạy.

</details>

### Câu Hỏi 11: Trong bước `runc` tương tác trực tiếp với nhân Linux, các cơ chế `clone` (Namespaces), `cgroups`, `pivot_root` và `execve` đảm nhận nhiệm vụ gì? Làm thế nào kiểm tra PID thật trên host và các namespace của một container đang chạy?

<details>
<summary>Đáp án</summary>

- **Nhiệm vụ của từng cơ chế kernel**:
  - **`clone` + Linux Namespaces**: Cô lập góc nhìn hệ thống cho tiến trình, bao gồm `CLONE_NEWPID` (cô lập bảng tiến trình để ứng dụng thấy mình là `PID 1`), `CLONE_NEWNET` (cô lập card mạng/IP), `CLONE_NEWNS` (cô lập cây thư mục mount), `CLONE_NEWUTS` (cô lập hostname), `CLONE_NEWIPC` và `CLONE_NEWUSER`.
  - **`cgroups` (Linux Control Groups)**: Ghi cấu hình giới hạn CPU, bộ nhớ RAM, I/O và số lượng tiến trình vào hệ thống file ảo `/sys/fs/cgroup/` để ngăn container chiếm dụng quá mức tài nguyên được cấp.
  - **`pivot_root`**: Chuyển thư mục gốc `/` của tiến trình container sang thư mục `rootfs` đã mount từ OverlayFS, cô lập khỏi cây thư mục của máy host.
  - **`execve`**: Nạp và thực thi tiến trình ứng dụng chính (ví dụ `java -jar app.jar`).
- **Cách kiểm tra trên host**:
  ```bash
  HOST_PID=$(docker inspect -f '{{.State.Pid}}' hello-demo)
  ps -p "$HOST_PID" -o pid,ppid,user,cmd
  ls -l /proc/"$HOST_PID"/ns/
  ```
  Kết quả `ps` cho thấy tiến trình ứng dụng có một PID thật trên host và có `PPID` trỏ tới tiến trình cha `containerd-shim`.

</details>

### Câu Hỏi 12: Kiến trúc daemonless (như Buildah) hoạt động khác gì với `dockerd`, và nó sử dụng những cơ chế nào để đạt được chế độ rootless nhưng vẫn xuất ra image tương thích với Kubernetes (`containerd`)?

<details>
<summary>Đáp án</summary>

- **Kiến trúc Daemonless (`fork-and-exec`)**: Buildah chạy trực tiếp như một lệnh CLI theo mô hình `fork-and-exec`, hoàn toàn không cần dịch vụ nền `dockerd` hay socket `/var/run/docker.sock`, và tự thoát ngay khi build xong.
- **Cơ chế Rootless**:
  - **Root ảo (`userns`)**: Sử dụng User Namespaces (`CLONE_NEWUSER`) kết hợp bảng ánh xạ trong `/etc/subuid` và `/etc/subgid` để tiến trình mang `UID 0` ("root ảo") bên trong namespace trong khi vẫn chỉ là user thường trên host.
  - **Rootless OverlayFS**: Dùng `fuse-overlayfs` ở user space (hoặc native rootless overlayfs trên nhân Linux ≥ 5.11) để ghép các layer mà không cần quyền root toàn cục.
- **Tương thích Kubernetes (`containerd`)**: Buildah tạo và ghi thẳng image theo chuẩn mở **OCI** (layer tarballs + các file JSON) ra đĩa hoặc push trực tiếp lên container registry qua HTTPS; mọi runtime tuân thủ chuẩn OCI như `containerd` đều đọc và chạy được bình thường.

</details>

### Câu Hỏi 13: Khi chạy build rootless với Buildah trên Linux hoặc bên trong container CI, cần kiểm tra và đáp ứng những điều kiện hạ tầng nào để tránh lỗi quyền hoặc bị suy giảm hiệu năng nghiêm trọng?

<details>
<summary>Đáp án</summary>

1. **Bảng ánh xạ UID/GID (`/etc/subuid` và `/etc/subgid`)**: User thực hiện build phải có dải ánh xạ hợp lệ trong hai file này (kiểm tra bằng `grep "$USER" /etc/subuid /etc/subgid`). Nếu thiếu, cơ chế `userns` sẽ gặp lỗi quyền.
2. **Hỗ trợ OverlayFS không cần root**: Cần chạy trên **Linux kernel ≥ 5.11** (hỗ trợ native rootless overlayfs) hoặc cài đặt **`fuse-overlayfs`** ở user space. Nếu thiếu cả hai điều kiện trên kernel cũ (< 5.11), quá trình build rootless sẽ lỗi quyền hoặc bị rơi về storage driver `vfs` rất chậm.
3. **Trường hợp chạy Buildah bên trong container CI**: Cần cấp thiết bị `/dev/fuse` cho `fuse-overlayfs` hoặc cấu hình `userns` phù hợp cho container CI.

</details>
