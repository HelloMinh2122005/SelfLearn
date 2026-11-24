# Review: 2_5_4 TCP Three-Way Handshake

### Câu Hỏi 1: Quá trình TCP Three-Way Handshake giải quyết 4 bài toán cốt lõi nào trước khi truyền dữ liệu ứng dụng?

<details>
<summary>Đáp án</summary>

Theo chuẩn **RFC 9293 Section 3.5**, Three-Way Handshake giải quyết 4 bài toán sống còn sau:
1. **Đồng bộ hóa Initial Sequence Number (ISN)**: Vì TCP là kênh truyền song công toàn phần (**Full-Duplex**), mỗi bên (Client và Server) cần chọn một số thứ tự khởi tạo ngẫu nhiên ($x$ và $y$) cho luồng dữ liệu của riêng mình và nhận được xác nhận tường minh từ phía bên kia.
2. **Ngăn chặn kết nối nhầm lẫn do gói tin cũ bị trễ (Delayed Duplicate Segments)**: Đảm bảo nếu Server nhận được một gói `SYN` cũ bị kẹt từ quá khứ, Client sẽ phát hiện sai lệch số Sequence và gửi cờ `RST` để hủy, tránh việc Server mở nhầm kết nối rác.
3. **Đàm phán các tham số mở rộng (TCP Options Negotiation)**: Đây là thời điểm duy nhất trong vòng đời kết nối để hai bên thỏa thuận các tham số như **MSS**, **Window Scale** và **SACK Permitted**.
4. **Cấp phát tài nguyên có kiểm soát**: Hai bên chuẩn bị sẵn khối điều khiển kết nối **TCB (Transmission Control Block)**, bộ đệm gửi/nhận (send/receive buffers) và các biến trạng thái mạng.
</details>

### Câu Hỏi 2: Hãy mô tả chi tiết 3 bước trao đổi gói tin trong quy trình Three-Way Handshake chuẩn (cờ điều khiển, giá trị Sequence/Acknowledgment Number và sự chuyển đổi trạng thái của Client và Server)?

<details>
<summary>Đáp án</summary>

Ban đầu, Client ở trạng thái `CLOSED` (Active Open) và Server ở trạng thái `LISTEN` (Passive Open):
1. **Bước 1 (Client $\rightarrow$ Server)**:
   - Client gửi phân đoạn `<SEQ=x><CTL=SYN>` (chỉ bật cờ `SYN = 1`, payload = 0), trong đó $x$ là ISN ngẫu nhiên của Client.
   - Client chuyển từ `CLOSED` sang **`SYN-SENT`**.
2. **Bước 2 (Server $\rightarrow$ Client)**:
   - Server nhận được `SYN`, cấp phát tài nguyên TCB và chuyển từ `LISTEN` sang **`SYN-RECEIVED`**.
   - Server phản hồi phân đoạn `<SEQ=y><ACK=x+1><CTL=SYN,ACK>` (bật cả `SYN = 1` và `ACK = 1`), trong đó $y$ là ISN ngẫu nhiên của Server và `ACK = x + 1` xác nhận đã nhận `SYN` của Client.
3. **Bước 3 (Client $\rightarrow$ Server)**:
   - Client nhận `SYN-ACK`, chuyển từ `SYN-SENT` sang **`ESTABLISHED`**.
   - Client gửi phân đoạn `<SEQ=x+1><ACK=y+1><CTL=ACK>` (chỉ bật `ACK = 1`) để xác nhận đã nhận `SYN` của Server.
   - Server nhận được `ACK` này và chuyển từ `SYN-RECEIVED` sang **`ESTABLISHED`**, hoàn tất kênh truyền Full-Duplex hai chiều.
</details>

### Câu Hỏi 3: Tại sao giao thức TCP bắt buộc phải dùng Bắt tay 3 bước (Three-Way Handshake) mà không thể chỉ dùng Bắt tay 2 bước (Two-Way Handshake)?

<details>
<summary>Đáp án</summary>

Nếu chỉ dùng bắt tay 2 bước (Client gửi `SYN`, Server trả `SYN-ACK` rồi vào ngay `ESTABLISHED`), kết nối sẽ gặp hai rủi ro nghiêm trọng:
1. **Mất gói tin lượt 2 (`SYN-ACK`)**: Nếu `SYN-ACK` bị thất lạc trên đường truyền, Client không nhận được nên không gửi dữ liệu, nhưng Server lại tưởng kết nối đã thiết lập và tiếp tục giữ tài nguyên chờ đợi vô ích.
2. **Gói `SYN` cũ bị trễ (Delayed Duplicate SYN)**: Nếu một gói `SYN` từ phiên cũ bị kẹt trên mạng bất ngờ bay đến Server, Server dùng cơ chế 2 bước sẽ lập tức cấp phát TCB và chuyển sang `ESTABLISHED` để chờ dữ liệu dù Client hiện tại không hề muốn kết nối (gây ra kết nối rác/treo tài nguyên).

