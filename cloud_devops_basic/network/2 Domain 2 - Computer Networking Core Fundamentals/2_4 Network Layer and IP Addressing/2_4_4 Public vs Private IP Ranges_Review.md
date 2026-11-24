# Review: 2_4_4 Public vs Private IP Ranges

### Câu Hỏi 1: Tại sao không gian địa chỉ IPv4 lại được phân định thành Public IP, Private IP và các dải địa chỉ đặc biệt?

<details>
<summary>Đáp án</summary>

Không gian mạng IPv4 có tổng giới hạn lý thuyết là $2^{32} = 4.294.967.296$ địa chỉ. IETF đã phân định rõ ràng giữa **Public IP**, **Private IP** và các dải địa chỉ dành riêng cho mục đích đặc biệt nhằm giải quyết hai mục tiêu cốt lõi:
- Ngăn chặn nguy cơ cạn kiệt không gian địa chỉ IPv4 toàn cầu.
- Thiết lập ranh giới bảo mật mạng và duy trì hoạt động định tuyến ổn định trên Internet.
</details>

### Câu Hỏi 2: Địa chỉ Public IP là gì, do tổ chức nào điều phối/cấp phát và khi nào thiết bị bắt buộc phải có nó?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Public IP là các địa chỉ có tính **duy nhất trên toàn bộ mạng Internet toàn cầu**, được định tuyến công khai giữa các nhà mạng viễn thông (ISPs) và các hệ thống tự trị (Autonomous Systems - AS).
- **Cấp phát**: Được điều phối và cấp phát bởi **IANA** (Internet Assigned Numbers Authority) thông qua các Cơ quan Quản lý Internet Khu vực (**RIR** - Regional Internet Registries như APNIC, ARIN, RIPE NCC).
- **Trường hợp bắt buộc**: Mọi thiết bị hoặc máy chủ cung cấp dịch vụ công khai ra Internet (như Web server, Public DNS) bắt buộc phải sở hữu hoặc được ánh xạ tới một địa chỉ Public IP.
</details>

### Câu Hỏi 3: Theo chuẩn RFC 1918, địa chỉ Private IP có những đặc điểm gì và quy tắc định tuyến cốt lõi đối với nó trên Internet là gì?

<details>
<summary>Đáp án</summary>

- **Đặc điểm**:
  - Dành riêng cho mạng nội bộ (Enterprise LANs, Home Networks, Data Centers, VPC).
  - Không được đăng ký độc quyền: Bất kỳ tổ chức nào cũng có thể tự do sử dụng và tái sử dụng độc lập mà không cần xin phép hay trả phí cho IANA.
- **Quy tắc định tuyến cốt lõi (RFC 1918 Section 5)**:
  - Các gói tin mang địa chỉ nguồn hoặc đích thuộc dải Private IP **tuyệt đối không được phép chuyển tiếp qua mạng Internet công cộng**.
  - Các bộ định tuyến biên (border routers) và nhà mạng (ISPs) luôn lọc bỏ và hủy (drop) mọi quảng bá định tuyến cũng như gói tin chứa Private IP.
  - Để thiết bị trong mạng private giao tiếp ra Internet, lưu lượng phải đi qua thiết bị chuyển đổi địa chỉ mạng (NAT Gateway / Router biên) để biên dịch sang một địa chỉ Public IP.
</details>

### Câu Hỏi 4: Hãy nêu 3 khối địa chỉ Private IP theo chuẩn RFC 1918 (prefix, dải địa chỉ, tổng số địa chỉ và trường hợp sử dụng điển hình)?

<details>
<summary>Đáp án</summary>

