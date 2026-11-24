# Review: 2_4_1 IPv4 Header Anatomy

### Câu Hỏi 1: Tầng Mạng (Layer 3) đảm nhiệm vai trò gì và cấu trúc IPv4 Header tiêu chuẩn theo RFC 791 có kích thước, số lượng trường dữ liệu như thế nào?

<details>
<summary>Đáp án</summary>

- Tầng Mạng (Network Layer - Layer 3) chịu trách nhiệm vận chuyển gói tin từ máy chủ nguồn tới máy chủ đích xuyên qua hàng loạt hệ thống mạng trung gian độc lập (định tuyến và kiểm soát vòng đời gói tin).
- Theo chuẩn **RFC 791 Section 3.1**, cấu trúc IPv4 Header gồm **14 trường dữ liệu**.
- Khi không có trường `Options` mở rộng, một tiêu đề IPv4 tiêu chuẩn có độ dài chính xác là **20 octets (bytes)**, tương ứng với **5 hàng từ 32-bit** (32-bit words).
</details>

### Câu Hỏi 2: Hai trường `Version` và `IHL (Internet Header Length)` có kích thước và ý nghĩa gì? Tại sao giá trị hợp lệ của `IHL` nằm trong khoảng từ `5` đến `15`?

<details>
<summary>Đáp án</summary>

- **`Version` (4 bits)**: Xác định định dạng của internet header. Đối với IPv4, giá trị nhị phân luôn cố định là `0100` (thập phân là `4`).
- **`IHL` (4 bits)**: Đo độ dài của IPv4 header theo đơn vị **từ 32-bit (4 bytes)**. Điểm cuối của header chỉ trực tiếp tới vị trí bắt đầu của dữ liệu tải trọng (`payload`).
- **Lý do giá trị từ `5` đến `15`**:
  - Một header IPv4 hợp lệ tối thiểu phải đủ 20 bytes các trường cơ bản, tương ứng `IHL` tối thiểu bằng **`5`** ($5 \times 4 = 20\text{ bytes}$).
  - Với 4 bits, giá trị thập phân lớn nhất biểu diễn được là **`15`** ($1111$ nhị phân), tương ứng độ dài header tối đa là $15 \times 4 = 60\text{ bytes}$.
</details>

### Câu Hỏi 3: Trường `Type of Service (ToS / DSCP)` có kích thước bao nhiêu bits và dùng để làm gì?

<details>
<summary>Đáp án</summary>

- Trường **`Type of Service (ToS / DSCP)`** có kích thước **8 bits**.
- Trường này cung cấp các tham số chất lượng dịch vụ (**Quality of Service - QoS**), độ ưu tiên (Precedence), độ trễ thấp hoặc thông lượng cao cho việc truyền gói tin qua các mạng con.
</details>

### Câu Hỏi 4: Trường `Total Length` đo đại lượng nào và giá trị tối thiểu, tối đa của nó là bao nhiêu?

<details>
<summary>Đáp án</summary>

- Trường **`Total Length`** (16 bits) đo tổng độ dài của toàn bộ datagram tính bằng **octets (bytes)**, bao gồm cả phần **IPv4 header** và phần **dữ liệu payload** của tầng trên.
- Kích thước tối thiểu là **20 octets** (chỉ có header tiêu chuẩn, không có data).
- Kích thước tối đa là **$2^{16} - 1 = 65,535\text{ octets}$**.
</details>

### Câu Hỏi 5: Ba trường `Identification`, `Flags` và `Fragment Offset` phối hợp với nhau như thế nào trong cơ chế phân mảnh gói tin (Fragmentation)?

<details>
<summary>Đáp án</summary>

Khi một gói tin phải chia nhỏ thành nhiều mảnh (fragments) để đi qua liên kết có MTU nhỏ hơn:
- **`Identification` (16 bits)**: Mang giá trị định danh duy nhất do máy chủ gửi gán, giúp bên nhận phân biệt và gom đúng các mảnh thuộc cùng một datagram ban đầu.
- **`Flags` (3 bits)**: Điều khiển xem gói tin có được phép phân mảnh hay không và báo hiệu mảnh hiện tại là mảnh cuối cùng hay vẫn còn mảnh tiếp theo.
- **`Fragment Offset` (13 bits)**: Xác định vị trí tương đối của phần dữ liệu trong mảnh này so với phần đầu của dữ liệu gốc, giúp bên nhận sắp xếp và ghép lại đúng thứ tự.
</details>

### Câu Hỏi 6: Ý nghĩa cụ thể của từng bit trong trường `Flags` (3 bits) là gì?

<details>
<summary>Đáp án</summary>

