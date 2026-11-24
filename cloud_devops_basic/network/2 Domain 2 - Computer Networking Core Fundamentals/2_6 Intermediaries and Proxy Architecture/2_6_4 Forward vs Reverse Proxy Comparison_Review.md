# Review: 2_6_4 Forward vs Reverse Proxy Comparison

### Câu Hỏi 1: Forward Proxy và Reverse Proxy khác nhau cơ bản như thế nào về vị trí triển khai, hướng lưu lượng và đối tượng đại diện?

<details>
<summary>Đáp án</summary>

Hai mô hình này tạo thành một cặp đối xứng gương hoàn hảo trong mạng:
- **Forward Proxy (Client-Side Proxy)**: Triển khai tại cửa ngõ thoát (**Egress Perimeter**) của mạng nội bộ (Internal LAN / Private VPC), kiểm soát lưu lượng đi ra ngoài (**Outbound Traffic**) và **đại diện cho phía Client** để thay mặt người dùng nội bộ kết nối tới các máy chủ trên Internet.
- **Reverse Proxy (Server-Side Gateway)**: Triển khai tại cửa ngõ đón (**Ingress Perimeter**) của trung tâm dữ liệu hoặc cụm máy chủ (DMZ / Edge Network), tiếp nhận lưu lượng đi vào (**Inbound Traffic**) và **đại diện cho phía Origin Server** để thay mặt cụm máy chủ ứng dụng phía sau đón kết nối từ Internet.
</details>

---

### Câu Hỏi 2: Khả năng che giấu danh tính và cấu trúc mạng của Forward Proxy và Reverse Proxy khác nhau ra sao?

<details>
<summary>Đáp án</summary>

- **Forward Proxy**: Che giấu **Client IP** và bảo vệ cấu trúc mạng LAN cũng như IP máy trạm nội bộ. Máy chủ đích ngoài Internet chỉ nhìn thấy địa chỉ IP của Forward Proxy.
- **Reverse Proxy**: Che giấu **Server IP và Topology**. Khách hàng trên Internet chỉ nhìn thấy địa chỉ IP công khai (VIP) của Reverse Proxy, còn toàn bộ dải IP riêng (ví dụ `10.x.x.x`), cổng dịch vụ và kiến trúc microservices phía sau đều được ẩn đi.
</details>

---

### Câu Hỏi 3: Việc cấu hình và quyền kiểm soát được thực hiện ở phía nào đối với Forward Proxy và Reverse Proxy?

<details>
<summary>Đáp án</summary>

- **Forward Proxy (Phía Client)**: Bắt buộc phải cấu hình ở phía máy trạm (trên trình duyệt, file PAC, hoặc biến môi trường như `http_proxy`) hoặc cấu hình chuyển hướng gói tin trên Router/Firewall của mạng LAN.
- **Reverse Proxy (Phía Server)**: Do đội ngũ quản trị hạ tầng máy chủ triển khai và quản lý. Phía Client hoàn toàn **không** cần cấu hình bất kỳ thông tin proxy nào, chỉ cần truy cập qua DNS bình thường.
</details>

---

### Câu Hỏi 4: Mục tiêu chính và các lợi ích cốt lõi mà Forward Proxy và Reverse Proxy mang lại là gì?

<details>
<summary>Đáp án</summary>

- **Forward Proxy (Client-Centric — Bảo vệ tổ chức người dùng)**:
  - Thực thi chính sách duyệt web (Egress filtering).
  - Chống thất thoát dữ liệu (DLP) và rà quét mã độc.
  - Tiết kiệm băng thông WAN thông qua bộ đệm (Forward Caching).
- **Reverse Proxy (Server-Centric — Bảo vệ và tối ưu hệ thống dịch vụ)**:
  - Cân bằng tải phân phối lưu lượng (Load Balancing).
  - Giải phóng tải mã hóa (SSL/TLS Offloading).
  - Tăng tốc ứng dụng với Reverse Caching.
  - Phòng thủ tấn công phân tán (DDoS Mitigation & WAF).
</details>

---

### Câu Hỏi 5: Forward Proxy và Reverse Proxy xử lý lưu lượng mã hóa TLS/SSL (HTTPS) khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **Forward Proxy**:
  - **Mặc định**: Tạo đường hầm nhị phân mù (**Blind TCP Tunnel**) thông qua phương thức `HTTP CONNECT` (RFC 9110 §9.3.6). Proxy không giải mã được dữ liệu mà chỉ chuyển tiếp nguyên vẹn luồng byte đã mã hóa.
  - **Trong mạng nội bộ (khi cần kiểm tra)**: Có thể giải mã thông qua cơ chế **SSL Forward Inspection** bằng cách sử dụng chứng chỉ nội bộ sinh tức thời từ Enterprise Root CA.
