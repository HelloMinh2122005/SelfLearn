# Review: 2_5_2 User Datagram Protocol

### Câu Hỏi 1: Trong mô hình mạng phân tầng, tầng truyền vận (Transport Layer - L4) đảm nhận vai trò gì và giao thức UDP (RFC 768) đại diện cho triết lý thiết kế nào?

<details>
<summary>Đáp án</summary>

Tầng truyền vận (Transport Layer - L4) đảm nhận vai trò cung cấp kênh giao tiếp tiến trình - tới - tiến trình (process-to-process communication) giữa các ứng dụng chạy trên các máy trạm khác nhau.

Giao thức **User Datagram Protocol (UDP)**, được chuẩn hóa trong **RFC 768** (1980), đại diện cho triết lý thiết kế **tối giản tuyệt đối (minimalism)**: cung cấp thủ tục để chương trình ứng dụng gửi thông điệp tới chương trình khác với cơ chế giao thức tối thiểu, hướng giao dịch (transaction oriented) và không bảo đảm độ tin cậy hay chống trùng lặp.

</details>

### Câu Hỏi 2: Tính chất phi kết nối (Connectionless) và phi trạng thái (Stateless) của UDP thể hiện như thế nào trước và trong khi gửi dữ liệu?

<details>
<summary>Đáp án</summary>

- **Không có thủ tục bắt tay (Zero handshake overhead)**: Trước khi gửi dữ liệu, bên gửi hoàn toàn không thực hiện bất kỳ bước bắt tay thiết lập phiên nào (khác với 3-Way Handshake của TCP).
- **Không lưu trữ trạng thái kết nối**: Hệ điều hành và nhân mạng (kernel) không cần cấp phát hay duy trì các khối điều khiển kết nối (Transmission Control Block - TCB), và không phải lưu trạng thái máy hữu hạn (state machine) như `SYN_SENT`, `ESTABLISHED` hay `TIME_WAIT`.

</details>

### Câu Hỏi 3: Vì sao nói UDP không bảo đảm độ tin cậy (Unreliable) và không kiểm soát luồng/tắc nghẽn (No Flow / Congestion Control)?

<details>
<summary>Đáp án</summary>

- **Không bảo đảm độ tin cậy**:
  - Không có cơ chế xác nhận đã nhận gói tin (no ACKs).
  - Không có cơ chế phát hiện mất gói tin và tự động truyền lại (no retransmission).
  - Không đánh số thứ tự tuần tự để sắp xếp lại các gói tin đến lệch thứ tự (no packet reordering).
- **Không kiểm soát luồng và không kiểm soát tắc nghẽn**:
  - UDP không theo dõi kích thước cửa sổ nhận của trạm đích (no flow control window) và không ước lượng trạng thái nghẽn của đường truyền (no congestion window / slow start).
  - Ứng dụng đẩy dữ liệu vào socket với tốc độ bao nhiêu, kernel sẽ lập tức đóng gói và chuyển xuống tầng mạng (IP) bấy nhiêu mà không điều tiết tốc độ phát.

</details>

### Câu Hỏi 4: Theo RFC 768, UDP phù hợp với những bài toán và ứng dụng ban đầu điển hình nào?

<details>
<summary>Đáp án</summary>

UDP phù hợp với các giao dịch yêu cầu/đáp ứng có chi phí phụ thấp (Low-Overhead Transactions), nơi việc thiết lập và giải phóng kết nối (như ở TCP) tiêu tốn nhiều gói tin hơn chính bản tin trao đổi thực tế.

RFC 768 chỉ rõ hai ứng dụng ban đầu điển hình là dịch vụ phân giải tên miền Internet (**Internet Name Server / DNS**) và giao thức truyền tệp đơn giản (**Trivial File Transfer Protocol / TFTP**). Ngoài ra trong thực tế, UDP còn được dùng cho DHCP, NTP, truyền dẫn media thời gian thực chấp nhận mất gói (VoIP, video streaming) và làm nền tảng cho QUIC.

