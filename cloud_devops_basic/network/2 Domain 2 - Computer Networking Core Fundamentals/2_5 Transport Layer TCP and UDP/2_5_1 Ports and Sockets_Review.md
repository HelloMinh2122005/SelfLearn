# Review: 2_5_1 Ports and Sockets

### Câu Hỏi 1: Tại sao việc chỉ có địa chỉ IP ở Tầng Mạng (Layer 3) là chưa đủ cho giao tiếp giữa các ứng dụng, và Tầng Giao Vận (Layer 4) giải quyết vấn đề này bằng hai khái niệm nào?

<details>
<summary>Đáp án</summary>

Địa chỉ IP ở **Tầng Mạng (Network Layer - Layer 3)** chỉ chịu trách nhiệm chuyển giao gói tin giữa các máy tính chủ (**host-to-host**). Tuy nhiên, trên một máy tính thực tế có hàng chục đến hàng trăm tiến trình ứng dụng chạy đồng thời (như web server, database client, SSH, DNS), nên chỉ dựa vào địa chỉ IP sẽ không thể biết gói dữ liệu thuộc về tiến trình nào.

**Tầng Giao Vận (Transport Layer - Layer 4)** giải quyết bài toán giao tiếp **tiến trình-tới-tiến trình (process-to-process)** thông qua hai khái niệm nền tảng: **Số hiệu Cổng (Port Number)** và **Ổ cắm mạng (Socket)**.
</details>

---

### Câu Hỏi 2: Cơ chế Ghép kênh (Multiplexing) và Phân kênh (Demultiplexing) hoạt động như thế nào tại máy gửi và máy nhận, và điều gì xảy ra nếu gói tin đến một cổng không có socket nào lắng nghe?

<details>
<summary>Đáp án</summary>

1. **Ghép kênh (Multiplexing - tại máy gửi)**:
   - Nhiều tiến trình ứng dụng cùng truyền dữ liệu xuống tầng giao vận.
   - Tầng giao vận thu thập các luồng dữ liệu này, đóng gói thêm tiêu đề giao vận (chứa `Source Port` và `Destination Port`), rồi chuyển Segment hoặc Datagram xuống tầng IP để truyền qua cùng một card mạng vật lý và một địa chỉ IP duy nhất.
2. **Phân kênh (Demultiplexing - tại máy nhận)**:
   - Sau khi tầng IP xử lý xong địa chỉ IP và chuyển dữ liệu lên tầng giao vận, tầng giao vận kiểm tra `Destination Port` cùng các trường định danh kết nối trong tiêu đề để tra cứu bảng Socket Lookup Table và chuyển dữ liệu vào đúng hàng đợi bộ đệm của tiến trình đang chờ.
3. **Trường hợp cổng không tồn tại**:
   - Nếu không có socket nào đang lắng nghe ở cổng đích, hệ thống sẽ trả về gói tin **TCP RST** hoặc **ICMP Port Unreachable**.
</details>

---

### Câu Hỏi 3: Không gian số hiệu cổng theo chuẩn IANA (RFC 6335) có kích thước bao nhiêu và được phân chia thành những dải cổng nào?

<details>
<summary>Đáp án</summary>

Các giao thức tầng giao vận (TCP, UDP, UDP-Lite, SCTP, DCCP) sử dụng không gian số nguyên không dấu **16-bit**, nên số hiệu cổng trải dài từ **`0` đến `65535`** ($2^{16} - 1$). IANA chia không gian này thành 3 dải:

1. **System Ports (Well Known Ports): `0` – `1023`**
   - Do IANA phân bổ và chỉ định chính thức cho các dịch vụ cốt lõi.
   - Trên Linux/Unix, cần đặc quyền quản trị (`root` hoặc `CAP_NET_BIND_SERVICE`) để lắng nghe.
2. **User Ports (Registered Ports): `1024` – `49151`**
   - Được IANA liệt kê và đăng ký theo yêu cầu của ứng dụng bên thứ ba.
   - Tiến trình người dùng thông thường (unprivileged) có thể tự do mở và lắng nghe.
