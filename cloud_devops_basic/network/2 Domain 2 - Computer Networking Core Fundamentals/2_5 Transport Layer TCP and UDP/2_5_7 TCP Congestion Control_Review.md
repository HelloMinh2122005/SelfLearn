# Review: 2_5_7 TCP Congestion Control

### Câu Hỏi 1: TCP Congestion Control được thiết kế để giải quyết vấn đề gì và hiện tượng Congestion Collapse là gì?

<details>
<summary>Đáp án</summary>

- **Mục đích**: TCP Congestion Control là cơ chế ở tầng Giao vận (Transport Layer) nhằm ngăn chặn hiện tượng **Congestion Collapse (Sụp đổ do tắc nghẽn)**.
- **Congestion Collapse**: Là trạng thái các hàng đợi tại các router trung gian bị quá tải nghiêm trọng, dẫn đến hàng loạt gói tin bị drop, các bên gửi ồ ạt gửi lại dữ liệu cũ, và kết quả là throughput hữu ích của toàn mạng rơi tự do về gần bằng `0`.

</details>

### Câu Hỏi 2: Flow Control (`rwnd`) và Congestion Control (`cwnd`) khác nhau như thế nào và quy tắc kết hợp cả hai là gì?

<details>
<summary>Đáp án</summary>

| Tiêu chí | Flow Control | Congestion Control |
| :--- | :--- | :--- |
| **Đối tượng bảo vệ** | Bộ đệm của bên Nhận (Receiver Buffer) | Hạ tầng mạng trung gian (Routers, Switches, Links) |
| **Biến điều phối** | `rwnd` (Receive Window / Advertised Window) | `cwnd` (Congestion Window) |
| **Vị trí tính toán** | Bên Nhận tính và thông báo qua TCP Header | Bên Gửi tự ước tính độc lập thông qua ACK và RTT |
| **Mục tiêu kỹ thuật** | Ngăn bên gửi nhanh làm tràn bộ đệm bên nhận chậm | Ngăn các bên gửi bơm quá tải năng lực của mạng |

- **Quy tắc điều phối truyền dẫn (RFC 5681 Section 3.1)**:
  $$\text{Effective Window} = \min(\text{cwnd}, \text{rwnd})$$
  Tại mọi thời điểm, lượng dữ liệu đang bay trên đường truyền chưa được xác nhận (**FlightSize**) của bên gửi không bao giờ được phép vượt quá giá trị nhỏ hơn giữa `cwnd` và `rwnd`.

</details>

### Câu Hỏi 3: Trong pha Slow Start, cửa sổ khởi tạo (Initial Window - IW) trên Linux hiện đại khác gì so với chuẩn RFC 5681 cũ và `cwnd` tăng trưởng như thế nào?

<details>
<summary>Đáp án</summary>

- **Bản chất Slow Start**: Khi kết nối TCP vừa thiết lập xong sau 3-way handshake, bên gửi chưa biết dung lượng khả dụng của đường truyền nên dùng Slow Start để thăm dò băng thông mà không gây xung đột tức thì.
- **So sánh Initial Window (IW)** (với mạng Ethernet có $\text{SMSS} = 1460\text{ bytes}$):
  - **Chuẩn RFC 5681 (RFC 3390)**: Chặn trên trong khoảng 2–4 segments; với $\text{SMSS} = 1460\text{ bytes}$ ($1095 < \text{SMSS} \le 2190$), $\text{IW} = 3 \times \text{SMSS} = 4380\text{ bytes}$.
  - **RFC 6928 & Linux Kernel 3.0+**: Hardcode `#define TCP_INIT_CWND 10` trong `include/net/tcp.h`, nâng IW lên **10 segments** (xấp xỉ $14600\text{ bytes}$), giúp truyền xong phần lớn tài nguyên web hiện đại ngay trong 1 chu kỳ RTT đầu tiên.