Với **3 bước**, khi Server phản hồi `SYN-ACK` cho một gói `SYN` cũ, Client sẽ nhận thấy số Sequence không khớp với phiên làm việc nào hiện tại và lập tức gửi lại cờ **`RST`** để Server hủy bỏ kết nối ngay lập tức. Đồng thời, bước 3 cũng giúp Server xác nhận chắc chắn chiều truyền từ Server về Client hoạt động thông suốt.
</details>

### Câu Hỏi 4: Theo quy tắc tiêu thụ không gian Sequence Number (RFC 9293), phân đoạn `SYN` và phân đoạn `ACK` thuần túy tiêu thụ bao nhiêu đơn vị Sequence Number? Vì sao?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.5**:
- **Cờ `SYN` tiêu thụ đúng 1 đơn vị Sequence Number**: Dù gói `SYN` không chứa dữ liệu ứng dụng (payload = 0), nó mang ý nghĩa thiết lập kết nối cần được xác nhận tin cậy. Việc tiêu tốn 1 vị trí (vị trí $x$) giúp phía bên kia có căn cứ định danh tường minh bằng cách trả về `ACK = x + 1`.
- **Gói `ACK` thuần túy tiêu thụ 0 đơn vị Sequence Number**: Phân đoạn chỉ mang cờ `ACK` (không có `SYN`/`FIN` và không có dữ liệu) không chiếm không gian Sequence Number, vì bản thân nó không cần gói `ACK` khác xác nhận lại. Do đó, gói dữ liệu đầu tiên mà Client gửi sau bước 3 vẫn giữ nguyên số thứ tự bắt đầu là $x + 1$.
</details>

### Câu Hỏi 5: Liệt kê 5 trạng thái trong máy trạng thái hữu hạn (FSM) tham gia vào quá trình thiết lập kết nối TCP chuẩn và ý nghĩa của từng trạng thái?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.3.2 & 3.5**, 5 trạng thái gồm:
1. **`CLOSED`**: Trạng thái ảo biểu thị socket chưa tồn tại hoặc kết nối đã đóng hoàn toàn, chưa cấp phát tài nguyên TCB (cả Client và Server).
2. **`LISTEN`**: Trạng thái Server (Passive Open) đang lắng nghe và chờ yêu cầu kết nối từ bất kỳ TCP peer và port từ xa nào.
3. **`SYN-SENT`**: Trạng thái Client (Active Open) sau khi đã gửi phân đoạn `SYN` và đang chờ phân đoạn `SYN-ACK` hồi đáp tương ứng.
4. **`SYN-RECEIVED`**: Trạng thái Server sau khi đã nhận được `SYN` của đối phương, gửi lại `SYN-ACK` và đang chờ phân đoạn `ACK` xác nhận cuối cùng.
5. **`ESTABLISHED`**: Trạng thái kết nối đã mở hoàn toàn; cả Client và Server đều sẵn sàng truyền tải luồng byte dữ liệu hai chiều.
</details>

### Câu Hỏi 6: Cơ chế Mở đồng thời (TCP Simultaneous Open) xảy ra trong tình huống nào và lộ trình chuyển dịch trạng thái FSM của hai bên diễn ra ra sao?

<details>
<summary>Đáp án</summary>

- **Tình huống xảy ra**: Thường gặp trong các kiến trúc ngang hàng (Peer-to-Peer) hoặc giao thức đặc biệt khi cả hai máy chủ cùng lúc chủ động gửi gói tin `SYN` tới nhau trên cùng một cặp IP và Port tại cùng một thời điểm.
- **Lộ trình chuyển dịch trạng thái FSM (RFC 9293 Section 3.5 Figure 7)**: Cả hai bên diễn ra đối xứng theo đúng chu trình:
  **`CLOSED` $\rightarrow$ `SYN-SENT` $\rightarrow$ `SYN-RECEIVED` $\rightarrow$ `ESTABLISHED`**
  - Cụ thể: Cả hai từ `CLOSED` gửi `SYN` và sang `SYN-SENT`. Khi nhận được gói `SYN` thuần từ đối phương lúc đang ở `SYN-SENT`, cả hai hiểu đang mở đồng thời nên cùng chuyển sang `SYN-RECEIVED`, gửi lại `<CTL=SYN,ACK>` xác nhận ISN của bên kia (`ACK = y+1` và `ACK = x+1`), và khi nhận được xác nhận thì cùng chuyển sang `ESTABLISHED`.