3. **Dynamic Ports (Private / Ephemeral Ports): `49152` – `65535`**
   - Không bao giờ được IANA chỉ định hay đăng ký.
   - Được hệ điều hành tự động cấp phát làm cổng tạm thời cho các kết nối outbound từ client.
</details>

---

### Câu Hỏi 4: Theo bảng đăng ký chính thức của IANA, các cổng hệ thống 22, 53, 80, 123 và 443 tương ứng với những dịch vụ/giao thức nào?

<details>
<summary>Đáp án</summary>

- **Port 22**: `ssh` (Secure Shell — đăng nhập và quản trị máy chủ từ xa an toàn).
- **Port 53**: `domain` (DNS - Domain Name System — hệ thống phân giải tên miền).
- **Port 80**: `http` (Hypertext Transfer Protocol — giao thức truyền tải siêu văn bản không mã hóa).
- **Port 123**: `ntp` (Network Time Protocol — giao thức đồng bộ thời gian mạng).
- **Port 443**: `https` (HTTP over TLS/SSL — giao thức truyền tải siêu văn bản có mã hóa an toàn).
</details>

---

### Câu Hỏi 5: Dải cổng tạm thời (Ephemeral Ports) mặc định trên Linux Kernel được cấu hình tại đâu, có giá trị là bao nhiêu và khác gì so với chuẩn IANA RFC 6335?

<details>
<summary>Đáp án</summary>

- Tham số quy định dải cổng tạm thời mặc định cho các socket không gán cổng tường minh (`bind`) trên Linux nằm tại tệp kernel:
  `/proc/sys/net/ipv4/ip_local_port_range`
- Giá trị mặc định của Linux (từ phiên bản 2.2 trở lên) là **`32768 60999`** (tương đương **28,232** cổng tạm thời khả dụng).
- Điểm khác biệt so với chuẩn IANA RFC 6335 (`49152` – `65535`) là Linux sử dụng dải cổng tạm thời rộng hơn để đáp ứng nhu cầu mở nhiều kết nối client đồng thời.
</details>

---

### Câu Hỏi 6: Một Socket được cấu thành từ thông tin gì, một kết nối TCP được định danh duy nhất bằng cấu trúc nào, và vì sao một Web Server lắng nghe trên một cổng duy nhất (ví dụ 443) lại có thể phục vụ hàng chục nghìn kết nối cùng lúc?

<details>
<summary>Đáp án</summary>

- **Một Socket** là sự kết hợp của một địa chỉ IP và một số hiệu cổng: `(IP Address, Port Number)`.
- **Một kết nối TCP** được định danh duy nhất bởi một **cặp socket (a pair of sockets)** tạo nên bộ 4 thành phần bất biến (**4-tuple**):
  `(Source IP, Source Port, Destination IP, Destination Port)`
- Dù Server chỉ lắng nghe cố định trên một socket như `(198.51.100.10, 443)`, mỗi kết nối từ các client khác nhau sẽ mang `Source IP` khác nhau hoặc `Source Port` (ephemeral port) khác nhau. Ngay cả khi hai client tình cờ dùng cùng một `Source Port`, sự khác biệt về `Source IP` vẫn tạo ra một **4-tuple hoàn toàn độc nhất** trong bảng trạng thái kết nối của kernel, giúp phân biệt chính xác từng luồng dữ liệu mà không bị lẫn lộn.
</details>

---

### Câu Hỏi 7: Việc gọi `bind()` với `INADDR_ANY` (`0.0.0.0`) khác gì so với việc `bind()` vào một địa chỉ IP cụ thể (như `127.0.0.1` hoặc Private IP), và cần lưu ý rủi ro bảo mật nào?

<details>
<summary>Đáp án</summary>