- **Reverse Proxy**:
  - Thực hiện **SSL Termination**: Giải mã TLS trực tiếp tại cửa ngõ biên bằng chứng chỉ SSL/TLS chính thức của tên miền dịch vụ.
  - Sau khi giải mã thành dữ liệu bản rõ (plaintext), Reverse Proxy có thể đọc URL/Header để định tuyến rồi chuyển tiếp dạng HTTP hoặc thiết lập kết nối mã hóa lại (re-encrypt) vào backend.
</details>

---

### Câu Hỏi 6: Hãy kể tên một số phần mềm tiêu biểu và các cổng TCP mặc định/phổ biến cho Forward Proxy và Reverse Proxy được nêu trong bài học?

<details>
<summary>Đáp án</summary>

- **Forward Proxy Ecosystem**:
  - **Squid**: Tiêu chuẩn de-facto cho web proxy caching & filtering, cổng mặc định trên thực tế là **3128/tcp** (được ghi phổ biến trong `/etc/services` là `squid 3128/tcp`, lưu ý trên danh bạ IANA cổng 3128/tcp được gán cho `ndl-aas`).
  - **Privoxy**: Chuyên lọc nội dung và bảo vệ riêng tư cá nhân, mặc định cổng **8118/tcp**.
  - **Tinyproxy**: Proxy gọn nhẹ cho mạng nhúng và container nhỏ, mặc định cổng **8888/tcp**.
  - Ngoài ra cổng **8080/tcp** (`http-alt` theo IANA) cũng thường được dùng cho proxy cục bộ.
- **Reverse Proxy Ecosystem** (tiếp nhận lưu lượng trực tiếp như Web Server chuẩn tại cổng **80/tcp** cho HTTP và **443/tcp** cho HTTPS):
  - **NGINX**: Hiệu năng cao, làm proxy cửa ngõ (cổng mặc định 80 / 443).
  - **HAProxy**: Chuyên cân bằng tải tầng 4 và tầng 7 (cổng mặc định 80 / 443).
  - **Envoy**: Thiết kế cho kiến trúc Cloud-Native & Service Mesh (cổng mặc định 10000 / 80).
</details>

---

### Câu Hỏi 7: Khi một máy khách đứng sau Forward Proxy truy cập ứng dụng web được bảo vệ bởi Reverse Proxy qua HTTPS, luồng yêu cầu diễn ra qua những bước chính nào?

<details>
<summary>Đáp án</summary>

Luồng yêu cầu đi qua 5 giai đoạn chính:
1. **Client gửi yêu cầu ra ngoài**: Client gửi `CONNECT <domain>:443 HTTP/1.1` tới Forward Proxy. Forward Proxy kiểm tra chính sách Egress & DLP rồi trả về `HTTP/1.1 200 Connection Established`.
2. **Thiết lập đường truyền Internet**: Forward Proxy gửi gói tin từ Public IP Egress của mình qua Internet tới Public VIP Ingress của Reverse Proxy.
3. **Xử lý tại biên Ingress**: Reverse Proxy thực hiện TLS Handshake (cung cấp chứng chỉ của tên miền dịch vụ) và thực hiện **SSL Termination** để giải mã gói tin thành HTTP bản rõ.
4. **Phân phối vào Backend**: Reverse Proxy gửi HTTP request kèm các header như `Host`, `X-Forwarded-For`, `X-Forwarded-Proto` tới App Server nội bộ và nhận lại phản hồi (ví dụ JSON Data).
5. **Trả lời ngược về Client**: Reverse Proxy mã hóa dữ liệu phản hồi qua TLS trả về Forward Proxy, sau đó Forward Proxy chuyển tiếp luồng byte phản hồi qua đường hầm TCP về cho Client.
</details>

---

### Câu Hỏi 8: Sự khác biệt về cấu hình giữa Squid (Forward Proxy) và NGINX (Reverse Proxy) thể hiện bản chất kiến trúc của hai loại proxy này như thế nào?

<details>
<summary>Đáp án</summary>

- **Cấu hình Squid (`/etc/squid/squid.conf`)**: Tập trung vào việc nhận diện **IP nguồn nội bộ** (`acl ... src 10.0.1.0/24`), định nghĩa cổng/phương thức an toàn (`Safe_ports`, `SSL_ports`, `CONNECT`) và quản lý **danh mục địa chỉ đích bên ngoài** bị chặn hoặc cho phép đi ra (`dstdomain`, `http_access deny/allow`) trên cổng lắng nghe nội bộ `http_port 3128`.
- **Cấu hình NGINX (`/etc/nginx/conf.d/...`)**: Tập trung vào việc **đón nhận lưu lượng từ bên ngoài** tại cổng `80` và `443 ssl`, khai báo chứng chỉ TLS để giải mã (`ssl_certificate`, `ssl_certificate_key`), định nghĩa cụm máy chủ ứng dụng nội bộ (`upstream` với thuật toán cân bằng tải như `least_conn`) và chuyển tiếp vào backend qua `proxy_pass` kèm thiết lập header (`proxy_set_header`).
</details>

