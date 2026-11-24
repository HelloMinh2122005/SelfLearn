# Review: 2_2_3 Switches vs Hubs and MAC Learning

### Câu Hỏi 1: Hub và Switch hoạt động ở tầng nào của mô hình OSI và cách xử lý dữ liệu của chúng khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **Hub (Multiport Repeater)** hoạt động ở **Layer 1 (Physical Layer)**. Hub chỉ lặp lại xung điện (electrical repeat) một cách thuần túy: khi nhận bit ở một cổng, nó khuếch đại tín hiệu và đẩy ra tất cả các cổng còn lại mà không kiểm tra nội dung khung dữ liệu.
- **Switch (Multiport Bridge)** hoạt động ở **Layer 2 (Data Link Layer)**. Switch đọc và giải mã phần đầu khung Ethernet (**Destination MAC** và **Source MAC**) để đưa ra quyết định chuyển tiếp có chọn lọc.
</details>

### Câu Hỏi 2: Sự khác biệt giữa Hub và Switch về miền xung đột (Collision Domain), chế độ truyền thông và nguy cơ va chạm tín hiệu là gì?

<details>
<summary>Đáp án</summary>

- **Miền xung đột (Collision Domain)**: Toàn bộ các cổng cắm vào **Hub** chia sẻ **1 miền xung đột duy nhất**. Ngược lại, **Switch** thực hiện vi phân đoạn mạng (**Micro-segmentation**), biến **mỗi cổng thành 1 miền xung đột độc lập**.
- **Chế độ truyền thông**: **Hub** chạy bán song công (**Half-Duplex** — tại một thời điểm chỉ một máy được truyền tín hiệu). **Switch** chạy song công toàn phần (**Full-Duplex** — gửi và nhận dữ liệu đồng thời trên hai kênh riêng biệt).
- **Nguy cơ va chạm tín hiệu**: Trên **Hub**, nguy cơ va chạm rất cao khi nhiều máy truyền cùng lúc, nên phải dùng thuật toán **CSMA/CD** để dò va chạm. Trên **Switch**, va chạm tín hiệu bị triệt tiêu hoàn toàn trên từng cổng vật lý nhờ bộ đệm khung (frame buffer).
</details>

### Câu Hỏi 3: Tại sao Switch có mức độ bảo mật vật lý cao hơn Hub?

<details>
<summary>Đáp án</summary>

- Trên **Hub**, bảo mật vật lý rất kém vì mọi dữ liệu đều bị lặp ra tất cả các cổng; bất kỳ máy nào kết nối vào Hub đều có thể lắng nghe (sniff) toàn bộ lưu lượng của các máy khác.
- Trên **Switch**, bảo mật vật lý cao hơn vì khung Unicast (khi đã được học) chỉ được gửi đến đúng cổng của thiết bị đích, các cổng khác không nhận được khung tin này.
</details>

### Câu Hỏi 4: Bảng CAM / FDB trên Switch là gì và nó lưu trữ thông tin ánh xạ nào?

<details>
<summary>Đáp án</summary>

- **CAM (Content-Addressable Memory)** hay **FDB (Forwarding Database)** là bảng tra cứu do Switch duy trì trong bộ nhớ theo tiêu chuẩn **IEEE 802.1D** và **RFC 1493**.
- Bảng này lưu trữ ánh xạ giữa địa chỉ MAC với cổng vật lý và VLAN tương ứng: `{MAC Address} <-> {Port vật lý, VLAN ID}`.
</details>

### Câu Hỏi 5: Thuật toán học địa chỉ MAC (MAC Learning) của Switch hoạt động như thế nào khi nhận được một khung Ethernet?

<details>
<summary>Đáp án</summary>

