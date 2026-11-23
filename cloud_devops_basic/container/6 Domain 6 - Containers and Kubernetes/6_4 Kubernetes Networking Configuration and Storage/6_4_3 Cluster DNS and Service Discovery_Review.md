# Ôn Tập: 6_4_3 Cluster DNS and Service Discovery

### Câu Hỏi 1: Tại sao Pod không nên giao tiếp bằng địa chỉ IP trực tiếp, và CoreDNS đóng vai trò gì trong Service Discovery của Kubernetes?

<details>
<summary>Đáp án</summary>

Pod có vòng đời động nên địa chỉ IP của Pod thay đổi liên tục; vì vậy ứng dụng trong Pod không nên nhớ hoặc gắn cứng IP. Trong Kubernetes, cluster chạy một DNS server (mặc định là **CoreDNS**) liên tục theo dõi Kubernetes API để tạo bản ghi DNS cho Service, giúp mọi Pod trong cluster có thể phân giải và gọi Service theo tên khi DNS được bật.
</details>

### Câu Hỏi 2: Trong cluster Kubernetes mặc định (như quan sát trên kind), CoreDNS được triển khai, cấu hình và truy cập bởi các Pod thông qua thành phần nào?

<details>
<summary>Đáp án</summary>

- **Workload**: CoreDNS chạy dưới dạng Deployment (2 replica) trong namespace `kube-system`.
- **Cấu hình**: Nằm trong ConfigMap `coredns` (khóa `Corefile`).
- **Điểm truy cập**: Các Pod gửi truy vấn qua Service **`kube-dns`** (ClusterIP mặc định `10.96.0.10`, các cổng `53/UDP`, `53/TCP` cho DNS và `9153/TCP` cho metrics). Địa chỉ này xuất hiện tại dòng `nameserver` trong `/etc/resolv.conf` của mọi Pod.
</details>

### Câu Hỏi 3: Trong `Corefile` của CoreDNS, hai nhánh xử lý tên miền trong cluster (`cluster.local`) và tên miền ngoài cluster hoạt động khác nhau như thế nào (kể cả cơ chế cache)?

<details>
<summary>Đáp án</summary>

- **Tên miền thuộc cluster (`cluster.local`, `in-addr.arpa`, `ip6.arpa`)**: Do plugin `kubernetes` trực tiếp trả lời dựa trên dữ liệu Service/EndpointSlice theo dõi từ `kube-apiserver`.
- **Tên miền ngoài cluster**: Plugin `forward . /etc/resolv.conf` chuyển tiếp truy vấn lên DNS resolver của node (upstream DNS).
- **Cơ chế cache**: Chỉ thị `cache 30` bật bộ nhớ đệm 30 giây cho các tên miền ngoài, nhưng **tắt cache đối với `cluster.local`** (`disable success cluster.local; disable denial cluster.local`).
</details>

### Câu Hỏi 4: Phân biệt cú pháp FQDN và kết quả trả về giữa Service thường (ClusterIP) và Headless Service.

<details>
<summary>Đáp án</summary>

Cả hai đều dùng chung cấu trúc tên DNS đầy đủ:
`<service>.<namespace>.svc.<cluster-domain>` (với `cluster-domain` mặc định là `cluster.local`).

Điểm khác biệt nằm ở bản ghi A/AAAA trả về:
- **Service thường**: Trả về **1 địa chỉ ClusterIP** duy nhất của Service.
- **Headless Service**: Trả về **tập IP của tất cả Pod** đang được Service chọn; phía client tự sử dụng toàn bộ danh sách IP đó hoặc tự thực hiện round-robin.
</details>

### Câu Hỏi 5: Bản ghi SRV trong Kubernetes có cấu trúc tên như thế nào và cung cấp thông tin gì?

<details>
<summary>Đáp án</summary>

Bản ghi SRV dành cho các cổng có đặt tên theo cấu trúc:
`_<port-name>._<protocol>.<service>.<namespace>.svc.<cluster-domain>` (ví dụ `_http._tcp.hello-svc.default.svc.cluster.local`).

Bản ghi này trả về **số cổng và tên đích**. Nếu dùng với Headless Service, CoreDNS sẽ trả về một bản ghi SRV cho mỗi Pod.
</details>