</details>

### Câu Hỏi 7: Trong quá trình Three-Way Handshake, ba tùy chọn mở rộng (TCP Options) quan trọng nào thường được đàm phán? Tại sao chúng không được phép gửi trong các gói tin non-SYN?

<details>
<summary>Đáp án</summary>

Ba tùy chọn cốt lõi được đàm phán trong Handshake gồm:
1. **MSS (Maximum Segment Size - RFC 9293 Section 3.7.1)**: Báo hiệu kích thước dữ liệu lớn nhất mà bên gửi có thể tiếp nhận trong một phân đoạn (thường là $\text{MTU} - 40\text{ bytes}$).
2. **Window Scale (RFC 7323 Section 2)**: Thỏa thuận hệ số dịch bit ($2^S$) để mở rộng trường Window 16-bit lên tối đa 30-bit (tối đa 1 GB), phục vụ mạng băng thông lớn độ trễ cao (High BDP).
3. **SACK Permitted (RFC 2018 Section 2)**: Tùy chọn 2-byte xác nhận hai bên đồng ý dùng cơ chế xác nhận chọn lọc (Selective Acknowledgment) để báo chính xác các khối dữ liệu bị mất và truyền lại chọn lọc.

**Lý do cấm gửi trên các phân đoạn non-SYN**: Các tùy chọn này thiết lập các tham số cố định cho toàn bộ vòng đời kết nối (ví dụ: hệ số `Window Scale` chốt một lần cho mỗi chiều truyền). Theo RFC 7323 và RFC 2018, chúng bắt buộc chỉ được gửi trong `SYN` hoặc `SYN-ACK`; gửi trên các gói non-SYN sau khi đã vào `ESTABLISHED` là không hợp lệ và bị bỏ qua.
</details>

### Câu Hỏi 8: Bản chất kỹ thuật của cuộc tấn công SYN Flood là gì và tại sao nó khiến máy chủ bị từ chối dịch vụ (DoS)?

<details>
<summary>Đáp án</summary>

Trong bắt tay thông thường, mỗi khi nhận một gói `SYN`, hệ điều hành phải cấp phát vùng nhớ trong kernel để lưu **TCB (Transmission Control Block)**, đặt socket vào **SYN Backlog Queue** ở trạng thái `SYN-RECEIVED` và gửi `SYN-ACK` chờ `ACK`.

Kẻ tấn công thực hiện **SYN Flood** bằng cách gửi hàng loạt gói `SYN` sử dụng **địa chỉ IP nguồn giả mạo (Spoofed IP)**. Vì IP nguồn không có thật, gói `SYN-ACK` của Server gửi đi sẽ không bao giờ nhận được gói `ACK` bước 3 phản hồi. Các kết nối bán mở (Half-open connections) này bị kẹt tại trạng thái `SYN-RECEIVED` cho đến khi timeout, làm lấp đầy **SYN Backlog Queue** và cạn kiệt bộ nhớ kernel, khiến máy chủ không thể tiếp nhận các kết nối hợp lệ mới (DoS).
</details>

### Câu Hỏi 9: Cơ chế SYN Cookies (RFC 4987) hoạt động như thế nào để bảo vệ máy chủ trước tấn công SYN Flood mà không tiêu tốn RAM cho kết nối bán mở?

<details>
<summary>Đáp án</summary>

Theo **RFC 4987 Section 1 & 3.6**, khi hàng đợi SYN Backlog bị tràn (`tcp_syncookies = 1`), cơ chế **SYN Cookies** xử lý như sau:
1. **Không cấp phát trạng thái (Zero-State Allocation)**: Máy chủ hoàn toàn không cấp phát bộ nhớ TCB và không lưu giữ trạng thái socket ở `SYN-RECEIVED` khi nhận gói `SYN`.
2. **Mã hóa tham số vào số Sequence của `SYN-ACK`**: Máy chủ nén thông tin nhận diện kết nối (hàm băm mật mã của 4-tuple IP/Port, bộ đếm thời gian thô 3-bit chống phát lại, giá trị MSS được mã hóa) vào chính số **Sequence Number $y$** (gọi là SYN Cookie) của gói `SYN-ACK` gửi đi.
3. **Tái tạo trạng thái ở gói `ACK` bước 3**:
   - Nếu là gói `SYN` giả mạo IP, không có `ACK` trả về và máy chủ không mất một byte RAM nào.
   - Nếu là Client thật, Client gửi lại `ACK` mang giá trị `Ack = y + 1`. Máy chủ lấy `Ack - 1` để kiểm tra tính toàn vẹn của hàm băm và giải mã thông số. Nếu hợp lệ, lúc này máy chủ mới cấp phát khối TCB và đưa kết nối thẳng vào trạng thái `ESTABLISHED`.