- **`INADDR_ANY` (`0.0.0.0`)**: Socket được gắn vào **tất cả các giao diện mạng cục bộ** của máy chủ (card mạng vật lý ra ngoài, card mạng nội bộ, loopback `127.0.0.1`, giao diện ảo container). Tiến trình sẽ tiếp nhận mọi gói tin gửi tới cổng đó từ bất kỳ giao diện nào.
- **Địa chỉ IP cụ thể (ví dụ `127.0.0.1` hoặc `10.0.1.5`)**: Socket bị giới hạn nghiêm ngặt, chỉ tiếp nhận lưu lượng có địa chỉ IP đích trùng khớp chính xác với IP đó; lưu lượng gửi tới các giao diện mạng khác sẽ bị kernel từ chối hoặc bỏ qua.
- **Rủi ro bảo mật và thực tiễn tốt nhất**:
  - Nếu cấu hình dịch vụ nội bộ (Redis, MongoDB, Elasticsearch, Admin metrics) lắng nghe trên `0.0.0.0` và máy chủ có gắn Public IP với firewall bị hở, dịch vụ sẽ bị phơi bày trực tiếp ra Internet.
  - **Khuyến nghị**: Chỉ dùng `127.0.0.1` cho dịch vụ nội bộ trên cùng máy chủ; dùng Private LAN IP (như `10.0.x.x`, `172.16.x.x`) cho dịch vụ trong mạng nội bộ; chỉ dùng `0.0.0.0` cho Ingress Gateway công khai.
</details>

---

### Câu Hỏi 8: Trình tự các lời gọi hệ thống để khởi tạo một TCP Server Socket trên Linux là gì, và hai hàng đợi kết nối (SYN Queue và Accept Queue) có vai trò ra sao?

<details>
<summary>Đáp án</summary>

1. **Trình tự khởi tạo TCP Server Socket**:
   `socket()` (tạo endpoint, cấp file descriptor) $\rightarrow$ `bind()` (gán IP và Port) $\rightarrow$ `listen(sockfd, backlog)` (chuyển sang lắng nghe thụ động và cấp phát hàng đợi) $\rightarrow$ `accept()` (lấy kết nối đã hoàn tất để tạo `client_sockfd` truyền dữ liệu).
2. **Vai trò của hai hàng đợi trong Linux Kernel**:
   - **SYN Queue (Incomplete Connection Queue)**: Chứa các yêu cầu kết nối đang ở trạng thái `SYN_RECV` (server đã nhận `SYN`, đã gửi `SYN-ACK`, đang chờ `ACK` cuối cùng). Chiều dài tối đa cấu hình toàn hệ thống qua `/proc/sys/net/ipv4/tcp_max_syn_backlog`.
   - **Accept Queue (Completely Established Sockets Queue)**: Chứa các kết nối đã hoàn tất bắt tay 3 bước (trạng thái `ESTABLISHED`), chờ tiến trình ứng dụng gọi `accept()`. Chiều dài tối đa được quy định bởi tham số `backlog` truyền vào hàm `listen()`.
</details>

---

### Câu Hỏi 9: Điều gì xảy ra khi tiến trình ứng dụng không gọi `accept()` kịp thời và làm tràn Accept Queue?

<details>
<summary>Đáp án</summary>

- Khi ứng dụng bị nghẽn CPU hoặc cạn kiệt thread pool, nó không thể gọi `accept()` kịp để lấy các kết nối `ESTABLISHED` ra khỏi Accept Queue.
- Hàng đợi Accept Queue sẽ bị đầy (`Recv-Q` chạm ngưỡng `Send-Q` khi xem bằng `ss -l`).
- Khi Accept Queue đầy, Linux kernel mặc định sẽ **im lặng bỏ qua (drop)** gói `ACK` hoàn tất bắt tay từ client hoặc trả về gói **TCP Reset (`RST`)**, khiến client gặp lỗi *connection timeout* hoặc *connection reset by peer* dù hệ điều hành máy chủ vẫn chạy bình thường.
</details>

---

