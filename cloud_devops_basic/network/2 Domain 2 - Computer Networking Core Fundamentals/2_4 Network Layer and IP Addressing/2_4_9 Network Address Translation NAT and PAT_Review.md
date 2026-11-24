# Review: 2_4_9 Network Address Translation NAT and PAT

### Câu Hỏi 1: NAT và NAPT/PAT ra đời nhằm giải quyết bài toán cốt lõi nào của mạng Internet?

<details>
<summary>Đáp án</summary>

NAT (Network Address Translation) và NAPT (Network Address Port Translation) được IETF chuẩn hóa (RFC 3022, cập nhật trong RFC 4787) nhằm giải quyết nguy cơ **cạn kiệt không gian địa chỉ IPv4 toàn cầu**. Cơ chế này cho phép hàng triệu thiết bị sử dụng địa chỉ riêng tư trong mạng nội bộ (**Private Networks - RFC 1918**) có thể chia sẻ chung một số lượng rất nhỏ địa chỉ **IPv4 công cộng (Public IP)** để giao tiếp ra Internet.
</details>

---

### Câu Hỏi 2: Phân biệt ba biến thể chính của NAT: Static NAT, Dynamic NAT và NAPT/PAT?

<details>
<summary>Đáp án</summary>

Theo RFC 3022 Section 2, ba biến thể khác nhau ở tỷ lệ ánh xạ và việc có dịch số cổng (Port) hay không:
- **Static NAT (Ánh xạ 1:1)**: Gán cố định một Private IP với một Public IP duy nhất, **không thay đổi số cổng (Port)**. Thường dùng để công khai máy chủ nội bộ cố định (Web Server, Mail Server) ra Internet.
- **Dynamic NAT (Ánh xạ M:N)**: Sử dụng một dải (Pool) gồm nhiều Public IP để cấp phát động tạm thời cho các máy nội bộ khi cần ra Internet. Hạn chế là nếu Pool có $N$ Public IP thì tại một thời điểm chỉ có tối đa $N$ máy nội bộ truy cập Internet đồng thời.
- **NAPT / PAT (Ánh xạ M:1)**: Cho phép hàng nghìn máy nội bộ dùng chung **một Public IP duy nhất** bằng cách biên dịch cả **địa chỉ IP ở Layer 3** lẫn **số hiệu cổng (Port Number) ở Layer 4 (TCP/UDP)**. Đây là mô hình phổ biến nhất trên router gia đình và Cloud NAT Gateway (AWS/Azure).
</details>

---

### Câu Hỏi 3: Khi hai máy nội bộ khác nhau tình cờ chọn cùng một cổng nguồn (ví dụ đều là `50123`) để truy cập cùng một Web Server qua một router PAT, router phân biệt hai luồng dữ liệu như thế nào?

<details>
<summary>Đáp án</summary>

Router PAT phân tách hai luồng bằng cách **gán hai cổng dịch công cộng (NAT Port) khác nhau** trên cùng Public IP của router và lưu vào bảng dịch phiên (Translation Table):
- Ví dụ: Host A (`192.168.1.10:50123`) được ánh xạ thành `203.0.113.1:10001`.
- Host B (`192.168.1.20:50123`) được ánh xạ thành `203.0.113.1:10002`.

Khi gói tin phản hồi từ Web Server quay về `203.0.113.1` với cổng đích là `10001` hay `10002`, router tra bảng dịch để trả về đúng máy nguồn ban đầu.
</details>

---

### Câu Hỏi 4: Trình bày 3 giai đoạn trong vòng đời của một bản ghi ánh xạ địa chỉ (Address Binding Lifecycle) theo RFC 3022?

<details>
<summary>Đáp án</summary>

1. **Khởi tạo liên kết (Address Binding Instantiation)**: Bản ghi không tồn tại sẵn mà chỉ được tạo ngay khi có phiên kết nối đầu tiên xuất phát từ bên trong ra ngoài (**Outbound Session**). Router ghi nhận bộ tứ thông tin: `[Private IP : Private Port <-> Public IP : NAT Translated Port]`.
2. **Duy trì phiên (Session Maintenance)**: Router theo dõi lưu lượng hai chiều qua bảng Connection Tracking Table. Mỗi lần có gói tin thuộc phiên đi qua, bộ định thời **Session Timeout Timer** sẽ được làm mới.
3. **Hủy giải phóng liên kết (Binding Release & Teardown)**: Khi phiên kết thúc (ví dụ gặp cờ `FIN` hoặc `RST` trong TCP) hoặc hết thời gian chờ không có lưu lượng (**Idle Timeout** với UDP), router xóa bản ghi khỏi bảng dịch và giải phóng Translated Port về kho rảnh để tái sử dụng.
</details>

