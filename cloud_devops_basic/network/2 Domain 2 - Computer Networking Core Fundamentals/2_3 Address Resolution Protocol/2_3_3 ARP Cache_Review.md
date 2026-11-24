# Review: 2_3_3 ARP Cache

### Câu Hỏi 1: Bộ nhớ đệm ARP (ARP Cache / Neighbor Table) là gì và nó giải quyết vấn đề gì trong mạng cục bộ (LAN)?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: ARP Cache (trong hệ thống Linux hiện đại được chuẩn hóa dưới tên gọi **Bảng Lân Cận — Neighbor Table**) là một vùng nhớ tạm trong RAM do ngăn xếp mạng của hệ điều hành duy trì để lưu vết các ánh xạ từ địa chỉ logic IPv4 (Layer 3) sang địa chỉ vật lý MAC (Layer 2).
- **Vấn đề được giải quyết**: Việc phân giải IP sang MAC bằng giao thức ARP tiêu tốn tài nguyên vì phải phát sóng khung quảng bá (broadcast frame) và chờ thiết bị đích phản hồi. Nếu mọi gói tin dữ liệu gửi đi đều phải kích hoạt chu trình ARP Request/Reply, mạng sẽ nhanh chóng bị quá tải bởi **bão phát thanh (broadcast storm)** và **độ trễ truyền dữ liệu tăng vọt**. Lưu trữ tạm kết quả phân giải trong RAM giúp tái sử dụng ánh xạ ngay lập tức và tăng tốc độ truyền mạng.

</details>

### Câu Hỏi 2: Phân biệt bản ghi động (Dynamic) và bản ghi cố định (Permanent / Static) trong ARP Cache về cách tạo và cách bộ thu dọn rác (garbage collector) xử lý?

<details>
<summary>Đáp án</summary>

Theo tài liệu Linux Kernel `arp(7)` và `ip-neighbour(8)`:

1. **Bản ghi động (Dynamic Entries)**:
   - **Cách tạo**: Được kernel tự động sinh ra và cập nhật thông qua quá trình trao đổi các bản tin ARP Request và ARP Reply trên đường truyền.
   - **Vòng đời & Xử lý của Garbage Collector**: Mang tính tạm thời, có vòng đời giới hạn, trải qua chuỗi trạng thái xác thực (NUD) và **tự động bị bộ thu dọn rác (garbage collector) loại bỏ** dựa trên tuổi thọ (age) và ngưỡng dung lượng bộ nhớ khi không còn được sử dụng thường xuyên.

2. **Bản ghi cố định / vĩnh viễn (Permanent / Static Entries)**:
   - **Cách tạo**: Được thiết lập tường minh bởi quản trị viên hoặc tiến trình dịch vụ thông qua dòng lệnh quản trị (ví dụ `ip neigh add ... nud permanent` hoặc `arp -s`).
   - **Vòng đời & Xử lý của Garbage Collector**: **Không bao giờ bị bộ thu dọn rác xóa bỏ**. Bản ghi chỉ biến mất khi người quản trị xóa thủ công hoặc khi hệ thống khởi động lại (trừ khi được cấu hình lưu trữ vĩnh viễn trong kịch bản mạng của hệ thống).

</details>

### Câu Hỏi 3: Trong máy trạng thái NUD (Neighbor Unreachability Detection) của Linux Kernel, các trạng thái `INCOMPLETE`, `REACHABLE`, `FAILED`, `PERMANENT` và `NOARP` có ý nghĩa và hành vi của kernel như thế nào?

<details>
<summary>Đáp án</summary>

Theo chuẩn `ip-neighbour(8)` và `arp(7)`:

- **`INCOMPLETE`**: Bản ghi chưa (hoặc đang) được xác thực/phân giải. Kernel đã gửi ARP Request và đang tạm giữ các gói tin dữ liệu trong hàng đợi để chờ gói ARP Reply trả về.
- **`REACHABLE`**: Bản ghi hợp lệ và đã được xác nhận là có thể tiếp cận được. Ánh xạ IP-to-MAC tin cậy tuyệt đối và duy trì cho đến khi hết thời gian reachability timeout.
- **`FAILED`**: Đã vượt quá số lần thăm dò tối đa mà không nhận được phản hồi thành công. Bản ghi không thể tiếp cận được; kernel hủy các gói tin đang chờ và trả lỗi về cho ứng dụng (và sau đó bộ thu dọn rác thu hồi bộ nhớ).
- **`PERMANENT`**: Bản ghi tĩnh do quản trị viên cấu hình. Hợp lệ vĩnh viễn, không bao giờ hết hạn và không bao giờ bị bộ dọn rác xóa bỏ.
- **`NOARP`**: Giao diện mạng không yêu cầu phân giải ARP (ví dụ loopback). Trạng thái luôn hợp lệ và không gửi bản tin ARP.