</details>

### Câu Hỏi 5: Điểm khác biệt kiến trúc giữa bản chất hướng thông điệp (Message-Oriented) của UDP và hướng luồng byte (Stream-Oriented) của TCP là gì?

<details>
<summary>Đáp án</summary>

- **Ranh giới dữ liệu (Boundaries)**: UDP bảo toàn nguyên vẹn ranh giới từng datagram, trong khi TCP coi dữ liệu là một luồng byte liên tục không có ranh giới bản tin.
- **Thao tác đọc/ghi (I/O)**: Với UDP, 1 lệnh gửi (`sendto`) tạo ra đúng 1 datagram và bên nhận đọc bằng 1 lệnh nhận (`recvfrom`) lấy về nguyên vẹn khối dữ liệu đó (ví dụ gửi 500 bytes sẽ nhận đúng 500 bytes). Với TCP, dữ liệu từ 1 lệnh gửi có thể bị ghép lại (coalesced) hoặc phân mảnh thành nhiều lần nhận.
- **Trách nhiệm định khung (Framing)**: UDP tự đảm nhiệm định khung thông qua trường `Length` trong tiêu đề, còn với TCP tầng ứng dụng phải tự định nghĩa ký tự phân cách (delimiters) hoặc tiền tố độ dài.

</details>

### Câu Hỏi 6: Tiêu đề (Header) của UDP có kích thước bao nhiêu bytes và gồm những trường nào?

<details>
<summary>Đáp án</summary>

Tiêu đề UDP có kích thước cố định chính xác **8 bytes (64 bits)**, hoàn toàn không hỗ trợ các trường mở rộng (options). Tiêu đề gồm đúng **4 trường**, mỗi trường dài **16 bits (2 bytes)**:

1. **Source Port (16 bits)**: Cổng nguồn của tiến trình gửi gói tin.
2. **Destination Port (16 bits)**: Cổng đích trên trạm nhận để định tuyến gói tin tới đúng tiến trình socket đích trong phạm vi địa chỉ IP đích.
3. **Length (16 bits)**: Độ dài tính bằng octet (bytes) của toàn bộ user datagram (bao gồm cả tiêu đề 8 bytes và phần dữ liệu tải trọng).
4. **Checksum (16 bits)**: Mã kiểm tra lỗi tính theo thuật toán bù 1 của tổng bù 1 16-bit trên pseudo-header IP, tiêu đề UDP và phần tải trọng dữ liệu.

</details>

### Câu Hỏi 7: Trong tiêu đề UDP theo RFC 768, vì sao giá trị nhỏ nhất hợp lệ của trường `Length` là 8, và trường `Source Port` được xử lý như thế nào nếu không sử dụng?

<details>
<summary>Đáp án</summary>

- **Giá trị nhỏ nhất của `Length` là 8**: Vì trường `Length` tính tổng độ dài của cả tiêu đề UDP và dữ liệu payload (`Length = Header_Size + Data_Size`). Do tiêu đề UDP cố định là 8 octets, khi datagram không mang dữ liệu (`Data_Size = 0`), độ dài toàn bộ datagram đúng bằng 8 octets.
- **Trường `Source Port`**: Theo RFC 768, đây là trường tùy chọn (optional); khi có ý nghĩa, nó chỉ ra cổng gửi để bên nhận dùng làm địa chỉ phản hồi nếu không có thông tin nào khác. Nếu không được sử dụng, giá trị **0** sẽ được chèn vào trường này.

</details>

### Câu Hỏi 8: Trường `Checksum` trong UDP được tính trên những thành phần nào và có sự khác biệt gì giữa IPv4 (RFC 768) và IPv6 (RFC 8200)?

<details>
<summary>Đáp án</summary>