### Câu Hỏi 6: Một Pod bất kỳ có tên DNS theo IP dạng nào? Khi nào một Pod sở hữu tên DNS dạng `<hostname>.<subdomain>.<namespace>.svc.<cluster-domain>`?

<details>
<summary>Đáp án</summary>

- **Pod bất kỳ**: Có dạng `<ip-pod-dạng-gạch-nối>.<namespace>.pod.<cluster-domain>`, ví dụ `10-244-0-5.default.pod.cluster.local` (phụ thuộc tùy chọn `pods` trong cấu hình CoreDNS).
- **Pod có tên gắn với Service**: Khi Pod khai báo `hostname` và `subdomain` trùng với tên một Headless Service trong cùng namespace, nó có tên `<hostname>.<subdomain>.<namespace>.svc.<cluster-domain>`. Bản ghi này chỉ trả về IP khi Pod ở trạng thái **Ready**, trừ khi Service đặt `publishNotReadyAddresses: true`.
</details>

### Câu Hỏi 7: Viết cấu trúc tên DNS đầy đủ (FQDN) của một Pod thuộc StatefulSet và giải thích ý nghĩa từng thành phần.

<details>
<summary>Đáp án</summary>

Cấu trúc FQDN của Pod StatefulSet là:
`<pod>.<headless-service>.<namespace>.svc.<cluster-domain>`
(Ví dụ: `kafka-0.kafka-headless.prod.svc.cluster.local`).

Trong đó:
- `<pod>`: Tên định danh ổn định của Pod trong StatefulSet (ví dụ `kafka-0`).
- `<headless-service>`: Tên Headless Service quản lý StatefulSet đó.
- `<namespace>`: Namespace chứa StatefulSet.
- `svc.<cluster-domain>`: Hậu tố chuẩn cho Service trong cluster (`cluster-domain` mặc định là `cluster.local`).
</details>

### Câu Hỏi 8: `ExternalName` Service trả về loại bản ghi DNS nào và có hạn chế gì cần nhớ?

<details>
<summary>Đáp án</summary>

`ExternalName` Service trả về bản ghi **CNAME** trỏ tới tên miền bên ngoài được cấu hình. Lưu ý là **chỉ hệ thống DNS của Kubernetes** mới phân giải và truy cập được loại Service này.
</details>

### Câu Hỏi 9: File `/etc/resolv.conf` bên trong một Pod thường gồm những cấu hình nào do `kubelet` tạo ra, và các tên miền trong dòng `search` đến từ đâu?

<details>
<summary>Đáp án</summary>

Một file `/etc/resolv.conf` điển hình do `kubelet` tạo cho Pod gồm 3 phần:
1. `search ...`: Danh sách các hậu tố tìm kiếm tên miền.
2. `nameserver 10.96.0.10`: Địa chỉ ClusterIP của Service `kube-dns`.
3. `options ndots:5`: Ngưỡng số dấu chấm để quyết định thứ tự phân giải.

Trong danh sách `search`, **3 domain đầu tiên** do Kubernetes tự thêm dựa trên namespace của Pod (`<namespace>.svc.<domain>`, `svc.<domain>`, `<domain>`). Các domain phía sau (nếu có) là search domain của máy chủ node được thừa kế xuống khi Pod dùng `dnsPolicy: ClusterFirst`.
</details>

### Câu Hỏi 10: Giải thích điều gì xảy ra khi gọi tên ngắn `hello-svc` từ một Pod ở cùng namespace `default` so với từ một Pod ở namespace `other`. Quy tắc gọi liên namespace là gì?

<details>
<summary>Đáp án</summary>

- **Cùng namespace (`default`)**: `hello-svc` được ghép với search domain đầu tiên thành `hello-svc.default.svc.cluster.local` → phân giải **thành công**.
- **Khác namespace (`other`)**: `hello-svc` bị ghép với search domain của Pod gọi thành `hello-svc.other.svc.cluster.local` (không tồn tại) → **thất bại**. Nếu gọi `hello-svc.default`, resolver sẽ ghép với `svc.cluster.local` trong `search` thành `hello-svc.default.svc.cluster.local` → **thành công**.

**Quy tắc**: Khi gọi Service ở namespace khác, bắt buộc phải chỉ định tối thiểu dạng `<service>.<namespace>` (hoặc dùng FQDN đầy đủ).
</details>

