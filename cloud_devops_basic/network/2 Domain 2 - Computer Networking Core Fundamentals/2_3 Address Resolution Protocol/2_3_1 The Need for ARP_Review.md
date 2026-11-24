# Review: 2_3_1 The Need for ARP

### Câu Hỏi 1: Tại sao các thiết bị trên mạng Ethernet cục bộ không thể dùng trực tiếp địa chỉ IPv4 để gửi khung tin mà bắt buộc phải cần đến giao thức ARP?

<details>
<summary>Đáp án</summary>

Theo đặc tả RFC 826, giao thức ARP là bắt buộc vì sự bất tương thích giữa Layer 3 và Layer 2:
- Mạng truyền thông vật lý dạng broadcast đa truy nhập như Ethernet đòi hỏi **địa chỉ phần cứng 48-bit (MAC address)** nằm trực tiếp trên cáp vật lý để card giao tiếp mạng (NIC) có thể nhận dạng và tiếp nhận khung tin (frame).
- Ngược lại, địa chỉ logic tầng mạng (như IPv4 32-bit) có độ dài khác biệt và **không có bất kỳ mối liên hệ cấu trúc hay toán học cố định nào** với địa chỉ phần cứng 48-bit.
- Địa chỉ IP và địa chỉ MAC có thể thay đổi độc lập nhau (ví dụ: đổi IP khi chuyển mạng hoặc cấp DHCP mới trong khi MAC giữ nguyên; hoặc thay card mạng mới trong khi IP giữ nguyên).
- Do đó, mạng cần giao thức ARP để phân phối động mối quan hệ tương ứng giữa cặp `<loại giao thức, địa chỉ giao thức>` và địa chỉ phần cứng Ethernet 48-bit.
</details>

### Câu Hỏi 2: Vì sao ARP thường được mô tả là một giao thức nằm ở "Layer 2.5" và giá trị EtherType của ARP trong khung Ethernet II là bao nhiêu?

<details>
<summary>Đáp án</summary>

ARP mang đặc tính lai ghép giữa Tầng 2 và Tầng 3 nên thường được gọi là giao thức **Layer 2.5**:
- **Đóng gói trực tiếp trong Layer 2**: ARP không sử dụng IP header mà được đóng gói trực tiếp vào phần tải trọng (payload) của khung Ethernet II.
- **Giá trị EtherType**: Khung Ethernet II chứa gói ARP sử dụng mã định danh giao thức **EtherType là `0x0806`** (khác với gói tin dữ liệu IPv4 thông thường có EtherType là `0x0800`).
- **Phục vụ mục đích Layer 3**: Dù nằm trực tiếp trong khung Ethernet, dữ liệu bên trong gói ARP lại dùng để phân tích và giải quyết địa chỉ giao thức tầng mạng (IPv4), đóng vai trò "chất keo" liên kết chặt chẽ giữa Tầng 2 và Tầng 3.
</details>

### Câu Hỏi 3: Trước khi kích hoạt ARP, một host sử dụng cơ chế nào để phân biệt đích đến là mạng cục bộ (Local) hay mạng từ xa (Remote), và host sẽ truy vấn địa chỉ MAC của thiết bị nào trong từng trường hợp?

<details>
<summary>Đáp án</summary>

Theo RFC 1122 và RFC 1812, trước khi phát ARP, host thực hiện **phép so sánh bit tiền tố mạng (Address Mask Bitwise Comparison)** bằng cách áp dụng subnet mask lên địa chỉ IP nguồn và địa chỉ IP đích:
- **Trường hợp 1 — Đích đến Cục bộ (Direct Delivery / Local Destination)**: Khi các bit mạng của IP đích **trùng khớp** hoàn toàn với các bit mạng của IP nguồn, đích đến nằm trên cùng mạng kết nối trực tiếp. Trình điều khiển liên kết dữ liệu sẽ kích hoạt ARP để phân giải địa chỉ MAC của **chính host đích**.
- **Trường hợp 2 — Đích đến Từ xa (Indirect Delivery / Remote Destination)**: Khi các bit mạng **không trùng khớp**, đích đến nằm ở mạng khác và phải đi qua Router/Gateway. Tầng định tuyến xác định địa chỉ của chặng tiếp theo (next-hop gateway IP), và ARP sẽ phân giải địa chỉ MAC của **Next-Hop Gateway** trên phân đoạn cáp cục bộ, tuyệt đối không tìm kiếm địa chỉ MAC của máy chủ đích cuối cùng.
</details>

### Câu Hỏi 4: Trong cấu trúc gói tin ARP (RFC 826), trường Operation Code (`ar$op`) có những giá trị nào cho IPv4 trên Ethernet, và cách thức truyền (Broadcast/Unicast) cùng giá trị Target Hardware Address (`ar$tha`) khác nhau ra sao giữa Request và Reply?

<details>
<summary>Đáp án</summary>

- **Giá trị Operation Code (`ar$op`)**:
  - `1`: **ARP Request** (yêu cầu phân giải).
  - `2`: **ARP Reply** (phản hồi phân giải).
