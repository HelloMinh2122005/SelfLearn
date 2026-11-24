# Review: 2_6_2 Forward Proxy

### Câu Hỏi 1: Forward Proxy là gì và thường được triển khai ở vị trí nào trong kiến trúc mạng?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Forward Proxy (còn gọi là Proxy hoặc Client-Side Proxy) là một máy chủ trung gian đóng vai trò đại diện cho một máy khách (client) hoặc một nhóm client trong mạng nội bộ khi giao tiếp với Internet. Thay vì kết nối trực tiếp tới origin server, client gửi yêu cầu đến Forward Proxy để proxy tiếp nhận, xử lý và tạo kết nối thay mặt client tới máy chủ đích.
- **Vị trí triển khai**: Forward Proxy được đặt tại **ranh giới thoát (egress boundary / egress perimeter)** của mạng nội bộ — nằm giữa các máy trạm hoặc máy chủ nội bộ và mạng Internet công cộng, giúp tập trung và kiểm soát toàn bộ lưu lượng đi ra ngoài (outbound traffic).

</details>

---

### Câu Hỏi 2: Explicit Proxy và Transparent (Interception) Proxy khác nhau như thế nào về nhận thức của client, cấu hình và cách chuyển tiếp gói tin?

<details>
<summary>Đáp án</summary>

| Tiêu chí | Explicit Proxy (Proxy tường minh) | Transparent / Interception Proxy (Proxy trong suốt) |
| :--- | :--- | :--- |
| **Nhận thức của Client** | Client biết rõ sự tồn tại của proxy. | Client hoàn toàn **không** biết có sự can thiệp của proxy. |
| **Cấu hình trên Client** | Bắt buộc cấu hình IP/Port trong hệ điều hành, trình duyệt, file PAC hoặc biến môi trường shell. | **Không** cần bất kỳ cấu hình nào trên thiết bị client. |
| **Dòng gói tin L3/L4** | Client gửi gói tin TCP trực tiếp tới IP và Port của proxy (ví dụ: `10.0.1.2:3128`). | Client gửi gói tin IP tới địa chỉ của server đích ngoài Internet (cổng 80/443). |
| **Cơ chế chuyển hướng** | Ứng dụng client tự đóng gói HTTP request với request-target ở dạng `absolute-URI`. | Router hoặc Gateway trên đường đi đánh chặn và chuyển hướng gói tin vào proxy bằng Policy Routing hoặc NAT `REDIRECT`. |

</details>

---

### Câu Hỏi 3: File cấu hình PAC và giao thức WPAD hỗ trợ triển khai Explicit Proxy trong doanh nghiệp như thế nào?

<details>
<summary>Đáp án</summary>

- **File PAC (Proxy Auto-Configuration)**: Chứa hàm JavaScript chuẩn `FindProxyForURL(url, host)` giúp trình duyệt tự động tính toán URL nào cần đi qua proxy nào hoặc URL nào đi trực tiếp (`DIRECT`).
- **Giao thức WPAD (Web Proxy Auto-Discovery Protocol)**: Cho phép máy trạm tự động phát hiện và tải về file PAC mà không cần nhập cấu hình thủ công, thông qua hai cơ chế chính:
  1. **DHCP Option 252**.
  2. **Truy vấn DNS** tìm hostname `wpad.<domain>`.

</details>

---

### Câu Hỏi 4: Hãy nêu 4 trường hợp sử dụng trọng yếu của Forward Proxy trong mạng doanh nghiệp?

<details>
<summary>Đáp án</summary>