- **Thành phần tính Checksum**: Được tính bằng bù 1 của tổng bù 1 16-bit trên **pseudo-header IP** (chứa IP nguồn, IP đích, mã giao thức và độ dài UDP), **tiêu đề UDP** và **phần tải trọng dữ liệu (data payload)**.
- **Trên IPv4 (RFC 768)**: Checksum là **tùy chọn (optional)**. Nếu bên gửi không tính checksum, nó gán toàn bit 0 (`0x0000`) và bên nhận sẽ bỏ qua kiểm tra. Nếu kết quả tính checksum thực tế bằng 0, giá trị được phát đi dưới dạng toàn bit 1 (`0xFFFF`) để tránh nhầm với trạng thái tắt checksum.
- **Trên IPv6 (RFC 8200 Section 8.1)**: Checksum UDP là **bắt buộc (mandatory)**; bên gửi không được phép truyền giá trị `0x0000`.

</details>

### Câu Hỏi 9: Vì sao trên IPv6 trường Checksum của UDP là bắt buộc, và node nhận IPv6 phải xử lý ra sao nếu nhận được gói tin UDP có Checksum bằng 0?

<details>
<summary>Đáp án</summary>

- **Lý do kỹ thuật**: Để tối ưu hóa tốc độ chuyển tiếp gói tin của các router trên đường trục, tiêu đề IPv6 đã loại bỏ hoàn toàn trường Header Checksum ở tầng 3 (Network Layer). Vì vậy tầng truyền vận (L4) buộc phải tự đảm nhận trách nhiệm phát hiện lỗi truyền dẫn để bảo vệ dữ liệu và định tuyến cổng.
- **Hành vi của Receiver IPv6**: Theo RFC 8200 mục 8.1, mọi node IPv6 khi nhận được gói tin UDP mang giá trị checksum bằng 0 (`0x0000`) **bắt buộc phải hủy bỏ gói tin đó (must discard)** và nên ghi nhật ký cảnh báo lỗi (should log the error).

</details>

### Câu Hỏi 10: Hiện tượng "hóa đá thiết bị trung gian" (Ossified Middleboxes) là gì, và tại sao giao thức QUIC (RFC 9000) lại chọn đóng gói trên nền UDP datagrams?

<details>
<summary>Đáp án</summary>

- **Ossified Middleboxes**: Trên mạng Internet công cộng, rất nhiều thiết bị trung gian (firewalls, NAT gateways, load balancers, IDS/IPS) chỉ nhận diện và cho phép hai mã giao thức L4 truyền thống là **TCP (protocol 6)** và **UDP (protocol 17)**. Nếu tạo một giao thức L4 mới chạy trực tiếp trên IP, các middlebox này sẽ loại bỏ gói tin lạ, khiến việc triển khai trên Internet trở nên bất khả thi.
- **Lý do QUIC chọn UDP**: Bằng cách đóng gói gói tin QUIC bên trong các UDP datagrams tiêu chuẩn (với tiêu đề 8 bytes nhẹ gọn), QUIC dễ dàng đi qua các hệ thống NAT và Firewall sẵn có trên toàn cầu. Đồng thời, toàn bộ cơ chế bảo mật (TLS 1.3), đa luồng không bị chặn đầu hàng đợi (no head-of-line blocking), kiểm soát tắc nghẽn và khôi phục gói tin được triển khai trong không gian người dùng (user-space) để dễ dàng nâng cấp.

</details>

### Câu Hỏi 11: Ví dụ đời sống "Gửi Bưu Thiếp (Postcard Service)" minh họa những đặc điểm nào của UDP?

<details>
<summary>Đáp án</summary>

