# Review: 2_7_5 SSH Protocol and Port Forwarding

### Câu Hỏi 1: Giao thức SSH giải quyết bài toán gì, phiên bản chuẩn hiện đại là gì và cổng mặc định cùng bộ RFC nền tảng của nó gồm những gì?

<details>
<summary>Đáp án</summary>

- **Bài toán giải quyết**: SSH (**Secure Shell**) là giao thức tầng ứng dụng (Application Layer) dùng để đăng nhập từ xa an toàn, thực thi lệnh và truyền dữ liệu qua các mạng không tin cậy.
- **Phiên bản và cổng mặc định**: Phiên bản chuẩn hóa hiện đại là **SSH-2**, và máy chủ SSH mặc định lắng nghe trên **TCP port 22**.
- **Bộ tiêu chuẩn IETF nền tảng**:
  - **RFC 4251**: Kiến trúc tổng thể của giao thức SSH.
  - **RFC 4252**: Tầng xác thực người dùng (User Authentication Protocol).
  - **RFC 4253**: Tầng giao vận bảo mật (Transport Layer Protocol).
  - **RFC 4254**: Tầng giao thức kết nối (Connection Protocol).

</details>

---

### Câu Hỏi 2: Kiến trúc SSH-2 gồm ba tầng độc lập nào xếp chồng trên nền TCP và vai trò chính của từng tầng là gì?

<details>
<summary>Đáp án</summary>

Theo **RFC 4251 §1**, kiến trúc SSH-2 được module hóa thành 3 tầng xếp chồng lên nền TCP (Port 22):

1. **SSH Transport Layer Protocol (RFC 4253)**:
   - Chạy trực tiếp trên kết nối TCP cổng 22.
   - Thiết lập kênh truyền bảo mật cung cấp tính bảo mật (**Confidentiality** qua mã hóa đối xứng), tính toàn vẹn (**Integrity** qua mã **MAC**), và tính bí mật chuyển tiếp (**Forward Secrecy** qua trao đổi khóa Diffie-Hellman/ECDH).
   - Đảm nhiệm **xác thực danh tính máy chủ (Server Authentication)** bằng Server Public Host Key.
2. **SSH User Authentication Protocol (RFC 4252)**:
   - Chạy trên nền kênh truyền đã được mã hóa bởi Transport Layer.
   - Xác thực danh tính người dùng máy khách (Client User) với máy chủ thông qua các phương thức như `publickey` (khuyến nghị hàng đầu), `password`, và `hostbased`.
3. **SSH Connection Protocol (RFC 4254)**:
   - Chạy trên kênh truyền đã được xác thực an toàn.
   - Quản lý cơ chế **đa hợp (Multiplexing)** nhiều kênh liên lạc logic độc lập (**Channels**) trên cùng một kết nối mã hóa duy nhất.

</details>

---

### Câu Hỏi 3: Cơ chế đa hợp (Multiplexing) trong SSH Connection Protocol (RFC 4254) hoạt động như thế nào và hỗ trợ những mục đích kênh (Channel) nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế đa hợp (Multiplexing)**: Thay vì phải mở một kết nối TCP và thiết lập đường hầm SSH mới cho mỗi tác vụ, tầng SSH Connection Protocol cho phép chạy đồng thời nhiều kênh liên lạc logic độc lập (**Channels**) bên trong một kết nối SSH đã được mã hóa và xác thực duy nhất.
- **Các mục đích kênh chuyên biệt**:
  - `session`: Phiên làm việc dòng lệnh tương tác (Interactive Shell).
  - `exec`: Thực thi lệnh từ xa.
  - `sftp`: Truyền tải tệp tin.
  - `direct-tcpip` và `forwarded-tcpip`: Chuyển tiếp cổng mạng (Port Forwarding).

</details>

---

### Câu Hỏi 4: Cấu trúc gói tin nhị phân SSH (Binary Packet Wire Format - RFC 4253 §6) gồm những trường nào và vai trò của `random padding` cùng `mac` là gì?

<details>
<summary>Đáp án</summary>