- **Sự khác biệt giữa ARP Request và ARP Reply**:
  - **ARP Request**: Khung Ethernet được phát sóng **Broadcast** tới địa chỉ MAC đích `FF:FF:FF:FF:FF:FF` để mọi thiết bị trong mạng cục bộ đều nhận được. Trong gói ARP Request, trường Target Hardware Address (`ar$tha`) bị bỏ trống với giá trị `00:00:00:00:00:00`.
  - **ARP Reply**: Thiết bị có địa chỉ IP khớp với Target Protocol Address sẽ gửi trả **Unicast** trực tiếp về địa chỉ MAC của máy gửi, cung cấp địa chỉ MAC của mình và máy gửi sẽ lưu mối liên hệ này vào ARP Cache.
</details>

### Câu Hỏi 5: Kích thước tải trọng thuần của một gói tin ARP cho cặp IPv4 - Ethernet theo RFC 826 là bao nhiêu bytes, và được tính từ những trường nào?

<details>
<summary>Đáp án</summary>

Theo RFC 826, tải trọng thuần của một gói tin ARP cho IPv4 trên Ethernet có kích thước chính xác là **28 octets (bytes)** và không có bất kỳ byte đệm nào xen giữa các trường địa chỉ:
- **Hardware Type (`ar$hrd`)**: 2 bytes (giá trị `1` cho Ethernet).
- **Protocol Type (`ar$pro`)**: 2 bytes (giá trị `0x0800` cho IPv4).
- **Hardware Length (`ar$hln`)**: 1 byte (giá trị `6` cho MAC 6 bytes).
- **Protocol Length (`ar$pln`)**: 1 byte (giá trị `4` cho IPv4 4 bytes).
- **Operation Code (`ar$op`)**: 2 bytes (`1` hoặc `2`).
- **Sender Hardware Address (`ar$sha`)**: 6 bytes (MAC của máy gửi).
- **Sender Protocol Address (`ar$spa`)**: 4 bytes (IPv4 của máy gửi).
- **Target Hardware Address (`ar$tha`)**: 6 bytes (MAC của máy nhận).
- **Target Protocol Address (`ar$tpa`)**: 4 bytes (IPv4 cần phân giải).

Tổng cộng: $2 + 2 + 1 + 1 + 2 + 6 + 4 + 6 + 4 = 28\text{ bytes}$.
</details>

### Câu Hỏi 6: Tại sao gói tin ARP thuần chỉ dài 28 bytes nhưng khi truyền trên cáp Ethernet lại cần chèn thêm 18 bytes zero-padding để khung tin hoàn chỉnh đạt tối thiểu 64 bytes (hoặc 60 bytes chưa tính FCS)?

<details>
<summary>Đáp án</summary>

Theo tiêu chuẩn Ethernet (RFC 894 và IEEE 802.3), trường dữ liệu (payload) tối thiểu của một khung Ethernet bắt buộc phải là **46 octets (bytes)**. Nếu dữ liệu tầng trên nhỏ hơn 46 bytes, khung tin bắt buộc phải được chèn thêm các byte số 0 (`zero-padding`).
- Vì gói tin ARP thuần chỉ dài **28 bytes**, trình điều khiển mạng/NIC phải chèn thêm **18 bytes số 0** ($28 + 18 = 46\text{ bytes}$) để đạt kích thước payload tối thiểu.
- Khi ghép với **14 bytes Ethernet Header** (6B Dest MAC + 6B Src MAC + 2B EtherType) và **4 bytes FCS (CRC-32)**, khung Ethernet hoàn chỉnh đạt kích thước tối thiểu là $14 + 46 + 4 = 64\text{ bytes}$ (hoặc **60 bytes** trên đường truyền tại thời điểm chưa bao gồm 4 bytes FCS).
</details>

### Câu Hỏi 7: Trên Linux, khi chạy lệnh `ip route show`, các tuyến đường có `scope link` và `default via <gateway>` cho biết điều gì về hoạt động của ARP?

<details>
<summary>Đáp án</summary>

Lệnh `ip route show` giúp quan sát bảng định tuyến mà Linux Kernel tra cứu trước khi sinh gói ARP:
- **Dòng có `scope link`** (ví dụ: `192.168.1.0/24 dev eth0 proto kernel scope link ...`): Biểu thị phân đoạn mạng cục bộ kết nối trực tiếp. Mọi IP đích nằm trong dải mạng này sẽ được chuyển giao trực tiếp, kích hoạt ARP truy vấn địa chỉ MAC của **chính IP đích đó**.
- **Dòng `default via <gateway>`** (ví dụ: `default via 192.168.1.1 dev eth0 ...`): Áp dụng cho các IP đích nằm ngoài dải mạng kết nối trực tiếp. Kernel xác định chặng tiếp theo là IP của Gateway và chỉ gửi ARP truy vấn địa chỉ MAC của **Gateway** đó.
</details>

