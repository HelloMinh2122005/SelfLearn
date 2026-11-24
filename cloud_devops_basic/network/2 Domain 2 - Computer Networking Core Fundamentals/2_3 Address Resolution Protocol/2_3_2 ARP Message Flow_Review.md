# Review: 2_3_2 ARP Message Flow

### Câu Hỏi 1: Giao thức ARP (RFC 826) giải quyết bài toán gì và gói tin ARP được đóng gói như thế nào ở tầng liên kết dữ liệu?

<details>
<summary>Đáp án</summary>

- **Bài toán giải quyết**: ARP (**Address Resolution Protocol**, chuẩn hóa trong **RFC 826**) là cầu nối giữa tầng mạng (**Network Layer - L3**, dùng địa chỉ logic IPv4) và tầng liên kết dữ liệu (**Data Link Layer - L2**, dùng địa chỉ vật lý MAC) trên mạng cục bộ (**LAN**). Khi một máy trạm cần gửi IP datagram tới một địa chỉ IPv4 đích cùng mạng cục bộ nhưng chưa biết địa chỉ MAC tương ứng, nó dùng ARP để phân giải IPv4 sang MAC.
- **Cách đóng gói**: Khác với các giao thức tầng ứng dụng, gói tin ARP được đóng gói trực tiếp vào phần tải trọng (**payload**) của **Ethernet frame** với giá trị **EtherType `0x0806`**.
</details>

---

### Câu Hỏi 2: Trong cấu trúc gói tin ARP theo RFC 826, trường Opcode (`ar$op`) và 4 trường địa chỉ cốt lõi (SHA, SPA, THA, TPA) có độ dài và ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **Opcode (`ar$op`)**: Kích thước **16-bit (2 bytes)**, xác định loại thông điệp ARP:
  - `1` (`ares_op$REQUEST`): Yêu cầu phân giải địa chỉ (ARP Request).
  - `2` (`ares_op$REPLY`): Phản hồi chứa địa chỉ vật lý đã phân giải (ARP Reply).
- **Sender Hardware Address — SHA (`ar$sha`)**: Độ dài **6 bytes** (trên Ethernet), địa chỉ MAC vật lý của trạm gửi gói tin ARP.
- **Sender Protocol Address — SPA (`ar$spa`)**: Độ dài **4 bytes** (đối với IPv4), địa chỉ IPv4 logic của trạm gửi gói tin ARP.
- **Target Hardware Address — THA (`ar$tha`)**: Độ dài **6 bytes**, địa chỉ MAC của trạm mục tiêu.
- **Target Protocol Address — TPA (`ar$tpa`)**: Độ dài **4 bytes**, địa chỉ IPv4 của trạm mục tiêu cần tìm kiếm hoặc giải đáp.
</details>

---

### Câu Hỏi 3: Trong pha ARP Request, gói tin được gửi theo cơ chế truyền tải nào và giá trị của trường Target Hardware Address (`ar$tha`) được thiết lập ra sao?

<details>
<summary>Đáp án</summary>

