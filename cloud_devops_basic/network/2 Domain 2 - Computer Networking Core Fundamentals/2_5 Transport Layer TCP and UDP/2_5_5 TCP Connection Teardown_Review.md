# Review: 2_5_5 TCP Connection Teardown

### Câu Hỏi 1: Vì sao việc đóng kết nối TCP không thể diễn ra đột ngột trong một bước, và tài liệu chuẩn nào hiện quy định cơ chế TCP Connection Teardown?

<details>
<summary>Đáp án</summary>

TCP là giao thức hướng kết nối hoạt động theo mô hình **song công toàn phần (Full-Duplex)**, nghĩa là một kết nối TCP thực chất gồm **hai kênh truyền dữ liệu byte stream độc lập** chạy theo hai chiều ngược nhau giữa hai đầu cuối. Vì hai chiều độc lập với nhau nên mỗi bên phải chủ động thông báo khi kết thúc dữ liệu ở chiều của mình và xác nhận yêu cầu đóng từ phía đối phương.

Cơ chế TCP Connection Teardown chuẩn mực hiện được quy định toàn diện trong tài liệu **RFC 9293** (thay thế RFC 793).
</details>

### Câu Hỏi 2: TCP Half-Close là gì và xảy ra ở giai đoạn nào của quá trình đóng kết nối?

<details>
<summary>Đáp án</summary>

**TCP Half-Close (Đóng một nửa kết nối)** là trạng thái mà một chiều truyền dữ liệu của kết nối TCP đã đóng lại, trong khi chiều ngược lại vẫn tiếp tục hoạt động bình thường.

Cụ thể, sau khi bên A gửi cờ `FIN` và nhận được gói `ACK` xác nhận từ bên B, chiều gửi từ A sang B chính thức đóng. Tuy nhiên, nếu bên B vẫn còn dữ liệu cần gửi, bên B vẫn có toàn quyền tiếp tục truyền dữ liệu qua kênh từ B sang A, và bên A vẫn có trách nhiệm tiếp nhận cũng như gửi `ACK` phản hồi cho đến khi bên B gửi `FIN`.
</details>

### Câu Hỏi 3: Cờ FIN tiêu thụ bao nhiêu đơn vị trong không gian Sequence Number, và giá trị ACK phản hồi cho một phân đoạn FIN mang `<SEQ=u>` phải là bao nhiêu?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.6 Figure 12**:
- Cờ **`FIN` tiêu thụ đúng 1 đơn vị không gian Sequence Number** (tương tự cờ `SYN`).
- Do đó, phân đoạn `ACK` phản hồi cho một gói tin `FIN` mang `<SEQ=u>` bắt buộc phải mang giá trị xác nhận **`<ACK=u+1>`**.
- Ngược lại, một gói tin `ACK` đứng đơn độc (không mang cờ `SYN`/`FIN` và không có payload) tiêu thụ **0** đơn vị Sequence Number.
</details>

### Câu Hỏi 4: Trong TCP 4-Way Teardown chuẩn, Active Closer và Passive Closer khác nhau như thế nào và 4 bước trao đổi gói tin diễn ra ra sao?

<details>
<summary>Đáp án</summary>

- **Active Closer**: Bên chủ động khởi xướng việc đóng kết nối trước.
- **Passive Closer**: Bên tiếp nhận yêu cầu đóng kết nối từ đối phương.

**Trình tự 4 bước:**
1. **Bước 1 (Active FIN)**: Ứng dụng phía Active Closer gọi `close()`. TCP stack gửi phân đoạn mang cờ `<FIN,ACK>`, chuyển từ `ESTABLISHED` sang `FIN-WAIT-1`.
2. **Bước 2 (Passive ACK)**: TCP stack của Passive Closer nhận `FIN`, tự động gửi lại gói `ACK` (với `ACK = SEQ + 1`), chuyển sang `CLOSE-WAIT` và báo hiệu `EOF` lên ứng dụng cục bộ. Active Closer nhận `ACK` này và chuyển từ `FIN-WAIT-1` sang `FIN-WAIT-2` (kết thúc chiều truyền từ Active sang Passive).
3. **Bước 3 (Passive FIN)**: Sau khi ứng dụng Passive Closer xử lý xong dữ liệu còn lại và gọi `close()`, TCP stack của Passive Closer gửi phân đoạn `<FIN,ACK>` của chính nó và chuyển sang `LAST-ACK`.
4. **Bước 4 (Active ACK)**: Active Closer nhận `FIN` từ Passive Closer, phản hồi gói `ACK` cuối cùng và chuyển sang `TIME-WAIT` (kích hoạt bộ đếm $2 \times \text{MSL}$). Passive Closer nhận `ACK` cuối cùng này thì chuyển ngay sang `CLOSED` và giải phóng socket. Hết thời gian $2 \times \text{MSL}$, Active Closer cũng chuyển sang `CLOSED`.
</details>

