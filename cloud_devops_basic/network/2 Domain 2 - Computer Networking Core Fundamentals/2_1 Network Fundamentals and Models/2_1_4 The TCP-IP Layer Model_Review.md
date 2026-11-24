# Review: 2_1_4 The TCP-IP Layer Model

### Câu Hỏi 1: Bộ giao thức TCP/IP có nguồn gốc từ đâu, do tổ chức nào chuẩn hóa, và điểm khác biệt cốt lõi về vai trò của nó so với mô hình OSI 7 tầng là gì?

<details>
<summary>Đáp án</summary>

- **Nguồn gốc và chuẩn hóa**: Bộ giao thức TCP/IP (Internet Protocol Suite) ra đời từ mạng thử nghiệm **ARPANET** của Bộ Quốc phòng Hoa Kỳ và được chuẩn hóa chính thức bởi **IETF** (Internet Engineering Task Force).
- **Khác biệt cốt lõi về vai trò**:
  - **Mô hình OSI 7 tầng** được các ủy ban tiêu chuẩn quốc tế xây dựng như một khuôn mẫu lý thuyết tham chiếu lý tưởng.
  - **TCP/IP** là hiện thực kỹ thuật thực tế đang vận hành toàn bộ mạng Internet toàn cầu ngày nay, phản ánh tư duy thực dụng, tối giản và khả năng mở rộng quy mô lớn.
</details>

### Câu Hỏi 2: Theo chuẩn RFC 1122, kiến trúc TCP/IP gồm 4 tầng nào và chức năng chính của từng tầng là gì?

<details>
<summary>Đáp án</summary>

Theo **RFC 1122**, ngăn xếp giao thức TCP/IP của một máy chủ Internet gồm **4 tầng chức năng** (từ trên xuống dưới):
1. **Application Layer (Tầng Ứng dụng)**: Nơi các tiến trình ứng dụng người dùng và dịch vụ mạng tương tác trực tiếp (HTTP/HTTPS, DNS, SSH, SMTP, FTP).
2. **Transport Layer (Tầng Giao vận)**: Cung cấp dịch vụ truyền thông điểm-tới-điểm (**end-to-end communication**) giữa các tiến trình ứng dụng chạy trên các host khác nhau, với hai giao thức cốt lõi là TCP và UDP.
3. **Internet Layer (Tầng Internet)**: Đóng gói dữ liệu thành các **IP datagram**, quản lý định địa chỉ logic và thực hiện định tuyến (**routing**) gói tin qua các mạng liên kết khác nhau (trung tâm là IPv4/IPv6, kèm theo giao thức điều khiển và báo cáo lỗi ICMP).
4. **Link Layer / Network Access Layer (Tầng Liên kết)**: Giao tiếp trực tiếp với phần cứng và card mạng (NIC), đóng gói IP datagram thành các khung tin (**frames**) phù hợp với công nghệ truyền dẫn cục bộ (Ethernet IEEE 802.3, Wi-Fi IEEE 802.11) và chuyển đổi thành tín hiệu vật lý qua cáp đồng, cáp quang hoặc sóng vô tuyến.
</details>

### Câu Hỏi 3: Tầng Application trong mô hình TCP/IP (RFC 1122) tương ứng với những tầng nào của mô hình OSI 7 tầng, và việc gộp lại như vậy mang lại lợi ích gì?

<details>
<summary>Đáp án</summary>

- **Ánh xạ với OSI**: Tầng **Application** trong TCP/IP gộp toàn bộ trách nhiệm của **3 tầng trên cùng** trong mô hình OSI: **Session (Layer 5)**, **Presentation (Layer 6)** và **Application (Layer 7)**. Các chức năng quản lý phiên làm việc, định dạng/nén dữ liệu hoặc mã hóa (như TLS/SSL) nếu cần sẽ được tích hợp trực tiếp vào bên trong ứng dụng hoặc thư viện tầng ứng dụng.
- **Lợi ích**: Mang lại tính linh hoạt cao và tránh chi phí tài nguyên (**overhead**) không cần thiết cho các tầng trung gian. Ví dụ, một giao thức như **DNS** không cần quản lý phiên phức tạp hay mã hóa nén dữ liệu có thể gửi truy vấn trực tiếp qua UDP mà không phải đi qua các thủ tục bắt tay cồng kềnh của L5/L6.
</details>

