# Review: 2_6_3 Reverse Proxy

### Câu Hỏi 1: Reverse Proxy (Gateway theo RFC 9110) là gì, đóng vai trò ra sao đối với Client và Backend Server, và khác biệt cốt lõi so với Forward Proxy là gì?

<details>
<summary>Đáp án</summary>

Theo đặc tả **RFC 9110 Section 3.7**, **Reverse Proxy** (được IETF gọi là **Gateway**) là một thành phần trung gian đứng ở ranh giới giữa Internet công cộng và mạng nội bộ, đại diện cho các máy chủ backend tiếp nhận lưu lượng đi vào:
- **Đối với External Client**: Reverse Proxy xuất hiện như chính máy chủ gốc (origin server). Client gửi request trực tiếp tới IP công khai hoặc FQDN của Reverse Proxy mà không biết sự tồn tại của các máy chủ nội bộ phía sau.
- **Đối với Backend Origin Server**: Reverse Proxy đóng vai trò như một client gửi request tới, phân bổ tải và cô lập backend khỏi mạng mở.
- **Khác biệt cốt lõi với Forward Proxy**: Forward Proxy đứng ở phía client (biên lối ra) và đại diện cho client gửi request ra ngoài Internet; ngược lại, Reverse Proxy đứng ở phía server (biên lối vào) và đại diện cho cụm máy chủ backend nhận request từ Internet.
</details>

### Câu Hỏi 2: Chức năng Origin Shielding & Security của Reverse Proxy bảo vệ các máy chủ backend như thế nào?

<details>
<summary>Đáp án</summary>

Reverse Proxy thực hiện **Origin Shielding & Security** bằng cách:
- **Che giấu hoàn toàn thông tin hạ tầng nội bộ**: Ẩn địa chỉ IP riêng (RFC 1918: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), cấu trúc liên mạng (topology), hệ điều hành, phần mềm máy chủ (ví dụ chỉ hiển thị `server: nginx` thay vì để lộ Tomcat, Kestrel hay Puma) và số lượng máy chủ backend.
- **Cô lập khỏi tấn công trực diện**: Hoạt động như một "bức tường lửa ứng dụng" ở biên, ngăn chặn các cuộc quét cổng (port scan) và các kết nối tấn công trực tiếp vào backend.
</details>

### Câu Hỏi 3: TLS Termination (SSL Offloading) là gì và mang lại lợi ích gì cho hệ thống?

<details>
<summary>Đáp án</summary>

- **Cơ chế**: Quá trình bắt tay mật mã TLS (TLS Handshake, trao đổi khóa bất đối xứng RSA/ECDSA) tiêu tốn rất nhiều chu kỳ CPU. Với **TLS Termination (SSL Offloading)**, Reverse Proxy đứng ở biên mạng đảm nhận toàn bộ việc mã hóa và giải mã TLS với client.
- **Giao tiếp nội bộ**: Kết nối giữa Reverse Proxy và các Backend Server bên trong mạng riêng (Private Subnet) có thể truyền tải dưới dạng HTTP thuần túy hoặc TLS mã hóa nhẹ (mTLS).
- **Lợi ích**: Giải phóng năng lực xử lý CPU cho các máy chủ backend để tập trung 100% vào logic nghiệp vụ ứng dụng.
</details>

### Câu Hỏi 4: Các chức năng Load Balancing, Reverse Caching, Response Compression và TCP Normalizer của Reverse Proxy hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **Load Balancing (Cân bằng tải)**: Tiếp nhận hàng trăm nghìn kết nối đồng thời và phân bổ tới nhóm máy chủ backend (`upstream pool`) bằng các thuật toán như Round Robin (xoay vòng), Least Connections (ưu tiên máy chủ ít kết nối nhất) hoặc IP Hash.
- **Reverse Caching & Web Acceleration (Bộ nhớ đệm ngược)**: Lưu trữ tệp tĩnh (HTML, CSS, JS, hình ảnh) hoặc các phản hồi API có thể tái sử dụng vào RAM hoặc SSD tốc độ cao. Khi có request lặp lại (**Cache Hit**), Reverse Proxy trả về ngay với độ trễ cực thấp (< 2ms) mà không cần chuyển tiếp tới backend.
- **Response Compression (Nén phản hồi)**: Nén dữ liệu văn bản (JSON, HTML, XML) bằng Gzip hoặc Brotli tại biên trước khi gửi qua mạng WAN, giúp tiết kiệm băng thông và tăng tốc tải trang.
- **TCP Normalizer (Chuẩn hóa TCP & chống DoS/DDoS)**: Hoạt động như bộ đệm hấp thụ các cuộc tấn công kết nối chậm như Slowloris hay SYN Flood; chỉ chuyển tiếp request sang backend khi đã nhận đầy đủ toàn bộ HTTP request header và body từ client.
</details>

