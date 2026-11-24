# Review: 2_7_1 Domain Name System

### Câu Hỏi 1: Hệ thống phân giải tên miền (DNS) giải quyết bài toán cốt lõi nào trên Internet và được chuẩn hóa nền tảng qua hai tài liệu RFC nào?

<details>
<summary>Đáp án</summary>

- **Bài toán cốt lõi**: DNS chuyển dịch các tên miền ký tự dễ nhớ cho con người (như `api.example.com`) thành các địa chỉ IP số học (IPv4 hoặc IPv6) mà tầng giao vận (Transport Layer) và tầng mạng (Network Layer) sử dụng để định tuyến gói tin.
- **Chuẩn hóa nền tảng**: DNS được chuẩn hóa ban đầu bởi IETF qua hai tài liệu **RFC 1034** và **RFC 1035** (cùng các RFC bổ sung sau này như RFC 3596, RFC 6891, RFC 7766, RFC 7208).
</details>

### Câu Hỏi 2: Không gian tên miền phân cấp (Hierarchical Domain Name Space) được tổ chức theo cấu trúc nào, và các quy định về nhãn (Label) cùng độ dài tối đa của FQDN là gì?

<details>
<summary>Đáp án</summary>

Theo RFC 1034 §3.1, không gian tên miền được tổ chức thành một **cấu trúc cây đảo ngược (Inverted Tree)** gồm:
- **Gốc (Root Node)**: Đỉnh cao nhất của cây, mang nhãn rỗng (null/zero-length label) và được ký hiệu bằng dấu chấm (`.`).
- **Phân tầng các cấp**: Root (`.`) $\rightarrow$ TLD (Top-Level Domains như `.com`, `.net`, `.org`) $\rightarrow$ SLD (Second-Level Domains như `example`) $\rightarrow$ Subdomains / Leaf Nodes (như `api`, `www`).
- **Quy định về Nhãn (Label)**: Mỗi node có một nhãn dài từ **0 đến 63 octets (bytes)** và theo quy ước truyền thống **không phân biệt chữ hoa, chữ thường**.
- **FQDN (Fully Qualified Domain Name)**: Chuỗi biểu diễn đường dẫn từ node lá đi ngược lên đỉnh gốc, các nhãn ngăn cách bởi dấu chấm và kết thúc bằng dấu chấm gốc (ví dụ `app.internal.example.com.`). Tổng độ dài tối đa của một FQDN không vượt quá **255 octets** (bao gồm cả các byte chỉ định độ dài nhãn).
</details>

### Câu Hỏi 3: Sự khác biệt cơ bản về vai trò và cách xử lý truy vấn giữa Recursive Resolver và Authoritative Name Server là gì?

<details>
<summary>Đáp án</summary>

- **Authoritative Name Server (Máy chủ có thẩm quyền)**:
  - Nắm giữ cơ sở dữ liệu chính thức (**Zone File**) của một vùng tên miền cụ thể.
  - Bắt buộc hỗ trợ **truy vấn phi đệ quy (Iterative / Non-recursive queries)**; truy vấn đệ quy là tùy chọn và thường bị tắt để tránh quá tải cũng như tấn công khuếch đại (amplification attack).
  - Nếu có dữ liệu, nó trả về câu trả lời chính thức (`AA - Authoritative Answer`). Nếu không, nó chỉ trả về thông tin ủy quyền (**Referral**) trỏ tới các Name Server cấp dưới chứ không tự đi hỏi tiếp.
- **Recursive Resolver (Trình phân giải đệ quy)**:
  - Đóng vai trò máy chủ trung gian thực hiện toàn bộ quá trình tìm kiếm (duyệt qua Root $\rightarrow$ TLD $\rightarrow$ Authoritative bằng các truy vấn lặp) thay cho Stub Resolver của client.
  - Khi nhận truy vấn đệ quy từ client, nó **chỉ được phép trả về kết quả dứt điểm (địa chỉ IP) hoặc mã lỗi (Error)**, không bao giờ trả về referral bắt client tự đi hỏi tiếp.
  - Quản lý bộ nhớ đệm (**DNS Cache**) nội bộ để tái sử dụng kết quả theo TTL, giúp giảm độ trễ và giảm tải cho hệ thống.
