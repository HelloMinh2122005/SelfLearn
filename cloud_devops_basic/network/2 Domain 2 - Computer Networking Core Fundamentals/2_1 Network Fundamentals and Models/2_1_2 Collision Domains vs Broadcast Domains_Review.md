# Review: 2_1_2 Collision Domains vs Broadcast Domains

### Câu Hỏi 1: Miền xung đột (Collision Domain) là gì, hiện tượng va chạm xảy ra khi nào và số lượng thiết bị ảnh hưởng như thế nào đến băng thông?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Miền xung đột (Collision Domain) là một phân đoạn mạng vật lý dùng chung môi trường truyền dẫn (shared transmission medium).
- **Khi nào xảy ra va chạm (collision)**: Nếu hai hoặc nhiều thiết bị trong cùng một Collision Domain phát tín hiệu đồng thời, các xung điện từ trên đường truyền sẽ giao thoa và triệt tiêu lẫn nhau, gây ra xung đột tín hiệu vật lý.
- **Ảnh hưởng đến băng thông**: Số lượng thiết bị trong một Collision Domain càng lớn thì xác suất xung đột càng cao, khiến băng thông hữu dụng của đường truyền bị suy giảm nghiêm trọng.
</details>

### Câu Hỏi 2: Môi trường Bán song công (Half-Duplex) hoạt động như thế nào và thuật toán CSMA/CD xử lý ra sao khi phát hiện va chạm?

<details>
<summary>Đáp án</summary>

- **Chế độ Half-Duplex**: Trên liên kết Ethernet Half-Duplex, thiết bị chỉ có thể **gửi hoặc nhận** tín hiệu tại một thời điểm, không thể thực hiện đồng thời cả hai thao tác trên cùng một kênh truyền.
- **Vai trò của CSMA/CD**: Ethernet Half-Duplex bắt buộc phải dùng thuật toán **CSMA/CD** (Carrier Sense Multiple Access with Collision Detection) để chia sẻ đường truyền.
- **Quy trình khi va chạm xảy ra**:
  1. Các trạm phát hiện xung đột tín hiệu lập tức **hủy khung tin** đang truyền.
  2. Phát ra tín hiệu cảnh báo va chạm (**jam signal**) để toàn bộ mạng nhận biết.
  3. Mỗi nút chờ một khoảng thời gian ngẫu nhiên (**exponential backoff**) trước khi thử truyền lại.
</details>

### Câu Hỏi 3: Hub hoạt động ở tầng nào của mô hình OSI, xử lý tín hiệu như thế nào và tạo ra bao nhiêu Collision Domain?

<details>
<summary>Đáp án</summary>

- **Tầng OSI**: Hub (Bộ lặp đa cổng - Multiport Repeater) hoạt động hoàn toàn ở **Tầng Vật lý (Layer 1)**.
- **Cách xử lý tín hiệu**: Hub chỉ xử lý các bit tín hiệu điện/quang riêng lẻ, **không có bộ nhớ đệm (no buffering)** và không hiểu cấu trúc khung Ethernet (không phân tích địa chỉ MAC hay kiểm tra FCS). Khi có bit đi vào một cổng, Hub khuếch đại biên độ tín hiệu và phát lặp lại bit đó ra **tất cả các cổng còn lại**.
- **Số lượng Collision Domain**: Tất cả các cổng của một Hub nằm chung trong **1 Collision Domain duy nhất** (vì nếu hai thiết bị ở hai cổng khác nhau cùng phát tín hiệu, xung điện sẽ va chạm ngay tại bảng mạch trung tâm của Hub). Hub chỉ kéo dài phạm vi khoảng cách vật lý chứ không phân tách miền xung đột.
</details>

### Câu Hỏi 4: Switch (Layer 2) xử lý khung tin khác với Hub (Layer 1) như thế nào và kỹ thuật vi phân đoạn (microsegmentation) là gì?

<details>
<summary>Đáp án</summary>

- **Cách Switch xử lý khung tin**: Hoạt động ở **Tầng Liên kết Dữ liệu (Layer 2)**, Switch nhận trọn vẹn khung tin vào **bộ nhớ đệm (frame buffering)**, kiểm tra mã toàn vẹn **FCS / CRC-32**, đọc địa chỉ MAC nguồn để học vào bảng CAM và đọc MAC đích để chuyển tiếp có chọn lọc. Nhờ lưu đệm, Switch không bao giờ truyền đồng thời nhiều hơn một khung tin trên cùng một phân đoạn cáp tại một thời điểm.
- **Vi phân đoạn mạng (Microsegmentation)**: Là kỹ thuật phân tách mà **mỗi cổng của Switch tạo thành một Collision Domain độc lập**. Trong mạng LAN thuần Switch chạy Full-Duplex, va chạm vật lý bị triệt tiêu hoàn toàn (0 collisions).
</details>

