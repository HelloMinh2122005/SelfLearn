# Review: 2_6_5 Layer 4 vs Layer 7 Load Balancing

### Câu Hỏi 1: Layer 4 Load Balancing và Layer 7 Load Balancing hoạt động ở những tầng nào trong mô hình OSI và xử lý các giao thức nào?

<details>
<summary>Đáp án</summary>

- **Layer 4 Load Balancing (Transport)** hoạt động ở **Tầng 4 (Giao vận)** trong mô hình OSI, xử lý các giao thức **TCP và UDP**.
- **Layer 7 Load Balancing (Application)** hoạt động ở **Tầng 7 (Ứng dụng)** trong mô hình OSI, xử lý các giao thức như **HTTP, HTTPS, gRPC và WebSocket**.
</details>

### Câu Hỏi 2: Sự khác biệt về dữ liệu phân tích và cách xử lý tải trọng (Payload) giữa Layer 4 và Layer 7 Load Balancing là gì?

<details>
<summary>Đáp án</summary>

- **Layer 4 Load Balancing**: Chỉ phân tích **IP nguồn/đích, Cổng nguồn/đích và cờ TCP**. Bộ cân bằng tải **không đọc, không giải mã và không biến đổi** tải trọng; payload được coi như một luồng byte mờ đục (opaque bytes).
- **Layer 7 Load Balancing**: Đóng vai trò như một reverse proxy phân tích sâu toàn bộ nội dung tầng ứng dụng như **URL Path, Host Header, Cookie, HTTP Methods, Header và JSON payload**. Nó có thể **đọc, bóc tách và biến đổi** tải trọng (chèn header, nén gzip, chỉnh sửa cookie) để đưa ra quyết định định tuyến thông minh.
</details>

### Câu Hỏi 3: Cách quản lý kết nối TCP và giải mã TLS/HTTPS của Layer 4 khác với Layer 7 như thế nào?

<details>
<summary>Đáp án</summary>

- **Kết nối TCP**:
  - **Layer 4**: Có thể sử dụng 1 kết nối duy nhất (với NAT/DSR) hoặc proxy luồng byte TCP.
  - **Layer 7**: **Luôn chấm dứt kết nối TCP**, tạo thành 2 kết nối độc lập: 1 kết nối từ client tới proxy (client-to-proxy) và 1 kết nối từ proxy tới backend (proxy-to-backend).
- **Giải mã TLS/HTTPS**:
  - **Layer 4**: **Không giải mã**, mà truyền thẳng (passthrough) luồng TLS thô cho backend tự giải mã.
  - **Layer 7**: **Có giải mã**, thực hiện TLS Termination và quản lý chứng chỉ SSL tại biên.
</details>

### Câu Hỏi 4: Vì sao Layer 4 Load Balancing có hiệu năng cao hơn Layer 7, và trong HAProxy / NGINX hai chế độ này được cấu hình như thế nào?

<details>
<summary>Đáp án</summary>

- **Hiệu năng và tài nguyên**: Layer 4 đạt thông lượng cực cao (hàng triệu packet/giây) và tiêu tốn rất ít CPU/RAM vì chỉ xử lý IP/Port mà không can thiệp payload. Ngược lại, Layer 7 có hiệu năng trung bình - cao và tốn nhiều CPU hơn để giải mã TLS và phân tích chuỗi HTTP.
- **Cấu hình Engine**:
  - **HAProxy**: Layer 4 dùng `mode tcp`; Layer 7 dùng `mode http`.
  - **NGINX**: Layer 4 dùng khối `stream { ... }`; Layer 7 dùng khối `http { ... }`.
</details>

### Câu Hỏi 5: Trong mô hình chuyển tiếp Layer 4 VS/NAT (Virtual Server via NAT), gói tin đi qua Load Balancer như thế nào và hạn chế lớn nhất là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Bộ cân bằng tải hoạt động như một router NAT hai chiều:
  - **Chiều đến (Client → Backend)**: LB sửa địa chỉ IP đích từ VIP thành IP của Backend Server (DNAT).
  - **Chiều về (Backend → Client)**: Gói tin phản hồi bắt buộc phải đi qua lại LB để sửa địa chỉ IP nguồn từ Backend IP thành VIP trước khi gửi về client (SNAT).