Trường `Flags` gồm 3 bits với chức năng điều khiển phân mảnh như sau:
- **Bit 0 (Reserved)**: Bit dự trữ, bắt buộc luôn có giá trị bằng `0`.
- **Bit 1 (DF - Don't Fragment)**: `0` = Cho phép phân mảnh; `1` = Cấm phân mảnh.
- **Bit 2 (MF - More Fragments)**: `0` = Mảnh cuối cùng (hoặc gói tin không bị phân mảnh); `1` = Vẫn còn các mảnh tiếp theo phía sau.
</details>

### Câu Hỏi 7: Trường `Fragment Offset` sử dụng đơn vị đo là gì và mảnh đầu tiên luôn có giá trị Offset bằng bao nhiêu?

<details>
<summary>Đáp án</summary>

- Trường **`Fragment Offset`** (13 bits) sử dụng đơn vị đo tính theo **khối 8 octets (64 bits)**.
- Mảnh đầu tiên của datagram luôn có `Fragment Offset = 0`.
</details>

### Câu Hỏi 8: Trường `Protocol` (8 bits) có chức năng gì và các mã giá trị chuẩn cho ICMP, TCP, UDP là bao nhiêu?

<details>
<summary>Đáp án</summary>

- Trường **`Protocol`** (8 bits) xác định giao thức tầng trên tiếp theo đang nằm bên trong phần tải trọng dữ liệu (`payload`) của gói tin IPv4.
- Các giá trị chuẩn do IANA quy định gồm:
  - **`1`**: ICMP
  - **`6`**: TCP
  - **`17`**: UDP
</details>

### Câu Hỏi 9: Mục đích chính của trường `Time to Live (TTL)` là gì và các router trung gian phải xử lý giá trị này ra sao?

<details>
<summary>Đáp án</summary>

- Trường **`Time to Live (TTL)`** (8 bits) giới hạn thời gian sống tối đa của datagram trong mạng nhằm **ngăn chặn hiện tượng lặp vòng vô tận (Routing Loops)** trên Internet. Trong thực tế, TTL hoạt động như một bộ đếm bước nhảy (**Hop Counter**).
- Theo **RFC 1812 Section 5.3.1**, mỗi router trung gian khi tiếp nhận một IP datagram bắt buộc phải **giảm giá trị TTL đi ít nhất 1 đơn vị**.
</details>

### Câu Hỏi 10: Theo RFC 1812, điều gì xảy ra khi giá trị `TTL` giảm xuống nhỏ hơn hoặc bằng 0, và cơ chế này được ứng dụng trong công cụ nào?

<details>
<summary>Đáp án</summary>

Khi giá trị `TTL` sau khi giảm đạt $\text{TTL} \le 0$:
1. Router bắt buộc phải **hủy bỏ gói tin (discard the datagram)**.
2. Router phải gửi bản tin báo lỗi **`ICMP Time Exceeded` (Type 11, Code 0 - Time to Live Exceeded in Transit)** quay ngược trở lại cho máy chủ nguồn (`Source IP Address`).

Đây chính là nguyên lý vận hành cốt lõi đằng sau công cụ chẩn đoán mạng **`traceroute` / `tracert`**.
</details>

### Câu Hỏi 11: Trường `Header Checksum` kiểm tra phạm vi nào của gói tin, trạm nhận xử lý thế nào khi checksum sai và tại sao router trung gian phải tái tính toán lại trường này?

<details>
<summary>Đáp án</summary>

- **Phạm vi kiểm tra**: `Header Checksum` (16 bits) **chỉ kiểm tra tính toàn vẹn cho riêng phần IPv4 header** (không kiểm tra phần dữ liệu payload), sử dụng thuật toán bù 1 (1's complement) của tổng bù 1 các từ 16-bit trong header.
- **Xử lý tại trạm nhận**: Khi cộng tất cả các từ 16-bit trong header theo phép cộng bù 1, nếu kết quả không phải toàn số 1 nhị phân (tương đương bù 1 bằng 0), gói tin bị coi là đã biến dạng trên đường truyền và bị **loại bỏ âm thầm mà không gửi phản hồi lỗi**.
- **Lý do router phải tái tính toán**: Vì mỗi router trung gian bắt buộc phải giảm trường `TTL` đi 1 đơn vị tại mỗi hop, nội dung của header đã thay đổi. Do đó, theo RFC 791 và RFC 1812 Section 5.2.2, router phải **tính toán lại giá trị `Header Checksum` mới** trước khi chuyển tiếp gói tin.
</details>

### Câu Hỏi 12: Các trường `Source IP Address`, `Destination IP Address` và `Options & Padding` có kích thước và vai trò như thế nào?

<details>
<summary>Đáp án</summary>

- **`Source IP Address` (32 bits)**: Lưu địa chỉ IPv4 logic 32-bit của máy trạm phát sinh gói tin.
- **`Destination IP Address` (32 bits)**: Lưu địa chỉ IPv4 logic 32-bit của máy trạm đích nhận gói tin.
- **`Options & Padding` (0–40 bytes)**: Trường tùy chọn dùng cho các mục đích như bảo mật, định tuyến nguồn (source routing), hoặc ghi dấu vết đường đi. Nếu độ dài phần `Options` không tròn bội số của 32 bits, **`Padding`** (các bit `0`) được thêm vào để làm tròn.
</details>

### Câu Hỏi 13: Khi đọc kết quả lệnh `tcpdump -i eth0 -nn -vvv -c 1 icmp`, các thông số `ttl 64`, `flags [DF]`, `proto ICMP (1)` và `length 84` cho biết thông tin gì?

<details>
<summary>Đáp án</summary>

- **`ttl 64`**: Giá trị `Time to Live` ban đầu của gói tin (do Linux kernel gán) là 64.
- **`flags [DF]`**: Cờ Don't Fragment đang được bật (`1`), cấm các router trung gian chia nhỏ gói tin này.
- **`proto ICMP (1)`**: Mã giao thức tầng trên trong trường `Protocol` là `1`, định danh cho giao thức ICMP.
- **`length 84`**: Giá trị `Total Length` của gói tin là 84 octets (gồm 20 bytes IPv4 Header + 64 bytes ICMP Echo payload).
</details>

### Câu Hỏi 14: Lệnh `ip -d link show eth0` giúp kiểm tra thông số nào liên quan đến phân mảnh, và điều kiện nào sẽ kích hoạt cơ chế phân mảnh gói tin IPv4?

<details>
<summary>Đáp án</summary>

- Lệnh `ip -d link show eth0` giúp kiểm tra giá trị **MTU (Maximum Transmission Unit)** của giao diện mạng (ví dụ `mtu 1500`, tức kích thước tối đa là 1500 bytes).
- Cơ chế phân mảnh (fragmentation) sẽ được kích hoạt khi một IP Datagram có **`Total Length` lớn hơn MTU** của chặng mạng và **cờ `DF = 0`** (cho phép phân mảnh).
</details>

### Câu Hỏi 15: Sự cố PMTUD Black Hole xảy ra khi nào và tại sao việc tường lửa chặn toàn bộ lưu lượng ICMP lại gây ra lỗi này?

<details>
<summary>Đáp án</summary>

- Khi gói tin gửi đi có cờ **`DF = 1`** nhưng kích thước **`Total Length` lớn hơn MTU** của một chặng trung gian (ví dụ qua đường hầm VPN hoặc mạng Overlay Geneve/VXLAN có MTU 1420), router trung gian buộc phải hủy gói tin và gửi lại bản tin **`ICMP Type 3, Code 4` (`Fragmentation Needed and DF set`)** về cho máy chủ nguồn.
- Nếu tường lửa **chặn toàn bộ lưu lượng ICMP**, bản tin thông báo này không thể quay về máy chủ nguồn. Kết quả là máy chủ nguồn không biết để giảm kích thước gói tin và cứ thử gửi lại gói lớn liên tục, khiến kết nối TCP bị treo cứng vô tận sau khi hoàn tất bắt tay 3 bước (**PMTUD Black Hole**).
</details>

### Câu Hỏi 16: Vì sao IPv6 loại bỏ trường Checksum khỏi header và vì sao các nhà cung cấp Cloud hiện đại thường mặc định loại bỏ gói tin IPv4 có chứa trường `Options`?

<details>
<summary>Đáp án</summary>

- **IPv6 (RFC 8200) loại bỏ trường Checksum**: Trong IPv4, việc mọi router phải tái tính toán lại `Header Checksum` tại từng bước nhảy (do `TTL` giảm) tạo ra nút thắt cổ chai hiệu năng lớn cho các router lõi tốc độ cao (Terabit core routers). Vì vậy, IPv6 đã bỏ hoàn toàn trường Checksum ở header L3 và đẩy trách nhiệm kiểm tra lỗi xuống tầng liên kết dữ liệu (L2 CRC) và tầng truyền vận (L4 TCP/UDP Checksum).
- **Cloud (AWS, Azure, GCP) và router hiện đại loại bỏ gói tin có `Options`**: Trường IPv4 `Options` có thể bị kẻ tấn công khai thác cho các kỹ thuật như **Loose/Strict Source Routing** (tự chỉ định lộ trình gói tin để vượt qua tường lửa) hoặc **Record Route**, gây rủi ro bảo mật nên mặc định bị drop.
</details>
