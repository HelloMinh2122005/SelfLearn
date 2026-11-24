# Review: 2_8_2 VPNs and IP Tunneling

### Câu Hỏi 1: Bản chất kỹ thuật của kỹ thuật Đóng gói đường hầm (Packet Tunneling) là gì và một gói tin đường hầm cơ bản gồm những thành phần nào?

<details>
<summary>Đáp án</summary>

Bản chất kỹ thuật của mọi giao thức đường hầm (tunneling protocol) là cơ chế **đóng gói lồng nhau (encapsulation)**: gói tin dữ liệu nguyên bản (**Inner Packet**) được xem như phần tải trọng (payload) thuần túy và được bao bọc bên trong một tiêu đề phân phát mới (**Outer Delivery Header**) để vận chuyển xuyên qua mạng trung gian (như mạng WAN công cộng hoặc giữa các vùng mạng độc lập).

Cấu trúc cơ bản của một gói tin đường hầm gồm 3 phần:
1. **Outer IP Delivery Header**: Tiêu đề mạng ngoài dùng để định tuyến trên mạng trung gian từ điểm đầu đường hầm (**tunnel ingress**) tới điểm cuối đường hầm (**tunnel egress**).
2. **Tunnel Header**: Tiêu đề của giao thức đường hầm (ví dụ GRE, ESP, WireGuard, VXLAN).
3. **Inner Packet**: Gói tin dữ liệu gốc (IP Packet hoặc L2 Ethernet Frame).

Tại điểm cuối đường hầm (egress), thiết bị thực hiện **bóc tách (decapsulation)** bỏ Outer IP Header và Tunnel Header để trích xuất và chuyển tiếp gói tin gốc vào mạng đích.
</details>

---

### Câu Hỏi 2: Giao thức GRE (RFC 2784, RFC 2890) dùng IP Protocol số bao nhiêu, kích thước tiêu đề là bao nhiêu và có hạn chế bảo mật gì?

<details>
<summary>Đáp án</summary>

- **Số hiệu giao thức**: GRE (Generic Routing Encapsulation) là giao thức đường hầm phi trạng thái (stateless) được gán số hiệu **IP Protocol = 47**, cho phép đóng gói đa dạng các giao thức tầng mạng bất kỳ chạy trên nền IP.
- **Kích thước tiêu đề**:
  - **Base GRE Header**: dài **4 bytes** (gồm cờ/phiên bản với *Version Number* bắt buộc bằng `0x00` và trường *Protocol Type* 16 bits chứa EtherType của gói tin bên trong như `0x0800` cho IPv4, `0x86DD` cho IPv6).
  - **Extended GRE Header (RFC 2890)**: có thể mở rộng tối đa lên **16 bytes** khi bật đầy đủ các trường tùy chọn gồm *Checksum* (2 bytes) + *Reserved1* (2 bytes), *Key* (4 bytes) và *Sequence Number* (4 bytes).
- **Hạn chế bảo mật**: GRE thuần túy **không có cơ chế mã hóa (cryptographic encryption)** và **không có xác thực nguồn gốc dữ liệu**. Toàn bộ payload bên trong được truyền dưới dạng văn bản rõ (cleartext).
</details>

---

### Câu Hỏi 3: Trong kiến trúc IPsec (RFC 4301), Security Policy Database (SPD) dùng để làm gì và có 3 hành vi xử lý cơ bản nào?

<details>
<summary>Đáp án</summary>

**Security Policy Database (SPD)** là cơ sở dữ liệu chứa các quy tắc phân loại lưu lượng dựa trên các bộ chọn (**selectors** như IP nguồn/đích, Port, Protocol).

Đối với mỗi gói tin IP đi vào (inbound) hoặc đi ra (outbound), ngăn xếp IPsec tra cứu SPD và thực hiện 1 trong 3 hành vi xử lý cơ bản:
1. **`DISCARD`**: Tiêu hủy gói tin không được phép truyền dẫn.
2. **`BYPASS IPsec`**: Cho phép gói tin đi qua trực tiếp mà không áp dụng đóng gói hay xử lý IPsec.
3. **`PROTECT using IPsec`**: Bắt buộc áp dụng xử lý bảo mật IPsec (thêm tiêu đề AH hoặc ESP).
</details>