Theo **RFC 1918 Section 3**, có 3 khối địa chỉ Private IP độc lập:
1. **`10.0.0.0/8`** (`10.0.0.0` – `10.255.255.255`): Khối 24-bit, tổng cộng **16.777.216** địa chỉ. Dùng cho mạng doanh nghiệp quy mô lớn, Data Center, Multi-Region VPC.
2. **`172.16.0.0/12`** (`172.16.0.0` – `172.31.255.255`): Khối 20-bit, tổng cộng **1.048.576** địa chỉ (gồm 16 mạng `/16` liên tiếp từ `172.16.0.0/16` đến `172.31.0.0/16`). Dùng cho tổ chức, trường học, VPC quy mô vừa.
3. **`192.168.0.0/16`** (`192.168.0.0` – `192.168.255.255`): Khối 16-bit, tổng cộng **65.536** địa chỉ (gồm 256 mạng `/24` liên tiếp từ `192.168.0.0/24` đến `192.168.255.0/24`). Dùng cho mạng gia đình (SOHO), mạng văn phòng nhỏ, thiết bị mạng gia dụng.
</details>

### Câu Hỏi 5: Dải địa chỉ Loopback (`127.0.0.0/8`) hoạt động như thế nào trong hệ điều hành và có được chuyển tiếp qua card mạng vật lý hay router không?

<details>
<summary>Đáp án</summary>

- **Quy chuẩn & Phạm vi**: Theo RFC 1122 (Section 3.2.1.3) và RFC 1812 (Section 5.3.7), toàn bộ khối từ `127.0.0.0` đến `127.255.255.255` (phổ biến nhất là `127.0.0.1` hay `localhost`) là địa chỉ vòng lặp nội bộ host.
- **Cơ chế hoạt động**: Khi tiến trình gửi gói tin đến `127.0.0.0/8`, hệ điều hành xử lý hoàn toàn bên trong tầng kernel (kernel network stack) thông qua giao diện ảo `lo`. Gói tin **không bao giờ đi qua phần cứng giao tiếp mạng (NIC/card mạng vật lý)**.
- **Bảo vệ định tuyến**: Các bộ định tuyến (routers) **tuyệt đối không được phép chuyển tiếp** bất kỳ gói tin nào có địa chỉ nguồn hoặc đích thuộc dải `127.0.0.0/8` ra ngoài mạng vật lý.
</details>

### Câu Hỏi 6: Khi chạy lệnh `ip addr show lo` trên Linux, các thông số `mtu 65536`, `link/loopback 00:00:00:00:00:00` và `scope host` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Trong kết quả của công cụ `iproute2` (`ip addr show lo`):
- **`mtu 65536`**: Kích thước đơn vị truyền tối đa cực lớn (64KB), vì dữ liệu chỉ luân chuyển qua bộ nhớ RAM mà không bị giới hạn bởi chuẩn cáp vật lý (như Ethernet 1500 byte).
- **`link/loopback 00:00:00:00:00:00`**: Địa chỉ MAC của giao diện loopback gồm toàn số không, chứng minh không có phần cứng vật lý nào gắn với giao diện này.
- **`scope host`**: Chỉ định phạm vi gói tin chỉ có hiệu lực bên trong phạm vi máy chủ cục bộ.
</details>

### Câu Hỏi 7: Khi nào một host tự động nhận địa chỉ APIPA (`169.254.0.0/16`), dải địa chỉ khả dụng gán cho host là bao nhiêu và điều này cảnh báo gì trong vận hành thực tế?

<details>
<summary>Đáp án</summary>

- **Khi nào tự cấp phát**: Theo RFC 3927, khi một host được cấu hình nhận IP tự động qua DHCP nhưng **không nhận được phản hồi từ bất kỳ DHCP Server nào** (do máy chủ sập hoặc đứt cáp mạng), host sẽ tự động chọn ngẫu nhiên một địa chỉ trong dải `169.254.0.0/16` (Link-Local / APIPA).
- **Dải địa chỉ khả dụng cho host**: Từ `169.254.1.0` đến `169.254.254.255`.
- **Ý nghĩa trong vận hành**: Việc thiết bị nhận IP `169.254.x.x` là dấu hiệu cảnh báo trực tiếp rằng **DHCP Client đã thất bại hoàn toàn** trong việc liên lạc với DHCP Server. Thiết bị đang bị cô lập khỏi mạng nội bộ chính và hoàn toàn không có đường ra Internet.
</details>

### Câu Hỏi 8: Trong cơ chế APIPA (RFC 3927), gói tin ARP Probe dùng để làm gì và tại sao trường Sender IP Address bắt buộc phải đặt bằng `0.0.0.0`?