### Câu Hỏi 8: Lệnh `ip neigh show` trên Linux dùng để kiểm tra thành phần nào và trường `lladdr` trong kết quả hiển thị có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- Lệnh `ip neigh show` dùng để liệt kê các ánh xạ IP-to-MAC đã được phân giải và lưu trong **bảng lân cận (Neighbor Table / ARP Cache)** do Linux Kernel duy trì.
- Trường **`lladdr` (Link-Layer Address)** trong kết quả chính là địa chỉ phần cứng 48-bit (**MAC address**) tương ứng với từng địa chỉ IPv4 đã được giao thức ARP phân giải động và lưu vào bộ nhớ đệm của Kernel (kèm trạng thái như `REACHABLE` hoặc `STALE`).
</details>

### Câu Hỏi 9: Khi sử dụng lệnh `sudo tcpdump -e -n -i eth0 arp` để phân tích gói ARP ở cấp độ khung Ethernet, hai cờ `-e` và `-n` có tác dụng gì?

<details>
<summary>Đáp án</summary>

- **Cờ `-e`**: Hiển thị phần đầu khung tin tầng liên kết dữ liệu (**Ethernet Header**), bao gồm địa chỉ MAC nguồn/đích và mã giao thức **EtherType** (giúp thấy `ethertype ARP (0x0806)`).
- **Cờ `-n`**: Ngăn chặn việc phân giải địa chỉ IP/cổng sang tên miền hoặc tên dịch vụ.
</details>

### Câu Hỏi 10: Sự cố gì sẽ xảy ra nếu một máy chủ thuộc mạng `/24` bị cấu hình sai Subnet Mask thành `/16` và cố gắng gửi dữ liệu tới một IP ở mạng từ xa nhưng nằm trong dải `/16` đó?

<details>
<summary>Đáp án</summary>

Đây là cạm bẫy cấu hình sai Subnet Mask gây tê liệt phân giải địa chỉ:
- Vì phép so sánh bit giữa IP nguồn, IP đích và Subnet Mask (`/16`) cho kết quả trùng khớp phần mạng, máy chủ sẽ **ngộ nhận rằng IP từ xa đó nằm ngay trên mạng cục bộ** của mình.
- Thay vì gửi gói tin tới Gateway, máy chủ sẽ liên tục phát các bản tin **ARP Request broadcast** ra mạng LAN để hỏi tìm địa chỉ MAC của IP từ xa kia.
- Do không có máy chủ nào trong mạng LAN sở hữu IP đó, không có ARP Reply nào được trả về, khiến kết nối bị treo và báo lỗi timeout dù tuyến đường và Gateway vẫn hoạt động bình thường.
</details>

### Câu Hỏi 11: Tại sao thiết kế mạng phẳng (flat network) chứa hàng nghìn node trong cùng một subnet lại dễ gây ra bão bản tin ARP (ARP storm) và kỹ sư hạ tầng khắc phục bằng cách nào?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: ARP Request bắt buộc sử dụng địa chỉ quảng bá tầng 2 (`FF:FF:FF:FF:FF:FF`). Do đó, **mọi thiết bị nằm trong cùng một miền quảng bá (Broadcast Domain / cùng VLAN / cùng mạng vật lý)** đều bị card mạng ngắt CPU để đọc và xử lý từng gói ARP Request. Khi có hàng nghìn node trong cùng một subnet, lượng lưu lượng broadcast tăng vọt (ARP storm), làm suy giảm băng thông và chiếm dụng chu kỳ CPU vô ích của các máy chủ.
- **Cách khắc phục**: Phân tách mạng thành các **VLAN nhỏ hơn** hoặc áp dụng mô hình **định tuyến Layer 3 tới tận đầu tủ rack (Top-of-Rack L3 routing)**.
</details>

### Câu Hỏi 12: Tại sao khi bắt gói tin ARP ngay trên máy gửi bằng `tcpdump` hoặc Wireshark, kỹ sư đôi khi thấy kích thước gói tin chỉ là 42 bytes, trong khi ở máy nhận hoặc cổng port-mirror của Switch lại thấy 60–64 bytes?

<details>
<summary>Đáp án</summary>

Hiện tượng lệch kích thước này xảy ra do vị trí bắt gói tin trong hệ điều hành:
- Trên máy gửi, cơ chế bắt gói tin của hệ điều hành (như Linux `AF_PACKET`) chặn bắt gói tin ngay tại **tầng phần mềm của nhân hệ điều hành** trước khi khung tin được đưa xuống phần cứng NIC, nên lúc này khung tin chỉ gồm `14 bytes Ethernet Header + 28 bytes ARP Data = 42 bytes`.
- **Phần cứng NIC** (hoặc chip điều khiển) mới là nơi thực hiện chèn thêm **18 bytes zero-padding** và **4 bytes FCS** trước khi phát xung lên dây cáp. Vì vậy, trên máy nhận hoặc khi bắt qua cổng port-mirror của Switch, kích thước khung quan sát được sẽ đạt chuẩn tối thiểu từ **60 đến 64 bytes**.
</details>
