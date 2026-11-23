# Ôn Tập: 6_8_8 Debug Ở Mức Node

### Câu Hỏi 1: Khi nào kỹ sư cần chuyển từ các lệnh `kubectl` thông thường sang gỡ lỗi trực tiếp ở cấp độ Node?

<details>
<summary>Đáp án</summary>

Khi worker node gặp các sự cố hạ tầng nghiêm trọng như mất kết nối mạng với control plane, tiến trình quản trị cục bộ bị treo, hoặc ổ cứng cạn kiệt dung lượng. Trong những tình huống này, chuỗi liên lạc từ xa bị cắt đứt khiến các lệnh như `kubectl logs` hay `kubectl exec` bị timeout hoặc mất tác dụng, buộc kỹ sư phải truy cập trực tiếp vào node để chẩn đoán tầng sâu.
</details>

### Câu Hỏi 2: `crictl` là công cụ gì, hoạt động dựa trên cơ chế kết nối nào và tại sao nó hữu ích khi `kubelet` hoặc API server gặp sự cố?

<details>
<summary>Đáp án</summary>

`crictl` là công cụ CLI được thiết kế riêng cho các container runtime tương thích với Container Runtime Interface (CRI) như `containerd` hoặc `CRI-O`. Công cụ này kết nối trực tiếp tới container runtime thông qua UNIX domain socket (ví dụ `unix:///run/containerd/containerd.sock` hoặc `unix:///run/crio/crio.sock`), hoàn toàn bỏ qua Kubernetes API server và không phụ thuộc vào tình trạng sống còn của `kubelet`.
</details>

### Câu Hỏi 3: Hãy nêu công dụng của bốn lệnh `crictl` cốt lõi: `crictl pods`, `crictl ps`, `crictl logs`, và `crictl inspect`.

<details>
<summary>Đáp án</summary>

- `crictl pods`: Liệt kê danh sách các Pod sandbox đang tồn tại trên node cục bộ.
- `crictl ps`: Hiển thị toàn bộ các container ứng dụng đang chạy được quản lý bởi container runtime.
- `crictl logs <container-id>`: Đọc trực tiếp luồng dữ liệu chuẩn (`stdout` và `stderr`) được lưu trên ổ đĩa của node (có thể kết hợp `--tail=30` để xem 30 dòng gần nhất).
- `crictl inspect <container-id>`: Trích xuất thông tin chi tiết cấp thấp của container như trạng thái tiến trình (`status`), PID trên máy chủ (`pid`), các điểm gắn kết volume (`mounts`) và giới hạn tài nguyên.
</details>

### Câu Hỏi 4: Vì sao chạy `crictl` trên một số node mới lại báo lỗi không kết nối được `/var/run/dockershim.sock` và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Một số bản cài đặt `crictl` cấu hình mặc định trỏ tới `/var/run/dockershim.sock`, vốn đã bị loại bỏ từ Kubernetes 1.24, thay vì socket của `containerd` hay `CRI-O`.
- **Cách khắc phục**: Tạo tệp cấu hình `/etc/crictl.yaml` và khai báo chính xác `runtime-endpoint` và `image-endpoint` trỏ tới UNIX socket của runtime đang chạy (ví dụ `unix:///run/containerd/containerd.sock`).
</details>

### Câu Hỏi 5: Khi một worker node chuyển sang trạng thái `NotReady`, nguyên nhân trực tiếp liên quan đến `kubelet` là gì và cần dùng những lệnh nào để kiểm tra dịch vụ này?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Node chuyển sang trạng thái `NotReady` khi tiến trình `kubelet` (chạy dưới dạng dịch vụ `systemd`) bị dừng hoặc không thể gửi thông điệp nhịp tim (`NodeStatus`) về API server sau khoảng thời gian quy định.
- **Lệnh kiểm tra**:
  - `sudo systemctl status kubelet`: Kiểm tra trạng thái hoạt động của dịch vụ `kubelet`.
  - `sudo journalctl -u kubelet -f` (hoặc thêm `-n 50`): Xem luồng nhật ký thời gian thực từ `systemd journal` để phát hiện lỗi giao tiếp mạng, lỗi nạp chứng chỉ, xung đột cấu hình hoặc cảnh báo từ Eviction Manager.
</details>

### Câu Hỏi 6: Tệp cấu hình chính của `kubelet` nằm ở đâu và nó chứa thông tin quan trọng nào liên quan đến việc thu hồi Pod?

<details>
<summary>Đáp án</summary>

Tệp cấu hình máy chủ chính của `kubelet` nằm mặc định tại `/var/lib/kubelet/config.yaml`, chứa các tham số hoạt động (`KubeletConfiguration`). Trong đó có phần cấu hình ngưỡng thu hồi tài nguyên (`evictionHard`) như `memory.available`, `nodefs.available`, `nodefs.inodesFree`, và `imagefs.available` để quyết định thời điểm `kubelet` kích hoạt áp lực tài nguyên và thu hồi (evict) Pod.
</details>

### Câu Hỏi 7: Bốn điều kiện sức khỏe cốt lõi (Node Conditions) của một worker node trong Kubernetes là gì và ý nghĩa của từng điều kiện?

<details>
<summary>Đáp án</summary>