- **Tốc độ tăng trưởng**: Với mỗi cumulative ACK nhận được xác nhận dữ liệu mới, `cwnd` tăng thêm tối đa **1 SMSS**. Sau mỗi chu kỳ RTT, khi toàn bộ cửa sổ được ACK, `cwnd` **tăng gấp đôi (Exponential Growth)**.
- **Điều kiện kết thúc**: Slow Start kết thúc khi `cwnd >= ssthresh` (Slow Start Threshold) hoặc khi xảy ra mất gói/tắc nghẽn.

</details>

### Câu Hỏi 4: Khi nào TCP chuyển sang pha Congestion Avoidance và tốc độ tăng trưởng của `cwnd` trong pha này là bao nhiêu?

<details>
<summary>Đáp án</summary>

- **Điều kiện chuyển pha**: Khi `cwnd >= ssthresh`, TCP nhận biết luồng dữ liệu đang tiến gần tới ngưỡng dung lượng vật lý của tuyến mạng và chuyển từ Slow Start sang **Congestion Avoidance** để tránh làm tràn hàng đợi router ngay lập tức.
- **Tốc độ tăng trưởng (Additive Increase)**:
  - Theo RFC 5681 Section 3.1, `cwnd` tăng tuyến tính xấp xỉ **1 phân đoạn kích thước đầy đủ (1 SMSS) cho mỗi chu kỳ RTT**.
  - Công thức cập nhật gần đúng cho mỗi ACK hợp lệ:
    $$\text{cwnd} \leftarrow \text{cwnd} + \frac{\text{SMSS} \times \text{SMSS}}{\text{cwnd}}$$
  - Đây là pha **Additive Increase** trong cơ chế AIMD, giúp `cwnd` tăng chậm rãi cho tới khi xảy ra mất gói.

</details>

### Câu Hỏi 5: Duplicate ACK hình thành như thế nào và vì sao thuật toán Fast Retransmit cần đúng 3 Duplicate ACKs liên tiếp để kích hoạt?

<details>
<summary>Đáp án</summary>

- **Hiện tượng Duplicate ACK**: Vì TCP dùng cơ chế **Cumulative ACK** (xác nhận liên tục không đứt quãng), khi một phân đoạn bị thất lạc trên đường truyền nhưng các phân đoạn phía sau vẫn tới được bên nhận, bên nhận không thể ACK các gói đến sau mà liên tục gửi lại gói ACK yêu cầu cùng một byte đầu tiên bị thiếu (`SND.UNA`). Các ACK lặp lại này gọi là **Duplicate ACKs**.
- **Lý do cần 3 Duplicate ACKs liên tiếp** (tổng cộng 4 ACKs có cùng Acknowledgment Number, không có ACK trung gian dịch chuyển `SND.UNA`):
  - Một gói tin chỉ bị đến muộn hoặc đảo thứ tự đường truyền (reordering) thường chỉ sinh ra 1 hoặc 2 Duplicate ACKs.
  - Khi nhận đủ **3 Duplicate ACKs liên tiếp**, TCP có chỉ dấu tin cậy rằng một phân đoạn đã thực sự bị mất.
- **Hành động của Fast Retransmit**: Bên gửi lập tức truyền lại phân đoạn bị mất ngay lập tức mà **không cần chờ bộ định thời RTO đếm hết giờ**.

</details>

