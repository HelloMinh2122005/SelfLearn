# Ôn Tập: 6_4_1 Kubernetes Network Model and CNI

### Câu Hỏi 1: Kubernetes chia mạng trong cluster thành 4 bài toán riêng biệt nào và thành phần nào chịu trách nhiệm giải quyết từng bài toán?

<details>
<summary>Đáp án</summary>

Theo tài liệu Cluster Networking, mạng Kubernetes được tách thành 4 bài toán:
1. **Container ↔ container trong cùng Pod**: Pod chia sẻ chung network namespace nên các container gọi nhau trực tiếp qua `localhost`.
2. **Pod ↔ Pod**: Do **Pod network (CNI plugin)** giải quyết.
3. **Pod → Service**: Do **Service + service proxy** (`kube-proxy` hoặc proxy của CNI) giải quyết.
4. **Bên ngoài → Service**: Do **Service `NodePort` / `LoadBalancer`**, **Ingress** hoặc **Gateway API** giải quyết.
</details>

### Câu Hỏi 2: Mô hình mạng của Kubernetes đặt ra 4 yêu cầu cốt lõi nào đối với kết nối trong cluster?

<details>
<summary>Đáp án</summary>

1. **Mỗi Pod có một địa chỉ IP duy nhất** trong toàn cluster.
2. Mọi container trong cùng Pod **dùng chung network namespace** (chung IP, chung bảng cổng) nên giao tiếp với nhau qua `localhost`.
3. **Mọi Pod nói chuyện được với mọi Pod khác** (cùng node hay khác node) một cách **trực tiếp, không qua proxy và không qua NAT** (trừ khi cố ý phân đoạn mạng bằng NetworkPolicy; trên Windows quy tắc này không áp dụng cho Pod dùng host network).
4. Các **agent trên node** (`kubelet`, system daemon) nói chuyện được với mọi Pod chạy trên node đó.
</details>

### Câu Hỏi 3: Vì sao hai Pod khác nhau chạy trên cùng một node có thể cùng lắng nghe trên cổng 8080 mà không bị xung đột, và mô hình này khác gì với Docker bridge mặc định?

<details>
<summary>Đáp án</summary>

- Mỗi Pod có **network namespace và IP riêng**, tức là có bảng cổng độc lập (hoạt động như một "máy ảo nhỏ"). Xung đột cổng chỉ xảy ra giữa các container bên trong **cùng một Pod** (vì dùng chung network namespace) hoặc với Pod dùng `hostNetwork`.
- Khác với Docker bridge mặc định (NAT ra ngoài và cần publish cổng kiểu `-p 8080:80`), Kubernetes đặt yêu cầu **mạng phẳng, không NAT** giữa Pod với Pod. NAT trong Kubernetes chỉ xuất hiện ở các nơi khác như Service DNAT hoặc masquerade khi đi ra Internet.
</details>

### Câu Hỏi 4: Trong mô hình mạng Kubernetes, thành phần nào thực thi việc tạo network namespace cho Pod, cấp IP/định tuyến Pod, xử lý Service proxy và thực thi NetworkPolicy?

<details>
<summary>Đáp án</summary>

Kubernetes tự cài đặt rất ít, chủ yếu định nghĩa API và giao cho các thành phần ngoài thực thi:
- **Tạo network namespace cho Pod**: Container runtime thông qua **CRI**.
- **Pod network (cấp IP, dựng route/định tuyến)**: Pod network implementation, thường gọi là **CNI plugin**.
- **Service proxy**: `kube-proxy` mặc định, hoặc dịch vụ proxy riêng của một số CNI.
- **NetworkPolicy**: Thường do chính **CNI plugin** thực thi.
</details>

### Câu Hỏi 5: Khi một Pod mới được tạo, luồng phối hợp giữa `kube-scheduler`, `kubelet`, container runtime (CRI) và CNI plugin diễn ra như thế nào để Pod có được IP?

<details>
<summary>Đáp án</summary>

