# Review: 2_4_3 Subnet Masking and IP Arithmetic

### Câu Hỏi 1: Tại sao một địa chỉ IPv4 32-bit bắt buộc phải đi kèm với Subnet Mask (hoặc tiền tố CIDR), và hai phần của một địa chỉ IPv4 khi phân mạng con gồm những gì?

<details>
<summary>Đáp án</summary>

- Một địa chỉ IPv4 32-bit không bao giờ đứng độc lập để xác định giao diện mạng. Hệ điều hành và các thiết bị định tuyến cần **Subnet Mask** hoặc **tiền tố CIDR (Prefix Length)** đi kèm để nhận diện được phạm vi của mạng cục bộ (**Local Subnet**) và ranh giới định tuyến tới các mạng từ xa (**Remote Networks**).
- Cấu trúc địa chỉ IPv4 gồm 2 phần trên tổng 32 bit:
  1. **Network Prefix ($N$ bits đầu)**: Xác định danh tính của mạng con (cố định trong cùng một Subnet).
  2. **Host Portion ($32 - N$ bits sau)**: Xác định giao diện máy chủ cụ thể (duy nhất trong Subnet đó).

</details>

### Câu Hỏi 2: Cấu tạo nhị phân của Subnet Mask như thế nào, và phép toán Bitwise AND giúp trích xuất Network ID bằng cơ chế gì?

<details>
<summary>Đáp án</summary>

- **Cấu tạo của Subnet Mask** (theo RFC 4632 và RFC 1122): Là một chuỗi 32-bit gồm một dãy liên tục các bit `1` ở phần đầu (đại diện cho Network Prefix dài $N$ bit) nối tiếp bởi một dãy liên tục các bit `0` ở phần sau (đại diện cho Host Portion dài $32 - N$ bit).
- **Cơ chế phép toán Bitwise AND** giữa địa chỉ IP và Subnet Mask:
  - Bảng chân lý AND: $1 \text{ AND } 1 = 1$; $1 \text{ AND } 0 = 0$; $0 \text{ AND } 1 = 0$; $0 \text{ AND } 0 = 0$.
  - Mọi bit ở phần Network Prefix ($N$ bit đầu) khi AND với bit `1` của Mask sẽ **giữ nguyên giá trị ban đầu**.
  - Mọi bit ở phần Host ($32 - N$ bit sau) khi AND với bit `0` của Mask sẽ **bị xóa hoàn toàn về `0`**.
  - Kết quả thu được chính xác là **Network ID**.

</details>

### Câu Hỏi 3: Trong một mạng con tiêu chuẩn ($N < 31$), Network ID và Broadcast Address được xác định như thế nào? Có những loại Broadcast Address nào và quy tắc cấm liên quan đến địa chỉ Broadcast là gì?

<details>
<summary>Đáp án</summary>

- **Network ID (Địa chỉ mạng)**: Là địa chỉ mà **toàn bộ các bit của phần host đều bằng `0`** nhị phân. Địa chỉ này đại diện cho toàn bộ phân đoạn mạng con trong bảng định tuyến và không bao giờ được gán cho bất kỳ giao diện máy chủ nào.
- **Broadcast Address (Địa chỉ quảng bá)**: Là địa chỉ mà **toàn bộ các bit của phần host đều bằng `1`** nhị phân. Theo RFC 1122 Section 3.2.1.3, có hai loại:
  - **Directed Broadcast** (`{<Network-number>, -1}`): Địa chỉ quảng bá tới một mạng con xác định từ xa (ví dụ: `192.168.1.191` trong subnet `192.168.1.128/26`).
  - **Limited Broadcast** (`{-1, -1}` tức `255.255.255.255`): Quảng bá cục bộ tới toàn bộ thiết bị trong cùng liên kết L2 và không được router định tuyến ra ngoài.