### Câu Hỏi 5: Chuỗi chuyển đổi trạng thái FSM của Active Closer và Passive Closer trong kịch bản 4-Way Teardown chuẩn theo thứ tự là gì?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.3.2**:
- **Chuỗi trạng thái Active Closer**: `ESTABLISHED` $\rightarrow$ `FIN-WAIT-1` $\rightarrow$ `FIN-WAIT-2` $\rightarrow$ `TIME-WAIT` $\rightarrow$ `CLOSED`.
- **Chuỗi trạng thái Passive Closer**: `ESTABLISHED` $\rightarrow$ `CLOSE-WAIT` $\rightarrow$ `LAST-ACK` $\rightarrow$ `CLOSED`.
</details>

### Câu Hỏi 6: Biến thể Đóng đồng thời (Simultaneous Close) xảy ra khi nào và hai đầu cuối chuyển qua những trạng thái nào?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.6 Figure 13**, **Đóng đồng thời (Simultaneous Close)** xảy ra khi cả hai đầu cuối đang ở trạng thái `ESTABLISHED` cùng gửi phân đoạn `FIN` cho nhau tại cùng một thời điểm:
1. Cả hai bên cùng chuyển từ `ESTABLISHED` sang `FIN-WAIT-1`.
2. Khi mỗi bên nhận được `FIN` từ đối phương (trước khi nhận được `ACK` cho `FIN` của chính mình), cả hai chuyển từ `FIN-WAIT-1` sang trạng thái **`CLOSING`** và gửi `ACK` xác nhận cho đối phương.
3. Khi nhận được `ACK` xác nhận cho phân đoạn `FIN` mình đã gửi, cả hai chuyển từ `CLOSING` sang **`TIME-WAIT`**, chờ hết $2 \times \text{MSL}$ rồi chuyển sang `CLOSED`.
</details>

### Câu Hỏi 7: Khi nào quá trình đóng kết nối có thể thu gọn thành 3 phân đoạn (3-Segment Piggybacked Teardown) và Active Closer sẽ bỏ qua trạng thái nào?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Figure 5 Note 2**, quá trình thu gọn còn 3 phân đoạn xảy ra khi tại thời điểm nhận phân đoạn `FIN` từ Active Closer, phía Passive Closer cũng đã hoàn tất toàn bộ dữ liệu ứng dụng và gọi `close()` ngay tức khắc.

Khi đó:
- TCP stack của Passive Closer gộp gói `ACK` (Bước 2) và gói `FIN` (Bước 3) vào làm **một phân đoạn duy nhất mang cờ `<FIN,ACK>`**.
- Khi Active Closer nhận được phân đoạn kết hợp này, nó chuyển **trực tiếp từ `FIN-WAIT-1` sang `TIME-WAIT`**, bỏ qua trạng thái trung gian **`FIN-WAIT-2`**, rồi gửi gói `ACK` cuối cùng.
</details>

### Câu Hỏi 8: Trạng thái `TIME-WAIT` ở phía Active Closer phục vụ hai mục đích bảo vệ sống còn nào?

<details>
<summary>Đáp án</summary>

Theo **RFC 9293 Section 3.3.2 & Section 3.4.1**, trạng thái `TIME-WAIT` (kéo dài $2 \times \text{MSL}$) phục vụ 2 mục đích:
1. **Đảm bảo độ tin cậy cho gói ACK cuối cùng (Reliable Teardown)**: Gói `ACK` ở Bước 4 không có gói tin nào xác nhận lại nó. Nếu gói `ACK` này bị thất lạc, Passive Closer (đang ở `LAST-ACK`) sẽ hết timer và gửi lại `FIN`. Nhờ Active Closer vẫn giữ trạng thái `TIME-WAIT`, nó có thể nhận `FIN` gửi lại và phản hồi một gói `ACK` mới. Nếu đã giải phóng về `CLOSED`, hệ điều hành sẽ trả về gói `RST`, khiến Passive Closer gặp lỗi ngắt kết nối bất thường (như `Connection reset by peer`) thay vì đóng sạch sẽ.
2. **Quét sạch các phân đoạn dữ liệu cũ trôi nổi trên mạng (Draining Stale Segments)**: Thời gian chờ $2 \times \text{MSL}$ đảm bảo mọi gói tin cũ còn trôi dạt theo chiều đi (tối đa 1 MSL) và chiều về (tối đa 1 MSL) đều bị hủy hoàn toàn trên mạng trước khi bộ 4-tuple `(Src IP, Src Port, Dst IP, Dst Port)` được tái sử dụng cho một kết nối mới, tránh tình trạng gói tin cũ lọt vào và làm sai lệch dữ liệu của kết nối mới.
</details>