- **Hạn chế lớn nhất**: Cả chiều đi lẫn chiều về đều phải đi qua Load Balancer, tạo ra điểm nghẽn cổ chai băng thông (bandwidth bottleneck) đối với các ứng dụng truyền tải lượng dữ liệu lớn (như video, file ảnh).
</details>

### Câu Hỏi 6: Cơ chế Direct Server Return (DSR / VS-DR) hoạt động ra sao và vì sao nó giải phóng được băng thông cho Load Balancer?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động (trên mạng cục bộ Layer 2 LAN)**:
  1. LB nhận gói tin gửi tới VIP công khai, **không sửa địa chỉ IP nguồn hay IP đích**, mà chỉ sửa **địa chỉ MAC đích** trong khung tin Ethernet Layer 2 thành địa chỉ MAC của Backend Server được chọn rồi đẩy ra switch.
  2. Trên các Backend Server, địa chỉ VIP được gán vào giao diện mạng ảo Loopback (`lo:0`) nên backend nhận diện và xử lý bình thường.
  3. **Phản hồi trực tiếp**: Gói tin phản hồi được Backend gửi **trực tiếp qua router gateway về Client ngoài Internet**, hoàn toàn bỏ qua Load Balancer.
- **Lý do giải phóng băng thông**: Vì lưu lượng chiều tải về (Download) thường gấp 10 - 100 lần chiều gửi lên (Upload), DSR giúp một LB nhỏ có thể điều phối cụm server phục vụ băng thông rất lớn mà không bị nghẽn ở chiều phản hồi.
</details>

### Câu Hỏi 7: Mô hình VS/TUN (Virtual Server via IP Tunneling) khác gì với DSR?

<details>
<summary>Đáp án</summary>

- Giống DSR ở chỗ gói tin phản hồi đi thẳng từ Backend về Client (bỏ qua Load Balancer).
- **Điểm khác biệt**: Thay vì chỉ sửa địa chỉ MAC trên mạng LAN Layer 2 như DSR, VS/TUN đóng gói gói tin IP ban đầu vào một gói tin IP mới (**IP-in-IP Encapsulation**) để gửi qua mạng định tuyến **Layer 3** tới các Backend nằm ở các trung tâm dữ liệu hoặc subnet khác nhau.
</details>

### Câu Hỏi 8: Hiện tượng xung đột ARP (ARP Flux) khi triển khai DSR là gì và cách khắc phục trên Linux như thế nào?

<details>
<summary>Đáp án</summary>

- **Hiện tượng ARP Flux**: Trong DSR, nhiều backend server cùng gắn một địa chỉ VIP trên card mạng ảo Loopback (`lo:0`). Khi switch hoặc router gửi bản tin ARP Request hỏi xem máy nào giữ VIP, các backend server đều cùng phản hồi ARP Reply. Điều này làm switch bị ghi đè bảng MAC liên tục (MAC Flapping) và đẩy lưu lượng trực tiếp vào một backend ngẫu nhiên thay vì qua Load Balancer.
- **Cách khắc phục trên kernel Linux**: Cấu hình tham số `sysctl` để ngăn card mạng vật lý trả lời ARP cho VIP nằm trên loopback:
  - `sysctl -w net.ipv4.conf.all.arp_ignore=1`
  - `sysctl -w net.ipv4.conf.all.arp_announce=2`
</details>

### Câu Hỏi 9: Làm thế nào để bảo toàn địa chỉ IP gốc của Client ở Layer 7 và Layer 4? Giao thức PROXY (PROXY Protocol) có hai phiên bản nào?

<details>
<summary>Đáp án</summary>

- **Tại Layer 7**: Bộ cân bằng tải chèn HTTP Header như `X-Forwarded-For` hoặc `Forwarded` (RFC 7239) vào request gửi tới backend.
- **Tại Layer 4**: Layer 4 không hiểu cấu trúc HTTP nên không thể dùng `X-Forwarded-For`. Nếu dùng DSR, IP nguồn được giữ nguyên; còn khi chạy ở chế độ TCP proxy thông thường, Layer 4 sử dụng **PROXY Protocol**: sau khi hoàn tất bắt tay TCP 3-way handshake với backend, LB chèn ngay một tiền tố chứa IP nguồn/đích và Port trước luồng dữ liệu ứng dụng.
- **Hai phiên bản PROXY Protocol**:
  - **v1 (Human-Readable Text Format)**: Chuỗi ASCII kết thúc bằng `\r\n`, dài tối đa 108 bytes (cấu hình HAProxy: `send-proxy`).
  - **v2 (Binary Format)**: Dạng nhị phân hiệu năng cao, mở đầu bằng 12-byte signature cố định, giúp phân giải cực nhanh mà không cần parse chuỗi (cấu hình HAProxy: `send-proxy-v2`).
