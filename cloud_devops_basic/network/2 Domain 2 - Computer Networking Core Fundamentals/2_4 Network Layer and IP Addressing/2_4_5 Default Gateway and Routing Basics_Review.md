# Review: 2_4_5 Default Gateway and Routing Basics

### Câu Hỏi 1: Default Gateway là gì và tại sao kiến trúc mạng Internet lại sử dụng cơ chế này cho các máy chủ (Host)?

<details>
<summary>Đáp án</summary>

- **Default Gateway (Cổng mặc định)** là một giao diện của bộ định tuyến (Router) hoặc tường lửa (Firewall) được kết nối trực tiếp vào cùng mạng con (subnet) với máy trạm. Giao diện này đóng vai trò là "lối thoát hiểm duy nhất" để đưa các gói tin rời khỏi mạng LAN nội bộ đi tới các mạng khác hoặc Internet.
- **Lý do sử dụng**: Thay vì đòi hỏi mỗi máy trạm phải lưu trữ toàn bộ bản đồ định tuyến khổng lồ của Internet, ngăn xếp mạng áp dụng cơ chế ủy quyền chuyển tiếp qua Default Gateway để máy chủ chỉ cần phân biệt được gói tin thuộc mạng cục bộ hay mạng từ xa.
</details>

### Câu Hỏi 2: Theo thuật toán phân định mạng cục bộ vs mạng từ xa (RFC 1122 Section 3.3.1.1), máy chủ thực hiện phép tính và so sánh gì trước khi gửi gói tin?

<details>
<summary>Đáp án</summary>

Trước khi gửi gói tin IP datagram xuống tầng Data Link (L2), máy chủ thực hiện 3 bước sau:
1. Lấy **Địa chỉ IP nguồn (`Host IP`)** thực hiện phép toán `Bitwise AND` với **Subnet Mask** của giao diện mạng để tính `Local NetID`.
2. Lấy **Địa chỉ IP đích (`Target IP`)** thực hiện phép toán `Bitwise AND` với chính **Subnet Mask** đó để tính `Target NetID`.
3. So sánh `Local NetID` và `Target NetID` để quyết định gói tin thuộc mạng cục bộ (On-link) hay mạng từ xa (Off-link).
</details>

### Câu Hỏi 3: Khi `Local NetID == Target NetID` (cùng mạng con), máy chủ gửi gói tin như thế nào?

<details>
<summary>Đáp án</summary>

- Khi hai NetID khớp nhau, gói tin đích nằm ngay trên cùng liên kết cục bộ (**On-link / Local Subnet**).
- Máy chủ tra cứu bảng ARP cache cục bộ hoặc phát sóng bản tin broadcast **ARP Request** trực tiếp để tìm địa chỉ MAC vật lý của máy đích, sau đó truyền khung Ethernet trực tiếp ở tầng Layer 2 mà không cần đi qua Default Gateway.
</details>

### Câu Hỏi 4: Khi `Local NetID != Target NetID` (khác mạng con), máy chủ gửi gói tin như thế nào?

<details>
<summary>Đáp án</summary>

- Khi hai NetID khác nhau, gói tin đích nằm ở mạng từ xa (**Off-link / Remote Network**), máy chủ không thể tiếp cận trực tiếp máy đích bằng khung Ethernet L2.
- Máy chủ bắt buộc phải phát ARP để tìm địa chỉ MAC của **Default Gateway** được cấu hình trên giao diện mạng và chuyển tiếp khung L2 tới Gateway đó.
</details>

### Câu Hỏi 5: Tuyến đường mặc định (`0.0.0.0/0` hoặc `default`) trong bảng định tuyến có ý nghĩa gì và được áp dụng khi nào theo nguyên lý Longest Prefix Match?

<details>
<summary>Đáp án</summary>

- Địa chỉ `0.0.0.0` với mặt nạ `0.0.0.0` (tiền tố `/0`) mang ý nghĩa toán học là **khớp với mọi địa chỉ IPv4 đích**.
- Theo nguyên lý **Longest Prefix Match (Khớp tiền tố dài nhất)**, router hoặc host chỉ sử dụng Default Route (`0.0.0.0/0`) khi gói tin đích không khớp với bất kỳ tuyến đường cụ thể nào khác (có tiền tố dài hơn) trong bảng định tuyến.
</details>