Mọi dữ liệu tại tầng giao vận SSH được đóng gói gồm 5 trường theo thứ tự:
1. **`packet_length` (uint32, 4 bytes)**: Độ dài của gói tính bằng byte (không tính chính trường `packet_length` và trường `mac`).
2. **`padding_length` (1 byte)**: Độ dài của vùng đệm ngẫu nhiên.
3. **`payload`**: Tải hữu ích của gói tin, có độ dài bằng `packet_length - padding_length - 1` bytes.
4. **`random padding` (4 đến 255 bytes)**: Chuỗi byte ngẫu nhiên được chèn vào để căn chỉnh tổng kích thước (`packet_length + 4`) thành bội số của kích thước khối mã hóa (Cipher block size), đồng thời ngăn chặn các kỹ thuật phân tích độ dài gói tin.
5. **`mac` (Message Authentication Code)**: Được tính trên số thứ tự gói (Packet sequence number) và dữ liệu không nén để bảo vệ tính toàn vẹn thông điệp.

</details>

---

### Câu Hỏi 5: Mô hình tin cậy TOFU (Trust On First Use) và tệp `~/.ssh/known_hosts` hoạt động như thế nào trong lần kết nối đầu tiên và các lần kết nối tiếp theo?

<details>
<summary>Đáp án</summary>

Khác với mô hình PKI phân cấp dùng chuỗi chứng chỉ số (CA), SSH nguyên bản dùng mô hình **Trust On First Use (TOFU)** (RFC 4251 §4.1):
- **Lần kết nối đầu tiên (First Use)**:
  - Client chưa biết danh tính server; server gửi Public Host Key cho client.
  - Client hiển thị chuỗi băm vân tay (**Key Fingerprint**) để người dùng xác nhận tin cậy.
  - Khi người dùng đồng ý, khóa này được lưu vĩnh viễn vào tệp cục bộ `~/.ssh/known_hosts`.
- **Các lần kết nối tiếp theo**:
  - Client tự động đối chiếu Public Host Key mà server gửi với bản ghi đã lưu trong `~/.ssh/known_hosts`.
  - Nếu khớp, phiên kết nối tiếp tục diễn ra tự động và an toàn.

</details>

---

### Câu Hỏi 6: Khi thấy cảnh báo `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!`, OpenSSH tự động thực hiện biện pháp bảo vệ gì và người quản trị cần xử lý sự cố này như thế nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế bảo vệ của OpenSSH**: Khi phát hiện Host Key của server không khớp với `~/.ssh/known_hosts`, OpenSSH lập tức **chặn đứng kết nối**, từ chối tự động chấp nhận khóa mới và **vô hiệu hóa phương thức xác thực bằng mật khẩu (`password authentication`)** nhằm ngăn người dùng vô tình gửi mật khẩu cho kẻ tấn công đứng giữa (**Man-in-the-Middle**).
- **Nguyên nhân thường gặp**: Server vừa cài lại hệ điều hành (tạo cặp Host Key mới), địa chỉ IP được gán cho một máy ảo khác trên Cloud, hoặc hệ thống đang bị tấn công giả mạo.
- **Cách xử lý chuẩn sản xuất**:
  1. Tuyệt đối **không** tắt kiểm tra bằng `StrictHostKeyChecking=no` trong môi trường sản xuất.
  2. Kiểm tra lại Key Fingerprint mới thông qua bộ phận quản trị hạ tầng hoặc bảng điều khiển Cloud Console (**Out-of-band management**). (Có thể kiểm tra danh sách fingerprint đang lưu bằng `ssh-keygen -lf ~/.ssh/known_hosts`).
  3. Chỉ sau khi xác nhận khóa mới là hợp lệ, mới xóa bản ghi cũ bằng lệnh:
     ```bash
     ssh-keygen -R <hostname_hoặc_IP>
     ```

</details>

---

### Câu Hỏi 7: Local Port Forwarding (`-L`) hoạt động theo luồng nào, dùng cho bài toán gì, và hai cờ `-N`, `-f` khi dùng kèm có tác dụng gì?

<details>
<summary>Đáp án</summary>

- **Cú pháp**: `ssh -L [bind_address:]port:host:hostport user@ssh_server` (ví dụ: `ssh -L 8080:db.internal:3306 user@bastion.example.com -N -f`).
- **Luồng hoạt động**:
  1. SSH Client mở một cổng lắng nghe cục bộ trên máy client (ví dụ `127.0.0.1:8080`).
  2. Ứng dụng trên máy client kết nối vào cổng cục bộ này; SSH Client đóng gói dữ liệu và gửi qua đường hầm SSH tới SSH Server.
  3. SSH Server giải mã và mở kết nối TCP trực tiếp tới đích (`db.internal:3306`).