<details>
<summary>Đáp án</summary>

- **Mục đích của ARP Probe (RFC 3927 Section 2.2.1)**: Trước khi chính thức sử dụng địa chỉ IP APIPA đã chọn ngẫu nhiên, host bắt buộc phải gửi gói tin ARP Probe lên mạng cục bộ để kiểm tra xem địa chỉ đó đã bị thiết bị khác chiếm dụng hay chưa.
- **Lý do đặt Sender IP Address = `0.0.0.0`**:
  - Nếu host điền địa chỉ IP dự kiến vào trường Sender IP, các thiết bị khác nhận được gói ARP broadcast sẽ cập nhật bộ đệm bảng ARP (ARP Cache) của chúng với IP đó và MAC của máy gửi.
  - Nếu IP đó vốn đang thuộc về một máy tính khác, hành động này sẽ gây ra **nhiễm bẩn bộ đệm ARP (ARP Cache Poisoning)**, làm gián đoạn liên lạc của máy tính hợp pháp. Do đó, trường Sender IP bắt buộc phải đặt bằng toàn số không (`0.0.0.0`).
</details>

### Câu Hỏi 9: Không gian địa chỉ chia sẻ `100.64.0.0/10` (RFC 6598) được thiết kế cho mục đích gì và giải quyết bài toán nào cho các ISP?

<details>
<summary>Đáp án</summary>

- **Thông số & Mục đích**: Theo RFC 6598 (Section 7), khối `100.64.0.0/10` (từ `100.64.0.0` đến `100.127.255.255`, gồm **4.194.304** địa chỉ) được IANA phân bổ làm **Shared Address Space** cho công nghệ **Carrier-Grade NAT (CGNAT)** trong hạ tầng mạng của các ISP.
- **Vấn đề được giải quyết**: Nếu ISP dùng các dải Private RFC 1918 (như `10.0.0.0/8` hoặc `192.168.0.0/16`) để kết nối thiết bị khách hàng tới router của nhà mạng, nguy cơ xung đột định tuyến và trùng lặp địa chỉ sẽ xảy ra nếu mạng nội bộ khách hàng cũng sử dụng chính dải RFC 1918 đó. Khối `100.64.0.0/10` giúp phân tách hoàn toàn hai không gian mạng này để định tuyến NAT hai tầng diễn ra chính xác.
</details>

### Câu Hỏi 10: Trong thực tế vận hành hạ tầng mạng và Cloud, cần lưu ý những cạm bẫy nào liên quan đến Private IP và cách phòng tránh là gì?

<details>
<summary>Đáp án</summary>

1. **Cạm bẫy trùng lặp IP (IP Subnet Overlap Trap)**:
   - *Vấn đề*: Chọn ngẫu nhiên các dải mặc định trùng nhau (như `172.31.0.0/16` hoặc `192.168.1.0/24`) cho AWS VPC, Azure VNet hoặc Data Center. Sau này khi kết nối Hybrid Cloud (AWS Direct Connect, Azure ExpressRoute) hoặc VPN Site-to-Site / VPC Peering, các dải trùng nhau sẽ **không thể định tuyến được** do xung đột bảng định tuyến.
   - *Best Practice*: Thiết lập quản lý không gian địa chỉ IP (**IPAM** - IP Address Management) tập trung ngay từ đầu, phân bổ rạch ròi các subnet không chồng lấn thuộc dải `10.0.0.0/8` hoặc `172.16.0.0/12`.
2. **Rò rỉ gói tin Private IP ra đường truyền công cộng (Route Leakage)**:
   - *Vấn đề*: Cấu hình thiếu sót trên Border Router làm lộ định tuyến nội bộ RFC 1918 ra nhà mạng, khiến các gói tin lập tức bị Router của ISP drop theo chuẩn RFC 1918 Section 5.
   - *Best Practice*: Luôn cấu hình bộ lọc danh sách truy cập (**ACL**) hoặc cơ chế **NAT/PAT** tại tường lửa biên trước khi lưu lượng rời khỏi mạng nội bộ.
</details>
