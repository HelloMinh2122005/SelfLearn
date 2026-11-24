# Review: 2_7_6 Host Name Resolution and DNS Caching

### Câu Hỏi 1: Khi một ứng dụng trên Linux cần phân giải tên miền thành địa chỉ IP, hàm thư viện nào được gọi và tệp `/etc/nsswitch.conf` đóng vai trò gì?

<details>
<summary>Đáp án</summary>

- Ứng dụng chạy trên Linux gọi hàm thư viện chuẩn POSIX là `getaddrinfo(3)` thuộc thư viện hệ thống C (`glibc`).
- Hàm `getaddrinfo()` không gửi ngay gói tin DNS ra mạng mà ủy thác việc tìm kiếm cho hệ thống con **NSS (Name Service Switch)**, được cấu hình trong `/etc/nsswitch.conf`.
- Dòng `hosts:` trong `/etc/nsswitch.conf` quy định thứ tự ưu tiên của các nguồn phân giải tên máy chủ:
  - `files`: kiểm tra tệp tin phẳng cục bộ `/etc/hosts` trước tiên.
  - `resolve`: truy vấn dịch vụ đệm tên miền cục bộ `systemd-resolved` qua giao diện IPC nội bộ D-Bus (thường thấy trên các bản phân phối Linux hiện đại dùng systemd).
  - `dns`: nếu chưa tìm thấy, kích hoạt **Stub Resolver** để đọc `/etc/resolv.conf` và gửi truy vấn mạng tới máy chủ DNS.

</details>

### Câu Hỏi 2: Tệp `/etc/hosts` có cấu trúc cú pháp như thế nào và mang những đặc tính kỹ thuật cốt lõi nào?

<details>
<summary>Đáp án</summary>

- **Cú pháp chuẩn**: Mỗi dòng ánh xạ một địa chỉ IP với tên máy chủ theo định dạng:
  `IP_address canonical_hostname [aliases...]`
- **Quy tắc định dạng**: Địa chỉ IP và tên máy chủ phân tách nhau bằng khoảng trắng hoặc ký tự tab (whitespace); ký tự `#` bắt đầu phần chú thích (comment) đến hết dòng.
- **Đặc tính kỹ thuật**:
  - Tra cứu cục bộ diễn ra tức thời, không phát sinh độ trễ mạng hay rủi ro mất kết nối.
  - Các mục trong `/etc/hosts` có hiệu lực vĩnh viễn cho đến khi bị chỉnh sửa thủ công và **hoàn toàn không có khái niệm TTL (Time to Live)**.
  - Thường dùng để định nghĩa tên miền nội bộ, môi trường kiểm thử (staging), hoặc ghi đè (override) tên miền công cộng khi debug.

</details>

### Câu Hỏi 3: Chỉ thị `nameserver` trong `/etc/resolv.conf` hoạt động như thế nào và có giới hạn kỹ thuật gì?

<details>
<summary>Đáp án</summary>

- `nameserver <IP_address>` khai báo địa chỉ IP của máy chủ DNS (Recursive Resolver) mà Stub Resolver của glibc sẽ gửi truy vấn tới khi nguồn `files` không tìm thấy kết quả.
- **Giới hạn kỹ thuật**: `glibc` giới hạn tối đa **3 máy chủ nameserver** (hằng số `MAXNS = 3`); mọi dòng `nameserver` từ thứ 4 trở đi đều bị bỏ qua hoàn toàn.
- **Cơ chế truy vấn mặc định**: Stub Resolver gửi truy vấn tuần tự tới `nameserver` đầu tiên trong danh sách trước, và chỉ chuyển sang `nameserver` thứ hai khi máy chủ đầu tiên bị timeout hoặc không phản hồi (không gửi song song).

</details>

### Câu Hỏi 4: Chỉ thị `search` và `domain` trong `/etc/resolv.conf` khác nhau ra sao, và làm thế nào để tránh phát sinh truy vấn thừa từ `search`?