---

### Câu Hỏi 5: Phân biệt Source NAT (SNAT) và Destination NAT (DNAT) về bản chất chuyển dịch, chiều lưu lượng, mục đích và vị trí xử lý trong Linux Kernel?

<details>
<summary>Đáp án</summary>

| Tiêu chí | Source NAT (SNAT / Masquerade) | Destination NAT (DNAT / Port Forwarding) |
| :--- | :--- | :--- |
| **Bản chất chuyển dịch** | Viết lại **Source IP và Source Port** của gói tin. | Viết lại **Destination IP và Destination Port** của gói tin. |
| **Chiều lưu lượng** | **Outbound** (từ Private LAN đi ra Internet). | **Inbound** (từ Internet đi vào Private LAN). |
| **Mục đích** | Che giấu Private IP và cho phép máy nội bộ truy cập Internet. | Cho phép người dùng bên ngoài truy cập máy chủ dịch vụ đặt trong LAN. |
| **Vị trí trong Kernel (Netfilter)** | Chuỗi `POSTROUTING` (sau khi đã quyết định định tuyến). | Chuỗi `PREROUTING` (trước khi đưa vào bộ xử lý định tuyến). |
</details>

---

### Câu Hỏi 6: Mô tả sự thay đổi Header gói tin ở chiều đi (Outbound) và chiều về (Inbound) khi một máy khách LAN kết nối ra Web Server qua router PAT?

<details>
<summary>Đáp án</summary>

- **Chiều đi (Outbound - Source NAT)**:
  1. Máy khách gửi gói tin với `[Src: Private IP : Private Port -> Dst: Web Server IP : 80]`.
  2. Router PAT tạo bản ghi ánh xạ trong bảng NAT, rồi viết lại **Source IP** thành Public IP của router và **Source Port** thành NAT Port (ví dụ `10001`) trước khi chuyển tới Web Server.
- **Chiều về (Inbound - Reverse Translation)**:
  1. Web Server phản hồi về `[Src: Web Server IP : 80 -> Dst: Public IP : 10001]`.
  2. Router PAT tra cứu bảng NAT thấy cổng đích `10001` khớp với máy khách ban đầu, rồi viết lại **Destination IP** và **Destination Port** quay về đúng Private IP và Private Port gốc để giao cho máy khách.
</details>

---

### Câu Hỏi 7: Tại sao NAT lại làm phá vỡ Tính Toàn Vẹn Đầu Cuối (End-to-End IP Transparency) của Internet?

<details>
<summary>Đáp án</summary>

Kiến trúc ban đầu của Internet (End-to-End Principle) giả định mọi trạm đầu cuối đều nhận diện trực tiếp IP của nhau và kết nối bình đẳng hai chiều. Khi dùng NAT:
- Các máy trạm nội bộ dùng Private IP trở nên "vô hình" từ bên ngoài Internet.
- Nếu máy trong LAN chưa khởi tạo phiên đi ra trước và router không cấu hình sẵn Port Forwarding, máy tính bên ngoài Internet **không thể chủ động khởi tạo kết nối (Unsolicited Inbound Connection)** tới máy nội bộ vì router không biết ánh xạ gói tin đến địa chỉ LAN nào.
</details>

---

### Câu Hỏi 8: Vì sao các giao thức như FTP Active Mode hoặc SIP thường gặp lỗi khi đi qua NAT tiêu chuẩn, và Application Layer Gateway (ALG) khắc phục việc này như thế nào?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân lỗi**: Router NAT thông thường chỉ đọc và sửa IP/Port ở tiêu đề **Layer 3 và Layer 4**. Tuy nhiên, một số giao thức như **FTP Active Mode** (qua lệnh `PORT`) hoặc **SIP / H.323** lại nhúng trực tiếp IP Private (`192.168.x.x`) và Port của máy gửi vào bên trong phần dữ liệu tải trọng tầng ứng dụng (**Application Payload ở Layer 7**). Khi đi qua NAT, Header được đổi sang Public IP nhưng Payload vẫn giữ Private IP, khiến máy chủ bên ngoài đọc Payload và cố kết nối ngược lại Private IP nên thất bại hoàn toàn.
- **Cách ALG khắc phục**: Module **ALG** can thiệp sâu vào Payload tầng ứng dụng (L7 DPI) để viết lại chuỗi IP/Port thành Public IP/NAT Port, tính toán lại độ dài gói tin và điều chỉnh tương ứng các số thứ tự **TCP Sequence/ACK Numbers** (theo RFC 3022 Section 4.4).
</details>

---

