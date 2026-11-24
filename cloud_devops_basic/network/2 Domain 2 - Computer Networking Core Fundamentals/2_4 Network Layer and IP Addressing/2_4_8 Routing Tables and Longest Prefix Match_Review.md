# Review: 2_4_8 Routing Tables and Longest Prefix Match

### Câu Hỏi 1: Bảng định tuyến (Routing Table) có vai trò gì và một mục định tuyến (route entry) cơ bản gồm những thành phần nào?

<details>
<summary>Đáp án</summary>

Bảng định tuyến (Routing Table) là nơi lưu trữ thông tin các tuyến đường trong bộ nhớ của thiết bị mạng (từ máy chủ Linux/Windows đến router chuyên dụng) để quyết định cách chuyển tiếp gói tin IPv4 đi vào thay vì chuyển tiếp ngẫu nhiên.

Theo RFC 1812 và hướng dẫn `ip-route(8)`, mỗi mục định tuyến gồm 4 trường thông tin cơ bản:
1. **Destination Network / Prefix (Tiền tố đích)**: Dải địa chỉ IP mạng đích kèm độ dài tiền tố (ví dụ: `192.168.1.0/24`, `10.0.0.0/8`).
2. **Next Hop / Gateway (Bước nhảy tiếp theo)**: Địa chỉ IP của router kế tiếp cần chuyển gói tin tới. Với mạng kết nối trực tiếp (Directly Connected), trường này là `onlink` hoặc hiển thị giao diện kết nối trực tiếp.
3. **Outgoing Interface (Giao diện mạng đầu ra)**: Cổng mạng vật lý hoặc logic (ví dụ: `eth0`, `ens33`, `wlan0`) dùng để gửi gói tin ra ngoài.
4. **Metric (Chi phí / Độ ưu tiên tuyến đường)**: Giá trị số nguyên thể hiện "chi phí" của tuyến đường.

</details>

### Câu Hỏi 2: Khi có nhiều tuyến đường đến cùng một dải mạng đích với cùng độ dài tiền tố (prefix length), hệ điều hành dựa vào tiêu chí nào để chọn tuyến đường?

<details>
<summary>Đáp án</summary>

Hệ điều hành sẽ dựa vào trường **Metric** và chọn tuyến đường có **Metric nhỏ nhất** (chi phí thấp nhất).

</details>

### Câu Hỏi 3: Thuật toán So khớp Tiền tố Dài nhất (Longest Prefix Match - LPM) hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

Theo tiêu chuẩn **RFC 1812 (Section 5.2.4.3)**, khi một địa chỉ IP đích đồng thời thỏa mãn nhiều dải mạng khác nhau trong bảng định tuyến, router bắt buộc phải chọn tuyến đường có **chiều dài tiền tố mạng lớn nhất (maximum prefix length / `/N`)** khớp với địa chỉ đích của gói tin.

Lý do: Tuyến đường có tiền tố dài hơn đại diện cho mạng con nhỏ hơn, chuyên biệt hơn và có độ chính xác cao hơn.

</details>

### Câu Hỏi 4: Giả sử bảng định tuyến có 4 tuyến: `0.0.0.0/0` (via `192.168.1.1`), `10.0.0.0/8` (via `10.254.0.1`), `10.1.0.0/16` (via `10.254.1.1`), và `10.1.2.0/24` (via `10.254.2.1`). Khi gói tin có IP đích `10.1.2.55` đi tới, router sẽ chuyển tiếp tới Next Hop nào?

<details>
<summary>Đáp án</summary>

Router sẽ chọn tuyến `10.1.2.0/24` và chuyển tiếp gói tin tới Next Hop **`10.254.2.1`**.

Giải thích: IP `10.1.2.55` khớp với cả 4 tuyến trong bảng (`0.0.0.0/0` khớp 0 bit, `10.0.0.0/8` khớp 8 bit, `10.1.0.0/16` khớp 16 bit, `10.1.2.0/24` khớp 24 bit). Theo thuật toán LPM, router chọn tuyến có độ dài tiền tố lớn nhất ($24 > 16 > 8 > 0$).

</details>

