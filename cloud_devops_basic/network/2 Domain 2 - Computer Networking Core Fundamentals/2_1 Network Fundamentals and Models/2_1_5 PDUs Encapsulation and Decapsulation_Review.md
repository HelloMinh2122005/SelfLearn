# Review: 2_1_5 PDUs Encapsulation and Decapsulation

### Câu Hỏi 1: Theo chuẩn OSI / ISO/IEC 7498-1, các khái niệm SDU, PCI và PDU là gì và chúng liên hệ với nhau như thế nào giữa các tầng?

<details>
<summary>Đáp án</summary>

Theo chuẩn **ITU-T X.200** và **ISO/IEC 7498-1**, giao tiếp giữa các tầng được mô tả qua 3 khái niệm:
- **SDU (Service Data Unit - Đơn vị Dữ liệu Dịch vụ)**: Là phần dữ liệu người dùng (payload thuần túy) được tầng trên $(N+1)$ chuyển giao nguyên vẹn xuống tầng dưới $(N)$ để yêu cầu dịch vụ truyền tải. Tầng $(N)$ không cần quan tâm đến ngữ nghĩa nội dung bên trong SDU.
- **PCI (Protocol Control Information - Thông tin Điều khiển Giao thức)**: Là thông tin điều khiển do tầng $(N)$ tạo ra để trao đổi với thực thể đồng tầng $(N)$ ở máy nhận nhằm phối hợp hoạt động (như định danh nguồn/đích, số thứ tự tuần tự, mã kiểm tra lỗi). Trong thực tế, PCI thường là **Header** và đôi khi kèm theo **Trailer**.
- **PDU (Protocol Data Unit - Đơn vị Dữ liệu Giao thức)**: Là đơn vị dữ liệu hoàn chỉnh của tầng $(N)$, kết hợp giữa thông tin điều khiển và dữ liệu người dùng:
  $$(N)\text{-PDU} = (N)\text{-PCI} + (N)\text{-SDU}$$
- **Mối liên hệ liên tầng**: Khi $(N)\text{-PDU}$ được chuyển xuống tầng dưới $(N-1)$, toàn bộ khối dữ liệu này trở thành $(N-1)\text{-SDU}$ (payload) của tầng $(N-1)$.

</details>

### Câu Hỏi 2: Tên gọi PDU chuẩn và thành phần cấu tạo chính tại mỗi tầng trong mô hình OSI / TCP/IP là gì?

<details>
<summary>Đáp án</summary>

Tên gọi PDU chuẩn và thành phần cấu tạo tại từng tầng gồm:
- **Layer 7, 6, 5 (Application / Presentation / Session)**: Gọi là **Data / Message** — gồm dữ liệu ứng dụng thuần túy (ví dụ: HTTP Request/Response, DNS Query).
- **Layer 4 (Transport Layer)**: Gọi là **Segment** (với TCP) hoặc **Datagram** (với UDP) — gồm L4 Header (Source/Destination Port, Flags, Seq/Ack...) + Application Data.
- **Layer 3 (Network / Internet Layer)**: Gọi là **Packet** hoặc **IP Datagram** — gồm L3 Header (Source/Destination IP, TTL, Protocol...) + Transport Segment.
- **Layer 2 (Data Link Layer)**: Gọi là **Frame (Khung dữ liệu)** — gồm L2 Header (Source/Destination MAC, EtherType) + IP Packet + FCS Trailer.
- **Layer 1 (Physical Layer)**: Gọi là **Bits** (chuỗi bit `0` và `1`) — biểu diễn dưới dạng tín hiệu điện, xung ánh sáng hoặc sóng vô tuyến.

</details>

### Câu Hỏi 3: Quá trình Đóng gói (Encapsulation) tại máy gửi diễn ra theo chiều nào và mỗi tầng thực hiện thao tác gì?

<details>
<summary>Đáp án</summary>