- **Cơ chế truyền tải**: ARP Request được đóng gói trong Ethernet frame gửi tới địa chỉ MAC quảng bá (**Broadcast**) **`FF:FF:FF:FF:FF:FF`**. Switch trong mạng LAN sẽ nhân bản và chuyển tiếp (**flood**) frame này tới toàn bộ các trạm khác trong cùng broadcast domain.
- **Giá trị trường `ar$tha`**: Do trạm nguồn chưa biết địa chỉ MAC của trạm đích, theo **RFC 826** trường này bị bỏ qua (*ignored / don't care*) và theo khuyến nghị trong **RFC 5227 section 2.1.1**, trường `ar$tha` nên được gán bằng toàn bộ bit 0 (**`00:00:00:00:00:00`**).
</details>

---

### Câu Hỏi 4: Trong pha ARP Reply, trạm nào được phép gửi phản hồi, các trường địa chỉ được hoán đổi như thế nào và gói tin được truyền theo kiểu gì?

<details>
<summary>Đáp án</summary>

- **Trạm được phép phản hồi**: Chỉ duy nhất trạm sở hữu địa chỉ IPv4 trùng khớp với **`ar$tpa`** trong gói tin ARP Request mới tiến hành gửi phản hồi.
- **Cơ chế hoán đổi trường địa chỉ (address fields swapping theo RFC 826)**:
  - Đặt `ar$tha` = `ar$sha` ban đầu (MAC của trạm yêu cầu) và `ar$tpa` = `ar$spa` ban đầu (IP của trạm yêu cầu).
  - Đặt `ar$sha` = địa chỉ MAC cục bộ của trạm mục tiêu và `ar$spa` = địa chỉ IPv4 cục bộ của trạm mục tiêu.
  - Đặt `ar$op = 2` (`ares_op$REPLY`).
- **Kiểu truyền tải**: Gói tin ARP Reply được đóng gói trong Ethernet frame gửi trực tiếp (**Unicast**) tới địa chỉ MAC của trạm yêu cầu (`ar$tha`), không làm phiền hay tiêu tốn băng thông của các trạm khác trên mạng.
</details>

---

### Câu Hỏi 5: Thuật toán tiếp nhận gói tin ARP và cập nhật bảng dịch bằng biến cờ `Merge_flag` theo RFC 826 hoạt động theo các bước nào?

<details>
<summary>Đáp án</summary>

Thuật toán khởi tạo **`Merge_flag := false`** và xử lý theo 2 bước:
1. **Kiểm tra bảng dịch hiện tại**:
   - Nếu cặp `<protocol type, SPA>` **đã tồn tại** trong bảng dịch (translation table): cập nhật trường `SHA` mới vào bản ghi có sẵn và đặt **`Merge_flag := true`**.
2. **Kiểm tra địa chỉ mục tiêu (`TPA`)**:
   - **Nếu đúng là TPA (Target Host)**:
     - Nếu `Merge_flag == false`, thêm bộ ba `<protocol type, SPA, SHA>` vào bảng dịch.
     - Thực hiện hoán đổi các trường địa chỉ, gán `ar$op = 2` (`REPLY`) và gửi gói **Unicast ARP Reply**.
   - **Nếu không phải TPA (Non-target Host)**:
     - Nếu `Merge_flag == false`, **không tạo bản ghi mới** và bỏ qua gói tin (còn nếu `Merge_flag == true`, bản ghi đã được cập nhật ở Bước 1).
</details>

---

### Câu Hỏi 6: Vì sao RFC 826 quy định các trạm không phải mục tiêu (non-target hosts) tuyệt đối không tự ý thêm thông tin trạm gửi vào bảng ARP nếu `Merge_flag == false`?

<details>
<summary>Đáp án</summary>

Quy định này nhằm ngăn chặn hiện tượng **tràn bộ nhớ / ô nhiễm bảng ARP (table flooding/pollution)**:
- Nếu mọi máy trạm đều ghi nhớ tất cả các gói tin broadcast xuất hiện trên mạng, bảng ARP của toàn bộ hệ thống sẽ nhanh chóng bị phình to bởi hàng loạt bản ghi rác của những máy trạm mà chúng chưa từng có nhu cầu giao tiếp.
- Điều này gây lãng phí bộ nhớ kernel và đẩy các bản ghi đang thực sự được sử dụng ra khỏi bộ đệm.
</details>

---

### Câu Hỏi 7: Trong thời gian chờ nhận ARP Reply, các gói tin IP chiều đi (outbound datagrams) được xử lý ra sao theo RFC 1122 và trong nhân Linux (`arp(7)`)?

<details>
<summary>Đáp án</summary>

- **Theo chuẩn RFC 1122 section 2.3.2.2**: Tầng liên kết dữ liệu được khuyến nghị nên lưu lại (thay vì hủy bỏ) ít nhất một gói tin — cụ thể là gói mới nhất — trong tập hợp các gói tin gửi tới cùng một địa chỉ IP chưa phân giải, và truyền gói tin đã lưu đó khi địa chỉ được phân giải thành công.
- **Hiện thực trong nhân Linux (`arp(7)`)**:
  - Nhân Linux dùng hàng đợi chờ phân giải (*unresolved queue*) cấu hình qua tham số **`unres_qlen`** tại `/proc/sys/net/ipv4/neigh/<interface>/unres_qlen`.
  - Giá trị mặc định là **`unres_qlen = 3`** (lưu tối đa 3 gói tin đang chờ phân giải địa chỉ cho một IP đích cụ thể).
  - Ngay khi nhận được ARP Reply hợp lệ, hệ điều hành sẽ đẩy các gói tin đang chờ trong hàng đợi xuống đường truyền vật lý.
</details>

---

### Câu Hỏi 8: Khi dùng lệnh `sudo tcpdump -e -n -v -i eth0 arp`, các cờ `-e`, `-n`, `-v` có tác dụng gì và làm sao nhận biết gói ARP Request với ARP Reply trên đầu ra?

<details>
<summary>Đáp án</summary>

- **Ý nghĩa các cờ của `tcpdump`**:
  - `-e`: Hiển thị tiêu đề tầng liên kết dữ liệu (địa chỉ Ethernet MAC nguồn và đích).
  - `-n`: Ngăn phân giải tên miền, giữ nguyên địa chỉ IP dạng số.
  - `-v`: Hiển thị chi tiết các trường của giao thức ARP.
- **Cách nhận biết Request và Reply trên đầu ra**:
  - **ARP Request**: Địa chỉ MAC đích ở header Ethernet là **`ff:ff:ff:ff:ff:ff`** (Broadcast) và phần tải trọng hiển thị dạng `Request who-has <IP_đích> tell <IP_nguồn>`.
  - **ARP Reply**: Địa chỉ MAC đích ở header Ethernet là địa chỉ MAC cụ thể của trạm yêu cầu (Unicast) và phần tải trọng hiển thị dạng `Reply <IP_đích> is-at <MAC_đích>`.
</details>

---

### Câu Hỏi 9: Hiểm họa bão Broadcast (Broadcast Storm) do ARP Request gây ra rủi ro gì và các thực tiễn sản xuất (best practices) khuyên phòng tránh thế nào?

<details>
<summary>Đáp án</summary>

- **Bản chất & Rủi ro**: ARP Request dùng địa chỉ MAC đích `FF:FF:FF:FF:FF:FF`, nên Switch sẽ nhân bản khung này ra tất cả các cổng trong cùng VLAN/Broadcast Domain. Khi một mạng LAN phẳng có hàng ngàn máy chủ/container khởi động đồng thời hoặc có hoạt động quét mạng (*network sweep / ARP scan*), lượng khung quảng bá ARP khổng lồ sẽ gây nghẽn băng thông và kích hoạt ngắt CPU (**CPU interrupts**) liên tục trên card mạng của mọi máy chủ trong mạng.
- **Thực tiễn phòng tránh**:
  - Phân chia mạng thành các **VLAN** nhỏ hơn (giới hạn kích thước broadcast domain thường **dưới 500–1000 hosts**).
  - Kích hoạt tính năng **Storm Control** trên các switch phân phối.
</details>

---

### Câu Hỏi 10: Ngoài Broadcast Storm, hai cạm bẫy vận hành thực tế nào khác liên quan đến hàng đợi `unres_qlen` và thuật toán `Merge_flag`?

<details>
<summary>Đáp án</summary>

1. **Mất gói tin âm thầm do tràn hàng đợi phân giải (`unres_qlen` Overflow)**:
   - Khi ứng dụng gửi một đợt bùng nổ gói tin (*packet burst*) tới một IP mới trong lúc ARP Reply bị trễ, nhân Linux chỉ giữ tối đa số gói tin theo `unres_qlen` (mặc định **3 gói tin**). Các gói tin vượt quá giới hạn này sẽ bị hủy âm thầm (*dropped*) tại tầng giao tiếp mạng cục bộ, gây trễ khởi tạo kết nối hoặc retransmission không mong muốn.
2. **Nguy cơ ô nhiễm và cạn kiệt bộ nhớ bảng dịch**:
   - Nếu thiết bị nhúng hoặc phần mềm mạng viết lỗi vi phạm quy tắc `Merge_flag` (ghi nhớ bừa bãi mọi trạm phát broadcast), bảng dịch ARP sẽ bị lấp đầy bởi hàng ngàn bản ghi không sử dụng, làm cạn kiệt bộ nhớ bảng định tuyến tầng 2 (**CAM / ARP table exhaustion**) và đẩy các bản ghi dịch vụ quan trọng ra ngoài.
</details>
