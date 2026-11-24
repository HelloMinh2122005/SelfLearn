# Review: 2_1_1 How Networks Transfer Data

### Câu Hỏi 1: Sự khác biệt cốt lõi giữa Chuyển mạch kênh (Circuit Switching) và Chuyển mạch gói (Packet Switching) là gì?

<details>
<summary>Đáp án</summary>

Theo bài học (dựa trên Kurose & Ross Mục 1.2.1–1.2.2 và RFC 1812 Section 2.2.1), hai mô hình này khác nhau ở 5 điểm chính:

- **Cơ chế cấp phát tài nguyên**:
  - *Circuit Switching*: Cấp phát dành riêng (Reserved / Dedicated) mọi tài nguyên dọc tuyến truyền (bộ đệm, tốc độ truyền dẫn liên kết) cho phiên truyền suốt thời gian kết nối.
  - *Packet Switching*: Cấp phát theo nhu cầu (On-Demand / Statistical Multiplexing); tài nguyên không được cấp phát trước mà các gói tin dùng chung tài nguyên đường truyền khi phát sinh dữ liệu.
- **Đơn vị truyền dữ liệu**:
  - *Circuit Switching*: Luồng bit liên tục truyền qua kênh vật lý/logic cố định đã thiết lập sẵn.
  - *Packet Switching*: Dữ liệu được chia nhỏ thành các khối độc lập gọi là **Gói tin (Packets)** mang theo địa chỉ nguồn và đích.
- **Trạng thái khi không có dữ liệu (Idleness)**:
  - *Circuit Switching*: Gây lãng phí tài nguyên vì kênh truyền vẫn bị chiếm dụng dù hai bên im lặng, các máy trạm khác không dùng được.
  - *Packet Switching*: Tối ưu hóa hiệu suất vì khi một nút không gửi dữ liệu, băng thông đường truyền sẵn sàng phục vụ các gói tin của nút khác.
- **Hiện tượng xếp hàng (Queuing)**:
  - *Circuit Switching*: Không có hiện tượng xếp hàng dọc tuyến; dữ liệu đi xuyên suốt với tốc độ cố định sau khi kênh đã thiết lập.
  - *Packet Switching*: Các gói tin phải xếp hàng (Queue) tại bộ đệm của bộ chuyển mạch/router nếu đường truyền đầu ra đang bận.
- **Ứng dụng tiêu biểu**:
  - *Circuit Switching*: Mạng điện thoại viễn thông truyền thống (PSTN).
  - *Packet Switching*: Mạng Internet toàn cầu và các mạng IP doanh nghiệp/Cloud hiện đại.
</details>

---

### Câu Hỏi 2: Nguyên lý Store-and-Forward trong mạng chuyển mạch gói quy định điều gì và tại sao Router phải thực hiện cơ chế này?

<details>
<summary>Đáp án</summary>

**Định nghĩa**: Nguyên lý **Store-and-Forward** quy định rằng thiết bị chuyển mạch gói (Packet Switch / Router) bắt buộc phải nhận **toàn bộ gói tin** trước khi có thể bắt đầu truyền bit đầu tiên của gói tin đó lên đường truyền ra (outbound link).

**3 lý do Router phải đợi nhận đủ toàn bộ gói tin thay vì đẩy từng bit đi ngay**:
1. **Kiểm tra tính toàn vẹn (Integrity Verification)**: Router cần đọc toàn bộ gói tin để tính toán và đối chiếu mã kiểm tra lỗi (Frame Check Sequence / Checksum). Nếu phát hiện bit bị lỗi trên đường truyền, router hủy ngay gói tin hỏng thay vì lãng phí băng thông chuyển tiếp dữ liệu rác.
2. **Xử lý phần đầu gói tin (Header Processing & Routing)**: Router cần trích xuất địa chỉ IP đích từ Header để tra cứu bảng định tuyến (FIB - Forwarding Information Base), từ đó xác định cổng giao tiếp đầu ra (outbound interface) thích hợp.
3. **Thích ứng chênh lệch tốc độ (Speed Matching)**: Đường truyền nhận dữ liệu có thể có tốc độ khác với đường truyền gửi đi (ví dụ: nhận từ liên kết 10 Gbps nhưng gửi ra liên kết 1 Gbps). Store-and-Forward cho phép lưu tạm gói tin vào bộ nhớ đệm (buffer) trước khi phát ra.
</details>

---

### Câu Hỏi 3: Tổng thời gian trễ tại một nút mạng ($d_{\text{nodal}}$) gồm những thành phần nào và ý nghĩa của từng thành phần là gì?

<details>
<summary>Đáp án</summary>

Tổng thời gian trễ tại một nút mạng được cấu thành từ 4 thành phần độc lập theo công thức:

