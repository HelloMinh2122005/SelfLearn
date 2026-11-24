# Review: 2_7_3 HTTP and HTTPS Basics

### Câu Hỏi 1: HTTP thuộc tầng nào trong mô hình mạng, hoạt động theo mô hình nào và đặc tính "Stateless" của nó có nghĩa là gì?

<details>
<summary>Đáp án</summary>

- **Tầng mạng**: HTTP (**Hypertext Transfer Protocol**) là giao thức **tầng ứng dụng (Application Layer)** nền tảng của World Wide Web.
- **Mô hình hoạt động**: Hoạt động theo mô hình **Client-Server Request/Response**, trong đó Client (User Agent) gửi thông điệp yêu cầu (Request) và Server (Origin) xử lý rồi gửi lại thông điệp phản hồi (Response).
- **Tính chất Stateless (Phi trạng thái)**: Các yêu cầu được xử lý độc lập theo mô hình Request/Response mà giao thức HTTP không tự lưu giữ trạng thái giữa các lần gửi nhận.

</details>

### Câu Hỏi 2: Cổng (port) mặc định và giao thức giao vận nền tảng của HTTP, HTTPS (HTTP/1.1, HTTP/2) và HTTP/3 là gì?

<details>
<summary>Đáp án</summary>

- **HTTP**: Chạy qua giao vận **TCP** trên cổng mặc định **TCP port 80**.
- **HTTPS (áp dụng cho HTTP/1.1 và HTTP/2)**: Chạy qua giao vận **TCP** với lớp mã hóa **TLS** trên cổng mặc định **TCP port 443**.
- **HTTP/3**: Chạy qua giao vận **QUIC** trên nền **UDP** tại cổng mặc định **UDP port 443**.

</details>

### Câu Hỏi 3: Một thông điệp HTTP/1.1 hoàn chỉnh gồm 4 thành phần nào theo thứ tự từ trên xuống?

<details>
<summary>Đáp án</summary>

Theo RFC 9112, thông điệp HTTP/1.1 gồm 4 thành phần tuần tự:
1. **Dòng khởi đầu (Start-line)**:
   - Phía Request là **Request-line**: `Method SP Request-Target SP HTTP-Version CRLF` (ví dụ: `GET /index.html HTTP/1.1\r\n`).
   - Phía Response là **Status-line**: `HTTP-Version SP Status-Code SP Reason-Phrase CRLF` (ví dụ: `HTTP/1.1 200 OK\r\n`).
2. **Các trường tiêu đề (Header Fields)**: Định dạng `Field-Name: Field-Value CRLF`.
3. **Dòng trống phân cách (Empty Line - CRLF)**: Một ký tự xuống dòng `\r\n` đứng độc lập, đánh dấu kết thúc phần Header.
4. **Thân bản tin (Message Body - tùy chọn)**: Chứa dữ liệu tải hữu ích (Payload) như JSON, HTML hoặc tệp nhị phân.

</details>

### Câu Hỏi 4: Trong HTTP Methods, tính chất "Safe" và "Idempotent" khác nhau như thế nào? Hãy liệt kê các method thuộc từng nhóm.

<details>
<summary>Đáp án</summary>

- **Safe (An toàn)**: Ngữ nghĩa về bản chất là **chỉ đọc (read-only)**, không gây thay đổi trạng thái trên máy chủ mục tiêu.
  - Các method Safe: `GET`, `HEAD`, `OPTIONS`, `TRACE`.
- **Idempotent (Lũy kế)**: Tác động của nhiều yêu cầu giống hệt nhau liên tiếp ($N \ge 1$) lên trạng thái máy chủ tương đương với tác động của một yêu cầu duy nhất.
  - Các method Idempotent: `GET`, `HEAD`, `OPTIONS`, `TRACE`, `PUT`, `DELETE`.
- **Mối quan hệ và ngoại lệ**:
  - Mọi method Safe mặc nhiên đều là Idempotent.
  - `PUT` và `DELETE` làm thay đổi trạng thái máy chủ nên **Không Safe**, nhưng vẫn là **Idempotent** vì gọi 1 lần hay $N$ lần đều cho cùng trạng thái cuối cùng.
  - `POST` và `PATCH` vừa **Không Safe** vừa **Không Idempotent** (Neither Safe nor Idempotent).

