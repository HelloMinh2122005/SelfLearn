# Review: 2_8_1 Stateless vs Stateful Packet Filtering

### Câu Hỏi 1: Cấu trúc 5-tuple trong lọc gói tin (Packet Filtering) gồm những thành phần nào và hoạt động ở những tầng nào của mô hình mạng?

<details>
<summary>Đáp án</summary>

Cấu trúc **5-tuple** là tiêu chí nhận diện duy nhất một luồng dữ liệu mạng (network flow) trên IPv4, hoạt động dựa trên tiêu đề ở **Tầng Mạng (Layer 3)** và **Tầng Giao Vận (Layer 4)**, bao gồm 5 trường sau:
1. **Source IP Address** (32 bits, IPv4 Header): Địa chỉ IP của máy chủ phát gói tin.
2. **Destination IP Address** (32 bits, IPv4 Header): Địa chỉ IP của máy chủ đích nhận gói tin.
3. **Transport Protocol** (8 bits, IPv4 Header): Giao thức tầng giao vận (`6` cho TCP, `17` cho UDP, `1` cho ICMP).
4. **Source Port** (16 bits, TCP/UDP Header): Cổng nguồn của tiến trình gửi (cổng dịch vụ hoặc cổng động).
5. **Destination Port** (16 bits, TCP/UDP Header): Cổng đích của tiến trình nhận.
</details>

### Câu Hỏi 2: Chính sách mặc định Default-Deny (Whitelisting) trong thiết kế tường lửa là gì và được cấu hình như thế nào trong `nftables` và `iptables`?

<details>
<summary>Đáp án</summary>

**Default-Deny (từ chối ngầm định)** hay **Whitelisting** là nguyên tắc bảo mật trong đó chuỗi xử lý gói tin mặc định hủy bỏ (`DROP`) hoặc từ chối (`REJECT`) mọi lưu lượng mạng; chỉ những gói tin khớp chính xác với ít nhất một quy tắc cho phép (`ACCEPT`) được khai báo tường minh mới được đi qua.
- Trong **`nftables`**: cấu hình `policy drop` trên chain (ví dụ: `chain IN { type filter hook input priority filter; policy drop; }`).
- Trong **`iptables`**: cấu hình qua tùy chọn `-P` (ví dụ: `iptables -P INPUT DROP`).
</details>

### Câu Hỏi 3: Lọc gói không trạng thái (Stateless Packet Filtering) hoạt động như thế nào và vì sao gây ra "Thế tiến thoái lưỡng nan của Chiều về" (Return Traffic Dilemma)?

<details>
<summary>Đáp án</summary>

**Stateless Packet Filtering** đánh giá từng gói tin một cách độc lập và cô lập hoàn toàn dựa trên thông tin tiêu đề tĩnh, không lưu trữ lịch sử gói tin hay trạng thái phiên kết nối (session state).

**Return Traffic Dilemma** xảy ra khi client nội bộ kết nối ra ngoài (ví dụ tới Web Server cổng 80/443):
- **Chiều đi (Outbound)**: Client cấp phát một **ephemeral port** ngẫu nhiên trong dải `1024–65535` (hoặc `49152–65535`) làm Source Port. Quy tắc cho phép chiều ra cổng đích 80 cho gói tin đi qua.
- **Chiều về (Inbound)**: Server gửi gói phản hồi với 5-tuple đảo ngược (Source Port là `80`, Destination Port là ephemeral port của client). Vì tường lửa stateless không nhớ rằng client vừa gửi request trước đó, nó coi gói phản hồi là một nỗ lực kết nối mới từ bên ngoài. Dưới chính sách Default-Deny, gói phản hồi bị **DROP**, làm đứt gãy kết nối.
</details>

### Câu Hỏi 4: Tại sao việc mở quy tắc Inbound cho toàn bộ dải cổng ephemeral (`1024–65535`) để sửa lỗi chiều về trên Stateless Firewall lại gây rủi ro bảo mật nghiêm trọng?