1. **Lọc lưu lượng thoát (Corporate Egress Filtering & Access Control)**: Áp dụng whitelisting/blacklisting tên miền và URL dựa trên HTTP request để chặn truy cập mạng xã hội, trang độc hại hoặc dịch vụ ngoài tầm kiểm soát.
2. **Kiểm soát thất thoát dữ liệu & rà soát mã độc (DLP & Malware Scanning)**: Kiểm tra payload tải lên để ngăn rò rỉ dữ liệu nhạy cảm (thẻ tín dụng, mã nguồn, danh sách khách hàng) và rà quét virus cho tệp tải về trước khi tới máy trạm.
3. **Bộ đệm chuyển tiếp (Forward Caching)**: Lưu bản sao tài nguyên tĩnh (như bản cập nhật hệ điều hành, gói thư viện) trên đĩa cứng cục bộ của proxy để phục vụ các yêu cầu lặp lại với độ trễ thấp và tiết kiệm băng thông WAN.
4. **Bảo vệ danh tính & ẩn địa chỉ IP client (Client Anonymity & IP Masking)**: Origin server trên Internet chỉ thấy địa chỉ IP công cộng của Forward Proxy/NAT Gateway, không biết được IP riêng (`10.x.x.x`, `192.168.x.x`) hay cấu trúc mạng nội bộ phía sau.

</details>

---

### Câu Hỏi 5: Vì sao kết nối HTTPS cần phương thức `HTTP CONNECT` và đường hầm này hoạt động qua các bước nào?

<details>
<summary>Đáp án</summary>

- **Lý do**: HTTPS mã hóa end-to-end bằng TLS cả đường dẫn URL và HTTP headers, nên Forward Proxy thông thường không thể đọc nội dung gói tin HTTP để định tuyến như HTTP thuần. Theo RFC 9110 Section 9.3.6, phương thức `HTTP CONNECT` được dùng để thiết lập một đường hầm TCP nhị phân mù (Blind TCP Tunnel).
- **Quy trình 5 bước**:
  1. Client thực hiện bắt tay TCP 3 bước tới Forward Proxy (ví dụ cổng `3128`).
  2. Client gửi yêu cầu `CONNECT <host>:<port> HTTP/1.1` (request-target dạng `authority-form`, ví dụ `CONNECT api.example.com:443 HTTP/1.1`).
  3. Forward Proxy phân giải DNS tên miền đích và thực hiện bắt tay TCP 3 bước tới cổng `443` của origin server.
  4. Khi nối TCP thành công, proxy trả về `HTTP/1.1 200 Connection Established`.
  5. Proxy chuyển sang chế độ **Blind Byte Forwarding** (TCP relay), chuyển tiếp nguyên vẹn từng byte hai chiều để client và origin server thực hiện bắt tay TLS và trao đổi dữ liệu mã hóa trực tiếp với nhau.

</details>

---

### Câu Hỏi 6: Theo RFC 9110 Section 9.3.6, phản hồi `200 Connection Established` cho phương thức `CONNECT` phải tuân thủ quy tắc header nào và tại sao?

<details>
<summary>Đáp án</summary>

- **Quy tắc bắt buộc**: Phản hồi 2xx cho phương thức `CONNECT` **tuyệt đối không được gửi kèm header `Content-Length` hoặc `Transfer-Encoding`**.
- **Lý do**: Kết nối HTTP kết thúc ngay sau chuỗi phân cách header CRLF (`\r\n\r\n`). Ngay lập tức sau dòng trống đó, proxy chuyển sang chế độ truyền luồng mù (tunnel mode), nên toàn bộ các byte tiếp theo thuộc về phiên bắt tay TLS và dữ liệu đường hầm của client chứ không phải phần thân (body) phản hồi HTTP từ proxy.

</details>

---

### Câu Hỏi 7: Cơ chế xác thực proxy `407 Proxy Authentication Required` hoạt động ra sao và đặc tính hop-by-hop mang lại lợi ích bảo mật gì?

<details>
<summary>Đáp án</summary>

- **Quy trình xác thực (RFC 9110 Section 15.5.8 & 11.7.1)**:
  1. Khi client gửi request HTTP hoặc `CONNECT` chưa có thông tin đăng nhập, proxy từ chối và trả về mã `407 Proxy Authentication Required` kèm header `Proxy-Authenticate` (ví dụ `Basic realm="Corporate Forward Proxy"`).
  2. Client gửi lại yêu cầu kèm header `Proxy-Authorization` chứa thông tin xác thực.
- **Đặc tính Hop-by-Hop**: `Proxy-Authenticate` và `Proxy-Authorization` là các header điều khiển hop-by-hop. Forward Proxy xử lý và **xóa bỏ hoàn toàn** các header này trước khi chuyển tiếp yêu cầu đi, giúp thông tin xác thực proxy của người dùng không bao giờ bị rò rỉ tới origin server ngoài Internet.

