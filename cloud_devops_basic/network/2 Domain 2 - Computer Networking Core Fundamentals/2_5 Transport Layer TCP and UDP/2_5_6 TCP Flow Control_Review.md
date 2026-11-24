# Review: 2_5_6 TCP Flow Control

### Câu Hỏi 1: TCP Flow Control ra đời để giải quyết bài toán cốt lõi nào?

<details>
<summary>Đáp án</summary>

TCP Flow Control giải quyết sự bất đối xứng về năng lực xử lý giữa bên gửi (Sender) và bên nhận (Receiver). Nếu bên gửi có CPU và đường truyền nhanh bơm dữ liệu quá ồ ạt trong khi bên nhận đang chịu tải nặng hoặc có bộ nhớ đệm giới hạn, bộ đệm nhận (`RCV.BUFF`) sẽ bị tràn (buffer overflow), dẫn đến đánh rơi gói tin hàng loạt, lãng phí băng thông và sụp đổ hiệu năng. Flow Control giúp điều tiết tốc độ phát dữ liệu của bên gửi phù hợp với khả năng tiếp nhận thực tế của bên nhận.
</details>

### Câu Hỏi 2: Flow Control (Điều khiển Luồng) khác với Congestion Control (Điều khiển Tắc nghẽn) ở những điểm chính nào?

<details>
<summary>Đáp án</summary>

- **Phạm vi bảo vệ**: Flow Control hoạt động **đầu cuối - đầu cuối (End-to-End)** giữa Sender và Receiver; Congestion Control bảo vệ **toàn mạng truyền dẫn (Network-Wide)** giữa Sender và các thiết bị trung gian (Routers, Switches, Links).
- **Mục tiêu**: Flow Control bảo vệ bộ đệm nhận **`RCV.BUFF`** của bên nhận khỏi tràn; Congestion Control ngăn chặn việc bơm quá nhiều dữ liệu gây nghẽn hàng đợi tại các router trên đường đi.
- **Tín hiệu điều khiển**: Flow Control dùng cửa sổ nhận **`rwnd` (Receive Window)** do bên nhận tính toán và gửi công khai trong trường Window của TCP Header; Congestion Control dùng cửa sổ tắc nghẽn **`cwnd` (Congestion Window)** do bên gửi tự ước lượng nội bộ dựa trên tình trạng mạng (mất gói, RTT, ECN).
- **Ràng buộc tốc độ**: Tốc độ truyền của bên gửi không được vượt quá `rwnd`, và khi kết hợp cả hai cơ chế sẽ bị giới hạn bởi $\min(\text{cwnd}, \text{rwnd})$.
</details>

### Câu Hỏi 3: Trong cơ chế Sliding Window, giá trị `rwnd` trong TCP Header mang ý nghĩa gì và luồng byte tại bên gửi được chia thành 4 vùng logic nào?

<details>
<summary>Đáp án</summary>

Theo RFC 9293, trường **Window** (16 bits) trong TCP Header cho biết số lượng byte dữ liệu (tính từ số thứ tự trong trường `ACK`) mà bên nhận sẵn sàng tiếp nhận, phản ánh trực tiếp dung lượng còn trống của bộ đệm nhận `RCV.BUFF`.

Luồng byte tại bên gửi được chia thành 4 vùng logic:
1. **Vùng 1 - Đã gửi và đã nhận ACK**: Nằm trước `SND.UNA`, đã được giải phóng khỏi bộ đệm gửi.
2. **Vùng 2 - Đã gửi nhưng chưa nhận ACK (Data In-Flight)**: Từ `SND.UNA` đến trước `SND.NXT`.
3. **Vùng 3 - Usable Window (Được phép gửi ngay nhưng chưa gửi)**: Từ `SND.NXT` đến trước `SND.UNA + SND.WND`.
4. **Vùng 4 - Ngoài cửa sổ (Not Usable)**: Từ `SND.UNA + SND.WND` trở đi, bên gửi bị cấm phát các byte thuộc vùng này cho đến khi cửa sổ trượt sang phải.
</details>

### Câu Hỏi 4: Công thức tính Cửa sổ Khả dụng (Usable Window - $U$) là gì và hãy áp dụng tính với `SND.UNA = 10,000`, `SND.NXT = 14,000`, `SND.WND = 8,000`?

<details>
<summary>Đáp án</summary>

Theo RFC 9293 Section 3.8.6.2.1, công thức tính Cửa sổ Khả dụng là:
$$U = \text{SND.UNA} + \text{SND.WND} - \text{SND.NXT}$$

