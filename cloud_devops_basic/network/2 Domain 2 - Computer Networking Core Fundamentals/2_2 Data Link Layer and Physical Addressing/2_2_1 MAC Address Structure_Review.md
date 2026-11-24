# Review: 2_2_1 MAC Address Structure

### Câu Hỏi 1: Địa chỉ MAC (EUI-48) là gì, hoạt động ở tầng nào và có vai trò gì trong mạng?

<details>
<summary>Đáp án</summary>

Địa chỉ MAC (Media Access Control Address), còn gọi theo chuẩn định danh IEEE là **EUI-48** (Extended Unique Identifier 48-bit), là địa chỉ vật lý hoạt động tại **Tầng liên kết dữ liệu (Layer 2 - Data Link Layer)** trong mô hình OSI/TCP-IP. Vai trò của nó là định danh duy nhất giao tiếp mạng (**NIC - Network Interface Card**) trong cùng một miền quảng bá (**broadcast domain**).
</details>

### Câu Hỏi 2: Một địa chỉ MAC Ethernet tiêu chuẩn có độ dài bao nhiêu bit và thường được biểu diễn dưới dạng nào?

<details>
<summary>Đáp án</summary>

Theo tiêu chuẩn RFC 7042 và đặc tả IEEE 802, một địa chỉ MAC Ethernet tiêu chuẩn có độ dài chính xác **48 bits** (tương đương **6 octets / 6 bytes**). Nó thường được biểu diễn dưới dạng **12 chữ số thập lục phân (hexadecimal)** phân tách bằng dấu hai chấm hoặc dấu gạch nối (ví dụ: `00:1A:2B:3C:4D:5E` hoặc `00-1A-2B-3C-4D-5E`).
</details>

### Câu Hỏi 3: Địa chỉ MAC 48-bit được chia thành hai phần nào và mỗi phần có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Địa chỉ MAC 48-bit được chia thành 2 phần, mỗi phần 24 bits (3 octets):

1. **OUI (Organizationally Unique Identifier) — 24 bits đầu (3 octets)**: Được cấp phát độc quyền bởi cơ quan quản lý đăng ký IEEE (IEEE Registration Authority) cho nhà sản xuất phần cứng (như Intel, Realtek, Cisco, Apple...), giúp xác định danh tính đơn vị sản xuất card mạng trên phạm vi toàn cầu.
2. **Phần định danh mở rộng (Extension Identifier / NIC Specific) — 24 bits cuối (3 octets)**: Do chính nhà sản xuất sở hữu mã OUI tự đánh số và gán duy nhất cho từng cổng giao tiếp/card mạng khi xuất xưởng. Với 24 bits, mỗi mã OUI có thể gán tối đa $2^{24} = 16.777.216$ địa chỉ duy nhất.
</details>

### Câu Hỏi 4: Bit I/G (Individual / Group) nằm ở vị trí nào, giá trị 0 và 1 mang ý nghĩa gì và có quy chuẩn gì đối với Source MAC Address?

<details>
<summary>Đáp án</summary>

- **Vị trí**: Bit I/G là bit có trọng số thấp nhất (**LSB - bit 0**) của **Octet 0** (byte đầu tiên) theo thứ tự truyền tín hiệu trên dây.
- **Ý nghĩa**:
  - **`0` (Individual Address - Unicast)**: Gói tin chỉ được gửi đích danh tới một giao tiếp mạng duy nhất trên đường truyền.
  - **`1` (Group Address - Multicast hoặc Broadcast)**: Gói tin được gửi cho một nhóm giao tiếp hoặc gửi cho toàn bộ các trạm trong mạng nội bộ.
- **Quy chuẩn cho Source MAC Address**: Trong địa chỉ MAC nguồn, bit I/G **luôn luôn được bảo lưu và phải bằng `0`**, vì một khung truyền dữ liệu chỉ có thể bắt nguồn từ một card mạng cá nhân đơn lẻ, không thể có địa chỉ nguồn là multicast hay broadcast.
</details>

### Câu Hỏi 5: Bit U/L (Universal / Local) nằm ở vị trí nào và phân biệt hai loại địa chỉ MAC nào?

<details>
<summary>Đáp án</summary>

