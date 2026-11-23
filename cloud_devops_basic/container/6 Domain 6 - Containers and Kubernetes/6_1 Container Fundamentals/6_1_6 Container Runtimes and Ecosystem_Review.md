# Ôn Tập: 6_1_6 Container Runtimes and Ecosystem

### Câu Hỏi 1: "Container runtime" thực tế được chia thành hai tầng nào, và nhiệm vụ của mỗi tầng là gì?

<details>
<summary>Đáp án</summary>

Để tránh nhầm lẫn, container runtime được chia thành hai tầng:
- **Tầng cấp cao (engine/manager)**: Nhận lệnh từ người dùng, quản lý image, mạng (network) và volume. Các công cụ tiêu biểu gồm Docker, Podman, `containerd` và `CRI-O`.
- **Tầng cấp thấp (OCI runtime)**: Trực tiếp tạo process container (với namespaces và cgroups) theo chuẩn **OCI runtime-spec**. Các công cụ tiêu biểu gồm `runc` và `crun`.
</details>

### Câu Hỏi 2: `runc` là gì và nó nằm ở đâu trong quá trình khởi chạy một container?

<details>
<summary>Đáp án</summary>

`runc` là công cụ CLI ở tầng **OCI runtime cấp thấp**, chịu trách nhiệm tạo và chạy container theo đặc tả OCI (OCI specification). Các trình quản lý cấp cao như Docker (`dockerd` → `containerd`), Podman (thông qua `conmon`), `containerd` hoặc `CRI-O` đều đứng ở phía trên và gọi xuống OCI runtime như `runc` để thực sự tạo process container.
</details>

### Câu Hỏi 3: Trong kiến trúc Docker, `Daemon` nghĩa là gì và luồng hoạt động giữa `docker` client với `dockerd` diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

- **Daemon** là một chương trình chạy nền liên tục, không gắn với cửa sổ terminal nào, luôn chờ yêu cầu từ các chương trình khác; nó chỉ xử lý và trả kết quả khi có yêu cầu gọi tới. Tài liệu Docker gọi `dockerd` là một *persistent process* quản lý container.
- **Luồng hoạt động**: Người dùng gõ lệnh qua Docker client (`docker`, ví dụ `docker run`), client gửi lệnh đó tới `dockerd`. `dockerd` lắng nghe Docker API request và thực hiện phần việc nặng ("does the heavy lifting") gồm build, chạy, phân phối container cũng như quản lý image, container, network và volume.
</details>

### Câu Hỏi 4: `dockerd` sử dụng giao thức, socket, thư mục dữ liệu, quyền hạn và OCI runtime mặc định nào?

<details>
<summary>Đáp án</summary>

Theo tài liệu Docker được nêu trong bài học:
- **Giao tiếp**: `docker` client và `dockerd` trao đổi bằng **REST API** qua UNIX socket hoặc giao diện mạng.
- **Socket mặc định**: `/var/run/docker.sock`, yêu cầu quyền `root` hoặc user thuộc nhóm `docker`.
- **Thư mục dữ liệu**: `/var/lib/docker` (có thể đổi bằng tùy chọn `--data-root`).
- **Quyền hạn**: `dockerd` cần quyền `root`, trừ khi sử dụng **Rootless mode**.
- **Chạy container & image store**: `dockerd` chạy container dựa vào OCI runtime được gọi thông qua `containerd`, với OCI runtime mặc định là `runc`. Với **Docker Engine 29.0 trở lên**, cài đặt mới sử dụng `containerd` image store làm mặc định.
</details>

### Câu Hỏi 5: Điều gì xảy ra mặc định khi `dockerd` dừng hoạt động, và tính năng nào giúp thay đổi hành vi đó?

<details>
<summary>Đáp án</summary>

Với Docker, `dockerd` là điểm điều phối trung tâm nên vòng đời container mặc định gắn liền với nó: **khi `dockerd` dừng, các container đang chạy mặc định sẽ bị tắt theo**. Để container tiếp tục chạy ngay cả khi daemon không khả dụng, bạn cần bật tính năng **live restore**.
</details>

### Câu Hỏi 6: Podman là công cụ "daemonless" nghĩa là gì, và thiết kế này hướng tới mục tiêu nào?

<details>
<summary>Đáp án</summary>

**Daemonless** nghĩa là Podman **không có daemon quản lý chạy nền liên tục** như `dockerd`. Theo README của dự án Podman, việc không dùng daemon quản lý giúp **an toàn hơn** và **tốn ít tài nguyên hơn khi rảnh** (không có lệnh nào đang chạy).
</details>

