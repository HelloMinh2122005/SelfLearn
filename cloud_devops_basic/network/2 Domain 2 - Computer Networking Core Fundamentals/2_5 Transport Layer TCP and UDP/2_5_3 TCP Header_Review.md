# Review: 2_5_3 TCP Header

### Câu Hỏi 1: TCP nằm ở tầng nào trong mô hình TCP/IP, khắc phục những hạn chế gì của giao thức IP và hiện nay cấu trúc TCP Header được chuẩn hóa trong tài liệu RFC nào?

<details>
<summary>Đáp án</summary>

- **Vị trí & vai trò**: Trong kiến trúc TCP/IP, giao thức **IP** tại Tầng 3 hoạt động theo cơ chế *best-effort* (không đảm bảo gói tin tới đích, không giữ trật tự và có thể làm rơi rụng gói). **TCP (Transmission Control Protocol)** hoạt động tại **Tầng 4**, đóng vai trò giao thức hướng kết nối (*connection-oriented*), cung cấp kênh truyền dữ liệu **tin cậy** (*reliable*), **có thứ tự** (*ordered*) và **có kiểm soát dòng dữ liệu** giữa hai tiến trình ứng dụng đầu cuối.
- **Tài liệu chuẩn hóa**: Toàn bộ cấu trúc TCP Header và cơ chế hoạt động được chuẩn hóa toàn diện trong tài liệu **RFC 9293** (công bố tháng 8/2022, thay thế và hợp nhất tiêu chuẩn lịch sử RFC 793).
</details>

### Câu Hỏi 2: Kích thước tối thiểu và tối đa của một TCP Header là bao nhiêu bytes? Trường Data Offset (4 bits) hoạt động như thế nào và giá trị hợp lệ của nó nằm trong khoảng nào?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.1**:
- **Kích thước tối thiểu**: **20 bytes** (khi gói tin TCP không chứa tùy chọn bổ sung — *No Options*).
- **Kích thước tối đa**: **60 bytes** (khi sử dụng tối đa **40 bytes** cho phần *Options*).
- **Trường Data Offset (4 bits)**:
  - Biểu diễn độ dài toàn bộ tiêu đề TCP theo đơn vị **từ 32-bit** (*32-bit words* hay *4-byte words*), qua đó chỉ định chính xác vị trí mà dữ liệu ứng dụng (*payload data*) bắt đầu xuất hiện.
  - **Giá trị hợp lệ**: Từ **5** (nhị phân `0101`, tương ứng $5 \times 4 = 20\text{ bytes}$) đến **15** (nhị phân `1111`, tương ứng $15 \times 4 = 60\text{ bytes}$). Bất kỳ gói tin TCP nào có Data Offset nhỏ hơn 5 đều bị coi là không hợp lệ và bị loại bỏ.
  - **Công thức tính vùng Options**: $\text{size}(\text{Options}) = (\text{DOffset} - 5) \times 4\text{ bytes}$.
</details>

### Câu Hỏi 3: Hãy nêu tên, độ rộng bit và ý nghĩa kỹ thuật của các trường dữ liệu trong TCP Header theo chuẩn RFC 9293?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.1**, các trường trong TCP Header gồm:
- **Source Port** (16 bits): Cổng nguồn của tiến trình gửi (`0–65535`).
- **Destination Port** (16 bits): Cổng đích của tiến trình nhận (`0–65535`).
- **Sequence Number** (32 bits): Số thứ tự định danh vị trí byte đầu tiên của phân đoạn trong luồng dữ liệu.
- **Acknowledgment Number** (32 bits): Số thứ tự xác nhận byte kế tiếp mà bên gửi ACK đang chờ nhận.
- **Data Offset (DOffset)** (4 bits): Số từ 32-bit trong tiêu đề TCP (giá trị từ `5` đến `15`).
- **Reserved (Rsrvd)** (4 bits): Các bit dự phòng dành cho tương lai; bắt buộc thiết lập bằng `0` khi gửi.
- **Control Bits (Flags)** (8 bits): 8 cờ điều khiển trạng thái kết nối (`CWR`, `ECE`, `URG`, `ACK`, `PSH`, `RST`, `SYN`, `FIN`).
- **Window** (16 bits): Kích thước bộ đệm nhận (*receive window*) của bên gửi gói tin.
- **Checksum** (16 bits): Mã kiểm tra lỗi cho toàn bộ tiêu đề TCP, dữ liệu và *IP pseudo-header*.
- **Urgent Pointer** (16 bits): Con trỏ trỏ tới byte dữ liệu khẩn cấp (chỉ có hiệu lực khi cờ `URG` được bật).
- **Options** (0–40 bytes): Các tham số mở rộng thỏa thuận giữa hai đầu cuối (bội số của 4 bytes, có *Padding* `0` nếu cần cho đủ bội số 32-bit).
</details>

