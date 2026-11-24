# Review: 2_6_1 What is an Intermediary

### Câu Hỏi 1: Intermediary (Thực thể trung gian) trong kiến trúc HTTP là gì và nó thay đổi mô hình kết nối giữa User Agent và Origin Server như thế nào?

<details>
<summary>Đáp án</summary>

Theo RFC 9110 Section 3.7, phần lớn giao tiếp HTTP hiện đại không đi trực tiếp theo mô hình điểm-tới-điểm (point-to-point) giữa **User Agent (Client)** và **Origin Server**, mà đi qua một chuỗi các kết nối (chain of connections) thông qua các mắt xích mạng trung gian gọi là **Intermediaries**.

Intermediary là điểm kết thúc (termination point) của một kết nối TCP này (TCP Hop 1 với User Agent) và đồng thời là điểm bắt đầu của một kết nối TCP độc lập khác (TCP Hop 2 với Origin Server) để đáp ứng các HTTP request.

</details>

### Câu Hỏi 2: Theo RFC 9110 Section 3.7, có 3 hình thái Intermediary phổ biến nào và vai trò của từng loại là gì?

<details>
<summary>Đáp án</summary>

RFC 9110 phân chia Intermediary thành 3 nhóm chức năng chính:

1. **Proxy (Forward Proxy)**: Được client chủ động lựa chọn (qua cấu hình mạng hoặc trình duyệt) để định tuyến các yêu cầu tới các tài nguyên khác nhau. Thường đứng ở biên mạng lối ra (egress boundary) của mạng nội bộ hoặc client, đại diện cho client gửi yêu cầu ra Internet.
2. **Gateway (Reverse Proxy)**: Đóng vai trò như một Origin Server đối với các kết nối từ phía ngoài gửi tới, sau đó phiên dịch và chuyển tiếp yêu cầu vào trong (inbound) tới một hoặc nhiều máy chủ nội bộ phía sau. Thường đứng ở biên lối vào (ingress boundary) của hạ tầng máy chủ để bảo vệ và điều phối lưu lượng.
3. **Tunnel**: Hoạt động như một điểm chuyển tiếp mù (blind relay) giữa hai kết nối TCP mà không kiểm tra hay biến đổi nội dung thông điệp (điển hình nhất là cơ chế `HTTP CONNECT` dùng để thiết lập đường hầm truyền TLS/HTTPS qua forward proxy).

</details>

### Câu Hỏi 3: Một phần mềm mạng duy nhất (như NGINX, HAProxy, Envoy hay Squid) có bị cố định vào một hình thái Intermediary duy nhất không?

<details>
<summary>Đáp án</summary>

Không. Theo RFC 9110 Section 3.7, một phần mềm mạng duy nhất hoàn toàn có thể kiêm nhiệm và chuyển đổi linh hoạt giữa các vai trò (Origin Server, Proxy, Gateway hoặc Tunnel) tùy thuộc vào ngữ cảnh cấu hình và bản chất của từng request.

</details>

### Câu Hỏi 4: Intermediary theo chuẩn RFC 9110 khác với proxy SOCKS5 (RFC 1928) ở điểm nào?

<details>
<summary>Đáp án</summary>

- **Intermediary trong RFC 9110** là các **HTTP-aware intermediaries** hoạt động tại **Tầng 7 (Application Layer)**, có khả năng đọc, hiểu và xử lý ngữ nghĩa HTTP (như headers, status codes, methods). Chúng thường dùng cấu hình như `http_proxy` hoặc `https_proxy`.
- **SOCKS5 (RFC 1928)** là giao thức proxy hoạt động ở **Tầng 5 (Session Layer) / Tầng Giao vận**, chỉ thực hiện chuyển tiếp mù các luồng byte TCP/UDP thuần túy mà không đọc hay biến đổi dữ liệu ứng dụng (thường cấu hình qua biến môi trường như `all_proxy="socks5://127.0.0.1:1080"`).

</details>

### Câu Hỏi 5: Bản chất "vai trò kép" (Dual Role) của một Intermediary theo RFC 9110 Section 3.3 là gì?

<details>
<summary>Đáp án</summary>

Theo RFC 9110 Section 3.3, "Client" và "Server" không phải là các cỗ máy phần cứng cố định, mà chỉ là **vai trò mà chương trình đảm nhận trên một kết nối mạng cụ thể**:

- **Trên kết nối Inbound (với User Agent)**: Intermediary đóng vai trò là **Server** (lắng nghe kết nối TCP, nhận HTTP Request và gửi HTTP Response).
- **Trên kết nối Outbound (với Origin Server)**: Intermediary đóng vai trò là **Client** (chủ động mở socket kết nối TCP mới, tạo HTTP Request và nhận HTTP Response từ máy chủ đích).

</details>

### Câu Hỏi 6: Sự khác biệt giữa End-to-End Headers và Hop-by-Hop Headers là gì và ví dụ điển hình của mỗi loại?

<details>
<summary>Đáp án</summary>

- **End-to-End Headers**: Là các tiêu đề mang ngữ nghĩa dữ liệu hoặc thông tin ứng dụng, cần được truyền nguyên vẹn từ User Agent ban đầu tới tận Origin Server cuối cùng (và ngược lại). Ví dụ: `Host`, `User-Agent`, `Accept`, `Authorization`, `Content-Type`, `ETag`, `Cache-Control`.
- **Hop-by-Hop Headers (Connection-Specific Fields)**: Là các tiêu đề chỉ có hiệu lực duy nhất trên một mắt xích kết nối TCP trực tiếp hiện tại giữa hai node lân cận. Các trường hop-by-hop bị cấm chuyển tiếp gồm: `Connection`, `Keep-Alive`, `Proxy-Connection`, `TE`, `Transfer-Encoding`, `Upgrade`, `Proxy-Authenticate` và `Proxy-Authorization`.