Ví dụ gửi bưu thiếp minh họa trực quan 5 đặc điểm cốt lõi của UDP (so với cuộc gọi điện thoại có hẹn trước của TCP):
1. **Không cần hẹn trước (Zero Handshake)**: Viết địa chỉ và thả ngay vào hòm thư mà không cần hỏi trước xem người nhận có sẵn sàng không.
2. **Không có giấy báo phát (No ACK)**: Bưu điện chỉ cố gắng chuyển đi (Best-effort), không có chữ ký xác nhận hoàn trả.
3. **Mất là mất hẳn (No Retransmission)**: Nếu xe thư làm rơi bưu thiếp, bưu điện không tự gửi bù và người gửi không tự biết.
4. **Đến lệch thứ tự (Unordered Delivery)**: Bưu thiếp gửi sau có thể đi tuyến khác và đến trước bưu thiếp gửi trước.
5. **Độc lập và nguyên vẹn (Datagram Boundaries)**: Mỗi tấm bưu thiếp là một thông điệp độc lập, bưu điện không cắt ghép hai tấm bưu thiếp thành một tờ thư dài.

</details>

### Câu Hỏi 12: Khi chạy lệnh `ss -uan` trên Linux, các cờ `-u`, `-a`, `-n` có ý nghĩa gì, và các cột `State: UNCONN`, `Recv-Q`, `Send-Q`, `Peer Address:Port` cho biết thông tin gì?

<details>
<summary>Đáp án</summary>

- **Ý nghĩa các cờ của `ss -uan`**:
  - `-u` (`--udp`): Chỉ hiển thị các socket thuộc giao thức UDP.
  - `-a` (`--all`): Hiển thị tất cả các socket (cả socket đang mở nhận dữ liệu và socket gửi).
  - `-n` (`--numeric`): Hiển thị địa chỉ IP và cổng dưới dạng số nguyên, tránh phân giải DNS ngược làm chậm lệnh.
- **Ý nghĩa các trường đầu ra**:
  - `State: UNCONN`: Viết tắt của *Unconnected*; do UDP phi kết nối nên hầu hết socket UDP trong kernel luôn ở trạng thái `UNCONN`.
  - `Recv-Q`: Số bytes dữ liệu đã vào bộ đệm nhận của socket nhưng ứng dụng chưa kịp đọc qua `recv()`/`recvfrom()`.
  - `Send-Q`: Số bytes dữ liệu đang nằm trong bộ đệm gửi của kernel chờ đẩy ra card mạng.
  - `Peer Address:Port`: Giá trị `0.0.0.0:*` (hoặc `[::]:*`) đối với socket chưa kết nối cho biết socket sẵn sàng tiếp nhận datagram từ bất kỳ địa chỉ nguồn nào.

</details>

### Câu Hỏi 13: Khi thăm dò cổng UDP bằng lệnh `nc -u -z -v <host> <port>`, kết quả `Connected` hoặc `UDP packet sent successfully` có đảm bảo dịch vụ phía sau đang hoạt động không? Vì sao?

<details>
<summary>Đáp án</summary>

**Không đảm bảo 100%**.

Trong lệnh `nc -u -z -v`, cờ `-u` chọn chế độ UDP, `-z` bật Zero-I/O mode (chỉ gửi gói thăm dò rồi đóng), và `-v` hiển thị chi tiết. Kết quả `Connected` hoặc `UDP packet sent successfully` chỉ phản ánh rằng kernel đã đẩy thành công gói UDP ra giao diện mạng cục bộ mà **không nhận lại gói tin báo lỗi ICMP Port Unreachable (Type 3, Code 3)**. Do cổng UDP mở thường giữ im lặng nếu gói thăm dò không đúng định dạng ứng dụng (và không có bắt tay SYN-ACK như TCP), kết quả này không chứng minh chắc chắn ứng dụng phía sau đang hoạt động bình thường.

</details>

### Câu Hỏi 14: Trong đầu ra khi bắt gói tin bằng `tcpdump`, thông tin `proto UDP (17)` và cảnh báo `bad udp cksum` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- `proto UDP (17)`: Cho biết mã định danh số hiệu giao thức tầng truyền vận UDP trong tiêu đề IP (L3) là **17**.
- `bad udp cksum`: Là hiện tượng phổ biến trên card mạng hiện đại khi bật tính năng **UDP Checksum Offloading**. Kernel giao việc tính toán checksum cho phần cứng card mạng (NIC) trước khi phát lên đường truyền, nên khi `tcpdump` bắt gói ở tầng kernel sẽ thấy giá trị checksum chưa được hoàn tất.