- **Vị trí**: Bit U/L là **bit thứ hai (bit 1)** kế tiếp bit I/G trong **Octet 0** theo thứ tự truyền tín hiệu.
- **Ý nghĩa**:
  - **`0` (Universally Administered Address)**: Địa chỉ được quản trị toàn cầu, đảm bảo tính duy nhất trên toàn thế giới dựa trên mã OUI do IEEE cấp phát (thường thấy ở card mạng vật lý từ nhà sản xuất).
  - **`1` (Locally Administered Address)**: Địa chỉ do quản trị viên hệ thống hoặc phần mềm ảo hóa (hypervisor, container engine) tự định nghĩa và quản trị cục bộ trong mạng nội bộ, không phụ thuộc vào đăng ký với IEEE.
</details>

### Câu Hỏi 6: Theo RFC 7042 và IEEE 802.3, thứ tự truyền các octet và các bit trên đường cáp Ethernet diễn ra như thế nào, và điều này mang lại lợi ích gì cho NIC?

<details>
<summary>Đáp án</summary>

- **Thứ tự truyền**: Trên cáp Ethernet, các octet được truyền lần lượt từ **octet 0 đến octet 5**. Bên trong từng octet, dữ liệu được đưa lên đường truyền vật lý theo thứ tự **Least Significant Bit (LSB) first** (bit có trọng số nhỏ nhất truyền trước, bit có trọng số lớn nhất truyền sau).
- **Lợi ích cho NIC**: Vì quy tắc LSB first, **bit I/G** là bit vật lý đầu tiên xuất hiện trên đường cáp Ethernet, giúp card mạng nhận biết ngay tức thì khung truyền đến là Unicast hay Multicast/Broadcast mà không cần đợi nhận toàn bộ 48 bits.
</details>

### Câu Hỏi 7: Địa chỉ Broadcast trong mạng Ethernet có giá trị là gì và các thiết bị trong mạng L2 xử lý ra sao khi nhận được khung có Destination MAC này?

<details>
<summary>Đáp án</summary>

- **Giá trị**: Địa chỉ Broadcast là **`FF:FF:FF:FF:FF:FF`**, tức toàn bộ 48 bits đều mang giá trị `1` (trong đó bit I/G bằng `1`, nên đây là địa chỉ nhóm).
- **Cách xử lý**: Khi nhận được khung có Destination MAC là `FF:FF:FF:FF:FF:FF`, **mọi thiết bị trong cùng miền mạng L2 (broadcast domain)** đều phải tiếp nhận khung tin và chuyển lên tầng trên xử lý.
</details>

### Câu Hỏi 8: Địa chỉ IPv4 Multicast MAC sử dụng dải địa chỉ nào và được ánh xạ từ địa chỉ IPv4 Multicast như thế nào?

<details>
<summary>Đáp án</summary>

Theo **RFC 1112 & RFC 7042**:
- **Dải địa chỉ**: Từ **`01:00:5E:00:00:00`** đến **`01:00:5E:7F:FF:FF`** (byte đầu tiên `01` có dạng nhị phân `0000 0001`, tức bit I/G = `1`).
- **Cơ chế ánh xạ**: Đúng **23 bits có trọng số thấp nhất** của địa chỉ IPv4 Multicast (Class D) được sao chép và ghép vào 23 bits thấp nhất của địa chỉ MAC `01:00:5E`.
</details>

### Câu Hỏi 9: Địa chỉ IPv6 Multicast MAC sử dụng tiền tố nào và ánh xạ các bit từ địa chỉ IPv6 Multicast như thế nào?

<details>
<summary>Đáp án</summary>

Theo **RFC 2464 & RFC 7042**:
- **Tiền tố cố định**: **`33:33:xx:xx:xx:xx`**.
- **Cơ chế ánh xạ**: **32 bits có trọng số thấp nhất** của địa chỉ IPv6 Multicast được sao chép nguyên vẹn vào 32 bits (**4 octets cuối**) của địa chỉ MAC.
</details>

