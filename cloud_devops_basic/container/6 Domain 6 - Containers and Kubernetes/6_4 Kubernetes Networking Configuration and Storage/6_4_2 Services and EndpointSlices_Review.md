# Ôn Tập: Services and EndpointSlices

### Câu Hỏi 1: Service giải quyết bài toán gì trong Kubernetes và Service có phải là một tiến trình đang chạy không?

<details>
<summary>Đáp án</summary>

- **Bài toán giải quyết**: Pod là tài nguyên tạm thời; Deployment tạo và xóa Pod liên tục và mỗi Pod có IP riêng, nên client không thể tự theo dõi danh sách IP hiện có. **Service** cung cấp một lớp trừu tượng (abstraction) cho một nhóm Pod với một **IP ảo ổn định (cluster IP)**, một **tên DNS ổn định**, kèm chính sách chọn Pod đích.
- **Bản chất**: Service **không phải** là một tiến trình mà là một **đối tượng API**. Có hai thành phần thực thi nó:
  1. **EndpointSlice controller** (trên control plane): theo dõi các Pod khớp `selector` và cập nhật các **EndpointSlice**.
  2. **Service proxy** (thường là `kube-proxy` chạy trên mỗi node): theo dõi Service và EndpointSlice để lập trình luật chuyển tiếp gói tin trong kernel.
</details>

### Câu Hỏi 2: Hãy phân biệt 5 loại/biến thể Service phổ biến (`ClusterIP`, `NodePort`, `LoadBalancer`, `ExternalName`, `Headless`) và mục đích sử dụng của từng loại.

<details>
<summary>Đáp án</summary>

- **ClusterIP (mặc định)**: Cấp một cluster IP từ dải IP của Service, **chỉ truy cập được từ trong cluster**. Dùng cho giao tiếp nội bộ giữa các service.
- **NodePort**: Mở một cổng tĩnh (mặc định `30000-32767`, cấu hình bằng `--service-node-port-range`) trên **mọi node** và vẫn có cluster IP. Dùng trong môi trường thử nghiệm hoặc không có load balancer.
- **LoadBalancer**: Yêu cầu load balancer bên ngoài (thường thông qua `cloud-controller-manager`) và được xây dựng trên nền `NodePort` (Kubernetes không tích hợp sẵn thành phần load balancer). Dùng trên cloud (Azure/AWS...) hoặc cluster tự cài LB.
- **ExternalName**: Ánh xạ Service tới một tên DNS bên ngoài; cluster DNS trả về bản ghi **CNAME** và **không proxy** traffic. Dùng khi muốn trỏ một tên nội bộ tới dịch vụ bên ngoài cluster.
- **Headless (`clusterIP: None`)**: Không cấp cluster IP, `kube-proxy` **không** xử lý; DNS trả về trực tiếp IP của từng Pod. Dùng khi client cần giao tiếp trực tiếp với từng Pod cụ thể (như StatefulSet hoặc peer discovery).
</details>

### Câu Hỏi 3: Các loại Service có mối quan hệ "lồng nhau" như thế nào? Trường `clusterIP: None` khác gì so với việc bỏ trống `clusterIP`?

<details>
<summary>Đáp án</summary>

- **Thiết kế lồng nhau**: Ngoại trừ `ExternalName`, các loại Service được thiết kế lồng nhau theo thứ tự: **LoadBalancer ⊃ NodePort ⊃ ClusterIP** (ví dụ: `LoadBalancer` xây trên `NodePort`, và `NodePort` vẫn có `ClusterIP`).
- **`clusterIP: None` vs bỏ trống**: Chuỗi `None` là một giá trị đặc biệt để tạo **Headless Service** (không cấp IP ảo). Việc này **khác hoàn toàn** với việc bỏ trống trường `clusterIP` (khi bỏ trống, hệ thống sẽ tự động cấp một cluster IP cho Service).
</details>

### Câu Hỏi 4: Ingress có phải là một loại Service không? Khi nào nên dùng Gateway API / Ingress thay cho NodePort hoặc LoadBalancer?

<details>
<summary>Đáp án</summary>

- **Ingress không phải là một loại Service**.
- Khi cần mở traffic **HTTP/HTTPS** từ ngoài cluster vào dựa theo **host/path**, nên dùng **Gateway API hoặc Ingress** trỏ tới Service `ClusterIP`.
- Trong thực tế sản xuất, nên để Service mặc định là `ClusterIP` và mở ra ngoài tập trung qua Gateway API hoặc Ingress để giảm số lượng LoadBalancer phải trả phí và giảm số cổng `NodePort` phải quản lý, thay vì lạm dụng `NodePort`/`LoadBalancer` cho mọi Service.
</details>