</details>

---

### Câu Hỏi 8: SSL/TLS Forward Inspection giải quyết vấn đề gì và cơ chế tách 2 phiên TLS diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

- **Vấn đề được giải quyết**: Đường hầm `HTTP CONNECT` mã hóa end-to-end tạo ra "điểm mù" cho tường lửa doanh nghiệp, khiến mã độc hoặc dữ liệu rò rỉ đi qua HTTPS không thể bị kiểm tra bởi DLP hay antivirus. SSL/TLS Forward Inspection (ủy quyền giải mã) giúp thiết bị bảo mật/proxy đọc được plaintext HTTP để rà quét an ninh trước khi gửi đi.
- **Cơ chế tách 2 phiên TLS**:
  1. **Điều kiện tiên quyết**: Quản trị viên cài đặt sẵn chứng chỉ **Enterprise Root CA** nội bộ vào kho chứng chỉ tin cậy (Trust Store) của các máy trạm.
  2. **Phiên 1 (Upstream Leg)**: Khi client gửi `Client Hello`, proxy chặn lại và tự mở một phiên TLS độc lập với origin server thật, xác thực chứng chỉ công cộng của server đích.
  3. **Sinh chứng chỉ động (On-the-fly Dynamic Certificate)**: Proxy lấy thông tin Subject và Subject Alternative Names (SAN) từ chứng chỉ thật để tự tạo một chứng chỉ mới cho đúng tên miền đó nhưng được ký bởi **Enterprise Root CA**.
  4. **Phiên 2 (Client Leg)**: Proxy gửi chứng chỉ vừa sinh cho client. Do máy trạm tin tưởng Enterprise Root CA, kết nối TLS được xác nhận hợp lệ. Proxy giải mã dữ liệu từ phiên 2 để kiểm tra DLP/antivirus rồi mã hóa lại qua phiên 1 gửi tới origin server.

</details>

---

### Câu Hỏi 9: Các biến môi trường proxy chuẩn trên Linux gồm những biến nào và việc cấu hình thiếu biến `no_proxy` gây ra hậu quả gì?

<details>
<summary>Đáp án</summary>

- **Các biến môi trường tiêu chuẩn**:
  - `http_proxy`: Proxy cho lưu lượng HTTP không mã hóa.
  - `https_proxy`: Proxy cho lưu lượng HTTPS.
  - `all_proxy`: Proxy cho toàn bộ giao thức (bao gồm FTP, SOCKS).
  - `no_proxy`: Danh sách domain, IP hoặc dải mạng CIDR (hỗ trợ từ curl 7.86.0+) đi trực tiếp mà không qua proxy (ví dụ: `127.0.0.1,localhost,10.0.0.0/8,.internal.corp`).
- **Hậu quả khi cấu hình thiếu hoặc sai `no_proxy`**: Các request gọi tới microservices hoặc cơ sở dữ liệu nội bộ sẽ bị đẩy vòng qua Forward Proxy. Proxy không phân giải hoặc không tiếp cận được IP nội bộ nên trả về lỗi `502 Bad Gateway` hoặc timeout, làm gián đoạn hệ thống nội bộ và vô tình làm lộ các URL nội bộ nhạy cảm trong logs của proxy.

</details>

---

### Câu Hỏi 10: Khi gửi yêu cầu HTTP qua Explicit Proxy bằng lệnh `curl -v -x http://10.0.1.2:3128 http://example.com/index.html`, bạn sẽ quan sát thấy những dấu hiệu đặc trưng nào trong request và response?

<details>
<summary>Đáp án</summary>

- **Kết nối TCP**: `curl` kết nối tới IP và port của proxy (`10.0.1.2:3128`) thay vì IP của `example.com`.
- **Dòng request-target**: Được gửi ở dạng URL tuyệt đối (`GET http://example.com/index.html HTTP/1.1`) theo chuẩn HTTP proxy request.
- **Header trong phản hồi**:
  - `Via`: Ví dụ `Via: 1.1 corporate-forward-proxy (squid/5.7)` xác nhận lưu lượng đã đi qua máy chủ trung gian theo RFC 9110 Section 7.6.3.
  - `X-Cache: HIT` (nếu có cache): Cho thấy tài nguyên đã được phục vụ trực tiếp từ Forward Cache của proxy.