### Câu Hỏi 5: Chế độ Toàn song công (Full-Duplex) hoạt động ra sao và tại sao CSMA/CD được vô hiệu hóa trong chế độ này?

<details>
<summary>Đáp án</summary>

- **Cơ chế Full-Duplex**: Đường truyền giữa Switch và card mạng (NIC) cung cấp **hai kênh truyền dẫn độc lập**: một kênh dành riêng cho chiều truyền (**TX**) và một kênh dành riêng cho chiều nhận (**RX**).
- **Lý do vô hiệu hóa CSMA/CD**: Vì tín hiệu gửi và nhận đi trên hai kênh riêng biệt, không dùng chung một dây dẫn nên không thể xảy ra xung đột tín hiệu vật lý; do đó thuật toán CSMA/CD được vô hiệu hóa hoàn toàn.
</details>

### Câu Hỏi 6: Điều gì xảy ra khi hai máy A và B cùng gửi dữ liệu đến máy C tại cùng một thời điểm qua Switch chạy Full-Duplex? Hiện tượng xếp hàng khi đó có phải là collision không?

<details>
<summary>Đáp án</summary>

- **Quá trình xử lý của Switch**:
  - Khung tin từ A và B đi vào hai cổng riêng biệt qua kênh TX độc lập nên đi vào bộ đệm của Switch mà **không xảy ra collision**.
  - Khi hai khung cùng cần đi ra **một cổng đích** (cổng của C), Switch **xếp hàng (queue)** các khung trong bộ đệm và gửi lần lượt ra cổng của C.
- **Bản chất hiện tượng**: Đây là **nghẽn hàng đợi (congestion)**, **không phải collision**. Nếu bộ đệm bị đầy, Switch sẽ **hủy bớt khung (drop)** và các giao thức tầng trên như TCP sẽ phát hiện mất gói rồi gửi lại.
</details>

### Câu Hỏi 7: Switch sử dụng bảng MAC (CAM table) để thực hiện các bước học, chuyển tiếp và flood như thế nào?

<details>
<summary>Đáp án</summary>

Switch quản lý vị trí các thiết bị bằng bảng MAC (CAM table) qua 3 hành vi:
1. **Học (Learning)**: Khi nhận khung từ cổng X, Switch đọc **MAC nguồn** và ghi nhớ "MAC này nằm sau cổng X".
2. **Chuyển tiếp có chọn lọc (Forwarding)**: Nếu **MAC đích** đã có trong bảng CAM, Switch chỉ gửi khung ra đúng cổng đó; các máy ở cổng khác không nhận được khung này.
3. **Flood**: Nếu MAC đích **chưa biết** (unknown unicast) hoặc là khung **broadcast**, Switch gửi khung ra tất cả các cổng khác ngoại trừ cổng đã nhận vào.
</details>

### Câu Hỏi 8: Việc hai đầu của một session TCP cùng lúc gửi dữ liệu có gây ra collision không? Giải thích dựa trên tầng OSI.

<details>
<summary>Đáp án</summary>

- **Không**. Hai đầu của một session TCP cùng lúc gửi dữ liệu là hoạt động bình thường ở **Layer 4** và không đồng nghĩa với collision.
- **Giải thích**: Collision là hiện tượng vật lý/liên kết chỉ xảy ra ở **Layer 1 / Layer 2** khi hai tín hiệu cùng đi trên một đường truyền vật lý **Half-Duplex** dùng chung.
</details>

### Câu Hỏi 9: Miền quảng bá (Broadcast Domain) là gì? Cho biết địa chỉ Broadcast chuẩn ở Layer 2, Layer 3 (IPv4 Limited Broadcast) và mục đích sử dụng của broadcast.

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Miền quảng bá (Broadcast Domain) là vùng mạng mà khi một thiết bị gửi một khung tin broadcast, tất cả các thiết bị khác trong cùng vùng đó đều nhận được bản sao và bắt buộc phải **ngắt CPU** để đọc và xử lý khung tin.
- **Địa chỉ Broadcast chuẩn**:
  - **Layer 2 (MAC Broadcast)**: Địa chỉ phần cứng 48-bit gồm toàn bộ bit 1, dạng thập lục phân là `FF:FF:FF:FF:FF:FF`.
  - **Layer 3 (IPv4 Limited Broadcast)**: Địa chỉ logic 32-bit gồm toàn bộ bit 1 là `255.255.255.255` (khi phát ra cáp Ethernet sẽ được ánh xạ vào khung tin có MAC đích `FF:FF:FF:FF:FF:FF`).