### Câu Hỏi 6: Fast Recovery hoạt động qua những bước nào khi nhận 3 Duplicate ACKs và mục đích của Window Inflation / Deflation là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất**: Vẫn nhận được Duplicate ACKs chứng tỏ các gói phía sau vẫn đến đích (mạng chỉ mất gói cục bộ chứ không đứt gãy hoàn toàn), nên TCP không hạ `cwnd` về `1 SMSS` mà thực hiện **Fast Recovery** (RFC 5681 Section 3.2):
  1. Đặt ngưỡng: $\text{ssthresh} = \max\left(\frac{\text{FlightSize}}{2}, 2 \times \text{SMSS}\right)$.
  2. Truyền lại phân đoạn bị mất tại `SND.UNA`.
  3. **Window Inflation (Thổi phồng cửa sổ)**: Tạm đặt $\text{cwnd} = \text{ssthresh} + 3 \times \text{SMSS}$. Cộng thêm `3 SMSS` đại diện cho 3 phân đoạn đã kích hoạt 3 Duplicate ACKs, hiện đã rời khỏi mạng và nằm trong bộ đệm bên nhận.
  4. Với mỗi Duplicate ACK tiếp theo nhận được, tiếp tục tăng $\text{cwnd} \leftarrow \text{cwnd} + \text{SMSS}$.
  5. **Window Deflation (Làm xẹp cửa sổ)**: Khi nhận được gói **Recovery ACK** (ACK xác nhận dữ liệu mới chưa từng được ACK trước đó), TCP hạ cửa sổ trở lại $\text{cwnd} = \text{ssthresh}$ và tiếp tục ở trạng thái **Congestion Avoidance**.

</details>

### Câu Hỏi 7: Giá trị Retransmission Timeout (RTO) được tính như thế nào theo RFC 6298 và TCP xử lý ra sao khi RTO Timer hết hạn?

<details>
<summary>Đáp án</summary>

- **Tính toán RTO động (RFC 6298 Section 2)**: Dựa trên RTT trung bình làm mượt (**SRTT**) và độ lệch biến thiên RTT (**RTTVAR**), với $\alpha = 1/8$, $\beta = 1/4$ và $G$ là độ phân giải clock hệ thống (tối thiểu thông thường là 1 giây theo RFC 6298 Section 2.4):
  $$\text{RTTVAR} \leftarrow (1 - \beta) \times \text{RTTVAR} + \beta \times |\text{SRTT} - R'|$$
  $$\text{SRTT} \leftarrow (1 - \alpha) \times \text{SRTT} + \alpha \times R'$$
  $$\text{RTO} = \text{SRTT} + \max(G, 4 \times \text{RTTVAR})$$
- **Xử lý khi RTO Timer hết hạn (RFC 6298 Section 5.5 & RFC 5681 Section 3.1)**:
  1. **Exponential Backoff**: Nhân đôi giá trị RTO ($\text{RTO} \leftarrow \text{RTO} \times 2$, ví dụ $1\text{s} \rightarrow 2\text{s} \rightarrow 4\text{s} \dots$) để giảm áp lực cho router trung gian.
  2. **Hạ `cwnd` về Loss Window (LW)**: Cưỡng bức đặt $\text{cwnd} = 1\text{ SMSS}$.
  3. **Cập nhật `ssthresh`**: $\text{ssthresh} = \max(\text{FlightSize}/2, 2 \times \text{SMSS})$.
  4. Truyền lại phân đoạn bị mất và quay về trạng thái **Slow Start** từ `1 SMSS` để tăng dần lên đến `ssthresh`.

</details>

### Câu Hỏi 8: Vì sao TCP phản ứng khác nhau hoàn toàn giữa trường hợp nhận 3 Duplicate ACKs và trường hợp hết hạn RTO?

<details>
<summary>Đáp án</summary>

- **Khi nhận 3 Duplicate ACKs (Fast Retransmit & Fast Recovery)**:
  - TCP giảm `ssthresh` xuống một nửa (`max(FlightSize/2, 2*SMSS)`), thực hiện inflate/deflate `cwnd` và chuyển về **Congestion Avoidance** (không quay về Slow Start).
  - *Lý do*: Việc các Duplicate ACKs vẫn về tới bên gửi chứng minh các gói tin phía sau vẫn đi qua được mạng và tới bộ đệm bên nhận — mạng vẫn truyền được dữ liệu, chỉ bị mất gói đơn lẻ.
