# Review: 2_7_2 Dynamic Host Configuration Protocol

### Câu Hỏi 1: DHCP giải quyết bài toán gì và tự động phân phối những thông số cấu hình mạng cơ bản nào cho thiết bị mới kết nối vào mạng LAN?

<details>
<summary>Đáp án</summary>

Khi một thiết bị mới khởi động và kết nối vào mạng LAN, nó chưa có danh tính logic để giao tiếp. Giao thức **DHCP (Dynamic Host Configuration Protocol)** — được chuẩn hóa trong RFC 2131 và RFC 2132 — giúp tự động hóa hoàn toàn việc cấp phát cấu hình mạng TCP/IP, tránh cho quản trị viên phải cấu hình tĩnh thủ công từng máy.

Các thông số mạng cơ bản DHCP tự động phân phối gồm:
- **Địa chỉ IP (IP Address)** và **Thời hạn thuê (Lease Time)**
- **Mặt nạ mạng con (Subnet Mask)**
- **Địa chỉ cổng mặc định (Default Gateway)**
- **Địa chỉ máy chủ DNS (DNS Server)** để phân giải tên miền
</details>

### Câu Hỏi 2: DHCP hoạt động ở tầng nào, sử dụng giao thức tầng giao vận nào và phân chia các cổng (port) như thế nào giữa Server, Relay Agent và Client?

<details>
<summary>Đáp án</summary>

DHCP hoạt động ở **tầng Ứng dụng (Application Layer)** dựa trên giao thức tầng Giao vận **UDP (User Datagram Protocol)** với hai số cổng tách biệt:
- **UDP Port 67**: Cổng dịch vụ lắng nghe của **DHCP Server** và **DHCP Relay Agent**.
- **UDP Port 68**: Cổng tiếp nhận phản hồi của **DHCP Client**.

Việc sử dụng hai cổng riêng biệt giúp tránh xung đột lưu lượng khi nhiều tiến trình máy khách và máy chủ cùng hoạt động trên cùng một phân đoạn mạng.
</details>

### Câu Hỏi 3: Chu trình 4 bước DORA gồm những thông điệp nào theo đúng thứ tự và vai trò chính của từng bước là gì?

<details>
<summary>Đáp án</summary>

Chu trình cấp phát IP mới **DORA** diễn ra theo 4 bước tuần tự:
1. **DHCPDISCOVER (Khám phá)**: Client gửi gói tin quảng bá (Broadcast) để tìm kiếm các DHCP Server khả dụng trên mạng cục bộ.
2. **DHCPOFFER (Đề xuất)**: Các DHCP Server nhận được gói Discover sẽ kiểm tra IP Pool và gửi đề xuất địa chỉ IP dự kiến (`yiaddr`), Lease Time, Subnet Mask, Default Gateway và Server Identifier (Option 54).
3. **DHCPREQUEST (Yêu cầu chính thức)**: Client chọn một server (thường là server phản hồi Offer đầu tiên) và gửi yêu cầu chính thức xin nhận địa chỉ IP đó.
4. **DHCPACK (Xác nhận & Cam kết)**: Server được chọn lưu thông tin liên kết (binding) giữa MAC của client và IP vào bộ lưu trữ lâu bền (persistent storage), rồi gửi lại đầy đủ tham số mạng để client chính thức gán IP vào card mạng và bắt đầu giao tiếp.
</details>

### Câu Hỏi 4: Trong bước DHCPDISCOVER, IP nguồn của Client là gì và thiết bị được định danh bằng trường nào? Tại sao bước DHCPREQUEST bắt buộc gửi dạng Broadcast kèm Option 54 thay vì Unicast?

<details>
<summary>Đáp án</summary>

- **Ở bước 1 (DHCPDISCOVER)**: Vì chưa có IP, client đặt địa chỉ IP nguồn là `0.0.0.0` và gửi Broadcast tới IP đích `255.255.255.255` (MAC đích `FF:FF:FF:FF:FF:FF`). Client định danh bản thân bằng cách gắn địa chỉ MAC phần cứng vào trường **`chaddr`**.
- **Ở bước 3 (DHCPREQUEST)**: Client gửi gói tin dưới dạng **Broadcast** kèm **Option 54 (Server Identifier)** ghi rõ IP của server được chọn. Mục đích là để công khai thông báo cho **tất cả** các DHCP Server trên mạng biết lựa chọn của client; nhờ đó, các server không được chọn sẽ lập tức hủy đề xuất và hoàn trả địa chỉ IP dự kiến về lại IP Pool khả dụng.
</details>

