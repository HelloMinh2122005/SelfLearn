# Review: 2_4_7 IPv6 Architecture

### Câu Hỏi 1: Địa chỉ IPv6 có độ dài bao nhiêu bit, được biểu diễn như thế nào, và kiến trúc IPv6 có những điểm cải tiến cốt lõi nào so với IPv4?

<details>
<summary>Đáp án</summary>

- **Độ dài & không gian địa chỉ**: IPv6 sử dụng địa chỉ **128 bits** (16 bytes), cung cấp khoảng $3,4 \times 10^{38}$ địa chỉ, khắc phục sự cạn kiệt của không gian địa chỉ IPv4 32-bit (~4,29 tỷ địa chỉ).
- **Cách biểu diễn**: Địa chỉ IPv6 gồm **8 nhóm (hextets)**, mỗi nhóm gồm 4 chữ số thập lục phân (hexadecimal, giá trị 16-bit từ `0000` đến `ffff`), ngăn cách nhau bởi dấu hai chấm (`:`), theo dạng `x:x:x:x:x:x:x:x`.
- **Các cải tiến kiến trúc cốt lõi**:
  - Kích thước Header cố định **40 bytes** (thay vì biến thiên 20–60 bytes ở IPv4).
  - Loại bỏ hoàn toàn trường Header Checksum.
  - Cấm router trung gian phân mảnh gói tin.
  - Khai tử hoàn toàn cơ chế Broadcast, thay bằng Multicast và Anycast.
  - Thay thế ARP bằng giao thức khám phá láng giềng **NDP** (chạy trên ICMPv6).
  - Hỗ trợ tự động cấu hình địa chỉ phi trạng thái **SLAAC** kết hợp kiểm tra trùng lặp **DAD**.
</details>

### Câu Hỏi 2: Hai quy tắc rút gọn địa chỉ IPv6 theo RFC 4291 là gì, và tại sao dấu `::` chỉ được phép xuất hiện tối đa một lần trong một địa chỉ?

<details>
<summary>Đáp án</summary>

Theo RFC 4291 Section 2.2, hai quy tắc rút gọn bắt buộc gồm:
1. **Lược bỏ các số `0` ở đầu (Omit Leading Zeros)**: Trong mỗi nhóm 16-bit, các chữ số `0` đứng đầu được phép bỏ qua (ví dụ: `0042` thành `42`, `0000` thành `0`).
2. **Nén dãy số `0` liên tục bằng dấu hai chấm kép (`::`)**: Một chuỗi gồm một hoặc nhiều nhóm `0000` liên tiếp có thể được thay bằng một ký hiệu `::` duy nhất (ví dụ: `2001:0db8:0000:0000:0000:0000:1428:57ab` rút gọn thành `2001:db8::1428:57ab`).

**Lý do dấu `::` chỉ được dùng tối đa một lần**: Nếu dấu `::` xuất hiện từ 2 lần trở lên (ví dụ `2001::db8::1`), hệ thống không thể suy diễn toán học xem mỗi dấu `::` đại diện cho bao nhiêu nhóm số `0` bị thiếu, nên địa chỉ đó là bất hợp pháp và bị từ chối.
</details>

### Câu Hỏi 3: Hãy nêu 6 loại địa chỉ IPv6 theo phạm vi hoạt động (IPv6 Scopes), tiền tố (CIDR) và công dụng chính của từng loại?

<details>
<summary>Đáp án</summary>

| Loại địa chỉ | Tiền tố / CIDR | Phạm vi & Công dụng chính |
| :--- | :--- | :--- |
| **Global Unicast (GUA)** | `2000::/3` | Địa chỉ định tuyến công cộng toàn cầu (tương đương Public IPv4), cấp phát theo phân tầng IANA → RIR → ISP. |
| **Link-Local Address (LLA)** | `fe80::/10` | Phạm vi cục bộ liên kết (on-link only), tự động tạo trên mọi giao diện IPv6, **không bao giờ được router định tuyến ra ngoài**, dùng cho giao thức nội bộ (NDP, OSPFv3). |
| **Unique Local (ULA)** | `fc00::/7` | Phạm vi nội bộ doanh nghiệp (Site-local), tương đương dải Private RFC 1918 của IPv4, không định tuyến ra Internet công cộng. |
| **Multicast Address** | `ff00::/8` | Gửi 1 gói tin tới đồng thời nhiều thiết bị đã tham gia nhóm multicast tương ứng. |
| **Loopback Address** | `::1/128` | Nội bộ thiết bị (Node-local), tương đương `127.0.0.1` của IPv4, dùng kiểm thử ngăn xếp mạng cục bộ. |
| **Unspecified Address** | `::/128` | Toàn bit 0, biểu thị sự vắng mặt của địa chỉ, dùng làm Source IP khi máy mới khởi động chạy DAD. |
</details>