- **Khi hết hạn RTO (Timeout Recovery)**:
  - TCP thực hiện **Exponential Backoff** (`RTO = RTO * 2`), hạ sập `cwnd = 1 SMSS` và bắt buộc quay lại **Slow Start** từ đầu.
  - *Lý do*: Hết hạn RTO mà không có gói ACK nào trở về đồng nghĩa tuyến mạng đang tắc nghẽn nghiêm trọng (black hole / congestion collapse). TCP phải dừng gần như toàn bộ luồng truyền để giải tỏa mạng và chỉ thả 1 gói đi thăm dò lại từ đầu.

</details>

### Câu Hỏi 9: Sự khác biệt cốt lõi giữa thuật toán CUBIC và BBR là gì?

<details>
<summary>Đáp án</summary>

- **CUBIC (mặc định trên nhân Linux)**:
  - Thuộc trường phái **Loss-based**: chỉ nhận biết tắc nghẽn khi đã có gói tin bị đánh rơi (packet drop).
  - Sử dụng hàm bậc 3 theo thời gian kể từ lần giảm cửa sổ gần nhất ($W_{cubic}(t) = C(t - K)^3 + W_{max}$): tăng rất nhanh khi xa điểm nghẽn cũ, làm phẳng tốc độ khi tiến gần điểm nghẽn để thăm dò ổn định, và bứt tốc lại nếu vượt qua điểm nghẽn mà mạng vẫn thông thoáng. Rất tối ưu cho mạng có BDP (Bandwidth-Delay Product) lớn.
- **BBR (Bottleneck Bandwidth and RTT — do Google phát minh)**:
  - Thuộc trường phái **Model-based**: thay vì chờ tràn bộ đệm và drop gói, BBR liên tục đo tốc độ phân phối tối đa (`max bandwidth`) và độ trễ khứ hồi tối thiểu (`min RTT`).
  - Duy trì lượng dữ liệu trên mạng xấp xỉ $\text{BDP} = \text{Bandwidth} \times \text{RTT}$, giúp ngăn ngừa hiện tượng bộ đệm router bị phình to (**Bufferbloat**).

</details>

### Câu Hỏi 10: Trên Linux, ta dùng lệnh `sysctl` và `ss` nào để kiểm tra thuật toán kiểm soát tắc nghẽn và các thông số nội bộ TCP (`cwnd`, `ssthresh`, `rtt`, `rto`)? Làm sao nhận biết một kết nối đang ở pha Slow Start hay Congestion Avoidance từ output của `ss`?

<details>
<summary>Đáp án</summary>

- **Kiểm tra cấu hình qua `sysctl`**:
  - Xem thuật toán mặc định của hệ thống: `sysctl net.ipv4.tcp_congestion_control` (thường trả về `cubic`).
  - Liệt kê các thuật toán khả dụng đã nạp trong kernel: `sysctl net.ipv4.tcp_available_congestion_control` (ví dụ `reno cubic`).
- **Giám sát thông số TCP nội bộ qua `ss -ti`** (cờ `-t` lọc TCP, cờ `-i` hiển thị Internal TCP Info):
  - Ví dụ: `ss -ti '( dport = :https or sport = :https )'`
  - Ý nghĩa các trường chính trong output:
    - Tên thuật toán (ví dụ `cubic`): thuật toán kiểm soát tắc nghẽn đang điều phối kết nối.
    - `cwnd`: kích thước Congestion Window hiện tại (tính theo số segments).
    - `ssthresh`: ngưỡng Slow Start Threshold (tính theo số segments).
    - `rtt:4.125/0.875`: biểu diễn `SRTT / RTTVAR` (ms).
    - `rto`: giá trị Retransmission Timeout hiện thời (ms).
    - `mss`: kích thước phân đoạn tối đa của bên gửi (`SMSS`, tính theo bytes).
- **Cách nhận biết pha hiện tại**: So sánh `cwnd` và `ssthresh`. Nếu `cwnd < ssthresh` (ví dụ `cwnd:10` và `ssthresh:32`), kết nối đang ở pha **Slow Start**; khi `cwnd >= ssthresh`, kết nối chuyển sang **Congestion Avoidance**.

</details>

