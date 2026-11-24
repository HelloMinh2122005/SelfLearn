# Review: 2_1_3 The OSI 7-Layer Model

### Câu Hỏi 1: Mô hình OSI 7 tầng ra đời nhằm giải quyết vấn đề gì, do tổ chức nào phát triển và được chuẩn hóa trong tài liệu nào?

<details>
<summary>Đáp án</summary>

- **Vấn đề giải quyết**: Thiết lập tiếng nói chung trên quy mô toàn cầu để kết nối các hệ thống phần cứng và phần mềm từ nhiều nhà sản xuất độc quyền khác nhau.
- **Tổ chức và tài liệu chuẩn hóa**: Được phát triển bởi Tổ chức Tiêu chuẩn hóa Quốc tế (**ISO**) phối hợp cùng **ITU-T**, chuẩn hóa chính thức trong tài liệu **ITU-T Rec. X.200 (07/1994) / ISO/IEC 7498-1:1994**.
- **Cấu trúc**: Chia quá trình truyền thông mạng thành **7 tầng chức năng** riêng biệt, sắp xếp từ tầng phần cứng vật lý bên dưới (**Layer 1**) lên đến tầng ứng dụng người dùng ở đỉnh (**Layer 7**).
</details>

### Câu Hỏi 2: Mô hình OSI được xây dựng dựa trên 3 nguyên lý kiến trúc cốt lõi nào?

<details>
<summary>Đáp án</summary>

Theo đặc tả **ITU-T Rec. X.200**, kiến trúc OSI dựa trên 3 nguyên lý nền tảng:
1. **Phân tách trách nhiệm (Separation of Concerns)**: Tạo ra các tầng tách biệt để xử lý những chức năng khác biệt rõ rệt; việc thay đổi hay nâng cấp công nghệ bên trong một tầng không làm xáo trộn hoặc đòi hỏi thiết kế lại các tầng khác.
2. **Giao tiếp logic giữa các thực thể đồng tầng (Peer-to-Peer Logical Communication)**: Về mặt logic, tầng $N$ của thiết bị gửi tương tác và trao đổi thông điệp với tầng $N$ của thiết bị nhận thông qua giao thức tầng $N$, dù dữ liệu thực tế vẫn phải truyền xuôi xuống tầng vật lý để đi qua môi trường truyền dẫn.
3. **Trừu tượng hóa dịch vụ (Service Abstraction)**: Mỗi tầng $(N)$ cung cấp dịch vụ xác định cho tầng ngay phía trên $(N+1)$ và sử dụng dịch vụ từ tầng ngay phía dưới $(N-1)$ thông qua Điểm Truy cập Dịch vụ (**SAP - Service Access Point**) và Giao diện Dịch vụ, giúp ẩn giấu chi tiết triển khai bên dưới.
</details>

### Câu Hỏi 3: Chức năng chính của Tầng 1 (Physical Layer) là gì và tầng này có phân tích nội dung dữ liệu không?

<details>
<summary>Đáp án</summary>

- **Chức năng chính**: Truyền tải các luồng bit nhị phân thô (`0` và `1`) hoặc các ký hiệu (**symbols**) qua môi trường truyền dẫn vật lý.
- **Đặc tính kỹ thuật định nghĩa**: Các yếu tố cơ điện như điện áp, bước sóng photon quang, tần số sóng vô tuyến (RF), cấu trúc đầu nối cáp (RJ45, SFP), tốc độ xung clock và chuẩn truyền dẫn (cáp đồng xoắn đôi, cáp quang, sóng radio).
- **Xử lý nội dung**: **Không**. Tầng 1 không phân tích hay quan tâm đến ý nghĩa nội dung của dữ liệu mà chỉ nhìn thấy các tín hiệu biến thiên cơ điện.
</details>

### Câu Hỏi 4: Tầng 2 (Data Link Layer) đảm nhận 3 chức năng kỹ thuật cốt lõi nào?

<details>
<summary>Đáp án</summary>