Mỗi khi nhận được khung Ethernet trên bất kỳ cổng nào, Switch đọc địa chỉ **Source MAC** trong phần header của khung và cập nhật bảng FDB theo 3 trường hợp:
1. Nếu cặp `{Source MAC, Cổng nhận}` **chưa có** trong bảng FDB: Switch tạo mới một bản ghi.
2. Nếu bản ghi **đã tồn tại trên đúng cổng đó**: Switch thiết lập lại đồng hồ đếm thời gian (**Aging Timer**) về giá trị ban đầu.
3. Nếu bản ghi **đã tồn tại nhưng khung tin đến từ một cổng khác** (ví dụ người dùng chuyển cổng cắm cáp): Switch lập tức cập nhật lại cổng mới cho địa chỉ MAC tương ứng.
</details>

### Câu Hỏi 6: Switch đưa ra ba quyết định chuyển tiếp khung (Forwarding Logic) nào dựa trên địa chỉ Destination MAC?

<details>
<summary>Đáp án</summary>

Sau khi học Source MAC, Switch đọc **Destination MAC** để chọn một trong ba quyết định:
1. **Known Unicast**: Destination MAC là địa chỉ đơn (bit `I/G = 0`) và **đã tồn tại** trong FDB → Switch chuyển tiếp khung ra **duy nhất một cổng đầu ra (egress port)** tương ứng.
2. **Unknown Unicast Flooding**: Destination MAC là địa chỉ đơn (bit `I/G = 0`) nhưng **chưa có mặt** trong FDB → Switch phát tràn khung (flood) ra **tất cả các cổng cùng VLAN**, ngoại trừ cổng vừa nhận khung vào (ingress port).
3. **Broadcast Flooding**: Destination MAC là địa chỉ quảng bá `FF:FF:FF:FF:FF:FF` (tất cả 48 bit bằng `1`) → Switch phát tràn khung ra tất cả các cổng cùng VLAN, ngoại trừ cổng nhận vào.
</details>

### Câu Hỏi 7: Sau khi xảy ra Unknown Unicast Flooding, làm thế nào Switch chuyển sang chế độ Known Unicast cho thiết bị đích đó?

<details>
<summary>Đáp án</summary>

- Khi Switch phát tràn khung Unknown Unicast ra tất cả các cổng cùng VLAN (trừ cổng nhận vào), các trạm không khớp địa chỉ đích sẽ loại bỏ khung, còn trạm đích thực sự sẽ tiếp nhận và gửi khung phản hồi ngược lại.
- Khi nhận khung phản hồi này, Switch đọc **Source MAC** của trạm đích để học cổng tương ứng vào bảng FDB. Từ đó trở đi, các khung tin tiếp theo gửi tới thiết bị này sẽ chuyển sang chế độ **Known Unicast**.
</details>

### Câu Hỏi 8: Cơ chế Aging Timer trên bảng CAM/FDB dùng để làm gì, giá trị mặc định là bao nhiêu và hoạt động ra sao?

<details>
<summary>Đáp án</summary>

- **Mục đích**: Bộ nhớ phần cứng CAM của Switch là hữu hạn. Nếu máy tính rút cáp hoặc tắt nguồn mà bản ghi vẫn lưu mãi sẽ gây lãng phí bộ nhớ và dẫn đến chuyển tiếp sai khi máy chuyển sang cổng khác.
- **Giá trị mặc định**: **300 giây (5 phút)** theo đặc tả chuẩn **IEEE 802.1D**, **RFC 1493** (`dot1dTpAgingTime`) và tham số mặc định của Linux Kernel (`BR_DEFAULT_AGEING_TIME`).
- **Quy trình hoạt động**: Mỗi bản ghi động (dynamic entry) gắn một bộ đếm thời gian. Nếu trong vòng 300 giây không có khung tin nào mang Source MAC đó đi vào cổng tương ứng, Switch tự động xóa bản ghi khỏi FDB. Khung tin tiếp theo gửi tới MAC này sẽ kích hoạt lại cơ chế **Unknown Unicast Flooding**.
</details>

### Câu Hỏi 9: Trên Linux, những câu lệnh `iproute2` nào dùng để tạo một Switch ảo (Linux Bridge), gắn cổng mạng và xem bảng FDB?

<details>
<summary>Đáp án</summary>