### Câu Hỏi 7: `conmon` là gì, và cơ chế *double-fork* giúp `conmon` làm được những gì trong kiến trúc của Podman?

<details>
<summary>Đáp án</summary>

`conmon` là chương trình giám sát và là kênh liên lạc giữa container manager (như Podman hoặc CRI-O) và OCI runtime (như `runc` hoặc `crun`) cho **từng container riêng lẻ**.

Khi chạy, `conmon` (thường) thực hiện **double-fork** để tách khỏi tiến trình cha đã khởi chạy nó (tức tiến trình `podman`), sau đó khởi chạy OCI runtime làm tiến trình con của mình. Nhờ cơ chế này:
1. Tiến trình `podman` có thể thoát sau khi ra lệnh xong mà `conmon` vẫn tiếp tục theo dõi và kết nối với container.
2. Trong suốt thời gian container chạy, `conmon` cung cấp socket để `attach` và giữ mở các luồng chuẩn (standard streams) của container.
</details>

### Câu Hỏi 8: Không có daemon chạy nền, vậy Podman cung cấp API và hỗ trợ restart container bằng cách nào?

<details>
<summary>Đáp án</summary>

- **Cung cấp API theo yêu cầu**: Lệnh `podman system service` hỗ trợ **systemd socket activation**. Khi có client kết nối vào socket, `systemd` mới kích hoạt dịch vụ để cung cấp **REST API có giao diện tương thích Docker**, thay vì chạy daemon thường trực.
- **Restart container**: Vì `conmon` chạy ở một process tách biệt với `podman`, Podman dựa vào điều này để tích hợp và dùng **restart policy của `systemd`** cho việc tự khởi động lại container.
</details>

### Câu Hỏi 9: Hãy tóm tắt các điểm khác biệt chính giữa Docker và Podman về điều phối, giám sát container, khi dừng và API?

<details>
<summary>Đáp án</summary>

| Khía cạnh | Docker | Podman |
| :--- | :--- | :--- |
| **Điều phối** | Có `dockerd` chạy nền liên tục | Không có daemon quản lý (daemonless) |
| **Giám sát từng container** | Qua `dockerd` / `containerd` và OCI runtime | Dùng `conmon`, mỗi container một tiến trình `conmon` riêng |
| **Khi thành phần điều phối dừng** | Mặc định container đang chạy bị tắt theo (trừ khi bật live restore) | Không có daemon để dừng; `conmon` đã tách khỏi tiến trình cha |
| **API** | Luôn được phục vụ bởi `dockerd` | Phục vụ theo yêu cầu qua `systemd` socket activation |
</details>

### Câu Hỏi 10: Dự án `crun` nêu ưu điểm gì so với `runc`, và bạn cần lưu ý điều gì về số liệu hiệu năng này khi áp dụng vào sản xuất?

<details>
<summary>Đáp án</summary>

- Theo README của dự án `crun`, `crun` **nhanh hơn** `runc` và **dùng ít bộ nhớ hơn nhiều**.
- **Lưu ý thực tế (cạm bẫy)**: Đây là số liệu do **chính dự án `crun` tự đo**, không phải một đánh giá độc lập. Nếu hiệu năng khởi động hoặc mức tiêu thụ bộ nhớ là yêu cầu quan trọng trong hệ thống của bạn, bạn nên **tự đo kiểm (benchmark)** trực tiếp trong môi trường thực tế của mình thay vì coi số liệu trên README là sự thật tuyệt đối.
</details>

### Câu Hỏi 11: Để Pod chạy được trên Kubernetes, mỗi node cần có gì và CRI đóng vai trò gì?

<details>
<summary>Đáp án</summary>

- Mỗi Kubernetes node bắt buộc phải được cài một **container runtime** thì các Pod mới chạy được.
- **CRI (Container Runtime Interface)** là giao diện chuẩn hóa mà Kubernetes (`kubelet`) dùng để giao tiếp với container runtime. Theo tài liệu Container Runtimes tại thời điểm viết bài (Kubernetes 1.37), Kubernetes yêu cầu container runtime trên node phải **tuân thủ CRI**.
</details>

### Câu Hỏi 12: Phân biệt vai trò của `containerd` và `CRI-O` trong hệ sinh thái Kubernetes?

<details>
<summary>Đáp án</summary>