### Câu Hỏi 4: Hai giao thức cốt lõi ở tầng Transport là TCP và UDP khác nhau như thế nào về cơ chế truyền tải và mục đích sử dụng?

<details>
<summary>Đáp án</summary>

- **TCP (Transmission Control Protocol - RFC 793 / RFC 9293)**:
  - **Cơ chế**: Hướng kết nối (**connection-oriented**), đảm bảo truyền dữ liệu tin cậy, bảo toàn thứ tự byte, có cơ chế điều khiển luồng (**flow control**) và kiểm soát tắc nghẽn (**congestion control**).
  - **Mục đích sử dụng**: Phù hợp cho các ứng dụng cần độ chính xác và tin cậy cao như HTTP, SSH, MySQL.
- **UDP (User Datagram Protocol - RFC 768)**:
  - **Cơ chế**: Phi kết nối (**connectionless**), truyền tải tối giản không bảo đảm (**best-effort**), không sắp xếp lại thứ tự gói tin.
  - **Mục đích sử dụng**: Tối ưu độ trễ cho các dịch vụ thời gian thực hoặc truy vấn nhanh như DNS, DHCP, VoIP, livestream, QUIC/HTTP3.
</details>

### Câu Hỏi 5: Sự khác biệt giữa mô hình TCP/IP 4 tầng (RFC 1122) và mô hình sư phạm 5 tầng (Kurose & Ross) nằm ở đâu và vì sao lại có sự tách tầng đó?

<details>
<summary>Đáp án</summary>

- **Điểm khác biệt**:
  - **TCP/IP 4 tầng (RFC 1122)** xem phần cứng vật lý và trình điều khiển liên kết cục bộ là một thể thống nhất trong **Link Layer**.
  - **Mô hình sư phạm 5 tầng (Kurose & Ross)** giữ nguyên 3 tầng trên (`Application`, `Transport`, `Network`) và tách **Link Layer** thành 2 tầng riêng biệt: **Data Link Layer** (quản lý MAC, frame, switch L2, phát hiện lỗi) và **Physical Layer** (tín hiệu điện, quang, modulation, truyền dẫn bit).
- **Lý do sư phạm**: Giúp sinh viên và kỹ sư hiểu rõ ranh giới kỹ thuật giữa phần mềm trình điều khiển (driver)/logic khung tin và phần cứng truyền dẫn vật lý (transceiver, cáp mạng).
</details>

### Câu Hỏi 6: Trong bảng ánh xạ giữa OSI 7 tầng và TCP/IP, đơn vị dữ liệu (PDU) tương ứng tại các tầng Application, Transport, Internet (Network), Data Link và Physical là gì?

<details>
<summary>Đáp án</summary>

Đơn vị dữ liệu (PDU) tương ứng tại từng tầng như sau:
- **Application Layer** (gộp OSI L5–L7): **Application Data / Message**
- **Transport Layer** (OSI L4): **Segment** (đối với TCP) / **Datagram** (đối với UDP)
- **Internet Layer / Network Layer** (OSI L3): **IP Datagram / Packet**
- **Data Link Layer** (nằm trong Link Layer của RFC 1122, OSI L2): **Frame**
- **Physical Layer** (nằm trong Link Layer của RFC 1122, OSI L1): **Bits / Symbols**
</details>

### Câu Hỏi 7: Trong mô hình "Eo đồng hồ cát" (The Hourglass Model - RFC 3439), yếu tố nào đóng vai trò là "vòng eo hẹp" (thin waist) và kiến trúc này mang lại lợi ích gì cho sự phát triển của Internet?

