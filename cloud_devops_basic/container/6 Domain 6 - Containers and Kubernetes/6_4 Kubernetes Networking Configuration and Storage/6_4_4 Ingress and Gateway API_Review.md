# Ôn Tập: 6_4_4 Ingress and Gateway API

### Câu Hỏi 1: Tại sao cần có Ingress hoặc Gateway API khi Kubernetes đã có `Service` loại `LoadBalancer`?

<details>
<summary>Đáp án</summary>

Theo bài học, `Service` loại `LoadBalancer` cấp **mỗi Service một load balancer riêng** và chỉ định tuyến ở tầng **L4**. Trong khi đó, với ứng dụng web, ta thường cần **một cửa vào duy nhất** rồi phân luồng traffic ở tầng ứng dụng dựa trên `host`, `path`, `header`, `TLS` và `trọng số` (`weight`). Ingress và Gateway API là hai API của Kubernetes giải quyết bài toán này.
</details>

### Câu Hỏi 2: So sánh những điểm khác biệt cốt lõi giữa `Ingress` và `Gateway API`?

<details>
<summary>Đáp án</summary>

Dựa trên bảng so sánh và phần mở đầu của bài học:

- **Trạng thái phát triển**: `Ingress` đã GA từ v1.19 nhưng ở trạng thái **"frozen"** (không phát triển thêm, chưa có kế hoạch gỡ bỏ). `Gateway API` là họ CRD đang phát triển và là **hướng được dự án Kubernetes khuyến nghị** (*"The Kubernetes project recommends using Gateway instead of Ingress"*).
- **Phạm vi giao thức**: `Ingress` chỉ hỗ trợ HTTP(S), còn `Gateway API` hỗ trợ nhiều giao thức hơn như HTTP, gRPC, TLS...
- **Phân tách vai trò**: `Ingress` gộp chung vào một object cho tất cả, trong khi `Gateway API` tách theo vai trò (hạ tầng / vận hành / đội ứng dụng).
- **Tính năng nâng cao & tính di động (portability)**: Với `Ingress`, các tính năng nâng cao (như chia trọng số canary) phụ thuộc vào **annotation riêng của từng controller** nên không portable khi đổi controller. Với `Gateway API`, các tính năng phổ biến (chia trọng số, khớp header, sửa request) **nằm ngay trong API chuẩn**, chạy thống nhất trên mọi implementation hỗ trợ.
- **Cài đặt**: `Ingress` cần cài Ingress controller; `Gateway API` cần cài **CRD** + một **implementation**.
</details>

### Câu Hỏi 3: Trong `Ingress` (hệ thống cũ), `ingressClassName`, `pathType: Prefix` và `spec.tls[].secretName` hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **`ingressClassName`**: Bản thân `Ingress` chỉ là file cấu hình; nếu không có Ingress controller chạy thì không có tác dụng. `ingressClassName` dùng để chỉ định Ingress controller nào sẽ xử lý object Ingress đó.
- **`pathType: Prefix`**: Mỗi rule có `host` (tùy chọn) và `paths` với `pathType` bắt buộc (`Exact`, `Prefix`, hoặc `ImplementationSpecific`). Riêng `Prefix` khớp theo **từng đoạn giữa các dấu `/`**: ví dụ `/foo` khớp với `/foo/bar` nhưng **không** khớp với `/foobar`.
- **`spec.tls[].secretName`**: Trỏ tới một `Secret` loại `kubernetes.io/tls` chứa chứng chỉ và private key để phục vụ TLS.
</details>

### Câu Hỏi 4: Vì sao không thể dùng ngay `Gateway` hay `HTTPRoute` trên cluster Kubernetes mặc định? Cần đủ 3 thành phần nào để một route hoạt động?

<details>
<summary>Đáp án</summary>

Khác với `Pod`, `Service` hay `Ingress` (là resource có sẵn trong mọi cluster), Gateway API là một *"add-on containing API kinds"* định nghĩa dưới dạng **custom resource**. Để một route hoạt động được, cluster cần đủ **3 thành phần**:

1. **CRD của Gateway API**: Đóng vai trò "từ điển kiểu dữ liệu" để dạy API server biết `Gateway`, `HTTPRoute`... là gì. Nếu thiếu, `kubectl apply` sẽ báo lỗi dạng `no matches for kind "HTTPRoute"`.
2. **Implementation (controller)**: Chương trình chạy trong cluster (ví dụ Envoy Gateway) đọc các object và cấu hình proxy/load balancer thật để chuyển traffic. Nếu thiếu, object vẫn tạo được nhưng nằm im, không có `ADDRESS`/`Accepted` và không có traffic nào đi qua.
3. **Các object cấu hình của bạn**: `GatewayClass`, `Gateway`, `HTTPRoute` để khai báo mở cổng nào và route đi đâu.
</details>

### Câu Hỏi 5: Hai kênh phát hành CRD của Gateway API là `Standard` và `Experimental` khác nhau ở điểm nào?

<details>
<summary>Đáp án</summary>

- **Standard channel**: Chứa các tài nguyên/tính năng đã ổn định (GA/beta), được cài qua `standard-install.yaml` (ví dụ đủ dùng cho các tác vụ chuẩn trong bài học).
- **Experimental channel**: Cài qua `experimental-install.yaml`, có thể tiếp tục thay đổi ở các bản sau, **kể cả thay đổi phá vỡ tương thích** (*breaking changes*).
</details>

### Câu Hỏi 6: Giải thích vai trò của 3 kind cốt lõi (`GatewayClass`, `Gateway`, `HTTPRoute`) và kể tên các kind ổn định khác được nêu trong bài?

<details>
<summary>Đáp án</summary>

- **`GatewayClass`**: Nhóm các Gateway dùng chung cấu hình và chỉ định implementation (controller) nào sẽ xử lý chúng thông qua `spec.controllerName`.
- **`Gateway`**: Đại diện cho một thể hiện hạ tầng nhận traffic cụ thể (cổng vào), khai báo `gatewayClassName` và danh sách `listeners` (cổng, giao thức, `hostname`, TLS, `allowedRoutes`).
- **`HTTPRoute`**: Định nghĩa luật định tuyến HTTP (`rules` gồm `matches` và `backendRefs`), ánh xạ traffic từ listener của Gateway tới backend (thường là `Service`).

Ngoài 3 kind trên, tài liệu Kubernetes liệt kê thêm **`GRPCRoute`** (cho gRPC) là kind ổn định, và tài liệu Gateway API ghi thêm **`TLSRoute`** (định tuyến theo kết nối TLS, ví dụ chế độ `Passthrough`) đã đạt GA và thuộc Standard channel từ v1.5.0.
</details>

### Câu Hỏi 7: Mô hình phân vai (Role-Oriented) của Gateway API giao từng kind cho ai quản lý, và lợi ích là gì?

<details>
<summary>Đáp án</summary>

Gateway API tách API theo 3 vai trò chịu trách nhiệm, giúp đội phát triển ứng dụng không phải đụng vào cấu hình hạ tầng:

1. **Infrastructure Provider** → quản lý **`GatewayClass`**: Quản lý hạ tầng cho nhiều tenant, gắn class với controller qua `controllerName`.
2. **Cluster Operator** → quản lý **`Gateway`**: Quản lý cluster, chính sách mạng, mở cổng/giao thức/TLS ở `listeners` và giới hạn quyền gắn route qua `allowedRoutes`.
3. **Application Developer** → quản lý **`HTTPRoute` / `GRPCRoute`**: Cấu hình luật định tuyến ở cấp ứng dụng và ghép tới các `Service` đích.
</details>

### Câu Hỏi 8: Các liên kết nối giữa `HTTPRoute`, `Gateway`, `GatewayClass` và `Service` là gì? Cơ chế tin cậy hai chiều (*bidirectional trust model*) hoạt động ra sao?