</details>

### Câu Hỏi 10: Trên Linux, kỹ sư DevOps dùng lệnh `ss` và `tcpdump` như thế nào để kiểm tra trạng thái Handshake và nhận diện dấu hiệu tấn công SYN Flood?

<details>
<summary>Đáp án</summary>

- **Kiểm tra bằng lệnh `ss`**:
  - Liệt kê các kết nối đang ở trạng thái chờ `SYN-ACK` (phía Client): `ss -tan state syn-sent`
  - Liệt kê các kết nối bán mở đang chờ `ACK` (phía Server): `ss -tan state syn-recv`
  - Nếu `ss -tan state syn-recv | wc -l` tăng vọt chạm ngưỡng hàng đợi với nhiều IP lạ, đó là dấu hiệu của **SYN Flood** hoặc nghẽn mạng nghiêm trọng.
- **Bắt và đọc gói tin bằng `tcpdump`**:
  - Lọc các gói có bật cờ `SYN`: `sudo tcpdump -nn -i any "tcp[tcpflags] & (tcp-syn) != 0"`
  - Trong kết quả `tcpdump`: `Flags [S]` biểu thị gói `SYN`, `Flags [S.]` biểu thị gói `SYN-ACK` (`S` là SYN, `.` là ACK), và `Flags [.]` biểu thị gói `ACK` thuần túy.
</details>

### Câu Hỏi 11: Nêu tên, giá trị mặc định và ý nghĩa của 3 tham số Linux Kernel `sysctl` quan trọng điều khiển quy trình Three-Way Handshake được đề cập trong bài học?

<details>
<summary>Đáp án</summary>

Ba tham số cấu hình tại `/proc/sys/net/ipv4/` gồm:
1. **`net.ipv4.tcp_syn_retries`** (mặc định **`6`**): Số lần tối đa Client thử gửi lại gói `SYN` khi chưa nhận được `SYN-ACK`. Với Exponential Backoff, 6 lần retry tương ứng tổng thời gian chờ khoảng **67 giây** trước khi hủy kết nối chủ động.
2. **`net.ipv4.tcp_synack_retries`** (mặc định **`5`**): Số lần tối đa Server thử gửi lại gói `SYN-ACK` cho kết nối thụ động khi chưa nhận được `ACK` bước 3, tương ứng duy trì trạng thái `SYN-RECEIVED` khoảng **31 giây**.
3. **`net.ipv4.tcp_syncookies`** (mặc định **`1`**): Bật tính năng bảo vệ tự động bằng **SYN Cookies** khi hàng đợi SYN Backlog bị tràn (`overflow`).
</details>

### Câu Hỏi 12: Hai cạm bẫy mạng phổ biến liên quan đến tường lửa (Stateful Firewall) có thể làm sập quá trình Three-Way Handshake trong môi trường thực tế là gì và cách phòng tránh?

<details>
<summary>Đáp án</summary>

1. **Simultaneous Open bị Stateful Firewall chặn**:
   - *Nguyên nhân*: Đa số Stateful Firewall hoặc NAT giả định bắt tay bất đối xứng (chỉ cho `SYN-ACK` quay về sau khi thấy `SYN` đi ra). Khi hai node (ví dụ P2P, WebRTC, database cluster) cùng gửi `SYN` cho nhau, Firewall thấy gói `SYN` đến khi socket đang ở `SYN-SENT` nên coi là gói tin bất thường (out-of-state) và drop bỏ.
   - *Khắc phục*: Cấu hình rule firewall cho phép lưu lượng hai chiều giữa các node trong cụm nội bộ, hoặc dùng máy chủ trung gian (Relay/TURN) khi đi qua tường lửa khắt khe.
2. **Tuyến đường bất đối xứng (Asymmetric Routing)**:
   - *Nguyên nhân*: Trong mạng nhiều đường truyền (Multi-homed / ECMP), gói `SYN` đi vào qua Firewall A (Firewall A lưu vào State Table), nhưng gói phản hồi `SYN-ACK` lại đi ra qua Firewall B. Vì Firewall B chưa từng thấy gói `SYN` trước đó, nó coi `SYN-ACK` là vi phạm trạng thái TCP và drop gói tin hoặc gửi `RST`.
   - *Khắc phục*: Thiết kế định tuyến đối xứng (**Symmetric Routing**) qua cùng một firewall hoặc bật tính năng đồng bộ bảng trạng thái (**State Synchronization / Cluster Session Sync**) giữa các firewall Active-Active.
</details>