### Câu Hỏi 4: Tại sao IPv6 loại bỏ hoàn toàn cơ chế Broadcast, và sử dụng hai cơ chế nào để thay thế?

<details>
<summary>Đáp án</summary>

- **Lý do loại bỏ Broadcast**: Trong IPv4, các bản tin Broadcast (như ARP Request) buộc mọi thiết bị trong cùng mạng Layer 2 phải ngắt quãng CPU, bóc tách khung Ethernet và phân tích gói tin ngay cả khi gói tin không dành cho mình, gây lãng phí tài nguyên và tiềm ẩn nguy cơ bão quảng bá (Broadcast Storm).
- **Hai cơ chế thay thế trong IPv6**:
  1. **Multicast**: Gói tin chỉ được gửi tới các cổng mạng đã đăng ký tham gia nhóm địa chỉ multicast tương ứng (nhờ IGMP/MLD Snooping ở switch Layer 2).
  2. **Anycast**: Một địa chỉ được gán cho nhiều giao diện trên nhiều thiết bị khác nhau; gói tin gửi tới địa chỉ này sẽ được định tuyến tới giao diện gần nhất theo bảng định tuyến (Shortest routing metric).
</details>

### Câu Hỏi 5: Tiêu đề cơ sở (Header) của IPv6 có kích thước bao nhiêu và bao gồm những trường thông tin nào?

<details>
<summary>Đáp án</summary>

Theo RFC 8200 Section 3, tiêu đề cơ sở IPv6 có kích thước **cố định 40 octets (40 bytes / 320 bits)** với các trường sau:
1. **Version (4 bits)**: Luôn cố định là `0110` (thập phân: 6).
2. **Traffic Class (8 bits)**: Tương đương ToS/DSCP của IPv4, dùng để phân loại chất lượng dịch vụ (QoS).
3. **Flow Label (20 bits)**: Nhận diện luồng gói tin chuyên biệt, giúp router duy trì cùng đường đi cho các gói thuộc cùng luồng truyền thời gian thực (real-time stream) mà không cần bóc tách kiểm tra Layer 4 header.
4. **Payload Length (16 bits)**: Độ dài phần tải trọng đi sau 40 byte tiêu đề cơ sở (bao gồm cả Extension Headers và dữ liệu Layer 4).
5. **Next Header (8 bits)**: Xác định loại tiêu đề ngay kế tiếp (giao thức Layer 4 như TCP = 6, UDP = 17, ICMPv6 = 58, hoặc một Extension Header).
6. **Hop Limit (8 bits)**: Thay thế TTL của IPv4; mỗi router giảm giá trị này đi 1, khi về 0 gói tin bị hủy và router gửi bản tin `ICMPv6 Time Exceeded`.
7. **Source Address (128 bits)** & **Destination Address (128 bits)**: Địa chỉ IPv6 đầy đủ của máy phát và máy nhận.
</details>

### Câu Hỏi 6: Tại sao tiêu đề IPv6 loại bỏ trường Header Checksum, và điều này mang lại lợi ích gì cho hiệu năng định tuyến?

<details>
<summary>Đáp án</summary>

- **Lý do loại bỏ**: Tính toàn vẹn dữ liệu đã được kiểm tra ở Tầng Liên kết dữ liệu (Layer 2 CRC/FCS) và Tầng Truyền vận (Layer 4 Checksum bắt buộc trong TCP và UDP của IPv6).
- **Lợi ích hiệu năng**: Các router trung gian không còn phải tiêu tốn chu kỳ CPU để tính toán lại Checksum ở mỗi bước nhảy (hop) mỗi khi giảm trường Hop Limit. Điều này giúp giải phóng năng lực xử lý phần cứng trên các router lõi và đẩy thông lượng chuyển gói lên rất cao.
</details>