- **Quy tắc tuyệt đối**: Địa chỉ quảng bá **tuyệt đối không bao giờ được sử dụng làm địa chỉ nguồn (`Source IP Address`)** trong bất kỳ gói tin IP datagram nào (vì nếu bên nhận phản hồi về địa chỉ broadcast sẽ gây khuếch đại lưu lượng vô tận / Broadcast Storm).

</details>

### Câu Hỏi 4: Công thức tính Tổng số địa chỉ IP, Số lượng địa chỉ IP khả dụng (Usable Hosts) và Dải IP khả dụng cho mạng con tiêu chuẩn ($N \le 30$) là gì?

<details>
<summary>Đáp án</summary>

Với tiền tố độ dài $N$ ($N \le 30$), số bit phần host là $32 - N$:
- **Tổng số địa chỉ IP trong mạng con**:
  $$\text{Total IPs} = 2^{(32 - N)}$$
- **Số lượng địa chỉ IP máy chủ khả dụng (Usable Hosts)**:
  $$\text{Usable Hosts} = 2^{(32 - N)} - 2$$
  *(Phải trừ đi 2 địa chỉ dành riêng là **Network ID** và **Broadcast ID**)*.
- **Dải IP khả dụng**: Bắt đầu từ $\text{Network ID} + 1$ đến $\text{Broadcast Address} - 1$.

</details>

### Câu Hỏi 5: Dựa vào ví dụ `192.168.1.130/26` trong bài học, hãy nêu Subnet Mask (thập phân), số bit host, Network ID, Broadcast Address, số IP khả dụng và dải địa chỉ host khả dụng?

<details>
<summary>Đáp án</summary>

Với địa chỉ `192.168.1.130/26`:
- **Subnet Mask**: `255.255.255.192` (26 bit `1` liên tục và 6 bit `0` ở cuối).
- **Số bit Host**: $32 - 26 = 6$ bits.
- **Tổng số IP**: $2^6 = 64$.
- **Số IP khả dụng**: $64 - 2 = 62$.
- **Network ID** (đặt 6 bit host về `0`): `192.168.1.128`.
- **Broadcast Address** (đặt 6 bit host về `1`): `192.168.1.191`.
- **Dải host khả dụng**: `192.168.1.129` (First Host) đến `192.168.1.190` (Last Host). Địa chỉ `192.168.1.130` là host khả dụng thứ 2 trong subnet.

</details>

### Câu Hỏi 6: Sau khi thực hiện phép toán Bitwise AND giữa địa chỉ IP đích và Subnet Mask, thiết bị mạng dựa vào bước kiểm tra nào để quyết định gửi gói tin trực tiếp qua Layer 2 hay đẩy tới Default Gateway?

<details>
<summary>Đáp án</summary>

Thiết bị sẽ lấy **Network ID kết quả** vừa trích xuất được và **so sánh với Local Network ID** (mạng con cục bộ của chính thiết bị đó):
- Nếu **khớp nhau**: Gói tin thuộc **cùng mạng con (Local Subnet)** $\rightarrow$ gửi trực tiếp qua Layer 2 (sử dụng ARP/Frame).
- Nếu **khác nhau**: Gói tin thuộc **mạng từ xa (Remote Network)** $\rightarrow$ chuyển tiếp gói tin tới địa chỉ MAC của **Default Gateway**.

</details>

### Câu Hỏi 7: Tiền tố `/31` theo chuẩn RFC 3021 có đặc điểm gì khác biệt và được dùng để giải quyết vấn đề gì so với `/30`?

<details>
<summary>Đáp án</summary>

- **Subnet Mask của `/31`**: `255.255.255.254` (1 bit host, tổng 2 địa chỉ IP).
- **Điểm khác biệt**: Theo RFC 3021 Section 2.1, trên các liên kết điểm-nối-điểm (**Point-to-Point links**) giữa hai router, **cả hai địa chỉ đều được diễn giải là địa chỉ host khả dụng** (2 usable hosts, không trừ 2 cho Network ID và Broadcast ID).
- **Vấn đề giải quyết**: Trước đây, dùng `/30` (4 IP, chỉ dùng được 2 IP) cho liên kết giữa 2 router gây lãng phí $50\%$ không gian địa chỉ cho Network ID và Broadcast ID. Dùng `/31` giúp tận dụng trọn vẹn cả 2 địa chỉ IP và tiết kiệm địa chỉ IPv4 trên hạ tầng backbone.