1. **Đóng khung (Framing)**: Gom nhóm chuỗi bit từ tầng vật lý thành các khung dữ liệu hoàn chỉnh (**Frame**), phân định rõ ranh giới bắt đầu và kết thúc khung.
2. **Định địa chỉ vật lý (Physical Addressing)**: Gán địa chỉ phần cứng (**địa chỉ MAC 48-bit**) của nút gửi (Source MAC) và nút nhận kề cận (Destination MAC) trên cùng một môi trường mạng chia sẻ.
3. **Kiểm soát lỗi liên kết (Error Detection & Correction)**: Tính toán mã kiểm tra dư thừa chu kỳ (**CRC - Cyclic Redundancy Check**) và đính kèm vào trường kiểm tra khung (**FCS - Frame Check Sequence**) ở cuối khung để phát hiện các bit bị biến dạng trên đường truyền.
</details>

### Câu Hỏi 5: Tầng 3 (Network Layer) giải quyết hai bài toán cốt lõi nào trong truyền thông liên mạng?

<details>
<summary>Đáp án</summary>

1. **Định địa chỉ logic (Logical Addressing)**: Cung cấp sơ đồ địa chỉ logic toàn cầu (**IP Address**: IPv4/IPv6) độc lập với vị trí phần cứng, cho phép định danh duy nhất mọi nút mạng trên quy mô liên mạng toàn cầu.
2. **Định tuyến và chuyển tiếp (Routing & Relay)**: Xác định đường đi tối ưu cho gói tin (**Packet / Datagram**) qua nhiều trạm trung chuyển (hop) và mạng trung gian để đến được đích cuối cùng.
- Các thiết bị và giao thức tiêu biểu ở tầng này gồm **Router**, **Layer 3 Switch**, **IPv4**, **IPv6**, **ICMP**, **OSPF**, **BGP**.
</details>

### Câu Hỏi 6: Tầng 4 (Transport Layer) thực hiện những vai trò gì và hai giao thức TCP, UDP ở tầng này khác nhau cơ bản như thế nào?

<details>
<summary>Đáp án</summary>

- **Vai trò của Tầng 4**:
  - Cung cấp truyền thông đầu cuối tới đầu cuối (**End-to-End**) thực sự giữa hai tiến trình ứng dụng trên hai máy chủ độc lập.
  - **Định danh tiến trình qua Cổng (Port Multiplexing)**: Dùng số hiệu cổng (**Port Numbers**) để phân biệt dữ liệu thuộc về tiến trình ứng dụng nào trên hệ điều hành.
  - Cung cấp cơ chế kiểm soát độ tin cậy và điều khiển luồng tùy theo giao thức.
- **So sánh TCP và UDP**:
  - **TCP**: Hướng kết nối, tin cậy, có xác nhận bắt tay, truyền lại gói tin mất và kiểm soát tốc độ gửi để không làm tràn bộ đệm máy nhận.
  - **UDP**: Phi kết nối, truyền tải nhanh, không cam kết độ tin cậy.
</details>

### Câu Hỏi 7: Tầng 5 (Session Layer) có nhiệm vụ gì và cơ chế Synchronization Checkpoints hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **Nhiệm vụ chính**: Thiết lập, quản lý, điều phối và giải phóng các phiên đối thoại (**dialogue**) giữa hai tiến trình ứng dụng, bao gồm quản lý chế độ hội thoại song công toàn phần (**Full-Duplex**) hoặc bán song công (**Half-Duplex**).
- **Cơ chế Synchronization Checkpoints**: Đánh dấu các mốc dữ liệu đã truyền thành công. Nếu đường truyền gặp sự cố giữa chừng, hai bên chỉ cần khôi phục và truyền lại từ checkpoint gần nhất thay vì phải truyền lại toàn bộ từ đầu.
</details>

### Câu Hỏi 8: Tầng 6 (Presentation Layer) chịu trách nhiệm về những khía cạnh nào của dữ liệu?

<details>
<summary>Đáp án</summary>

Tầng 6 chịu trách nhiệm về mặt cú pháp và biểu diễn thông tin trao đổi giữa các hệ thống, bao gồm 3 chức năng chính:
1. **Chuyển đổi cú pháp và mã hóa ký tự (Character Encoding)**: Chuyển đổi qua lại giữa các bảng mã ký tự khác nhau như ASCII, UTF-8, EBCDIC.
2. **Nén dữ liệu (Data Compression)**: Giảm kích thước dữ liệu để tối ưu băng thông truyền dẫn.
3. **Mật mã hóa và giải mã (Data Encryption & Decryption)**: Bảo vệ tính bí mật của dữ liệu (ví dụ các thành phần mật mã của TLS/SSL).
</details>