### Câu Hỏi 10: Trong lệnh `ss -tuln` và `sudo ss -tulpn`, các cờ `-t`, `-u`, `-l`, `-p`, `-n` có ý nghĩa gì, và cột `Recv-Q` cùng `Send-Q` trên socket ở trạng thái `LISTEN` cho biết thông tin gì?

<details>
<summary>Đáp án</summary>

- **Ý nghĩa các cờ của `ss`**:
  - `-t` (`--tcp`): Hiển thị các socket TCP.
  - `-u` (`--udp`): Hiển thị các socket UDP.
  - `-l` (`--listening`): Chỉ hiển thị các socket đang ở trạng thái lắng nghe (`LISTEN`).
  - `-n` (`--numeric`): Hiển thị địa chỉ IP và số hiệu cổng ở dạng số, không phân giải DNS hay tên dịch vụ qua `/etc/services`.
  - `-p` (`--processes`): Hiển thị tên tiến trình và PID đang sở hữu socket (cần `sudo` để đọc tiến trình của người dùng khác).
- **Ý nghĩa cột `Recv-Q` và `Send-Q` trên socket `LISTEN`**:
  - `Recv-Q`: Số lượng kết nối hiện đã hoàn thành bắt tay 3 bước đang nằm trong **Accept Queue** chờ ứng dụng gọi `accept()`.
  - `Send-Q`: Kích thước tối đa của **Accept Queue** (được ấn định bởi tham số `backlog` trong hàm `listen()`).
</details>

---

### Câu Hỏi 11: Lệnh `sudo lsof -i :22` được sử dụng để làm gì và kết quả trả về cung cấp những thông tin gì?

<details>
<summary>Đáp án</summary>

- Lệnh `lsof` với cờ `-i` dùng để lọc danh sách các file mô tả đang mở tương ứng với địa chỉ mạng Internet; việc thêm `:22` giúp tìm nhanh tiến trình đang mở kết nối hoặc lắng nghe trên cổng `22` (SSH).
- Kết quả trả về hiển thị cả:
  - **Socket lắng nghe gốc** (trạng thái `LISTEN`, ví dụ `sshd` trên `*:ssh`).
  - **Các kết nối phiên làm việc đang hoạt động** (trạng thái `ESTABLISHED` kèm cặp địa chỉ/cổng 4-tuple giữa máy chủ và máy khách), kèm thông tin `COMMAND`, `PID`, `USER`, `FD` và loại giao thức (`TCP`).
</details>

---

### Câu Hỏi 12: Nguyên nhân nào gây ra sự cố Cạn kiệt cổng tạm thời (Ephemeral Port Exhaustion) với lỗi `connect() failed: Cannot assign requested address`, và cách khắc phục trong thực tế là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**:
  - Khi một máy chủ đóng vai trò Client (như API Gateway, Reverse Proxy) mở hàng nghìn kết nối TCP ngắn hạn (không dùng Keep-Alive hoặc Connection Pool) tới cùng **một IP đích và một Port đích cố định**, 3 thành phần trong 4-tuple bị cố định: `(Source IP, ?, Dest IP, Dest Port)`.
  - Thành phần biến thiên duy nhất là `Source Port`, được cấp phát từ dải ephemeral ports `/proc/sys/net/ipv4/ip_local_port_range` (`32768 - 60999`, khoảng 28,232 cổng).
  - Khi mở và đóng kết nối quá nhanh, các cổng vừa đóng rơi vào trạng thái `TIME_WAIT` và chưa kịp giải phóng, làm cạn kiệt toàn bộ dải cổng tạm thời. Kernel không thể cấp cổng nguồn mới nên hàm `connect()` thất bại với lỗi `errno: 99 / EADDRNOTAVAIL` (`Cannot assign requested address`).
- **Cách khắc phục**: Bật tính năng tái sử dụng kết nối **HTTP Keep-Alive** và sử dụng **Connection Pool** (HTTP client pool hoặc database connection pool) thay vì liên tục đóng/mở kết nối mới cho từng request.
</details>