### Câu Hỏi 5: Cấu trúc gói tin DHCP kế thừa từ giao thức nào, phần đầu chuẩn có kích thước bao nhiêu bytes và Magic Cookie có vai trò gì?

<details>
<summary>Đáp án</summary>

Gói tin DHCP kế thừa định dạng khung từ giao thức tiền nhiệm **BOOTP** (RFC 2131 Section 2):
- Phần tiêu đề cố định có kích thước **236 bytes**, kết hợp với **4 bytes Magic Cookie**, tạo thành khối **240 bytes** chuẩn trước khi bắt đầu vùng `options` có kích thước biến thiên.
- **Magic Cookie** mang giá trị chuẩn hóa bắt buộc là `0x63825363` (hệ thập phân: `99, 130, 83, 99`), dùng để đánh dấu điểm bắt đầu của vùng **Options**.
</details>

### Câu Hỏi 6: Trong tiêu đề gói tin DHCP, các trường `op`, `xid`, `ciaddr`, `yiaddr`, `giaddr` và `chaddr` có ý nghĩa kỹ thuật gì?

<details>
<summary>Đáp án</summary>

- **`op` (1 byte)**: Mã thao tác tin nhắn (`1` = BOOTREQUEST do Client gửi, `2` = BOOTREPLY do Server gửi).
- **`xid` (4 bytes)**: Transaction ID — chuỗi số nguyên ngẫu nhiên do client sinh ra để ghép nối cặp request và response.
- **`ciaddr` (4 bytes)**: Client IP address — IP hiện tại của client (chỉ điền khi ở trạng thái `BOUND`, `RENEWING` hoặc `REBINDING`; điền `0.0.0.0` khi chưa có IP).
- **`yiaddr` (4 bytes)**: "Your" (client) IP address — địa chỉ IP do server cấp cho client.
- **`giaddr` (4 bytes)**: Gateway / Relay IP address — địa chỉ IP giao diện của DHCP Relay Agent (khi có trung chuyển qua relay).
- **`chaddr` (16 bytes)**: Client hardware address — địa chỉ MAC thực tế của client (chứa 6 bytes MAC, 10 bytes còn lại đệm `0`).
</details>

### Câu Hỏi 7: Vùng DHCP Options sử dụng cơ chế mã hóa nào và các Option 1, 3, 6, 51, 53, 54, 58, 59 đại diện cho thông số gì?

<details>
<summary>Đáp án</summary>

Phần Options sử dụng cơ chế mã hóa **TLV (Type - Length - Value)**. Ý nghĩa các Option phổ biến theo RFC 2132 gồm:
- **Option 1 (Subnet Mask)**: Mặt nạ mạng con (ví dụ `255.255.255.0`).
- **Option 3 (Router)**: Danh sách địa chỉ IP của Default Gateway.
- **Option 6 (Domain Name Server)**: Danh sách địa chỉ IP của các máy chủ DNS.
- **Option 51 (IP Address Lease Time)**: Tổng thời gian cho thuê địa chỉ IP (tính bằng giây).
- **Option 53 (DHCP Message Type)**: Xác định loại bản tin (1 byte): `1` = DHCPDISCOVER, `2` = DHCPOFFER, `3` = DHCPREQUEST, `4` = DHCPDECLINE, `5` = DHCPACK, `6` = DHCPNAK, `7` = DHCPRELEASE, `8` = DHCPINFORM.
- **Option 54 (Server Identifier)**: Địa chỉ IP của DHCP Server thực hiện cấp phát.
- **Option 58 (Renewal Time Value T1)**: Mốc thời gian bắt đầu xin gia hạn đơn phương.
- **Option 59 (Rebinding Time Value T2)**: Mốc thời gian bắt đầu phát quảng bá tìm server thay thế.
</details>

### Câu Hỏi 8: Vòng đời Lease Time vận hành qua các mốc T1, T2 và lúc hết hạn (Expire) ở tỷ lệ thời gian nào, kèm trạng thái và cách gửi gói tin ra sao?

