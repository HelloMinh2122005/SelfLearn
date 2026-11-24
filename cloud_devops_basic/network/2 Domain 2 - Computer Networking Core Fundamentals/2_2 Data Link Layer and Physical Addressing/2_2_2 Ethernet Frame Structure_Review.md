# Review: 2_2_2 Ethernet Frame Structure

### Câu Hỏi 1: Tầng Liên kết Dữ liệu (Data Link Layer - Tầng 2) đảm nhiệm vai trò gì trong quá trình truyền tin, và hai định dạng khung Ethernet phổ biến nhất hiện nay là gì?

<details>
<summary>Đáp án</summary>

- **Vai trò của Tầng 2**: Đóng gói các gói tin từ Tầng Mạng (Layer 3 Datagrams) thành các **khung dữ liệu (Frames)** để truyền dẫn tin cậy giữa các nút mạng trực tiếp kề nhau trên cùng một môi trường truyền dẫn vật lý.
- **Hai định dạng khung phổ biến nhất**:
  1. **Ethernet II** (còn gọi là DIX Ethernet — phát triển bởi DEC, Intel, Xerox).
  2. Biến thể chuẩn hóa tương ứng trong họ tiêu chuẩn **IEEE 802.3**.
</details>

### Câu Hỏi 2: Theo tiêu chuẩn IEEE Std 802.3, một Layer 2 MAC Frame chuẩn gồm những trường nào và kích thước của từng trường là bao nhiêu?

<details>
<summary>Đáp án</summary>

Một Layer 2 MAC Frame chuẩn bao gồm đúng **5 trường thành phần**:

1. **Destination MAC Address (Địa chỉ MAC Đích)**: 6 octets (6 bytes / 48 bits).
2. **Source MAC Address (Địa chỉ MAC Nguồn)**: 6 octets (6 bytes / 48 bits).
3. **EtherType / Length**: 2 octets (2 bytes / 16 bits).
4. **MAC Client Data / Payload (Dữ liệu Tầng Mạng & Đệm lót)**: 46 đến 1500 octets (bytes).
5. **Frame Check Sequence (FCS - CRC-32)**: 4 octets (4 bytes / 32 bits).
</details>

### Câu Hỏi 3: Địa chỉ Destination MAC và Source MAC khác nhau như thế nào về loại địa chỉ được phép sử dụng và chức năng đối với Switch?

<details>
<summary>Đáp án</summary>

- **Destination MAC**:
  - Xác định card mạng (NIC) đích nhận khung trong mạng cục bộ.
  - Có thể là địa chỉ **Unicast** (gửi riêng cho 1 host), **Multicast** (gửi cho một nhóm host đăng ký trước), hoặc **Broadcast** (`FF:FF:FF:FF:FF:FF` — gửi cho toàn bộ thiết bị trong cùng broadcast domain).
- **Source MAC**:
  - Xác định card mạng của thiết bị gửi khung.
  - **Luôn luôn là địa chỉ Unicast vật lý** của thiết bị gửi.
  - Thiết bị chuyển mạch (**Switch**) dựa vào trường Source MAC để học vị trí cổng kết nối (**MAC learning / CAM table**).
</details>

### Câu Hỏi 4: Làm thế nào để phân biệt trường thứ 3 của khung MAC là EtherType (Ethernet II) hay Length (IEEE 802.3), và các mã EtherType `0x0800`, `0x0806`, `0x86DD`, `0x8100` đại diện cho giao thức nào?

<details>
<summary>Đáp án</summary>

- **Cách phân biệt EtherType và Length**:
  - Nếu giá trị trường này $\ge 1536$ (`0x0600`): Được diễn giải là **EtherType** (chuẩn Ethernet II, chỉ định giao thức Tầng 3 đang đóng gói trong Payload).
  - Nếu giá trị $\le 1500$ (`0x05DC`): Được chuẩn **IEEE 802.3** diễn giải là trường chỉ độ dài (**Length**, kết hợp với LLC/SNAP).