- **Mục đích**: Cho phép máy khách truy cập an toàn vào một dịch vụ nội bộ (như Database hoặc Web nội bộ) nằm sau firewall mà chỉ có SSH Server mới kết nối tới được.
- **Ý nghĩa các cờ**:
  - `-N`: Không thực thi lệnh shell từ xa nào (chỉ mở đường hầm chuyển tiếp cổng).
  - `-f`: Đưa tiến trình SSH xuống chạy ngầm (Background) sau khi xác thực thành công.

</details>

---

### Câu Hỏi 8: Remote Port Forwarding (`-R`) hoạt động theo luồng nào và vì sao sau khi chạy `ssh -R 9000:localhost:3000 user@cloud`, người dùng ngoài Internet vẫn có thể không truy cập được cổng `9000`?

<details>
<summary>Đáp án</summary>

- **Luồng hoạt động**:
  1. SSH Server mở một cổng lắng nghe từ xa trên chính máy chủ (ví dụ cổng `9000`).
  2. Khi có kết nối vào cổng này trên server, SSH Server chuyển tiếp dữ liệu ngược qua đường hầm SSH về SSH Client.
  3. SSH Client tạo kết nối tới dịch vụ đích (`localhost:3000`) trong mạng nội bộ của client.
- **Mục đích**: Cho phép bên ngoài Internet hoặc máy chủ Cloud truy cập ngược vào dịch vụ đang chạy trên máy cá nhân nằm sau tường lửa/NAT nội bộ (ví dụ: test webhook server cục bộ).
- **Nguyên nhân không truy cập được từ ngoài Internet (`GatewayPorts`)**: Theo mặc định bảo mật trong `sshd_config`, dịch vụ `sshd` chỉ bind cổng remote forwarding vào địa chỉ loopback nội bộ (`127.0.0.1`) của máy chủ Cloud nên kết nối từ card mạng bên ngoài bị chặn. Để cho phép bên ngoài truy cập, quản trị viên phải cấu hình `GatewayPorts yes` (hoặc `clientspecified`) trong `/etc/ssh/sshd_config` trên máy chủ Cloud và reload lại `sshd`.

</details>

---

### Câu Hỏi 9: Dynamic Port Forwarding (`-D`) hoạt động như thế nào và khác với Local Port Forwarding (`-L`) ở điểm cốt lõi nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Với lệnh `ssh -D [bind_address:]port user@bastion` (ví dụ `ssh -D 1080 user@bastion.example.com -N`), SSH Client mở một cổng lắng nghe cục bộ đóng vai trò là máy chủ proxy chuẩn **SOCKS5**.
- **Cách sử dụng**: Khi trình duyệt hoặc phần mềm được cấu hình dùng SOCKS5 Proxy tại `127.0.0.1:1080`, toàn bộ lưu lượng mạng sẽ được mã hóa gửi qua đường hầm tới SSH Server và đi ra Internet từ địa chỉ IP của SSH Server.
- **Điểm khác biệt cốt lõi với `-L`**:
  - `-L` chỉ chuyển tiếp cố định tới **một** máy chủ và **một** cổng đích xác định trước (`host:hostport`).
  - `-D` biến đường hầm SSH thành một proxy **SOCKS5** đa hướng, cho phép định tuyến lưu lượng tới bất kỳ Web/API Endpoint đích nào thông qua SSH Server.

</details>

---

### Câu Hỏi 10: Cơ chế Jump Host (`-J` / `ProxyJump`) hoạt động như thế nào và tại sao nên dùng `-J` thay vì SSH Agent Forwarding (`-A`) khi đi qua Bastion Host?

<details>
<summary>Đáp án</summary>

- **Cơ chế của Jump Host (`-J`, ví dụ `ssh -J user@jump.example.com:22 user@10.0.1.50`)**:
  - OpenSSH thiết lập phiên SSH trung gian tới Bastion / Jump Host, sau đó tự động tạo kênh chuyển tiếp TCP xuyên qua Bastion tới Target Host trong Private Subnet.
  - Quá trình xác thực Private Key cho Target Host diễn ra **đầu-cuối (End-to-End)** trực tiếp giữa máy client và máy đích; khóa bí mật không bao giờ bị lưu lại hay giải mã trên Jump Host.