### Câu Hỏi 11: Các giá trị của `dnsPolicy` trên Pod là gì? Giá trị nào là mặc định và tại sao giá trị `Default` dễ gây hiểu nhầm?

<details>
<summary>Đáp án</summary>

4 giá trị của `dnsPolicy` gồm:
- `ClusterFirst`: **Đây mới là giá trị mặc định** khi bỏ trống `dnsPolicy`. Truy vấn ngoài miền cluster được DNS server (CoreDNS) chuyển tiếp lên upstream.
- `Default`: Pod **thừa kế cấu hình DNS của node** thay vì dùng DNS của cluster. Tên gọi `Default` rất dễ gây nhầm lẫn vì nó **không phải** giá trị mặc định của Pod.
- `ClusterFirstWithHostNet`: Dành cho Pod chạy `hostNetwork: true` muốn dùng DNS của cluster.
- `None`: Bỏ qua cấu hình DNS của Kubernetes, dùng hoàn toàn cấu hình do `dnsConfig` cung cấp.
</details>

### Câu Hỏi 12: Nếu một Pod dùng `hostNetwork: true` nhưng vẫn để `dnsPolicy: ClusterFirst` thì điều gì xảy ra, và phải sửa thế nào? Ngoài ra, `dnsConfig` có thể dùng chung với những `dnsPolicy` nào?

<details>
<summary>Đáp án</summary>

- Khi Pod bật `hostNetwork: true` mà giữ `dnsPolicy: ClusterFirst`, Pod sẽ rơi về hành vi của `Default` (dùng DNS của node) nên không phân giải được tên Service nội bộ. Cần đặt **`dnsPolicy: ClusterFirstWithHostNet`** để Pod vẫn dùng được CoreDNS.
- **`dnsConfig`** là trường tùy chọn có thể kết hợp với **mọi giá trị `dnsPolicy`** (kể cả `ClusterFirst` hay `None`) để tùy biến `nameservers`, `searches`, và `options` (ví dụ ghi đè `ndots`).
</details>

### Câu Hỏi 13: Thiết lập `options ndots:5` trong `/etc/resolv.conf` có ý nghĩa kỹ thuật chính xác là gì?

<details>
<summary>Đáp án</summary>

Với `ndots:5`, resolver chỉ coi một tên là tên tuyệt đối ngay (thử truy vấn nguyên văn trước) khi tên đó có **từ 5 dấu chấm trở lên**. Nếu tên có **ít hơn 5 dấu chấm**, resolver sẽ ghép tên đó với **từng `search` domain lần lượt trước**, rồi mới thử tên nguyên văn ở bước **sau cùng**.
</details>

### Câu Hỏi 14: Vì sao một lần phân giải tên miền ngoài như `example.com` từ trong Pod lại có thể tạo ra tới 7 truy vấn DNS (thậm chí nhiều hơn) tới CoreDNS?

<details>
<summary>Đáp án</summary>

Vì `example.com` chỉ có **1 dấu chấm** (nhỏ hơn ngưỡng `ndots:5`), resolver buộc phải thử ghép `example.com` lần lượt với toàn bộ các domain trong danh sách `search` (ví dụ 3 domain của Kubernetes cộng với các search domain của node). Mỗi lần thử đều nhận `NXDOMAIN` cho đến lượt cuối cùng hỏi nguyên văn `example.com.` mới nhận được `NOERROR` (tổng cộng 7 truy vấn trong phép đo thực tế với 6 search domain, chưa tính nếu ứng dụng hỏi cả bản ghi `A` lẫn `AAAA`).
</details>

### Câu Hỏi 15: Nêu 3 cách giảm bớt số lượng truy vấn DNS do `ndots:5` gây ra, và lưu ý đánh đổi khi hạ thấp `ndots` bằng `dnsConfig`.

<details>
<summary>Đáp án</summary>

3 cách giảm tải truy vấn DNS:
1. **Thêm dấu chấm cuối (trailing dot)** cho tên miền ngoài (ví dụ `api.example.com.`) khi ứng dụng cho phép, giúp resolver nhận biết đây là FQDN tuyệt đối và chỉ gửi 1 truy vấn.
2. **Giảm `ndots` cho Pod** bằng `spec.dnsConfig.options` (ví dụ đặt `ndots: "2"` cho Pod gọi nhiều API ngoài).
3. **Dùng bộ nhớ đệm cục bộ**: Triển khai **NodeLocal DNSCache** trên node và bật cache DNS hợp lý ở phía ứng dụng/client.