### Câu Hỏi 4: Theo RFC 9293, trường Reserved có độ rộng bao nhiêu bit và điểm khác biệt so với đặc tả thử nghiệm trước đây trong RFC 3540 là gì?

<details>
<summary>Đáp án</summary>

- Theo chuẩn hiện hành **RFC 9293 Section 3.1**, trường **Reserved** được chuẩn hóa cố định là **4 bits** và bắt buộc phải thiết lập bằng **`0`** khi gửi, theo sau là đúng **8 bits** cho các cờ điều khiển (*Control Bits*).
- **Điểm khác biệt lịch sử**: Trong đặc tả thử nghiệm trước đây theo **RFC 3540**, trường Reserved từng được tách thành **3 bits** dự phòng cộng với **1 bit** cho cờ **NS (Nonce Sum)** phục vụ cơ chế ECN. Tuy nhiên, RFC 3540 đã bị thu hồi và hạ cấp (*demoted*), không còn được sử dụng trong chuẩn chính thức RFC 9293.
</details>

### Câu Hỏi 5: Cơ chế đánh số Byte Stream của TCP hoạt động như thế nào và Sequence Number đại diện cho điều gì?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.4**:
- TCP coi dữ liệu từ ứng dụng là một **luồng byte liên tục** (*continuous byte stream*), không truyền tải các bản ghi hay thông điệp rời rạc.
- Mỗi một octet (byte) dữ liệu truyền qua kết nối TCP đều được gắn một số thứ tự duy nhất tuần tự tăng dần.
- Trong một phân đoạn TCP, byte dữ liệu đầu tiên ngay sau tiêu đề TCP mang số thứ tự nhỏ nhất của phân đoạn đó — đây chính là giá trị của trường **Sequence Number**, và các byte tiếp theo trong phân đoạn được đánh số liên tiếp.
</details>

### Câu Hỏi 6: Tại sao Initial Sequence Number (ISN) không được cố định bằng 0? Hãy nêu công thức tạo ISN theo RFC 9293 Section 3.4.1 và ý nghĩa các thành phần?

<details>
<summary>Đáp án</summary>

- **Lý do bảo mật**: Nếu ISN cố định bằng 0 hoặc tăng đều tuyến tính theo thời gian, kẻ tấn công ngoài luồng (*off-path attacker*) có thể đoán trước được Sequence Number (**lỗ hổng ISN Prediction & Off-path TCP Spoofing**). Từ đó, kẻ tấn công có thể giả mạo IP nguồn của máy chủ tin cậy để bơm dữ liệu độc hại hoặc gửi cờ `RST` phá vỡ các phiên TCP quan trọng (như phiên BGP giữa các router cốt lõi). Vì vậy, ISN phải được sinh ngẫu nhiên và độc lập cho mỗi chiều kết nối.
- **Công thức chuẩn (RFC 9293 Section 3.4.1)**:
  $$\text{ISN} = M + F(\text{localip}, \text{localport}, \text{remoteip}, \text{remoteport}, \text{secretkey})$$
  - **$M$**: Bộ đếm thời gian đơn điệu (*monotonic timer*) có chu kỳ **4 microsecond**.
  - **$F()$**: Hàm giả ngẫu nhiên mật mã (**PRF**) nhận diện 4-tuple của kết nối `(localip, localport, remoteip, remoteport)` cùng khóa bí mật nội bộ (`secretkey`) của nhân hệ điều hành. Chuẩn RFC 9293 bắt buộc hàm $F()$ tuyệt đối không thể bị tính toán hay suy diễn từ bên ngoài mạng.
</details>