$$d_{\text{nodal}} = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}}$$

Ý nghĩa của 4 thành phần:
1. **Trễ xử lý nút ($d_{\text{proc}}$ — Processing Delay)**: Thời gian router đọc phần đầu gói tin (header), kiểm tra mã checksum bit để phát hiện lỗi và tra cứu bảng định tuyến để tìm cổng đầu ra. Giá trị này thường rất nhỏ (khoảng micro-giây hoặc nano-giây trên các router phần cứng chuyên dụng ASIC).
2. **Trễ hàng đợi ($d_{\text{queue}}$ — Queuing Delay)**: Thời gian gói tin phải nằm chờ trong hàng đợi/bộ đệm (output buffer) tại cổng đầu ra trước khi đến lượt được truyền đi.
3. **Trễ truyền phát ($d_{\text{trans}}$ — Transmission Delay)**: Thời gian cần thiết để bộ chuyển mạch/router đẩy toàn bộ các bit của gói tin lên đường truyền vật lý.
4. **Trễ lan truyền ($d_{\text{prop}}$ — Propagation Delay)**: Thời gian để một bit tín hiệu vật lý (sóng điện từ, xung quang học) di chuyển qua môi trường vật lý (cáp đồng, cáp quang, không gian vô tuyến) từ nút phát đến nút thu.
</details>

---

### Câu Hỏi 4: Trong 4 thành phần trễ tại nút mạng, thành phần nào có mức độ biến thiên mạnh nhất và vì sao?

<details>
<summary>Đáp án</summary>

Thành phần biến thiên mạnh nhất (dynamic delay) là **Trễ hàng đợi ($d_{\text{queue}}$ — Queuing Delay)**:

- **Khi đường truyền rảnh rỗi**: Không có gói tin nào xếp hàng chờ phía trước trong bộ đệm cổng ra, khi đó $d_{\text{queue}} = 0$.
- **Khi mạng bị nghẽn**: Hàng loạt gói tin đến dồn dập khiến hàng đợi tích tụ dài hơn, làm thời gian chờ $d_{\text{queue}}$ tăng vọt lên hàng chục hoặc hàng trăm mili-giây.
</details>

---

### Câu Hỏi 5: Làm thế nào để phân biệt Trễ truyền phát ($d_{\text{trans}}$) và Trễ lan truyền ($d_{\text{prop}}$) về công thức, yếu tố phụ thuộc và cách tối ưu?

<details>
<summary>Đáp án</summary>

Hai thành phần trễ này hoàn toàn khác nhau về bản chất vật lý:

| Tiêu chí | Trễ truyền phát ($d_{\text{trans}}$) | Trễ lan truyền ($d_{\text{prop}}$) |
| :--- | :--- | :--- |
| **Bản chất** | Thời gian đẩy toàn bộ gói tin lên đường truyền. | Thời gian một bit tín hiệu di chuyển dọc theo môi trường vật lý từ nút phát sang nút thu. |
| **Công thức** | $d_{\text{trans}} = \frac{L}{R}$ (với $L$ là chiều dài gói tin tính bằng bits, $R$ là băng thông đường truyền tính bằng bps). | $d_{\text{prop}} = \frac{d}{s}$ (với $d$ là khoảng cách vật lý tính bằng mét, $s$ là vận tốc lan truyền sóng tính bằng m/s; trong cáp đồng/cáp quang $s \approx 2 \times 10^8 \text{ m/s}$). |
| **Phụ thuộc vào** | Kích thước gói tin $L$ và băng thông $R$. | Khoảng cách địa lý $d$ và vận tốc truyền sóng $s$ của môi trường vật lý. |
| **Độc lập với** | Hoàn toàn không phụ thuộc vào khoảng cách $d$. | Hoàn toàn không phụ thuộc vào kích thước gói tin $L$ hay băng thông $R$. |
| **Cách tối ưu hóa** | Nâng cấp băng thông cổng mạng (ví dụ từ 1 Gbps lên 10 Gbps). | Rút ngắn khoảng cách vật lý (đặt máy chủ gần người dùng, dùng CDN/Edge). |
</details>

---

### Câu Hỏi 6: Trên đường truyền cáp quang dài 1000 km với băng thông $R = 1 \text{ Gbps}$, gói tin $L = 1500 \text{ bytes}$ ($12000 \text{ bits}$) và vận tốc ánh sáng trong cáp $s = 2 \times 10^8 \text{ m/s}$, thành phần nào giữa $d_{\text{trans}}$ và $d_{\text{prop}}$ chiếm ưu thế áp đảo?

<details>
<summary>Đáp án</summary>

**Trễ lan truyền ($d_{\text{prop}}$) chiếm ưu thế áp đảo** trên liên kết mạng diện rộng (WAN) này:

- **Trễ truyền phát ($d_{\text{trans}}$)**:
  $$d_{\text{trans}} = \frac{L}{R} = \frac{12000 \text{ bits}}{10^9 \text{ bps}} = 12 \ \mu\text{s} = 0.012 \text{ ms}$$
- **Trễ lan truyền ($d_{\text{prop}}$)**:
  $$d_{\text{prop}} = \frac{d}{s} = \frac{10^6 \text{ m}}{2 \times 10^8 \text{ m/s}} = 0.005 \text{ s} = 5 \text{ ms}$$

**Kết luận**: $d_{\text{prop}}$ ($5 \text{ ms}$) lớn gấp khoảng $416.7$ lần so với $d_{\text{trans}}$ ($0.012 \text{ ms}$). Do đó, ngay cả khi nâng cấp băng thông từ 1 Gbps lên 10 Gbps (chỉ giúp giảm $d_{\text{trans}}$ từ $12 \ \mu\text{s}$ xuống $1.2 \ \mu\text{s}$), tổng độ trễ vẫn xấp xỉ $5 \text{ ms}$ vì bị giới hạn bởi khoảng cách địa lý và vận tốc ánh sáng.
</details>

---

### Câu Hỏi 7: Cơ chế mất gói (Packet Loss) do tràn bộ đệm (Buffer Overflow) tại Router xảy ra như thế nào và gây ra hệ quả gì?

<details>
<summary>Đáp án</summary>

Theo Kurose & Ross (Mục 1.4.2) và tiêu chuẩn RFC 1812 (Section 5.3.6):

- **Nguyên nhân xảy ra**:
  - Bộ đệm hàng đợi (queue/buffer) của router có dung lượng lưu trữ hữu hạn (finite capacity).
  - Khi lưu lượng gói tin đến cổng mạng vượt quá tốc độ phát của đường truyền ra trong một khoảng thời gian, hàng đợi sẽ tích lũy và bị lấp đầy.
  - Khi hàng đợi đã đầy hoàn toàn, gói tin mới đến không còn ô nhớ trống trong bộ đệm. Hiện tượng **tràn bộ đệm (Buffer Overflow)** xảy ra và router buộc phải hủy bỏ (drop) gói tin đó, tạo ra **mất gói (Packet Loss)**.
- **Hệ quả**: Hiện tượng mất gói làm gián đoạn luồng dữ liệu, kích hoạt cơ chế phát hiện mất mát và truyền lại của các giao thức tầng trên (như TCP Retransmission), khiến băng thông khả dụng thực tế của kết nối bị suy giảm.
</details>

---

### Câu Hỏi 8: Khi chạy lệnh `ping -c 4 8.8.8.8` trên Linux, các thông số đầu ra `time=... ms`, `packet loss`, và `rtt min/avg/max/mdev` cho biết điều gì?

<details>
<summary>Đáp án</summary>

Lệnh `ping` gửi các gói tin `ICMP ECHO_REQUEST` để đo lường trạng thái kết nối:

1. **`time=... ms`**: Thời gian trễ khứ hồi (Round-Trip Time — RTT) cho từng gói tin, bao gồm tổng trễ nút mạng theo cả chiều đi và chiều về ($d_{\text{nodal\_forward}} + d_{\text{nodal\_return}}$).
2. **`packet loss` (ví dụ `0% packet loss`)**: Tỷ lệ phần trăm gói tin bị mất dọc đường. Nếu giá trị này lớn hơn 0%, điều đó biểu thị một hoặc nhiều router trên tuyến truyền đã bị đầy hàng đợi (Buffer Overflow) và loại bỏ gói tin (hoặc có lỗi đường truyền).
3. **`rtt min/avg/max/mdev`**:
   - `min`: Thời gian RTT ngắn nhất, ghi nhận khi hàng đợi trên các router gần như bằng 0 ($d_{\text{queue}} \approx 0$).
   - `avg`: Thời gian RTT trung bình của các gói thử nghiệm.
   - `max`: Thời gian RTT lớn nhất, phản ánh thời điểm các router trung gian đang có hàng đợi cần xả ($d_{\text{queue}} > 0$).
   - `mdev` (mean deviation): Độ lệch chuẩn dân số, đại diện cho mức độ biến thiên trễ (Jitter) của hàng đợi mạng; giá trị `mdev` càng cao chứng tỏ hàng đợi mạng biến động càng bất ổn.
</details>

---

### Câu Hỏi 9: Lệnh `ethtool <interface>` trên Linux giúp kiểm tra những thông số phần cứng quan trọng nào và thông số nào liên quan trực tiếp đến công thức tính $d_{\text{trans}}$?

<details>
<summary>Đáp án</summary>