</details>

### Câu Hỏi 4: Các trạng thái `STALE`, `DELAY` và `PROBE` trong NUD hoạt động ra sao và trình tự chuyển tiếp giữa chúng diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

1. **`STALE`**: Bản ghi vẫn hợp lệ nhưng bị "nghi ngờ" (suspicious) do đã trôi qua một khoảng thời gian (`base_reachable_time_ms`) mà không nhận được phản hồi tích cực từ tầng trên. Bản ghi vẫn dùng được để gửi gói tin nhưng cần được xác thực lại.
2. **`DELAY`**: Khi một bản ghi đang ở trạng thái `STALE` và phát sinh nhu cầu gửi dữ liệu mới, kernel chuyển bản ghi sang `DELAY`. Ở trạng thái này, việc kiểm tra tính khả dụng được trì hoãn một khoảng thời gian ngắn để cho phép tầng trên tự phát hiện và xác nhận khả năng tiếp cận (nếu nhận được phản hồi tích cực kịp thời sẽ quay lại `REACHABLE`).
3. **`PROBE`**: Nếu hết thời gian `DELAY` mà vẫn không có phản hồi tích cực, kernel chuyển sang `PROBE` để thăm dò chủ động:
   - Kernel gửi gói tin ARP Request dưới dạng **unicast probe** (đơn hướng) trực tiếp tới địa chỉ MAC đã lưu (lặp lại `ucast_solicit` lần) thay vì phát broadcast ra toàn mạng.
   - Nếu unicast probe thành công (nhận được ARP Reply), bản ghi quay trở lại `REACHABLE`.
   - Nếu unicast probe thất bại hoàn toàn, kernel phát sóng lại ARP Request dạng **broadcast** ra toàn mạng; nếu vẫn không có hồi đáp sau số lần quy định, bản ghi chuyển sang `FAILED`.

</details>

### Câu Hỏi 5: "Phản hồi tích cực" (Positive Feedback) trong ARP Cache là gì, đến từ đâu và ảnh hưởng như thế nào đến vòng đời của một bản ghi?

<details>
<summary>Đáp án</summary>

- **Khái niệm**: Phản hồi tích cực (Positive Feedback) là tín hiệu từ các tầng giao thức phía trên chứng minh rằng đường truyền tới nút lân cận vẫn đang tạo ra tiến triển về phía trước (forward progress) và bên kia vẫn đang nhận dữ liệu bình thường.
- **Nguồn gốc (theo `arp(7)`)**:
  - Từ tầng giao vận phía trên, điển hình là khi nhận được một gói tin **TCP ACK thành công**.
  - Đối với các giao thức khác (như UDP), ứng dụng có thể truyền cờ **`MSG_CONFIRM`** thông qua lời gọi hệ thống `sendmsg(2)` để báo cho kernel biết nút lân cận vẫn phản hồi tốt.
- **Ảnh hưởng đến vòng đời bản ghi**:
  - Khi còn ở trạng thái `REACHABLE` (hoặc đang ở `DELAY`) và có phản hồi tích cực, kernel duy trì/gia hạn trạng thái `REACHABLE` mà không cần phát bản tin thăm dò ARP ra mạng.
  - Nếu hết khoảng thời gian `base_reachable_time_ms` mà **không** nhận được phản hồi tích cực, bản ghi ở trạng thái `REACHABLE` sẽ tự động chuyển sang `STALE`.

</details>

### Câu Hỏi 6: Giải thích ý nghĩa, giá trị mặc định và cơ chế hoạt động của hai tham số kernel `base_reachable_time_ms` và `gc_stale_time` trong `/proc/sys/net/ipv4/neigh/*/*`?

<details>
<summary>Đáp án</summary>