Áp dụng với các thông số đã cho:
$$U = 10,000 + 8,000 - 14,000 = 4,000\text{ bytes}$$

Bên gửi được phép phát ngay lập tức tối đa **4,000 bytes** dữ liệu mới, và không được truyền bất kỳ byte nào có số thứ tự $\ge \text{SND.UNA} + \text{SND.WND} = 18,000$. Khi $U = 0$, bên gửi phải dừng truyền dữ liệu mới.
</details>

### Câu Hỏi 5: Vì sao giới hạn 16-bit của trường Window trong TCP Header lại gây nghẽn cổ chai trên các đường truyền có BDP (Bandwidth-Delay Product) cao?

<details>
<summary>Đáp án</summary>

Vì trường Window chỉ rộng 16 bits, kích thước cửa sổ tối đa khi chưa mở rộng (unscaled) là $2^{16} - 1 = 65,535\text{ bytes}$ ($\approx 64\text{ KiB}$).

Trong khi đó, lượng dữ liệu cần thiết để lấp đầy đường truyền là $\text{BDP} = \text{Bandwidth} \times \text{RTT}$. Ví dụ với đường truyền $1\text{ Gbps}$ và $\text{RTT} = 100\text{ ms}$, BDP lên tới $12,500,000\text{ bytes}$ ($\approx 12.5\text{ MB}$). Nếu cửa sổ bị giới hạn ở $65,535\text{ bytes}$, bên gửi chỉ phát được khoảng 65 KB rồi phải dừng chờ ACK suốt 100 ms, khiến thông lượng tối đa chỉ đạt khoảng $5.24\text{ Mbps}$ — lãng phí hơn 99% băng thông đường truyền.
</details>

### Câu Hỏi 6: Tùy chọn TCP Window Scale Option (RFC 7323) hoạt động như thế nào, hệ số dịch bit $S$ tối đa là bao nhiêu và tại sao lại có giới hạn này?

<details>
<summary>Đáp án</summary>

- **Cách hoạt động**: Hai bên thương lượng hệ số dịch chuyển bit (Shift count / Scale factor $S$) duy nhất một lần trong pha bắt tay 3 bước (gói `SYN` và `SYN-ACK`). Giá trị cửa sổ thực tế khi truyền được tính bằng:
  $$\text{Effective Window} = \text{Window Header Value} \times 2^S$$
- **Giới hạn tối đa**: Theo RFC 7323 Section 2.3, hệ số $S$ bị giới hạn tối đa là **$S \le 14$**. Với $S = 14$, kích thước cửa sổ tối đa đạt tới $65,535 \times 2^{14} = 1,073,725,440\text{ bytes}$ ($\approx 1\text{ GiB}$).
- **Lý do giới hạn**: Để đảm bảo kích thước cửa sổ tối đa luôn nhỏ hơn $2^{30}$ bytes, giúp ngăn ngừa hiện tượng xoay vòng và nhầm lẫn số thứ tự trong không gian 32-bit ($2^{32}$) của TCP Sequence Number (bảo vệ cơ chế PAWS - Protection Against Wrapped Sequence Numbers).
</details>

### Câu Hỏi 7: Khi bên nhận thông báo `rwnd = 0` (Zero Window), tại sao việc mất gói Window Update ACK có thể gây ra Deadlock?

<details>
<summary>Đáp án</summary>

Khi bộ đệm nhận `RCV.BUFF` đầy 100%, bên nhận gửi gói ACK với `Window = 0`, buộc bên gửi ngừng phát dữ liệu mới. Sau khi ứng dụng bên nhận đọc bớt dữ liệu và giải phóng bộ đệm, bên nhận sẽ gửi một gói **Window Update ACK** (`Window > 0`) để báo tiếp tục truyền.

Tuy nhiên, các gói ACK thuần túy (không mang dữ liệu và không có cờ `SYN`/`FIN`) **không tiêu thụ Sequence Number và không bao giờ được truyền lại (retransmitted)** nếu bị thất lạc trên mạng. Nếu gói Window Update ACK này bị rơi, bên gửi sẽ tiếp tục chờ mở cửa sổ mãi mãi còn bên nhận lại chờ dữ liệu mới, khiến kết nối rơi vào trạng thái bế tắc vô thời hạn (**Deadlock**).
</details>