<details>
<summary>Đáp án</summary>

- **Vòng eo hẹp (The Thin Waist)**: Chính là **Giao thức IP (IPv4 & IPv6)** tối giản tại tầng Internet. Mọi luồng thông tin truyền qua Internet đều phải đóng gói thành IP datagram, còn mọi độ phức tạp bổ sung được đẩy lên phía trên tầng IP.
- **Lợi ích — Tính độc lập hai chiều (Bidirectional Decoupling)**:
  - **Hướng xuống dưới**: Nhà sản xuất phần cứng và nhà mạng có thể tự do phát minh các phương tiện truyền dẫn mới (cáp quang, Wi-Fi, 4G/5G, vệ tinh) miễn là phần cứng đó chuyên chở được gói tin IP, mà không cần quan tâm ứng dụng phía trên.
  - **Hướng lên trên**: Kỹ sư phần mềm có thể tự do sáng tạo các giao thức ứng dụng mới (HTTP/2, HTTP/3, QUIC, WebSocket, gRPC) miễn là đóng gói được vào gói IP, mà không cần thay đổi router mạng hay hạ tầng cáp bên dưới.
</details>

### Câu Hỏi 8: Nguyên lý thiết kế End-to-End (RFC 1958) phân bổ trách nhiệm giữa nút biên (End Systems) và lõi mạng (Core Routers) như thế nào, và điều này giúp ích gì cho khả năng chịu lỗi của Internet?

<details>
<summary>Đáp án</summary>

Theo nguyên lý **End-to-End** (RFC 1958), các chức năng có thể thực hiện tại nút đầu cuối thì không nên thực hiện bởi mạng lõi:
- **Nút biên thông minh (Smart Edges / End Systems)**: Các máy chủ/client ở hai đầu đảm nhận mọi tác vụ phức tạp và có trạng thái: thiết lập phiên kết nối, kiểm tra toàn vẹn dữ liệu, sắp xếp thứ tự gói, truyền lại gói bị mất (TCP retransmission), kiểm soát tắc nghẽn (BBR, CUBIC) và mã hóa (TLS).
- **Lõi mạng đơn giản, phi trạng thái (Dumb/Fast Stateless Core)**: Các router ở lõi mạng không lưu trạng thái kết nối ứng dụng và không kiểm tra payload; chúng chỉ đọc địa chỉ IP đích và chuyển tiếp (**forwarding**) gói tin đi chặng tiếp theo nhanh nhất có thể (best-effort).
- **Lợi ích về chịu lỗi (Fault Tolerance)**: Vì router lõi không giữ trạng thái phiên, nếu một router trung gian gặp sự cố hoặc khởi động lại, các gói tin chỉ cần được định tuyến qua đường khác mà không làm sập kết nối TCP của hai máy chủ ở hai đầu.
</details>

### Câu Hỏi 9: Trường Protocol trong IPv4 Header (RFC 791) có kích thước bao nhiêu bit, đảm nhiệm vai trò gì và giá trị chuẩn cho ICMP, TCP, UDP là bao nhiêu?

<details>
<summary>Đáp án</summary>

Theo **RFC 791 Section 3.1** và bảng số hiệu **IANA**:
- **Kích thước**: Trường `Protocol` dài **8 bits** (nằm ở byte thứ 10 trong IPv4 Header).
- **Vai trò**: Đóng vai trò như một **bộ giải ghép kênh (demultiplexer)** tại Tầng 3, chỉ định giao thức tầng tiếp theo đang nằm trong phần dữ liệu (payload) của IPv4 datagram để nhân hệ điều hành (kernel) chuyển giao đúng ngăn xếp xử lý.
- **Giá trị chuẩn (thập phân)**:
  - **`1`**: **ICMP** (Internet Control Message Protocol — RFC 792)
  - **`6`**: **TCP** (Transmission Control Protocol — RFC 793 / RFC 9293)
  - **`17`**: **UDP** (User Datagram Protocol — RFC 768)