</details>

### Câu Hỏi 5: Tại sao `PUT` được coi là Idempotent còn `PATCH` lại được chuẩn hóa là Non-Idempotent?

<details>
<summary>Đáp án</summary>

- **`PUT` (Idempotent)**: Có ngữ nghĩa thay thế **toàn bộ** trạng thái tài nguyên đích bằng dữ liệu gửi kèm. Dù gửi 1 lần hay nhiều lần liên tiếp với cùng dữ liệu, trạng thái cuối cùng trên server vẫn giống nhau.
- **`PATCH` (Non-Idempotent)**: Dùng để cập nhật **một phần** tài nguyên (partial modification). Nội dung `PATCH` có thể chứa chỉ thị mang tính tích lũy như *"nối thêm chuỗi vào cuối văn bản"* hoặc *"tăng biến đếm thêm 1"*. Nếu gửi lại nhiều lần, mỗi lần đều làm thay đổi trạng thái thêm một lần nữa nên không đảm bảo tính lũy kế.

</details>

### Câu Hỏi 6: Ý nghĩa của ba mã trạng thái thành công phổ biến trong nhóm 2xx (`200 OK`, `201 Created`, `204 No Content`) là gì?

<details>
<summary>Đáp án</summary>

- **`200 OK`**: Yêu cầu đã xử lý thành công và kết quả được trả về trong phần thân bản tin (Message Body).
- **`201 Created`**: Yêu cầu hoàn thành và dẫn đến việc một hoặc nhiều tài nguyên mới được tạo thành công trên máy chủ.
- **`204 No Content`**: Yêu cầu được thực hiện thành công nhưng máy chủ không trả về nội dung payload nào trong phần thân (thường dùng sau `DELETE` hoặc cập nhật không cần trả dữ liệu).

</details>

### Câu Hỏi 7: Sự khác biệt quan trọng giữa cặp mã chuyển hướng `301`/`302` và `307`/`308` là gì?

<details>
<summary>Đáp án</summary>

- **`301 Moved Permanently` & `302 Found`**: Về mặt lịch sử, phần lớn client/trình duyệt thường tự ý **chuyển đổi phương thức từ `POST` sang `GET`** và loại bỏ phần Message Body khi truy cập URL mới.
- **`307 Temporary Redirect` & `308 Permanent Redirect`**: Theo RFC 9110, phương thức HTTP và thân yêu cầu (Body) **bắt buộc phải được giữ nguyên (MUST NOT be altered)** khi client chuyển hướng sang URL mới. Vì vậy, khi chuyển hướng các API `POST` có payload, bắt buộc phải dùng `307` hoặc `308`.

</details>

### Câu Hỏi 8: Hãy phân biệt mã lỗi `401 Unauthorized` và `403 Forbidden`, đồng thời nêu ý nghĩa của `400`, `404`, `405` và `429`.

<details>
<summary>Đáp án</summary>

- **`401 Unauthorized` vs `403 Forbidden`**:
  - **`401 Unauthorized`**: Lỗi **xác thực danh tính (Authentication)**. Client chưa cung cấp thông tin xác thực hợp lệ (như JWT, Cookie) hoặc thông tin đã hết hạn; server yêu cầu client chứng minh danh tính.
  - **`403 Forbidden`**: Lỗi **phân quyền (Authorization)**. Server đã xác thực thành công danh tính của client, nhưng client không có quyền truy cập tài nguyên đó (gửi lại thông tin đăng nhập không giúp thay đổi kết quả).
- **Các mã 4xx khác**:
  - **`400 Bad Request`**: Lỗi cú pháp từ phía client khiến server không thể hiểu hoặc xử lý yêu cầu.
  - **`404 Not Found`**: Server không tìm thấy tài nguyên khớp với URL được yêu cầu.
  - **`405 Method Not Allowed`**: Phương thức HTTP được server nhận diện nhưng không được hỗ trợ đối với tài nguyên chỉ định (ví dụ gửi `POST` tới endpoint chỉ cho `GET`).
  - **`429 Too Many Requests`**: Client gửi quá nhiều yêu cầu vượt hạn mức Rate Limiting; server thường kèm tiêu đề `Retry-After` để báo thời gian cần chờ trước khi thử lại.