### Câu Hỏi 5: Vì sao xảy ra hiện tượng Client Identity Loss khi đi qua Reverse Proxy, và việc khôi phục IP thật của client phục vụ cho những mục đích gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Khi Reverse Proxy nhận kết nối TCP từ client, nó chấm dứt kết nối đó và chủ động mở một kết nối TCP nội bộ mới tới backend server. Trên tầng socket (Layer 4), địa chỉ IP nguồn của kết nối nội bộ (`$remote_addr` trong NGINX hoặc `request.getRemoteAddr()` trong Java/Spring) chỉ ghi nhận **địa chỉ IP nội bộ của chính Reverse Proxy** thay vì IP thật của client ngoài Internet.
- **Mục đích cần khôi phục danh tính client**: Dùng cho kiểm toán nhật ký (audit log), định vị địa lý (GeoIP), giới hạn tần suất truy cập (Rate Limiting) và các cơ chế bảo mật.
</details>

### Câu Hỏi 6: Tiêu đề chuẩn hóa IETF `Forwarded` (RFC 7239) bao gồm những tham số chính nào và có quy tắc đặc biệt gì cho địa chỉ IPv6?

<details>
<summary>Đáp án</summary>

Tiêu đề `Forwarded` trong **RFC 7239** gộp các thông tin định danh vào một header duy nhất với các tham số chính:
- `for`: Địa chỉ IP hoặc định danh của client khởi tạo request.
- `proto`: Giao thức ban đầu mà client dùng để kết nối tới biên (`http` hoặc `https`).
- `host`: Giá trị của tiêu đề `Host` ban đầu mà client yêu cầu.
- `by`: Định danh hoặc địa chỉ IP của chính Reverse Proxy đã tiếp nhận kết nối.

**Quy tắc cho IPv6 (RFC 7239 Section 4)**: Địa chỉ IPv6 bắt buộc phải đặt trong dấu ngoặc vuông và bao quanh bởi dấu ngoặc kép, ví dụ: `for="[2001:db8:cafe::17]"`.
</details>

### Câu Hỏi 7: Nhóm tiêu đề quy ước `X-Forwarded-*` gồm những tiêu đề nào và ý nghĩa của từng tiêu đề là gì?

<details>
<summary>Đáp án</summary>

Nhóm tiêu đề quy ước thực tế (De-facto Standard) trước khi có RFC 7239 gồm:
- **`X-Forwarded-For` (XFF)**: Danh sách các địa chỉ IP cách nhau bởi dấu phẩy, ghi lại hành trình request qua các proxy (`<client-ip>, <proxy1-ip>, <proxy2-ip>`).
- **`X-Forwarded-Proto`**: Xác định giao thức gốc client dùng để kết nối tới proxy (`http` hoặc `https`), giúp backend biết request ban đầu có an toàn không dù kết nối nội bộ dùng HTTP.
- **`X-Forwarded-Host`**: Lưu giá trị `Host` ban đầu của client (ví dụ `shop.example.com`).
- **`X-Forwarded-Port`**: Cổng kết nối ban đầu của client tới proxy (ví dụ `443` cho HTTPS).
</details>

### Câu Hỏi 8: Lỗ hổng IP Spoofing với `X-Forwarded-For` xảy ra như thế nào?

<details>
<summary>Đáp án</summary>

- Vì HTTP Header là văn bản do client gửi lên, kẻ tấn công có thể tự gắn sẵn header giả mạo, ví dụ: `X-Forwarded-For: 127.0.0.1, 10.0.0.1`.
- Nếu Edge Reverse Proxy cấu hình nối tiếp (append) IP thật vào chuỗi có sẵn (ví dụ `"$http_x_forwarded_for, $remote_addr"`), backend sẽ nhận được chuỗi như `127.0.0.1, 10.0.0.1, 203.0.113.99`.
- Khi ứng dụng backend hoặc hệ thống lọc IP whitelist/giới hạn đăng nhập đọc địa chỉ IP đầu tiên bên trái (**leftmost IP**), nó sẽ tin nhầm rằng request đến từ `127.0.0.1` hoặc `10.0.0.1` và cho phép kẻ tấn công vượt qua hàng rào bảo mật.
</details>

### Câu Hỏi 9: Những chiến lược phòng vệ nào được áp dụng trong sản xuất để chống giả mạo IP qua `X-Forwarded-For`?

<details>
<summary>Đáp án</summary>

Có 2 chiến lược phòng vệ chuẩn trong sản xuất:
1. **Ghi đè tuyệt đối tại Edge Ingress Proxy**: Tại lớp proxy đầu tiên tiếp xúc với Internet công cộng (vùng không tin cậy), phải xóa bỏ hoàn toàn giá trị `X-Forwarded-For` do client gửi lên và gán trực tiếp bằng địa chỉ IP socket thực tế của client:
   ```nginx
   proxy_set_header X-Forwarded-For $remote_addr;
   ```
