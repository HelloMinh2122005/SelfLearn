# Review: 2_3_4 Gratuitous ARP and ARP Spoofing

### Câu Hỏi 1: Trong cơ chế Phát hiện Xung đột Địa chỉ IPv4 (ACD - RFC 5227), gói tin ARP Probe dùng để làm gì và tại sao trường `SPA` của nó bắt buộc phải đặt bằng `0.0.0.0`?

<details>
<summary>Đáp án</summary>

- **Mục đích của ARP Probe**: Kiểm tra xem địa chỉ IPv4 dự định sử dụng đã tồn tại trên đường truyền cục bộ hay chưa trước khi hệ điều hành chính thức gán nó vào giao diện mạng. Nếu hết thời gian chờ (timeout) mà không có trạm nào phản hồi bằng ARP Reply hoặc ARP Announcement, trạm gửi kết luận địa chỉ IP khả dụng để sử dụng.
- **Cấu hình các trường chính của ARP Probe**:
  - Mã thao tác (`ar$op`): `1` (`ares_op$REQUEST`).
  - Địa chỉ IP người gửi (`ar$spa` / `SPA`): `0.0.0.0` (all-zeroes).
  - Địa chỉ MAC mục tiêu (`ar$tha` / `THA`): `00:00:00:00:00:00`.
  - Địa chỉ IP mục tiêu (`ar$tpa` / `TPA`): Địa chỉ IPv4 đang cần thăm dò.
- **Lý do `SPA` bắt buộc là `0.0.0.0`**: Nếu trạm thăm dò đặt địa chỉ IP đang nghi ngờ vào trường `SPA`, các máy trạm khác khi nhận được gói tin broadcast này sẽ tự động cập nhật hoặc làm sai lệch (pollute) bảng ARP cache của chúng bằng cách ghi đè địa chỉ MAC của chủ sở hữu hợp pháp bằng địa chỉ MAC của trạm mới. Đặt `SPA = 0.0.0.0` giúp thăm dò an toàn mà không làm ô nhiễm bộ đệm ARP của các máy lân cận.

</details>

---

### Câu Hỏi 2: Gói tin ARP Announcement (Gratuitous ARP Request) có cấu trúc các trường như thế nào và mang lại ý nghĩa vận hành gì trên mạng LAN?

<details>
<summary>Đáp án</summary>

- **Cấu trúc các trường gói tin ARP Announcement (Gratuitous ARP)**:
  - Mã thao tác (`ar$op`): `1` (Request).
  - Địa chỉ IP người gửi (`SPA`) và Địa chỉ IP mục tiêu (`TPA`): Đều được gán bằng chính địa chỉ IP vừa tiếp nhận (**`SPA == TPA`**).
  - Địa chỉ MAC người gửi (`SHA`): Chứa địa chỉ MAC thực tế của giao diện mạng.
  - Địa chỉ MAC mục tiêu (`THA`): Gán bằng `00:00:00:00:00:00`.
  - Gửi dưới dạng Ethernet Broadcast (`FF:FF:FF:FF:FF:FF`).
- **Ý nghĩa vận hành**:
  1. Thông báo cho toàn bộ các thiết bị trên mạng biết rằng địa chỉ IP này đã có chủ sở hữu hợp pháp.
  2. Xóa bỏ và làm tươi (refresh) các bản ghi cũ, hết hạn hoặc sai lệch (stale ARP cache entries) đang được lưu trên các máy trạm khác.

</details>

---

### Câu Hỏi 3: Trong cụm dự phòng High Availability (sử dụng VRRP hoặc Keepalived), việc nút Master mới phát ngay gói tin Gratuitous ARP khi xảy ra failover giải quyết vấn đề gì ở tầng Layer 2?

<details>
<summary>Đáp án</summary>

- Khi nút Master cũ gặp sự cố và nút Backup chuyển lên làm Master mới, địa chỉ IP ảo (VIP) hoặc MAC ảo (VMAC) lúc này kết nối với Switch qua một cổng vật lý (port) mới.
- **Vai trò của Gratuitous ARP**: Nút Master mới bắt buộc phải phát ngay lập tức một gói tin Gratuitous ARP broadcast ra mạng. Khi gói tin đi tới Switch qua cổng mới, Switch lập tức cập nhật lại **bảng CAM (MAC Address Table)** để chuyển ánh xạ của VIP/VMAC từ cổng vật lý cũ sang cổng vật lý mới, đồng thời các Client cũng cập nhật bảng ARP cache trỏ về MAC mới.
- **Hậu quả tránh được**: Nếu không phát Gratuitous ARP, Switch sẽ tiếp tục chuyển tiếp dữ liệu đến cổng cũ của nút đã chết gây mất kết nối hoàn toàn (**blackholing**), hoặc phải chờ hết thời gian hết hạn timer của bảng CAM (thường từ 300 giây) mới thực hiện flood frame ra mọi cổng (**unknown unicast flooding**).