- Tạo Switch ảo Layer 2 tên `br0`: `sudo ip link add name br0 type bridge`
- Gán giao tiếp mạng `eth0` làm cổng thành viên của `br0`: `sudo ip link set dev eth0 master br0`
- Kích hoạt giao diện bridge `br0`: `sudo ip link set dev br0 up`
- Kiểm tra bảng Forwarding Database (FDB) của `br0`: `bridge fdb show dev br0`
</details>

### Câu Hỏi 10: Trong kết quả của lệnh `bridge fdb show`, bản ghi có nhãn `permanent` khác gì với bản ghi động có `ageing timer`?

<details>
<summary>Đáp án</summary>

- **`permanent`**: Là bản ghi tĩnh cố định, đại diện cho chính địa chỉ MAC cục bộ của giao diện bridge hoặc các địa chỉ Multicast mà nhân kernel lắng nghe (như `33:33:...` cho IPv6, `01:00:5e:...` cho IPv4).
- **Bản ghi động (dynamic entry)** (ví dụ `52:54:00:12:34:56 dev eth0 master br0` kèm `ageing timer`): Là địa chỉ MAC do Switch tự học được từ cổng `eth0`. Giá trị `ageing timer` cho biết số giây đã trôi qua kể từ lần cuối nhận khung tin có Source MAC này; nếu chạm mốc 300 giây mà không có lưu lượng mới, bản ghi sẽ tự động bị xóa.
</details>

### Câu Hỏi 11: Tấn công tràn bảng CAM (MAC Flooding Attack) diễn ra như thế nào, gây hậu quả gì và cách phòng vệ là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế tấn công**: Kẻ tấn công trong mạng LAN gửi hàng trăm nghìn khung tin Ethernet mỗi giây với các địa chỉ Source MAC giả mạo ngẫu nhiên.
- **Hậu quả**: Bảng CAM bị lấp đầy hoàn toàn, khiến Switch không thể học thêm địa chỉ mới và phải chuyển sang chế độ "Fail-Open": hoạt động giống như một chiếc **Hub** và kích hoạt **Unknown Unicast Flooding cho tất cả mọi khung tin**, giúp kẻ tấn công nghe lén toàn bộ lưu lượng của nạn nhân.
- **Giải pháp phòng vệ**: Bật tính năng **Port Security** trên Switch để giới hạn số lượng địa chỉ MAC tối đa được phép học trên một cổng vật lý và tự động khóa cổng nếu vượt ngưỡng.
</details>

### Câu Hỏi 12: Cơn bão quảng bá (Broadcast Storm) do vòng lặp mạng L2 và hiện tượng MAC Flapping khác nhau như thế nào, cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Broadcast Storm (Cơn bão quảng bá)**:
  - *Nguyên nhân*: Quản trị viên vô tình cắm hai dây cáp nối giữa hai switch tạo thành vòng khép kín (loop) mà không bật cơ chế chống vòng lặp.
  - *Hậu quả*: Khung Broadcast hoặc Unknown Unicast bị flood quay vòng liên tục, nhân bản theo cấp số nhân và lấp đầy 100% băng thông trong vài giây, làm tê liệt toàn mạng.
  - *Giải pháp*: Kích hoạt giao thức **Spanning Tree Protocol (STP / RSTP - IEEE 802.1D / 802.1w)** để tự động phát hiện và khóa (block) cổng dự phòng tạo vòng lặp.
- **MAC Flapping (Nhảy cổng địa chỉ MAC)**:
  - *Hiện tượng*: Switch liên tục nhận các khung có cùng Source MAC từ hai cổng vật lý khác nhau trong thời gian rất ngắn.
  - *Nguyên nhân*: Có thể do vòng lặp L2, lỗi cấu hình gộp kênh mạng (**NIC Teaming / LACP Bond**) không đồng bộ giữa máy chủ và switch, hoặc kẻ tấn công giả mạo MAC của gateway. Switch sẽ ghi log cảnh báo `MAC Flapping detected` và có thể tạm ngắt cổng để tự vệ.
</details>