<details>
<summary>Đáp án</summary>

Chuỗi liên kết giữa các thành phần:
- `HTTPRoute` dùng **`parentRefs`** để gắn vào `Gateway`.
- `HTTPRoute` dùng **`backendRefs`** (kèm `weight` nếu chia tải) để trỏ tới `Service` (rồi tới `Pod`).
- `Gateway` dùng **`gatewayClassName`** để tham chiếu **đúng một** `GatewayClass` (trong khi nhiều Route có thể gắn vào cùng một Gateway).
- `GatewayClass` dùng **`controllerName`** để chỉ ra Implementation (controller) quản lý nó.

**Cơ chế tin cậy hai chiều (*bidirectional trust model*)**:
- Phía Route chủ động *xin* gắn vào Gateway bằng `parentRefs`.
- Phía Gateway *cho phép hoặc từ chối* bằng `listeners[].allowedRoutes`. **Mặc định, Gateway chỉ nhận Route nằm cùng namespace** (`from: Same`); nếu muốn cho phép Route ở namespace khác gắn vào thì bắt buộc phải cấu hình lại `allowedRoutes`.
</details>

### Câu Hỏi 9: Khi triển khai Gateway API từ đầu, thứ tự cài đặt chuẩn gồm những bước nào và vì sao phải làm đúng thứ tự?

<details>
<summary>Đáp án</summary>

Mỗi bước phụ thuộc vào bước liền trước nên sai thứ tự sẽ gây lỗi. Quy trình gồm:

- **Bước 0 (Kiểm tra trước)**: Chạy `kubectl get crd | grep gateway.networking.k8s.io` xem cluster đã có CRD chưa để tránh cài chồng.
- **Bước 1 (Cài CRD)**: Cài CRD Gateway API (hoặc qua Helm chart của implementation như Envoy Gateway, hoặc tự cài bằng `standard-install.yaml`). Chưa có CRD thì không tạo được các object Gateway/Route.
- **Bước 2 (Cài Implementation & chờ sẵn sàng)**: Cài controller và đợi Deployment sẵn sàng (`kubectl wait ... --for=condition=Available`). Không có controller thì không có thành phần nào xử lý object.
- **Bước 3 (Có `GatewayClass`)**: Kiểm tra `kubectl get gatewayclass` thấy `ACCEPTED` là `True`. Gateway cần một class tồn tại để biết controller nào quản lý.
- **Bước 4 (Tạo `Gateway`)**: Kiểm tra `kubectl get gateway` thấy `PROGRAMMED` và có `ADDRESS`. Route cần Gateway tồn tại để gắn vào.
- **Bước 5 (Tạo Deployment + Service của app)**: Kiểm tra `kubectl get svc,endpointslice`. Route cần Service đích tồn tại để tham chiếu hợp lệ (`ResolvedRefs`).
- **Bước 6 (Tạo `HTTPRoute`)**: Nối tất cả lại và kiểm tra `kubectl describe httproute` thấy cả `Accepted` và `ResolvedRefs` đều là `True`.
</details>

### Câu Hỏi 10: Vì sao cần kiểm tra `kubectl get crd | grep gateway.networking.k8s.io` trước khi cài đặt, và cần lưu ý gì khi chọn Implementation?

<details>
<summary>Đáp án</summary>

- Nếu nhà cung cấp Kubernetes đã cài và quản lý sẵn CRD Gateway API trên cluster, **tuyệt đối không cài chồng** thêm bộ CRD khác (cả Envoy Gateway cũng cảnh báo điều này). Trước khi cài cần kiểm tra sự tồn tại và annotation phiên bản của CRD.
- Khi chọn Implementation (cloud riêng, bare-metal, hay đa dụng), cần đối chiếu **ma trận tương thích** của implementation đó vì mỗi implementation có yêu cầu riêng về phiên bản Kubernetes và phiên bản CRD Gateway API, đồng thời làm theo hướng dẫn chính thức của implementation đã chọn.
</details>