</details>

---

### Câu Hỏi 4: Hai đặc tính nền tảng nào của giao thức ARP (RFC 826) khiến nó dễ bị tấn công nhiễm độc bộ đệm ARP (ARP Cache Poisoning / Spoofing)?

<details>
<summary>Đáp án</summary>

Giao thức ARP tồn tại hai lỗ hổng mang tính bản chất:
1. **Tính chất phi trạng thái (Statelessness)**: Giao thức ARP không duy trì trạng thái phiên và không lưu vết việc trạm mạng có từng gửi ARP Request hay không. Khi nhận được một gói ARP Reply (kể cả Unsolicited ARP Reply không hề được yêu cầu trước), hầu hết các hệ điều hành sẽ cập nhật ngay lập tức bảng ARP của mình.
2. **Hoàn toàn thiếu vắng cơ chế xác thực (No Authentication)**: ARP không có chữ ký số, mật khẩu hay bất kỳ cơ chế mật mã học nào để xác minh danh tính thực sự của người gửi gói tin.

</details>

---

### Câu Hỏi 5: Kẻ tấn công thực hiện thế tấn công Man-in-the-Middle (MitM) bằng ARP Cache Poisoning như thế nào, và tại sao việc ứng dụng sử dụng HTTPS/TLS vẫn không khiến mạng hoàn toàn miễn nhiễm trước tấn công này?

<details>
<summary>Đáp án</summary>

- **Cách thiết lập thế tấn công Man-in-the-Middle (MitM)**:
  1. Kẻ tấn công gửi gói ARP Reply giả mạo tới **Client**, tuyên bố địa chỉ IP của **Gateway** đang gắn với địa chỉ MAC của kẻ tấn công.
  2. Đồng thời, kẻ tấn công gửi gói ARP Reply giả mạo tới **Gateway**, tuyên bố địa chỉ IP của **Client** cũng đang gắn với địa chỉ MAC của kẻ tấn công.
  3. Cả Client và Gateway đều ghi đè bảng ARP cache của mình. Toàn bộ lưu lượng trao đổi giữa Client và Gateway đều đi qua máy của kẻ tấn công trước khi được chuyển tiếp đi, giúp kẻ tấn công có thể nghe lén, chỉnh sửa gói tin hoặc gây từ chối dịch vụ (DoS).
- **Giới hạn an toàn dù đã dùng HTTPS/TLS**:
  - Dù kẻ tấn công không thể giải mã trực tiếp nội dung dữ liệu mã hóa TLS (nếu không có chứng chỉ CA giả), kẻ tấn công đứng giữa vẫn có thể đọc toàn bộ metadata của tiêu đề IP, thực hiện bẻ gãy kết nối (**DoS**), làm sai lệch phân giải DNS (**DNS Spoofing** thông qua UDP không mã hóa), hoặc thu thập danh sách các máy chủ đích mà nạn nhân đang kết nối.

</details>

---

### Câu Hỏi 6: Khi bắt gói tin bằng `tcpdump -e -n -v -i eth0 arp`, dấu hiệu nào trên dòng log cho biết đó là một gói tin Gratuitous ARP Request?

<details>
<summary>Đáp án</summary>

Trên đầu ra của `tcpdump`, gói tin Gratuitous ARP Request có hai dấu hiệu nhận biết đặc trưng:
1. Địa chỉ MAC đích ở tầng Ethernet là địa chỉ Broadcast **`ff:ff:ff:ff:ff:ff`**.
2. Nội dung thông điệp ARP có dạng **`Request who-has <IP> tell <IP>`** (ví dụ: `Request who-has 192.168.1.50 tell 192.168.1.50`), cho thấy địa chỉ IP người gửi và địa chỉ IP mục tiêu hoàn toàn trùng khớp nhau (**`SPA == TPA`**).

</details>

---

### Câu Hỏi 7: Sự cố "ARP Flux" trên máy chủ Linux có nhiều card mạng (multi-homed) là gì, và tham số nhân Linux `arp_ignore` giải quyết sự cố này như thế nào?

<details>
<summary>Đáp án</summary>