1. `kube-scheduler` gán Pod chưa có node vào một node N trên `kube-apiserver`.
2. `kubelet` trên node N watch thấy Pod được gán cho mình và yêu cầu container runtime (CRI) tạo Pod sandbox.
3. Container runtime tạo **network namespace** cho Pod, sau đó gọi CNI plugin (lệnh `ADD`) dựa theo cấu hình trong thư mục cấu hình CNI.
4. CNI plugin gắn interface vào network namespace, **cấp IP**, dựng route và trả kết quả IP về cho runtime.
5. Runtime báo sandbox sẵn sàng; `kubelet` cập nhật `status.podIP` lên `kube-apiserver`, sau đó các container ứng dụng mới được khởi chạy bên trong namespace này.
</details>

### Câu Hỏi 6: Một cluster Kubernetes cần quy hoạch 3 dải địa chỉ IP nào, do thành phần nào cấu hình, và nguyên tắc quan trọng nhất đối với 3 dải này là gì?

<details>
<summary>Đáp án</summary>

Ba dải IP trong cluster gồm:
- **Dải Pod** (ví dụ `10.244.0.0/16`, mỗi node được cấp một `podCIDR` con như `10.244.0.0/24`): Cấu hình ở **network plugin (CNI)**.
- **Dải Service** (ví dụ `10.96.0.0/16`): Cấu hình ở **`kube-apiserver`** qua cờ `--service-cluster-ip-range`.
- **Dải Node** (ví dụ `10.89.7.0/24`): Cấu hình ở **`kubelet`** hoặc **`cloud-controller-manager`**.

**Nguyên tắc bắt buộc**: 3 dải IP này **không được chồng lấn** nhau và cũng không được trùng với mạng có sẵn (VPC, VPN, mạng công ty). Vì dải Pod và Service rất khó thay đổi sau khi cluster đã chạy, cần lập kế hoạch dải IP trước khi dựng cluster.
</details>

### Câu Hỏi 7: Địa chỉ IP của Service khác gì với địa chỉ IP của Pod về mặt tồn tại trên hệ thống mạng?

<details>
<summary>Đáp án</summary>

- **IP của Pod** là IP thật được gắn trực tiếp vào interface `eth0` bên trong network namespace của Pod và gắn với vòng đời của Pod đó.
- **IP của Service** là **IP ảo**: không có network interface nào mang địa chỉ này; nó chỉ tồn tại trong các luật (rules) của service proxy (ví dụ `kube-proxy` thực hiện DNAT lưu lượng từ IP Service tới IP các Pod phía sau).
</details>

### Câu Hỏi 8: Khi quan sát thực tế trên một node Linux của cluster `kind` (dùng CNI mặc định `kindnet`), cấu hình CNI và các binary của CNI nằm ở những thư mục nào?

<details>
<summary>Đáp án</summary>

- **Cấu hình CNI**: Nằm trong `/etc/cni/net.d/` (trên kind là tệp `10-kindnet.conflist`, cấu hình chuỗi plugin `ptp` + `portmap` và IPAM `host-local`).
- **Binary CNI**: Nằm trong `/opt/cni/bin/` (chứa các binary như `host-local`, `loopback`, `portmap`, `ptp`).
</details>

### Câu Hỏi 9: Trên cùng một node (như quan sát trên `kind`), cặp `veth` và bảng route của node phối hợp với nhau như thế nào để các Pod giao tiếp được với nhau?

<details>
<summary>Đáp án</summary>

CNI tạo cho mỗi Pod một cặp **veth**:
- Một đầu nằm bên trong network namespace của Pod là `eth0` (ví dụ `eth0@if10` cho biết đầu bên kia là interface số 10 trên node).
- Đầu còn lại nằm trên node dưới tên `vethXXXX`.
- Trên bảng route của node có một route riêng cho từng Pod có dạng `10.244.0.x dev vethXXXX scope host`, giúp node định tuyến gói tin đi trực tiếp giữa các Pod trên cùng node.
</details>

### Câu Hỏi 10: Các CNI plugin khác nhau (như kindnet, Calico, Cilium, Flannel) thường khác nhau ở những khía cạnh nào?

<details>
<summary>Đáp án</summary>

Các CNI plugin khác nhau ở:
1. **Cách định tuyến giữa các node** (như dùng mạng overlay, routing trực tiếp, hay eBPF...).
2. **Khả năng hỗ trợ NetworkPolicy**.
3. Việc có **thay thế `kube-proxy`** hay vẫn giữ `kube-proxy` mặc định.
</details>