- **Các mã EtherType phổ biến**:
  - `0x0800`: **IPv4** (Internet Protocol version 4).
  - `0x0806`: **ARP** (Address Resolution Protocol).
  - `0x86DD`: **IPv6** (Internet Protocol version 6).
  - `0x8100`: **IEEE 802.1Q VLAN Tag** (nhãn nhận diện phân chia mạng ảo).
</details>

### Câu Hỏi 5: Kích thước tối đa (MTU) và kích thước tối thiểu của phần Payload trong khung Ethernet chuẩn là bao nhiêu? Cơ chế Padding hoạt động ra sao khi gói tin tầng trên nhỏ hơn mức tối thiểu (ví dụ gói ARP 28 bytes)?

<details>
<summary>Đáp án</summary>

- **Giới hạn trên (MTU - Maximum Transmission Unit)**: Mặc định là **1500 bytes** cho Ethernet chuẩn.
- **Giới hạn dưới**: Kích thước Payload tối thiểu bắt buộc là **46 bytes**.
- **Cơ chế Padding (chèn đệm)**:
  - Nếu dữ liệu từ tầng trên nhỏ hơn 46 bytes, Tầng Data Link bắt buộc phải chèn thêm các byte `0x00` (**zero-padding**) vào phần Payload cho đủ 46 bytes.
  - Ví dụ với gói tin ARP có kích thước **28 bytes**: Lớp Data Link sẽ chèn thêm **18 bytes** `0x00` để phần Payload đạt đủ 46 bytes ($28 + 18 = 46$ bytes), giúp tổng khung MAC đạt tối thiểu 64 bytes và tránh bị thiết bị mạng hiểu nhầm là mảnh vỡ va chạm (runt / collision fragment).
</details>

### Câu Hỏi 6: Trường FCS (Frame Check Sequence) sử dụng thuật toán gì, được tính toán trên những trường nào và card mạng bên nhận sẽ làm gì khi phát hiện FCS không khớp?

<details>
<summary>Đáp án</summary>

- **Thuật toán**: FCS (4 bytes / 32 bits) chứa giá trị kiểm tra mã dư tuần hoàn **CRC-32 (Cyclic Redundancy Check)**.
- **Phạm vi tính toán**: Card mạng gửi tính CRC-32 trên toàn bộ chuỗi bit của các trường: **Destination MAC, Source MAC, EtherType, Data và Padding** (không tính Preamble và SFD).
- **Xử lý khi không khớp ở bên nhận**: Card mạng bên nhận tính toán lại giá trị CRC-32 trên khung nhận được. Nếu kết quả không khớp với 4 bytes FCS đính kèm, khung được khẳng định đã bị biến dạng bit (bit flip) trong quá trình truyền dẫn và bị **loại bỏ âm thầm ngay trên phần cứng card mạng** (silently dropped as FCS error), đồng thời tăng bộ đếm lỗi `rx_crc_errors`.
</details>

### Câu Hỏi 7: Preamble (7 bytes) và SFD (1 byte) có thuộc về Layer 2 MAC Frame không? Chức năng cụ thể của từng thành phần là gì?

<details>
<summary>Đáp án</summary>

**Không.** Theo tiêu chuẩn IEEE Std 802.3, **Preamble và SFD thuộc về gói đồng bộ hóa Tầng Vật Lý (PHY Packet)**, hoàn toàn không thuộc Layer 2 MAC Frame.

- **Preamble (7 octets / 56 bits)**:
  - Gồm 7 bytes lặp lại chuỗi bit luân phiên `10101010` (`0x55` khi phát LSB-first).
  - *Chức năng*: Cung cấp chuỗi xung dao động ổn định để mạch thu vật lý của card mạng đích điều chỉnh xung nhịp (**clock synchronization**) và khóa pha (**phase lock**) đồng bộ với nguồn phát.
- **SFD - Start Frame Delimiter (1 octet / 8 bits)**:
  - Mang chuỗi bit `10101011` (`0xD5` trên đường truyền).
  - *Chức năng*: Hai bit `11` liên tiếp ở cuối báo hiệu quá trình đồng bộ xung nhịp đã hoàn tất, và bit tiếp theo ngay sau đó chính là bit đầu tiên của khung dữ liệu Tầng 2 (Destination MAC).
