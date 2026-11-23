# Ôn Tập: 6_1_9 Container Networking Basics

### Câu Hỏi 1: Network namespace là gì và vì sao hai container cùng chạy Nginx lắng nghe cổng 80 trên một máy chủ lại không xung đột với nhau?

<details>
<summary>Đáp án</summary>

Network namespace là một bản sao riêng biệt của toàn bộ "ngăn xếp mạng" (network stack), bao gồm danh sách interface (`lo`, `eth0`...), địa chỉ IP, bảng route, luật firewall và danh sách cổng đang lắng nghe. Hai namespace khác nhau không nhìn thấy interface của nhau. Vì mỗi container có network namespace riêng nên cổng 80 của container A và cổng 80 của container B nằm trong hai không gian tách biệt, không xung đột với nhau.
</details>

### Câu Hỏi 2: Khi một container mới được tạo ra với network namespace riêng nhưng chưa nối ra ngoài, nó có interface mạng nào và giao tiếp được với ai?

<details>
<summary>Đáp án</summary>

Container mới sinh ra trong network namespace cô lập ban đầu chỉ có interface `lo` (loopback), nên nó chỉ có thể tự nói chuyện với chính mình và chưa thể giao tiếp ra mạng bên ngoài hoặc với container khác.
</details>

### Câu Hỏi 3: Vì sao runtime không cấp trực tiếp card mạng vật lý của máy chủ (ví dụ `enp3s0`) cho container sử dụng?

<details>
<summary>Đáp án</summary>

Một thiết bị mạng vật lý chỉ có thể thuộc về **đúng một** network namespace tại một thời điểm (mặc định là của máy chủ). Nếu chuyển card mạng thật sang namespace của container thì máy chủ sẽ mất card mạng đó, và trên một máy chủ có hàng chục container thì không thể chia card vật lý cho từng container. Thay vào đó, card vật lý vẫn ở lại máy chủ và mỗi container được cấp một thiết bị mạng ảo để máy chủ chuyển tiếp gói tin giữa hai bên.
</details>

### Câu Hỏi 4: Thiết bị `veth` hoạt động như thế nào để nối container ra mạng bên ngoài?

<details>
<summary>Đáp án</summary>

`veth` là thiết bị Ethernet ảo luôn được tạo **theo cặp** nối trực tiếp với nhau, hoạt động như một đường hầm (sợi cáp mạng ảo có hai đầu) giữa hai network namespace: gói tin đi vào đầu này sẽ lập tức xuất hiện ở đầu kia. Khi tạo container ở chế độ bridge, runtime giữ một đầu `veth` ở network namespace của máy chủ (thường nối vào `bridge`) và đưa đầu còn lại vào network namespace của container (thường đặt tên là `eth0`).
</details>

### Câu Hỏi 5: Khi tự thực hành tạo network namespace và cặp `veth` bằng lệnh `ip`, điều gì xảy ra với cặp `veth` khi ta chạy `sudo ip netns del ns1`?

<details>
<summary>Đáp án</summary>

Khi xóa network namespace `ns1`, đầu `veth` nằm bên trong `ns1` (ví dụ `veth-ns`) sẽ bị xóa theo, và đầu còn lại của cặp `veth` ở phía máy chủ (`veth-host`) cũng tự động biến mất theo vì một cặp `veth` luôn đi liền với nhau.
</details>

### Câu Hỏi 6: Làm thế nào để kiểm tra các interface mạng bên trong network namespace của một container đang chạy bằng `nsenter`?

<details>
<summary>Đáp án</summary>

Đầu tiên lấy PID của tiến trình container từ `podman inspect <tên-container>`, sau đó chạy `sudo nsenter -t <PID> -n ip addr` để vào đúng network namespace (`-n`) của container đó và xem các interface (như `lo` và đầu `veth` phía container). Ở phía máy chủ, có thể dùng `ip -br link` để quan sát đầu `veth` tương ứng (khi dùng mạng bridge).
</details>

