# Review: 2_2_4 VLANs and IEEE 802.1Q Tagging

### Câu Hỏi 1: Mạng Ethernet truyền thống gặp vấn đề gì khi có nhiều thiết bị, và VLAN giải quyết vấn đề đó như thế nào?

<details>
<summary>Đáp án</summary>

- **Vấn đề của mạng Ethernet truyền thống**: Mọi cổng trên cùng một Switch Tầng 2 đều thuộc về một **miền quảng bá (Broadcast Domain)** duy nhất. Khi một máy trạm gửi khung quảng bá (ví dụ bản tin ARP Request `FF:FF:FF:FF:FF:FF`), switch sẽ chuyển tiếp (flood) khung đó ra toàn bộ các cổng còn lại. Khi số lượng thiết bị tăng lên hàng trăm hoặc hàng nghìn, lưu lượng broadcast chiếm dụng băng thông nghiêm trọng, làm giảm hiệu năng và tạo rủi ro bảo mật do các máy trạm có thể nghe lén lưu lượng của nhau.
- **Cách VLAN giải quyết**: Theo chuẩn **IEEE 802.1Q** và **RFC 3069 (Section 1)**, mỗi **VLAN (Virtual Local Area Network)** là một **miền quảng bá logic (Logical Broadcast Domain)** độc lập. Khung broadcast hoặc multicast phát ra trong một VLAN chỉ truyền tới các máy trạm cùng VLAN đó và bị cô lập hoàn toàn khỏi các VLAN khác, tương đương với việc chia một switch vật lý thành nhiều switch vật lý riêng biệt.
</details>

### Câu Hỏi 2: Thẻ (Tag) IEEE 802.1Q có kích thước bao nhiêu, được chèn vào vị trí nào trong khung Ethernet và làm thay đổi kích thước khung tối đa ra sao?

<details>
<summary>Đáp án</summary>

- **Kích thước**: Khối tiêu đề thẻ IEEE 802.1Q (còn gọi là **QTag Prefix**) có kích thước **4 octets (32 bits)**.
- **Vị trí chèn**: Thẻ được chèn vào giữa trường **Source MAC Address** (6 bytes) và trường **EtherType/Length** nguyên thủy (2 bytes).
- **Kích thước khung tối đa**:
  - Khung Ethernet II tiêu chuẩn (Untagged) có kích thước tối đa **1518 bytes**.
  - Khi chèn thêm 4 bytes thẻ IEEE 802.1Q, khung Tagged có kích thước tối đa tăng lên **1522 bytes**.
</details>

### Câu Hỏi 3: Hai thành phần chính của thẻ IEEE 802.1Q là gì và chức năng của TPID ra sao?

<details>
<summary>Đáp án</summary>

Khối thẻ 4 octets của IEEE 802.1Q gồm 2 trường chính:
1. **TPID (Tag Protocol Identifier - 2 octets / 16 bits)**: Mang giá trị cố định **`0x8100`**. Khi switch hoặc card mạng đọc tới byte thứ 13 của khung và thấy giá trị `0x8100`, nó nhận biết ngay khung này đã được gắn thẻ 802.1Q và 2 bytes tiếp theo là trường TCI.
2. **TCI (Tag Control Information - 2 octets / 16 bits)**: Chứa các thông tin điều khiển thẻ gồm `PCP`, `DEI` và `VID`.
</details>

### Câu Hỏi 4: Trường TCI (16 bits) gồm những trường con nào và ý nghĩa kỹ thuật của từng trường là gì?

<details>
<summary>Đáp án</summary>

Trường TCI 16-bit được chia thành 3 trường con:
1. **PCP (Priority Code Point - 3 bits)**: Cung cấp $2^3 = 8$ mức độ ưu tiên (từ `0` đến `7`) theo chuẩn **IEEE 802.1p**, dùng cho cơ chế phân loại chất lượng dịch vụ Tầng 2 (**Class of Service - CoS**) nhằm ưu tiên các gói tin nhạy cảm độ trễ như thoại VoIP hoặc video streaming.
2. **DEI (Drop Eligible Indicator - 1 bit)**: Trước đây gọi là **CFI (Canonical Format Indicator)** để tương thích Token Ring. Hiện nay, bit này chỉ thị khả năng chấp nhận bị loại bỏ: khi mạng bị nghẽn (congestion), switch sẽ ưu tiên drop các khung có `DEI = 1` trước để giữ băng thông cho các khung quan trọng có `DEI = 0`.
3. **VID (VLAN Identifier - 12 bits)**: Định danh chính xác VLAN mà khung dữ liệu trực thuộc, hỗ trợ $2^{12} = 4096$ giá trị (từ `0` đến `4095`).
</details>