### Câu Hỏi 7: Cơ chế Cumulative Acknowledgment (Xác nhận tích lũy) hoạt động ra sao? Nếu Client gửi 1.000 bytes dữ liệu bắt đầu từ Sequence Number 5000 và Server nhận đủ, giá trị Acknowledgment Number trả về là bao nhiêu?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.1 & 3.4**:
- **Điều kiện hiệu lực**: Trường **Acknowledgment Number** (32 bits) chỉ có ý nghĩa khi cờ điều khiển **ACK** được bật (`ACK = 1`).
- **Quy tắc xác nhận tích lũy**: Giá trị chứa trong trường này là số thứ tự của **byte tiếp theo** mà bên nhận đang mong đợi nhận được. Một gói tin mang `ACK = X` đồng nghĩa bên nhận đã thu thập thành công toàn bộ các byte đứng trước $X$ (từ byte đầu tiên cho đến byte $X - 1$).
- **Áp dụng ví dụ**: Phân đoạn bắt đầu tại byte `5000` với độ dài `1.000 bytes` chứa các byte từ `5000` đến `5999` ($5000 + 1000 - 1 = 5999$). Do đó, Server sẽ bật `ACK = 1` và đặt **`Acknowledgment Number = 6000`**.
- **Khi có mất gói tạo khoảng trống (gap)**: Bên nhận không thể tăng giá trị ACK vượt qua khoảng trống đó, mà tiếp tục gửi ACK lặp lại (**Duplicate ACK**) chỉ định byte bị thiếu hụt đầu tiên.
</details>

### Câu Hỏi 8: Hãy nêu chức năng của 6 cờ điều khiển truyền thống trong TCP Header: SYN, ACK, FIN, RST, PSH và URG?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.1**, chức năng của 6 cờ điều khiển truyền thống (mỗi cờ 1 bit) là:
- **SYN (Synchronize sequence numbers)**: Đồng bộ hóa số thứ tự; chỉ dùng trong các gói tin bắt tay đầu tiên để khởi tạo kết nối TCP và trao đổi ISN ban đầu.
- **ACK (Acknowledgment field significant)**: Chỉ thị trường Acknowledgment Number có giá trị hợp lệ. Hầu như mọi gói tin TCP sau bước bắt tay SYN đầu tiên đều bật cờ này.
- **FIN (No more data from sender)**: Thông báo bên gửi đã truyền xong toàn bộ dữ liệu và yêu cầu đóng chiều gửi của kết nối (bước vào quá trình đóng lịch sự).
- **RST (Reset Connection)**: Khởi tạo lại hoặc chấm dứt kết nối ngay lập tức mà không qua quy trình bắt tay đóng 4 bước thông thường, dùng khi có lỗi bất thường nghiêm trọng, cổng đích không tồn tại hoặc một bên muốn hủy kết nối ngay.
- **PSH (Push Function)**: Yêu cầu bên nhận đẩy ngay lập tức toàn bộ dữ liệu đang có trong bộ đệm lên tiến trình ứng dụng tầng trên mà không cần chờ bộ đệm đầy.
- **URG (Urgent Pointer significant)**: Khi bật, chỉ thị rằng trường **Urgent Pointer (16 bits)** trong tiêu đề có giá trị hợp lệ, xác định dữ liệu khẩn cấp cần được chuyển giao ưu tiên.
</details>

### Câu Hỏi 9: Hai cờ điều khiển còn lại trong nhóm 8 Control Bits là CWR và ECE có chức năng gì?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.1**, hai cờ phục vụ cơ chế thông báo tắc nghẽn (**ECN**) gồm:
- **ECE (ECN-Echo)**: Cờ thông báo tắc nghẽn. Khi nhận được gói tin IP có đánh dấu **CE (Congestion Experienced)**, bên nhận bật cờ `ECE` trong TCP Header để báo hiệu cho bên gửi biết mạng đang bị nghẽn.
- **CWR (Congestion Window Reduced)**: Cờ báo hiệu bên gửi đã giảm cửa sổ tắc nghẽn (*Congestion Window*) sau khi nhận được phản hồi `ECN-Echo` từ bên nhận.
</details>

### Câu Hỏi 10: Định dạng tổng quát của TCP Options gồm những trường nào? Tùy chọn MSS (Maximum Segment Size) có chức năng gì và giá trị mặc định theo RFC 9293 cho IPv4 và IPv6 là bao nhiêu nếu không nhận được tùy chọn này?

<details>
<summary>Đáp án</summary>

- **Định dạng chung của TCP Options**: Gồm 3 phần là `Kind` (1 byte), `Length` (1 byte) và `Value`.
- **MSS Option (RFC 9293 Section 3.7.1)**:
  - *Cấu trúc*: `Kind = 2` (1 byte), `Length = 4` (1 byte), `Value` (16 bits / 2 bytes).
  - *Chức năng*: Thông báo kích thước phân đoạn dữ liệu lớn nhất mà bên nhận có thể tiếp nhận trong một gói tin TCP duy nhất (**không tính** phần IP header và TCP header).
  - *Quy tắc gửi*: Được gửi trong gói tin có cờ **SYN**.
  - *Giá trị mặc định*: Nếu một đầu cuối không nhận được tùy chọn MSS khi thiết lập kết nối, theo RFC 9293 (`MUST-15`), bên gửi bắt buộc áp dụng mức mặc định là **536 bytes đối với IPv4** ($576 - 40$) và **1220 bytes đối với IPv6** ($1280 - 60$).