- **Rủi ro của SSH Agent Forwarding (`-A`)**:
  - `ssh -A` tạo ra một socket chuyển tiếp trên máy Bastion. Nếu máy Bastion dùng chung bị kẻ tấn công chiếm quyền `root`, kẻ tấn công có thể kết nối vào socket này và mượn danh tính của bạn để truy cập vào các máy chủ khác trong hạ tầng trong lúc bạn đang kết nối.
  - Do đó, luôn ưu tiên dùng `-J` (`ProxyJump`) vì Bastion chỉ thuần túy trung chuyển gói tin TCP mà không có quyền can thiệp vào quá trình xác thực danh tính.

</details>

---

### Câu Hỏi 11: Trong OpenSSH hiện đại, thuật toán khóa nào được khuyến nghị hàng đầu, chuẩn RSA cần đáp ứng điều kiện gì và vì sao `ssh-rsa` (SHA-1) bị vô hiệu hóa mặc định?

<details>
<summary>Đáp án</summary>

- **Thuật toán khuyến nghị hàng đầu**: **Ed25519 (`ssh-ed25519`)**, hoạt động trên đường cong Curve25519 (tạo bằng `ssh-keygen -t ed25519 -C "..."`), nhờ tốc độ xử lý vượt trội, kích thước khóa nhỏ gọn (256 bits) và độ bảo mật cao chống lại tấn công kênh bên (Side-channel attacks). Ngoài ra có thể dùng **ECDSA** (256, 384, 521 bits).
- **Yêu cầu đối với RSA**: Nếu sử dụng RSA, khóa phải có độ dài tối thiểu **2048, 3072 hoặc 4096 bits** và bắt buộc dùng chữ ký số **SHA-2** (`rsa-sha2-256` hoặc `rsa-sha2-512`).
- **Lý do `ssh-rsa` (SHA-1) bị vô hiệu hóa**: Chữ ký `ssh-rsa` sử dụng hàm băm SHA-1 cũ đã bị bẻ gãy về mặt lý thuyết (rủi ro va chạm băm - Hash collision), nên từ phiên bản **OpenSSH 8.8** trở lên đã bị vô hiệu hóa mặc định, dễ gây lỗi kết nối với các thiết bị mạng hoặc máy chủ legacy cũ.

</details>

---

### Câu Hỏi 12: Cơ chế `StrictModes` trong `sshd_config` làm nhiệm vụ gì, mức phân quyền chuẩn cho các thư mục/tệp SSH là bao nhiêu và lỗi gì xảy ra nếu cấp quyền quá rộng?

<details>
<summary>Đáp án</summary>

- **Nhiệm vụ của `StrictModes`**: Được bật mặc định (`StrictModes yes`) trong `sshd_config(5)`, cơ chế này kiểm tra quyền sở hữu và phân quyền của thư mục người dùng, thư mục `~/.ssh` và tệp `~/.ssh/authorized_keys` trước khi chấp nhận đăng nhập bằng khóa công khai.
- **Phân quyền chuẩn bắt buộc**:
  - Thư mục `~/.ssh`: **`700`** (`drwx------`)
  - Khóa riêng tư (ví dụ `id_ed25519`): **`600`** (`-rw-------`)
  - Tệp `~/.ssh/authorized_keys`: **`600`** (`-rw-------`) (tiện ích `ssh-copy-id` cũng tự động thiết lập quyền này khi sao chép khóa công khai lên server)
  - Khóa công khai (`*.pub`): **`644`** (`-rw-r--r--`)
- **Hậu quả khi phân quyền quá rộng**: Nếu `~/.ssh` hoặc `authorized_keys` có quyền ghi cho nhóm (`group-writable`, ví dụ `775`, `664`) hoặc người ngoài (`world-writable`, ví dụ `777`), `sshd` sẽ lập tức từ chối xác thực `publickey` (gây lỗi `Permission denied (publickey)` hoặc bắt nhập mật khẩu) để ngăn kẻ xấu trên cùng hệ thống sửa đổi khóa nhằm chiếm quyền.

</details>