Quá trình **Encapsulation** tại bên gửi diễn ra theo chiều dọc **từ trên xuống dưới (top-down)**:
1. **Tầng Ứng dụng (Layer 7)**: Tạo thông điệp dữ liệu (**Data/Message**) và chuyển xuống tầng Giao vận dưới dạng L4-SDU.
2. **Tầng Giao vận (Layer 4)**: Giao thức TCP hoặc UDP thêm **L4 Header** (chứa Source Port, Destination Port, Sequence Number, cờ điều khiển...) để tạo thành **TCP Segment** (hoặc UDP Datagram), rồi chuyển xuống làm L3-SDU.
3. **Tầng Mạng (Layer 3)**: Giao thức IP (IPv4/IPv6) thêm **L3 Header** (chứa Source IP, Destination IP, TTL, Protocol ID...) để tạo thành **IP Packet**, rồi chuyển xuống làm L2-SDU.
4. **Tầng Liên kết dữ liệu (Layer 2)**: NIC Driver thêm **L2 Header** ở đầu (Source MAC, Destination MAC của chặng kế tiếp, EtherType) và tính toán mã CRC-32 để gắn thêm **Trailer FCS (Frame Check Sequence)** 4 bytes ở cuối, tạo thành **Ethernet Frame**.
5. **Tầng Vật lý (Layer 1)**: Bộ thu phát NIC PHY chuyển đổi Ethernet Frame thành các xung tín hiệu vật lý (điện áp, xung ánh sáng...) để truyền chuỗi bit qua môi trường truyền dẫn.

</details>

### Câu Hỏi 4: Trong quá trình Giải đóng gói (Decapsulation) tại máy nhận, tầng Liên kết dữ liệu (Layer 2 / NIC) thực hiện những bước kiểm tra và xử lý nào?

<details>
<summary>Đáp án</summary>

Quá trình **Decapsulation** diễn ra theo chiều **từ dưới lên trên (bottom-up)**. Sau khi nhận chuỗi bit từ Layer 1, card mạng (NIC) ở **Layer 2** thực hiện các bước:
1. **Kiểm tra tính toàn vẹn (CRC-32 / FCS)**: NIC tính toán lại mã CRC-32 trên toàn bộ khung nhận được và đối chiếu với giá trị trong trường **FCS** ở cuối khung. Nếu không khớp, khung tin bị hỏng trên đường truyền nên NIC lập tức loại bỏ (drop) mà không xử lý thêm.
2. **Kiểm tra định địa chỉ MAC**: Nếu CRC khớp, NIC kiểm tra địa chỉ MAC đích. Khung tin chỉ được chấp nhận nếu MAC đích trùng với địa chỉ MAC vật lý của NIC, là địa chỉ Broadcast (`FF:FF:FF:FF:FF:FF`), hoặc thuộc địa chỉ multicast đã đăng ký.
3. **Bóc tách và chuyển tiếp**: NIC bóc bỏ L2 Header và FCS Trailer, trích xuất **IP Packet** (L2-SDU) và dựa vào trường EtherType để chuyển lên tầng Mạng.

</details>

### Câu Hỏi 5: Tầng Mạng (Layer 3) và tầng Giao vận (Layer 4) thực hiện những bước thẩm định và bóc tách gì trong quá trình Giải đóng gói (Decapsulation)?

<details>
<summary>Đáp án</summary>

- **Tại Layer 3 (Network Layer - Packet Decapsulation)**:
  1. Kiểm tra tính toàn vẹn của IP Header (Header Checksum trong IPv4).
  2. Kiểm tra địa chỉ IP đích xem có trùng với địa chỉ IP cục bộ của máy nhận hay không; nếu đúng thì chấp nhận gói tin.
  3. Bóc bỏ IP Header, trích xuất **Transport Segment** (L3-SDU) và chuyển lên tầng Giao vận dựa vào trường Protocol (hoặc Next Header).