### Câu Hỏi 10: Trên Linux, lệnh nào trong gói `iproute2` dùng để kiểm tra địa chỉ MAC, và các thông tin `link/ether`, `brd`, `<BROADCAST,MULTICAST>` trong kết quả có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Công cụ chuẩn trong gói `iproute2` là **`ip link show`** (hoặc `ip address`). Trong kết quả đầu ra:
- **`link/ether <MAC>`**: Hiển thị địa chỉ MAC 48-bit của giao diện Ethernet (3 octets đầu là mã OUI, 3 octets cuối là mã NIC Extension).
- **`brd ff:ff:ff:ff:ff:ff`**: Địa chỉ Broadcast tương ứng của giao diện Ethernet (toàn bộ 48 bits là `1`).
- **Cờ `<BROADCAST,MULTICAST>`**: Báo hiệu phần cứng card mạng hỗ trợ tiếp nhận khung quảng bá broadcast và các nhóm multicast.
</details>

### Câu Hỏi 11: Làm thế nào để xác định giá trị bit I/G và U/L từ octet đầu tiên của địa chỉ MAC (ví dụ `52:54:00:12:34:56`)?

<details>
<summary>Đáp án</summary>

Ta chuyển đổi octet đầu tiên (hệ hex) sang hệ nhị phân 8-bit và kiểm tra 2 bit có trọng số thấp nhất (bit 0 là I/G, bit 1 là U/L).

Với ví dụ `52` (hex):
- `5` = `0101`, `2` = `0010` → ghép lại thành **`0101 0010`**.
- **Bit 0 (LSB - I/G) = `0`**: Địa chỉ **Individual (Unicast)**.
- **Bit 1 (U/L) = `1`**: Địa chỉ **Locally Administered** (được trình ảo hóa tạo cục bộ, không phải địa chỉ vật lý cứng ghi từ nhà máy).
</details>

### Câu Hỏi 12: Hiện tượng chồng lấn địa chỉ Multicast (Multicast MAC Aliasing / Overlap) xảy ra do nguyên nhân nào và gây hậu quả gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Không gian địa chỉ IPv4 Multicast (RFC 1112) có $2^{28}$ nhóm khả dụng (do 4 bit đầu cố định là `1110`), nhưng chỉ có **23 bits** được ánh xạ vào MAC Multicast `01:00:5E`. Do $28 - 23 = 5$ bits bị mất khi ánh xạ, có tới **32 địa chỉ IPv4 Multicast khác nhau cùng ánh xạ về duy nhất 1 địa chỉ MAC L2**.
- **Hậu quả**: Nếu hai ứng dụng trên cùng VLAN dùng hai IP Multicast bị trùng lặp MAC, card mạng của máy chủ sẽ nhận cả hai luồng lưu lượng và phải nhờ **CPU Tầng 3 lọc bỏ**, gây lãng phí tài nguyên CPU.
</details>

### Câu Hỏi 13: Hai rủi ro phổ biến liên quan đến địa chỉ MAC trong môi trường ảo hóa và vận hành sản xuất là gì, và cách phòng tránh ra sao?

<details>
<summary>Đáp án</summary>

1. **Xung đột MAC cục bộ trong môi trường ảo hóa & Container**:
   - *Rủi ro*: VM (KVM, VMware) hoặc Container (Docker/Kubernetes dùng MACVLAN) thường sinh MAC ngẫu nhiên với `U/L = 1`. Nếu thiếu kiểm tra trùng lặp trong cùng broadcast domain, hai VM/Container có thể trùng MAC khiến Switch bị **nhảy MAC (MAC Flapping)** và làm tê liệt kết nối mạng.
2. **Giả mạo địa chỉ MAC (MAC Spoofing)**:
   - *Rủi ro*: Vì địa chỉ MAC không được mã hóa ở phần đầu khung Ethernet L2, kẻ tấn công trong cùng mạng cục bộ có thể đổi MAC của mình thành MAC của Default Gateway hoặc máy chủ nạn nhân.
   - *Cách phòng tránh*: Bật tính năng kiểm tra chống giả mạo MAC (**MAC Anti-Spoofing / Port Security**) trên Switch doanh nghiệp và nền tảng Cloud (như AWS Security Groups, Azure Network Security Groups) để khóa cổng nếu phát hiện khung truyền mang MAC không hợp lệ.
</details>