### Câu Hỏi 11: Hiện tượng Bufferbloat xảy ra như thế nào với các thuật toán Loss-based và cách khắc phục trong thực tiễn sản xuất là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế gây Bufferbloat**:
  - Nhiều router, switch và gateway được trang bị bộ đệm (buffers) dung lượng rất lớn để tránh drop gói.
  - Các thuật toán **Loss-based** (như CUBIC, Reno) liên tục bơm thêm dữ liệu cho đến khi có gói bị drop mới chịu giảm tốc. Vì bộ đệm quá lớn, gói tin không bị drop ngay mà bị xếp hàng chờ (queued) hàng ngàn gói, khiến thời gian chờ hàng đợi (**Queuing Delay**) làm RTT tăng vọt (ví dụ từ `10 ms` lên `2.000 ms`). Hệ quả là người dùng thấy mạng lag nặng dù băng thông vẫn cao.
- **Giải pháp thực tiễn sản xuất**:
  - Kích hoạt các thuật toán **Active Queue Management (AQM)** như **CoDel** (Controlled Delay) hoặc **FQ-CoDel** trên thiết bị định tuyến trung gian.
  - Trên các dịch vụ streaming hoặc Web API nhạy cảm độ trễ, xem xét chuyển sang thuật toán **BBR** (Model-based) để điều tiết lưu lượng theo dung lượng ống dẫn thực tế thay vì làm đầy bộ đệm router.

</details>

### Câu Hỏi 12: Cơ chế Tail-Drop gây ra hiện tượng Global TCP Synchronization như thế nào và cần cấu hình gì để khắc phục?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân & Hậu quả**:
  - Khi bộ đệm hàng đợi của router trung gian đầy 100%, chính sách **Tail-Drop** sẽ loại bỏ không phân biệt toàn bộ các gói mới đến sau cùng của mọi luồng.
  - Hàng trăm kết nối TCP đi qua router bị mất gói tại cùng một thời điểm, dẫn đến việc **đồng loạt nhận 3 Duplicate ACKs hoặc RTO Timeout**, khiến tất cả **cùng co cụm `cwnd` lại một lúc** rồi lại **cùng tăng tốc theo chu kỳ AIMD**.
  - Sự đồng bộ này tạo ra các sóng xung kích dao động lưu lượng khổng lồ (lúc nghẽn cứng, lúc bỏ trống đường truyền), làm suy giảm hiệu suất tổng thể của hạ tầng.
- **Giải pháp**: Cấu hình **Random Early Detection (RED)** hoặc **WRED** trên switch/router mạng lõi để chủ động drop ngẫu nhiên một vài gói trước khi bộ đệm đầy hoàn toàn, giúp các kết nối TCP giảm tốc lệch pha nhau và triệt tiêu đồng bộ toàn cục.

</details>

### Câu Hỏi 13: Tại sao các thuật toán Loss-based (Reno, CUBIC) thường hoạt động kém hiệu quả trên mạng không dây (WiFi, 4G/5G) hoặc liên kết Cloud Cross-Region?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Các thuật toán Loss-based hoạt động dựa trên giả định rằng *mọi hiện tượng mất gói (packet loss) đều do tắc nghẽn mạng gây ra*.
- **Hậu quả**: Trên mạng không dây hoặc đường truyền cáp quang biển Cross-Region, gói tin có thể bị rớt do **nhiễu sóng vô tuyến ngẫu nhiên (random bit errors)** hoặc **suy hao vật lý** dù đường truyền không hề bị nghẽn. Thuật toán Loss-based vẫn phạt kết nối bằng cách cắt giảm `50%` hoặc `30%` `cwnd`, làm tốc độ truyền tải sụt giảm nghiêm trọng trong khi băng thông còn dư dả.
- **Giải pháp**: Với các dịch vụ phân phối nội dung toàn cầu (CDN, Edge Services), ưu tiên dùng giao thức **QUIC / HTTP/3** hoặc triển khai thuật toán **BBR** để tách biệt mất gói ngẫu nhiên với tắc nghẽn thực sự.

</details>