<details>
<summary>Đáp án</summary>

Khi quản trị viên mở quy tắc đối xứng cho chiều về (ví dụ `ALLOW IN TCP from any:80 to <internal>:1024-65535`), kẻ tấn công trên Internet có thể giả mạo hoặc cấu hình công cụ gửi gói tin có **Source Port = 80** hướng tới bất kỳ cổng nào từ `1024` đến `65535` của hệ thống nội bộ.

Vì tường lửa stateless chỉ kiểm tra tiêu đề tĩnh, toàn bộ các gói tin độc hại này đều thỏa mãn điều kiện quy tắc và được phép đi qua, làm lộ các dịch vụ nội bộ đang chạy trên các cổng cao (như RPC, database test, debug ports, microservices).
</details>

### Câu Hỏi 5: Tường lửa có trạng thái (Stateful Firewall) và hệ thống con Linux Netfilter `conntrack` giải quyết bài toán lưu lượng chiều về như thế nào?

<details>
<summary>Đáp án</summary>

Stateful Firewall duy trì ngữ cảnh kết nối (Stateful Connection Tracking). Trong nhân Linux, hệ thống con **Netfilter `conntrack`** sử dụng một bảng băm (conntrack hash table) trong bộ nhớ kernel để lưu trữ mỗi phiên kết nối (`nf_conn`) bằng **hai cấu trúc tuple đảo ngược**:
- **Original Direction Tuple (`IP_CT_DIR_ORIGINAL`)**: Thông tin 5-tuple từ phía khởi tạo kết nối.
- **Reply Direction Tuple (`IP_CT_DIR_REPLY`)**: Thông tin 5-tuple dự kiến cho gói tin phản hồi quay ngược lại.

Khi gói tin phản hồi quay về, kernel tính giá trị băm và tra cứu nhanh trong bảng `conntrack`. Nếu khớp với Reply Tuple của một kết nối hợp lệ đã ghi nhận trước đó, gói tin được tự động gắn nhãn hợp lệ (`ESTABLISHED`) và cho phép đi qua mà không cần mở thủ công dải cổng ephemeral.
</details>

### Câu Hỏi 6: Hãy nêu định nghĩa và trường hợp áp dụng của 5 trạng thái gói tin nền tảng trong Linux Netfilter (`conntrack`)?

<details>
<summary>Đáp án</summary>

5 trạng thái `conntrack` trong Linux Netfilter gồm:
1. **`NEW`**: Gói tin bắt đầu một kết nối mới hoặc chưa từng ghi nhận lưu lượng ở cả hai chiều (ví dụ: gói TCP `SYN` đầu tiên, gói UDP đầu tiên gửi tới server).
2. **`ESTABLISHED`**: Gói tin thuộc về một kết nối đã ghi nhận dữ liệu hợp lệ ở cả hai chiều (`two-way traffic`) (ví dụ: TCP `SYN-ACK`, `ACK` và các gói trao đổi payload sau đó).
3. **`RELATED`**: Gói tin đang khởi tạo một kết nối mới nhưng có quan hệ trực tiếp với một kết nối đang hoạt động sẵn có (ví dụ: thông điệp lỗi ICMP gắn với một luồng TCP/UDP, hoặc kênh truyền dữ liệu phụ của FTP).
4. **`INVALID`**: Gói tin không gắn với kết nối hợp lệ nào đã biết hoặc vi phạm kiểm tra toàn vẹn ngữ cảnh (ví dụ: gói mang cờ TCP bất thường như `SYN+FIN`, hoặc out-of-window). Cần bị **`DROP`** ngay lập tức.
5. **`UNTRACKED`**: Gói tin hoàn toàn không bị theo dõi bởi hệ thống con `conntrack` (khi quản trị viên chủ động bỏ qua tracking bằng `-j CT --notrack` trong bảng `raw` để tối ưu hiệu năng).
</details>

