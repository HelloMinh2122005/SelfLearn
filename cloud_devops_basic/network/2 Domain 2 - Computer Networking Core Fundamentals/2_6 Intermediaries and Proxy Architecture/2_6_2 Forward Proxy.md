# 2_6_2 Forward Proxy

> **Khóa học**: Cloud DevOps Basic — Networking Core  
> **Phân nhóm**: 2 Domain 2 - Computer Networking Core Fundamentals › 2_6 Intermediaries and Proxy Architecture  
> **Chủ đề**: Kiến trúc Forward Proxy phía Client: Kiểm soát lưu lượng thoát (Egress Filtering), Forward Caching, Đường hầm HTTPS qua HTTP CONNECT và TLS Forward Inspection  
> **Trạng thái**: Draft (WRITE-CDB-2_6_2, 14-11-2026)  
> **Checklist đối chiếu**: [2_6_2](<../../../CHECKLIST.md#domain-2-computer-networking-core-fundamentals-43-items>)  

---

## 1. Khái Niệm Cốt Lõi & Bản Chất Kỹ Thuật (Core Concepts & Technical Deep Dive)

Trong kiến trúc liên mạng và các mô hình trung gian mạng (Network Intermediaries), **Forward Proxy** (thường được gọi ngắn gọn là Proxy hoặc Client-Side Proxy) là một thành phần kiến trúc kinh điển được triển khai tại ranh giới kết nối mạng của phía người dùng nhằm đại diện cho các máy trạm nội bộ giao tiếp với mạng Internet công cộng.

```
+------------------------------------+           +---------------+           +--------------------+
|        Private Client LAN          |           |    Egress     |           |  Public Internet   |
|                                    |           |   Boundary    |           |                    |
|  [Client A] (10.0.1.15)            |           |               |           |                    |
|             \                      |           |               |           |                    |
|  [Client B] ---> [Forward Proxy] --+==========>|  [Firewall]   |==========>|  [Origin Servers]  |
|  (10.0.1.16)     (10.0.1.2:3128)   | Outbound  | (Public IP)   | Outbound  |  (example.com)     |
|             /                      |  Traffic  |               |  Traffic  |                    |
|  [Client C] (10.0.1.17)            |           |               |           |                    |
+------------------------------------+           +---------------+           +--------------------+
```

### 1.1 Định Nghĩa và Vị Trí Triển Khai (Egress Boundary)

Theo tài liệu [MDN Web Docs — Proxies Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview#proxies) và đặc tả [RFC 9110 Section 3.7](https://datatracker.ietf.org/doc/html/rfc9110#section-3.7):
- **Đại diện phía Client**: Forward Proxy là máy chủ trung gian đóng vai trò thay mặt cho một máy khách (client) hoặc một nhóm các máy khách thuộc mạng nội bộ. Khi một client trong mạng muốn truy cập tài nguyên trên Internet, nó không gửi yêu cầu trực tiếp tới máy chủ đích (origin server) mà gửi yêu cầu tới Forward Proxy. Proxy sẽ tiếp nhận yêu cầu, xử lý và tạo một kết nối mới thay mặt client tới máy chủ đích.
- **Vị trí ranh giới thoát (Egress Perimeter)**: Forward Proxy luôn được đặt tại ranh giới thoát (egress boundary) của mạng nội bộ—nằm giữa các máy trạm văn phòng / cụm máy chủ nội bộ và mạng Internet bên ngoài. Mọi lưu lượng truy cập đi ra ngoài (outbound traffic) đều có thể được ép buộc đi qua điểm kiểm soát duy nhất này.

---

### 1.2 Phân Loại: Explicit Proxy vs Transparent (Interception) Proxy

Dựa vào cách thức chuyển tiếp lưu lượng từ client đến proxy, hệ thống được phân thành hai cơ chế kiến trúc:

| Tiêu chí | Explicit Proxy (Proxy tường minh) | Transparent / Interception Proxy (Proxy trong suốt) |
| :--- | :--- | :--- |
| **Nhận thức của Client** | Client nhận biết hoàn toàn sự tồn tại của proxy. | Client hoàn toàn **không** biết có sự can thiệp của proxy. |
| **Cấu hình trên Client** | Bắt buộc cấu hình: IP/Port trong hệ điều hành, trình duyệt, file cấu hình PAC (`FindProxyForURL`), hoặc biến môi trường shell. | **Không** yêu cầu bất kỳ cấu hình nào trên thiết bị client. |
| **Dòng gói tin mạng** | Gói tin TCP được client gửi trực tiếp tới IP và Port của proxy (ví dụ: `10.0.1.2:3128`). IP đích ở L3 là IP của proxy. | Gói tin IP được client gửi tới IP của server đích trên Internet (cổng 80/443). Router/Firewall trên đường đi đánh chặn gói tin. |
| **Cơ chế chuyển hướng** | Ứng dụng client tự đóng gói HTTP request với request-target ở dạng absolute-URI. | Router hoặc Gateway mạng sử dụng kỹ thuật chuyển hướng định tuyến (Policy Routing / NAT REDIRECT) để đẩy gói vào proxy. |
| **Đặc tả tiêu chuẩn** | [RFC 9110 Section 3.7](https://datatracker.ietf.org/doc/html/rfc9110#section-3.7) & [RFC 7230](https://datatracker.ietf.org/doc/html/rfc7230) | [RFC 9110 Section 3.7](https://datatracker.ietf.org/doc/html/rfc9110#section-3.7) & [RFC 3040 Section 2.5](https://datatracker.ietf.org/doc/html/rfc3040#section-2.5) |

- **Cấu hình PAC (Proxy Auto-Configuration) & WPAD (Web Proxy Auto-Discovery)**: Trong mô hình Explicit Proxy doanh nghiệp, file PAC chứa hàm JavaScript chuẩn `FindProxyForURL(url, host)` giúp trình duyệt tự động tính toán URL nào đi qua proxy nào, hoặc URL nào đi trực tiếp (`DIRECT`). Giao thức WPAD (Web Proxy Auto-Discovery Protocol, theo [IETF draft-ietf-wrec-wpad](https://datatracker.ietf.org/doc/draft-ietf-wrec-wpad/) và danh bạ [IANA BOOTP/DHCP Parameters](https://www.iana.org/assignments/bootp-dhcp-parameters/bootp-dhcp-parameters.xhtml) Option 252) cho phép máy trạm tự động phát hiện và tải về file cấu hình PAC thông qua DHCP Option 252 hoặc truy vấn DNS (tìm hostname `wpad.<domain>`).
- **Cơ chế Interception Proxy (Transparent Proxy)**: Theo [RFC 3040 Section 2.5](https://datatracker.ietf.org/doc/html/rfc3040#section-2.5) và [RFC 9110 Section 3.7](https://datatracker.ietf.org/doc/html/rfc9110#section-3.7), một *interception proxy* đánh chặn luồng truyền thông tại tầng mạng/tầng giao vận mà không có sự thỏa thuận tường minh của client. Cổng mạng mặc định (default gateway) kiểm tra cổng TCP đích, nếu là 80 thì áp dụng quy tắc chuyển hướng cổng cục bộ đưa vào daemon proxy xử lý.

---

### 1.3 Bốn Trường Hợp Sử Dụng Trọng Yếu Trong Mạng Doanh Nghiệp

1. **Lọc Lưu Lượng Thoát (Corporate Egress Filtering & Access Control)**:
   - Doanh nghiệp thiết lập danh sách trắng (whitelisting) hoặc danh sách đen (blacklisting) các tên miền và URL. Forward Proxy phân tích phần đầu HTTP Request và chặn các yêu cầu truy cập vào mạng xã hội, trang web độc hại, cờ bạc hoặc các dịch vụ lưu trữ ngoài tầm kiểm soát của tổ chức.
2. **Kiểm Soát Thất Thoát Dữ Liệu & Rà Soát Mã Độc (Data Loss Prevention - DLP & Malware Scanning)**:
   - Proxy kiểm tra nội dung tải lên (outbound payload) để ngăn chặn nhân viên vô tình hay cố ý gửi dữ liệu nhạy cảm (thông tin thẻ tín dụng, mã nguồn nội bộ, danh sách khách hàng) ra các dịch vụ ngoài Internet. Đồng thời rà quét các tệp tải về từ Internet để phát hiện virus trước khi tệp đến máy trạm.
3. **Bộ Đệm Chuyển Tiếp Tiết Kiệm Băng Thông WAN (Forward Caching)**:
   - Khi hàng ngàn nhân viên hoặc máy chủ CI/CD cùng tải về một bản cập nhật hệ điều hành hoặc gói thư viện ngoài Internet, Forward Proxy lưu bản sao (cache) của tài nguyên tĩnh trên đĩa cứng cục bộ. Các yêu cầu tiếp theo được phục vụ trực tiếp từ bộ nhớ đệm nội bộ với độ trễ cực thấp và không tiêu tốn băng thông đường truyền quốc tế.
4. **Bảo Vệ Danh Tính & Ẩn Địa Chỉ IP Client (Client Anonymity & IP Masking)**:
   - Máy chủ gốc (origin server) trên Internet chỉ nhìn thấy địa chỉ IP công cộng của cổng Forward Proxy/NAT Gateway, hoàn toàn không biết được địa chỉ IP riêng (`10.x.x.x` hoặc `192.168.x.x`) hay cấu trúc mạng nội bộ phía sau.

---

### 1.4 Cơ Chế Đường Hầm HTTPS Qua Phương Thức `HTTP CONNECT`

Giao thức HTTPS mã hóa toàn bộ dữ liệu từ đầu cuối đến đầu cuối (end-to-end) bằng TLS, bao gồm cả thanh ghi đường dẫn URL và HTTP headers. Do đó, Forward Proxy thông thường không thể đọc được nội dung gói tin HTTP để định tuyến như đối với HTTP thuần.

Để giải quyết vấn đề này, chuẩn [RFC 9110 Section 9.3.6](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.6) định nghĩa phương thức **`HTTP CONNECT`** nhằm thiết lập một đường hầm truyền tải nhị phân mù (Blind TCP Tunnel):

```text
Client                        Forward Proxy                      Origin Server (443)
  |                                 |                                    |
  |--- 1. TCP Handshake ----------->|                                    |
  |<-- TCP Established ------------>|                                    |
  |                                 |                                    |
  |--- 2. CONNECT api.ext:443 ----->|                                    |
  |       Host: api.ext:443         |--- 3. TCP Handshake -------------->|
  |                                 |<-- TCP Established --------------->|
  |<-- 4. HTTP/1.1 200 ------------ |                                    |
  |       Connection Established    |                                    |
  |                                 |                                    |
  |=== 5. TLS Client Hello =============================================>| (Blind forwarded)
  |<== 6. TLS Server Hello + Cert =======================================| (Blind forwarded)
  |=== 7. Encrypted Application Data (HTTP/2 / HTTP/1.1) ===============>| (Raw byte streaming)
```

Quy trình kỹ thuật diễn ra qua các bước chính xác:
1. **Thiết lập kết nối với Proxy**: Client khởi tạo bắt tay 3 bước TCP tới Forward Proxy (ví dụ cổng 3128).
2. **Yêu cầu mở đường hầm (`CONNECT`)**: Client gửi một chuỗi request-target dạng `authority-form`:
   ```http
   CONNECT api.example.com:443 HTTP/1.1
   Host: api.example.com:443
   User-Agent: curl/8.5.0
   ```
3. **Mở kết nối Outbound tới Origin**: Nhận được chỉ thị, Forward Proxy phân giải DNS tên miền `api.example.com` và thực hiện bắt tay TCP 3 bước trực tiếp tới cổng 443 của máy chủ đích.
4. **Phản hồi thiết lập thành công (`200 Connection Established`)**:
   - Khi kết nối TCP với máy chủ đích hoàn tất, proxy phản hồi về cho client mã trạng thái `200 (Connection Established)`.
   - **Quy tắc bắt buộc theo RFC 9110 §9.3.6**: Phản hồi 2xx cho phương thức `CONNECT` **tuyệt đối không được gửi kèm header `Content-Length` hoặc `Transfer-Encoding`**. Ngay sau ký tự phân cách ranh giới header `CRLF` (`\r\n\r\n`), proxy lập tức chuyển sang chế độ truyền luồng mù (tunnel mode).
5. **Truyền dẫn nhị phân mù (Blind Byte Forwarding)**:
   - Từ thời điểm này, Forward Proxy từ bỏ vai trò xử lý HTTP. Proxy hoạt động như một bộ nối dây mạng (byte-shoveler / TCP relay), đọc bất kỳ byte nhị phân nào từ socket của client và ghi nguyên vẹn sang socket của origin server, và ngược lại.
   - Client bắt đầu quy trình bắt tay TLS (`Client Hello`, trao đổi chứng chỉ, mã hóa khóa phiên) trực tiếp với origin server xuyên qua đường hầm. Proxy hoàn toàn không đọc, không ghi và không sửa đổi nội dung đã được mã hóa.

---

### 1.5 Cơ Chế Xác Thực Proxy (`407 Proxy Authentication Required`)

Trong các môi trường bảo mật, không phải người dùng nào trên mạng nội bộ cũng được cấp quyền truy cập Internet ra ngoài. [RFC 9110 Section 15.5.8 & Section 11.7.1](https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.8) định nghĩa giao thức xác thực riêng biệt giữa Client và Proxy:

1. Khi client gửi một yêu cầu HTTP thông thường hoặc yêu cầu `CONNECT` mà chưa có thông tin xác thực, proxy từ chối xử lý và gửi trả:
   ```http
   HTTP/1.1 407 Proxy Authentication Required
   Proxy-Authenticate: Basic realm="Corporate Forward Proxy"
   Connection: close
   ```
2. Client xử lý thách thức (challenge) bằng cách gửi lại yêu cầu kèm header `Proxy-Authorization`:
   ```http
   CONNECT api.example.com:443 HTTP/1.1
   Host: api.example.com:443
   Proxy-Authorization: Basic dXNlcjE6c2VjcmV0MTIz
   ```
3. **Đặc tính Hop-by-Hop**: Header `Proxy-Authenticate` và `Proxy-Authorization` là các trường thông tin điều khiển hop-by-hop. Forward Proxy xử lý và xóa bỏ hoàn toàn các trường này trước khi chuyển tiếp gói tin, đảm bảo thông tin xác thực proxy không bao giờ rò rỉ tới máy chủ đích trên Internet.

---

### 1.6 SSL/TLS Forward Inspection (TLS Interception Trong Mạng Doanh Nghiệp)

Mặc dù đường hầm `HTTP CONNECT` bảo vệ tuyệt đối tính riêng tư giữa client và origin server, cơ chế này vô tình tạo ra một "điểm mù" lớn cho an ninh doanh nghiệp: mã độc tống tiền (ransomware) hoặc gián điệp nội bộ có thể lợi dụng đường truyền HTTPS đã mã hóa để chuyển dữ liệu mật ra ngoài hoặc tải mã độc về mà tường lửa không thể phát hiện.

Để khắc phục, các thiết bị bảo mật thế hệ mới (Next-Generation Firewall - NGFW như Palo Alto, Fortinet hoặc Azure Firewall Premium) áp dụng kỹ thuật **SSL/TLS Forward Inspection** (còn gọi là SSL Forward Interception hoặc Man-in-the-Middle được ủy quyền):

```
+----------+                     +-------------------------------+                     +---------------+
|  Client  |                     | Enterprise Firewall / Proxy   |                     | Origin Server |
+----------+                     +-------------------------------+                     +---------------+
     |                                          |                                              |
     |--- 1. Client Hello (TLS) --------------->|                                              |
     |                                          |--- 2. Upstream Client Hello (TLS) ---------->|
     |                                          |<-- 3. Origin Server Certificate & Keys ------|
     |                                          |    (Origin Cert verified against Public CAs) |
     |                                          |                                              |
     |                                  [Generate Dynamic]                                     |
     |                                  [Cert on-the-fly ]                                     |
     |                                  [Signed by Ent-CA]                                     |
     |                                          |                                              |
     |<-- 4. Dynamic Cert (Signed by Ent-CA) ---|                                              |
     |<-- 5. Complete Client TLS Leg ----------->                                              |
     |    (Client Trust Store trusts Ent-CA)    |<-- 6. Complete Upstream TLS Leg ------------>|
     |                                          |                                              |
     |=== 7. Plaintext Request (inside TLS 1) =>| [Payload Inspected: DLP, Antivirus, Rules]   |
     |                                          |=== 8. Re-encrypted Request (inside TLS 2) ==>|
```

Quy trình giải mã và tái mã hóa diễn ra như sau:
1. **Cài đặt chứng chỉ gốc nội bộ (Enterprise Root CA)**: Bộ phận quản trị mạng cài đặt sẵn một chứng chỉ CA riêng của doanh nghiệp vào kho lưu trữ chứng chỉ tin cậy (Trust Store) trên toàn bộ máy trạm nội bộ (thông qua Group Policy trên Windows hoặc Puppet/Ansible trên Linux).
2. **Đánh chặn và tách rời 2 phiên TLS**: Khi client khởi tạo TLS, thiết bị tường lửa/proxy chặn kết nối này lại:
   - **Phiên 1 (Upstream Leg)**: Proxy đóng vai trò là một client độc lập, thực hiện bắt tay TLS với origin server thật ngoài Internet, xác thực tính hợp lệ của chứng chỉ công cộng từ máy chủ đích.
   - **Tạo chứng chỉ giả lập tức thời (On-the-fly Dynamic Certificate Generation)**: Proxy đọc thông tin trường Subject và Subject Alternative Names (SAN) từ chứng chỉ thật của origin server, sau đó tự sinh ra một chứng chỉ mới mang đúng tên miền đó nhưng được ký bởi **Enterprise Root CA** nội bộ của công ty.
   - **Phiên 2 (Client Leg)**: Proxy gửi chứng chỉ vừa sinh cho client. Do client đã tin tưởng Enterprise Root CA từ trước, trình duyệt và hệ điều hành xác nhận kết nối TLS an toàn màu xanh mà không đưa ra bất kỳ cảnh báo lỗi chứng chỉ nào.
3. **Kiểm tra an ninh toàn diện (Full Payload Inspection)**: Dữ liệu từ client gửi lên được proxy giải mã thành dữ liệu bản rõ (plaintext HTTP), rà quét qua các bộ lọc DLP, chống rò rỉ mã nguồn và phát hiện virus. Sau khi đảm bảo dữ liệu sạch và an toàn, proxy mã hóa lại dữ liệu đó qua phiên TLS thứ hai để gửi tới origin server.

---

## 2. Ví Dụ Đời Sống Thực Tế Dễ Hiểu (Intuitive Real-World Analogies)

### 2.1 Vị Luật Sư Đại Diện Hoặc Trợ Lý Công Ty Đi Mua Hàng

Để hình dung bản chất của Forward Proxy, hãy liên tưởng tới **vị luật sư đại diện** của một tập đoàn lớn:

```
+-----------------------------------------------------------------------------------------------+
| ĐỜI THỰC:                                                                                     |
| Thân chủ (Client)  --->  Luật sư đại diện (Forward Proxy)  --->  Người bán đất (Origin Server) |
|                                                                                               |
| * Người bán đất chỉ làm việc với luật sư, nhận tiền từ tài khoản của văn phòng luật sư.       |
| * Người bán đất hoàn toàn không biết thân chủ đứng sau là tỷ phú hay nhân vật nào.             |
+-----------------------------------------------------------------------------------------------+
```

1. **Bảo vệ danh tính (Client Anonymity)**: Bạn muốn mua một mảnh đất kinh doanh giá trị nhưng không muốn người bán biết danh tính thật của mình (vì biết bạn là đại gia họ sẽ nâng giá). Bạn ủy quyền cho một vị luật sư đi giao dịch. Người bán chỉ thấy vị luật sư, ký hợp đồng với vị luật sư và nhận tiền từ văn phòng luật sư. Vị luật sư ở đây đóng vai trò chính xác là một **Forward Proxy**, bảo vệ và che giấu danh tính máy khách trước thế giới bên ngoài.
2. **Kiểm soát quy tắc nội bộ (Corporate Policy & Egress Filtering)**: Nếu công ty bạn cử một trợ lý đi mua văn phòng phẩm, công ty giao kèm một cuốn sổ quy định: *"Chỉ được mua sách chuyên môn và bút viết; tuyệt đối không mua đồ chơi, vé xem phim hoặc đồ uống có cồn"*. Khi nhân viên nộp yêu cầu mua hàng, trợ lý xem xét danh mục. Nếu yêu cầu là sách công nghệ, trợ lý đi mua; nếu là đồ cấm, trợ lý bác bỏ ngay tại văn phòng. Đó chính là chức năng **Lọc lưu lượng thoát (Egress Filtering)**.
3. **Đường hầm niêm phong (`HTTP CONNECT`)**: Khi thân chủ muốn gửi một hòm tài liệu tối mật có khóa mã số đến ngân hàng Thụy Sĩ (tương tự phiên HTTPS): Thân chủ đóng hòm, khóa số lại và đưa cho luật sư. Luật sư đem chiếc vali nguyên seal đó giao tận tay ngân hàng mà không có chìa mở và không thể đọc trộm. Đây là luồng **Blind Byte Forwarding** của phương thức `CONNECT`.
4. **Kiểm tra an ninh nội bộ (SSL Forward Inspection)**: Nếu bạn là điệp viên làm việc trong cơ quan tình báo, quy chế cơ quan bắt buộc mọi tài liệu gửi ra ngoài dù niêm phong đều phải qua phòng kiểm duyệt. Bạn phải nộp sẵn chìa khóa phụ (Enterprise Root CA) cho bộ phận kiểm duyệt. Trước khi chuyển thư ra ngoài, thanh tra mở khóa xem bạn có gửi tài liệu phản quốc hay không, kiểm tra xong họ khóa hòm lại bằng một ổ khóa chuẩn rồi mới gửi đi.

---

## 3. Kiến Trúc, Luồng Hoạt Động & Hình Ảnh Trực Quan (Architecture, Diagrams & Visual Media)

### 3.1 Luồng Xử Lý Explicit Proxy vs Transparent Proxy Tại Egress Firewall

Sơ đồ thể hiện sự khác biệt trong đường đi của gói tin giữa cấu hình tường minh và chuyển hướng mạng:

```mermaid
flowchart TD
    subgraph LAN["Mạng Cục Bộ Doanh Nghiệp (Internal LAN)"]
        ClientExplicit["Client A (Cấu hình Proxy tường minh)<br/>Gửi gói tin TCP tới IP: 10.0.1.2:3128"]
        ClientTrans["Client B (Không cấu hình Proxy)<br/>Gửi gói tin TCP thẳng tới IP Internet: 93.184.216.34:80"]
    end

    subgraph GW["Biên Giới Mạng Thoát (Egress Gateway / Router)"]
        FWRouter{"Bộ Định Tuyến / Tường Lửa"}
        NATRedirect["iptables / NAT Rule:<br/>REDIRECT dport 80 -> localhost:3128"]
    end

    subgraph ProxyNode["Forward Proxy Node (Squid / Envoy)"]
        ProxyProcess["Tiến trình Proxy (Cổng 3128)<br/>- Xác thực người dùng (407)<br/>- Kiểm tra URL Filtering<br/>- Kiểm tra Forward Cache"]
    end

    subgraph Internet["Public Internet"]
        OriginHost["Máy Chủ Gốc (Origin Server)<br/>example.com"]
    end

    ClientExplicit -->|1. Trực tiếp tới IP Proxy| ProxyProcess
    ClientTrans -->|2. Đi qua Default Gateway| FWRouter
    FWRouter -->|3. Đánh chặn luồng port 80| NATRedirect
    NATRedirect -->|4. Chuyển hướng nội bộ| ProxyProcess

    ProxyProcess -->|5. Kiểm tra Cache Miss & Outbound Egress| OriginHost
```

---

### 3.2 Luồng Bắt Tay Đường Hầm HTTPS (`HTTP CONNECT Tunneling`)

Tuần tự chi tiết quá trình bắt tay theo [RFC 9110 Section 9.3.6](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.6):

```mermaid
sequenceDiagram
    autonumber
    actor Client as Máy Khách (Client)
    participant Proxy as Forward Proxy (:3128)
    participant Origin as Máy Chủ Gốc HTTPS (:443)

    Note over Client,Proxy: Giai đoạn 1: Thiết lập TCP tới Proxy
    Client->>Proxy: SYN
    Proxy-->>Client: SYN-ACK
    Client->>Proxy: ACK

    Note over Client,Proxy: Giai đoạn 2: Yêu cầu mở đường hầm
    Client->>Proxy: CONNECT example.com:443 HTTP/1.1<br/>Host: example.com:443
    
    Note over Proxy,Origin: Giai đoạn 3: Proxy mở kết nối tới Origin
    Proxy->>Origin: SYN
    Origin-->>Proxy: SYN-ACK
    Proxy->>Origin: ACK

    Note over Client,Proxy: Giai đoạn 4: Xác nhận đường hầm sẵn sàng
    Proxy-->>Client: HTTP/1.1 200 Connection Established<br/>(Không có Content-Length hoặc Transfer-Encoding)

    Note over Client,Origin: Giai đoạn 5: Chế độ Blind Byte Tunnel (TLS End-to-End)
    Client->>Proxy: TLS Client Hello
    Proxy->>Origin: Chuyển tiếp nguyên vẹn byte TLS Client Hello
    Origin->>Proxy: TLS Server Hello + Certificate + Key Exchange
    Proxy->>Client: Chuyển tiếp nguyên vẹn byte TLS Certificate
    Client->>Origin: Hoàn tất bắt tay TLS & Gửi Application Data (Mã hóa)
    Origin->>Client: Phản hồi Application Data (Mã hóa qua Proxy)
```

---

## 4. Thực Hành (Hands-on)

### Bài Thực Hành 1: Thiết Lập Biến Môi Trường Proxy Trên Linux & Kiểm Tra Với cURL

Trong hệ điều hành Linux và môi trường container/DevOps, các công cụ dòng lệnh (CLI) như `curl`, `wget`, `apt`, `git`, `docker` tuân thủ các biến môi trường chuẩn để xác định Forward Proxy.

#### 1. Các biến môi trường proxy tiêu chuẩn

```bash
# Thiết lập proxy cho lưu lượng HTTP không mã hóa (chữ thường strictly lowercase)
export http_proxy="http://10.0.1.2:3128"

# Thiết lập proxy cho lưu lượng bảo mật HTTPS
export https_proxy="http://10.0.1.2:3128"

# Thiết lập proxy cho toàn bộ giao thức (kể cả FTP, SOCKS)
export all_proxy="socks5://10.0.1.2:1080"

# Thiết lập danh sách các domain và IP nội bộ KHÔNG đi qua proxy (bypass list)
# Hỗ trợ phân cách dấu phẩy, tiền tố wildcard '*', và dải mạng CIDR (từ curl 7.86.0+)
export no_proxy="localhost,127.0.0.1,10.0.0.0/8,.internal.corp.com"
```

#### 2. Kiểm tra truy vấn HTTP qua Forward Proxy tường minh

Chạy lệnh `curl` với cờ chỉ định proxy `-x` (`--proxy`):

```bash
curl -v -x http://10.0.1.2:3128 http://example.com/index.html
```

> 💡 Minh họa output lệnh thực tế (Illustrative output):
```text
*   Trying 10.0.1.2:3128...
* Connected to 10.0.1.2 (10.0.1.2) port 3128
> GET http://example.com/index.html HTTP/1.1
> Host: example.com
> User-Agent: curl/8.5.0
> Accept: */*
> Proxy-Connection: Keep-Alive
> 
< HTTP/1.1 200 OK
< Date: Sat, 14 Nov 2026 08:15:30 GMT
< Content-Type: text/html; charset=UTF-8
< Content-Length: 1256
< Server: ECS (dcb/7F3A)
< X-Cache: HIT from corporate-forward-proxy
< Via: 1.1 corporate-forward-proxy (squid/5.7)
< Connection: keep-alive
< 
<!doctype html>
<html>
<head>
    <title>Example Domain</title>
...
```

*Phân tích chi tiết*:
- Client kết nối tới `10.0.1.2:3128` (địa chỉ của proxy) thay vì kết nối tới địa chỉ IP của `example.com`.
- Dòng request-target được định dạng ở dạng URL tuyệt đối (`GET http://example.com/index.html HTTP/1.1`) theo đúng chuẩn HTTP proxy request.
- Header `Via: 1.1 corporate-forward-proxy (squid/5.7)` xác nhận lưu lượng đã đi qua một trung gian theo [RFC 9110 Section 7.6.3](https://datatracker.ietf.org/doc/html/rfc9110#section-7.6.3).
- Header `X-Cache: HIT` thể hiện tài nguyên được lấy trực tiếp từ bộ đệm của Forward Proxy, giúp tiết kiệm đường truyền ra ngoài.

---

### Bài Thực Hành 2: Kiểm Tra Đường Hầm HTTPS `HTTP CONNECT` & Xác Thực 407

Sử dụng cờ `-p` (`--proxytunnel`) và cờ `-U` (`--proxy-user`) để kiểm tra quy trình xác thực và mở đường hầm nhị phân qua proxy:

```bash
# Thực hiện gọi HTTPS qua proxy có yêu cầu tài khoản người dùng
curl -v -p \
  -x http://10.0.1.2:3128 \
  --proxy-user admin:SecretPassword123 \
  https://httpbin.org/get
```

> 💡 Minh họa output lệnh thực tế (Illustrative output):
```text
*   Trying 10.0.1.2:3128...
* Connected to 10.0.1.2 (10.0.1.2) port 3128
* Allocate normal family IPv4 for httpbin.org
* establish tunnel to httpbin.org:443
> CONNECT httpbin.org:443 HTTP/1.1
> Host: httpbin.org:443
> User-Agent: curl/8.5.0
> Proxy-Connection: Keep-Alive
> Proxy-Authorization: Basic YWRtaW46U2VjcmV0UGFzc3dvcmQxMjM=
> 
< HTTP/1.1 200 Connection Established
< 
* Proxy replied 200 to CONNECT request
* CONNECT phase completed!
* ALPN: curl offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, [certificate verified]
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* Server certificate:
*  subject: CN=httpbin.org
*  start date: Oct 10 00:00:00 2026 GMT
*  expire date: Jan 10 23:59:59 2027 GMT
*  issuer: C=US; O=Let's Encrypt; CN=R3
> GET /get HTTP/1.1
> Host: httpbin.org
> User-Agent: curl/8.5.0
> Accept: */*
> 
< HTTP/1.1 200 OK
< Date: Sat, 14 Nov 2026 08:16:02 GMT
< Content-Type: application/json
< Content-Length: 260
...
{
  "args": {}, 
  "headers": {
    "Accept": "*/*", 
    "Host": "httpbin.org"
  }, 
  "origin": "203.0.113.88"
}
```

*Phân tích chi tiết*:
- Lệnh `CONNECT httpbin.org:443 HTTP/1.1` gửi kèm thông tin đăng nhập trong header `Proxy-Authorization: Basic ...`.
- Sau khi proxy xác thực thành công và nối TCP với server đích, nó trả về dòng trắng `HTTP/1.1 200 Connection Established` (không chứa body).
- Ngay lập tức, `curl` bắt đầu quy trình trao đổi chứng chỉ `TLSv1.3 Client hello` trực tiếp với `httpbin.org`.
- Giá trị `"origin": "203.0.113.88"` trong phản hồi của máy chủ gốc chứng minh rằng server chỉ ghi nhận địa chỉ IP công cộng của Forward Proxy, địa chỉ IP máy trạm nội bộ của client hoàn toàn được ẩn danh.

---

### Bài Thực Hành 3: Cấu Hình Chuyển Hướng Trong Suốt (Transparent Redirection) Bằng Linux `iptables`

Trong mô hình Transparent Proxy, máy chủ đóng vai trò Gateway của mạng LAN sẽ chuyển hướng gói tin mà client không cần cài đặt proxy.

> ⚠️ Chưa chạy thử (not executed by the squad) - Yêu cầu môi trường Linux Gateway có quyền `root` và kích hoạt tính năng IP Forwarding.

```bash
# 1. Kích hoạt tính năng chuyển tiếp gói tin (IP Forwarding) trong nhân Linux
echo 1 > /proc/sys/net/ipv4/ip_forward

# 2. Định tuyến các gói tin HTTP cổng 80 đi ngang qua Gateway chuyển thẳng vào cổng proxy Squid (3128)
# Sử dụng bảng NAT, chuỗi PREROUTING và mục tiêu REDIRECT
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3128

# 3. Cho phép gói tin đã được chuyển hướng đi vào giao diện cục bộ
iptables -A INPUT -p tcp --dport 3128 -j ACCEPT

# 4. Kiểm tra danh sách luật iptables đã nạp
iptables -t nat -L PREROUTING -n -v --line-numbers
```

---

## 5. Cạm Bẫy Thực Tế & Thực Tiễn Sản Xuất (Production Gotchas & Best Practices)

### Cạm Bẫy 1: Lỗ Hổng Bảo Mật `httpoxy` (CVE-2016-5385) & Quy Chuẩn Chữ Hoa/Thường

- **Nguyên nhân cốt lõi**: Trong kiến trúc Web CGI (Common Gateway Interface) truyền thống hoặc các ứng dụng PHP/Python/Go cũ, Web Server chuyển đổi toàn bộ tiêu đề HTTP Request nhận được từ client thành các biến môi trường có tiền tố `HTTP_`.
- **Cơ chế tấn công**: Nếu một kẻ tấn công gửi một HTTP Request chứa header độc hại:
  ```http
  Proxy: http://attacker-malicious-proxy.com:8080
  ```
  Web Server tự động tạo ra biến môi trường `HTTP_PROXY="http://attacker-malicious-proxy.com:8080"`. Nếu ứng dụng backend sau đó sử dụng thư viện HTTP client (như Guzzle, Python requests, curl) đọc biến `HTTP_PROXY`, toàn bộ các request nội bộ của server sẽ bị chuyển hướng sang máy chủ của tin tặc!
- **Thực tiễn phòng tránh**:
  - Theo tài liệu chính thức từ [curl manpage](https://curl.se/docs/manpage.html), các công cụ bảo mật hiện đại luôn ưu tiên đọc biến môi trường **`http_proxy` viết thường**. Trong môi trường CGI, biến chữ hoa `HTTP_PROXY` hoàn toàn bị vô hiệu hóa.
  - Trên các hệ thống Linux, luôn định nghĩa biến môi trường ở dạng chữ thường: `export http_proxy=...` và `export https_proxy=...`.

---

### Cạm Bẫy 2: Lỗi Vỡ Kết Nối Khi Kích Hoạt SSL Forward Inspection (Certificate Pinning & HSTS)

- **Vấn đề**: Khi bật tính năng giải mã SSL Forward Inspection trên tường lửa doanh nghiệp, proxy tự động tạo ra chứng chỉ mới ký bởi Enterprise Root CA. Mặc dù trình duyệt web chấp nhận nếu Root CA đã được nạp vào OS Trust Store, hàng loạt ứng dụng chuyên biệt của lập trình viên sẽ bị lỗi kết nối hàng loạt:
  - Các công cụ CLI như `git`, `curl`, `npm`, `pip`, `docker` không sử dụng kho chứng chỉ của hệ điều hành mà sử dụng tệp bundle chứng chỉ riêng (thường dựa trên Mozilla CA Bundle). Khi thấy chứng chỉ do Enterprise CA ký, chúng lập tức báo lỗi: `SSL certificate problem: unable to get local issuer certificate` hoặc `x509: certificate signed by unknown authority`.
  - Các ứng dụng kích hoạt kỹ thuật **Certificate Pinning** (như ứng dụng ngân hàng di động, phần mềm bảo mật, các dịch vụ Cloud CLI) ghim sẵn băm SHA-256 của khóa công khai của server gốc. Khi proxy thay đổi chứng chỉ, ứng dụng coi đây là một cuộc tấn công MITM nguy hiểm và lập tức ngắt toàn bộ liên lạc.
- **Thực tiễn sản xuất**:
  - Cấu hình tệp cấu hình CA bundle cho các công cụ lập trình viên:
    ```bash
    # Trỏ curl và git tới chứng chỉ Enterprise CA nội bộ
    export CURL_CA_BUNDLE=/etc/ssl/certs/corporate-root-ca.pem
    git config --global http.sslCAInfo /etc/ssl/certs/corporate-root-ca.pem
    ```
  - Trên tường lửa doanh nghiệp, bắt buộc thiết lập chính sách **Bypass SSL Inspection (Danh sách loại trừ giải mã)** cho các danh mục:
    - Các dịch vụ ngân hàng, bảo hiểm, y tế (đảm bảo tính tuân thủ GDPR/HIPAA và quyền riêng tư của nhân viên).
    - Các kho phần mềm lập trình có pin chứng chỉ hoặc lưu lượng lớn không rủi ro (Apple Update, Microsoft Windows Update, Docker Hub registry).

---

### Cạm Bẫy 3: Cấu Hình Thiếu Sót Trong Biến `no_proxy` Gây Rò Rỉ Nội Bộ

- **Vấn đề**: Khi một máy trạm trong mạng nội bộ cố gắng kết nối tới các dịch vụ microservices hoặc máy chủ cơ sở dữ liệu nội bộ (ví dụ: `http://10.0.5.20:8080` hoặc `http://k8s-service.internal.corp`), nếu biến `no_proxy` không được cấu hình hoặc cấu hình sai cú pháp, request sẽ bị gửi vòng ra ngoài Forward Proxy.
- **Hậu quả**: Proxy từ chối phân giải địa chỉ IP nội bộ (gây lỗi `502 Bad Gateway` hoặc timeout), làm gián đoạn toàn bộ hệ thống giao tiếp nội bộ và vô tình làm lộ các URL bí mật của doanh nghiệp trong nhật ký (logs) của proxy.
- **Thực tiễn sản xuất**:
  - Định nghĩa đầy đủ cả địa chỉ loopback, IP riêng và tên miền nội bộ:
    ```bash
    export no_proxy="127.0.0.1,localhost,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,.local,.internal.corp"
    ```
  - Lưu ý cú pháp dấu chấm `.internal.corp` để bao hàm tất cả các subdomain con.

---

## 6. Câu Hỏi Củng Cố Kiến Thức (Active Recall Quiz)

### Câu 1
Trong cơ chế thiết lập đường hầm HTTPS bằng phương thức `HTTP CONNECT` theo chuẩn RFC 9110, Forward Proxy phản hồi mã trạng thái nào khi kết nối tới máy chủ đích thành công, và tại sao phản hồi này bắt buộc không được chứa trường tiêu đề `Content-Length` hay `Transfer-Encoding`?

<details>
<summary>Đáp án</summary>

- Khi kết nối TCP từ proxy tới máy chủ đích được thiết lập thành công, Forward Proxy trả về mã trạng thái **`200 Connection Established`** (hoặc bất kỳ mã nào trong dải 2xx).
- Theo chuẩn [RFC 9110 Section 9.3.6](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.6), phản hồi này **tuyệt đối không được chứa `Content-Length` hoặc `Transfer-Encoding`** vì kết nối HTTP kết thúc ngay sau cặp ký tự CRLF (`\r\n\r\n`) đóng phần header. Ngay lập tức, proxy chuyển sang chế độ truyền dẫn nhị phân mù (Blind Tunnel Mode), nơi các byte tiếp theo thuộc về phiên bắt tay TLS của client chứ không phải là nội dung payload của phản hồi HTTP từ proxy.
</details>

---

### Câu 2
Một kỹ sư DevOps chạy container CI/CD trên Linux để tải gói thư viện từ Internet. Kỹ sư thiết lập biến môi trường `HTTP_PROXY="http://proxy:3128"`, tuy nhiên lệnh `curl http://example.com` chạy bên trong môi trường web server CGI vẫn cố gắng kết nối trực tiếp ra ngoài và bị tường lửa chặn. Đâu là nguyên nhân kỹ thuật và giải pháp xử lý?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Lệnh `curl` chủ động bỏ qua biến môi trường viết hoa `HTTP_PROXY` khi phát hiện đang chạy trong môi trường CGI để phòng chống lỗ hổng bảo mật nghiêm trọng **httpoxy (CVE-2016-5385)**, tránh trường hợp kẻ tấn công giả mạo header `Proxy:` để chiếm quyền kiểm soát proxy của hệ thống.
- **Giải pháp**: Bắt buộc cấu hình biến môi trường ở dạng **chữ thường** `export http_proxy="http://proxy:3128"`. Lệnh `curl` và hầu hết các công cụ mạng trên Linux luôn tôn trọng và đọc biến môi trường chữ thường `http_proxy`.
</details>

---

### Câu 3
Khi một doanh nghiệp kích hoạt tính năng SSL Forward Inspection trên tường lửa thế hệ mới (Next-Gen Firewall), các máy tính nhân viên truy cập web vẫn hiển thị biểu tượng ổ khóa màu xanh bình thường, nhưng các lệnh `git clone https://...` hoặc `npm install` của lập trình viên lại đồng loạt báo lỗi `SSL certificate problem: unable to get local issuer certificate`. Giải thích nguyên nhân kiến trúc và cách khắc phục.

<details>
<summary>Đáp án</summary>

- **Nguyên nhân kiến trúc**: Khi SSL Forward Inspection hoạt động, tường lửa đóng vai trò Man-in-the-Middle được ủy quyền: nó ngắt phiên TLS và sinh ra chứng chỉ động cho máy chủ đích được ký bởi **Enterprise Root CA** nội bộ. Máy tính nhân viên tin tưởng vì chứng chỉ Root CA này đã được nạp sẵn vào OS Trust Store thông qua chính sách miền. Tuy nhiên, các công cụ lập trình như `git`, `npm`, `curl`, `python` sử dụng kho chứng chỉ độc lập (thường là bundle mặc định của Mozilla) và không tự động đọc kho chứng chỉ của hệ điều hành, dẫn tới việc chúng không nhận dạng được tổ chức phát hành Enterprise Root CA.
- **Cách khắc phục**:
  1. Cấu hình các công cụ trỏ tới bản sao chứng chỉ Enterprise Root CA của công ty:
     - Với Git: `git config --global http.sslCAInfo /duong/dan/corporate-root-ca.pem`
     - Với cURL: `export CURL_CA_BUNDLE=/duong/dan/corporate-root-ca.pem`
     - Với npm: `npm config set cafile /duong/dan/corporate-root-ca.pem`
  2. Quản trị viên mạng cấu hình luật loại trừ (SSL Inspection Bypass) trên tường lửa cho các domain phát triển mã nguồn như `github.com`, `registry.npmjs.org`.
</details>

---

## 7. 📚 Nguồn Tài Liệu Chính Thống (Tier-1 Official References)

- [RFC 9110 — HTTP Semantics: Section 3.7 Intermediaries](https://datatracker.ietf.org/doc/html/rfc9110#section-3.7) — Đặc tả chuẩn Internet của IETF về vai trò của Proxy, Gateway và Tunnel.
- [RFC 9110 — HTTP Semantics: Section 9.3.6 CONNECT Method](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.6) — Quy chuẩn chi tiết về phương thức mở đường hầm nhị phân qua proxy và mã trạng thái 200 Connection Established.
- [RFC 9110 — HTTP Semantics: Section 15.5.8 407 Proxy Authentication Required](https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.8) — Đặc tả quy trình xác thực client tại máy chủ proxy.
- [RFC 3040 — Internet Web Replication and Caching Taxonomy: Section 2.5 Automatic use of proxies](https://datatracker.ietf.org/doc/html/rfc3040#section-2.5) — Phân loại và định nghĩa chuẩn Internet của IETF về cơ chế Transparent/Interception Proxy.
- [IETF draft-ietf-wrec-wpad: Web Proxy Auto-Discovery Protocol](https://datatracker.ietf.org/doc/draft-ietf-wrec-wpad/) — Tài liệu đặc tả kỹ thuật của IETF về cơ chế tự động tìm kiếm file cấu hình PAC qua DHCP/DNS.
- [IANA BOOTP and DHCP Parameters](https://www.iana.org/assignments/bootp-dhcp-parameters/bootp-dhcp-parameters.xhtml) — Bảng đăng ký tham số DHCP chuẩn hóa (DHCP Option 252 gán cho cấu hình Web Proxy Auto-Discovery).
- [MDN Web Docs — An overview of HTTP: Proxies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview#proxies) — Tài liệu chính thức từ MDN phân tích vai trò, chức năng của Web Proxies trong mô hình khách/chủ.
- [curl Manual & Documentation: Proxy options and environment variables](https://curl.se/docs/manpage.html) — Hướng dẫn sử dụng chính thức của công cụ curl về các tham số `--proxy`, `--proxytunnel` và biến môi trường `http_proxy`.
- [Microsoft Learn — Azure Firewall Premium TLS inspection](https://learn.microsoft.com/en-us/azure/firewall/premium-features#tls-inspection) — Tài liệu kỹ thuật của Microsoft về kiến trúc giải mã và kiểm tra lưu lượng outbound bằng Enterprise Certification Authority.