</details>

### Câu Hỏi 4: Khi một Recursive Resolver mới khởi động và chưa có dữ liệu trong cache (cache miss), nó dựa vào cơ chế nào để biết địa chỉ của Root Name Server?

<details>
<summary>Đáp án</summary>

Theo RFC 1034 §5.3.3, Recursive Resolver sử dụng cấu trúc dữ liệu **SBELT (Safety Belt / Root Hints)**.
- **Root Hints** chứa danh sách địa chỉ IP tĩnh của **13 định danh máy chủ gốc toàn cầu** (từ `a.root-servers.net` đến `m.root-servers.net`).
- Khi gặp cache miss, resolver dựa vào danh sách này để gửi truy vấn lặp đầu tiên tới một trong các Root Server và bắt đầu quá trình duyệt cây DNS.
</details>

### Câu Hỏi 5: Các bản ghi tài nguyên `A`, `AAAA` và `PTR` dùng để làm gì và khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **A (Type ID `1`, RFC 1035 §3.4.1)**: Ánh xạ tên miền sang một địa chỉ **IPv4 32-bit** (dạng chấm thập phân).
- **AAAA (Type ID `28`, RFC 3596 §2.1)**: Ánh xạ tên miền sang một địa chỉ **IPv6 128-bit** (dạng hex).
- **PTR (Type ID `12`, RFC 1035 §3.3.12)**: Bản ghi con trỏ phục vụ **phân giải ngược (Reverse DNS)** từ địa chỉ IP sang FQDN:
  - Đối với IPv4: thực hiện trong vùng `in-addr.arpa` với 4 octets đảo ngược (ví dụ IP `93.184.216.34` thành `34.216.184.93.in-addr.arpa.`).
  - Đối với IPv6: thực hiện dưới nhánh `ip6.arpa` bằng các nibble đảo ngược phân tách bằng dấu chấm.
</details>

### Câu Hỏi 6: Hai bản ghi quản trị zone là `NS` và `SOA` đảm nhiệm vai trò gì? Hãy nêu ý nghĩa các tham số chính trong bản ghi `SOA`.

<details>
<summary>Đáp án</summary>

- **NS (Name Server, Type ID `2`)**: Khai báo các máy chủ tên miền có thẩm quyền (**Authoritative Name Server**) quản trị zone đó.
- **SOA (Start of Authority, Type ID `6`)**: Bản ghi khởi đầu thẩm quyền của zone, xác định các tham số quản trị cốt lõi gồm:
  - `MNAME`: Máy chủ chính (Primary Master).
  - `RNAME`: Email của quản trị viên (ký tự `@` được thay bằng dấu `.`).
  - `SERIAL`: Số phiên bản 32-bit của zone.
  - `REFRESH`, `RETRY`, `EXPIRE`: Các thông số chu kỳ đồng bộ và hết hạn dữ liệu zone.
  - `MINIMUM TTL`: Thời gian sống tối thiểu dùng cho **negative caching**.
</details>

### Câu Hỏi 7: Bản ghi `MX` xác định thứ tự ưu tiên máy chủ nhận thư như thế nào, và bản ghi `TXT` giữ vai trò bắt buộc gì trong bảo mật email?

<details>
<summary>Đáp án</summary>

- **MX (Mail Exchange, Type ID `15`)**: Dùng để định tuyến máy chủ nhận thư điện tử. Bản ghi chứa trường độ ưu tiên `PREFERENCE` (số nguyên 16-bit), trong đó **giá trị số càng nhỏ thì độ ưu tiên càng cao**.
- **TXT (Type ID `16`)**: Lưu trữ các chuỗi văn bản tùy ý và là loại bản ghi **bắt buộc duy nhất** (theo RFC 7208 §3.1) dùng để công bố các chính sách bảo mật thư điện tử gồm: **SPF**, khóa ký xác thực **DKIM**, và chính sách **DMARC**.
</details>