### Câu Hỏi 7: Trong chu trình bắt tay 3 bước của TCP, Netfilter `conntrack` chuyển đổi trạng thái như thế nào và cờ `[ASSURED]` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Quá trình theo dõi TCP 3-way handshake trong `conntrack` diễn ra qua các bước:
1. **Client gửi TCP `SYN`**: `conntrack` tạo bản ghi mới với trạng thái gói `NEW`, trạng thái TCP nội bộ `SYN_SENT`, kèm cờ `[UNREPLIED]` (timeout ban đầu thường là 120 giây).
2. **Server gửi lại TCP `SYN-ACK`**: `conntrack` khớp Reply Tuple, xóa cờ `[UNREPLIED]` và chuyển trạng thái TCP sang `SYN_RECV`.
3. **Client gửi TCP `ACK` cuối cùng**: `conntrack` chuyển kết nối sang trạng thái **`ESTABLISHED`** và đánh dấu cờ **`[ASSURED]`**.

**Ý nghĩa của `[ASSURED]`**: Đảm bảo phiên kết nối đã được xác thực hai chiều hoàn chỉnh và sẽ không bị bộ dọn dẹp của kernel giải phóng ưu tiên khi bảng `conntrack` bị đầy. (Theo mặc định Linux kernel, `net.netfilter.nf_conntrack_tcp_timeout_established` là **432,000 giây**, tương đương 5 ngày; còn `close_wait` mặc định là **60 giây**).
</details>

### Câu Hỏi 8: Làm thế nào Stateful Firewall có thể theo dõi các giao thức phi kết nối (connectionless) như UDP và ICMP?

<details>
<summary>Đáp án</summary>

Dù UDP và ICMP không có cơ chế bắt tay hay số tuần tự như TCP, Stateful Firewall vẫn theo dõi chúng thông qua cơ chế **giả kết nối (Pseudo-Connection)**:
- **Đối với UDP**: Khi gói UDP chiều đi xuất phát, `conntrack` ghi nhận tuple ban đầu, tự động thiết lập tuple đảo ngược dự kiến và gắn một bộ đếm thời gian rỗi (**idle timer**). Nếu gói UDP phản hồi quay về trong thời gian này, nó được xếp vào trạng thái `ESTABLISHED`. (Trên Windows WFP/ALE, idle timeout mặc định cho UDP unicast ALE flow là **60 giây**).
- **Đối với ICMP Echo (`ping`)**: `conntrack` tạo pseudo-connection dựa trên cặp địa chỉ IP cùng trường **`Identifier`** và **`Sequence Number`** trong ICMP Header. Trong Linux kernel, thời gian timeout mặc định cho ICMP là **30 giây** (`30*HZ`).
</details>

### Câu Hỏi 9: Vì sao gói tin lỗi ICMP (như `Destination Unreachable` hoặc `TTL Exceeded`) từ một router trung gian lại được Linux `conntrack` phân loại là `RELATED` thay vì `NEW` hay `INVALID`?

<details>
<summary>Đáp án</summary>

Gói tin lỗi ICMP không phải `NEW` (vì xuất phát từ một router trung gian chứ không phải máy chủ đích và không mở phiên mới) và cũng không phải `INVALID` (vì đây là thông báo lỗi mạng hợp lệ và cần thiết).

Cơ chế phân loại của Linux kernel (`nf_conntrack_proto_icmp.c`) như sau:
1. Gói tin lỗi ICMP chứa phần tiêu đề lồng nhau của gói tin gốc bị lỗi: `iphdr | icmphdr | inner_iphdr | l4header`.
2. Hàm xử lý `conntrack` bóc tách phần **`inner_iphdr`** và **`l4header`** bên trong gói ICMP lỗi để lấy 5-tuple của gói tin gốc.
3. Kernel dùng thông tin này tra cứu ngược vào bảng băm `conntrack`. Khi tìm thấy phiên kết nối gốc đang hoạt động, kernel gán `ctinfo = IP_CT_RELATED`, cho phép gói tin lỗi đi qua quy tắc `ESTABLISHED,RELATED` để báo lỗi về cho máy gửi.
</details>