### Câu Hỏi 5: Trong không gian 4096 giá trị của VID (0–4095), các giá trị đặc biệt và dải VLAN khả dụng được quy định như thế nào?

<details>
<summary>Đáp án</summary>

- **`VID 0`**: Dành cho khung gắn thẻ ưu tiên (**Priority-tagged frame**), chỉ mang thông tin mức độ ưu tiên CoS (`PCP`) mà không thuộc về một VLAN cụ thể nào.
- **`VID 1`**: Là **VLAN mặc định (Default VLAN)** trên hầu hết các thiết bị chuyển mạch thương mại (Cisco, Juniper, Linux Bridge).
- **`VID 1` đến `4094`**: **Dải VLAN khả dụng** để người quản trị cấu hình phân chia phòng ban, dịch vụ hoặc tenant.
- **`VID 4095`**: Dành riêng cho mục đích nội bộ của hệ thống (**Reserved for system use**).
</details>

### Câu Hỏi 6: Cổng Access (Access Port) và cổng Trunk (Trunk Port) khác nhau cơ bản ở những điểm nào?

<details>
<summary>Đáp án</summary>

- **Cổng Access (Access Port)**:
  - Kết nối tới các thiết bị đầu cuối (PC, Laptop, Server, Máy in).
  - Chỉ thuộc về **duy nhất 1 VLAN** (gọi là **PVID - Port VLAN ID**).
  - Thiết bị đầu cuối chỉ gửi và nhận khung **Untagged** (không có thẻ 802.1Q).
- **Cổng Trunk (Trunk Port)**:
  - Kết nối giữa Switch với Switch, hoặc Switch với Router/Firewall/Hypervisor.
  - Cho phép truyền tải đồng thời **nhiều VLAN** (VLAN Multiplexing).
  - Khung truyền qua cổng Trunk hầu hết được **Tagged** (có gắn thẻ 4 bytes 802.1Q), ngoại trừ lưu lượng thuộc Native VLAN.
</details>

### Câu Hỏi 7: Switch xử lý khung ở chiều đi vào (Ingress) và đi ra (Egress) như thế nào trên cổng Access và cổng Trunk?

<details>
<summary>Đáp án</summary>

- **Trên cổng Access**:
  - **Ingress (Đi vào)**: Nhận khung untagged từ thiết bị đầu cuối và tự động gán thẻ logic với mã `VID = PVID` của cổng.
  - **Egress (Đi ra)**: Tự động **bóc tách (strip)** thẻ 4 bytes 802.1Q trước khi đẩy khung ra dây cáp tới thiết bị đầu cuối.
- **Trên cổng Trunk**:
  - **Ingress (Đi vào)**: Kiểm tra thẻ 802.1Q; nếu `VID` nằm trong danh sách `Allowed VLANs` thì giữ nguyên thẻ và chuyển tiếp, nếu không cho phép thì hủy khung.
  - **Egress (Đi ra)**: Giữ nguyên thẻ 802.1Q đính kèm trên khung (trừ khi khung thuộc Native VLAN).
</details>

### Câu Hỏi 8: Native VLAN trên cổng Trunk là gì, hoạt động theo quy tắc nào và được tạo ra nhằm mục đích gì?

<details>
<summary>Đáp án</summary>

- **Khái niệm**: **Native VLAN** là một VLAN đặc biệt được chỉ định trên cổng Trunk (mặc định thường là VLAN 1).
- **Quy tắc hoạt động**:
  - Khi một khung thuộc Native VLAN đi ra (egress) khỏi cổng Trunk, switch sẽ **không gắn thẻ 802.1Q** (truyền dưới dạng khung untagged).
  - Khi cổng Trunk nhận vào (ingress) một khung không gắn thẻ (untagged), switch tự động coi khung đó thuộc về Native VLAN.