</details>

### Câu Hỏi 11: Tùy chọn Window Scale (RFC 7323) giải quyết hạn chế gì của trường Window gốc? Công thức tính kích thước cửa sổ thực tế và quy tắc trao đổi tùy chọn này như thế nào?

<details>
<summary>Đáp án</summary>

Theo **RFC 7323 Section 2.1 & 2.2**:
- **Hạn chế giải quyết**: Trường `Window` trong tiêu đề TCP gốc chỉ có **16 bits**, giới hạn bộ đệm nhận tối đa ở mức $2^{16} - 1 = 65,535\text{ bytes}$ (**64 KB**). Con số này quá nhỏ cho các đường truyền băng thông cao có độ trễ lớn (*High BDP — Bandwidth-Delay Product*).
- **Cơ chế & công thức**: Tùy chọn Window Scale (`Kind = 3`, `Length = 3`, `Shift Count` 1 byte có giá trị hợp lệ từ **0 đến 14**) cho phép mở rộng cửa sổ nhận lên tới **30 bits** (dung lượng tối đa lên tới **1 Gigabyte**). Giá trị thực tế được tính bằng cách dịch trái trường Window 16 bits theo hệ số thỏa thuận:
  $$\text{True Window} = \text{Window Header} \times 2^{\text{Shift Count}}$$
- **Quy tắc bắt buộc**: Tùy chọn này **chỉ được gửi duy nhất trong các phân đoạn `<SYN>`** khi mở kết nối. Hệ số *scale factor* sẽ được cố định cho mỗi chiều truyền trong suốt vòng đời của kết nối.
</details>

### Câu Hỏi 12: Tùy chọn SACK-Permitted (RFC 2018) giúp tối ưu hóa việc truyền lại dữ liệu như thế nào so với Cumulative ACK truyền thống, và quy tắc sử dụng của nó là gì?

<details>
<summary>Đáp án</summary>

Theo **RFC 2018 Section 1 & 2**:
- **Vấn đề của Cumulative ACK truyền thống**: Khi một gói tin bị rơi giữa chừng, bên gửi phải truyền lại toàn bộ các gói sau đó dù bên nhận đã thu thập được chúng.
- **Lợi ích của SACK**: Tùy chọn **SACK-Permitted** (`Kind = 4`, `Length = 2`) cho phép hai bên kích hoạt tính năng *Selective Acknowledgment* (SACK). Khi đó, bên nhận có thể báo cáo chính xác các khối dữ liệu rời rạc (*non-contiguous blocks*) đã nhận thành công, giúp bên gửi **chỉ truyền lại đúng những phân đoạn thực sự bị thất lạc**.
- **Quy tắc bắt buộc**: Tùy chọn SACK-Permitted 2 bytes này **chỉ được gửi trong gói SYN** và tuyệt đối không được xuất hiện trong các phân đoạn non-SYN.
</details>

### Câu Hỏi 13: Tùy chọn Timestamps (RFC 7323) gồm những trường dữ liệu nào và phục vụ hai cơ chế quan trọng nào?

<details>
<summary>Đáp án</summary>

Theo **RFC 7323 Section 3.1, 4.1 & 5.1**:
- **Cấu trúc** (`Kind = 8`, `Length = 10`): Gồm 2 trường là **`TSval`** (*Timestamp Value*, 4 bytes) và **`TSecr`** (*Timestamp Echo Reply*, 4 bytes).
- **Hai cơ chế phục vụ**:
  1. **RTTM (Round-Trip Time Measurement)**: Giúp đo lường chính xác độ trễ khứ hồi (RTT) trên từng gói tin để điều chỉnh bộ định thời truyền lại (*RTO*).
  2. **PAWS (Protection Against Wrapped Sequences)**: Trên các đường truyền tốc độ cao (Gigabit/10GbE), không gian số thứ tự 32-bit ($2^{32} \approx 4\text{ GB}$) có thể bị cuộn vòng (*wrap-around*) chỉ trong vài giây. Timestamps cung cấp dấu thời gian đơn điệu tăng dần để phân biệt các gói tin cũ bị trễ trên mạng với gói tin mới cùng mang chung số Sequence Number.