### Câu Hỏi 10: Trên hệ điều hành Windows, Windows Filtering Platform (WFP) thực thi lọc gói có trạng thái ở tầng nào và khái niệm ALE Flow hoạt động ra sao?

<details>
<summary>Đáp án</summary>

Trên Windows (Windows Defender Firewall), kiến trúc nền tảng **Windows Filtering Platform (WFP)** thực thi lọc gói có trạng thái tại các lớp **Application Layer Enforcement (ALE)**.

- **ALE Flow**: Là đơn vị quản lý trạng thái của WFP, đại diện cho lưu lượng mạng được phân loại dựa trên 5-tuple.
- **Cơ chế hoạt động**: Khi một ứng dụng khởi tạo kết nối đi ra và được các bộ lọc tại tầng ALE ủy quyền thành công, một ALE flow được kích hoạt trong nhân Windows. Chừng nào chính sách không thay đổi, **mọi gói tin thuộc cùng ALE flow đó—bao gồm cả chiều đi (outbound) và chiều phản hồi về (inbound)—đều được tự động cho phép đi qua** mà không cần tạo quy tắc mở cổng inbound thủ công.
</details>

### Câu Hỏi 11: Khi viết ruleset Stateful Firewall với `nftables` hoặc `iptables`, thứ tự và vai trò của các quy tắc `ESTABLISHED,RELATED`, `INVALID`, và `NEW` là gì?

<details>
<summary>Đáp án</summary>

Trong một chuỗi `INPUT` có chính sách mặc định là `DROP`, các quy tắc tiêu chuẩn thường gồm:
1. **`ct state established,related accept`** (hoặc `-m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT`): Cho phép tự động toàn bộ gói tin chiều về của các kết nối hợp lệ đã mở trước đó và các gói báo lỗi liên đới.
2. **`ct state invalid drop`** (hoặc `-m conntrack --ctstate INVALID -j DROP`): Loại bỏ ngay các gói tin hỏng, sai ngữ cảnh hoặc mang cờ TCP bất thường.
3. **`ct state new accept` cho từng dịch vụ cụ thể** (ví dụ `tcp dport 22`): Chỉ cho phép mở kết nối mới tới đúng các cổng dịch vụ được phép công khai.

Ngoài ra cần quy tắc cho phép giao diện loopback (`lo`) hoạt động bình thường.
</details>

### Câu Hỏi 12: Các lệnh `conntrack -L`, `conntrack -S` và các tham số `sysctl` (`nf_conntrack_count`, `nf_conntrack_max`) dùng để giám sát thông tin gì?

<details>
<summary>Đáp án</summary>

- **`conntrack -L`**: Xuất danh sách toàn bộ các phiên kết nối đang được kernel theo dõi trong bảng `conntrack`, hiển thị rõ Original Tuple, Reply Tuple, trạng thái (`ESTABLISHED`), cờ (`[ASSURED]`) và thời gian timeout đếm lùi.
- **`conntrack -S`**: Xem thống kê hiệu năng và trạng thái xử lý của `conntrack` trên từng CPU. Hai chỉ số quan trọng cần theo dõi là **`drop`** và **`early_drop`** — nếu lớn hơn `0`, hệ thống đang bị quá tải hoặc bảng `conntrack` đã bị đầy.
- **Tham số `sysctl`**:
  - `net.netfilter.nf_conntrack_count`: Số lượng kết nối hiện đang được theo dõi.
  - `net.netfilter.nf_conntrack_max`: Giới hạn dung lượng bản ghi tối đa của bảng `conntrack`.
</details>

### Câu Hỏi 13: Sự cố "Tràn bảng Conntrack" (`nf_conntrack: table full, dropping packet`) xảy ra khi nào và có 3 giải pháp khắc phục nào trong môi trường sản xuất?

<details>
<summary>Đáp án</summary>