<details>
<summary>Đáp án</summary>

- `search <domain_list...>`: Khai báo danh sách các hậu tố (suffix) tên miền tìm kiếm mặc định. Khi ứng dụng yêu cầu phân giải một tên chưa đủ số dấu chấm theo tham số `ndots` (mặc định trong glibc là `ndots:5`), Stub Resolver sẽ lần lượt ghép từng hậu tố trong `search` vào đuôi để tạo FQDN trước khi gửi truy vấn gốc.
- `domain`: Là chỉ thị lịch sử dùng để khai báo một tên miền cục bộ duy nhất; chỉ thị này đã lỗi thời (**obsolete**) và được thay thế hoàn toàn bởi `search`.
- **Cách tránh truy vấn thừa**: Thêm dấu chấm tuyệt đối ở cuối tên miền (ví dụ `api.stripe.com.`) trong cấu hình hoặc code để báo hiệu đó là FQDN hoàn chỉnh, giúp bỏ qua toàn bộ danh sách `search`.

</details>

### Câu Hỏi 5: Các tùy chọn `timeout:n`, `attempts:n`, `rotate` và `edns0` dưới mục `options` trong `/etc/resolv.conf` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- `timeout:n`: Thời gian chờ (giây) trước khi resolver coi một nameserver là không phản hồi. Giá trị mặc định là **5 giây**, tối đa là **30 giây**.
- `attempts:n`: Số lần thử gửi lại truy vấn tới mỗi nameserver trước khi chuyển tiếp hoặc từ bỏ. Giá trị mặc định là **2 lần**, tối đa là **5 lần**.
- `rotate`: Kích hoạt thuật toán Round-Robin xoay vòng lựa chọn nameserver trong danh sách để phân tải truy vấn thay vì luôn hỏi máy chủ đầu tiên.
- `edns0`: Bật phần mở rộng Extension Mechanisms for DNS (RFC 6891), cho phép kích thước gói tin UDP vượt qua giới hạn 512 bytes truyền thống.

</details>

### Câu Hỏi 6: Trong các bản phân phối Linux hiện đại, `systemd-resolved` lắng nghe ở đâu và đảm nhiệm những vai trò kỹ thuật nào?

<details>
<summary>Đáp án</summary>

- `systemd-resolved` tạo ra một máy chủ DNS cục bộ (Loopback Stub) lắng nghe tại địa chỉ **`127.0.0.53` cổng `53`**. Để tương thích với các ứng dụng cũ đọc `/etc/resolv.conf`, tệp `/etc/resolv.conf` thường là symbolic link trỏ tới `/run/systemd/resolve/stub-resolv.conf` với dòng `nameserver 127.0.0.53`.
- **3 vai trò kỹ thuật chính**:
  1. **In-memory DNS Caching**: Lưu tạm kết quả truy vấn DNS trong RAM trên máy trạm để phục vụ các lần hỏi tiếp theo với độ trễ gần như bằng 0.
  2. **Per-Link DNS Configuration**: Quản lý máy chủ DNS riêng biệt cho từng card mạng (interface) vật lý hoặc ảo (như card Ethernet và card VPN `tun0`).
  3. **Quản trị qua `resolvectl`**: Cung cấp công cụ `resolvectl(1)` (thay cho `systemd-resolve` cũ) để giám sát cấu hình, thống kê cache và xóa bộ nhớ đệm.

</details>

### Câu Hỏi 7: Các lệnh `resolvectl` cơ bản dùng để kiểm tra trạng thái, thống kê, truy vấn và xóa bộ nhớ đệm DNS là gì?

<details>
<summary>Đáp án</summary>

- `resolvectl status`: Xem trạng thái cấu hình DNS theo từng interface (per-interface).
- `resolvectl statistics`: Xem thống kê hoạt động của bộ đệm như `Current Cache Size`, `Cache Hits`, `Cache Misses` và `Total Timeouts`.
- `resolvectl query <domain>`: Thực hiện truy vấn tên miền trực tiếp thông qua `systemd-resolved` stub.
- `resolvectl flush-caches`: Xóa sạch toàn bộ bộ nhớ đệm DNS cục bộ.