</details>

---

### Câu Hỏi 11: Để cấu hình chuyển hướng trong suốt (Transparent Proxy) cho lưu lượng HTTP cổng 80 vào proxy cổng 3128 trên Linux Gateway, cần thực hiện những thiết lập cốt lõi nào với nhân Linux và `iptables`?

<details>
<summary>Đáp án</summary>

1. **Bật IP Forwarding trong nhân Linux**:
   `echo 1 > /proc/sys/net/ipv4/ip_forward`
2. **Chuyển hướng gói tin cổng 80 sang cổng 3128 bằng bảng NAT**:
   `iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3128`
3. **Cho phép gói tin đã chuyển hướng đi vào cổng 3128 cục bộ**:
   `iptables -A INPUT -p tcp --dport 3128 -j ACCEPT`

</details>

---

### Câu Hỏi 12: Lỗ hổng `httpoxy` (CVE-2016-5385) xảy ra như thế nào và quy chuẩn đặt tên biến môi trường giúp phòng tránh lỗ hổng này là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế lỗ hổng**: Trong kiến trúc Web CGI truyền thống, Web Server chuyển đổi các HTTP Request header nhận từ client thành biến môi trường có tiền tố `HTTP_`. Nếu kẻ tấn công gửi header `Proxy: http://attacker-malicious-proxy.com:8080`, Web Server sẽ tự tạo biến `HTTP_PROXY`, khiến các thư viện HTTP client bên trong ứng dụng backend gửi nhầm lưu lượng outbound của server sang máy chủ của kẻ tấn công.
- **Quy chuẩn phòng tránh**: Các công cụ hiện đại như `curl` vô hiệu hóa hoặc bỏ qua biến chữ hoa `HTTP_PROXY` khi chạy trong môi trường CGI và ưu tiên đọc biến **viết thường** `http_proxy`. Trên Linux, cần luôn khai báo dạng chữ thường `export http_proxy=...` và `export https_proxy=...`.

</details>

---

### Câu Hỏi 13: Tại sao khi bật SSL Forward Inspection, trình duyệt web hoạt động bình thường nhưng các công cụ CLI (`git`, `curl`, `npm`, `docker`) hoặc ứng dụng dùng Certificate Pinning lại bị lỗi kết nối, và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**:
  1. **Với công cụ CLI (`git`, `curl`, `npm`, `pip`, `docker`)**: Các công cụ này thường dùng tệp CA bundle độc lập (như Mozilla CA Bundle) thay vì đọc OS Trust Store. Vì vậy chúng không nhận diện được chứng chỉ động do **Enterprise Root CA** ký và báo lỗi `unable to get local issuer certificate` hoặc `certificate signed by unknown authority`.
  2. **Với ứng dụng dùng Certificate Pinning**: Ứng dụng ghim sẵn mã băm SHA-256 khóa công khai của origin server thật. Khi proxy thay thế chứng chỉ, ứng dụng phát hiện sai lệch, coi đó là tấn công MITM và lập tức ngắt kết nối.
- **Cách khắc phục**:
  1. Trỏ công cụ CLI tới tệp chứng chỉ Enterprise Root CA nội bộ (ví dụ: `export CURL_CA_BUNDLE=/etc/ssl/certs/corporate-root-ca.pem`, `git config --global http.sslCAInfo /etc/ssl/certs/corporate-root-ca.pem`, `npm config set cafile ...`).
  2. Thiết lập chính sách **Bypass SSL Inspection (loại trừ giải mã)** trên tường lửa cho các dịch vụ nhạy cảm (ngân hàng, y tế, bảo hiểm) hoặc các kho phần mềm/dịch vụ có Certificate Pinning (`github.com`, `registry.npmjs.org`, Apple/Microsoft Update, Docker Hub).

</details>