### Câu Hỏi 8: Cơ chế Zero-Window Probing (ZWP) phá vỡ trạng thái Deadlock bằng cách nào?

<details>
<summary>Đáp án</summary>

Theo RFC 9293 Section 3.8.6.1, ngay khi nhận được thông báo `rwnd = 0`, bên gửi kích hoạt **Bộ đếm Kiên trì (Persistence Timer)**:
- Khi timer hết hạn (lần đầu thường sau khoảng thời gian bằng **RTO**), bên gửi bắt buộc phát một gói **Zero-Window Probe (ZWP)** mang ít nhất 1 octet dữ liệu mới (nếu có) hoặc gửi lại 1 octet dữ liệu cũ.
- Bên nhận khi nhận được ZWP bắt buộc phải phản hồi một gói ACK kèm giá trị `rwnd` mới nhất, giúp cập nhật lại trạng thái mở cửa sổ một cách tin cậy.
- Khoảng thời gian giữa các lần gửi ZWP liên tiếp phải tăng theo cấp số nhân (**exponential backoff**) để tránh làm quá tải mạng.
</details>

### Câu Hỏi 9: Hội chứng Cửa sổ Ngớ ngẩn (Silly Window Syndrome - SWS) là gì và gây tác hại gì cho mạng?

<details>
<summary>Đáp án</summary>

**Silly Window Syndrome (SWS)** là trạng thái dữ liệu được trao đổi qua lại dưới dạng các phân đoạn cực kỳ nhỏ giọt (chỉ một vài byte mỗi lần), gây sụp đổ thông lượng mạng (throughput collapse).

Nguyên nhân là chi phí tiêu đề quá lớn (Header Overhead): một gói tin IPv4 mang 1 byte dữ liệu vẫn cần tối thiểu 20 byte IP Header + 20 byte TCP Header = 40 byte tiêu đề. Khi đó hiệu suất truyền dữ liệu chỉ đạt $\frac{1}{41} \approx 2.4\%$, lãng phí hơn $97.6\%$ băng thông cho dữ liệu tiêu đề.
</details>

### Câu Hỏi 10: Thuật toán Clark (phía bên nhận) và Thuật toán Nagle (phía bên gửi) giải quyết Silly Window Syndrome như thế nào?

<details>
<summary>Đáp án</summary>

- **Thuật toán Clark (Receiver SWS)**: Bên nhận giữ cố định mép phải của cửa sổ (`RCV.NXT + RCV.WND`) và tiếp tục quảng bá `rwnd = 0`, từ chối mở cửa sổ lắt nhắt cho đến khi không gian bộ đệm trống đạt tối thiểu:
  $$\min\left(\frac{1}{2} \times \text{RCV.BUFF},\, \text{Eff.snd.MSS}\right)$$
  (tức trống tối thiểu nửa bộ đệm nhận hoặc đủ chứa trọn 1 phân đoạn cực đại `MSS`).
- **Thuật toán Nagle (Sender SWS)**:
  - Nếu bên gửi có đủ dữ liệu lấp đầy 1 `Eff.snd.MSS`, gửi ngay lập tức.
  - Nếu dữ liệu chưa đủ 1 MSS và **không còn dữ liệu đang bay chưa được ACK** ($\text{SND.NXT} = \text{SND.UNA}$), được phép gửi ngay phân đoạn nhỏ đó.
  - Nếu dữ liệu chưa đủ 1 MSS và **vẫn còn dữ liệu đang bay chưa được ACK** ($\text{SND.NXT} > \text{SND.UNA}$), TCP stack giữ dữ liệu mới trong bộ đệm cho đến khi nhận được ACK cho dữ liệu cũ hoặc gom đủ 1 MSS.
</details>

### Câu Hỏi 11: Khi chạy lệnh `ss -t -i` trên Linux, các thông số `wscale`, `rcv_wnd`, `snd_wnd`, và `rcv_space` cho biết điều gì?

<details>
<summary>Đáp án</summary>

- **`wscale:<snd>,<rcv>`** (ví dụ `wscale:7,7`): Hệ số dịch bit Window Scale thỏa thuận trong bắt tay 3 bước cho chiều gửi và chiều nhận (với 7 thì hệ số nhân là $2^7 = 128$).
- **`rcv_wnd`**: Kích thước cửa sổ nhận hiện tại mà máy chủ địa phương đang quảng bá cho đối phương (`rwnd`).
- **`snd_wnd`**: Kích thước cửa sổ gửi hiện tại được đối phương cấp phép (đã nhân với hệ số `snd_wscale`), giới hạn lượng dữ liệu chưa được ACK tối đa trên đường truyền.
- **`rcv_space`**: Biến trợ giúp nội bộ của nhân Linux dùng để theo dõi không gian đệm tiếp nhận và phục vụ cơ chế tự động điều chỉnh kích thước bộ đệm socket (auto-tuning).
</details>