1. **`base_reachable_time_ms`** (bổ sung từ Linux 2.6.12):
   - **Ý nghĩa**: Giá trị cơ sở (tính bằng mili-giây) xác định khoảng thời gian một bản ghi duy trì trạng thái `REACHABLE` khi không có phản hồi tích cực.
   - **Giá trị mặc định**: **`30000` ms** (30 giây).
   - **Cơ chế ngẫu nhiên hóa (Randomization)**: Để ngăn tình trạng toàn bộ các máy trạm trong mạng cùng hết hạn bản ghi và đồng loạt gửi yêu cầu thăm dò tại cùng một thời điểm, kernel chọn thời gian hết hạn thực tế ngẫu nhiên trong khoảng từ $\frac{\text{base}}{2}$ đến $\frac{3 \times \text{base}}{2}$ (tức **15 đến 45 giây** với mặc định `30000` ms).

2. **`gc_stale_time`** (bổ sung từ Linux 2.2):
   - **Ý nghĩa**: Tham số xác định tần suất bộ thu dọn rác (garbage collector) quét và kiểm tra các bản ghi lân cận đã rơi vào trạng thái `STALE`. Khi một bản ghi bị coi là stale, kernel sẽ thực hiện phân giải lại trước khi gửi dữ liệu tiếp theo đến địa chỉ đó.
   - **Giá trị mặc định**: **`60` giây**.

</details>

### Câu Hỏi 7: Khi Linux Kernel cần truyền một gói tin IP tới Next-Hop IP, quy trình tra cứu ARP Cache sẽ xử lý như thế nào trong từng trường hợp trạng thái của bản ghi?

<details>
<summary>Đáp án</summary>

Theo luồng xử lý gói tin của Linux Kernel:

1. **Tìm thấy bản ghi `PERMANENT` hoặc `REACHABLE`**: Kernel lấy địa chỉ MAC ngay lập tức và đóng gói khung Layer 2 để truyền đi.
2. **Tìm thấy bản ghi `STALE`**: Kernel vẫn sử dụng địa chỉ MAC hiện tại để gửi gói tin đi, đồng thời chuyển trạng thái bản ghi sang `DELAY` / `PROBE` để xác thực lại.
3. **Không tìm thấy bản ghi hoặc bản ghi đang ở trạng thái `FAILED`**:
   - Kernel chuyển bản ghi sang trạng thái `INCOMPLETE` và **tạm giữ gói tin trong hàng đợi (queue)**.
   - Kernel phát sóng ARP Request (Broadcast).
   - Nếu **nhận được ARP Reply**: cập nhật bản ghi sang `REACHABLE`, giải phóng hàng đợi và truyền gói tin.
   - Nếu **không nhận được phản hồi (Timeout)**: đánh dấu `FAILED`, hủy gói tin và báo lỗi (`Host Unreachable`) về cho ứng dụng.

</details>

### Câu Hỏi 8: Trình bày các lệnh của công cụ hiện đại `ip neigh` (`iproute2`) để xem bảng lân cận, thêm bản ghi vĩnh viễn, xóa một bản ghi và xóa sạch (flush) toàn bộ bản ghi trên một giao diện mạng?

<details>
<summary>Đáp án</summary>

Theo tài liệu `ip-neighbour(8)`:

- **Xem toàn bộ bảng lân cận** (hiển thị IP, `lladdr`/MAC, thiết bị mạng `dev` và trạng thái NUD):
  ```bash
  ip neigh show
  ```
- **Thêm một bản ghi tĩnh vĩnh viễn (`PERMANENT`)**:
  ```bash
  sudo ip neigh add <IP> lladdr <MAC> dev <iface> nud permanent
  ```
  *(Ví dụ: `sudo ip neigh add 192.168.1.200 lladdr 00:11:22:33:44:55 dev eth0 nud permanent`)*
- **Xóa một bản ghi lân cận cụ thể**:
  ```bash
  sudo ip neigh del <IP> dev <iface>
  ```
- **Xóa sạch (flush) toàn bộ các bản ghi trên một giao diện mạng cụ thể**:
  ```bash
  sudo ip neigh flush dev <iface>
  ```

</details>

### Câu Hỏi 9: Công cụ truyền thống `arp` (`net-tools`) dùng các lệnh nào để xem bảng ARP, thêm bản ghi cố định và xóa bản ghi? Hai cờ (Flags) `C` và `M` trong đầu ra của `arp -n` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Theo đặc tả `arp(8)`:

- **Các lệnh `arp` cơ bản**:
  - `arp -a`: Hiển thị bảng ARP theo định dạng BSD kinh điển.
  - `arp -n`: Hiển thị địa chỉ dưới dạng số (numeric), không tốn thời gian phân giải ngược tên miền qua DNS.
  - `sudo arp -s <IP> <MAC>`: Thêm một bản ghi cố định (permanent stored entry).
  - `sudo arp -d <IP>`: Xóa một bản ghi khỏi bảng ARP.
- **Ý nghĩa các cờ (Flags) trong đầu ra `arp -n`**:
  - **`C` (Complete)**: Bản ghi đã được phân giải hoàn tất và hợp lệ.
  - **`M` (Permanent)**: Bản ghi tĩnh được tạo thủ công, không bị thu dọn tự động.

</details>

### Câu Hỏi 10: Sự cố tràn bảng lân cận (Neighbor Table Overflow) xảy ra khi nào, gây ra hậu quả gì và cách khắc phục trong môi trường production ra sao?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân xảy ra**: Mặc định, Linux Kernel giới hạn kích thước tối đa của bảng lân cận thông qua các ngưỡng của bộ thu dọn rác (`gc_thresh1`, `gc_thresh2`, `gc_thresh3`). Trên các máy chủ đóng vai trò Gateway, NAT router hoặc Kubernetes Node giao tiếp đồng thời với hàng chục nghìn Pod/IP trên cùng một subnet phẳng, số lượng bản ghi vượt quá ngưỡng `gc_thresh3` (thường mặc định 1024 hoặc 4096 tùy distro).
- **Biểu hiện & Hậu quả**:
  - Kernel ghi nhận cảnh báo `kernel: [xxx] neighbor table overflow!` trong `dmesg`.
  - Kernel từ chối phân giải địa chỉ cho các kết nối mới, dẫn đến **rớt gói tin hàng loạt (packet loss)** và không thể thiết lập kết nối mạng mới dù CPU và RAM vẫn còn dư thừa.
- **Cách khắc phục**: Chủ động điều chỉnh tăng các ngưỡng `net.ipv4.neigh.default.gc_thresh*` trong `/etc/sysctl.conf` sao cho phù hợp với quy mô hạ tầng.

</details>

### Câu Hỏi 11: Vì sao không nên lạm dụng bản ghi ARP tĩnh (Permanent ARP) trong môi trường High Availability (HA) / IP Failover, và điều gì xảy ra nếu cấu hình `base_reachable_time_ms` quá thấp?

<details>
<summary>Đáp án</summary>

1. **Cạm bẫy bản ghi tĩnh (Permanent ARP) trong môi trường HA / IP Failover**:
   - Bản ghi tĩnh (`nud permanent` / `arp -s`) nằm cứng trong RAM và **không bao giờ bị bộ thu dọn rác loại bỏ**.
   - Trong các giải pháp HA như Keepalived, VRRP hoặc CARP, một Virtual IP (VIP) có thể chuyển đổi từ Node Active (Node A) sang Node Standby (Node B) khi có sự cố. Nếu một máy chủ khác cấu hình bản ghi ARP tĩnh trỏ VIP vào MAC của Node A, khi Node A sập và Node B tiếp quản VIP, máy chủ đó vẫn tiếp tục gửi khung tin tới MAC cũ của Node A, gây **gián đoạn kết nối hoàn toàn (blackhole)** cho đến khi xóa bản ghi tĩnh thủ công.

2. **Cạm bẫy cấu hình `base_reachable_time_ms` quá thấp**:
   - Nếu hạ `base_reachable_time_ms` xuống quá thấp (ví dụ vài trăm mili-giây), bản ghi liên tục bị đẩy từ `REACHABLE` sang `STALE`, kích hoạt chu kỳ `DELAY` và phát hàng loạt gói `PROBE` (unicast và broadcast) ra mạng vật lý.
   - Điều này gây **quá tải ngắt CPU cho card mạng** và **lãng phí băng thông mạng nội bộ**. Nên giữ giá trị mặc định 30 giây kèm cơ chế ngẫu nhiên hóa của kernel.

</details>