### Câu Hỏi 5: Phân biệt `port`, `targetPort` và `nodePort` trong cấu hình Service. Nếu bỏ trống `targetPort` thì mặc định thế nào?

<details>
<summary>Đáp án</summary>

- **`port`**: Cổng của Service (trên ClusterIP) mà client gọi vào.
- **`targetPort`**: Cổng thực tế trên Pod nhận traffic (có thể là số hoặc **tên cổng** khai báo ở `containerPort.name` trong Pod). Nếu bỏ trống, `targetPort` mặc định **bằng giá trị của `port`**.
- **`nodePort`**: Cổng tĩnh mở trên mọi node (chỉ áp dụng cho `NodePort` hoặc `LoadBalancer`); nếu không đặt, hệ thống sẽ tự cấp một cổng trong dải `30000-32767`.
</details>

### Câu Hỏi 6: Cổng có tên (named port) trong Pod và Service mang lại lợi ích gì, và có những quy tắc đặt tên nào?

<details>
<summary>Đáp án</summary>

- **Lợi ích**: Khi Pod khai báo `containerPort.name` (ví dụ `http`) và Service đặt `targetPort: http`, bạn có thể thay đổi số cổng thực tế trên ứng dụng ở phiên bản mới mà **không cần sửa cấu hình Service**.
- **Quy tắc đặt tên**:
  - Tên cổng chỉ được gồm chữ thường, số và dấu `-`, phải bắt đầu và kết thúc bằng ký tự chữ-số.
  - Nếu Service khai báo **nhiều cổng**, việc đặt `name` cho **tất cả** các cổng là **bắt buộc**.
</details>

### Câu Hỏi 7: EndpointSlice hoạt động như thế nào khi Service có `selector`, và ý nghĩa của 3 `conditions` (`serving`, `terminating`, `ready`) là gì?

<details>
<summary>Đáp án</summary>

- Khi Service có `selector`, EndpointSlice controller tạo các đối tượng **EndpointSlice** (mang nhãn `kubernetes.io/service-name: <tên Service>`) liệt kê các Pod khớp `selector`. Mặc định mỗi slice chứa tối đa **100 endpoint**. EndpointSlice (GA từ v1.21) là **nguồn sự thật** cho `kube-proxy`.
- Ý nghĩa 3 `conditions` trên mỗi endpoint:
  - **`serving`**: Endpoint đang có khả năng phục vụ (với Pod, tương ứng với điều kiện `Ready` của Pod).
  - **`terminating`**: Pod đang trong quá trình bị xóa (đã có deletion timestamp). Proxy thường bỏ qua endpoint này; chỉ sử dụng nếu **tất cả** endpoint đều đang `terminating` mà vẫn `serving`, nhằm tránh làm rơi traffic khi rolling update.
  - **`ready`**: Cách viết tắt của trạng thái "`serving` **và** không `terminating`". Trường này luôn là `true` nếu Service bật `publishNotReadyAddresses: true`.
</details>

### Câu Hỏi 8: Khi `readinessProbe` của một Pod thất bại (chưa Ready), Pod đó có bị xóa khỏi EndpointSlice không? Làm thế nào để kiểm tra chính xác trạng thái nhận traffic của Pod?

<details>
<summary>Đáp án</summary>

- **Không bị xóa khỏi EndpointSlice**: Khi `readinessProbe` chưa đạt, Pod **vẫn xuất hiện trong EndpointSlice**, nhưng các condition của nó là `ready=false` và `serving=false`. Vì `kube-proxy` chỉ chuyển tiếp traffic tới các endpoint có `ready=true`, Pod đó sẽ ngừng nhận traffic mà **không bị restart**. Khi probe thành công trở lại, `ready` chuyển thành `true`.
- **Cách kiểm tra chính xác**:
  - Không thể chỉ nhìn cột `ENDPOINTS` của lệnh `kubectl get endpointslices -o wide`, vì cột này liệt kê **cả** những endpoint chưa ready.
  - Cần kiểm tra chi tiết `conditions.ready` (ví dụ dùng `jsonpath` với `kubectl get endpointslices`) hoặc chạy `kubectl describe svc <tên-service>` (lệnh này chỉ hiển thị các endpoint đang ready).
</details>

### Câu Hỏi 9: Vì sao API `Endpoints` cũ không còn được khuyến khích sử dụng và đã bị deprecated từ Kubernetes v1.33?

<details>
<summary>Đáp án</summary>