</details>

### Câu Hỏi 8: Tiền tố `/32` theo chuẩn RFC 1812 có ý nghĩa gì, tương ứng với Subnet Mask nào và thường dùng cho mục đích gì?

<details>
<summary>Đáp án</summary>

- **Subnet Mask**: `255.255.255.255` (với $N = 32$, số bit phần host là $32 - 32 = 0$, tổng 1 địa chỉ IP).
- **Ý nghĩa**: Theo RFC 1812 Section 5.2.4.3, `/32` là **Host Route** — chỉ định một tuyến đường cụ thể trỏ trực tiếp tới một máy chủ duy nhất (*route to a specific end system*).
- **Mục đích sử dụng điển hình**: Dùng cho giao diện **Loopback (`lo`)** của router hoặc các **quy tắc tường lửa (Firewall Rule)** chỉ định một IP độc lập.

</details>

### Câu Hỏi 9: Khi kiểm tra và tính toán thông số mạng con trong thực hành bằng Python `ipaddress`, lệnh Linux `ip` và Windows `ipconfig`, các công cụ này cho biết những thông tin gì?

<details>
<summary>Đáp án</summary>

- **Python module `ipaddress`** (tuân thủ RFC 4632): Dùng `ipaddress.ip_interface('192.168.1.130/26')` và `iface.network` để trích xuất tự động `netmask` (Subnet Mask), `prefixlen` (Prefix CIDR), `network_address` (Network ID), `broadcast_address`, `num_addresses` (tổng số IP) và danh sách các địa chỉ host khả dụng qua `net.hosts()`.
- **Linux (`ip -4 addr show eth0`)**: Hiển thị địa chỉ IP kèm tiền tố CIDR (`inet 192.168.1.130/26`) và địa chỉ quảng bá tự động tính toán (`brd 192.168.1.191`).
- **Windows (`ipconfig`)**: Hiển thị địa chỉ IPv4, `Subnet Mask` ở định dạng thập phân có dấu chấm (Dotted-Decimal, ví dụ `255.255.255.192`) và `Default Gateway`.

</details>

### Câu Hỏi 10: Điều gì xảy ra nếu quản trị viên gán nhầm Network ID / Broadcast ID cho máy chủ hoặc cấu hình sai lệch Subnet Mask (Subnet Mask Mismatch) giữa hai máy chủ trên cùng một Switch?

<details>
<summary>Đáp án</summary>

1. **Gán nhầm Network ID hoặc Broadcast ID cho máy chủ**: Hệ điều hành sẽ từ chối cấu hình hoặc gây hiện tượng dị thường khiến máy chủ không thể gửi/nhận gói tin unicast thông thường hoặc phản hồi sai lệch với các gói tin quảng bá.
2. **Lỗi mặt nạ mạng con bất đối xứng (Subnet Mask Mismatch)**:
   - Ví dụ: Trên cùng Switch, Host A cấu hình `192.168.1.10/24` và Host B cấu hình `192.168.1.200/26`.
   - Khi Host A gửi tới Host B: A dùng Mask `/24` nên thấy B thuộc cùng subnet `192.168.1.0/24` $\rightarrow$ gửi trực tiếp qua ARP.
   - Khi Host B phản hồi lại Host A: B dùng Mask `/26` nên thấy A (`192.168.1.10`) nằm ngoài subnet của B (`192.168.1.192/26`) $\rightarrow$ B đẩy gói tin phản hồi tới **Default Gateway**. Nếu Default Gateway không xử lý được, kết nối hai chiều bị gián đoạn.

</details>
