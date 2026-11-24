# Review: 7_3_2 Networking Advertised Listener

### Câu Hỏi 1: Tại sao khi chạy Apache Kafka trên Kubernetes, client không thể chỉ đi qua một Load Balancer chung như ứng dụng web thông thường mà phải kết nối trực tiếp tới từng broker?

<details>
<summary>Đáp án</summary>

Khác với ứng dụng web thông thường chỉ cần đi qua một Load Balancer chung, dữ liệu topic trong Kafka được chia theo nhiều partition nằm trên các broker khác nhau. Do đó, để ghi và đọc dữ liệu, Kafka client phải kết nối trực tiếp tới đúng broker đang giữ **partition leader** (hoặc replica phù hợp) của topic đó.

</details>

### Câu Hỏi 2: Quy trình kết nối 2 bước của Kafka client (bao gồm cả các công cụ CLI như `kafka-topics.sh`) diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

Mọi Kafka client đều thực hiện kết nối qua 2 bước:

1. **Bước 1 — Kết nối Bootstrap (Lấy bản đồ cluster)**: Client dùng địa chỉ trong `bootstrap.servers` làm điểm liên lạc ban đầu để gửi yêu cầu lấy metadata của cluster (không gửi toàn bộ dữ liệu đọc/ghi qua địa chỉ này). Broker trả về danh sách broker, thông tin partition leader của topic và địa chỉ được khai báo trong `advertised.listeners` của từng broker.
2. **Bước 2 — Kết nối trực tiếp tới Partition Leader**: Dựa trên metadata vừa nhận, client mở kết nối TCP trực tiếp tới địa chỉ `advertised.listeners` của broker đang giữ partition leader (hoặc replica phù hợp) để thực hiện ghi và đọc dữ liệu.

Các công cụ CLI như `kafka-topics.sh --bootstrap-server <host>:<port> --list` cũng hoạt động như một Kafka client và thực hiện đúng quy trình 2 bước này.

</details>

### Câu Hỏi 3: Sự khác nhau giữa `listeners` và `advertised.listeners` trong file cấu hình `server.properties` là gì? Nếu bỏ trống `advertised.listeners` thì Kafka xử lý ra sao?

<details>
<summary>Đáp án</summary>

- **`listeners` (cổng lắng nghe thực tế)**: Là danh sách các địa chỉ mạng (theo mẫu `LISTENER_NAME://host:port`, phân tách bằng dấu phẩy) mà tiến trình broker thực sự mở socket để lắng nghe trên máy chủ hoặc container.
- **`advertised.listeners` (địa chỉ tự giới thiệu)**: Là danh sách các địa chỉ (cũng theo mẫu `LISTENER_NAME://host:port`) mà broker công bố cho client và các broker khác trong metadata để kết nối tới nó ở Bước 2.
- **Nếu bỏ trống `advertised.listeners`**: Kafka mặc định sử dụng giá trị của `listeners`.

</details>

### Câu Hỏi 4: Hai tham số `listener.security.protocol.map` và `inter.broker.listener.name` có vai trò gì khi cấu hình mạng cho Kafka broker?

<details>
<summary>Đáp án</summary>

- **`listener.security.protocol.map`**: Ánh xạ từng tên listener tùy chỉnh sang giao thức bảo mật tương ứng của Kafka như `PLAINTEXT`, `SSL`, `SASL_PLAINTEXT` hoặc `SASL_SSL` (ví dụ: `INTERNAL:PLAINTEXT,EXTERNAL:SSL`).
- **`inter.broker.listener.name`**: Chỉ định tên listener mà các broker dùng để giao tiếp nội bộ với nhau (ví dụ cho replication), giúp tách biệt luồng giao tiếp giữa các broker với listener dành cho client bên ngoài.

</details>

### Câu Hỏi 5: Có thể sử dụng địa chỉ `0.0.0.0` cho cả `listeners` và `advertised.listeners` không? Tại sao?

<details>
<summary>Đáp án</summary>

- **Với `listeners`**: **Có thể** dùng `0.0.0.0` để broker bind và lắng nghe trên mọi network interface của máy chủ hoặc container (ví dụ `INTERNAL://0.0.0.0:9092`).
- **Với `advertised.listeners`**: **Không được** dùng `0.0.0.0`. Tham số này bắt buộc phải khai báo hostname hoặc IP cụ thể mà client có thể phân giải và kết nối tới được (ví dụ `kafka-0.kafka-headless.kafka.svc.cluster.local:9092` hoặc IP external của broker).

</details>

### Câu Hỏi 6: Nguyên nhân gốc rễ của lỗi "Bootstrap thành công nhưng sau đó gặp `TimeoutException`" khi kết nối tới Kafka trên Kubernetes từ bên ngoài (kể cả qua `kubectl port-forward`) là gì?

<details>
<summary>Đáp án</summary>

Lỗi xảy ra do sự lệch pha giữa **Bước 1** và **Bước 2**:

1. Ở **Bước 1**, client bên ngoài Kubernetes kết nối thành công tới điểm bootstrap (như `kubectl port-forward`, `NodePort` hay `LoadBalancer`) và nhận về metadata từ broker.
2. Trong metadata đó, `advertised.listeners` của broker lại đang quảng bá địa chỉ DNS nội bộ của Kubernetes cluster (ví dụ `*.svc.cluster.local`).
3. Ở **Bước 2**, client cố mở kết nối TCP trực tiếp tới địa chỉ DNS nội bộ đó và bị **timeout** (`TimeoutException`) vì mạng bên ngoài cluster không thể phân giải hoặc định tuyến được địa chỉ nội bộ này. Riêng `kubectl port-forward` chỉ chuyển tiếp TCP chứ không sửa nội dung metadata trả về nên vẫn gặp lỗi tương tự.

</details>

### Câu Hỏi 7: Tại sao Kafka trên Kubernetes cần cấu hình ít nhất hai listener tách biệt cho nội bộ và bên ngoài?

<details>
<summary>Đáp án</summary>

Vì môi trường mạng bên trong và bên ngoài Kubernetes cluster tách biệt nhau: tên DNS nội bộ `.svc.cluster.local` chỉ hoạt động trong cluster và không thể phân giải được từ bên ngoài. Do đó cần ít nhất hai listener:

- **Listener nội bộ**: Quảng bá DNS trong cluster để các Pod cùng cluster kết nối (và dùng cho `inter.broker.listener.name` phục vụ replication giữa các broker).
- **Listener bên ngoài**: Quảng bá địa chỉ mà mạng bên ngoài có thể phân giải và định tuyến tới được.

</details>

### Câu Hỏi 8: Vì sao listener nội bộ trên Kubernetes sử dụng Headless Service (`clusterIP: None`) kết hợp với StatefulSet thay vì dùng một `ClusterIP` Service thông thường?

<details>
<summary>Đáp án</summary>

- Một **`ClusterIP` Service thông thường** cấp một IP ảo dùng chung và cân bằng tải ngẫu nhiên tới các Pod phía sau. Điều này không phù hợp cho Bước 2 vì client cần kết nối thẳng tới đúng broker đang giữ partition leader.
- **`Headless Service` (`clusterIP: None`)** không cấp phát IP ảo dùng chung; khi kết hợp với **StatefulSet**, DNS nội bộ sẽ trả về bản ghi ổn định trỏ thẳng tới từng Pod riêng lẻ theo mẫu `<pod-name>.<service-name>.<namespace>.svc.cluster.local`, giúp client nội bộ gọi đúng Pod broker leader.

</details>

### Câu Hỏi 9: Khi expose Kafka ra ngoài cluster bằng `NodePort` hoặc `LoadBalancer`, `advertised.listeners` cần cấu hình thế nào? Nếu chỉ tạo một `LoadBalancer` Service dùng chung cho `advertised.listeners` của mọi broker thì hậu quả là gì?

<details>
<summary>Đáp án</summary>

- **Với `NodePort`**: Kubernetes mở cổng tĩnh trên các Node, nên `advertised.listeners` của mỗi broker phải quảng bá IP/hostname của Node kèm đúng cổng NodePort dẫn về broker đó.
- **Với `LoadBalancer`**: Bên cạnh bootstrap Service chung, mỗi broker cần có một `LoadBalancer` Service riêng để `advertised.listeners` quảng bá địa chỉ external độc lập trỏ đúng về Pod broker đó (nhược điểm là tốn chi phí nhiều LB khi có nhiều broker).
- **Hậu quả nếu dùng chung một `LoadBalancer` cho mọi broker**: Ở Bước 2, kết nối của client sẽ bị Load Balancer cân bằng tải ngẫu nhiên sang nhầm broker không giữ partition leader.

</details>

### Câu Hỏi 10: Khi dùng `Ingress` (hoặc Route trên OpenShift) trong Strimzi để expose Kafka, tại sao phải dùng TLS passthrough kết hợp SNI thay vì định tuyến theo HTTP path? Trước khi triển khai với Strimzi cần lưu ý điều gì?

<details>
<summary>Đáp án</summary>

- **Lý do dùng TLS passthrough + SNI**: Kafka sử dụng giao thức TCP nhị phân chứ không dùng HTTP, nên Ingress không thể định tuyến theo HTTP path. Vì vậy, Strimzi phải bật TLS và cấu hình Ingress hỗ trợ **TLS passthrough** kết hợp đọc **SNI (Server Name Indication)** ngay trong bước TLS handshake để định tuyến luồng TCP tới đúng hostname của từng broker.
- **Lưu ý trước khi triển khai với Strimzi Operator**: Luôn đối chiếu tài liệu Strimzi đúng phiên bản đang sử dụng để kiểm tra các loại listener được hỗ trợ (`internal`, `nodeport`, `loadbalancer`, `ingress`, `cluster-ip`) cũng như các yêu cầu về TLS và DNS đi kèm.

</details>