### Câu Hỏi 9: Thời gian lưu trạng thái `TIME-WAIT` theo chuẩn RFC 9293 khác gì so với thực tế trong Linux Kernel, và có thể chỉnh tham số này qua `sysctl` không?

<details>
<summary>Đáp án</summary>

- **Theo chuẩn RFC 9293 (Section 3.4.2 & 3.6.1)**: Giá trị MSL quy định là **120 giây (2 phút)**, nên thời gian `TIME-WAIT` ($2 \times \text{MSL}$) là **240 giây (4 phút)**.
- **Trong thực tế Linux Kernel**: Giá trị này được cố định là **60 giây** (tương ứng MSL ngầm định xấp xỉ 30 giây) thông qua hằng số `TCP_TIMEWAIT_LEN` (`60*HZ`) được hardcode trong file mã nguồn `include/net/tcp.h` (dòng 140–141).
- **Khả năng cấu hình**: **Không thể** thay đổi động `TCP_TIMEWAIT_LEN` qua `/proc/sys/net/` (`sysctl`), mà phải biên dịch lại (recompile) kernel nếu muốn sửa.
- **Lý do thiết kế**: Linux cố tình rút ngắn xuống 60 giây (nhanh gấp 4 lần chuẩn RFC) để tối ưu hiệu năng máy chủ, thu hồi bộ nhớ socket và cổng ephemeral nhanh hơn, giúp ngăn ngừa cạn kiệt tài nguyên trước lưu lượng cao hoặc tấn công DoS.
</details>

### Câu Hỏi 10: Tham số `net.ipv4.tcp_fin_timeout` trong Linux có chức năng gì, giá trị mặc định là bao nhiêu và áp dụng cho trạng thái nào?

<details>
<summary>Đáp án</summary>

Theo `man 7 tcp` và `ip-sysctl.rst`, tham số **`net.ipv4.tcp_fin_timeout`** có giá trị mặc định là **60 giây** và **chỉ áp dụng cho các socket mồ côi (orphaned socket) ở trạng thái `FIN-WAIT-2`** (phía Active Closer đã gọi đóng nhưng đối phương không chịu gửi `FIN`).

Nếu đối phương không gửi gói `FIN` trong vòng 60 giây, nhân Linux sẽ cưỡng bức đóng socket ở trạng thái `FIN-WAIT-2` và thu hồi tài nguyên để bảo vệ hệ thống khỏi nguy cơ treo tài nguyên hoặc DoS. Tham số này không tác động lên `TIME-WAIT` hay `CLOSE-WAIT`.
</details>

### Câu Hỏi 11: Trạng thái `CLOSE-WAIT` xuất hiện khi nào và nguyên nhân gốc rễ khiến nhiều socket bị kẹt lâu ở trạng thái này là gì?

<details>
<summary>Đáp án</summary>

Trạng thái `CLOSE-WAIT` xuất hiện ở phía **Passive Closer** sau khi nhận được phân đoạn `FIN` từ Active Closer: TCP stack của hệ điều hành tự động gửi lại gói `ACK` và báo hiệu `EOF` (`read()`/`recv()` trả về `0`) cho ứng dụng cục bộ.

**Căn nguyên kẹt `CLOSE-WAIT`**: TCP stack không thể tự động chuyển từ `CLOSE-WAIT` sang `LAST-ACK`, mà bắt buộc phải chờ tiến trình ứng dụng cục bộ gọi hàm `close()` trên socket. Vì vậy, khi socket bị kẹt ở `CLOSE-WAIT` nhiều phút hoặc nhiều giờ, **nguyên nhân 100% nằm ở lỗi lập trình ứng dụng (Application-Level Bug / File Descriptor Leak)**, chẳng hạn:
- Ứng dụng đọc được `EOF` nhưng quên gọi `close()`.
- Tiến trình bị nghẽn (`hang`/`deadlock`) trước khi kịp thực thi lệnh đóng socket.
- Khối xử lý ngoại lệ không đưa lệnh đóng socket vào `finally` / `defer` / `try...finally`.
</details>

### Câu Hỏi 12: Trong Linux, các lệnh `ss` nào dùng để kiểm tra các socket ở trạng thái đóng kết nối, và tham số `net.ipv4.tcp_max_tw_buckets` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

**Các lệnh `ss` chẩn đoán trạng thái socket** (theo `man 8 ss`):
- Liệt kê socket ở trạng thái `TIME-WAIT`: `ss -tan state time-wait` (đếm số lượng bằng cách thêm `| wc -l`).
- Liệt kê socket bị treo ở trạng thái `CLOSE-WAIT`: `ss -tan state close-wait`.
- Liệt kê socket đang chờ `FIN` ở trạng thái `FIN-WAIT-2`: `ss -tan state fin-wait-2`.