- **Mục đích**: Phục vụ các giao thức khởi tạo và khám phá cấu hình mạng cục bộ khi máy gửi chưa biết địa chỉ cụ thể của đối phương (ví dụ: **ARP Request** để tìm MAC từ IP, hoặc **DHCP Discover** để xin cấp phát IP).
</details>

### Câu Hỏi 10: Switch mặc định có phân tách Broadcast Domain không? Nếu muốn chia tách Broadcast Domain trên Switch thì dùng cơ chế nào?

<details>
<summary>Đáp án</summary>

- **Mặc định**: **Không**. Switch phân tách các cổng thành từng Collision Domain độc lập nhưng **không tự động phân tách Broadcast Domain**.
- **Hành vi chuyển tiếp**: Theo chuẩn IEEE 802.1D, khi nhận khung tin có MAC đích `FF:FF:FF:FF:FF:FF`, Switch bắt buộc nhân bản và **flood** khung tin đó ra tất cả các cổng đang hoạt động còn lại (trừ cổng nhận vào). Vì vậy, một mạng gồm nhiều Switch nối với nhau vẫn tạo thành **1 Broadcast Domain duy nhất**.
- **Cách chia tách trên Switch**: Sử dụng phân chia logic bằng **VLAN (Virtual LAN - IEEE 802.1Q)**.
</details>

### Câu Hỏi 11: Theo RFC 1812, Router (Layer 3) xử lý gói tin Link Layer broadcast như thế nào và mỗi cổng của Router đóng vai trò gì đối với Collision Domain và Broadcast Domain?

<details>
<summary>Đáp án</summary>

- **Xử lý theo RFC 1812 (Section 5.3.4)**: Router **tuyệt đối không được chuyển tiếp** bất kỳ gói tin nào nhận được dưới dạng Link Layer broadcast (trừ khi gói tin đó hướng tới địa chỉ IP Multicast cụ thể) và phải **âm thầm hủy bỏ (silently discard)** gói tin đó.
- **Vai trò của mỗi giao diện (cổng) Router**:
  - Mỗi cổng của Router là điểm kết thúc của **1 Broadcast Domain riêng** (tạo ranh giới ngăn cách giữa các mạng con/subnet).
  - Mỗi cổng của Router cũng là **1 Collision Domain độc lập** (chạy Full-Duplex).
</details>

### Câu Hỏi 12: Khi thay thế một Hub 8 cổng bằng một Switch 8 cổng (chạy Full-Duplex, chưa cấu hình VLAN) trong mạng LAN, số lượng Collision Domain và Broadcast Domain thay đổi như thế nào?

<details>
<summary>Đáp án</summary>

- **Số lượng Collision Domain tăng từ 1 lên 8**: Hub dùng chung một đường truyền cho cả 8 cổng (1 Collision Domain), còn Switch vi phân đoạn bằng bộ đệm và Full-Duplex khiến mỗi cổng trở thành 1 Collision Domain riêng (8 Collision Domains).
- **Số lượng Broadcast Domain giữ nguyên là 1**: Cả Hub lẫn Switch (khi chưa chia VLAN) đều chuyển tiếp khung broadcast `FF:FF:FF:FF:FF:FF` ra toàn bộ các cổng còn lại nên toàn bộ 8 cổng vẫn nằm trong 1 Broadcast Domain duy nhất.
</details>

### Câu Hỏi 13: Trên Linux, các lệnh `ip -s link show`, `ethtool` và cờ `bcast_flood on` trong `bridge link show` dùng để kiểm tra và chứng minh điều gì?

<details>
<summary>Đáp án</summary>

- **`ip -s link show <interface>`**: Kiểm tra thống kê tầng liên kết, trong đó:
  - `collsns`: Số lần va chạm khi truyền (TX). Trong môi trường Full-Duplex phải bằng `0`; nếu `> 0` và tăng liên tục là dấu hiệu đang chạy Half-Duplex hoặc gặp lỗi Duplex Mismatch.
  - `dropped` & `errors`: Số khung bị hủy hoặc lỗi CRC/FCS.
  - `brd ff:ff:ff:ff:ff:ff`: Địa chỉ MAC broadcast của giao diện.