### Câu Hỏi 11: Nếu tạo một `NetworkPolicy` (ví dụ "deny all") thành công nhưng các Pod vẫn gọi được nhau, nguyên nhân cốt lõi có thể là gì và cần thực hành kiểm tra ra sao?

<details>
<summary>Đáp án</summary>

Nguyên nhân có thể là **CNI plugin đang dùng không hỗ trợ thực thi NetworkPolicy**. Một số CNI đơn giản không cài đặt phần thực thi này; khi đó Kubernetes API vẫn nhận và tạo object `NetworkPolicy` bình thường nhưng chính sách hoàn toàn **không có tác dụng**.

Vì vậy, không nên chỉ nhìn trạng thái tạo object thành công mà phải:
1. Xác nhận CNI plugin có hỗ trợ NetworkPolicy.
2. **Kiểm thử thực tế** bằng một request thật xem traffic có bị chặn đúng như thiết kế hay không.
</details>

### Câu Hỏi 12: Dùng những lệnh `kubectl` nào để xem (1) IP của từng Pod kèm node đang chạy nó, (2) `podCIDR` của node, (3) dải Service của cluster, và (4) cấu hình `eth0` + bảng route bên trong một Pod?

<details>
<summary>Đáp án</summary>

- **Xem IP Pod và node đang chạy Pod**: `kubectl get pods -A -o wide`
- **Xem `podCIDR` cấp cho node**: `kubectl get node -o jsonpath='{.items[0].spec.podCIDR}{"\n"}'`
- **Xem dải Service (`--service-cluster-ip-range`)**: `kubectl -n kube-system get pod -l component=kube-apiserver -o yaml | grep service-cluster-ip-range`
- **Xem `eth0` và bảng route bên trong Pod (ví dụ Pod `tmp`)**:
  - `kubectl exec tmp -- ip addr show eth0`
  - `kubectl exec tmp -- ip route`
</details>

### Câu Hỏi 13: Làm thế nào để tự kiểm chứng yêu cầu "Pod gọi Pod trực tiếp, không qua NAT"?

<details>
<summary>Đáp án</summary>

1. Lấy địa chỉ IP trực tiếp của Pod đích bằng `kubectl get pods -l <label> -o wide`.
2. Từ một Pod nguồn, gọi thẳng tới địa chỉ `<IP-pod-đích>:<port>` (không đi qua Service), ví dụ bằng `wget` trong `kubectl exec`.
3. Kiểm tra IP nguồn mà ứng dụng ở Pod đích nhận được (qua log của ứng dụng đích hoặc `tcpdump`): nếu thấy **IP nguồn chính là IP của Pod gọi** (không bị đổi thành IP node hay IP khác) thì nghĩa là kết nối không đi qua NAT.
</details>

### Câu Hỏi 14: Vì sao không nên hard-code địa chỉ IP của Pod vào cấu hình ứng dụng, ngay cả với StatefulSet?

<details>
<summary>Đáp án</summary>

Vì **IP của Pod gắn với vòng đời của Pod**. Khi một Pod bị xóa và tạo lại (ngay cả với Pod trong StatefulSet giữ nguyên tên như `web-1`), Pod mới vẫn sẽ nhận một **địa chỉ IP mới** (ví dụ từ `10.244.0.19` đổi sang `10.244.0.22`), khiến các cấu hình hard-code IP cũ bị lỗi kết nối. Do đó, phải luôn truy cập thông qua **Service** hoặc **DNS**.
</details>

### Câu Hỏi 15: Khi một Pod không gọi được Service, vì sao kết quả "Pod ping được Pod" không đủ để kết luận mạng Service bình thường, và nên chẩn đoán theo thứ tự các tầng nào?

<details>
<summary>Đáp án</summary>

Bởi vì giao tiếp **Pod ↔ Pod** do **CNI** đảm nhiệm, còn giao tiếp **Pod → Service** phụ thuộc thêm vào **`kube-proxy` / service proxy** và **DNS**. Hai tầng này có thể gặp lỗi độc lập với nhau.

Khi chẩn đoán sự cố kết nối, cần kiểm tra lần lượt từng tầng:
1. Gọi trực tiếp **Pod IP** (kiểm tra tầng CNI).
2. Gọi qua **Service ClusterIP** (kiểm tra tầng `kube-proxy` / service proxy).
3. Gọi qua **tên DNS** (kiểm tra tầng Cluster DNS).
</details>