API `v1 Endpoints` bị deprecated từ Kubernetes v1.33 trở đi vì các hạn chế:
1. Không hỗ trợ dual-stack.
2. Thiếu thông tin cần thiết cho các tính năng mới như `trafficDistribution`.
3. Danh sách endpoint bị cắt bớt khi vượt quá 1000 endpoint.

Do đó, cần sử dụng `discovery.k8s.io/v1 EndpointSlice` cho mọi script, controller và công cụ mới.
</details>

### Câu Hỏi 10: Khi nào nên tạo Service không có `selector`, cách cấu hình và những ràng buộc IP cần lưu ý là gì?

<details>
<summary>Đáp án</summary>

- **Khi nào dùng**: Dùng để trỏ một Kubernetes Service tới backend nằm **ngoài cluster** (ví dụ: database bên ngoài hoặc hệ thống đang di trú dần vào Kubernetes).
- **Cách cấu hình**: Khi Service không khai báo `selector`, EndpointSlice **không** được tạo tự động; bạn phải tự tạo tài nguyên EndpointSlice thủ công và gắn nhãn `kubernetes.io/service-name: <tên Service>`.
- **Ràng buộc IP**: IP của endpoint khai báo thủ công **không được phép** là địa chỉ loopback, link-local hoặc cluster IP của một Service khác.
</details>

### Câu Hỏi 11: Trong chế độ `iptables` (mặc định ở Kubernetes 1.37), `kube-proxy` và kernel xử lý gói tin từ Pod client tới Service ClusterIP như thế nào?

<details>
<summary>Đáp án</summary>

1. Pod client truy vấn CoreDNS để phân giải tên Service thành địa chỉ **ClusterIP** (ví dụ `10.96.10.144`).
2. Pod client gửi gói tin tới `ClusterIP:port`.
3. Kernel trên node thực thi chuỗi luật netfilter do `kube-proxy` lập trình sẵn:
   - Gói tin đi qua chuỗi `KUBE-SERVICES` khớp với `ClusterIP:port`, rồi nhảy sang chuỗi của Service (`KUBE-SVC-...`).
   - Từ chuỗi Service, luật dùng mô-đun thống kê chọn **ngẫu nhiên** một endpoint Pod đang `ready` (theo xác suất chia đều, ví dụ 1/3, rồi 1/2 phần còn lại, rồi phần còn lại) để nhảy tới chuỗi `KUBE-SEP-...`.
   - Chuỗi `KUBE-SEP-...` thực hiện **DNAT** đổi địa chỉ đích từ `ClusterIP:port` sang `PodIP:targetPort`.
4. Phản hồi từ Pod đích quay về client sẽ được dịch ngược địa chỉ nguồn.

Không có tiến trình user-space nào đứng giữa chuyển tiếp từng gói tin; toàn bộ việc định tuyến và DNAT được xử lý trực tiếp bởi kernel.
</details>

### Câu Hỏi 12: Các chế độ (mode) của `kube-proxy` trên Linux có trạng thái như thế nào trong Kubernetes 1.37, và tại sao nên khai báo `mode` tường minh?

<details>
<summary>Đáp án</summary>

- **Trạng thái các chế độ trên Linux (Kubernetes 1.37)**:
  - **`iptables`**: Là **mặc định hiện tại** (nếu không cấu hình tường minh).
  - **`nftables`**: Yêu cầu kernel từ `5.13` trở lên; được thiết kế để thay thế `iptables` và `ipvs`, và tài liệu chính thức cho biết **một phiên bản tương lai sẽ đổi mặc định sang `nftables`**.
  - **`ipvs`**: Đã **deprecated từ v1.35**; sẽ bị tắt mặc định ở v1.40 (bật lại được qua feature gate `KubeProxyIPVS`) và **gỡ bỏ hoàn toàn ở v1.43**.
  - *(Lưu ý: Trên Windows chỉ có `kernelspace`; ngoài ra một số CNI như Cilium có service proxy riêng thay thế cho `kube-proxy`.)*
- **Lý do nên khai báo `mode` tường minh**: Để tránh việc nâng cấp phiên bản Kubernetes trong tương lai làm hệ thống vô tình tự chuyển đổi backend proxy mặc định ngoài ý muốn. Nếu đang dùng `ipvs`, cần lên kế hoạch chuyển sang `nftables` hoặc `iptables`.
</details>

### Câu Hỏi 13: Khi Service có ClusterIP và DNS phân giải bình thường nhưng không có endpoint nào, điều gì xảy ra khi client kết nối và cách chẩn đoán nhanh như thế nào?

<details>
<summary>Đáp án</summary>

