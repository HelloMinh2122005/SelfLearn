# Ôn Tập: 6_7_3 NetworkPolicy

### Câu Hỏi 1: Mô hình mạng mặc định trong Kubernetes hoạt động như thế nào và vì sao cần sử dụng NetworkPolicy?

<details>
<summary>Đáp án</summary>

Trong cụm Kubernetes tiêu chuẩn, mô hình mạng mặc định là mạng phẳng và không cô lập (**flat network / non-isolated**): mọi Pod có thể tự do gửi và nhận lưu lượng mạng tới mọi Pod khác trong toàn cụm mà không có rào cản nào.

Mô hình này gây ra rủi ro an ninh mạng lớn trong môi trường sản xuất hoặc đa người dùng (**multi-tenant**):
- Nếu một Pod frontend tiếp xúc Internet bị khai thác lỗ hổng (RCE), kẻ tấn công có thể quét mạng nội bộ và kết nối trực tiếp tới database hoặc dịch vụ nhạy cảm (**lateral movement**).
- Các Pod ở môi trường thử nghiệm (**development / staging**) có thể vô tình gửi gói tin sang môi trường **production** nếu cấu hình sai địa chỉ Service.

**NetworkPolicy** giúp phân vùng và thiết lập tường lửa phần mềm ở cấp độ Pod để kiểm soát lưu lượng đi vào (**Ingress**) và đi ra (**Egress**).
</details>

### Câu Hỏi 2: NetworkPolicy thuộc API group nào, có phạm vi hoạt động ra sao và kiểm soát lưu lượng ở những tầng nào của mô hình OSI?

<details>
<summary>Đáp án</summary>

- **API group**: `networking.k8s.io/v1`.
- **Phạm vi**: Là tài nguyên hoạt động theo phạm vi từng namespace (**namespaced resource**).
- **Tầng OSI**: Hoạt động ở **Tầng 3** (Network Layer — địa chỉ IP) và **Tầng 4** (Transport Layer — cổng và giao thức mạng).
</details>

### Câu Hỏi 3: Vai trò của `kube-apiserver` và CNI plugin khác nhau như thế nào trong việc thực thi NetworkPolicy, và cạm bẫy gì xảy ra nếu dùng CNI không hỗ trợ?

<details>
<summary>Đáp án</summary>

- `kube-apiserver` chỉ **lưu trữ và phân phối** cấu hình NetworkPolicy trong `etcd`, hoàn toàn **không** trực tiếp lọc hay can thiệp vào gói tin mạng trên node.
- NetworkPolicy chỉ có hiệu lực thực tế khi cụm sử dụng một **CNI plugin** có hỗ trợ thực thi chính sách mạng (như **Calico**, **Cilium**, **Antrea**, hoặc **Kube-router**).

**Cạm bẫy "ảo tưởng an toàn"**: Kubernetes vẫn chấp nhận manifest NetworkPolicy hợp lệ mà không báo lỗi ngay cả khi CNI không hỗ trợ (ví dụ: `kindnetd` mặc định của `kind` hoặc `flannel` đơn thuần). Khi kiểm tra, hệ thống vẫn hiển thị policy đang tồn tại, nhưng thực tế các gói tin vẫn đi qua tự do mà không bị chặn. Do đó, cần xác minh khả năng thực thi của CNI trên môi trường staging trước khi đưa lên production.
</details>

### Câu Hỏi 4: CNI plugin thực thi NetworkPolicy trên worker node bằng cơ chế nào và cần cấu hình gì để kiểm thử NetworkPolicy trên cụm `kind`?

<details>
<summary>Đáp án</summary>

**Quy trình thực thi trên cụm:**
1. `kube-apiserver` lưu manifest NetworkPolicy vào `etcd`.
2. **CNI Agent** chạy trên từng worker node phát hiện thay đổi thông qua **Kubernetes Watch API**.
3. CNI Agent biên dịch cấu hình thành các quy tắc lọc gói tin cấp nhân Linux: ví dụ **Calico** sử dụng `iptables` hoặc `ipsets`, còn **Cilium** biên dịch thành chương trình **eBPF** gắn vào giao diện mạng ảo.