### Câu Hỏi 11: Cơ chế `backendRefs[].weight` trong `HTTPRoute` tính tỉ lệ như thế nào? Nếu đang chia `90` và `10` rồi thêm backend thứ ba `weight: 100` vào cùng rule thì tỉ lệ mới là bao nhiêu?

<details>
<summary>Đáp án</summary>

- `backendRefs[].weight` là **tỉ lệ tương đối trong một rule**, không phải con số phần trăm cố định; mẫu số là **tổng tất cả `weight` trong cùng rule đó**.
- Giá trị mặc định của `weight` là `1`. Nếu một rule chỉ có duy nhất một backend thì backend đó luôn nhận **100%** traffic bất kể giá trị `weight` là bao nhiêu. Đặt `weight: 0` nghĩa là không gửi traffic tới backend đó (dùng để rollback nhanh).
- Với ví dụ thêm backend thứ ba `weight: 100` vào cùng rule đang có `90` và `10`: tổng mới là `90 + 10 + 100 = 200`, nên tỉ lệ chia traffic mới lần lượt là **45%**, **5%**, và **50%**.
</details>

### Câu Hỏi 12: Quy trình canary 3 bước theo tài liệu Gateway API gồm những giai đoạn nào, và có 2 cạm bẫy thực tế nào khi chia tải bằng `weight`?

<details>
<summary>Đáp án</summary>

**Quy trình canary 3 bước**:
1. **Canary theo header**: Tạo một rule riêng khớp header thử nghiệm (ví dụ `traffic: test`) để đưa traffic test tới `v2`, trong khi người dùng thật vẫn đi 100% vào `v1`.
2. **Chia dần theo trọng số**: Chuyển sang chia tải thực tế (ví dụ 90/10) và theo dõi lỗi, độ trễ.
3. **Hoàn tất (hoặc rollback)**: Khi ổn định thì đặt `v1` `weight: 0` và `v2` `weight: 1`; nếu gặp sự cố chỉ cần chỉnh trọng số quay lại.

**2 cạm bẫy thực tế cần tránh**:
- **Không đặt các backend ở hai rule tách biệt hoặc quên tổng `weight`**: Phải đặt các backend muốn chia tải vào **cùng một rule**, và nên giữ tổng bằng 100 để dễ đọc, tránh nhầm lẫn tỉ lệ.
- **Chia theo `weight` là chia theo từng request, không bám phiên (sticky session)**: Không đảm bảo một người dùng luôn nhìn thấy cùng một phiên bản qua các lần tải trang. Nếu ứng dụng canary cần giữ trạng thái phiên, phải dùng định tuyến theo header/cookie hoặc cơ chế bám phiên riêng của implementation.
</details>

### Câu Hỏi 13: Để cấu hình TLS Termination tại `Gateway` listener cần chuẩn bị những điều kiện gì? Nếu `Secret` TLS nằm khác namespace với `Gateway` thì phải làm sao?

<details>
<summary>Đáp án</summary>

Trên `Gateway`, cấu hình listener với `protocol: HTTPS`, `tls.mode: Terminate` (mặc định nếu bỏ trống) và `certificateRefs` trỏ tới Secret.

**Các điều kiện chuẩn bị trước khi apply Gateway**:
1. **Tạo sẵn Secret loại `kubernetes.io/tls` trước khi apply Gateway** (ví dụ `kubectl create secret tls hello-tls --cert=tls.crt --key=tls.key`), vì `certificateRefs` chỉ tham chiếu chứ không tự tạo Secret.
2. **Cặp `tls.crt` / `tls.key` hợp lệ và khớp tên miền**: Chứng chỉ phải khớp với `hostname` khai báo ở listener (trong lab tự ký có thể dùng `openssl`, nhưng không đặt private key vào repo; môi trường thật dùng CA thật hoặc **cert-manager** để cấp và gia hạn tự động).
3. **Cổng 443 đến được & `HTTPRoute` gắn vào listener**: Trên `kind` không có LoadBalancer thì cần `kubectl port-forward` tới Service của proxy ở cổng 443; `hostnames` của `HTTPRoute` cần giao với `hostname` của listener.
4. **Xử lý khác namespace**: Đơn giản nhất là đặt Secret cùng namespace với Gateway. Nếu Secret nằm **khác namespace**, bắt buộc phải có một **`ReferenceGrant`** ở namespace đích (nơi chứa Secret) cho phép tham chiếu chéo; nếu thiếu, tham chiếu sẽ không hợp lệ (`ResolvedRefs: False`).