Lệnh `ethtool <interface>` (ví dụ `ethtool eth0`) hiển thị thông số phần cứng và cấu hình liên kết của card mạng, trong đó có 3 trường chính được phân tích trong bài học:

- **`Speed`** (ví dụ `1000Mb/s`): Tốc độ truyền dẫn thực tế của liên kết vật lý hiện tại. Đây chính là giá trị của biến **$R$** (tốc độ truyền dẫn / băng thông) trong công thức tính trễ truyền phát $d_{\text{trans}} = \frac{L}{R}$.
- **`Duplex`** (ví dụ `Full`): Chế độ song công toàn phần (Full Duplex), cho phép card mạng truyền và nhận bit đồng thời trên hai kênh riêng biệt mà không gây xung đột tín hiệu.
- **`Auto-negotiation`** (ví dụ `on`): Trạng thái tự động thương lượng giữa card mạng và Switch đầu đối diện để chọn tốc độ truyền dẫn cao nhất mà cả hai bên cùng hỗ trợ.
</details>

---

### Câu Hỏi 10: "Cạm bẫy băng thông cao tương đương độ trễ thấp" (The Bandwidth vs. Latency Fallacy) là gì và giải pháp đúng đắn cho ứng dụng phân tán đa vùng là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất của cạm bẫy**: Nhiều tổ chức lầm tưởng rằng khi ứng dụng gọi API xuyên vùng địa lý (Multi-Region Cloud) bị chậm, chỉ cần bỏ tiền nâng cấp băng thông đường truyền (ví dụ từ 1 Gbps lên 10 Gbps) sẽ giảm được độ trễ phản hồi. Thực tế, nâng cấp băng thông chỉ làm giảm trễ truyền phát ($d_{\text{trans}}$ — vốn chỉ chiếm vài micro-giây), trong khi độ trễ qua khoảng cách hàng nghìn km (ví dụ 10,000 km giữa Tokyo và US-East mất tối thiểu ~50–70 ms) bị chi phối hoàn toàn bởi **trễ lan truyền ($d_{\text{prop}}$)**.
- **Giải pháp kiến trúc đúng đắn**: Vì không thể vượt qua giới hạn vật lý của vận tốc ánh sáng bằng cách mua thêm băng thông, cần đưa dữ liệu và dịch vụ đến gần người dùng nhất thông qua **CDN**, **Edge Caching**, hoặc triển khai ứng dụng **đa vùng (Multi-Region Active-Active)**.
</details>

---

### Câu Hỏi 11: Hiện tượng Bufferbloat là gì và tại sao việc cấu hình bộ đệm (buffer) quá lớn lại gây hại cho các ứng dụng thời gian thực?

<details>
<summary>Đáp án</summary>

- **Bản chất**: **Bufferbloat** (bộ đệm phình to) là hiện tượng thiết bị mạng được cấu hình bộ đệm hàng đợi quá lớn với mục tiêu tránh mất gói tin ($0\%$ packet loss).
- **Hậu quả**:
  - Khi mạng bị nghẽn, hàng nghìn gói tin bị "ngâm" chờ trong bộ đệm hàng trăm mili-giây thay vì bị loại bỏ (drop) sớm.
  - Kết nối tuy không mất gói nhưng độ trễ hàng đợi ($d_{\text{queue}}$) tăng vọt lên hàng nghìn mili-giây.
  - Giao thức TCP không nhận biết được sớm tình trạng nghẽn để giảm tốc độ truyền, làm tê liệt các ứng dụng nhạy cảm với độ trễ như **VoIP**, **video call**, hoặc **interactive SSH session**.
</details>

---

### Câu Hỏi 12: Khi phát hiện `packet loss` qua `ping`, làm thế nào dùng lệnh `ethtool -S <interface>` để phân biệt mất gói do lỗi cáp vật lý với mất gói do tràn hàng đợi (Buffer Overflow)?

<details>
<summary>Đáp án</summary>

Dựa vào các bộ đếm thống kê của card mạng trong lệnh `ethtool -S <interface>`:

- **Mất gói do suy hao cáp hoặc nhiễu vật lý**: Khung tin bị hỏng bit trên đường truyền, dẫn đến việc card mạng ghi nhận tăng giá trị ở các bộ đếm **`rx_crc_errors`** hoặc **`rx_frame_errors`**.
- **Mất gói do quá tải/tràn hàng đợi (Buffer Overflow)**: Các bộ đếm **`rx_discards`** hoặc **`rx_missed_errors` / `dropped`** tăng lên trong khi các bộ đếm lỗi CRC hoàn toàn bằng 0. Điều này xác nhận card mạng hoặc router đã chủ động vứt bỏ gói tin vì hết ô nhớ trống trong bộ đệm.
</details>