</details>

### Câu Hỏi 14: Trong kết quả bắt gói tin bằng `tcpdump`, các ký hiệu `Flags [S]`, `Flags [S.]`, `length 0` và `options [mss 1460,sackOK,...,wscale 7]` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Dựa trên phân tích gói tin `tcpdump` trong bài học:
- **`Flags [S]`**: Cờ `SYN = 1` và các cờ khác bằng `0` — đây là gói tin mở kết nối từ Client.
- **`Flags [S.]`**: Cờ `SYN = 1` và `ACK = 1` (dấu chấm `.` đại diện cho cờ `ACK = 1`) — đây là gói tin phản hồi `SYN-ACK` từ Server.
- **`length 0`**: *Payload Length* bằng `0` bytes dữ liệu ứng dụng — gói tin SYN thuần túy dùng để điều khiển, không mang tải trọng ứng dụng.
- **`options [mss 1460,sackOK,...,wscale 7]`**:
  - `mss 1460`: Tùy chọn MSS (`Kind 2`) báo hiệu kích thước phân đoạn dữ liệu nhận tối đa là `1460` bytes ($1500\text{ MTU} - 40\text{ IP/TCP header}$).
  - `sackOK`: Tùy chọn SACK-Permitted (`Kind 4`) kích hoạt xác nhận chọn lọc khi có mất gói.
  - `wscale 7`: Tùy chọn Window Scale (`Kind 3`) với hệ số dịch bit `7` (giá trị Window thực tế sẽ nhân $2^7 = 128$).
</details>

### Câu Hỏi 15: Sự cố Middlebox Stripping đối với TCP Options là gì và gây ra hậu quả như thế nào cho hiệu năng đường truyền?

<details>
<summary>Đáp án</summary>

- **Bản chất**: Nhiều tường lửa cũ, thiết bị kiểm duyệt gói tin (*Middleboxes*) hoặc thiết bị cân bằng tải kém chất lượng tự ý cắt bỏ (*strip*) các tùy chọn TCP không nhận diện được nằm sau 20 bytes tiêu đề chuẩn.
- **Hậu quả**: Nếu Middlebox cắt bỏ `Window Scale` hoặc `SACK Permitted` trong gói SYN, kết nối buộc phải lùi về cơ chế TCP nguyên thủy: cửa sổ nhận bị kẹt cứng ở mức trần tối đa **64 KB**. Trên các đường truyền xuyên quốc gia có độ trễ lớn (*High RTT*), thông lượng truyền tải (*throughput*) có thể bị sụt giảm từ hàng trăm Mbps xuống chỉ còn vài Mbps dù đường truyền vật lý hoàn toàn thông suốt.
</details>

### Câu Hỏi 16: Hiện tượng PMTUD Black Hole trên kết nối PPPoE, GRE hoặc VPN (IPsec/WireGuard) xảy ra như thế nào và giải pháp TCP MSS Clamping khắc phục ra sao?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân & hiện tượng**: Chuẩn Ethernet thông thường có MTU = 1500 bytes (cho phép MSS tối đa $1500 - 40 = 1460\text{ bytes}$). Khi lưu lượng đi qua đường hầm đóng gói bổ sung (PPPoE tốn thêm 8 bytes; VPN/IPsec/WireGuard tốn 40–80 bytes *overhead*), MTU thực tế bị co lại còn khoảng `1420–1492 bytes`. Khi đó:
  - Người dùng vẫn bắt tay TCP bình thường (vì gói SYN/ACK nhỏ) và `ping` vẫn thông.
  - Nhưng khi tải trang web lớn hoặc download file, gói tin mang cờ **DF (Don't Fragment)** vượt quá MTU đường hầm bị drop âm thầm vì bản tin lỗi **ICMP Fragmentation Needed** bị tường lửa chặn mất (**PMTUD Black Hole**), khiến kết nối bị treo hoàn toàn.
- **Giải pháp TCP MSS Clamping**: Cấu hình tính năng **TCP MSS Clamping** trên router biên hoặc firewall (ví dụ dùng `iptables` với target `TCPMSS --clamp-mss-to-pmtu`) để thiết bị mạng tự động can thiệp và viết lại (*rewrite*) trường MSS trong gói SYN xuống giá trị an toàn tương ứng với độ rộng đường hầm.
</details>