</details>

### Câu Hỏi 15: Tràn hàng đợi bộ đệm nhận (Socket Receive Buffer Overflow) ở UDP xảy ra khi nào, gây hậu quả gì và cách khắc phục, giám sát ra sao?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Vì UDP không có kiểm soát luồng (flow control), bên gửi có thể phát lượng lớn gói tin vượt quá tốc độ xử lý của ứng dụng nhận (bị nghẽn CPU hoặc I/O đĩa, không gọi `recvfrom()` kịp), làm hàng đợi `sk_rcvbuf` của socket đầy 100%.
- **Hậu quả**: Linux kernel sẽ **lặng lẽ hủy bỏ (drop)** tất cả các gói tin UDP đến tiếp theo mà không gửi lại bất kỳ thông báo lỗi nào cho bên gửi.
- **Khắc phục & Giám sát**:
  - Tăng kích thước bộ đệm nhận tối đa và mặc định của hệ thống qua `sysctl` (`net.core.rmem_max` và `net.core.rmem_default`).
  - Giám sát chỉ số rớt gói UDP bằng `netstat -s -u | grep "receive errors"` hoặc `nstat -az UdpRcvbufErrors`.

</details>

### Câu Hỏi 16: Tấn công khuếch đại phân tán (UDP Amplification & Reflection DDoS Attacks) lợi dụng những đặc điểm nào của UDP và cần phòng vệ bằng cách nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế lợi dụng**: Do UDP phi kết nối và không có bước bắt tay xác minh địa chỉ thực của bên gửi, kẻ tấn công dễ dàng giả mạo địa chỉ IP nguồn (IP Spoofing) thành IP của nạn nhân rồi gửi truy vấn nhỏ tới các dịch vụ UDP công cộng (như DNS `ANY` query, NTP `monlist`, SNMP). Máy chủ dịch vụ sẽ phản hồi gói tin có dung lượng lớn gấp hàng chục đến hàng trăm lần trực tiếp về IP nạn nhân, gây nghẽn băng thông.
- **Thực tiễn bảo vệ**:
  - Không mở các dịch vụ UDP công cộng (open resolvers, open NTP) ra Internet nếu không có giới hạn tần suất phản hồi (**Response Rate Limiting - RRL**).
  - Triển khai bộ lọc **BCP 38 / Reverse Path Forwarding (uRPF)** tại các router biên để ngăn chặn lưu lượng mang IP nguồn giả mạo rời khỏi hạ tầng mạng nội bộ.

</details>

### Câu Hỏi 17: Vì sao việc gửi UDP datagram có kích thước lớn hơn MTU đường truyền dễ dẫn đến mất toàn bộ dữ liệu, và kích thước payload an toàn được khuyến nghị là bao nhiêu?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân và hậu quả**: Khác với TCP có cơ chế thỏa thuận MSS trong bắt tay 3 bước, UDP không đàm phán kích thước gói tin theo Path MTU (thiếu hụt Path MTU Discovery ở tầng truyền vận). Nếu UDP datagram lớn hơn MTU (ví dụ 4096 bytes trên Ethernet MTU 1500 bytes), tầng IP buộc phải chia nhỏ thành nhiều phân mảnh IP (IP fragments). Chỉ cần **một phân mảnh** bị thất lạc trên đường truyền, bên nhận sẽ không thể tái cấu trúc và phải hủy bỏ toàn bộ datagram.
- **Thực tiễn sản xuất**: Giữ kích thước payload của UDP datagram nhỏ hơn Path MTU an toàn để tránh phân mảnh IP—thường duy trì dưới **1280 bytes** (MTU tối thiểu bắt buộc của IPv6) hoặc **512 bytes** đối với DNS truyền thống theo RFC 1035.

</details>