### Câu Hỏi 7: Quy định về phân mảnh gói tin (Fragmentation) và kích thước MTU tối thiểu trong IPv6 được thiết kế như thế nào?

<details>
<summary>Đáp án</summary>

- **Cấm router trung gian phân mảnh (RFC 8200 Section 5)**: Các router trung gian tuyệt đối không được phép phân mảnh gói tin IPv6; chỉ có **máy chủ nguồn** mới được phép phân mảnh thông qua Extension Header.
- **Cơ chế xử lý khi gói vượt quá MTU**: Nếu kích thước gói tin vượt quá MTU của đường truyền ở chặng giữa, router lập tức hủy gói tin và gửi bản tin `ICMPv6 Packet Too Big` về cho máy nguồn để máy nguồn tự hạ kích thước gói (cơ chế **Path MTU Discovery**).
- **MTU tối thiểu**: Mọi liên kết IPv6 bắt buộc phải hỗ trợ MTU tối thiểu là **1280 octets**.
</details>

### Câu Hỏi 8: Giao thức NDP (Neighbor Discovery Protocol) hoạt động trên nền giao thức nào, thay thế giao thức gì ở IPv4, và sử dụng 4 loại bản tin cốt lõi nào?

<details>
<summary>Đáp án</summary>

Giao thức **NDP (RFC 4861)** hoạt động trên nền bản tin **ICMPv6** để thay thế hoàn toàn giao thức **ARP** của IPv4. NDP sử dụng 4 bản tin ICMPv6 cốt lõi:
1. **Type 133 - Router Solicitation (RS)**: Host gửi đi để tìm kiếm các router IPv6 trên mạng nội bộ.
2. **Type 134 - Router Advertisement (RA)**: Router gửi định kỳ hoặc phản hồi RS để cung cấp thông số cấu hình mạng (Prefix, MTU, Default Route).
3. **Type 135 - Neighbor Solicitation (NS)**: Tương đương ARP Request, dùng để hỏi địa chỉ MAC của láng giềng hoặc kiểm tra trùng IP (DAD).
4. **Type 136 - Neighbor Advertisement (NA)**: Tương đương ARP Reply, chứa địa chỉ MAC vật lý của máy đích.
</details>

### Câu Hỏi 9: Địa chỉ Solicited-Node Multicast có cấu trúc ra sao và giải quyết vấn đề gì khi tìm địa chỉ MAC bằng Neighbor Solicitation (NS)?

<details>
<summary>Đáp án</summary>

- **Cấu trúc (RFC 4291 Section 2.7.1)**: Kết hợp tiền tố cố định `FF02:0:0:0:0:1:FF00::/104` với **24 bits trọng số thấp nhất** của địa chỉ IPv6 đích, tạo thành địa chỉ có dạng `FF02::1:FFxx:xxxx`.
- **Vấn đề được giải quyết**: Thay vì phát Broadcast tràn ngập mạng LAN như ARP làm mọi máy phải ngắt CPU để kiểm tra, bản tin NS chỉ gửi tới nhóm Solicited-Node Multicast này. Chỉ những máy chủ có cùng 24 bit cuối mới lắng nghe trên card mạng; các thiết bị còn lại trong cùng VLAN tự động lọc bỏ ở mức phần cứng mà không tốn tải xử lý CPU.
</details>

### Câu Hỏi 10: Quy trình tự động cấu hình phi trạng thái SLAAC (RFC 4862) diễn ra theo các bước nào để thiết bị tự tạo địa chỉ IPv6 mà không cần DHCP Server?

<details>
<summary>Đáp án</summary>

Thiết bị IPv6 (sau khi đã khởi tạo địa chỉ Link-Local `fe80::/10`) tự động tạo địa chỉ toàn cầu qua quy trình sau:
1. Thiết bị gửi bản tin **Router Solicitation (RS - Type 133)** để hỏi router trên liên kết mạng.
2. Router phản hồi bản tin **Router Advertisement (RA - Type 134)** chứa tiền tố mạng con (ví dụ: `2001:db8:1::/64`).
3. Thiết bị ghép **64 bit tiền tố mạng** nhận được với **64 bit Interface ID** của chính nó (tạo ngẫu nhiên hoặc qua EUI-64) để hình thành địa chỉ IPv6 đầy đủ.
4. Trước khi gán chính thức vào card mạng, thiết bị **bắt buộc phải thực hiện quy trình DAD** để đảm bảo địa chỉ không bị trùng.
</details>