</details>

### Câu Hỏi 10: Cơ chế kiểm tra sức khỏe (Health Check) ở Layer 4 và Layer 7 khác nhau ra sao, và cạm bẫy "Zombie Healthy" là gì?

<details>
<summary>Đáp án</summary>

- **Active L4 Health Check (TCP SYN/ACK)**: LB định kỳ gửi gói `TCP SYN` tới cổng backend; nếu backend trả `TCP SYN/ACK`, LB gửi `TCP RST` đóng kết nối và đánh dấu **UP**. Cách này rất nhẹ nhưng chỉ biết cổng TCP đang mở.
- **Active L7 Health Check (Application-Level)**: LB mở kết nối HTTP đầy đủ, gửi request cụ thể (ví dụ `GET /healthz`) và kiểm tra mã trạng thái trả về (như `200 OK`) hoặc nội dung JSON (như `{"status":"UP"}`) để đảm bảo ứng dụng thực sự sẵn sàng xử lý nghiệp vụ.
- **Cạm bẫy "Zombie Healthy"**: Khi dùng L4 Health Check cho web app, nếu tiến trình web server vẫn mở cổng 80 nhưng database bị sập hoặc ứng dụng lỗi `500 Internal Server Error`, L4 Health Check vẫn báo backend khỏe mạnh và tiếp tục điều phối người dùng vào máy chủ bị lỗi đó.
</details>

### Câu Hỏi 11: Cơ chế duy trì phiên (Session Persistence) tại Layer 4 và Layer 7 hoạt động như thế nào, và nhược điểm nghiêm trọng của Source IP Hash tại Layer 4 là gì?

<details>
<summary>Đáp án</summary>

- **Layer 4 (Source IP Hash)**: Băm địa chỉ IP nguồn của client (`hash(client_ip) % total_servers`) để luôn điều hướng một IP tới cùng một backend.
- **Layer 7 (Cookie Stickiness)**: LB chèn một cookie định danh vào phản hồi HTTP (ví dụ `Set-Cookie: SERVERID=be_01; Path=/; HttpOnly`). Ở các request sau, trình duyệt gửi lại cookie này để LB định tuyến chính xác tới backend tương ứng mà không phụ thuộc IP.
- **Nhược điểm của Source IP Hash**:
  - **Lệch tải nghiêm trọng**: Khi hàng nghìn người dùng từ cùng văn phòng, trường học hoặc mạng 4G/5G đi qua chung một cổng NAT/CGNAT (cùng một Public IP), toàn bộ lưu lượng bị dồn hết vào **một máy chủ backend duy nhất** gây sập vì quá tải trong khi các máy chủ khác rảnh rỗi.
  - **Mất phiên khi đổi mạng**: Khi người dùng chuyển từ WiFi sang 4G, IP thay đổi làm phiên bị mất.
</details>

### Câu Hỏi 12: Hạn chế về khả năng chịu lỗi của Layer 7 Cookie Stickiness là gì và giải pháp thay thế chuẩn mực trong hệ thống Cloud-Native hiện đại là gì?

<details>
<summary>Đáp án</summary>

- **Hạn chế về khả năng chịu lỗi (Fault Tolerance)**: Nếu máy chủ hoặc pod backend đang giữ phiên bị sự cố hoặc tái khởi động (rolling restart / auto-scaling), toàn bộ dữ liệu phiên lưu trên bộ nhớ cục bộ của máy chủ đó sẽ biến mất, khiến người dùng bị văng phiên và phải đăng nhập lại.
- **Giải pháp Cloud-Native hiện đại**: Xây dựng cụm backend phi trạng thái (**Stateless Backends**) và lưu trữ phiên tập trung tại **Distributed Session Store** (như Redis Cluster hoặc Memcached), giúp lưu lượng có thể chuyển hướng linh hoạt sang bất kỳ backend node nào mà phiên làm việc vẫn được giữ nguyên vẹn.
</details>