### Câu Hỏi 9: Tầng 7 (Application Layer) đóng vai trò gì trong mô hình OSI và các giao thức tiêu biểu ở tầng này là gì?

<details>
<summary>Đáp án</summary>

- **Vai trò**: Là tầng cao nhất trong mô hình OSI, tiếp xúc trực tiếp với các tiến trình ứng dụng phần mềm mà người dùng tương tác và là phương tiện để tiến trình ứng dụng truy cập vào môi trường OSI.
- **Giao thức / dịch vụ tiêu biểu**: Duyệt web (**HTTP**), phân giải tên miền (**DNS**), quản trị từ xa an toàn (**SSH**), gửi nhận thư điện tử (**SMTP**) và đồng bộ thời gian (**NTP**).
</details>

### Câu Hỏi 10: Tên đơn vị dữ liệu giao thức (PDU) chuẩn ở từng tầng OSI là gì và luồng đóng gói dữ liệu thực tế diễn ra theo chiều nào?

<details>
<summary>Đáp án</summary>

- **Tên PDU chuẩn theo tầng (RFC 1122 & ITU-T Rec. X.200)**:
  - **Tầng 7, 6, 5 (Application / Presentation / Session)**: **Application Data / Payload**
  - **Tầng 4 (Transport)**: **Segment** (TCP) / **Datagram** (UDP)
  - **Tầng 3 (Network)**: **Packet** (IP Datagram)
  - **Tầng 2 (Data Link)**: **Frame**
  - **Tầng 1 (Physical)**: **Bits / Symbols**
- **Luồng đi thực tế của dữ liệu**: Tại máy gửi (Host A), dữ liệu đi xuôi từ **Tầng 7 xuống Tầng 1** (mỗi tầng bổ sung header/trailer tương ứng), truyền qua cáp/môi trường vật lý dưới dạng Bits/Symbols, rồi đi ngược từ **Tầng 1 lên Tầng 7** tại máy nhận (Host B) để bóc tách dần các phần đầu và giao Payload nguyên bản cho ứng dụng.
</details>

### Câu Hỏi 11: Theo chuẩn IANA (RFC 6335), không gian cổng 16-bit (0–65535) được chia thành 3 phân vùng nào và đặc điểm của từng vùng là gì?

<details>
<summary>Đáp án</summary>

1. **System Ports (Well-Known Ports)** — `0` đến `1023`: Do IANA chỉ định cho các dịch vụ mạng chuẩn hóa nền tảng toàn cầu; yêu cầu quyền quản trị viên (`root`/`administrator`) để mở socket lắng nghe. Ví dụ: SSH (`22`), SMTP (`25`), DNS (`53`), HTTP (`80`), NTP (`123`), HTTPS (`443`).
2. **User Ports (Registered Ports)** — `1024` đến `49151`: IANA đăng ký cho các ứng dụng/dịch vụ phổ biến của bên thứ ba (cơ sở dữ liệu, message queue, web proxy) nhằm tránh xung đột; tiến trình người dùng thông thường có thể bind.
3. **Dynamic Ports (Ephemeral Ports)** — `49152` đến `65535`: Cổng động tạm thời do hệ điều hành tự động cấp phát cho các kết nối outbound từ client khi mở phiên socket.
</details>

### Câu Hỏi 12: Khi dùng lệnh `sudo ss -tulpn` trên Linux để kiểm tra socket mạng, các tùy chọn `-t`, `-u`, `-l`, `-p`, `-n` và hai trạng thái `LISTEN` / `UNCONN` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **Ý nghĩa các tùy chọn (flags)**:
  - `-t` (`--tcp`): Hiển thị các socket TCP.
  - `-u` (`--udp`): Hiển thị các socket UDP.
  - `-l` (`--listening`): Chỉ hiển thị các socket đang ở trạng thái lắng nghe kết nối.
  - `-p` (`--processes`): Hiển thị tên tiến trình và PID đang sở hữu socket (ánh xạ L4 sang L7).
  - `-n` (`--numeric`): Hiển thị trực tiếp địa chỉ IP và Port dạng số, không phân giải tên miền/tên dịch vụ.