---

### Câu Hỏi 4: Security Association (SA) và Security Association Database (SAD) trong IPsec là gì? Tại sao liên lạc hai chiều cần một cặp SA?

<details>
<summary>Đáp án</summary>

- **Security Association (SA)**: Là một kết nối logic **đơn công (simplex - một chiều)** cung cấp các dịch vụ bảo mật cho lưu lượng đi qua nó. Vì SA chỉ hoạt động một chiều nên để duy trì liên lạc hai chiều giữa 2 hệ thống IPsec, hệ thống bắt buộc phải thiết lập **một cặp SA (SA pair)** (mỗi chiều một SA), thường được thương lượng động qua giao thức **IKE (Internet Key Exchange)**.
- **Security Association Database (SAD)**: Là cơ sở dữ liệu lưu trữ các tham số hoạt động của các SA đang có hiệu lực (như thuật toán mã hóa, khóa chia sẻ, số tuần tự chống gửi lại).
- **Cách định danh SA (với lưu lượng Unicast)**: Mỗi SA trong SAD được định danh duy nhất bởi bộ 3 thông số:
  1. Chỉ số tham số bảo mật **SPI (Security Parameters Index - 32 bits)**.
  2. Địa chỉ **IP đích**.
  3. Loại giao thức bảo mật (**AH** hoặc **ESP**).
</details>

---

### Câu Hỏi 5: Phân biệt Transport Mode và Tunnel Mode trong IPsec. Khi nào bắt buộc phải dùng Tunnel Mode?

<details>
<summary>Đáp án</summary>

Theo RFC 4301:
- **Transport Mode (Chế độ truyền tải)**: Áp dụng bảo vệ trực tiếp lên các giao thức tầng kế tiếp (như payload TCP/UDP) và **giữ nguyên tiêu đề IP gốc (original IP header)**. Thường dùng cho kết nối bảo mật trực tiếp giữa hai máy chủ đầu cuối (host-to-host).
- **Tunnel Mode (Chế độ đường hầm)**: Đóng gói **toàn bộ gói tin IP bên trong** (gồm cả tiêu đề IP gốc và payload) vào bên trong một **tiêu đề IP mới bên ngoài (Outer IP Header)**.
- **Trường hợp bắt buộc dùng Tunnel Mode**: Đặc tả RFC 4301 quy định bắt buộc rằng bất cứ khi nào **một trong hai đầu mút của SA là Cổng bảo mật (Security Gateway / Router / Firewall)**, liên kết SA bắt buộc phải hoạt động ở **Tunnel Mode**.
</details>

---

### Câu Hỏi 6: So sánh hai giao thức cốt lõi của IPsec là AH (Authentication Header) và ESP (Encapsulating Security Payload).

<details>
<summary>Đáp án</summary>

- **AH (Authentication Header - RFC 4302, IP Protocol = 51)**:
  - Cung cấp tính toàn vẹn phi kết nối, xác thực nguồn gốc dữ liệu và chống gửi lại (anti-replay).
  - **Không cung cấp tính bí mật**: dữ liệu bên trong không được mã hóa.
  - Vì AH tính mã băm xác thực lên cả tiêu đề IP ngoài nên sẽ bị phá vỡ hoàn toàn khi đi qua thiết bị NAT.
- **ESP (Encapsulating Security Payload - RFC 4303, IP Protocol = 50)**:
  - Cung cấp đầy đủ: **tính bảo mật (mã hóa dữ liệu payload)**, xác thực nguồn gốc, tính toàn vẹn và chống gửi lại (anti-replay).
  - Cấu trúc gói tin ESP gồm: *ESP Header* (8 bytes: SPI 4B + Sequence Number 4B), *Payload Data & IV* (ví dụ IV 8B cho AES-GCM), *ESP Trailer* (Padding 0–255B, Pad Length 1B, Next Header 1B) và *ICV* (Integrity Check Value, thường 16B).
</details>

---