**Ý nghĩa của `net.ipv4.tcp_max_tw_buckets`**: Quy định ngưỡng trần số lượng socket `TIME-WAIT` tối đa mà nhân Linux cho phép duy trì đồng thời. Nếu lưu lượng tăng vọt khiến số socket `TIME-WAIT` vượt ngưỡng này, kernel sẽ lập tức tiêu hủy các socket vượt ngưỡng và ghi cảnh báo `TCP: time wait bucket table overflow` vào nhật ký `dmesg`.
</details>

### Câu Hỏi 13: Vì sao việc đóng mở liên tục các kết nối ngắn hạn trên Reverse Proxy hoặc API Gateway có thể gây lỗi `Cannot assign requested address` (`EADDRNOTAVAIL`), và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

Khi Reverse Proxy (như Nginx, HAProxy, Envoy) hoặc microservice liên tục mở rồi đóng các kết nối ngắn hạn (ví dụ HTTP/1.0) tới dịch vụ đích hoặc cơ sở dữ liệu, Proxy đóng vai trò là **Active Closer**. Mỗi lần đóng kết nối, cổng tạm thời (**ephemeral port**) phía Proxy sẽ bị khóa cứng trong trạng thái `TIME-WAIT` suốt 60 giây.

Khi tốc độ tạo kết nối mới vượt quá số lượng ephemeral port khả dụng (thường khoảng 28.000 đến 60.000 cổng), máy chủ sẽ bị cạn kiệt cổng cục bộ (**Port Exhaustion**) và phát sinh lỗi `Cannot assign requested address` (`EADDRNOTAVAIL`).

**Thực tiễn sản xuất để khắc phục**:
- Hạn chế tối đa việc mở và đóng liên tục các kết nối ngắn hạn.
- Bật **HTTP Keep-Alive** và sử dụng **Connection Pools** bền vững giữa các dịch vụ (như gRPC, HTTP/2 multiplexing, DB connection pool).
</details>

### Câu Hỏi 14: Vì sao tùy chọn cũ `net.ipv4.tcp_tw_recycle = 1` gây nguy cơ rớt mạng nghiêm trọng trong thực tế và đã bị xóa bỏ từ phiên bản Linux Kernel nào?

<details>
<summary>Đáp án</summary>

Cơ chế `tcp_tw_recycle` hoạt động bằng cách lưu lại mốc thời gian (**TCP Timestamps**) gần nhất theo từng địa chỉ IP từ xa để dọn socket `TIME-WAIT` nhanh hơn.

Trong mạng Internet hiện đại, rất nhiều thiết bị người dùng đứng sau cùng một thiết bị **NAT** hoặc Proxy công cộng (dùng chung một IP công cộng nhưng đồng hồ phần cứng của mỗi thiết bị lại lệch nhau). Khi một client phía sau NAT có timestamp nhỏ hơn gửi gói tin tới, kernel máy chủ sẽ nhầm tưởng đó là gói tin cũ trôi dạt và **âm thầm drop toàn bộ gói `SYN` của client đó**, dẫn đến rớt mạng hàng loạt.

Vì phá vỡ tính đúng đắn của mạng Internet, tham số `net.ipv4.tcp_tw_recycle` đã bị **xóa bỏ hoàn toàn khỏi Linux Kernel kể từ phiên bản 4.12**.
</details>

### Câu Hỏi 15: Socket kẹt ở `CLOSE-WAIT` khác socket ở `TIME-WAIT` như thế nào về mặt sở hữu tài nguyên, và khi `CLOSE-WAIT` tích tụ quá nhiều sẽ dẫn đến hậu quả gì?

<details>
<summary>Đáp án</summary>

- Socket ở trạng thái **`TIME-WAIT`** do **nhân hệ điều hành** tự động quản lý và giải phóng sau 60 giây.
- Ngược lại, socket ở trạng thái **`CLOSE-WAIT`** vẫn thuộc quyền sở hữu của **tiến trình ứng dụng**, giữ chặt một bộ mô tả tệp (**File Descriptor - FD**) cùng các bộ đệm bộ nhớ kernel liên kết.

**Hậu quả**: Khi ứng dụng rò rỉ socket làm số lượng `CLOSE-WAIT` tăng dần và chạm ngưỡng giới hạn File Descriptor của hệ thống (`ulimit -n` hoặc `nofile`), tiến trình sẽ không thể mở thêm file hay chấp nhận kết nối mới, báo lỗi **`Too many open files`** và khiến dịch vụ bị sập hoàn toàn. Cách xử lý đúng là sửa mã nguồn ứng dụng (đặt `close()` trong `finally` / `defer` / `try...finally`) chứ không cấu hình kernel.
</details>