**Kiểm thử trên cụm `kind`:**
CNI mặc định `kindnetd` không hỗ trợ NetworkPolicy. Khi tạo cụm `kind`, cần cấu hình `networking.disableDefaultCNI: true` trong file cấu hình cluster, sau đó cài đặt thủ công một CNI plugin hỗ trợ như **Calico** hoặc **Cilium**.
</details>

### Câu Hỏi 5: Khi nào một Pod chuyển từ trạng thái `non-isolated` sang `isolated`, và trạng thái đó có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- Khi chưa có NetworkPolicy nào chọn một Pod, Pod đó ở trạng thái **non-isolated** đối với cả hai chiều Ingress và Egress (mọi lưu lượng đều được phép).
- Một Pod chuyển sang trạng thái **isolated** đối với một hướng lưu lượng (Ingress hoặc Egress) ngay khi có ít nhất một NetworkPolicy chọn Pod đó thông qua trường `podSelector` và liệt kê hướng đó trong `policyTypes`.
- Khi đã ở trạng thái **isolated** cho một hướng, **tất cả** kết nối theo hướng đó sẽ bị CNI từ chối, trừ khi kết nối khớp với ít nhất một quy tắc cho phép (**allow rule**).
</details>

### Câu Hỏi 6: Khi nhiều NetworkPolicy cùng áp dụng lên một Pod, các quy tắc được kết hợp như thế nào? Kubernetes có hỗ trợ quy tắc từ chối tường minh (explicit deny) không?

<details>
<summary>Đáp án</summary>

- Các NetworkPolicy có tính chất **cộng dồn (additive)**: khi nhiều NetworkPolicy cùng áp dụng lên một Pod, tập hợp các quy tắc cho phép là **phép hợp logic (union / logical OR)** của tất cả các quy tắc đó.
- Kubernetes **không** có quy tắc từ chối tường minh (**explicit deny**). Mọi quy tắc khai báo trong `ingress` hoặc `egress` đều là danh sách cấp quyền (**allow list**).
</details>

### Câu Hỏi 7: NetworkPolicy có chặn được kết nối mạng giữa các container chạy bên trong cùng một Pod qua `localhost` không?

<details>
<summary>Đáp án</summary>

**Không.** NetworkPolicy không can thiệp và không chặn các kết nối mạng **loopback** nội bộ (`localhost` hoặc `127.0.0.1`) giữa các container chạy bên trong cùng một Pod.
</details>

### Câu Hỏi 8: Làm thế nào để viết manifest áp dụng chính sách Default-Deny cho toàn bộ Pod trong một namespace theo nguyên tắc Least Privilege?

<details>
<summary>Đáp án</summary>

Để thiết lập **Default-Deny** cho toàn bộ Pod trong một namespace, cần đặt `podSelector: {}` (khớp với mọi Pod trong namespace đó), chỉ định hướng cần khóa trong `policyTypes`, và **không** khai báo khối quy tắc cho phép (`ingress:` hoặc `egress:`):

- **Default-Deny Ingress**: đặt `policyTypes: ["Ingress"]` và không khai báo `ingress:`. Mọi lưu lượng đi vào tất cả Pod trong namespace sẽ bị từ chối.
- **Default-Deny Egress**: đặt `policyTypes: ["Egress"]` và không khai báo `egress:`. Mọi lưu lượng đi ra từ tất cả Pod trong namespace sẽ bị từ chối.

Theo thực tiễn sản xuất (**Least Privilege**), nên áp dụng cả hai chính sách Default-Deny ngay khi tạo namespace mới, sau đó mới mở dần các cổng và Pod cần thiết.
</details>

### Câu Hỏi 9: Trong các quy tắc `from` hoặc `to`, `podSelector` và `namespaceSelector` khác nhau như thế nào và nên dùng nhãn gì cho namespace?

<details>
<summary>Đáp án</summary>

- **`podSelector`** (trong `from` hoặc `to`): chọn các Pod làm nguồn hoặc đích nằm **trong cùng namespace** với tài nguyên NetworkPolicy.
- **`namespaceSelector`** (trong `from` hoặc `to`): chọn **tất cả các Pod** thuộc những namespace có nhãn phù hợp với điều kiện selector.

**Nhãn khuyến nghị cho namespace**: Từ **Kubernetes 1.21** trở đi, nhãn chuẩn `kubernetes.io/metadata.name` được tự động gán cho mọi namespace; nên ưu tiên sử dụng nhãn này trong `namespaceSelector` thay vì tự đặt nhãn thủ công.
</details>

