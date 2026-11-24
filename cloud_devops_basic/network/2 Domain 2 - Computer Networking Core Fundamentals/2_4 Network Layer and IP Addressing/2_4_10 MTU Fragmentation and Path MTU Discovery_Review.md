# Review: 2_4_10 MTU Fragmentation and Path MTU Discovery

### Câu Hỏi 1: MTU (Maximum Transmission Unit) là gì và các giá trị chuẩn của MTU trên Ethernet, IPv4, IPv6 là bao nhiêu?

<details>
<summary>Đáp án</summary>

- **MTU (Maximum Transmission Unit)** là kích thước gói tin Tầng Mạng (Layer 3 Datagram, bao gồm cả L3 Header và Payload) tối đa có thể truyền qua một giao diện liên kết Layer 2 mà không cần phân mảnh.
- **Ethernet chuẩn**: MTU mặc định là **1500 octets (bytes)**.
- **IPv4 (RFC 791 Section 3.1)**: Mọi host IPv4 bắt buộc phải có khả năng chấp nhận và tái lắp ghép các gói tin có kích thước tối thiểu là **576 octets**.
- **IPv6 (RFC 8200 Section 5)**: Mọi liên kết mạng IPv6 trên toàn Internet bắt buộc phải hỗ trợ MTU tối thiểu là **1280 octets**.
</details>

---

### Câu Hỏi 2: TCP MSS (Maximum Segment Size) là gì và cách tính TCP MSS trên mạng Ethernet chuẩn như thế nào?

<details>
<summary>Đáp án</summary>

- **TCP MSS (Maximum Segment Size)** đại diện cho kích thước dữ liệu tầng ứng dụng lớn nhất mà một phân đoạn TCP có thể mang theo trong một gói IP.
- Trên mạng Ethernet chuẩn có MTU = 1500 octets, công thức tính là:
  $$\text{TCP MSS} = \text{MTU} - \text{IPv4 Header (20B)} - \text{TCP Header (20B)} = 1500 - 20 - 20 = 1460\text{ octets}$$
</details>

---

### Câu Hỏi 3: Trong cơ chế phân mảnh gói tin IPv4 (RFC 791 Section 3.2), các trường Identification, Flags (DF, MF) và Fragment Offset đóng vai trò gì?

<details>
<summary>Đáp án</summary>