### Câu Hỏi 7: Tại sao IPsec ESP thuần túy không thể đi qua NAT/PAT và cơ chế NAT-Traversal (NAT-T, RFC 3948) giải quyết vấn đề này như thế nào?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân ESP gặp lỗi qua NAT**: ESP là giao thức độc lập dùng **IP Protocol = 50**, nằm trực tiếp trên tiêu đề IP và **không có tiêu đề TCP/UDP nên không chứa số hiệu cổng (Port Number)**. Do đó, các thiết bị NAT/PAT không có thông tin Port để tạo bảng ánh xạ dịch cổng và chuyển tiếp gói phản hồi về đúng máy khách nội bộ.
- **Giải pháp NAT-T (RFC 3948)**:
  - Giao thức bắt tay quản lý khóa IKE ban đầu sử dụng **cổng UDP 500**.
  - Khi phát hiện có thiết bị NAT dọc đường truyền (NAT Discovery), IKE tự động chuyển phiên sang **cổng UDP 4500**.
  - Toàn bộ gói tin ESP được bọc thêm tiêu đề **UDP với cổng đích 4500 (UDP port 4500)**, giúp các bảng trạng thái NAT/PAT theo dõi và định tuyến gói tin trơn tru.
</details>

---

### Câu Hỏi 8: Phân biệt hai mô hình triển khai VPN là Site-to-Site VPN và Remote-Access VPN.

<details>
<summary>Đáp án</summary>

- **Site-to-Site VPN**: Là kết nối cố định giữa hai mạng LAN riêng biệt thông qua **2 cổng bảo mật (Security Gateway / Firewall)** đặt tại mỗi văn phòng qua môi trường WAN công cộng. Toàn bộ quá trình mã hóa/giải mã diễn ra **trong suốt** đối với các máy chủ nội bộ.
- **Remote-Access VPN**: Là kết nối từ **thiết bị cá nhân của người dùng di động (roaming client hosts)** tới cổng bảo mật trung tâm của doanh nghiệp. Gateway trung tâm sẽ xác thực người dùng và cấp phát động địa chỉ IP nội bộ (**Virtual IP**) cho máy khách.
</details>

---

### Câu Hỏi 9: Cơ chế Cryptokey Routing của WireGuard hoạt động như thế nào đối với gói tin đi ra (outbound) và đi vào (inbound)?

<details>
<summary>Đáp án</summary>

**Cryptokey Routing** là cơ chế liên kết trực tiếp **Khóa công khai (Public Key)** của từng nút mạng (peer) với danh sách các địa chỉ IP nội bộ được phép đi qua đường hầm (**`AllowedIPs`**):
- **Khi gửi gói tin đi (Outbound)**: `AllowedIPs` hoạt động như một **bảng định tuyến (routing table)**. WireGuard căn cứ vào địa chỉ IP đích của gói tin nội bộ để tra cứu Public Key tương ứng của peer, dùng khóa đó mã hóa dữ liệu rồi gửi tới Endpoint của peer.
- **Khi nhận gói tin vào (Inbound)**: `AllowedIPs` hoạt động như một **danh sách kiểm soát truy cập (Access Control List - ACL)**. Sau khi giải mã bằng Public Key của peer gửi, WireGuard kiểm tra xem IP nguồn bên trong có nằm trong danh sách `AllowedIPs` được gán cho peer đó hay không. Nếu không khớp, gói tin bị tiêu hủy ngay để **chống giả mạo IP (IP spoofing)**.
</details>

---

### Câu Hỏi 10: WireGuard sử dụng giao thức và cổng mạng nào? Mức suy hao tiêu đề (overhead) và MTU mặc định của WireGuard trên IPv4 và IPv6 là bao nhiêu?

<details>
<summary>Đáp án</summary>

- **Giao thức và cổng**: WireGuard hoạt động hoàn toàn trên tầng truyền tải **UDP**, mặc định lắng nghe tại cổng **UDP 51820**. Khi không có dữ liệu cần truyền, giao diện hoàn toàn im lặng, không phát sinh lưu lượng thăm dò liên tục (trải nghiệm dạng phi kết nối / stateless-like), và sử dụng bắt tay mật mã nhanh dựa trên Noise Protocol Framework.
- **Cấu trúc và mức suy hao (Overhead)**:
  - Phần đóng gói WireGuard cố định là **40 bytes** (gồm Encapsulated UDP Header 8B + WireGuard Header 16B + Poly1305 Authentication Tag 16B).
  - **Trên nền IPv4**: Outer IPv4 (20B) + WireGuard (40B) = **60 bytes overhead** $\rightarrow$ MTU mặc định là **1440 bytes** (với Underlay MTU 1500B).
  - **Trên nền IPv6**: Outer IPv6 (40B) + WireGuard (40B) = **80 bytes overhead** $\rightarrow$ MTU mặc định là **1420 bytes**.