### Câu Hỏi 5: Tại sao tuyến đường mặc định (Default Route) `0.0.0.0/0` khớp được với mọi gói tin IPv4 nhưng luôn chỉ được chọn cuối cùng?

<details>
<summary>Đáp án</summary>

Theo **RFC 4632 (Section 5.1)**:
- **Khớp với mọi gói tin IPv4**: Tuyến `0.0.0.0/0` có chiều dài tiền tố bằng `0`, tức mặt nạ mạng gồm 32 bit `0` (`00000000.00000000.00000000.00000000`). Phép toán bitwise `AND` giữa bất kỳ địa chỉ IPv4 nào với mặt nạ toàn số `0` đều luôn cho ra `0.0.0.0`.
- **Luôn được chọn cuối cùng**: Vì độ dài tiền tố bằng `0` là ngắn nhất có thể trong IPv4, theo luật LPM nó có độ ưu tiên thấp nhất. Bất kỳ tuyến đường cụ thể nào khác (như `/8`, `/16`, `/24`, `/32`) đều có tiền tố dài hơn nên được ưu tiên trước. `0.0.0.0/0` đóng vai trò **tuyến đường cứu cánh cuối cùng (route of last resort)** (Next Hop của nó ở mạng gia đình/máy trạm chính là Default Gateway).

</details>

### Câu Hỏi 6: Sự khác nhau giữa Định tuyến tĩnh (Static Routing) và Định tuyến động (Dynamic Routing) là gì? Định tuyến động được chia thành hai nhóm giao thức chính nào?

<details>
<summary>Đáp án</summary>

- **Static Routing (Định tuyến tĩnh)**: Các mục trong bảng định tuyến được quản trị viên thiết lập thủ công bằng tay.
- **Dynamic Routing (Định tuyến động)**: Bảng định tuyến được cập nhật tự động thông qua các giao thức định tuyến động.

Các giao thức định tuyến động được chia thành 2 nhóm chính:
1. **IGP (Interior Gateway Protocol)**: Định tuyến **nội bộ** bên trong một Hệ thống Tự trị (Autonomous System - AS), đại diện tiêu biểu là **OSPF**.
2. **EGP (Exterior Gateway Protocol)**: Định tuyến **giữa các** Hệ thống Tự trị (AS) với nhau, đại diện chuẩn là **BGP-4**.

</details>

### Câu Hỏi 7: Giao thức OSPF (RFC 2328) hoạt động dựa trên cơ chế và thuật toán nào để tìm đường đi?

<details>
<summary>Đáp án</summary>

**OSPF (Open Shortest Path First)** thuộc nhóm IGP (dùng trong phạm vi mạng doanh nghiệp hoặc một AS) và hoạt động theo cơ chế **Link-State**:
1. Mọi router trong cùng một vùng (area) trao đổi trạng thái kết nối các liên kết mạng để duy trì một cơ sở dữ liệu trạng thái đường truyền đồng nhất gọi là **LSDB (Link-State Database)**.
2. Mỗi router độc lập chạy thuật toán **Dijkstra (Shortest Path First - SPF)** với chính nó làm gốc (root) trên LSDB đó để tính toán cây đường đi ngắn nhất tới tất cả các mạng đích.

</details>

### Câu Hỏi 8: Giao thức BGP-4 (RFC 4271) sử dụng cơ chế định tuyến nào và làm thế nào để phát hiện, ngăn chặn vòng lặp định tuyến (Routing Loops) giữa các AS?

<details>
<summary>Đáp án</summary>

**BGP-4 (Border Gateway Protocol Version 4)** thuộc nhóm EGP (giao thức định tuyến liên miền duy nhất vận hành Internet toàn cầu) và hoạt động theo cơ chế **Path-Vector**, quảng bá danh sách các AS mà gói tin đi qua bằng thuộc tính bắt buộc **`AS_PATH`**.

Cơ chế chống vòng lặp (**RFC 4271 Section 9.1.2.2**):
- Khi router BGP nhận được thông điệp `BGP UPDATE`, nó quét danh sách các số hiệu AS trong trường `AS_PATH`.
- Nếu phát hiện **số hiệu AS nội bộ của chính mình** đã xuất hiện trong `AS_PATH`, router xác định tuyến đường này đang bị quay vòng trở lại và **từ chối, loại bỏ ngay lập tức (reject)** tuyến đường đó.