- **Hành vi**: Với Service không có endpoint, `kube-proxy` cài đặt luật `REJECT --reject-with icmp-port-unreachable`. Nhờ vậy, client sẽ nhận lỗi **`Connection refused` ngay lập tức** chứ không bị treo chờ timeout.
- **Cách chẩn đoán nhanh bằng 2 lệnh**:
  1. Kiểm tra EndpointSlice xem có bị rỗng không:
     `kubectl get endpointslices -l kubernetes.io/service-name=<tên-svc> -o wide`
  2. Đối chiếu `selector` của Service với nhãn (`labels`) thực tế trên các Pod (thường do gõ sai selector một chữ):
     `kubectl get svc <tên-svc> -o jsonpath='{.spec.selector}{"\n"}'; kubectl get pods --show-labels`
</details>

### Câu Hỏi 14: So sánh hành vi của `sessionAffinity`, `externalTrafficPolicy: Local`, `internalTrafficPolicy: Local` và `trafficDistribution`.

<details>
<summary>Đáp án</summary>

- **`sessionAffinity: ClientIP`** (mặc định `None`): Đảm bảo các request từ cùng một IP client được chuyển tới cùng một Pod. Thời gian duy trì (`timeoutSeconds`) mặc định là `10800` giây (3 giờ), tối đa `86400` giây.
- **`externalTrafficPolicy: Local`** (mặc định `Cluster`): Traffic từ ngoài vào chỉ được chuyển tới các endpoint **nằm trên chính node nhận gói tin**, giúp **giữ nguyên IP nguồn của client**. Cạm bẫy: nếu Load Balancer gửi traffic tới node không có endpoint nào, gói tin sẽ **bị bỏ (drop)** — do đó chỉ nên dùng khi thực sự cần giữ IP client và LB có hỗ trợ health check theo từng node.
- **`internalTrafficPolicy: Local`** (mặc định `Cluster`, stable từ v1.26): Traffic nội bộ từ Pod trong cluster chỉ đi tới các endpoint trên **cùng node**. Nếu trên node đó không có endpoint nào của Service, Pod trên node đó sẽ thấy Service như không có endpoint.
- **`trafficDistribution`**: Thể hiện **ưu tiên** (không phải cam kết tuyệt đối) về vị trí endpoint. Trong Kubernetes 1.37 hỗ trợ `PreferSameZone` và `PreferSameNode` (`PreferClose` là bí danh cũ đã deprecated).
</details>

### Câu Hỏi 15: Trường `publishNotReadyAddresses: true` trên Headless Service có tác dụng gì và chủ yếu dùng trong trường hợp nào?

<details>
<summary>Đáp án</summary>

- Khi đặt `publishNotReadyAddresses: true`, condition `ready` của các endpoint luôn được đánh dấu là `true`, nhờ đó **cả những Pod chưa Ready vẫn có bản ghi DNS** (A/AAAA) trong Headless Service.
- Mục đích sử dụng chính theo mô tả API là phục vụ **peer discovery của StatefulSet** (ví dụ để các node trong cụm có thể tìm và kết nối với nhau ngay cả trong lúc chưa hoàn tất khởi động/ready).
</details>

### Câu Hỏi 16: Khi sử dụng Service loại `ExternalName`, cần lưu ý những cảnh báo kỹ thuật nào?

<details>
<summary>Đáp án</summary>

- **Vấn đề với HTTP/HTTPS**: Vì `ExternalName` chỉ trả về bản ghi DNS **CNAME** (không proxy và không viết lại header), kết nối HTTP/HTTPS có thể bị lỗi do HTTP header `Host` hoặc chứng chỉ TLS (certificate) của dịch vụ đích bên ngoài không khớp với tên Service nội bộ.
- **Giá trị dạng IPv4**: Nếu bạn điền một chuỗi trông giống địa chỉ IPv4 vào trường `externalName`, Kubernetes sẽ coi đó là một **tên DNS toàn số**, **không** coi là địa chỉ IP.
</details>

### Câu Hỏi 17: Làm thế nào để sinh nhanh file YAML mẫu cho một Service từ Deployment có sẵn bằng `kubectl` mà chưa áp dụng ngay lên cluster?

<details>
<summary>Đáp án</summary>

Có thể dùng lệnh `kubectl expose` kết hợp cờ `--dry-run=client -o yaml` để sinh ra manifest YAML chuẩn rồi kiểm tra trước khi áp dụng:

```bash
kubectl expose deploy/<tên-deployment> --port=80 --target-port=8080 --name=<tên-service> --dry-run=client -o yaml
```
</details>