**Nguyên nhân**: Mỗi bản ghi `conntrack` chiếm RAM trong nhân Linux (khoảng 300–400 bytes), nên kernel giới hạn số bản ghi tối đa qua `net.netfilter.nf_conntrack_max`. Khi `nf_conntrack_count` chạm ngưỡng `nf_conntrack_max`, kernel ghi cảnh báo `nf_conntrack: table full, dropping packet` và **DROP toàn bộ các gói tin kết nối mới**, làm tê liệt mạng dù CPU và RAM của server vẫn còn trống nhiều.

**3 giải pháp cấp sản xuất**:
1. **Tăng kích thước bảng băm (`hashsize`) và giới hạn tối đa (`nf_conntrack_max`)**: Theo nguyên tắc `nf_conntrack_max = hashsize * 4` (hoặc `* 8`), tùy theo dung lượng RAM sẵn có của máy chủ.
2. **Hạ thấp thời gian timeout `ESTABLISHED`**: Giảm `net.netfilter.nf_conntrack_tcp_timeout_established` từ mặc định 432,000 giây (5 ngày) xuống mức hợp lý (ví dụ 600–1200 giây) để nhanh chóng giải phóng các kết nối chết/không hoạt động.
3. **Bỏ qua theo dõi trạng thái (`NOTRACK`)**: Đối với lưu lượng stateless cực lớn (như DNS port 53, CDN), dùng target `-j CT --notrack` trong bảng `raw` để không nạp bản ghi vào bảng `conntrack`.
</details>

### Câu Hỏi 14: Hiện tượng "PMTUD Black Hole" là gì khi cấu hình tường lửa chặn toàn bộ ICMP, và Stateful Firewall khắc phục hiện tượng này như thế nào?

<details>
<summary>Đáp án</summary>

**PMTUD Black Hole** xảy ra khi quản trị viên chặn toàn bộ lưu lượng ICMP (`iptables -A INPUT -p icmp -j DROP`). Hành động này vô tình chặn luôn gói tin **`ICMP Destination Unreachable / Fragmentation Needed` (Type 3, Code 4)** mà router gửi về khi gặp gói tin có kích thước vượt quá MTU của chặng định tuyến và đang bật cờ DF (Don't Fragment).

Vì client không nhận được thông báo để hạ kích thước gói tin, kết nối TCP bắt tay thành công nhưng sẽ bị treo đơ vĩnh viễn khi truyền payload lớn.

**Cách khắc phục**: Với Stateful Firewall, cấu hình quy tắc chấp thuận trạng thái **`RELATED`** (`ct state established,related accept`). Nhờ đó, các gói tin lỗi ICMP liên đới đến phiên kết nối hợp lệ luôn tự động được đi qua an toàn mà không cần mở toang mọi loại ICMP (như ICMP Echo Request).
</details>

### Câu Hỏi 15: Trên Windows, module PowerShell nào được dùng để quản trị Windows Defender Firewall và các cmdlet cơ bản để kiểm tra profile, bật tường lửa và tạo rule Inbound là gì?

<details>
<summary>Đáp án</summary>

PowerShell cung cấp module **`NetSecurity`** để quản lý Windows Defender Firewall (hoạt động trên nền tảng WFP/ALE), với các cmdlet cơ bản:
- **`Get-NetFirewallProfile`**: Kiểm tra trạng thái (`Enabled`), chính sách mặc định (`DefaultInboundAction`, `DefaultOutboundAction`) của các profile (`Domain`, `Private`, `Public`).
- **`Set-NetFirewallProfile`**: Cấu hình hoặc kích hoạt các profile tường lửa (ví dụ: `-Profile Domain,Public,Private -Enabled True`).
- **`New-NetFirewallRule`**: Tạo quy tắc tường lửa mới (ví dụ cho phép Inbound TCP port 22 với `-Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow`).
- **`Get-NetFirewallRule`**: Kiểm tra lại thông tin quy tắc đã tạo.
</details>