- **Tại Layer 4 (Transport Layer - Segment Decapsulation)**:
  1. Ngăn xếp TCP/UDP kiểm tra checksum tầng giao vận để xác nhận tính toàn vẹn của cả header lẫn payload.
  2. Riêng với **TCP**: sắp xếp lại thứ tự các phân đoạn theo Sequence Number, xử lý xác nhận Acknowledgement và loại bỏ gói tin trùng lặp.
  3. Bóc bỏ L4 Header, chuyển giao khối **Application Data** nguyên vẹn vào vùng đệm (socket buffer) của tiến trình ứng dụng đang lắng nghe ở Layer 7.

</details>

### Câu Hỏi 6: Cơ chế Phân kênh ngược (Demultiplexing) là gì và dựa vào bộ ba khóa nhận diện nào ở các tầng mạng?

<details>
<summary>Đáp án</summary>

**Demultiplexing (Phân kênh ngược)** là cơ chế giúp mỗi tầng mạng bên dưới xác định chính xác giao thức hoặc tiến trình ứng dụng cụ thể nào ở tầng trên sẽ tiếp nhận dữ liệu khi có nhiều ứng dụng và giao thức cùng dùng chung một giao diện mạng vật lý.

Cơ chế này dựa trên bộ ba khóa nhận diện tuần tự:
1. **Layer 2 — Trường `EtherType` (16 bits / 2 bytes)** trong Header Ethernet II: Xác định giao thức Layer 3 bên trong payload, ví dụ `0x0800` (IPv4), `0x86DD` (IPv6), `0x0806` (ARP).
2. **Layer 3 — Trường `Protocol` (8 bits / 1 byte)** trong IPv4 Header (hoặc `Next Header` trong IPv6): Xác định giao thức Layer 4 xử lý gói tin, ví dụ `6` (TCP), `17` (UDP), `1` (ICMP).
3. **Layer 4 — Trường `Destination Port` (16 bits / 2 bytes)** trong Header TCP hoặc UDP: Xác định socket mạng và tiến trình ứng dụng cụ thể đang lắng nghe trên hệ điều hành (ví dụ: port 80/443 cho HTTP/HTTPS, port 22 cho SSH, port 53 cho DNS).

</details>

### Câu Hỏi 7: Kích thước Header, Trailer và các giới hạn kích thước chuẩn của Ethernet II, IPv4, TCP và UDP là bao nhiêu?

<details>
<summary>Đáp án</summary>

Các thông số kích thước chuẩn gồm:
- **Ethernet II (Layer 2)**:
  - Header: **14 bytes** (6B Dst MAC + 6B Src MAC + 2B EtherType).
  - Trailer FCS: **4 bytes** (CRC-32).
  - MTU chuẩn (IP packet tối đa): **1500 bytes**.
  - Payload tối thiểu: **46 bytes**; kích thước frame tối thiểu trên cáp: **64 bytes** ($14 + 46 + 4$).
- **IPv4 (Layer 3)**: Header tối thiểu **20 bytes** (khi `IHL = 5`, không có Options); kích thước gói tin IPv4 tối đa trên lý thuyết là 65,535 bytes.
- **TCP (Layer 4)**: Header tối thiểu **20 bytes** (khi `Data Offset = 5`, không có Options).
- **UDP (Layer 4)**: Header cố định tuyệt đối **8 bytes**.

</details>

### Câu Hỏi 8: Khi gửi 1000 bytes dữ liệu ứng dụng qua ngăn xếp TCP/IPv4 trên Ethernet II (header chuẩn, không Options), tổng kích thước Ethernet II Frame, tổng Overhead và tỷ lệ Overhead được tính như thế nào?

<details>
<summary>Đáp án</summary>

Các bước tính toán chi tiết:
1. **Kích thước TCP Segment (Layer 4)**:
   $$1000\text{ B (Data)} + 20\text{ B (TCP Header)} = 1020\text{ bytes}$$