### Câu Hỏi 8: Bản ghi `CNAME` hoạt động ra sao, tại sao tuyệt đối không được cấu hình `CNAME` tại Zone Apex, và giải pháp thay thế trong thực tế sản xuất là gì?

<details>
<summary>Đáp án</summary>

- **Chức năng của CNAME (Type ID `5`)**: Là bản ghi bí danh chuẩn hóa (Canonical Name), dùng để trỏ một nhãn tên miền sang một tên miền đích khác.
- **Quy tắc bất biến (RFC 1034 §3.6.2 & RFC 1912 §2.4)**: Nếu một node đã có bản ghi `CNAME` thì **tuyệt đối không được phép có bất kỳ bản ghi nào khác** (`A`, `AAAA`, `MX`, `TXT`...) cùng tồn tại trên node đó.
- **Lý do cấm tại Zone Apex**: Đỉnh gốc của một zone (ví dụ `example.com`) **bắt buộc phải chứa bản ghi `SOA` và ít nhất một bản ghi `NS`**. Đặt `CNAME` tại Zone Apex sẽ xung đột trực tiếp với `SOA`/`NS`, làm hỏng quyền quản trị zone và khiến các truy vấn khác (như `MX` cho email) bị chuyển hướng sai sang tên miền đích, làm gãy hệ thống email.
- **Giải pháp thực tế sản xuất**: Sử dụng tính năng **Alias Record** (như trên AWS Route 53), **ANAME** hoặc **CNAME Flattening** (như trên Cloudflare), cho phép DNS server tự phân giải IP của tên miền đích và trả về bản ghi `A` trực tiếp tại Zone Apex mà không vi phạm chuẩn RFC.
</details>

### Câu Hỏi 9: Phần Header cố định 12 bytes (96 bits) của gói tin DNS gồm những thành phần và các cờ (Flags) cốt lõi nào?

<details>
<summary>Đáp án</summary>

Theo RFC 1035 §4.1.1, DNS Header dài 12 bytes gồm:
- **ID (16 bits)**: Mã định danh ngẫu nhiên do bên gửi tạo ra để ghép nối chính xác Response nhận về với Query tương ứng.
- **Flags (16 bits)**:
  - `QR` (1 bit): `0` = Query, `1` = Response.
  - `Opcode` (4 bits): `0` cho truy vấn tiêu chuẩn (Standard Query).
  - `AA` (Authoritative Answer, 1 bit): `1` nếu server trả lời có thẩm quyền đối với zone.
  - `TC` (Truncation, 1 bit): `1` nếu thông điệp bị cắt cụt do vượt quá giới hạn kích thước kênh truyền.
  - `RD` (Recursion Desired, 1 bit): Client yêu cầu server thực hiện phân giải đệ quy.
  - `RA` (Recursion Available, 1 bit): Server báo hiệu có hỗ trợ phân giải đệ quy.
  - `Z` (3 bits): Dành riêng cho tương lai, bắt buộc bằng `0`.
  - `RCODE` (4 bits): Mã trạng thái phản hồi.
- **Bộ đếm số lượng mục (16 bits mỗi trường)**: `QDCOUNT` (Question), `ANCOUNT` (Answer), `NSCOUNT` (Authority), và `ARCOUNT` (Additional).
</details>

### Câu Hỏi 10: Năm mã phản hồi `RCODE` phổ biến (`0`, `1`, `2`, `3`, `5`) trong DNS Header mang ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **`0` — NoError**: Không có lỗi, truy vấn xử lý thành công.
- **`1` — FormErr**: Lỗi định dạng thông điệp (Format Error).
- **`2` — ServFail**: Máy chủ gặp lỗi nội bộ không thể xử lý truy vấn.
- **`3` — NXDomain**: Tên miền không tồn tại (Non-Existent Domain).
- **`5` — Refused**: Máy chủ từ chối thực hiện truy vấn vì lý do chính sách.
</details>