</details>

### Câu Hỏi 8: Positive Caching và trường TTL (RFC 1035 §3.2.1) hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- Khi một bản ghi tài nguyên (`A`, `AAAA`, `CNAME`, `MX`...) được trả về thành công, Authoritative Name Server đính kèm một trường số nguyên 32-bit có dấu gọi là **TTL (Time to Live)** theo chuẩn RFC 1035 Section 3.2.1.
- Kể từ lúc nhận phản hồi, các máy chủ đệm trung gian (Recursive Resolvers, ISP DNS, `systemd-resolved`) lưu bản ghi đó trong RAM và đếm lùi TTL theo từng giây (**Positive Caching**).
- Mọi ứng dụng truy vấn cùng tên miền khi `TTL > 0` sẽ nhận ngay kết quả từ cache cục bộ mà không tốn tài nguyên mạng hay gửi truy vấn lên Authoritative Name Server.

</details>

### Câu Hỏi 9: Negative Caching (RFC 2308) ra đời để giải quyết vấn đề gì và lưu trữ những loại phản hồi nào?

<details>
<summary>Đáp án</summary>

- **Mục đích**: Ngăn chặn việc ứng dụng hoặc vòng lặp lỗi liên tục gửi hàng loạt truy vấn cho các tên miền/bản ghi không tồn tại về thẳng Authoritative Name Server, giúp bảo vệ hạ tầng DNS toàn cầu khỏi nguy cơ quá tải hoặc từ chối dịch vụ (DoS).
- **Hai loại phản hồi phủ định (Negative Responses) được lưu cache**:
  1. **`NXDOMAIN` (`RCODE = 3` - Name Error)**: Tên miền hoàn toàn không tồn tại trong cơ sở dữ liệu vùng của Authoritative Server.
  2. **`NODATA` (`NOERROR` nhưng `ANCOUNT = 0`)**: Tên miền có tồn tại, nhưng loại bản ghi cụ thể được hỏi (RRType, ví dụ `AAAA`) không hiện diện.

</details>

### Câu Hỏi 10: Theo RFC 2308 Section 5, thời gian lưu trữ Negative Cache (`Negative TTL`) được tính bằng công thức nào và dựa vào bản ghi nào?

<details>
<summary>Đáp án</summary>

- Khi trả về `NXDOMAIN` hoặc `NODATA`, Authoritative Server bắt buộc gửi kèm bản ghi **SOA (Start of Authority)** trong phần `Authority Section`.
- Resolver tính thời gian tồn tại của bản ghi negative cache theo công thức:
  $$\text{Negative TTL} = \min(\text{SOA.MINIMUM}, \text{SOA TTL})$$
  Trong đó `SOA.MINIMUM` là trường số nguyên trong bản ghi SOA được RFC 2308 định nghĩa lại làm Negative Caching TTL.
- Theo khuyến nghị của RFC 2308, giá trị trần tối đa là **1 ngày (86400 giây)**, nhưng các resolver hiện đại thường giới hạn ở mức **1–3 giờ** để việc tạo mới tên miền có thể cập nhật nhanh hơn.

</details>

### Câu Hỏi 11: Vì sao nói thuật ngữ "DNS Propagation (lan truyền DNS)" là một ngộ nhận kỹ thuật, và nguyên lý thực sự khiến việc đổi IP mất thời gian cập nhật là gì?

<details>
<summary>Đáp án</summary>

