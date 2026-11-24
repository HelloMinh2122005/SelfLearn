# Review: 2_4_2 IPv4 Address Classes vs CIDR

### Câu Hỏi 1: Sự chuyển dịch từ Classful Addressing sang CIDR mang lại thay đổi cốt lõi gì trong cách phân chia và cấp phát địa chỉ IPv4?

<details>
<summary>Đáp án</summary>

- **Classful Addressing (1981 - RFC 791 / RFC 1122)** sử dụng ranh giới phân chia cố định theo octet (`/8`, `/16`, `/24`), gây lãng phí trầm trọng địa chỉ (đặc biệt là Class B) và làm bùng nổ bảng định tuyến toàn cầu.
- **CIDR - Classless Inter-Domain Routing (1993 - RFC 1519 / RFC 4632)** xóa bỏ ranh giới cố định, cho phép đặt ranh giới tiền tố tùy ý (`/N` với $N$ từ `0` đến `32`), giúp cấp phát địa chỉ sát với nhu cầu thực tế của tổ chức và hỗ trợ gộp tuyến theo cấu trúc topo (Supernetting).
</details>

### Câu Hỏi 2: Trong kiến trúc Classful Addressing, 5 lớp địa chỉ IPv4 (Class A, B, C, D, E) được phân chia như thế nào về các bit đầu tiên (MSB), dải octet đầu, tiền tố/subnet mask ngầm định, số host khả dụng và mục đích sử dụng?

<details>
<summary>Đáp án</summary>

Theo đặc tả trong RFC 791 và RFC 1122, 5 lớp địa chỉ dựa vào các bit trọng số cao nhất (MSB) của octet đầu tiên được phân chia như sau:
- **Class A**: MSB là `0` | Dải IP: `1.0.0.0` – `126.255.255.255` | Tiền tố ngầm định `/8` (`255.0.0.0`) | Số host khả dụng: $2^{24}-2 = 16.777.214$ (~16 triệu) | Dùng cho mạng cực lớn (chính phủ, tập đoàn đa quốc gia).
- **Class B**: MSB là `10` | Dải IP: `128.0.0.0` – `191.255.255.255` | Tiền tố ngầm định `/16` (`255.255.0.0`) | Số host khả dụng: $2^{16}-2 = 65.534$ | Dùng cho tổ chức, trường đại học quy mô vừa và lớn.
- **Class C**: MSB là `110` | Dải IP: `192.0.0.0` – `223.255.255.255` | Tiền tố ngầm định `/24` (`255.255.255.0`) | Số host khả dụng: $2^8-2 = 254$ | Dùng cho doanh nghiệp nhỏ, mạng LAN cục bộ.
- **Class D**: MSB là `1110` | Dải IP: `224.0.0.0` – `239.255.255.255` | Tiền tố & host: N/A | Dùng cho định tuyến đa hướng (Multicast).
- **Class E**: MSB là `1111` | Dải IP: `240.0.0.0` – `255.255.255.255` | Tiền tố & host: N/A | Dành riêng cho thử nghiệm (Experimental/Reserved).
</details>

### Câu Hỏi 3: Vì sao dải địa chỉ `127.0.0.0/8` không nằm trong danh sách địa chỉ Class A cấp phát thông thường?

<details>
<summary>Đáp án</summary>

Theo RFC 1122 Section 3.2.1.3, dải `127.0.0.0/8` không được gán cho Class A thông thường mà được quy chuẩn dành riêng làm địa chỉ **Loopback** nội bộ của host (ví dụ `127.0.0.1/8` trên giao diện `lo`).
</details>

### Câu Hỏi 4: Hai động lực kỹ thuật cấp bách nào vào đầu thập niên 1990 đã thúc đẩy sự ra đời của CIDR (theo RFC 4632 Section 2)?

<details>
<summary>Đáp án</summary>

1. **Sự cạn kiệt nhanh chóng của không gian địa chỉ Class B (Class B Exhaustion)**:
   - Các tổ chức vừa và lớn thường cần từ vài trăm đến vài nghìn địa chỉ host. Class C chỉ có tối đa `254` host nên quá nhỏ, buộc họ phải xin cấp phát Class B (`65.534` host).
   - Ví dụ một công ty chỉ cần `2.000` máy tính nhưng nhận nguyên mạng Class B sẽ bỏ hoang hơn `63.000` địa chỉ, không thể chia sẻ cho tổ chức khác. Vì toàn cầu chỉ có tổng cộng $16.384$ mạng Class B ($2^{14}$), không gian này nhanh chóng cạn kiệt.
2. **Bùng nổ bảng định tuyến toàn cầu (Routing Table Explosion)**:
   - Khi không xin được Class B, các tổ chức được cấp hàng chục dải Class C rời rạc.
   - Các core router trên Internet phải lưu trữ và quảng bá riêng lẻ từng tiền tố Class C đó, khiến số lượng mục định tuyến (routing entries) tăng theo hàm số mũ, vượt quá dung lượng bộ nhớ RAM và năng lực xử lý CPU của router thời bấy giờ.
</details>

### Câu Hỏi 5: Trong cú pháp tiền tố CIDR (`Prefix / N` với $0 \le N \le 32$), giá trị $N$ và $(32 - N)$ biểu thị điều gì?

<details>
<summary>Đáp án</summary>

Theo RFC 4632 Section 3.1, một khối CIDR gồm 4 octet ở dạng thập phân có dấu chấm (dotted-decimal), theo sau bởi dấu `/` và số nguyên $N$ ($0 \le N \le 32$):
- **$N$ (Prefix Length - Chiều dài tiền tố mạng)**: Thể hiện số bit `1` liên tiếp tính từ bit trọng số cao nhất (MSB) dùng để nhận diện phần mạng.
- **$(32 - N)$**: Là số bit còn lại dành cho không gian địa chỉ định danh **host**.
</details>