### Câu Hỏi 6: Khi máy chủ gửi một gói tin tới máy đích ở mạng từ xa qua Default Gateway, các trường địa chỉ ở Layer 3 (IP Header) và Layer 2 (Ethernet Frame) được gán như thế nào?

<details>
<summary>Đáp án</summary>

Theo chuẩn **RFC 1122 Section 3.3.1.2**:
- **Tại Layer 3 (IP Header)**:
  - `Source IP`: Giữ nguyên là địa chỉ IP của máy chủ nguồn.
  - `Destination IP`: **Bắt buộc giữ nguyên là địa chỉ IP của máy chủ đích cuối cùng** (không bao giờ đổi thành IP của Default Gateway).
- **Tại Layer 2 (Ethernet Frame)**:
  - `Source MAC`: Địa chỉ MAC card mạng của máy chủ nguồn.
  - `Destination MAC`: **Địa chỉ MAC của Default Gateway** (tìm được qua ARP).
</details>

### Câu Hỏi 7: Quy trình chuyển tiếp từng chặng (Hop-by-Hop Forwarding) tại Router gồm 4 bước chính nào?

<details>
<summary>Đáp án</summary>

Theo tiêu chuẩn **RFC 1812**, khi Default Gateway (Router) tiếp nhận khung Ethernet, nó thực hiện 4 bước:
1. **Bóc tách tầng L2 (Frame Decapsulation)**: Nhận khung có `Destination MAC` khớp với MAC giao diện của mình, kiểm tra tính toàn vẹn (FCS trailer) và bóc bỏ Ethernet header.
2. **Thẩm định và xử lý tầng L3 (IP Processing)**: Kiểm tra Header Checksum của gói tin IPv4, giảm trường `TTL` đi ít nhất 1 đơn vị và tính lại Header Checksum mới.
3. **Tra bảng định tuyến (Route Lookup)**: Kiểm tra `Destination IP` gốc trong bảng định tuyến để tìm bước nhảy tiếp theo (Next-Hop Router) hoặc giao diện cổng ra nối với mạng đích.
4. **Tái đóng gói khung L2 mới (Frame Re-encapsulation)**: Tạo khung Ethernet hoàn toàn mới với `Source MAC` là MAC cổng ra của router và `Destination MAC` là MAC của router chặng tiếp theo (hoặc máy đích cuối cùng nếu đã tới mạng đích). Gói tin IP bên trong (Source IP và Destination IP) vẫn được bảo toàn nguyên vẹn (trừ trường hợp đi qua NAT).
</details>

### Câu Hỏi 8: Khi xử lý gói tin ở tầng Layer 3 tại Router, chuyện gì xảy ra với trường Time to Live (TTL) và nếu `TTL <= 0` thì Router phản ứng thế nào?

<details>
<summary>Đáp án</summary>

- Router phải **giảm trường Time to Live (TTL) đi ít nhất 1 đơn vị** và tính toán lại **Header Checksum** của gói tin IPv4 do giá trị TTL đã thay đổi.
- Nếu sau khi giảm mà **$\text{TTL} \le 0$**, router sẽ **hủy gói tin** và gửi bản tin **`ICMP Time Exceeded`** về cho máy nguồn.
</details>

### Câu Hỏi 9: Trên Linux (`iproute2`), các lệnh `ip route show`, `ip route get 8.8.8.8` và `sudo ip route add default via 192.168.1.1 dev eth0` dùng để làm gì? Trong kết quả `ip route show`, tuyến `scope link` khác gì với tuyến `default via`?

<details>
<summary>Đáp án</summary>

- **`ip route show`**: Hiển thị toàn bộ bảng định tuyến hiện thời của Linux kernel.
- **`ip route get 8.8.8.8`**: Kiểm tra đường đi thực tế mà Linux kernel sẽ lựa chọn khi gửi gói tin tới IP `8.8.8.8`.
- **`sudo ip route add default via 192.168.1.1 dev eth0`**: Thêm tuyến đường mặc định (Default Gateway) đi qua IP `192.168.1.1` trên giao diện mạng `eth0` (và có thể xóa bằng `sudo ip route del default via 192.168.1.1 dev eth0`).
- **Phân biệt trong kết quả**:
  - Tuyến `192.168.1.0/24 dev eth0 ... scope link` là tuyến trực tiếp (**On-link**); mọi IP đích trong dải này được gửi trực tiếp qua card `eth0` bằng ARP.
  - Tuyến `default via 192.168.1.1 dev eth0` đại diện cho `0.0.0.0/0`; mọi IP không thuộc dải cục bộ (như `8.8.8.8`) sẽ được kernel đẩy tới MAC của gateway `192.168.1.1`.