- **Mục đích**: Đảm bảo tương thích ngược với các thiết bị mạng cũ không hỗ trợ chuẩn 802.1Q hoặc các giao thức điều khiển tầng liên kết như CDP (Cisco Discovery Protocol) và STP (Spanning Tree Protocol).
</details>

### Câu Hỏi 9: Vì sao một Switch Tầng 2 không thể tự chuyển tiếp dữ liệu giữa hai VLAN khác nhau?

<details>
<summary>Đáp án</summary>

- Vì mỗi VLAN là một **miền quảng bá (broadcast domain)** và một **subnet IP** hoàn toàn độc lập ở Tầng 2.
- Ví dụ, khung ARP Request từ một máy thuộc VLAN 10 sẽ bị Switch Tầng 2 chặn lại, không bao giờ chuyển sang các cổng thuộc VLAN 20. Do đó, mọi giao tiếp giữa các VLAN khác nhau bắt buộc phải đi qua một **thực thể định tuyến Tầng 3 (Layer 3 Routing Entity)**.
</details>

### Câu Hỏi 10: So sánh hai phương pháp Định tuyến Liên VLAN (Inter-VLAN Routing) phổ biến: Router-on-a-stick và Layer 3 Switch với SVI?

<details>
<summary>Đáp án</summary>

1. **Router-on-a-stick**:
   - Dùng một đường cáp vật lý (Trunk link) nối từ Switch lên một cổng mạng của Router ngoài.
   - Cổng vật lý trên router được chia thành nhiều giao diện con ảo (**subinterfaces**, ví dụ `eth0.10`, `eth0.20`), mỗi subinterface gắn nhãn 802.1Q tương ứng và làm **Default Gateway** cho VLAN đó. Router nhận gói tin từ một VLAN, định tuyến ở Tầng 3 rồi đẩy ngược lại qua cùng sợi cáp Trunk sang VLAN đích.
   - *Nhược điểm*: Trong mạng doanh nghiệp và trung tâm dữ liệu lớn, việc dồn lưu lượng qua router ngoài dễ gây nghẽn cổ chai (traffic bottleneck).
2. **Layer 3 Switch với SVI (Switched Virtual Interface)**:
   - Tạo các gateway ảo ngay trên switch (ví dụ `interface Vlan 10`, `interface Vlan 20`).
   - Việc định tuyến giữa các VLAN diễn ra trực tiếp bằng phần cứng (**ASIC/TCAM**) ở tốc độ dây (**wire-speed**), đạt thông lượng cao mà không cần dây cáp hay router ngoài.
</details>

### Câu Hỏi 11: Trên Linux, cần nạp mô đun nhân nào và dùng những lệnh `iproute2` cơ bản nào để tạo, bật, gán IP và xóa một VLAN subinterface?

<details>
<summary>Đáp án</summary>

- **Nạp mô đun nhân Linux 802.1Q**: `sudo modprobe 8021q`
- **Tạo VLAN subinterface** (ví dụ VLAN ID 100 trên `eth0`):
  `sudo ip link add link eth0 name eth0.100 type vlan id 100`
- **Kích hoạt giao diện ảo**:
  `sudo ip link set up dev eth0.100`
- **Gán địa chỉ IP Tầng 3**:
  `sudo ip addr add 192.168.100.10/24 dev eth0.100`
- **Kiểm tra chi tiết cấu hình VLAN**:
  `ip -d link show dev eth0.100` (hiển thị `eth0.100@eth0`, `vlan protocol 802.1Q id 100`, `<REORDER_HDR>`).
- **Xóa giao diện VLAN khi không còn dùng**:
  `sudo ip link delete dev eth0.100`
</details>

### Câu Hỏi 12: Làm thế nào để dùng `tcpdump` quan sát trực tiếp thẻ IEEE 802.1Q trên card mạng vật lý Linux, và các dấu hiệu nhận biết trong output là gì?

<details>
<summary>Đáp án</summary>