### Câu Hỏi 9: Trong phần thực hành cấu hình NAT bằng `iptables` trên Linux, các bước kích hoạt IP forwarding, cấu hình SNAT (Masquerade) và cấu hình DNAT (Port Forwarding) thực hiện như thế nào?

<details>
<summary>Đáp án</summary>

1. **Bật chuyển tiếp gói tin IP trong Linux Kernel**:
   ```bash
   sudo sysctl -w net.ipv4.ip_forward=1
   ```
2. **Cấu hình Outbound SNAT (Masquerade)** cho mạng LAN `192.168.1.0/24` đi ra card mạng WAN `eth0` tại chuỗi `POSTROUTING`:
   ```bash
   sudo iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE
   ```
3. **Cấu hình Port Forwarding (DNAT)** chuyển lưu lượng TCP cổng `80` từ `eth0` vào máy chủ nội bộ `192.168.1.100:80` tại chuỗi `PREROUTING`:
   ```bash
   sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j DNAT --to-destination 192.168.1.100:80
   ```
</details>

---

### Câu Hỏi 10: Khi giám sát bảng phiên bằng lệnh `sudo conntrack -L -p tcp`, hai hướng `[ORIGINAL]`, `[REPLY]` và hai cờ `[ASSURED]`, `[UNREPLIED]` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **Cặp thông tin `[ORIGINAL]` và `[REPLY]`**:
  - `[ORIGINAL]` (cụm `src`/`dst`/`sport`/`dport` đầu tiên): Thể hiện hướng truyền ban đầu từ client trong LAN tới server.
  - `[REPLY]` (cụm thứ hai): Thể hiện hướng truyền phản hồi dự kiến từ server về Public IP và NAT Port để kernel đảo ngược lại cho client gốc.
- **Hai cờ trạng thái**:
  - **`[UNREPLIED]`**: Phiên mới chỉ có gói tin gửi đi một chiều (`[ORIGINAL]`, ví dụ gói `SYN`), chưa nhận được gói phản hồi (`[REPLY]`) nào quay về.
  - **`[ASSURED]`**: Kết nối TCP đã hoàn tất bắt tay ba bước và có lưu lượng hợp lệ theo cả hai chiều; trạng thái này giúp phiên được bảo vệ trong bảng NAT và không bị kernel thu hồi sớm khi thiếu bộ nhớ.
</details>

---

### Câu Hỏi 11: Hiện tượng cạn kiệt cổng nguồn (SNAT Port Exhaustion / Port Starvation) xảy ra khi nào và các thực tiễn sản xuất (Best Practices) nào giúp phòng tránh?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân xảy ra**: Một địa chỉ Public IP chỉ có tối đa khoảng $65.535$ cổng Layer 4 (thực tế dải cổng khả dụng của kernel từ $1024$ đến $65535$, khoảng $64.000$ cổng). Khi cụm hệ thống (như Kubernetes chứa hàng trăm Microservices) liên tục tạo các kết nối HTTP/HTTPS ngắn hạn (**Short-lived connections**) ra ngoài qua một NAT Gateway duy nhất mà không dùng **HTTP Keep-Alive / Connection Pooling**, kho cổng nguồn sẽ cạn kiệt chỉ trong vài giây, làm các kết nối mới bị rớt (Connection Dropped / Timeout).
- **Cách phòng tránh (Best Practices)**:
  - Ánh xạ thêm nhiều Public IP vào NAT Gateway (mở rộng pool địa chỉ).
  - Tinh chỉnh thời gian chờ `tcp_fin_timeout`.
  - Bắt buộc sử dụng **Connection Pooling** / HTTP Keep-Alive ở tầng ứng dụng.
</details>

---

### Câu Hỏi 12: Sự cố Hairpinning NAT (NAT Loopback) là gì và hai giải pháp phổ biến để xử lý sự cố này trong thực tế là gì?

<details>
<summary>Đáp án</summary>

- **Khái niệm**: Hairpinning NAT xảy ra khi một máy trong mạng LAN muốn truy cập một máy chủ nội bộ khác (ví dụ Web Server `192.168.1.100`), nhưng lại truy cập thông qua tên miền công khai trỏ tới **Public IP của chính router NAT** (`203.0.113.1`). Nếu router không hỗ trợ **Hairpin NAT (NAT Reflection)**, nó sẽ không biết chuyển tiếp ngược gói tin quay trở lại mạng LAN, khiến kết nối thất bại.
- **Hai giải pháp**:
  1. Bật tính năng **Hairpin NAT** trên router.
  2. Áp dụng kiến trúc **Split-Horizon DNS**: cấu hình DNS nội bộ phân giải tên miền đó thành Private IP (`192.168.1.100`), trong khi DNS công cộng vẫn phân giải thành Public IP.
</details>