</details>

### Câu Hỏi 10: Trên Windows, lệnh `route print -4` và `route add 0.0.0.0 mask 0.0.0.0 192.168.1.1 -p` dùng để làm gì, và tham số `-p` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **`route print -4`**: Hiển thị bảng định tuyến IPv4 hiện hành trên Windows (bao gồm các tuyến có `Gateway` là `On-link` cho mạng nội bộ và tuyến `0.0.0.0` trỏ tới Default Gateway).
- **`route add 0.0.0.0 mask 0.0.0.0 192.168.1.1 -p`**: Thêm tuyến đường mặc định qua Default Gateway `192.168.1.1` (có thể xóa bằng `route delete 0.0.0.0 mask 0.0.0.0`).
- **Ý nghĩa cờ `-p` (persistent)**: Đánh dấu tuyến đường này là **vĩnh viễn**, giúp cấu hình được lưu lại thay vì bị mất sau khi khởi động lại.
</details>

### Câu Hỏi 11: Điều gì xảy ra nếu cấu hình Default Gateway nằm khác subnet với máy chủ, và quy tắc bất biến khi đặt IP Default Gateway là gì?

<details>
<summary>Đáp án</summary>

- **Hậu quả**: Nếu máy chủ (ví dụ `192.168.1.10/24`) cấu hình Default Gateway nằm ngoài subnet của nó (ví dụ `192.168.2.1`), khi gửi gói tin ra ngoài, thuật toán phát hiện chính Gateway cũng nằm ở mạng từ xa — dẫn đến vòng lặp phụ thuộc (để gửi tới Gateway lại cần Gateway). Hệ điều hành sẽ báo lỗi **`Network is unreachable`** hoặc mất hoàn toàn khả năng kết nối ra ngoài.
- **Quy tắc bất biến**: Địa chỉ IP của Default Gateway bắt buộc phải là một địa chỉ IP hợp lệ **nằm ngay trong cùng mạng con (On-link subnet)** với máy chủ.
</details>

### Câu Hỏi 12: Hiện tượng định tuyến bất đối xứng (Asymmetric Routing) gây ra sự cố gì khi hạ tầng có sử dụng Stateful Firewall?

<details>
<summary>Đáp án</summary>

- **Asymmetric Routing** xảy ra khi mạng có nhiều đường ra/vào (ví dụ 2 Default Gateway): gói tin gửi đi (Outbound) rời máy chủ qua Firewall A, nhưng gói tin phản hồi (Inbound) lại quay về qua Router/Firewall B.
- Vì tường lửa theo dõi trạng thái phiên (**Stateful Inspection**), Firewall A không thấy gói phản hồi hoặc Firewall B thấy gói phản hồi (`SYN-ACK`/`ACK`) mà không thấy lượt `SYN` đi qua trước đó. Tường lửa sẽ coi gói tin là bất hợp lệ và **hủy bỏ (drop)**, làm kết nối TCP bị đứt gãy.
</details>

### Câu Hỏi 13: Tại sao trỏ Default Gateway trực tiếp vào IP vật lý của một router duy nhất lại gây rủi ro Điểm lỗi đơn yếu (SPOF), và giao thức dự phòng FHRP giải quyết vấn đề này như thế nào?

<details>
<summary>Đáp án</summary>

- **Rủi ro SPOF (Single Point of Failure)**: Nếu toàn bộ máy chủ trỏ Default Gateway vào IP vật lý của một router duy nhất, khi router đó sập nguồn hoặc gặp sự cố, toàn bộ hệ thống sẽ bị cô lập khỏi các mạng bên ngoài/Internet.
- **Giải pháp FHRP (First Hop Redundancy Protocol)**: Trong sản xuất, không trỏ vào IP vật lý của một thiết bị mà dùng các giao thức như **VRRP (RFC 5798)** hoặc **HSRP**. Hai router sẽ chia sẻ một địa chỉ **Virtual IP (VIP)** và **Virtual MAC** đại diện cho Default Gateway, giúp tự động chuyển đổi dự phòng trong suốt **dưới 1 giây** nếu một router gặp sự cố.
</details>