<details>
<summary>Đáp án</summary>

Vòng đời hợp đồng thuê IP (sau trạng thái `BOUND`) diễn ra qua các mốc:
1. **Mốc T1 — Renewal Timer (Mặc định $50\%$ hay $0.5 \times \text{Lease Time}$)**:
   - Client chuyển sang trạng thái **`RENEWING`**.
   - Client chủ động gửi **`DHCPREQUEST` dạng UNICAST** trực tiếp tới địa chỉ IP của server đã cấp phát ban đầu (lấy từ Option 54). Nếu nhận được `DHCPACK`, chu kỳ lease được khởi tạo lại.
2. **Mốc T2 — Rebinding Timer (Mặc định $87.5\%$ hay $0.875 \times \text{Lease Time}$)**:
   - Nếu server ban đầu không phản hồi ở mốc T1, client chuyển sang trạng thái **`REBINDING`**.
   - Client **bắt buộc gửi `DHCPREQUEST` dạng BROADCAST tới `255.255.255.255`** để cầu cứu bất kỳ DHCP Server nào đang hoạt động trên mạng gia hạn IP.
3. **Hết hạn — Expire ($100\%$ Lease Time)**:
   - Nếu vẫn không nhận được `DHCPACK`, client **bắt buộc phải ngừng sử dụng địa chỉ IP đó ngay lập tức**, toàn bộ lưu lượng mạng IP bị ngắt, và client quay về trạng thái **`INIT`** để gửi lại `DHCPDISCOVER` từ đầu.
</details>

### Câu Hỏi 9: Ngoài 4 thông điệp DORA, 4 thông điệp bổ trợ `DHCPDECLINE`, `DHCPNAK`, `DHCPRELEASE` và `DHCPINFORM` được sử dụng trong những tình huống nào?

<details>
<summary>Đáp án</summary>

Theo RFC 2131, 4 thông điệp bổ trợ có vai trò:
- **`DHCPDECLINE`**: Sau khi nhận `DHCPACK`, client phát ARP Probe để kiểm tra trùng IP. Nếu phát hiện thiết bị khác đang dùng IP này, client gửi `DHCPDECLINE` báo cho server biết để server đánh dấu cách ly địa chỉ bị xung đột.
- **`DHCPNAK`**: Server gửi thông báo từ chối khi yêu cầu gia hạn của client không hợp lệ (ví dụ: client vừa chuyển sang subnet khác hoặc hợp đồng thuê đã bị thu hồi). Client nhận `DHCPNAK` phải lập tức hủy IP và xin cấp lại từ đầu.
- **`DHCPRELEASE`**: Client chủ động gửi dạng Unicast tới server khi tắt nguồn có trật tự (graceful shutdown) hoặc ngắt kết nối card mạng để trả lại IP trước thời hạn.
- **`DHCPINFORM`**: Được gửi bởi máy khách **đã được gán sẵn IP tĩnh thủ công**, nhằm truy vấn DHCP Server để lấy bổ sung các tham số cấu hình khác (như DNS Server, Domain Name, NTP Server) mà không cần cấp phát IP.
</details>

### Câu Hỏi 10: Vì sao cần DHCP Relay Agent khi mạng có nhiều VLAN/Subnet, và trường `giaddr` đóng vai trò gì trong quá trình chuyển tiếp?

<details>
<summary>Đáp án</summary>

- **Lý do cần DHCP Relay Agent**: Các thiết bị định tuyến Layer 3 (Router) mặc định chặn đứng và không chuyển tiếp các gói tin Broadcast (`255.255.255.255`). Do đó, gói `DHCPDISCOVER` từ client ở VLAN này không thể tự vượt qua Router để tới DHCP Server đặt ở VLAN/Subnet khác.
- **Cơ chế hoạt động & vai trò của `giaddr`**:
  1. DHCP Relay Agent chạy trên Router hoặc Switch Layer 3 (ví dụ cấu hình qua lệnh `ip helper-address` trên Cisco) sẽ chặn bắt gói `DHCPDISCOVER` ở cổng UDP 67.
  2. Relay Agent điền địa chỉ IP của chính giao diện cổng cục bộ nơi nó vừa nhận gói tin vào trường **`giaddr` (Gateway IP Address)** và tăng giá trị trường `hops`.
  3. Relay Agent chuyển gói tin từ Broadcast thành **Unicast** và định tuyến tới cụm DHCP Server tập trung.
  4. DHCP Server đọc trường **`giaddr`** để xác định chính xác client đang thuộc Subnet/VLAN nào, từ đó trích xuất IP từ đúng dải địa chỉ (Scope/Pool) tương ứng để đề xuất trả về.