---

### Câu Hỏi 9: Rủi ro bảo mật trọng yếu của Forward Proxy khác gì so với nguy cơ giả mạo IP (IP Spoofing) qua tiêu đề `X-Forwarded-For` trên Reverse Proxy?

<details>
<summary>Đáp án</summary>

- **Rủi ro trên Forward Proxy**: Mối quan tâm hàng đầu là **thất thoát dữ liệu nội bộ (Data Exfiltration)** và **vượt tường lửa kiểm soát (Bypassing Controls)**, khi kẻ tấn công hoặc mã độc bên trong mạng dùng các đường hầm SSH/HTTPS trái phép hoặc DNS tunneling xuyên qua proxy để tuồn dữ liệu ra ngoài.
- **Rủi ro trên Reverse Proxy (`X-Forwarded-For` IP Spoofing)**: Kẻ tấn công từ Internet có thể tự đính kèm header giả mạo như `X-Forwarded-For: 127.0.0.1` (hoặc IP bất kỳ). Nếu Edge Reverse Proxy chỉ ghép thêm chuỗi (`append`, như `$proxy_add_x_forwarded_for`) thay vì làm sạch/ghi đè, ứng dụng backend đọc phần tử đầu tiên của `X-Forwarded-For` sẽ nhận nhầm IP thật của client, dẫn đến vượt qua cơ chế IP Whitelist, Rate Limiting hoặc WAF.
</details>

---

### Câu Hỏi 10: Cách phòng chống lỗ hổng giả mạo IP qua `X-Forwarded-For` trong mô hình một lớp Reverse Proxy và nhiều lớp Proxy trung gian (Multi-tier Proxies) là gì?

<details>
<summary>Đáp án</summary>

- **Tại lớp Reverse Proxy ngoài cùng (Edge Proxy)**: Bắt buộc phải **ghi đè** thông tin IP client bằng địa chỉ socket thực tế (`$remote_addr`), chẳng hạn sử dụng header `X-Real-IP $remote_addr`, hoặc dùng module như `ngx_http_realip_module` của NGINX để loại bỏ các IP không đáng tin cậy (hoặc áp dụng chuẩn `Forwarded` theo RFC 7239).
- **Khi ứng dụng nằm sau nhiều tầng proxy (ví dụ CDN -> Load Balancer -> Ingress -> App)**: Hệ thống phải thiết lập danh sách **Trusted Proxies**. Ứng dụng sẽ duyệt ngược từ phần tử cuối cùng của mảng `X-Forwarded-For` về trước và dừng lại tại địa chỉ IP đầu tiên **không** thuộc danh sách Trusted Proxies — đó mới là IP công cộng thực tế của khách hàng.
</details>

---

### Câu Hỏi 11: Trong môi trường Kubernetes/Cloud, cần phân biệt thế nào giữa Ingress Controller và cơ chế Egress, đồng thời proxy phát hiện và xử lý vòng lặp (Proxy Loop) theo chuẩn RFC ra sao?

<details>
<summary>Đáp án</summary>

- **Phân biệt Ingress Controller và Egress trên Cloud/Kubernetes**:
  - **Ingress Controller** (như Ingress-NGINX) là một cụm **Reverse Proxy** chuyên xử lý lưu lượng **Inbound** từ bên ngoài đi vào Service/Pod bên trong cluster, không dùng để điều hướng lưu lượng từ Pod gọi ra ngoài Internet.
  - Khi các Pod cần gọi ra API bên ngoài (**Outbound**), lưu lượng phải đi qua cơ chế định tuyến Egress như **Cloud NAT Gateway**, **Egress Gateway** (trong Istio Service Mesh), hoặc cụm **Squid Forward Proxy**.
- **Phát hiện và xử lý Proxy Loop (RFC 9110 §7.6 & RFC 5842 §7.2)**:
  - Khi cấu hình sai DNS hoặc HTTP Redirect làm các tầng proxy đẩy request lặp vòng cho nhau, RFC 9110 §7.6 bắt buộc thiết bị trung gian phải phát hiện vòng lặp.
  - Proxy kiểm tra tiêu đề `Via` (RFC 9110 §7.6.3); nếu thấy tên định danh của chính mình đã xuất hiện trong chuỗi `Via`, proxy sẽ lập tức hủy yêu cầu và trả về mã lỗi **`508 Loop Detected`** (RFC 5842 §7.2) hoặc **`502 Bad Gateway`**.
</details>