</details>

### Câu Hỏi 10: Trên hệ điều hành Linux, hai file `/etc/protocols` và `/etc/services` dùng để tra cứu thông tin gì?

<details>
<summary>Đáp án</summary>

- **`/etc/protocols`**: Là cơ sở dữ liệu giao thức dùng để tra cứu ánh xạ giữa tên giao thức và **Protocol Number 8-bit** ở Tầng 3 (IPv4 Header), ví dụ: `icmp` là `1`, `tcp` là `6`, `udp` là `17`.
- **`/etc/services`**: Là danh bạ dịch vụ chuẩn dùng để tra cứu ánh xạ giữa tên dịch vụ tầng Ứng dụng với **số hiệu cổng (Port Number, 0–65535)** và giao thức tầng Giao vận (L4) hỗ trợ, ví dụ: `ssh` (`22/tcp`, `22/udp`), `domain` / DNS (`53/tcp`, `53/udp`), `http` (`80/tcp`, `80/udp`), `https` (`443/tcp`, `443/udp`).
</details>

### Câu Hỏi 11: Các thiết bị trung gian (Middleboxes) như NAT và Stateful Firewall ảnh hưởng như thế nào đến nguyên lý End-to-End trong thực tế sản xuất?

<details>
<summary>Đáp án</summary>

- **Phá vỡ tính minh bạch End-to-End**: Khác với giả định của RFC 1958 (router lõi chỉ chuyển tiếp thuần túy và phi trạng thái), các middlebox như **NAT**, **Stateful Firewall**, và **L7 Reverse Proxy / WAF** thay đổi địa chỉ IP/Port và lưu trạng thái kết nối giữa chừng.
- **Hậu quả thực tế**:
  - Gây gián đoạn các giao thức cần kết nối trực tiếp và biết IP gốc của đối tác như P2P, WebRTC, VoIP (SIP), buộc kỹ sư phải triển khai thêm các giải pháp như **STUN**, **TURN**, **ICE** hoặc **VPN tunneling**.
  - Với Stateful Firewall, bảng theo dõi trạng thái kết nối (như `conntrack` trên Linux) có thể bị tràn bộ nhớ khi lưu lượng tăng đột biến hoặc bị tấn công DDoS, làm rớt các kết nối mới dù CPU và băng thông mạng chưa quá tải.
</details>

### Câu Hỏi 12: Khi cấu hình tường lửa (Firewall / Security Group), cần phân biệt IP Protocol Number và Port Number như thế nào để tránh nhầm lẫn với ICMP và TCP/UDP?

<details>
<summary>Đáp án</summary>

Cần nắm rõ ranh giới tầng của hai thông số này:
- **Protocol Number (8-bit)**: Nằm ở **IPv4 Header (Tầng 3)**, dùng để xác định loại giao thức (`1` cho ICMP, `6` cho TCP, `17` cho UDP).
- **Port Number (16-bit)**: Nằm ở **TCP hoặc UDP Header (Tầng 4)**, dùng để xác định tiến trình ứng dụng cụ thể trên máy chủ (`22` SSH, `80` HTTP, `443` HTTPS).
- **Tránh nhầm lẫn khi cấu hình luật (như `iptables`, `nftables`, AWS NACLs)**:
  - **ICMP không có khái niệm Port**: Để cho phép hoặc chặn `ping`, phải lọc theo **IP Protocol = 1** ở Tầng 3, không tìm cấu hình "Port ICMP".
  - **Mở cổng dịch vụ cụ thể**: Muốn mở HTTPS phải chỉ định đúng **TCP Destination Port = 443**, tránh nhầm sang chỉ lọc theo **Protocol = 6** (vì điều đó sẽ cho phép toàn bộ lưu lượng TCP ở mọi port).
</details>