</details>

### Câu Hỏi 7: Theo RFC 9110 Section 7.6.1 và RFC 7230 Section 6.1, Intermediary phải xử lý Hop-by-Hop Headers như thế nào trước khi chuyển tiếp thông điệp và hậu quả nếu để rò rỉ chúng là gì?

<details>
<summary>Đáp án</summary>

Intermediary **BẮT BUỘC (MUST)** phải phân tích trường tiêu đề `Connection` và loại bỏ toàn bộ các trường hop-by-hop trước khi chuyển tiếp (forward) thông điệp sang chặng tiếp theo.

Nếu lập trình hoặc cấu hình sơ sài làm rò rỉ hop-by-hop headers sang backend origin:
- **Rò rỉ `Connection: close`**: Backend server sẽ đóng kết nối TCP ngay sau phản hồi đầu tiên, phá vỡ cơ chế TCP connection pooling / keep-alive pooling giữa proxy và backend, khiến CPU backend quá tải vì phải liên tục thực hiện 3-way handshake.
- **Rò rỉ `Proxy-Authorization` / `Proxy-Authenticate`**: Vi phạm chuẩn RFC và làm lộ thông tin xác thực dành riêng cho node proxy vào hệ thống mạng nội bộ phía sau.

</details>

### Câu Hỏi 8: Header `Via` có cú pháp và cơ chế hoạt động ra sao để giúp Intermediary chống lặp vô hạn (Loop Detection)?

<details>
<summary>Đáp án</summary>

Theo RFC 9110 Section 7.6 và 7.6.3:
- **Cú pháp**: `Via = #( received-protocol RWS received-by [ RWS comment ] )`, trong đó `received-protocol` ghi phiên bản giao thức tiếp nhận (ví dụ `1.1` hoặc `2`, có thể lược bớt tên HTTP), còn `received-by` là hostname hoặc địa chỉ IP kèm cổng của intermediary.
- **Cơ chế hoạt động**: Khi đi qua mỗi intermediary, node đó nối tiếp (append) định danh của mình vào header `Via`. Nếu một intermediary nhận được request mà thấy định danh của chính mình đã tồn tại trong danh sách `Via`, nó nhận biết ngay gói tin đang bị lặp vòng (routing loop) và phải dừng chuyển tiếp, ngắt kết nối và trả về mã lỗi `508 Loop Detected` hoặc `502 Bad Gateway` (tránh tình trạng mở hàng nghìn socket gây cạn kiệt file descriptor / `epoll` exhaustion làm sập gateway).

</details>

### Câu Hỏi 9: Header `Max-Forwards` (RFC 9110 Section 7.6.2) hoạt động như thế nào và cần lưu ý gì về bảo mật khi sử dụng?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Được client chèn vào các yêu cầu chẩn đoán mạng sử dụng phương thức `TRACE` hoặc `OPTIONS` với giá trị số nguyên dương (`Max-Forwards: <n>`). Mỗi intermediary khi nhận được sẽ giảm giá trị này đi 1 (`n = n - 1`). Khi `Max-Forwards` chạm mốc `0`, intermediary không được phép chuyển tiếp nữa mà phải tự phản hồi ngay tại mắt xích đó.
- **Lưu ý bảo mật**: Các công cụ chẩn đoán hoặc API Gateway hỗ trợ `TRACE` hay `OPTIONS` bắt buộc phải kiểm tra và giảm trừ `Max-Forwards`. Nếu không kiểm tra, kẻ tấn công có thể lợi dụng phương thức `TRACE` để dò quét toàn bộ cấu trúc liên mạng bên trong vùng DMZ (tấn công Cross-Site Tracing - XST).

</details>

### Câu Hỏi 10: Theo danh bạ IANA và thực hành Linux trong bài học, các cổng TCP mặc định phổ biến của Intermediary là gì và dùng lệnh nào để kiểm tra header `Via` cũng như các socket đang lắng nghe?

<details>
<summary>Đáp án</summary>

Theo danh bạ cổng dịch vụ của IANA:
- **TCP 3128**: Cổng mặc định của web proxy cache **Squid** (`squid 3128/tcp`).
- **TCP 8080**: Cổng chuẩn thay thế cho HTTP (`http-alt 8080/tcp Web Cache`), thường dùng cho proxy cục bộ hoặc dev reverse proxy.
- **TCP 80 / 443**: Cổng tiêu chuẩn cho HTTP/HTTPS công khai, phổ biến nhất cho các Ingress Gateway / Reverse Proxy sản xuất.

Công cụ kiểm tra thực hành:
- Dùng **`curl -v -x http://<proxy>:<port> <url>`** (cờ `-v` verbose) để xem chi tiết các hop-by-hop headers (như `Proxy-Connection`, `Connection`) và chuỗi trung gian trong header `Via`.
- Dùng **`ss -tulpn`** (Socket Statistics) trên Linux để xác định các tiến trình proxy/intermediary (như `squid`, `nginx`, `haproxy`) đang lắng nghe trên các cổng 3128, 8080, 80.

</details>