</details>

### Câu Hỏi 9: Trong nhóm lỗi phía máy chủ 5xx, lỗi `502 Bad Gateway` và `504 Gateway Timeout` khác nhau ở điểm nào, và các mã `500`, `503` biểu thị điều gì?

<details>
<summary>Đáp án</summary>

- **`502 Bad Gateway`**: Reverse Proxy (Nginx, HAProxy, AWS ALB) kết nối được tới máy chủ upstream backend, nhưng backend trả về một **phản hồi không hợp lệ (Invalid response)** hoặc tiến trình backend bị sập (Crash / Out of Memory) và ngắt kết nối đột ngột (gửi gói TCP RST).
- **`504 Gateway Timeout`**: Reverse Proxy đã gửi yêu cầu tới backend nhưng backend xử lý quá lâu và **không phản hồi kịp** trong khoảng thời gian chờ cấu hình (Upstream read timeout) của proxy.
- **Các mã 5xx khác**:
  - **`500 Internal Server Error`**: Máy chủ gặp sự cố bất ngờ khiến nó không thể hoàn thành yêu cầu hợp lệ.
  - **`503 Service Unavailable`**: Máy chủ hiện không sẵn sàng xử lý yêu cầu do đang quá tải tạm thời hoặc đang bảo trì.

</details>

### Câu Hỏi 10: HTTPS sử dụng lớp mã hóa TLS để đảm bảo 3 tính chất bảo mật cốt lõi nào cho dữ liệu HTTP?

<details>
<summary>Đáp án</summary>

Lớp **TLS (Transport Layer Security)** trong HTTPS đảm bảo 3 tính chất:
1. **Bảo mật và Tính riêng tư (Confidentiality)**: Dữ liệu trao đổi được mã hóa bằng thuật toán mã hóa luồng đối xứng (Symmetric stream cipher) để ngăn chặn nghe lén (Eavesdropping / Packet sniffing).
2. **Tính toàn vẹn (Integrity)**: Dữ liệu được bảo vệ chống lại sự can thiệp hay sửa đổi trái phép trên đường truyền.
3. **Xác thực máy chủ (Server Authentication)**: Client xác thực danh tính thực sự của máy chủ qua chứng chỉ số và quy trình trao đổi khóa bất đối xứng, ngăn chặn tấn công giả mạo (Man-in-the-Middle).

</details>

### Câu Hỏi 11: Trong HTTP/1.1, cơ chế Persistent Connections (Keep-Alive) và Pipelining hoạt động ra sao, và vì sao Pipelining gây ra hiện tượng Application Head-of-Line (HoL) Blocking?

<details>
<summary>Đáp án</summary>

- **Persistent Connections (Keep-Alive)**: Mặc định được bật trong HTTP/1.1 để tái sử dụng một kết nối TCP cho nhiều cặp request/response liên tiếp mà không phải bắt tay đóng/mở lại nhiều lần.
- **Pipelining**: Cho phép client gửi liên tiếp nhiều request mà không cần đợi phản hồi của từng request trước đó.
- **Nguyên nhân Application HoL Blocking**: Quy chuẩn HTTP/1.1 bắt buộc server **phải trả phản hồi theo đúng thứ tự request được tiếp nhận**. Nếu request đầu tiên xử lý nặng tốn nhiều thời gian, mọi response phía sau dù đã xử lý xong vẫn bị chặn lại chờ đợi, gây nghẽn ở tầng ứng dụng.

</details>

### Câu Hỏi 12: HTTP/2 cải tiến gì so với HTTP/1.1 và tại sao HTTP/2 vẫn gặp hiện tượng TCP-level Head-of-Line Blocking?

<details>
<summary>Đáp án</summary>

- **Cải tiến của HTTP/2**:
  - Chuyển từ văn bản thuần sang tầng đóng khung nhị phân (**Binary Framing Layer**) với frame header cố định 9 bytes (chứa `Length`, `Type`, `Flags`, bit `R`, và `Stream Identifier`).
  - Hỗ trợ **Stream Multiplexing** (truyền xen kẽ nhiều request/response đồng thời trên 1 kết nối TCP duy nhất nhờ Stream ID), xóa bỏ Application HoL Blocking.
  - Nén tiêu đề bằng thuật toán **HPACK**.