2. **Kích thước IPv4 Packet (Layer 3)**:
   $$1020\text{ B (Segment)} + 20\text{ B (IPv4 Header)} = 1040\text{ bytes}$$
   *(Nhỏ hơn MTU 1500 bytes nên không bị phân mảnh).*
3. **Kích thước Ethernet II Frame (Layer 2)**:
   $$1040\text{ B (Packet)} + 14\text{ B (Eth Header)} + 4\text{ B (FCS Trailer)} = 1058\text{ bytes}$$
   *(Payload $1040 > 46$ bytes và Frame $1058 > 64$ bytes nên không cần zero-padding).*
4. **Tổng Overhead và tỷ lệ Overhead**:
   - Tổng Overhead = $20\text{ (TCP)} + 20\text{ (IPv4)} + 14\text{ (Eth Header)} + 4\text{ (FCS)} = 58\text{ bytes}$.
   - Tỷ lệ Overhead = $\frac{58}{1058} \times 100\% \approx 5.48\%$.

</details>

### Câu Hỏi 9: Trong lệnh `sudo tcpdump -e -nn -v -c 2 -i eth0 "tcp port 80"`, các tùy chọn `-e`, `-nn`, `-v`, `-c 2` có ý nghĩa gì và làm sao nhận biết thông tin L2, L3, L4 trong kết quả?

<details>
<summary>Đáp án</summary>

Ý nghĩa các tham số lệnh `tcpdump`:
- `-e`: In thông tin header tầng Liên kết dữ liệu Layer 2 (địa chỉ MAC nguồn/đích, EtherType).
- `-nn`: Không phân giải địa chỉ IP và số port sang tên miền hoặc tên dịch vụ (giữ nguyên dạng số).
- `-v`: Hiển thị chi tiết (verbose) các trường trong IP Header như `ttl`, `id`, `flags`, `length`, `proto`.
- `-c 2`: Chỉ bắt đúng 2 gói tin rồi tự động dừng.