### Câu Hỏi 10: Trong khối `from` hoặc `to`, cách viết YAML tạo ra phép AND và phép OR giữa `namespaceSelector` và `podSelector` khác nhau ra sao?

<details>
<summary>Đáp án</summary>

Sự khác biệt nằm ở việc chúng có dùng chung một phần tử danh sách (một dấu gạch đầu dòng `-`) hay tách thành hai phần tử riêng biệt:

- **Phép AND logic**: Khi `namespaceSelector` và `podSelector` nằm **trong cùng một phần tử từ điển (dictionary item)** (chỉ có một dấu `-` ở đầu). CNI chỉ cho phép Pod có nhãn chỉ định nằm **bên trong** namespace có nhãn chỉ định.
- **Phép OR logic**: Khi `namespaceSelector` và `podSelector` được khai báo thành **hai phần tử danh sách riêng biệt** (mỗi phần tử bắt đầu bằng một dấu `-`). CNI sẽ cho phép: **bất kỳ Pod nào** thuộc namespace khớp `namespaceSelector` **HOẶC** Pod khớp `podSelector` **nằm trong namespace hiện tại** của NetworkPolicy.

*Lưu ý cạm bẫy*: Nhầm lẫn thêm dấu `-` thứ hai sẽ biến phép AND thành phép OR, làm mở rộng phạm vi truy cập ngoài ý muốn.
</details>

### Câu Hỏi 11: Khối `ipBlock` (với `cidr` và `except`) dùng để làm gì, và vì sao không nên dùng `ipBlock` cho địa chỉ IP của Pod trong cụm?

<details>
<summary>Đáp án</summary>

- **`ipBlock`** dùng để xác định dải địa chỉ IP nguồn hoặc đích thông qua trường **`cidr`** (Classless Inter-Domain Routing).
- Trường **`except`** bên trong `ipBlock` dùng để loại trừ một hoặc nhiều dải IP con nằm trong dải `cidr` đã chỉ định.

**Không nên dùng `ipBlock` cho IP của Pod trong cụm** vì địa chỉ IP của Pod trong Kubernetes mang tính biến động. Trong thực tiễn sản xuất, chỉ sử dụng `ipBlock` cho các dải mạng bên ngoài cụm; đối với giao tiếp giữa các Pod bên trong cụm, hãy luôn dùng `podSelector` và `namespaceSelector`.
</details>

### Câu Hỏi 12: Trường `ports` trong NetworkPolicy hỗ trợ những giao thức mạng nào và mặc định là gì?

<details>
<summary>Đáp án</summary>

Trường `ports` trong các quy tắc `ingress` hoặc `egress` hỗ trợ ba giao thức mạng: **`TCP`**, **`UDP`**, và **`SCTP`**. Nếu không khai báo trường `protocol`, giao thức mặc định là **`TCP`**.
</details>

### Câu Hỏi 13: Vì sao khi bật Egress Default-Deny (hoặc khai báo `policyTypes: ["Egress"]` nhưng chỉ mở cổng tới service đích) thì Pod không kết nối được bằng tên miền, và cần khắc phục như thế nào?

<details>
<summary>Đáp án</summary>

**Nguyên nhân:**
Khi Pod chuyển sang trạng thái isolated chiều Egress (do Egress Default-Deny hoặc có policy `policyTypes: ["Egress"]` nhưng không mở cổng DNS), mọi gói tin truy vấn phân giải tên miền gửi ra ngoài tới dịch vụ **CoreDNS** đều bị chặn ngay tại Pod phát ra. Ứng dụng sẽ không thể phân giải tên miền (ví dụ `postgresql.production.svc.cluster.local`) thành địa chỉ IP và thường báo lỗi `"Could not resolve host"`.

**Cách khắc phục:**
Tạo quy tắc **Egress** cho phép gửi gói tin qua cả hai giao thức **`UDP` và `TCP` trên cổng `53`** tới các Pod CoreDNS (nhãn `k8s-app: kube-dns`) nằm trong namespace `kube-system` (chọn bằng nhãn `kubernetes.io/metadata.name: kube-system`).
</details>