- **`ethtool <interface>`**: Kiểm tra tốc độ (`Speed`) và chế độ song công (`Duplex: Full` cho biết dùng hai kênh thu/phát độc lập và vô hiệu hóa CSMA/CD; `Duplex: Half` cho biết phải chạy CSMA/CD).
- **`bcast_flood on` trong `bridge link show`**: Được bật mặc định trên Linux Bridge, chứng minh thực nghiệm cơ chế chuẩn IEEE 802.1D rằng Switch L2 luôn nhân bản và flood khung broadcast ra mọi cổng còn lại, duy trì 1 Broadcast Domain chung.
</details>

### Câu Hỏi 14: Bão quảng bá (Broadcast Storm) trong mạng phẳng Layer 2 quy mô lớn gây ra hậu quả gì và các thực tiễn sản xuất nào được dùng để phòng tránh?

<details>
<summary>Đáp án</summary>

- **Bản chất & hậu quả**: Trong mạng phẳng L2 chứa hàng nghìn máy chủ chung một Broadcast Domain, mỗi bản tin ARP Request, DHCP Discover hay NetBIOS broadcast buộc hàng nghìn máy khác phải nhận và ngắt CPU xử lý (lưu lượng tăng theo $O(N^2)$). Nếu có vòng lặp cáp (Switching Loop không bật STP) hoặc card mạng lỗi phát broadcast liên tục, toàn bộ băng thông switch bị chiếm dụng, gây tràn bộ đệm (buffer overflow) và tê liệt toàn bộ mạng nội bộ.
- **Thực tiễn sản xuất (Best Practices)**:
  - Chia nhỏ Broadcast Domain bằng **VLAN (IEEE 802.1Q)**, giới hạn quy mô (thường không quá **250 đến 500 host** mỗi VLAN).
  - Áp dụng mô hình **Routed Access / Top-of-Rack (ToR) L3 Routing**, đưa ranh giới Layer 3 lên thẳng switch đỉnh tủ rack để chặn lưu lượng broadcast ngay tại từng tủ rack.
</details>

### Câu Hỏi 15: Lỗi lệch chế độ song công (Duplex Mismatch) xảy ra khi nào, biểu hiện ra sao và cách phòng tránh trong sản xuất là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Xảy ra khi một đầu liên kết (ví dụ NIC máy chủ) được cấu hình cưỡng bức `Full-Duplex`, trong khi đầu kia (cổng Switch) bật `Auto-Negotiation`. Theo chuẩn IEEE 802.3, bên bật auto-negotiation không nhận được tín hiệu thương lượng sẽ rơi về trạng thái an toàn mặc định là **Half-Duplex**.
- **Biểu hiện & hậu quả**: Đầu Full-Duplex truyền tự do không chạy CSMA/CD, còn đầu Half-Duplex khi đang truyền mà thấy tín hiệu tới sẽ coi là collision, lập tức hủy khung và phát jam signal. Hậu quả là bộ đếm `collsns` và `errors` trong `ip -s link show` tăng liên tục, băng thông sụt nghiêm trọng (từ 1 Gbps xuống vài Kbps) và tỷ lệ mất gói tăng vọt.
- **Cách phòng tránh**: Bật `Auto-Negotiation` đồng bộ ở cả hai đầu liên kết, hoặc nếu cấu hình thủ công thì bắt buộc thiết lập `Full-Duplex` ở cả card mạng lẫn cổng switch.
</details>

### Câu Hỏi 16: Tại sao không được cấu hình tĩnh địa chỉ Directed Broadcast của mạng con (ví dụ `192.168.1.255` trong `192.168.1.0/24`) cho một máy chủ?

<details>
<summary>Đáp án</summary>

- Theo RFC 1122 (Section 3.2.1.3) và RFC 919, địa chỉ có phần host gồm toàn bộ bit 1 là **địa chỉ Directed Broadcast** của mạng con. Nếu gán tĩnh IP này cho một máy chủ, máy chủ đó sẽ không thể giao tiếp hai chiều bình thường qua các kết nối unicast.
- Hơn nữa, theo RFC 1812, các router sẽ **không bao giờ định tuyến** các gói tin có địa chỉ nguồn là broadcast, khiến các dịch vụ trên máy chủ bị cô lập hoàn toàn khỏi mạng bên ngoài.
</details>