*Lưu ý về mã hóa*: `Terminate` chỉ giải mã TLS ở đoạn **downstream** (client → Gateway); đoạn **upstream** (Gateway → Pod) mặc định vẫn là HTTP thường trừ khi cấu hình riêng bằng `BackendTLSPolicy`. Còn chế độ `Passthrough` chỉ áp dụng cho listener có `protocol: TLS`.
</details>

### Câu Hỏi 14: Khi `kubectl get httproute` thấy đã có object nhưng traffic không vào được backend, bạn cần chẩn đoán bằng lệnh nào và kiểm tra những gì?

<details>
<summary>Đáp án</summary>

Thay vì nghi ngờ proxy ngay, cần kiểm tra trạng thái các object theo thứ tự bằng các lệnh chẩn đoán:
- `kubectl describe httproute <tên-route>` → đọc **`Status.Parents[].Conditions`** (`Accepted` và `ResolvedRefs` phải là `True`).
- `kubectl describe gateway <tên-gateway>` và `kubectl get gateway -A` → xem `Accepted`, `Programmed` và `ADDRESS` (nếu TLS `ResolvedRefs` là `False`, nghi ngờ Secret không tồn tại, sai tên, sai namespace hoặc thiếu `ReferenceGrant`).
- `kubectl get gatewayclass` → kiểm tra `ACCEPTED` của class.

**Nguyên nhân thường gặp khiến `HTTPRoute` tồn tại nhưng không nhận traffic**: Route nằm khác namespace với Gateway trong khi `allowedRoutes` đang để mặc định `from: Same`; `parentRefs` ghi sai tên Gateway; hoặc Service backend tham chiếu không tồn tại.
</details>

### Câu Hỏi 15: Tình trạng hiện tại của `Ingress NGINX` là gì? Làm sao kiểm tra cluster có đang dùng nó không và cần lưu ý gì khi di trú?

<details>
<summary>Đáp án</summary>

- **Trạng thái nghỉ hưu**: **Ingress NGINX** (của cộng đồng Kubernetes) đã hết bảo trì từ **tháng 3-2026**: không còn bản phát hành, bản sửa lỗi hay vá bảo mật, repo `kubernetes/ingress-nginx` đã archived. Dù các Deployment cũ **vẫn tiếp tục chạy** (nên dễ bị bỏ quên), Steering Committee và Security Response Committee (29-01-2026) cảnh báo việc giữ lại *"leaves you and your users vulnerable to attack"* và **không có giải pháp thay thế drop-in** nào.
- **Không nhầm lẫn**: Đây là controller cộng đồng, khác với **NGINX Ingress** của F5.
- **Cách kiểm tra cluster có đang dùng hay không**:
  ```bash
  kubectl get pods --all-namespaces --selector app.kubernetes.io/name=ingress-nginx
  ```
- **Lưu ý khi di trú**: Có thể dùng công cụ hỗ trợ **`ingress2gateway`** (sang Gateway API) hoặc chuyển sang controller Ingress khác còn được bảo trì. Tuy nhiên, cần đọc kỹ cảnh báo hành vi đặc thù của `ingress-nginx` (ví dụ regex được hiểu là prefix và không phân biệt hoa thường) và **bắt buộc phải kiểm thử lại hành vi** (regex, rewrite, default backend) sau khi chuyển đổi.
</details>