### Câu Hỏi 12: Các tham số `sysctl` trên Linux gồm `net.ipv4.tcp_rmem`, `net.core.rmem_max`, và `net.ipv4.tcp_window_scaling` có vai trò gì?

<details>
<summary>Đáp án</summary>

- **`net.ipv4.tcp_rmem`**: Vector 3 số nguyên `[min, default, max]` quy định dung lượng bộ đệm nhận tự động điều chỉnh cho mỗi socket TCP:
  - `min` (mặc định `4096` bytes): Mức tối thiểu ngay cả khi hệ thống thiếu bộ nhớ.
  - `default` (mặc định `131072` bytes / 128 KiB): Dung lượng cấp phát ban đầu khi khởi tạo socket.
  - `max`: Mức tối đa mà cơ chế auto-tuning của Linux được phép mở rộng cho một socket nhận.
- **`net.core.rmem_max`**: Giới hạn trần tuyệt đối cho các lời gọi thiết lập bộ đệm thủ công từ ứng dụng qua `setsockopt(..., SO_RCVBUF, ...)`.
- **`net.ipv4.tcp_window_scaling`**: Bật (`1`, mặc định) hoặc tắt (`0`) tùy chọn TCP Window Scaling theo RFC 7323. Nếu đặt về `0`, cửa sổ nhận sẽ bị khóa cứng tối đa ở mức 65,535 bytes.
</details>

### Câu Hỏi 13: Tại sao sự tương tác giữa Nagle's Algorithm và Delayed ACK lại gây ra hiện tượng trễ 40ms – 200ms, và giải pháp trong thực tế là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Khi ứng dụng gửi một request gồm 2 phần nhỏ (ví dụ gọi 2 lần `write()` liên tiếp):
  1. Phần 1 bay sang server; server kích hoạt **Delayed ACK** (trì hoãn gửi ACK từ **40ms đến 200ms** để chờ ghép cùng dữ liệu phản hồi hoặc phân đoạn tiếp theo).
  2. Phần 2 ở client bị **Nagle's Algorithm** giữ lại trong bộ đệm vì đang chờ ACK của phần 1.
  3. Kết quả là cả hai bên đứng chờ nhau suốt 40ms – 200ms, làm tăng đột biến độ trễ API.
- **Giải pháp**: Với các dịch vụ đòi hỏi độ trễ thấp (gRPC, Microservices, Reverse Proxy, Game Server, Message Brokers), bật tùy chọn socket **`TCP_NODELAY`** để vô hiệu hóa thuật toán Nagle.
</details>

### Câu Hỏi 14: Vì sao không nên gán cứng `SO_RCVBUF` / `SO_SNDBUF` trong mã nguồn ứng dụng, và tường lửa (Firewall) cần lưu ý gì đối với Zero-Window Probe?

<details>
<summary>Đáp án</summary>

- **Gán cứng `SO_RCVBUF` / `SO_SNDBUF`**: Khi ứng dụng gọi `setsockopt` để gán cứng kích thước bộ đệm, nhân Linux sẽ **vô hiệu hóa hoàn toàn cơ chế tự động điều chỉnh bộ đệm động (Dynamic Buffer Auto-Tuning / `rcv_space`)** cho socket đó. Trên mạng có BDP cao, bộ đệm bị đóng băng (ví dụ 64 KB) sẽ bóp nghẹt thông lượng nghiêm trọng. Thay vào đó, nên để Linux tự điều chỉnh qua `net.ipv4.tcp_rmem` và nâng `net.core.rmem_max` khi cần.
- **Tường lửa và Zero-Window Probe (ZWP)**: Gói ZWP chỉ mang 1 byte hoặc dùng lại số thứ tự cũ nên một số Firewall/Load Balancer cấu hình quá chặt có thể coi là gói bất thường và âm thầm drop. Nếu gói Window Update trước đó bị mất mà ZWP lại bị Firewall drop, kết nối sẽ bị treo cứng (hang) cho đến khi timeout; do đó cần đảm bảo Firewall/NSG không chặn các gói TCP probe hợp lệ.
</details>