Cả hai đều là container runtime cấp cao tuân thủ CRI được Kubernetes hỗ trợ, nhưng có định hướng khác nhau:
- **`containerd`**: Tự mô tả là container runtime chuẩn công nghiệp, nhấn mạnh sự đơn giản, bền vững và di động. Nó là một daemon quản lý toàn bộ vòng đời container: từ tải và lưu image, chạy và giám sát container, đến lưu trữ cấp thấp và gắn mạng. (`containerd` cũng được Docker sử dụng bên dưới `dockerd`).
- **`CRI-O`**: Là một container runtime nhẹ được thiết kế **dành riêng cho Kubernetes** (để `kubelet` gọi qua CRI và chạy OCI runtime bên dưới như `runc`/`crun` thông qua `conmon`).
</details>

### Câu Hỏi 13: Việc Kubernetes gỡ bỏ `dockershim` từ phiên bản 1.24 có nghĩa là gì, và các image được build bằng Docker có còn chạy được trên Kubernetes không?

<details>
<summary>Đáp án</summary>

- **Ý nghĩa của việc gỡ `dockershim`**: Trước đây `dockershim` đóng vai trò như "người phiên dịch" giúp `kubelet` giao tiếp với Docker vì Docker Engine vốn không nói trực tiếp giao thức CRI. Từ **Kubernetes 1.24**, `dockershim` đã bị gỡ bỏ; thay vào đó các node thường sử dụng các runtime tuân thủ trực tiếp CRI như `containerd` hoặc `CRI-O`.
- **Ảnh hưởng tới Docker image**: **Không làm image build bằng Docker bị hỏng.** Các image này vẫn chạy bình thường trên Kubernetes (với `containerd` hoặc `CRI-O`) vì định dạng image tuân theo chuẩn **OCI**.
</details>

### Câu Hỏi 14: `RuntimeClass` trong Kubernetes được dùng để giải quyết bài toán gì?

<details>
<summary>Đáp án</summary>

`RuntimeClass` cho phép người dùng **chọn các container runtime khác nhau cho từng Pod** trong cùng một cluster Kubernetes, giúp cân bằng giữa **hiệu năng** và **mức độ bảo mật/cô lập** tùy theo nhu cầu của từng workload.
</details>

### Câu Hỏi 15: Trong thực hành, bạn dùng những lệnh nào để quan sát cơ chế "không có daemon" của Podman và kiểm tra container runtime trên Kubernetes node?

<details>
<summary>Đáp án</summary>

- **Quan sát Podman trên Linux**:
  - Kiểm tra không có Docker daemon: `pgrep -a -x dockerd`
  - Chạy xong một lệnh Podman rồi kiểm tra không còn tiến trình `podman` chạy nền: `podman ps -a > /dev/null; pgrep -a -x podman`
  - Kiểm tra socket kích hoạt API theo yêu cầu do `systemd` giữ: `systemctl --user is-active podman.socket`
  - Lấy PID của container bằng `podman inspect -f '{{.State.Pid}}' <tên_container>` rồi kiểm tra tiến trình cha bằng `ps -o pid,args -p $(ps -o ppid= -p $P)` (hoặc `ps -ef | grep -E "conmon|crun|runc" | grep -v grep`) để thấy `conmon` đang đóng vai trò tiến trình giám sát/cha của container. *(Lưu ý: cây process cụ thể có thể phụ thuộc phiên bản và cấu hình).*
- **Kiểm tra runtime trên Kubernetes node (trên cluster thử nghiệm)**:
  - Chạy lệnh `kubectl get nodes -o wide` và xem cột **`CONTAINER-RUNTIME`** để biết tên runtime và phiên bản mà mỗi node đang sử dụng.
</details>

### Câu Hỏi 16: Hai lưu ý thực tế quan trọng khi gỡ lỗi khởi chạy container và khi đọc tài liệu phiên bản Kubernetes trong bài học này là gì?

<details>
<summary>Đáp án</summary>

1. **Tách biệt tầng khi gỡ lỗi ("không khởi động được container")**: Vì `runc`/`crun` chỉ tạo process container, còn việc kéo/lưu image, mạng và volume do tầng manager (`dockerd`, Podman, `containerd`, `CRI-O`) phụ trách, bạn cần **xác định lỗi đang xảy ra ở tầng nào** trước khi tìm cách sửa.
2. **Kiểm tra đúng phiên bản tài liệu**: Phiên bản Kubernetes cập nhật liên tục (bài viết ghi nhận thông tin tại thời điểm Kubernetes 1.37). Khi triển khai thực tế, cần kiểm tra trực tiếp trang **Container Runtimes** của đúng phiên bản Kubernetes mà hệ thống bạn đang sử dụng.
</details>