</details>

### Câu Hỏi 11: Trên hệ thống Linux, quản trị viên kiểm tra log DHCP, xem tệp lưu thông tin lease, giải phóng IP và yêu cầu cấp mới IP bằng những lệnh và đường dẫn nào?

<details>
<summary>Đáp án</summary>

- **Kiểm tra nhật ký DHCP qua `journalctl`**:
  - Với `systemd-networkd`: `journalctl -u systemd-networkd -b --no-pager | grep -iE "(dhcp|lease)"`
  - Với `NetworkManager`: `journalctl -u NetworkManager -b --no-pager | grep -i "dhcp4"`
- **Đường dẫn tệp lưu thông tin lease**:
  - Đối với `systemd-networkd`: `/run/systemd/netif/leases/`
  - Đối với `dhclient`: `/var/lib/dhcp/dhclient.leases`
- **Giải phóng và tái cấp phát IP với `dhclient`**:
  - Giải phóng IP hiện tại (gửi `DHCPRELEASE` và gỡ IP khỏi interface): `sudo dhclient -r eth0`
  - Yêu cầu cấp mới IP ở chế độ chi tiết (verbose): `sudo dhclient -v eth0`
</details>

### Câu Hỏi 12: Nêu 3 cạm bẫy thực tế phổ biến khi vận hành DHCP trong sản xuất (Rogue DHCP Server, cấu hình sai Lease Time, thiếu Relay Agent) và cách phòng tránh/khắc phục tương ứng?

<details>
<summary>Đáp án</summary>

1. **Rogue DHCP Server (Tấn công Man-in-the-Middle / mất mạng)**:
   - *Nguyên nhân & hậu quả*: Một thiết bị lạ (như router WiFi cá nhân cắm nhầm vào switch công ty hoặc máy ảo dựng nhầm dịch vụ DHCP) phản hồi `DHCPOFFER` nhanh hơn server chính thức và cấp sai IP/Gateway, khiến lưu lượng bị chuyển hướng qua kẻ tấn công hoặc mất mạng diện rộng.
   - *Cách phòng tránh*: Bật tính năng **DHCP Snooping** trên các switch truy cập Layer 2, phân định cổng **Trusted** (chỉ cho phép nhận `DHCPOFFER`/`DHCPACK` từ server chính thức) và cổng **Untrusted** (drop toàn bộ phản hồi DHCP server từ phía client).
2. **Cấu hình sai Lease Time**:
   - *Quá dài ở môi trường luân chuyển cao* (Wi-Fi công cộng, hội thảo, auto-scaling test runner): Kho IP Pool nhanh chóng bị cạn kiệt (**DHCP Starvation**) vì giữ chỗ cho thiết bị chỉ ghé qua thời gian ngắn — nên đặt Lease Time ngắn (khoảng 30 phút đến 2 giờ).
   - *Quá ngắn ở văn phòng/Data Center*: Hàng nghìn máy liên tục gửi `DHCPREQUEST` ở mốc T1/T2 làm quá tải CPU của DHCP Server và gây nghẽn băng thông (broadcast noise) — tiêu chuẩn nên là từ 24 giờ đến 7 ngày.
3. **Thiếu cấu hình DHCP Relay Agent (Missing IP Helper)**:
   - *Nguyên nhân & hậu quả*: Khi chia tách VLAN mới mà quên cấu hình DHCP Relay trên interface router của VLAN đó, gói broadcast của client bị chặn ngay tại router nên không nhận được IP (hoặc tự gán IP APIPA `169.254.x.x`).
   - *Cách khắc phục*: Cấu hình đầy đủ DHCP Relay (`ip helper-address`) trên interface router của các VLAN tương ứng.
</details>