- **Câu lệnh**: Bắt lưu lượng trên card mạng vật lý cha (ví dụ `eth0`) với cờ `-e` để hiện thông tin tiêu đề tầng liên kết:
  `sudo tcpdump -i eth0 -e -nn "vlan 100" -c 1`
- **Dấu hiệu nhận biết trong kết quả**:
  - `ethertype 802.1Q (0x8100)`: Xác nhận khung mang mã TPID `0x8100` của chuẩn 802.1Q.
  - `vlan 100, p 0`: Cho thấy trong trường TCI có `VID = 100` và mức độ ưu tiên `PCP = 0`.
  - `ethertype IPv4 (0x0800)`: Trường EtherType nguyên thủy nằm ngay sau thẻ 802.1Q chỉ thị gói tin bên trong là IPv4.
</details>

### Câu Hỏi 13: Tấn công nhảy VLAN qua Native VLAN (Double Tagging VLAN Hopping) diễn ra như thế nào và cần phòng ngừa bằng những biện pháp nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế tấn công**:
  - Kẻ tấn công cắm vào cổng Access thuộc Native VLAN và gửi đi khung chứa **hai lớp thẻ 802.1Q lồng nhau**: lớp ngoài (Outer Tag) mang `VID = Native VLAN`, lớp trong (Inner Tag) mang `VID = Target VLAN` (ví dụ VLAN 20).
  - Switch đầu tiên đưa khung ra cổng Trunk: vì Outer Tag trùng Native VLAN, switch thực hiện quy tắc chuẩn là **bóc tách (strip) nhãn ngoài** và đẩy khung đi.
  - Switch thứ hai nhận khung từ Trunk, nhìn thấy Inner Tag (VLAN 20) nên chuyển tiếp khung thẳng vào VLAN mục tiêu.
- **Biện pháp phòng ngừa**:
  1. Không bao giờ dùng VLAN 1 làm Native VLAN trong môi trường sản xuất.
  2. Cấu hình Native VLAN trên toàn bộ cổng Trunk là một **VLAN rác không sử dụng (Unused Dummy VLAN ID)** (ví dụ `VLAN 999`) và không gán bất kỳ máy chủ hay cổng Access nào vào đó.
  3. Bật tính năng bắt buộc gắn thẻ cả Native VLAN trên cổng Trunk (ví dụ `vlan dot1q tag native`).
</details>

### Câu Hỏi 14: Hai cạm bẫy cấu hình phổ biến khác là thiếu Trunk VLAN Pruning và giới hạn kích thước khung 1522 bytes ("Babbling Giant") gây ra hậu quả gì?

<details>
<summary>Đáp án</summary>

1. **Thiếu Trunk VLAN Pruning**:
   - *Nguyên nhân*: Để mặc định cổng Trunk cho phép toàn bộ 4094 VLAN (`switchport trunk allowed vlan all`).
   - *Hậu quả*: Khi một VLAN gặp sự cố mã độc hoặc loop cáp gây **bão broadcast (Broadcast Storm)**, lưu lượng rác sẽ tràn qua mọi đường Trunk, làm tê liệt băng thông trục chính.
   - *Cách khắc phục*: Áp dụng nguyên tắc đặc quyền tối thiểu (Least Privilege), chỉ cho phép các VLAN thực sự cần thiết đi qua Trunk (ví dụ `switchport trunk allowed vlan 10,20,30`).
2. **Cạm bẫy MTU & Khung "Babbling Giants" (1522 bytes)**:
   - *Nguyên nhân*: Thẻ 802.1Q làm kích thước khung tối đa tăng từ 1518 bytes lên **1522 bytes** (được chuẩn hóa mở rộng trong **IEEE 802.3ac / 802.3as**).
   - *Hậu quả*: Switch cũ hoặc vNIC thế hệ cũ không hỗ trợ kích thước khung mở rộng sẽ coi khung 1522 bytes là khung quá khổ bất hợp lệ (**Babbling Giants / Oversized frames**) và tự động drop âm thầm, khiến kết nối bị chập chờn khi truyền các gói TCP kích thước tối đa (`MSS = 1460`).
</details>