- **Bản chất sự cố ARP Flux**: Mặc định, Linux sử dụng mô hình Weak Host Model với `arp_ignore = 0`. Nếu một máy chủ có hai card mạng (ví dụ `eth0` mang IP1 và `eth1` mang IP2) cùng cắm vào một mạng LAN, khi có ARP Request hỏi IP2 nhưng gói tin đi vào `eth0`, nhân Linux vẫn trả lời bằng địa chỉ MAC của `eth0`. Điều này khiến lưu lượng gửi đến IP2 bị hút về `eth0`, gây mất cân bằng tải, làm flapping bảng MAC trên switch hoặc khiến tường lửa chặn nhầm gói tin.
- **Các giá trị của tham số `arp_ignore`**:
  - `0` (Mặc định): Phản hồi cho bất kỳ địa chỉ IP cục bộ nào trên máy, bất kể ARP Request đi vào từ giao diện mạng nào.
  - `1`: Chỉ phản hồi nếu địa chỉ IP mục tiêu được cấu hình trực tiếp trên **chính giao diện mạng tiếp nhận gói tin ARP Request** (Strong Host Model, cô lập giữa các card mạng).
  - `2`: Chỉ phản hồi nếu địa chỉ IP mục tiêu nằm trên chính giao diện tiếp nhận **VÀ** địa chỉ IP người gửi (`SPA`) nằm trong cùng subnet với giao diện đó.
- **Cách khắc phục ARP Flux**: Thiết lập `arp_ignore = 1` (kết hợp cùng `arp_announce = 2`) trên các máy chủ multi-homed hoặc Kubernetes node có nhiều card mạng.

</details>

---

### Câu Hỏi 8: Hai tham số Linux Kernel `arp_announce` và `arp_notify` kiểm soát hành vi gì, và cấu hình khuyến nghị cho hệ thống sản xuất là bao nhiêu?

<details>
<summary>Đáp án</summary>

- **Tham số `arp_announce`** (quy định địa chỉ IP nguồn nào được đưa vào trường `SPA` khi Linux phát ARP Request ra ngoài):
  - `0` (Mặc định): Sử dụng bất kỳ địa chỉ IP cục bộ nào có trên máy, kể cả từ giao diện khác.
  - `1`: Cố gắng tránh sử dụng các địa chỉ IP cục bộ không thuộc cùng subnet với giao diện đang phát gói tin.
  - `2` (**Khuyến nghị**): Luôn luôn sử dụng địa chỉ IP cục bộ phù hợp nhất (best local address) cho subnet đích trên chính giao diện mạng đang gửi gói tin ra.
- **Tham số `arp_notify`** (điều khiển việc tự động phát Gratuitous ARP khi cấu hình giao diện mạng thay đổi):
  - `0` (Mặc định): Không tự động phát thông báo.
  - `1` (**Khuyến nghị**): Tự động phát gói tin Gratuitous ARP Request ngay khi giao diện mạng được kích hoạt (brought up) hoặc khi địa chỉ MAC thay đổi. Cấu hình này rất cần thiết cho HA/Clustering hoặc khi di chuyển máy ảo (như vMotion) để tránh hiện tượng **blackholing** do bảng CAM trên Switch chưa kịp cập nhật cổng mới.

</details>

---

### Câu Hỏi 9: Tính năng Dynamic ARP Inspection (DAI) trên Switch mạng giúp ngăn chặn tấn công ARP Poisoning ngay tại tầng 2 bằng cơ chế nào?

<details>
<summary>Đáp án</summary>

DAI bảo vệ mạng tầng 2 qua hai bước phối hợp chặt chẽ với **DHCP Snooping**:
1. **Xây dựng cơ sở dữ liệu tin cậy**: Switch bật DHCP Snooping để lắng nghe các gói tin DHCP và xây dựng bảng dữ liệu tin cậy (**DHCP Snooping Binding Database**) lưu bộ thông tin: `<MAC, IP gán phát, Cổng switch, VLAN>`.
2. **Kiểm duyệt gói tin ARP tại cổng truy cập (Access Port)**:
   - Khi một máy trạm gửi bất kỳ gói tin ARP nào (bao gồm ARP Reply hay Gratuitous ARP), Switch chặn lại và giải mã phần tải trọng ARP.
   - Switch đối chiếu cặp `SPA` (IP nguồn) và `SHA` (MAC nguồn) trong gói ARP với cơ sở dữ liệu DHCP Snooping:
     - **Nếu khớp**: Cho phép gói tin đi qua.
     - **Nếu không khớp** (dấu hiệu giả mạo IP của thiết bị khác): Switch lập tức **hủy gói tin (drop)** và ghi log cảnh báo bảo mật, vô hiệu hóa cuộc tấn công ARP Poisoning ngay tại tầng 2.

</details>