</details>

---

### Câu Hỏi 11: Mạng phủ ảo hóa VXLAN (RFC 7348) giải quyết giới hạn gì của VLAN truyền thống, sử dụng cổng nào và vai trò của VTEP, VNI là gì?

<details>
<summary>Đáp án</summary>

- **Mục đích và VNI**: VXLAN (Virtual eXtensible Local Area Network) đóng gói toàn bộ khung tin Ethernet Layer 2 của máy ảo bên trong một gói tin Layer 3 UDP/IP datagram trên mạng vật lý (Underlay Network). Nhờ trường định danh **VNI (VXLAN Network Identifier - 24 bits)** (kèm cờ **I flag** bắt buộc bằng 1 trong tiêu đề VXLAN 8 bytes), VXLAN cung cấp tới $2^{24} =$ **16,777,216 phân đoạn mạng độc lập**, vượt qua giới hạn 4094 VLAN của chuẩn IEEE 802.1Q để phục vụ môi trường đa người dùng (multi-tenant).
- **VTEP (VXLAN Tunnel Endpoint)**: Là điểm mút đường hầm thực hiện đóng gói và giải mã gói tin VXLAN, có thể chạy trên phần mềm ảo hóa (hypervisor/vSwitch) hoặc thiết bị chuyển mạch vật lý (ToR switch).
- **Cổng giao tiếp**: Cổng chính thức được IANA chỉ định cho VXLAN là **UDP port 4789** (một số nhân Linux cũ dùng cổng 8472).
</details>

---

### Câu Hỏi 12: Mức suy hao (overhead) của VXLAN over IPv4 là bao nhiêu và tại sao trong trung tâm dữ liệu cần cấu hình Jumbo Frames trên mạng Underlay?

<details>
<summary>Đáp án</summary>

- **Mức suy hao của VXLAN over IPv4**:
  - Tiêu đề L3/L4 bên ngoài: Outer IPv4 (20B) + Outer UDP (8B) + VXLAN Header (8B) = **36 bytes**.
  - Cộng thêm tiêu đề khung tin Ethernet nội bộ (**14 bytes**), tổng mức suy hao lên tải trọng Inner IP payload là **50 bytes** (khiến gói tin 1500B của VM thành **1550 bytes**).
- **Lý do cần Jumbo Frames**: Nếu mạng vật lý (Underlay) chỉ có MTU 1500 bytes, thiết bị VTEP buộc phải thực hiện **phân mảnh IP (IP Fragmentation)** thành 2 gói tin nhỏ hơn. Quá trình phân mảnh và ghép gói tiêu tốn rất nhiều CPU của hypervisor, làm sụt giảm thông lượng mạng và tăng độ trễ (latency jitter).
- **Thực tiễn chuẩn**: Kích hoạt **Jumbo Frames** xuyên suốt các switch vật lý (ToR, Core) và card mạng NIC với **MTU underlay $\ge$ 1600 bytes** (thông dụng là **9000 bytes**).
</details>

---

### Câu Hỏi 13: Từ chuẩn Underlay MTU 1500 bytes (IPv4 header 20B, TCP header 20B), hãy nêu mức overhead, Inner MTU và TCP MSS tối đa của GRE cơ bản, IPsec ESP Tunnel Mode (có và không có NAT-T)?

<details>
<summary>Đáp án</summary>

Với Ethernet chuẩn không đường hầm (Underlay MTU = 1500B): $\text{MSS}_{\text{chuẩn}} = 1500 - 40 = 1460\text{ bytes}$. Khi áp dụng đường hầm:
1. **GRE cơ bản over IPv4**:
   - Overhead = Outer IPv4 (20B) + Base GRE (4B) = **24 bytes**.
   - Inner MTU = **1476 bytes** $\rightarrow$ TCP MSS = **1436 bytes**.