### Câu Hỏi 7: Trong Podman, chế độ mạng mặc định của container rootful và rootless khác nhau như thế nào, và vì sao có sự khác biệt đó?

<details>
<summary>Đáp án</summary>

- **Rootful** (chạy bằng `root` hoặc `sudo`): mặc định dùng **`bridge`**, tạo network stack trên bridge mặc định cùng cặp `veth` và luật firewall.
- **Rootless** (chạy bằng user thường, không `sudo`): mặc định dùng **`pasta`**, tạo network stack ở user-mode (chỉ hỗ trợ rootless).

Nguyên nhân là thao tác tạo bridge, tạo `veth` trong namespace của máy chủ và thêm luật firewall đòi hỏi quyền quản trị mạng mà user thường không có; vì vậy rootless dùng `pasta` chạy hoàn toàn ở user-mode thay thế.
</details>

### Câu Hỏi 8: Chế độ `pasta` xử lý địa chỉ IP, route và tên interface của container như thế nào, và cần lưu ý gì khi debug mạng container rootless?

<details>
<summary>Đáp án</summary>

Theo mặc định của `pasta`, địa chỉ IPv4/IPv6, bảng route và tên interface bên trong container được **sao chép từ máy chủ** (khác với bridge là cấp IP thuộc dải riêng của bridge). Khi debug mạng của container rootless dùng `pasta`, không nên tìm cặp `veth` hay `bridge` trên máy chủ như mô hình rootful mà cần kiểm tra theo cơ chế user-mode của `pasta`.
</details>

### Câu Hỏi 9: `netavark` và `aardvark-dns` đóng vai trò gì trong hệ thống mạng của Podman?

<details>
<summary>Đáp án</summary>

- **`netavark`**: là network stack viết bằng Rust, được thiết kế để dựng và quản lý mạng cho các container của Podman.
- **`aardvark-dns`**: là DNS server có thẩm quyền trả lời các bản ghi A/AAAA cho tên container, đồng thời chuyển tiếp các truy vấn tên miền khác (như tên miền bên ngoài) tới cấu hình DNS trong `/etc/resolv.conf` của máy chủ.
</details>

### Câu Hỏi 10: Vì sao cần dùng cờ `-p` / `--publish` khi chạy web server trong container, và cú pháp `-p 8080:80` được đọc theo chiều nào?

<details>
<summary>Đáp án</summary>

Container nằm trong network namespace riêng với IP riêng nên người dùng từ bên ngoài máy chủ không thể kết nối trực tiếp vào container. Cờ `-p` (`--publish`) dùng để ánh xạ cổng của máy chủ vào cổng của container theo quy tắc **`-p <cổng máy chủ>:<cổng container>`**:
- `8080` (bên trái): cổng mà **máy chủ** mở và lắng nghe request từ bên ngoài.
- `80` (bên phải): cổng mà **ứng dụng bên trong container** đang lắng nghe.
</details>

### Câu Hỏi 11: Khi Docker thực hiện publish cổng (`-p 8080:80`) và cho container gọi ra ngoài, ba khái niệm NAT, PAT và Masquerading hoạt động ra sao?

<details>
<summary>Đáp án</summary>

Docker sử dụng các luật firewall trên máy chủ để xử lý lưu lượng:
- **NAT (Network Address Translation)**: đổi địa chỉ IP đích của gói tin từ `<IP máy chủ>` thành `<IP container>`.
- **PAT (Port Address Translation)**: đổi số cổng đích của gói tin từ cổng máy chủ (`8080`) sang cổng của container (`80`).
- **Masquerading**: áp dụng cho chiều container gọi ra ngoài Internet; máy chủ đổi IP nguồn (IP riêng của container) thành IP của máy chủ rồi ghi nhớ trạng thái để chuyển gói trả lời về đúng container.
</details>