### Câu Hỏi 11: Cơ chế DAD (Duplicate Address Detection) hoạt động như thế nào, và gói tin Neighbor Solicitation trong quy trình này mang những địa chỉ gì?

<details>
<summary>Đáp án</summary>

Theo RFC 4862 Section 5.4, trước khi gán chính thức một địa chỉ Unicast vào giao diện, host phải thực thi DAD:
- **Thông số gói tin Neighbor Solicitation (NS) gửi đi**:
  - `Source IP`: Địa chỉ chưa xác định **`::`** (Unspecified Address / toàn bit 0), vì địa chỉ mới chưa được phép gán chính thức.
  - `Destination IP`: Địa chỉ **Solicited-Node Multicast** của chính IP dự định dùng.
  - `Target Address`: Địa chỉ IP đang thẩm định trùng lặp.
- **Hai trường hợp kết quả**:
  - **Không trùng**: Hết thời gian chờ (Timeout) mà không có thiết bị nào phản hồi bản tin Neighbor Advertisement (NA) → địa chỉ là duy nhất và được gán hợp lệ cho card mạng.
  - **Bị trùng**: Một máy khác trong mạng phản hồi bản tin **Neighbor Advertisement (NA)** → DAD thất bại, giao diện bị đánh dấu `DUP` (Duplicate) và không được sử dụng địa chỉ đó.
</details>

### Câu Hỏi 12: Trên hệ điều hành Linux, những lệnh `ip` nào dùng để kiểm tra địa chỉ IPv6, bảng láng giềng NDP và bảng định tuyến IPv6? Tại sao Default Route thường trỏ tới địa chỉ Link-Local (`fe80::1`)?

<details>
<summary>Đáp án</summary>

Trên Linux, bộ công cụ `iproute2` sử dụng cờ `-6` cho giao thức IPv6:
- **Kiểm tra địa chỉ IPv6 & Scope trên card mạng**: `ip -6 addr show dev eth0` (hiển thị cả GUA `scope global` và LLA `scope link`).
- **Kiểm tra bảng láng giềng NDP (thay thế `arp -a`)**: `ip -6 neigh show` (hiển thị ánh xạ IPv6 sang MAC `lladdr` và trạng thái như `REACHABLE`).
- **Kiểm tra bảng định tuyến & kết nối**: `ip -6 route show` và `ping -6 -c 3 <địa-chỉ-IPv6>`.

**Ý nghĩa của `default via fe80::1`**: Tuyến đường mặc định IPv6 thường trỏ trực tiếp tới địa chỉ **Link-Local của router** học được từ bản tin Router Advertisement (RA), giúp đơn giản hóa việc thay đổi dải địa chỉ IP công cộng của nhà mạng mà không ảnh hưởng đến cấu hình gateway nội bộ.
</details>

### Câu Hỏi 13: Tại sao việc cấu hình tường lửa chặn toàn bộ giao thức ICMPv6 lại là một cạm bẫy nghiêm trọng trong vận hành mạng IPv6?

<details>
<summary>Đáp án</summary>

Khác với IPv4, trong IPv6 thì **ICMPv6 là thành phần cốt lõi để mạng hoạt động**. Nếu tường lửa khóa toàn bộ ICMPv6:
- Các bản tin **NDP (NS/NA)** bị hủy khiến thiết bị không thể phân giải địa chỉ MAC của Gateway.
- Các bản tin **SLAAC (RS/RA)** bị chặn khiến thiết bị không thể nhận cấu hình prefix và tự cấp địa chỉ IP.
- Bản tin **`ICMPv6 Packet Too Big`** bị chặn sẽ làm hỏng cơ chế Path MTU Discovery, gây ra lỗi **PMTUD Black Hole** khiến kết nối TCP bị treo cứng vô hạn.

**Best Practice**: Tuyệt đối không chặn các bản tin ICMPv6 thiết yếu (Types 1, 2, 3, 4, 128, 129, 133, 134, 135, 136).
</details>