### Câu Hỏi 6: Với một giao diện mạng có cấu hình CIDR là `10.0.4.50/22`, hãy cho biết số bit dành cho phần host, tổng số địa chỉ IP và số lượng host khả dụng của dải mạng này?

<details>
<summary>Đáp án</summary>

- Tiền tố mạng là `/22` (22 bit đầu là phần mạng).
- Số bit dành cho phần host là: $32 - 22 = 10\text{ bit}$.
- Tổng số địa chỉ IP trong khối `/22`: $2^{10} = 1.024\text{ địa chỉ}$.
- Số địa chỉ host khả dụng: $2^{10} - 2 = 1.022\text{ host}$ (trừ đi địa chỉ mạng và địa chỉ broadcast `10.0.7.255`).
</details>

### Câu Hỏi 7: Cơ chế Route Aggregation (Gộp tuyến / Supernetting) trong CIDR hoạt động như thế nào và mang lại lợi ích gì cho các router trên Internet?

<details>
<summary>Đáp án</summary>

Theo RFC 4632 Section 4.1:
- **Cách hoạt động**: Nhiều tiền tố mạng con liền kề nằm trong cùng một vùng topo được tóm lược lại thành một tiền tố ngắn hơn duy nhất trong bảng định tuyến.
- **Ví dụ trong bài học**: 4 dải mạng `/24` liền kề (`198.51.100.0/24`, `198.51.101.0/24`, `198.51.102.0/24`, `198.51.103.0/24`) được ISP Edge Router gộp thành một mục duy nhất `198.51.100.0/22` để quảng bá qua BGP lên Global Internet Core Routers.
- **Lợi ích**: Giảm mạnh số lượng mục trong bảng định tuyến (giảm tới 75% số entry trong ví dụ trên), ngăn chặn bùng nổ bảng định tuyến toàn cầu và bảo vệ RAM, CPU của core router.
</details>

### Câu Hỏi 8: Khi kiểm tra địa chỉ IP và mặt nạ mạng trên máy tính, sự khác biệt về cách hiển thị giữa lệnh `ip addr show` (Linux hiện đại) với `ifconfig` (Linux cũ) và `ipconfig` (Windows) là gì?

<details>
<summary>Đáp án</summary>

- **`ip addr show`** (thuộc bộ công cụ `iproute2` trên Linux hiện đại): Hiển thị trực tiếp tiền tố CIDR dạng `/N` ngay sau địa chỉ IP (ví dụ `192.168.10.15/24`, `10.0.4.50/22`).
- **`ifconfig`** (gói `net-tools` cũ trên Linux) và **`ipconfig`** (trên Windows): Thường hiển thị thông tin mạng con dưới dạng **Subnet Mask thập phân** (ví dụ `Subnet Mask: 255.255.255.0`, tương đương hoàn toàn với ký hiệu CIDR `/24`).
</details>

### Câu Hỏi 9: "Cạm bẫy Mặc định theo Lớp" (Classful Assumption Fallacy) là gì và Best Practice nào giúp tránh lỗi này trong vận hành thực tế?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Thói quen gọi nhầm hoặc ngầm hiểu một mạng `/24` là "Class C" hay `/16` là "Class B". Thực tế khái niệm Class đã lỗi thời từ năm 1993; ví dụ dải `10.0.0.0/24` có IP nằm trong không gian Class A cũ nhưng lại dùng tiền tố định tuyến `/24`.
- **Best Practice**: Luôn chỉ định rõ ràng địa chỉ IP đi kèm tiền tố CIDR `/N` (ví dụ `10.0.0.0/24`, `172.16.5.0/26`). Tuyệt đối không cấu hình địa chỉ IP đơn lẻ mà thiếu mặt nạ mạng hoặc chiều dài tiền tố.
</details>

### Câu Hỏi 10: Để thực hiện Supernetting thành công (ví dụ gộp 4 dải `/24` thành `/22`), các dải mạng phải đáp ứng điều kiện gì và hậu quả nào xảy ra nếu gộp sai?

<details>
<summary>Đáp án</summary>

- **Điều kiện bắt buộc**: Các dải mạng con phải **liền kề nhau về mặt số học nhị phân** và bắt đầu tại một bội số chẵn của kích thước khối (Boundary Alignment).
- **Hậu quả nếu gộp sai**: Nếu gom các dải rời rạc (ví dụ chỉ có `198.51.100.0/24` và `198.51.102.0/24`), router sẽ vô tình định tuyến cả dải nằm giữa (`198.51.101.0/24`) đi sai hướng, dẫn đến mất mát lưu lượng (**Blackhole routing**) hoặc khiến dịch vụ hoạt động chập chờn.
</details>

### Câu Hỏi 11: Trong thiết kế mạng Private (như VPC trên AWS, Azure, GCP), việc cấp phát các dải IP quá lớn gây ra cạm bẫy gì và nên áp dụng Best Practice nào?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Cấp phát các dải quá lớn (như `/16`) cho một dịch vụ nhỏ chỉ cần vài chục node sẽ làm cạn kiệt nhanh chóng không gian địa chỉ riêng của doanh nghiệp, gây khó khăn khi cần kết nối VPN hoặc Peering đa cụm về sau.
- **Best Practice**: Áp dụng triệt để CIDR để chia nhỏ subnet hợp lý (như `/24`, `/26`, `/28`) theo đúng quy mô tải dự kiến của từng dịch vụ.
</details>