- **Nguyên nhân TCP-level HoL Blocking**: Tất cả các stream đều đi chung trên **một kết nối TCP duy nhất**. Khi một gói tin TCP bị rơi (Packet Loss), tầng TCP phía nhận buộc phải giữ lại toàn bộ các gói tin đến sau trong bộ đệm để chờ truyền lại gói mất nhằm bảo toàn thứ tự byte. Hệ quả là **tất cả các stream đang truyền đồng thời đều bị đình trệ**, đặc biệt làm giảm hiệu năng trên mạng có tỷ lệ mất gói cao.

</details>

### Câu Hỏi 13: HTTP/3 khắc phục triệt để TCP-level Head-of-Line Blocking bằng cách nào?

<details>
<summary>Đáp án</summary>

- HTTP/3 từ bỏ TCP và chạy trên giao thức giao vận **QUIC** (nền tảng **UDP**), kết hợp cơ chế nén tiêu đề **QPACK**.
- QUIC thực hiện **khôi phục mất mát độc lập ở cấp độ từng luồng (Stream-level independent loss recovery)**.
- Khi một gói tin của một luồng cụ thể bị mất, chỉ duy nhất luồng đó bị tạm dừng để truyền lại, còn các luồng song song khác vẫn tiếp tục được giao thẳng lên tầng ứng dụng bình thường, loại bỏ hoàn toàn hiện tượng HoL Blocking ở cả tầng ứng dụng và tầng giao vận.

</details>

### Câu Hỏi 14: Trong thực hành với `curl`, các lệnh `curl -v`, `curl -I`, `curl --http2 -I`, và `curl --http3 -I` dùng để kiểm tra điều gì?

<details>
<summary>Đáp án</summary>

- **`curl -v <url>`**: Chế độ Verbose, hiển thị chi tiết quá trình kết nối TCP, toàn bộ dòng Request/Header gửi đi (`>`) và Status-line/Header/Body nhận về (`<`).
- **`curl -I <url>`**: Gửi phương thức Safe `HEAD` để chỉ lấy phần tiêu đề phản hồi (Headers) và mã trạng thái, bỏ qua phần Message Body nhằm tiết kiệm băng thông.
- **`curl --http2 -I <url>`**: Kích hoạt đàm phán giao thức tầng ứng dụng (**ALPN**) trong quá trình bắt tay TLS (TCP port 443) để thương lượng kết nối HTTP/2 (`h2`).
- **`curl --http3 -I <url>`**: Kiểm tra khả năng phục vụ HTTP/3 bằng cách khởi tạo kết nối QUIC qua **UDP port 443** (và quan sát trạng thái `HTTP/3` hoặc header quảng bá `alt-svc: h3=":443"`).

</details>

### Câu Hỏi 15: Trong thiết kế API và cấu hình hạ tầng thực tế (Production), cần lưu ý những quy tắc nào đối với `GET`, Automatic Retry cho `POST`/`PATCH`, và chuyển hướng API?

<details>
<summary>Đáp án</summary>

1. **Không dùng `GET` để thay đổi hoặc xóa dữ liệu**: Web Crawlers, Link Prefetching của trình duyệt và Proxy mặc định coi `GET` là phương thức Safe nên có thể tự động gọi và gây mất dữ liệu ngoài ý muốn. Mọi thao tác thay đổi trạng thái phải dùng `POST`, `PUT`, `DELETE` hoặc `PATCH`.
2. **Cẩn trọng khi cấu hình Automatic Retry**: Chỉ tự động retry ở tầng mạng đối với các phương thức **Idempotent** (`GET`, `PUT`, `DELETE`). Không tự động retry `POST` hoặc `PATCH` khi chưa có cơ chế chống trùng lặp (**Idempotency Key**) ở tầng ứng dụng, tránh gây xử lý lặp (như trừ tiền 2 lần).
3. **Chuyển hướng API giữ nguyên Method và Body**: Dùng `307` hoặc `308` thay vì `301`/`302` để tránh việc client chuyển `POST` thành `GET` và làm mất dữ liệu payload.

</details>