2. **Khai báo Proxy tin cậy (Trusted Proxies)**: Khi hệ thống có nhiều lớp proxy (ví dụ CDN -> NGINX Ingress -> Backend), backend hoặc proxy lớp trong chỉ tin cậy các IP nằm trong danh sách proxy tin cậy (Trusted IP whitelist), và phân tích chuỗi IP từ **phải sang trái (rightmost to leftmost)**, bỏ qua các IP thuộc proxy tin cậy cho tới khi gặp IP đầu tiên không nằm trong whitelist.
</details>

### Câu Hỏi 10: Trong cấu hình NGINX Reverse Proxy ở bài học, các cấu hình `keepalive`, `proxy_cache_use_stale` và header `X-Cache-Status` có tác dụng gì?

<details>
<summary>Đáp án</summary>

- **`keepalive` trong `upstream` kết hợp `proxy_http_version 1.1` và `proxy_set_header Connection ""`**: Duy trì nhóm kết nối keep-alive tới các backend server và cho phép tái sử dụng socket kết nối thay vì phải mở kết nối TCP mới cho từng request.
- **`proxy_cache_use_stale` (ví dụ `error timeout updating http_500 http_502 http_503 http_504`)**: Cho phép NGINX tạm thời trả về dữ liệu cũ trong cache nếu backend gặp lỗi, timeout hoặc đang cập nhật cache, giúp tăng khả năng chịu lỗi.
- **`add_header X-Cache-Status $upstream_cache_status always;`**: Đính kèm trạng thái cache (như `HIT` hoặc `MISS`) vào HTTP response gửi về cho client để dễ kiểm tra bằng công cụ như `curl -I`.
</details>

### Câu Hỏi 11: Nguyên nhân nào gây ra lỗi vòng lặp chuyển hướng (`ERR_TOO_MANY_REDIRECTS`) khi dùng Reverse Proxy làm TLS Termination và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Reverse Proxy tiếp nhận HTTPS từ client, giải mã TLS rồi gửi tiếp request qua HTTP tới backend. Backend nhận được giao thức `http://` nên hiểu nhầm người dùng đang truy cập không an toàn và trả về mã `301 Moved Permanently` yêu cầu chuyển hướng sang `https://`. Trình duyệt lại gửi HTTPS tới Proxy, Proxy lại chuyển thành HTTP tới Backend, tạo thành vòng lặp vô tận dẫn đến lỗi `ERR_TOO_MANY_REDIRECTS`.
- **Cách khắc phục**: Cấu hình Reverse Proxy gửi kèm `proxy_set_header X-Forwarded-Proto $scheme;`, đồng thời bật chế độ **Trusted Proxy** trên backend (ví dụ `server.forward-headers-strategy=native` trong Spring Boot hoặc `trusted_proxies` ở framework web) để backend nhận diện đúng giao thức gốc HTTPS của client.
</details>

### Câu Hỏi 12: Tại sao tắt `proxy_buffering off;` trong NGINX có thể gây cạn kiệt tài nguyên backend, và khi nào mới nên tắt tính năng này?

<details>
<summary>Đáp án</summary>

- **Nguy cơ khi tắt (`proxy_buffering off;`)**: Khi có client sử dụng mạng chậm hoặc chập chờn (slow client, ví dụ 3G/4G), Reverse Proxy buộc phải truyền dữ liệu đồng bộ từng byte một từ backend sang client. Điều này giữ chặt worker thread hoặc socket của backend server trong nhiều giây, khiến backend nhanh chóng cạn kiệt tài nguyên và tê liệt khi lượng truy cập tăng cao.
- **Khi nào nên tắt**: Chỉ nên tắt cho các luồng truyền tải dữ liệu thời gian thực đặc thù như **Server-Sent Events (SSE)** hoặc **WebSocket streaming**; còn lại luôn giữ `proxy_buffering on;`.
</details>

### Câu Hỏi 13: Khi đặt một bộ cân bằng tải Tầng 4 (L4 Load Balancer) chạy chế độ TLS Passthrough trước NGINX Reverse Proxy, vì sao IP thật của client bị mất và làm sao khắc phục?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân mất IP**: Ở chế độ **TLS Passthrough**, thiết bị L4 (như AWS NLB hoặc HAProxy mode TCP) truyền thẳng lưu lượng TCP đã mã hóa TLS mà không giải mã, do đó nó không thể đọc hoặc chèn các HTTP header như `X-Forwarded-For` hay `Forwarded`. Khi đến NGINX, socket TCP chỉ thấy `$remote_addr` là IP nội bộ của bộ cân bằng tải L4.
- **Giải pháp**: Kích hoạt **PROXY Protocol** (chuẩn L4 do HAProxy phát triển) trên L4 Load Balancer và bật chỉ thị `proxy_protocol` trên NGINX (`listen 443 ssl proxy_protocol;` kết hợp module `ngx_http_realip_module`). NGINX sẽ đọc khối thông tin IP tiền tố ở đầu phiên TCP trước khi giải mã TLS để khôi phục chính xác IP client.
</details>