1. `Ready`: Cho biết node đang khỏe mạnh và sẵn sàng tiếp nhận Pod.
2. `DiskPressure`: Kích hoạt khi dung lượng trống trên phân vùng tệp gốc (`root filesystem`) hoặc phân vùng chứa ảnh container tụt xuống dưới ngưỡng thu hồi an toàn.
3. `MemoryPressure`: Kích hoạt khi dung lượng RAM khả dụng xuống dưới ngưỡng thu hồi, buộc `kubelet` chủ động trục xuất (evict) các Pod theo thứ tự ưu tiên của QoS class để bảo vệ hệ điều hành máy chủ.
4. `PIDPressure`: Xảy ra khi số lượng Process ID (PID) còn lại trên kernel Linux rơi xuống dưới ngưỡng an toàn, đe dọa làm tê liệt khả năng tạo tiến trình mới của toàn node.
</details>

### Câu Hỏi 8: Khi node gặp `DiskPressure`, tại sao không nên vội vàng xóa hàng loạt dữ liệu trong thư mục runtime và cần ưu tiên kiểm tra thư mục nào trước?

<details>
<summary>Đáp án</summary>

- Việc xóa thủ công hàng loạt dữ liệu runtime (như trong `/var/lib/containerd`) có thể gây nghẽn I/O cục bộ và làm tiến trình quản trị bị treo hoàn toàn, trong khi `kubelet` vốn đã tự động xóa các container đã dừng và thu hồi ảnh khi gặp `DiskPressure`.
- Cần kiểm tra dung lượng tại `/var/log/pods` trước tiên (kết hợp `df -h` và `du -sh /var/lib/containerd /var/log/pods/*`) vì log rác tích lũy từ các ứng dụng bị crash loop thường là nguyên nhân chính làm đầy ổ đĩa.
</details>

### Câu Hỏi 9: Sự cố `PIDPressure` xảy ra như thế nào dù RAM vẫn còn dư, và biện pháp phòng ngừa trong cấu hình là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế gây lỗi**: Khi một ứng dụng trong container rò rỉ tiến trình (tạo hàng loạt tiến trình con hoặc tiến trình ma/zombie không được thu dọn), bảng định danh tiến trình (PID) của kernel Linux sẽ bị cạn kiệt. Lúc này, dù RAM còn thừa, hệ điều hành vẫn từ chối cấp phát tiến trình mới cho mọi tác vụ quản trị cục bộ.
- **Phòng ngừa**: Cấu hình tham số `--pids-limit` trong `kubelet` hoặc thiết lập thuộc tính `pids` trong cgroup để cô lập container rò rỉ trước khi nó làm tê liệt toàn node.
</details>

### Câu Hỏi 10: Trên Linux sử dụng cgroup v2, Kubernetes quản lý tài nguyên các Pod ở đường dẫn nào và ý nghĩa của các tệp `memory.max`, `memory.current`, `cpu.max` là gì?

<details>
<summary>Đáp án</summary>

Kubernetes nhóm và quản lý tài nguyên các Pod theo cây phân cấp slice tại `/sys/fs/cgroup/kubepods.slice/`:
- `memory.max`: Lưu ngưỡng trần bộ nhớ (`limits.memory`) được ấn định cho container/cgroup, tính theo đơn vị byte.
- `memory.current`: Cho biết lượng RAM thực tế đang bị chiếm dụng tại thời điểm kiểm tra (tính theo byte).
- `cpu.max`: Kiểm soát giới hạn CPU (`limits.cpu`) dưới dạng cặp `<quota> <period>` tính bằng microsecond (ví dụ `100000 100000` nghĩa là hạn ngạch 100.000 µs trong mỗi chu kỳ 100.000 µs, tương đương tối đa 1 CPU core).
</details>

### Câu Hỏi 11: Lệnh `kubectl debug node/<node-name> -it --image=<image>` hoạt động như thế nào để cho phép kỹ sư chẩn đoán trực tiếp trên node?

<details>
<summary>Đáp án</summary>

Lệnh này khởi tạo một Pod chẩn đoán đặc quyền tạm thời (ephemeral container/pod) chạy trực tiếp trong không gian tên mạng, IPC và tiến trình của node chủ (`hostNetwork`, `hostIPC`, `hostPID`). Đồng thời, toàn bộ hệ thống tệp gốc của node chủ được tự động gắn kết vào thư mục `/host` bên trong Pod debug.
</details>

### Câu Hỏi 12: Tại sao sau khi chạy `kubectl debug node/...` cần phải thực hiện lệnh `chroot /host` và những công cụ Linux nào thường được dùng ngay sau đó?

<details>
<summary>Đáp án</summary>

- **Lý do dùng `chroot /host`**: Nếu không chạy `chroot /host`, phiên làm việc vẫn nằm trong hệ thống tệp tin riêng của image container debug. Mọi kiểm tra ở `/etc/` hoặc `/usr/bin/` sẽ chỉ phản ánh môi trường của container tạm thời chứ không phải cấu hình hay mã nhị phân thực tế trên máy chủ node.
- **Các công cụ điều tra sau khi `chroot /host`**: Sử dụng các công cụ quản trị Linux nguyên bản trên máy chủ như `ss` (ví dụ `ss -tulpn` kiểm tra cổng mạng đang mở), `tcpdump` (theo dõi gói tin mạng), `lsof` (kiểm tra mô tả tệp đang mở), và `strace`.
</details>