- **Ý nghĩa trạng thái**:
  - `LISTEN`: Socket TCP đang sẵn sàng tiếp nhận bắt tay 3 bước từ client.
  - `UNCONN`: Socket UDP phi kết nối (Unconnected) đang đợi datagram gửi tới.
</details>

### Câu Hỏi 13: Sự khác biệt quan trọng giữa mô hình OSI 7 tầng và bộ giao thức TCP/IP triển khai trong thực tế là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất**: Mô hình OSI 7 tầng là **mô hình tham chiếu lý thuyết** dùng để tư duy kiến trúc và phân tách trách nhiệm, còn **TCP/IP** (thường chia thành 4 hoặc 5 tầng) mới là bộ giao thức thực tế được cài đặt trong nhân hệ điều hành (Linux/Windows) và Internet.
- **Cách xử lý 3 tầng trên cùng**: Trong thực tế, Tầng 5 (Session), Tầng 6 (Presentation) và Tầng 7 (Application) không tách thành 3 tầng riêng biệt trong nhân hệ điều hành mà được tích hợp vào chính tiến trình ứng dụng không gian người dùng (**User-space Application**). Ví dụ, mã hóa TLS hay nén HTTP gzip do thư viện ứng dụng (như OpenSSL, Zlib) xử lý chứ không có "Tầng Presentation" độc lập trong OS.
</details>

### Câu Hỏi 14: Phương pháp cô lập sự cố mạng từ dưới lên (Bottom-Up Troubleshooting) dựa trên mô hình OSI được thực hiện theo thứ tự kiểm tra nào?

<details>
<summary>Đáp án</summary>

Kỹ sư hệ thống kiểm tra tuần tự từ tầng thấp lên tầng cao để khoanh vùng sự cố thay vì đoán mò:
1. **Tầng 1 (Physical)**: Kiểm tra đèn cổng mạng trên card mạng/switch có sáng không, cáp có bị lỏng, đứt hay gập khúc không.
2. **Tầng 2 (Data Link)**: Kiểm tra giao diện mạng có ở trạng thái `UP` không, bảng MAC trên switch có học được địa chỉ card mạng không, cấu hình VLAN trên switch port có đúng không.
3. **Tầng 3 (Network)**: Kiểm tra địa chỉ IP và Subnet Mask, khả năng ping tới Default Gateway cục bộ và bảng định tuyến (`ip route`).
4. **Tầng 4 (Transport)**: Kiểm tra tiến trình đích có đang mở socket `LISTEN` trên cổng dịch vụ hay không (qua `ss -tulpn`), và firewall (`iptables`/`nftables`) hoặc Security Group có chặn cổng không.
5. **Tầng 7 (Application)**: Kiểm tra lỗi ở tầng ứng dụng như mã lỗi HTTP 500, cấu hình DNS resolver, hoặc chứng chỉ TLS hết hạn.
</details>

### Câu Hỏi 15: Cạm bẫy cạn kiệt cổng động (Ephemeral Port Exhaustion) là gì, gây ra lỗi nào và nên xử lý ra sao trong môi trường sản xuất?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Khi máy chủ (ví dụ Reverse Proxy hoặc microservice) tạo hàng chục nghìn kết nối outbound trong thời gian ngắn, hệ điều hành cấp phát cổng từ dải **Dynamic Ports (49152–65535)** (khoảng 16.384 cổng khả dụng). Khi các socket này đóng lại và nằm ở trạng thái `TIME_WAIT`, dải cổng động nhanh chóng bị chiếm dụng hết.
- **Hậu quả**: Ứng dụng gặp lỗi `Cannot assign requested address` (hoặc `EADDRNOTAVAIL`), toàn bộ kết nối mạng mới bị từ chối dù CPU và RAM máy chủ vẫn còn dư nhiều tài nguyên.
- **Thực tiễn khắc phục**: Kích hoạt tái sử dụng socket (`SO_REUSEADDR`), dùng kết nối bền bỉ (**HTTP Keep-Alive / Connection Pooling**), hoặc mở rộng dải cổng cấp phát cục bộ qua `sysctl` trên Linux.
</details>