Cách nhận biết thông tin các tầng trong output:
- **Layer 2**: Dạng `<Src MAC> > <Dst MAC>, ethertype IPv4 (0x0800), length <frame_len>` (lưu ý `tcpdump` thường hiển thị độ dài chưa gồm 4B FCS vì NIC phần cứng đã loại bỏ FCS trước khi đưa lên kernel buffer).
- **Layer 3**: Các trường trong ngoặc như `ttl 64`, `flags [DF]` (Don't Fragment), `proto TCP (6)` (khóa phân kênh L3), `length 60` (tổng độ dài IP Packet).
- **Layer 4**: Dạng `<Src IP>.<Src Port> > <Dst IP>.<Dst Port>`, cờ TCP như `Flags [S]` (SYN), số `seq`, `win`, `options`, và `length 0` (độ dài Application Payload).

</details>

### Câu Hỏi 10: Sự cố "Path MTU Discovery Black Hole" (Hố đen mạng do MTU Mismatch và cờ DF) xảy ra như thế nào và cách phòng tránh trong thực tế là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân kỹ thuật**:
  - Khi chạy trên mạng ảo hóa overlay (như VxLAN trong Kubernetes CNI, hoặc VPN IPsec/WireGuard), dữ liệu bị đóng gói lồng thêm một lớp header (ví dụ VxLAN thêm 50 bytes header).
  - Nếu NIC vật lý có MTU chuẩn 1500 bytes, phần MTU hữu dụng cho gói tin ứng dụng chỉ còn $1500 - 50 = 1450$ bytes.
  - Nếu ứng dụng gửi gói tin 1500 bytes có bật cờ `[DF]` (Don't Fragment), thiết bị trung gian không thể chuyển tiếp và buộc phải loại bỏ (drop) gói tin, đồng thời gửi về thông báo `ICMP Type 3 Code 4 (Fragmentation Needed and DF set)`.
  - Nếu Firewall/Security Group chặn thông điệp ICMP này, máy gửi không biết lý do mất gói, tiếp tục retransmit và khiến kết nối bị treo hoàn toàn (**Path MTU Discovery Black Hole**).
- **Thực tiễn sản xuất**:
  - Cấu hình đồng bộ MTU trên toàn chuỗi giao tiếp; với mạng overlay cloud/container, giảm MTU của giao diện container (`veth`) xuống mức an toàn (như `1450` hoặc `1420` bytes).
  - Hoặc bật tính năng **MSS Clamping** trên router/firewall (ví dụ qua `iptables` với `--clamp-mss-to-pmtu`).

</details>

### Câu Hỏi 11: "Small Packet Overhead Trap" (Chi phí Overhead của gói tin nhỏ) gây ra những hệ quả gì và cách tối ưu trong sản xuất là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất và hệ quả**:
  - Mỗi gói tin TCP/IPv4/Ethernet tốn cố định tối thiểu **58 bytes** siêu dữ liệu điều khiển ($14\text{B MAC} + 4\text{B FCS} + 20\text{B IP} + 20\text{B TCP}$).
  - Nếu ứng dụng (như IoT/Microservice) gửi dữ liệu cực nhỏ, ví dụ chỉ **2 bytes**, tổng kích thước là $2 + 58 = 60$ bytes; NIC phải đệm thêm 4 bytes zero-padding để đạt khung tối thiểu 64 bytes.
  - Khi đó dữ liệu thực chỉ chiếm $2 / 64 = 3.125\%$, còn **hơn 96% băng thông bị lãng phí** cho header và padding. Đồng thời số gói tin mỗi giây (**PPS - Packets Per Second**) tăng vọt khiến CPU phải liên tục xử lý ngắt phần cứng (`softirq`) để giải đóng gói.
- **Thực tiễn sản xuất**:
  - Áp dụng gom mẻ (**batching/buffering**) ở tầng ứng dụng thay vì gửi từng mẩu dữ liệu rời rạc.
  - Dùng các giao thức hiện đại như **HTTP/2** hoặc **gRPC** với cơ chế nén tiêu đề HPACK và multiplexing nhiều luồng trên một kết nối.

</details>

### Câu Hỏi 12: Cơ chế Zero-Padding ở Layer 2 hoạt động khi nào và gây ra cạm bẫy gì khi lập trình bắt gói tin tầng thấp (Raw Sockets / eBPF XDP)?

<details>
<summary>Đáp án</summary>

- **Cơ chế Zero-Padding**: Theo chuẩn RFC 894 và IEEE 802.3, phần tải trọng (payload) của khung Ethernet II tối thiểu phải đạt **46 bytes**. Với gói tin nhỏ hơn 46 bytes (ví dụ TCP ACK thuần túy không payload chỉ có $20\text{B IP} + 20\text{B TCP} = 40$ bytes), phần cứng NIC sẽ tự động chèn thêm **6 bytes số 0 (zero-padding)** để đạt đủ 46 bytes trước khi tính CRC-32 và phát lên đường dây.
- **Cạm bẫy khi lập trình tầng thấp**: Khi dùng `AF_PACKET` raw sockets hoặc eBPF XDP, nếu lập trình viên xác định độ dài dữ liệu dựa vào độ dài khung Layer 2 (`frame_len`) thay vì đọc trường `Total Length` trong L3 IPv4 Header, chương trình sẽ đọc nhầm cả các byte padding rác của Ethernet vào buffer dữ liệu ứng dụng.
- **Cách xử lý đúng**: Khi trích xuất payload từ gói tin thô, luôn tin cậy trường **`Total Length`** trong IPv4 Header để xác định chính xác ranh giới kết thúc của dữ liệu, không suy diễn từ độ dài khung Layer 2.

</details>