</details>

### Câu Hỏi 8: Kích thước tối thiểu (64 bytes) và tối đa cơ bản (1518 bytes) của Layer 2 MAC Frame được tính từ những trường nào? Tại sao kích thước tối thiểu lại phải là 64 bytes?

<details>
<summary>Đáp án</summary>

- **Công thức tính kích thước MAC Frame**:
  $$\text{Kích thước MAC Frame} = \text{Dest MAC}(6) + \text{Src MAC}(6) + \text{EtherType}(2) + \text{Payload}(N) + \text{FCS}(4) = 18 + N \text{ bytes}$$
  - **Kích thước tối thiểu (64 bytes)**: Khi Payload tối thiểu $N = 46$ bytes ($18 + 46 = 64$ bytes).
  - **Kích thước tối đa cơ bản (1518 bytes)**: Khi Payload đạt chuẩn MTU $N = 1500$ bytes ($18 + 1500 = 1518$ bytes). Nếu có thêm nhãn 4 bytes IEEE 802.1Q VLAN Tag thì kích thước tối đa mở rộng là **1522 bytes**.
  - Lưu ý: Cả hai con số 64 và 1518 bytes **không tính 8 bytes Preamble và SFD**.
- **Ý nghĩa của con số 64 bytes**: Bắt nguồn từ kỷ nguyên Ethernet bán song công (Half-Duplex) dùng CSMA/CD qua cáp đồng trục. 64 bytes tương ứng với khoảng thời gian tối thiểu (**Slot Time** — 512 bit times ở tốc độ 10 Mbps) để tín hiệu điện truyền hết chiều dài tối đa đoạn mạng và phản hồi lại, đảm bảo nếu có va chạm (collision) thì bên gửi vẫn đang truyền khung và kịp phát hiện va chạm trước khi kết thúc phát khung.
</details>

### Câu Hỏi 9: Theo quy trình xử lý khung tại phần cứng card mạng (NIC Ingress Flow), tại sao `tcpdump` hoặc `Wireshark` thông thường không nhìn thấy Preamble, SFD, FCS và các khung bị lỗi CRC?

<details>
<summary>Đáp án</summary>

1. **Không thấy Preamble và SFD**: Hai thành phần này chỉ dùng để đồng bộ dao động và nhận diện ranh giới khung tại chip thu phát Tầng Vật Lý (PHY). Sau khi phát hiện SFD, chip PHY **cắt bỏ (strip) 8 bytes này** trước khi đưa khung vào bộ đệm số của NIC.
2. **Không thấy FCS**: Bộ xử lý ASIC trên card mạng kiểm tra CRC-32 bằng phần cứng. Khi xác minh khung hợp lệ, phần cứng mặc định **cắt bỏ 4 bytes FCS** để tiết kiệm băng thông bus PCI/DMA trước khi đẩy khung qua DMA lên Ring Buffer của Kernel (nơi `tcpdump` / `libpcap` bắt gói tin).
3. **Không thấy khung bị lỗi CRC**: Nếu CRC-32 tính toán bị lệch so với FCS, phần cứng NIC **hủy bỏ âm thầm khung đó** và tăng counter `rx_crc_errors`, không hề chuyển lên bộ nhớ RAM của hệ điều hành.
</details>

### Câu Hỏi 10: Trong thực hành kiểm tra Tầng 2 trên Linux, các tùy chọn `-e` và `-xx` của `tcpdump` cùng với hai lệnh `ip -s link show` và `ethtool -S` có tác dụng gì?

<details>
<summary>Đáp án</summary>

- **`tcpdump -i <interface> -e -nn -xx`**:
  - Tham số `-e`: Yêu cầu in tiêu đề Tầng Liên kết Dữ liệu (Link-Level Header: Source MAC, Destination MAC, EtherType).
  - Tham số `-xx`: Hiển thị toàn bộ nội dung khung (bao gồm cả Link-Level Header) dưới dạng bảng mã thập lục phân (**hexadecimal dump**), giúp đọc trực tiếp 6 bytes Dest MAC, 6 bytes Src MAC và 2 bytes EtherType.