2. **IPsec ESP Tunnel Mode (AES-GCM, không NAT-T)**:
   - Overhead = Outer IPv4 (20B) + ESP Header (8B) + IV (8B) + Trailer (2B) + ICV (16B) = **54 bytes** (cộng 0–2B padding thành **54–56 bytes**).
   - Inner MTU = **1442–1440 bytes** $\rightarrow$ TCP MSS = **1402–1400 bytes**.
3. **IPsec ESP over NAT-T (UDP port 4500)**:
   - Bổ sung thêm Outer UDP Header (8B) $\rightarrow$ Overhead = **62–64 bytes** (kèm padding).
   - Inner MTU = **1438–1434 bytes** $\rightarrow$ TCP MSS = **1398–1394 bytes**.
</details>

---

### Câu Hỏi 14: Sự cố "Hố đen PMTUD" (PMTUD Black Hole) là gì và tại sao nó thường gây ra hiện tượng lệnh `ping` vẫn thông nhưng truy cập HTTPS hoặc tải file lớn lại bị treo đơ?

<details>
<summary>Đáp án</summary>

**Nguyên nhân xảy ra hiện tượng này**:
1. Gói tin `ping` (ICMP Echo Request) hoặc phím gõ SSH có kích thước rất nhỏ (< 100 bytes), nằm gọn trong giới hạn MTU ngay cả sau khi đóng gói VPN nên truyền đi bình thường.
2. Khi tải file lớn hoặc trao đổi chứng chỉ TLS/HTTPS, máy chủ gửi các gói dữ liệu đầy tải **1500 bytes** có bật cờ **Don't Fragment (DF)**.
3. Tại cổng VPN Gateway, việc bọc thêm tiêu đề VPN khiến gói tin vượt quá 1500 bytes. Gateway buộc phải loại bỏ gói tin và gửi ngược lại thông điệp **ICMP Type 3, Code 4** (*Destination Unreachable, Fragmentation Needed and DF set*).
4. Nếu tường lửa dọc đường truyền chặn lưu lượng ICMP, thông điệp cảnh báo này không bao giờ quay về được máy chủ gửi. Máy chủ tiếp tục gửi lại gói 1500 bytes cũ cho tới khi hết thời gian chờ (timeout), gây treo đơ kết nối (**PMTUD Black Hole**).
</details>

---

### Câu Hỏi 15: Kỹ thuật TCP MSS Clamping giải quyết sự cố PMTUD Black Hole như thế nào và được cấu hình ra sao trên Linux (`iptables` / `nftables`) cùng các lệnh tạo tunnel cơ bản bằng `iproute2` / `wg`?

<details>
<summary>Đáp án</summary>

- **Cơ chế TCP MSS Clamping**: Can thiệp trực tiếp vào trường **MSS (Maximum Segment Size)** bên trong gói tin bắt tay **TCP SYN** để ép hai đầu mút giảm kích thước phân đoạn TCP tối đa xuống (ví dụ `Path_MTU - 40` cho IPv4 hoặc giá trị an toàn như `1360` bytes), đảm bảo gói tin sau khi bọc thêm tiêu đề VPN vẫn nằm gọn trong giới hạn MTU 1500 bytes mà không cần dựa vào thông điệp ICMP PMTUD.
- **Lệnh cấu hình TCP MSS Clamping trên Linux**:
  - Qua `iptables`: `sudo iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu` (hoặc `--set-mss 1360`).
  - Qua `nftables`: `sudo nft add rule inet filter forward tcp flags syn tcp option maxseg size set rt mtu`.
- **Các lệnh khởi tạo giao diện đường hầm cơ bản trên Linux**:
  - **GRE**: `sudo ip tunnel add gre1 mode gre remote <IP_Đích> local <IP_Nguồn> ttl 255`
  - **VXLAN**: `sudo ip link add dev vxlan10 type vxlan id 10 dev eth0 dstport 4789`
  - **WireGuard**: `sudo ip link add dev wg0 type wireguard` và cấu hình khóa/peer qua lệnh `sudo wg set wg0 listen-port 51820 private-key ... peer ... allowed-ips ... endpoint ...`
</details>