- **Identification (16 bits)**: Mã định danh gán cho gói tin ban đầu. Mọi mảnh tách ra từ cùng một gói tin đều mang chung mã định danh này để máy đích nhận biết và ghép lại đúng gói.
- **Flags (3 bits)**:
  - **Bit 0 (Reserved)**: Luôn bằng `0`.
  - **Bit 1 — DF (Don't Fragment)**: Nếu `DF = 1`, router tuyệt đối không được phân mảnh (gói quá lớn sẽ bị hủy); nếu `DF = 0`, router được phép phân mảnh.
  - **Bit 2 — MF (More Fragments)**: `MF = 1` cho biết phía sau mảnh này vẫn còn các mảnh khác; mảnh cuối cùng của gói tin có `MF = 0`.
- **Fragment Offset (13 bits)**: Xác định vị trí tương đối của phần dữ liệu trong mảnh so với dữ liệu của gói tin ban đầu, tính bằng đơn vị **8 octets (64 bits)**. Vì vậy, kích thước phần dữ liệu của mọi mảnh phân mảnh (trừ mảnh cuối cùng) bắt buộc phải là bội số của 8 bytes.
</details>

---

### Câu Hỏi 4: Trong IPv4, việc phân mảnh và tái lắp ghép (reassembly) diễn ra ở đâu, tại sao router trung gian không tái lắp ghép, và điều gì xảy ra nếu một mảnh bị mất?

<details>
<summary>Đáp án</summary>

- **Nơi thực hiện (RFC 791 Section 2.2)**: Các router trung gian **được phép phân mảnh** gói tin khi gặp liên kết có MTU nhỏ hơn, nhưng **tuyệt đối không thực hiện tái lắp ghép**. Việc tái lắp ghép chỉ diễn ra **duy nhất tại máy đích cuối cùng** (Destination Host).
- **Lý do router trung gian không tái lắp ghép**: Router hoạt động theo nguyên tắc phi trạng thái (stateless) để tối ưu tốc độ chuyển tiếp; việc lưu đệm các mảnh trong RAM sẽ gây tốn bộ nhớ và độ trễ. Hơn nữa, trong mạng chuyển mạch gói động, các mảnh của cùng một gói tin có thể đi qua các tuyến đường khác nhau nên một router trung gian không đảm bảo nhận đủ tất cả các mảnh.
- **Khi mất một mảnh**: Toàn bộ gói tin ban đầu bị coi là mất. Máy đích sẽ hủy toàn bộ các mảnh còn lại sau khi hết thời gian chờ (Fragment Reassembly Timeout — kích hoạt thông điệp **ICMP Type 11 Code 1**).
</details>

---

### Câu Hỏi 5: Path MTU Discovery (PMTUD) hoạt động theo cơ chế nào trên IPv4?

<details>
<summary>Đáp án</summary>

PMTUD (RFC 1191 cho IPv4) ra đời để tránh việc router phải phân mảnh gói tin (gây tốn CPU router và tăng nguy cơ mất gói). Luồng hoạt động gồm các bước:
1. Host nguồn gửi gói tin với cờ **`DF = 1` (Don't Fragment)** trong IPv4 Header.
2. Khi gặp một router trung gian có MTU cổng ra nhỏ hơn kích thước gói tin, vì `DF = 1` nên router không được phân mảnh mà bắt buộc phải hủy (drop) gói tin đó.
3. Router gửi ngược về cho Host nguồn thông điệp báo lỗi **`ICMP Type 3, Code 4` (Destination Unreachable - Fragmentation Needed and DF set)**, trong đó ghi rõ giá trị **Next-Hop MTU** của liên kết tiếp theo.
4. Host nguồn nhận thông điệp ICMP này, giảm kích thước gói tin phát ra (cập nhật PMTU cache và điều chỉnh TCP MSS cho vừa khớp với Next-Hop MTU), rồi truyền lại dữ liệu.
</details>

---

### Câu Hỏi 6: Cơ chế phân mảnh gói tin trong IPv6 (RFC 8200 Section 5) khác biệt cốt lõi như thế nào so với IPv4?

<details>
<summary>Đáp án</summary>

- **Router trung gian không bao giờ phân mảnh**: Các bộ định tuyến IPv6 trung gian tuyệt đối không phân mảnh gói tin trên đường truyền (Routers NEVER fragment in transit).
- **Loại bỏ trường phân mảnh khỏi Header cơ bản**: Các trường ID, Flags, Fragment Offset đã bị xóa khỏi IPv6 Header cơ bản (40 octets).
- **Thông báo lỗi khi quá MTU**: Nếu gói tin IPv6 vượt quá MTU chặng tiếp theo, router hủy gói tin và gửi trả **`ICMPv6 Type 2 (Packet Too Big)`**.
- **Chỉ Host nguồn được phân mảnh**: Chỉ duy nhất Host nguồn ban đầu mới được phép thực hiện phân mảnh (Source-only fragmentation) bằng cách chèn thêm **Fragment Extension Header (Next Header = 44)**.
</details>

---

### Câu Hỏi 7: Hiện tượng "Hố đen MTU" (PMTUD Black Hole) là gì, do đâu mà xảy ra và biểu hiện thực tế như thế nào?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân (RFC 2923 Section 2.1)**: Xảy ra khi kết hợp hai yếu tố:
  1. Host nguồn gửi gói tin kích thước lớn với cờ **`DF = 1`**, gặp router có MTU nhỏ hơn nên bị hủy gói và router gửi trả `ICMP Type 3 Code 4`.
  2. Tường lửa (Firewall) hoặc thiết bị NAT trên đường đi cấu hình chặn toàn bộ gói tin ICMP (Drop all ICMP), khiến thông điệp báo lỗi không thể tới Host nguồn.
- **Hệ quả**: Host nguồn không biết phải giảm MTU nên liên tục gửi lại gói tin lớn cũ và tiếp tục bị router lặng lẽ tiêu hủy (silent drop).
- **Biểu hiện thực tế**: Quá trình bắt tay TCP 3 bước (SYN, SYN-ACK, ACK) thành công bình thường vì gói tin chỉ khoảng ~60 bytes; nhưng ngay khi truyền dữ liệu thực tế có kích thước lớn (tải trang web, trao đổi key SSH, chạy lệnh `ls -la` / `cat file_lon.txt`, tải file), kết nối lập tức bị treo cứng (hang/freeze) và timeout.
</details>

---

### Câu Hỏi 8: TCP MSS Clamping giải quyết hiện tượng PMTUD Black Hole như thế nào và công thức tính Clamped MSS là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế (RFC 4459 Section 3.2)**: Thiết bị mạng biên (Router hoặc Linux Firewall) quét và sửa đổi (viết đè) trực tiếp tùy chọn **TCP MSS** nằm trong các gói tin bắt tay **TCP SYN và SYN-ACK** đi qua nó, ép giá trị MSS xuống mức an toàn.
- **Công thức**:
  - Với IPv4: $\text{Clamped MSS} = \text{Tunnel MTU} - 40$
  - Với IPv6: $\text{Clamped MSS} = \text{Tunnel MTU} - 60$
- **Hiệu quả**: Hai đầu mút kết nối tự động thỏa thuận đóng gói phân đoạn TCP nhỏ vừa vặn với kích thước đường hầm (GRE, IPsec, VXLAN...) ngay từ đầu, loại bỏ nguy cơ vượt MTU mà không phụ thuộc vào gói tin ICMP.
</details>

---

### Câu Hỏi 9: Trên Linux và Windows, dùng những lệnh nào để cấu hình MTU, kiểm tra giới hạn MTU đường truyền (DF=1) và bật TCP MSS Clamping trên Linux Router?

<details>
<summary>Đáp án</summary>

- **Đổi và kiểm tra MTU trên Linux**:
  - Đổi MTU: `sudo ip link set dev eth0 mtu 1400`
  - Xem lại cấu hình: `ip link show dev eth0`
- **Thăm dò giới hạn MTU đường truyền với cờ Don't Fragment (`DF = 1`)**:
  - **Trên Linux**: `ping -s 1472 -M do 192.168.1.1` (trong đó `-M do` bật `DF=1`, payload ICMP 1472 bytes + ICMP Header 8 bytes + IP Header 20 bytes = 1500 bytes). Nếu vượt MTU giao diện, kernel báo `message too long`.
  - **Trên Windows**: `ping -f -l 1472 192.168.1.1` (cờ `-f` là Don't Fragment, `-l` là Buffer size). Nếu vượt MTU, kết quả báo `Packet needs to be fragmented but DF set.`.
- **Bật TCP MSS Clamping tự động trên Linux Router bằng `iptables`**:
  - `sudo iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu`
  - Lệnh này kiểm tra các gói TCP SYN/RST trên chuỗi `FORWARD` ở bảng `mangle` và tự động điều chỉnh MSS về đúng $\text{MTU} - 40$.
</details>

---

### Câu Hỏi 10: Trong vận hành thực tế (Production), phân mảnh gói tin và mạng đóng gói (Overlay Networks như Kubernetes CNI, VPN) gây ra những cạm bẫy gì và Best Practices để phòng tránh là gì?

<details>
<summary>Đáp án</summary>

- **Tổn thất hiệu năng do phân mảnh (`DF = 0`)**:
  - Router tốn CPU để chia nhỏ gói tin và tính lại checksum; máy đích tốn bộ nhớ RAM để chờ gom đủ các mảnh.
  - Xác suất mất toàn bộ gói tin tăng cao (ví dụ nếu tỷ lệ mất gói là 1%, mất 1 mảnh sẽ làm hỏng cả gói tin gốc).
  - **Best Practice**: Thiết kế hạ tầng mạng đồng nhất MTU (như Jumbo Frames 9000 bytes trong mạng SAN/Data Center hoặc 1500 chuẩn trên WAN) để loại bỏ phân mảnh.
- **Quên chi phí overhead của mạng đóng gói (Overlay Networks)**:
  - Các công nghệ như Kubernetes CNI (Calico, Flannel với VXLAN/Geneve) hoặc OpenVPN, IPsec/GRE cộng thêm từ 50 đến 70 bytes header đóng gói vào mỗi gói tin. Nếu MTU trong Pod/CNI vẫn đặt là 1500 bằng card vật lý, gói tin bọc ngoài sẽ vượt quá 1550 bytes gây phân mảnh liên tục hoặc rớt mạng.
  - **Best Practice**: Cấu hình MTU của card mạng ảo trong Pod / CNI thấp hơn card vật lý ít nhất 50–100 bytes (ví dụ đặt MTU Pod là 1440 hoặc 1450), hoặc kích hoạt `TCPMSS --clamp-mss-to-pmtu` trên router biên / đặt `mtu 1420` đồng bộ trên các interface đường hầm VPN.
</details>