- Theo RFC 1034 Section 5.3.3 và RFC 1035 Section 3.2.1, DNS hoạt động theo cơ chế **Kéo thụ động (Pull-based Passive Caching)** và hoàn toàn **không có cơ chế đẩy chủ động (No Active Push)**. Authoritative Name Server không gửi thông báo cập nhật tới các Recursive Resolver trên thế giới khi bản ghi thay đổi.
- **Lý do cập nhật chậm và không đồng đều**: Các Recursive Resolver tiếp tục trả về IP cũ từ RAM cho đến khi bộ đếm TTL của bản ghi đó tại từng resolver **chạm mốc 0**. Sau khi hết hạn, resolver mới chủ động "kéo" (pull) bản ghi mới khi có truy vấn tiếp theo. Vì mỗi resolver lưu cache ở các thời điểm khác nhau, thời gian chờ cập nhật ở từng nơi sẽ khác nhau.

</details>

### Câu Hỏi 12: Sự khác biệt cốt lõi giữa lệnh `getent hosts <domain>` và `dig <domain>` là gì, và nên dùng lệnh nào để kiểm tra cách ứng dụng Linux phân giải tên miền?

<details>
<summary>Đáp án</summary>

- **`getent hosts <domain>`**: Gọi hàm `getaddrinfo(3)` của glibc và tuân thủ `/etc/nsswitch.conf`, do đó kiểm tra `/etc/hosts` trước rồi mới tới `/etc/resolv.conf` — tái hiện chính xác cách 99% ứng dụng Linux phân giải tên miền.
- **`dig <domain>`**: Là công cụ chẩn đoán giao thức DNS thuần túy, mở socket gửi trực tiếp gói tin UDP/TCP cổng 53 tới máy chủ DNS. Nó **bỏ qua hoàn toàn** `/etc/nsswitch.conf`, `/etc/hosts` (và bỏ qua cả cache `systemd-resolved` nếu chỉ định `@server`).
- **Kết luận**: Để kiểm tra đúng cách hệ thống và ứng dụng phân giải tên miền (đặc biệt khi đã cấu hình `/etc/hosts`), luôn sử dụng **`getent hosts <domain>`** thay cho `dig`.

</details>

### Câu Hỏi 13: Vì sao khi `nameserver` thứ nhất trong `/etc/resolv.conf` bị sập, các kết nối mạng trên Linux có thể bị treo khoảng 10 giây trước khi chuyển sang `nameserver` thứ hai, và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: glibc Stub Resolver truy vấn các `nameserver` theo thứ tự **tuần tự**, không song song. Với cấu hình mặc định `timeout:5` (5 giây) và `attempts:2` (thử 2 lần), khi `nameserver` thứ nhất chết hẳn, resolver phải chờ hết $5 \times 2 = 10\text{ giây}$ rồi mới chuyển sang `nameserver` thứ hai.
- **Cách khắc phục**: Cấu hình rút ngắn thời gian timeout và xoay vòng máy chủ trong `/etc/resolv.conf`, ví dụ:
  `options timeout:1 attempts:2 rotate`

</details>

### Câu Hỏi 14: Vì sao việc thử truy vấn một tên miền mới (bằng `curl` hoặc trình duyệt) trước khi tạo bản ghi DNS trên Cloud DNS lại có thể khiến máy chủ báo lỗi không tìm thấy host ngay cả sau khi đã tạo bản ghi thành công?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Lệnh kiểm thử ban đầu khi bản ghi chưa tồn tại đã kích hoạt **Negative Caching (RFC 2308)**. Recursive Resolver hoặc `systemd-resolved` đã lưu trạng thái lỗi `NXDOMAIN` vào cache với thời hạn $\min(\text{SOA.MINIMUM}, \text{SOA TTL})$, nên tiếp tục trả lỗi từ cache cho đến khi hết hạn dù bản ghi A đã được tạo sau đó.
- **Cách phòng tránh & xử lý**:
  - Không truy vấn kiểm thử tên miền production trước khi bản ghi DNS được tạo chính thức.
  - Nếu đã lỡ kích hoạt negative cache trên máy trạm Linux dùng `systemd-resolved`, xóa cache ngay bằng lệnh `sudo resolvectl flush-caches`.

</details>