### Câu Hỏi 11: Tại sao DNS mặc định dùng UDP port 53 nhưng vẫn bắt buộc phải hỗ trợ TCP port 53? Vai trò của cơ chế EDNS0 và ngưỡng 1232 octets là gì?

<details>
<summary>Đáp án</summary>

- **UDP port 53 và giới hạn 512 bytes**: DNS dùng mặc định UDP port 53 để tối ưu hiệu năng và giảm độ trễ. Theo RFC 1035 §4.2.1, thông điệp UDP tiêu chuẩn bị giới hạn tối đa **512 octets** (chưa tính IP/UDP header).
- **Khi nào chuyển sang TCP port 53**:
  1. Khi câu trả lời vượt quá kích thước UDP cho phép, server cắt bớt dữ liệu và bật cờ **`TC = 1`**. Client bắt buộc phải mở kết nối **TCP port 53** để lấy toàn bộ phản hồi. (Do đó theo RFC 7766 §5, firewall bắt buộc phải mở đồng thời cả **UDP và TCP cổng 53**; nếu đóng TCP 53, các phản hồi lớn như DNSSEC hay nhiều bản ghi TXT sẽ thất bại hoàn toàn).
  2. TCP còn bắt buộc cho cơ chế **AXFR (Authoritative Zone Transfer)** để đồng bộ toàn bộ dữ liệu zone giữa các máy chủ DNS.
- **EDNS0 và ngưỡng 1232 octets**: Cơ chế EDNS0 (RFC 6891) dùng bản ghi giả lập `OPT` (Pseudo-RR) để mở rộng kích thước bộ đệm UDP (ví dụ lên 1232 hoặc 4096 bytes). Tuy nhiên, cấu hình quá lớn (như 4096 bytes) dễ vượt quá Path MTU (thường 1500 bytes trên Ethernet), gây phân mảnh IP (IP Fragmentation) và có thể bị thiết bị mạng drop gói. Ngưỡng **1232 octets** được khuyến nghị sử dụng phổ biến để gói UDP nằm gọn trong một frame Ethernet MTU 1500 mà không bị phân mảnh.
</details>

### Câu Hỏi 12: Với công cụ `dig` trên Linux, các câu lệnh `dig @8.8.8.8 example.com A`, `dig +trace example.com` và `dig -x 93.184.216.34` dùng để làm gì, và khi đọc output của `dig @8.8.8.8` cần chú ý cờ nào?

<details>
<summary>Đáp án</summary>

- **`dig @8.8.8.8 example.com A`**: Gửi truy vấn bản ghi `A` của `example.com` tới máy chủ đệ quy `8.8.8.8` qua cổng `53/UDP`. Khi đọc output:
  - `status: NOERROR` tương ứng `RCODE = 0`.
  - `flags: qr rd ra` cho biết đây là gói Response (`qr`), client có yêu cầu đệ quy (`rd`) và server hỗ trợ đệ quy (`ra`). Lưu ý **không có cờ `aa`** vì `8.8.8.8` là Recursive Resolver chứ không phải Authoritative Name Server của domain này.
- **`dig +trace example.com`**: Lần vết toàn bộ chuỗi truy vấn lặp (Iterative) duyệt cây ủy quyền từ Root Server (`.`) $\rightarrow$ TLD Server (`.com`) $\rightarrow$ Authoritative Name Server của `example.com`.
- **`dig -x 93.184.216.34`**: Thực hiện phân giải ngược (Reverse DNS) bằng cách tự động đảo ngược 4 octets và gắn hậu tố `in-addr.arpa.` để truy vấn bản ghi `PTR`.
</details>