</details>

### Câu Hỏi 9: Trên Linux sử dụng bộ công cụ hiện đại `iproute2`, ta dùng những lệnh nào để xem bảng định tuyến, kiểm tra quyết định LPM của nhân kernel cho một IP cụ thể, và thêm một tuyến đường tĩnh?

<details>
<summary>Đáp án</summary>

1. **Xem toàn bộ bảng định tuyến**: `ip route show`
2. **Kiểm tra / mô phỏng quyết định LPM của kernel cho một IP đích cụ thể**: `ip route get <IP_đích>` (ví dụ: `ip route get 10.1.2.55`)
3. **Thêm một tuyến đường tĩnh thủ công**: `sudo ip route add <prefix> via <gateway> dev <interface> metric <số>` (ví dụ: `sudo ip route add 172.16.50.0/24 via 192.168.1.254 dev eth0 metric 20`)

</details>

### Câu Hỏi 10: Trong kết quả của lệnh `route -n` trên Linux cũ và `route print` trên Windows, cờ `U`, `G` và giá trị `On-link` biểu thị điều gì?

<details>
<summary>Đáp án</summary>

- Trong `route -n` (Linux cũ):
  - Cờ **`U` (Up)**: Tuyến đường đang hoạt động.
  - Cờ **`G` (Gateway)**: Tuyến đường này phải đi qua một bộ định tuyến trung gian (Next Hop).
- Trong `route print` (Windows, ở cột Gateway):
  - **`On-link`**: Tuyến đường tới mạng kết nối trực tiếp (Directly Connected), không cần đi qua gateway trung gian.

</details>

### Câu Hỏi 11: Hiện tượng BGP Route Hijacking khai thác đặc điểm nào của thuật toán LPM và giải pháp phòng tránh tốt nhất (Best Practice) là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế bị khai thác**: Vì LPM luôn ưu tiên tiền tố dài hơn (cụ thể hơn), kẻ tấn công (hoặc một nhà mạng cấu hình nhầm) có thể quảng bá một dải mạng cụ thể hơn (ví dụ `/24`) nằm trong dải gộp lớn hơn của chủ sở hữu hợp pháp (ví dụ `/21`). Các router trên Internet theo chuẩn LPM sẽ tự động chuyển hướng lưu lượng của dải `/24` đó về kẻ tấn công.
- **Best Practice**: Triển khai cơ chế xác thực nguồn gốc định tuyến **RPKI (Resource Public Key Infrastructure)** và thực hiện lọc tiền tố (**Prefix Filtering**) nghiêm ngặt tại các router biên BGP.

</details>

### Câu Hỏi 12: Khi một máy chủ cắm 2 card mạng và cả hai cùng nhận Default Route `0.0.0.0/0` qua DHCP, vấn đề gì có thể xảy ra và cách cấu hình chuẩn là gì?

<details>
<summary>Đáp án</summary>

- **Vấn đề (Dual Default Gateway Metric Clash)**: Nếu quản trị viên không chỉ định Metric, hệ điều hành có thể đẩy nhầm lưu lượng Internet ra card quản trị nội bộ hoặc ngược lại, dẫn đến tình trạng mất mạng chập chờn.
- **Best Practice**: Chỉ duy nhất **một** card mạng nối ra Internet được cấu hình Default Route (`0.0.0.0/0`) với Metric thấp; các card mạng nội bộ chỉ nên cấu hình **Static Route** tới các dải mạng RFC 1918 cụ thể.

</details>

### Câu Hỏi 13: Rủi ro gì xảy ra nếu quản trị viên quên nhập tiền tố mạng (prefix length / subnet mask) khi tạo một tuyến đường tĩnh (ví dụ chỉ nhập `10.0.0.0` thay vì `10.0.0.0/8` hoặc `10.0.0.0/24`)?

<details>
<summary>Đáp án</summary>

Hệ điều hành có thể tự động gán tiền tố **`/32`** (tuyến đường dành riêng cho **1 host duy nhất** là `10.0.0.0`), khiến các máy khác trong dải mạng đó không thể liên lạc được qua tuyến đường này.

</details>