### Câu Hỏi 12: Nếu muốn chạy đồng thời hai container Nginx trên cùng một máy chủ, có thể dùng chung `-p 8080:80` cho cả hai không? Vì sao?

<details>
<summary>Đáp án</summary>

Không thể dùng chung `-p 8080:80` cho cả hai container. Dù bên trong mỗi container đều có thể lắng nghe cổng `80` bình thường (nhờ khác network namespace), nhưng trên cùng một địa chỉ của máy chủ chỉ có duy nhất một cổng `8080`. Nếu container thứ nhất đã chiếm cổng `8080`, container thứ hai dùng `-p 8080:80` sẽ báo lỗi; ta phải ánh xạ sang cổng máy chủ khác nhau, ví dụ `-p 8080:80` cho `web1` và `-p 8081:80` cho `web2`.
</details>

### Câu Hỏi 13: Mặc định `-p 8080:80` tiềm ẩn rủi ro bảo mật gì và cách khắc phục nếu chỉ muốn truy cập từ nội bộ máy chủ?

<details>
<summary>Đáp án</summary>

Mặc định `-p 8080:80` sẽ mở cổng `8080` trên **mọi địa chỉ IP** của máy chủ, khiến các máy khác cùng mạng cũng có thể gọi vào. Nếu dịch vụ chỉ phục vụ nội bộ trên chính máy chủ đó, cần chỉ định rõ địa chỉ loopback `127.0.0.1` theo cú pháp `[[hostIP:][hostPort]:]containerPort`, ví dụ: `-p 127.0.0.1:8080:80`.
</details>

### Câu Hỏi 14: Khi đã publish cổng nhưng client bên ngoài vẫn không truy cập được vào container, nên kiểm tra theo thứ tự nào và dùng công cụ gì?

<details>
<summary>Đáp án</summary>

Nên kiểm tra tuần tự theo 3 bước:
1. Kiểm tra ứng dụng bên trong container đã thực sự lắng nghe đúng cổng chưa (ví dụ cổng 80).
2. Kiểm tra tham số ánh xạ `-p <cổng máy chủ>:<cổng container>` (và địa chỉ bind nếu có) đã đúng chiều chưa.
3. Kiểm tra cổng đang mở và luật firewall/NAT trên máy chủ bằng các công cụ như `ss -tulpn`, `sudo iptables -t nat -L -n` (nếu dùng iptables), `sudo nft list ruleset` (nếu dùng nftables) hoặc bắt gói tin bằng `tcpdump`.
</details>

### Câu Hỏi 15: Trong Docker, tại sao hai container chạy trên `default bridge` thường không gọi được nhau bằng tên container, và cách khắc phục chuẩn là gì?

<details>
<summary>Đáp án</summary>

Trên **default bridge** của Docker, các container chỉ có thể truy cập nhau bằng địa chỉ IP (tính năng `--link` đã là legacy). Chỉ khi dùng **user-defined bridge** (mạng bridge do người dùng tự tạo), Docker mới cung cấp **DNS tự động** giúp các container phân giải và gọi nhau bằng tên. Do đó, thực tiễn chuẩn cho ứng dụng nhiều container là tạo một user-defined network riêng (hoặc dùng Compose) và gắn các container vào cùng mạng đó.
</details>

### Câu Hỏi 16: Trong Kubernetes, những thành phần nào đảm nhiệm vai trò tương tự "publish cổng" và "DNS giữa các container" của Docker/Podman?

<details>
<summary>Đáp án</summary>

Trong Kubernetes, mỗi Pod cũng có network namespace riêng, và các đối tượng **Service** cùng hệ thống **DNS** (như CoreDNS) sẽ đảm nhiệm vai trò tương tự việc publish cổng (tiếp nhận và chuyển tiếp lưu lượng vào Pod) và phân giải tên giữa các dịch vụ trong cluster.
</details>