- **`ip -s link show dev <interface>`**: Xem thống kê gói tin và các lỗi tổng quát (RX/TX bytes, packets, errors, dropped, missed...) trên giao diện mạng.
- **`sudo ethtool -S <interface>`**: Truy vấn trực tiếp các thanh ghi bộ đếm phần cứng chi tiết của chip NIC như `rx_crc_errors`, `rx_undersize_pkts` (Runts), `rx_jabbers`, `rx_frame_errors`.
</details>

### Câu Hỏi 11: Phân biệt khái niệm MTU 1500 bytes (Layer 3) và kích thước khung MAC (Layer 2). Hậu quả thực tế là gì nếu một switch trung gian giới hạn kích thước khung tối đa là 1500 bytes?

<details>
<summary>Đáp án</summary>

- **Sự khác biệt**:
  - **MTU (1500 bytes)** là khái niệm ở **Layer 3**, chỉ giới hạn kích thước tối đa của phần **Payload** (gói tin IP).
  - Khi đóng gói xuống **Layer 2**, khung MAC hoàn chỉnh cộng thêm 14 bytes MAC Header (Dest MAC + Src MAC + EtherType) và 4 bytes FCS sẽ dài **1518 bytes** (hoặc **1522 bytes** nếu có 4 bytes 802.1Q VLAN Tag).
- **Hậu quả sản xuất**: Nếu switch trung gian chỉ cấu hình giới hạn kích thước khung ở mức 1500 bytes, switch sẽ coi mọi khung chứa gói IP đạt chuẩn MTU 1500 (tổng 1518 bytes) là khung quá khổ (oversize) và drop toàn bộ. Hệ quả là mạng vẫn `ping` được các gói tin nhỏ nhưng bị nghẽn hoàn toàn khi truyền file lớn hoặc thiết lập phiên SSH/HTTPS.
</details>

### Câu Hỏi 12: Phân biệt Runt Frame và Jabber Frame theo chuẩn RFC 2819, và giải thích nguyên nhân gây ra hiện tượng "Lỗ đen MTU" (MTU Black Hole) khi dùng Jumbo Frames (MTU 9000)?

<details>
<summary>Đáp án</summary>

- **Phân biệt Runt Frame và Jabber Frame (theo RFC 2819)**:
  - **Runt Frame (`rx_undersize_pkts`)**: Khung có kích thước **nhỏ hơn 64 octets** (chưa tính Preamble/SFD). Trong mạng Full-Duplex hiện đại (không có va chạm CSMA/CD), sự xuất hiện của Runt Frame thường cảnh báo lỗi vật lý nghiêm trọng như hỏng firmware/ASIC của NIC phát hoặc cáp quang/đồng bị gập gãy.
  - **Jabber Frame (`rx_jabbers`)**: Khung có độ dài **vượt quá giới hạn tối đa thông thường ($> 1518$ octets) VÀ đồng thời bị lỗi mã kiểm tra FCS CRC-32**. Nguyên nhân thường do mạch phát của NIC bị treo ở trạng thái truyền liên tục, phát dòng bit rác kéo dài gây nghẹt băng thông.
- **Hiện tượng "Lỗ đen MTU" (MTU Black Hole) với Jumbo Frames (MTU 9000)**:
  - Jumbo Frames không phải tiêu chuẩn bắt buộc của IEEE và **không có cơ chế tự động đàm phán kích thước khung ở Tầng 2**, nên phải cấu hình MTU 9000 đồng bộ trên mọi thiết bị dọc đường truyền (Host gửi $\rightarrow$ các Switch trung gian $\rightarrow$ Host nhận).
  - Nếu chỉ một switch ở giữa vẫn giữ MTU 1500, các khung 9000 bytes sẽ bị **drop âm thầm** mà không tạo bản tin ICMP thông báo lỗi (vì switch Layer 2 thuần túy không tạo gói ICMP Fragmentation Needed). Kết quả là `ping` gói nhỏ (64 bytes) vẫn thông suốt, nhưng các tác vụ truyền dữ liệu lớn (sao lưu, đồng bộ DB) bị treo vĩnh viễn (hang/timeout).
</details>