**Lưu ý đánh đổi khi hạ `ndots`**: Nếu hạ `ndots` xuống thấp (ví dụ `2`), các tên gọi nội bộ dạng ngắn nhiều đoạn như `<service>.<namespace>` hoặc `<service>.<namespace>.svc` có thể chạm ngưỡng `ndots` và bị thử nguyên văn trước thay vì mở rộng theo `search` domain, cần kiểm thử kỹ trước khi áp dụng.
</details>

### Câu Hỏi 16: Hiện tượng Negative Caching (bộ đệm âm) ảnh hưởng như thế nào đến việc phân giải tên Pod mới tạo (đặc biệt trong StatefulSet), và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

Nếu client đã truy vấn tên DNS của một Pod **trước khi** Pod đó được tạo, CoreDNS sẽ lưu kết quả "không tìm thấy" (NXDOMAIN) vào bộ đệm âm (mặc định khoảng **30 giây**). Do đó, ngay cả khi Pod đã khởi động và chạy, các truy vấn tiếp theo trong khoảng thời gian cache vẫn có thể chưa phân giải được ngay.

**Cách tránh**: Truy vấn trực tiếp trạng thái từ Kubernetes API (cơ chế watch) thay vì chỉ phụ thuộc DNS, hoặc giảm thời gian cache âm của DNS provider.
</details>

### Câu Hỏi 17: Vì sao không nên chỉ dùng lệnh `nslookup` của Busybox (như bản 1.36) để kết luận DNS của cluster bị lỗi? Nên dùng gì thay thế khi kiểm tra?

<details>
<summary>Đáp án</summary>

`nslookup` của Busybox 1.36 xử lý `search` domain khác với thư viện resolver của ứng dụng thực tế: nó mở rộng đúng tên 1 nhãn (như `hello-svc`), nhưng với tên 2 nhãn như `hello-svc.default` lại có thể báo `NXDOMAIN` dù `wget hello-svc.default` vẫn thành công.

**Cách kiểm tra đúng**: Dùng `wget`, `curl`, `getent hosts` (trên image dùng `glibc`), dùng FQDN đầy đủ, hoặc kiểm tra trực tiếp bằng chính runtime/thư viện của ứng dụng.
</details>

### Câu Hỏi 18: Ứng dụng Java (JVM) gặp rủi ro gì với cơ chế cache DNS khi gọi tới các dịch vụ có IP thay đổi liên tục (nhất là Headless Service), và khuyến nghị xử lý là gì?

<details>
<summary>Đáp án</summary>

Theo tài liệu Oracle, thuộc tính `networkaddress.cache.ttl` của JVM mặc định là `-1` (cache vĩnh viễn) **khi có security manager**, còn trường hợp không có thì tùy implementation. Vì IP của Pod trong Kubernetes thay đổi liên tục, việc JVM cache DNS quá lâu khiến client giữ IP cũ đã chết (đặc biệt nguy hiểm với Headless Service trả về trực tiếp IP Pod).

**Khuyến nghị**: Cấu hình TTL hợp lý cho client Java khi dùng DNS động và kiểm tra hành vi mặc định trên đúng phiên bản JDK đang sử dụng (như Java 17/21 LTS).
</details>

### Câu Hỏi 19: Khi muốn bật log CoreDNS để chẩn đoán truy vấn DNS (như đo `ndots`), cần làm gì và có những nguyên tắc vận hành nào trong môi trường thực tế?

<details>
<summary>Đáp án</summary>

- **Cách bật tạm thời trên cluster học tập**: Chỉnh sửa ConfigMap `coredns` trong `kube-system` (`kubectl -n kube-system edit cm coredns`), thêm dòng `log` ngay sau dòng `errors` trong `Corefile`, rồi khởi động lại CoreDNS (`kubectl -n kube-system rollout restart deploy/coredns`).
- **Nguyên tắc vận hành thực tế**: Chỉ bật `log` trong thời gian ngắn để chẩn đoán vì số lượng log cho mọi truy vấn là rất lớn, và phải nhớ hoàn tác bỏ dòng `log` sau khi kiểm tra xong. Trong môi trường production, cần quản lý `Corefile` qua GitOps và giám sát CoreDNS thông qua metrics trên cổng `9153`.
</details>
