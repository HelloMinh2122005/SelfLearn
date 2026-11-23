# Ôn Tập: 6_5_1 Helm Core Concepts

### Câu Hỏi 1: Helm là gì và nó giải quyết những bài toán nào trong Kubernetes?

<details>
<summary>Đáp án</summary>

**Helm** là trình quản lý gói (**package manager**) cho Kubernetes — tương tự như `apt` trên Linux hay `npm` trong Node.js — giúp định nghĩa, cài đặt, nâng cấp và gỡ bỏ các ứng dụng container hóa từ đơn lẻ đến phức tạp.

Khi triển khai ứng dụng gồm nhiều file YAML Kubernetes rời rạc (Deployment, Service, ConfigMap, Ingress...) trên nhiều môi trường (dev, staging, prod), Helm giải quyết các bài toán cốt lõi sau:
- **Quản lý tập trung & tái sử dụng**: Đóng gói toàn bộ manifest Kubernetes của ứng dụng thành một **Chart** có phiên bản, dễ dàng chia sẻ và cài đặt như một khối thống nhất.
- **Tham số hóa cấu hình**: Kết hợp cùng một Chart với các cấu hình `values` riêng (như `values.yaml`) để triển khai thành nhiều bản chạy độc lập theo từng môi trường mà không phải copy/sửa tay nhiều bộ YAML.
- **Nâng cấp, rollback & gỡ sạch sẽ**: Theo dõi lịch sử qua các **Revision** để nâng cấp hoặc quay lại bản trước khi gặp lỗi, đồng thời xóa sạch toàn bộ tài nguyên liên quan chỉ với một lệnh `helm uninstall` mà không lo sót file.
</details>

### Câu Hỏi 2: Helm gồm những thành phần cốt lõi nào về mặt khái niệm và kiến trúc?

<details>
<summary>Đáp án</summary>

Về tổng thể kiến trúc và khái niệm, Helm gồm các thành phần cốt lõi sau:
- **Kiến trúc Client-Only (không cần Tiller)**: Từ Helm 3 trở đi, Helm loại bỏ thành phần server **Tiller** (từng chạy trong cluster ở Helm 2) và chỉ gồm **Helm CLI client** (giao diện dòng lệnh cho người dùng) cùng **Helm library** (xử lý logic và giao tiếp trực tiếp với `kube-apiserver` bằng quyền `kubeconfig`/RBAC của người dùng).
- **Chart**: Gói (thư mục) chứa toàn bộ manifest Kubernetes của ứng dụng cùng cấu hình mặc định.
- **Values**: Bộ tham số cấu hình (thường từ file `values.yaml`) được hòa trộn với Chart để tùy biến ứng dụng khi cài đặt.
- **Release**: Một thực thể cụ thể của Chart đang chạy trong cluster sau khi kết hợp với `values` (cùng một Chart có thể tạo ra nhiều Release độc lập với tên riêng).
- **Revision**: Số thứ tự tăng dần (`v1`, `v2`, `v3`...) ghi lại lịch sử cấu hình của một Release qua mỗi lần cài đặt, nâng cấp hoặc rollback.
- **Repository / OCI Registry**: Kho lưu trữ chia sẻ Chart qua HTTP (`index.yaml`) hoặc qua OCI registry.
- **Lưu trữ trạng thái bằng Kubernetes Secret**: Helm không cần cơ sở dữ liệu riêng mà lưu trực tiếp metadata và lịch sử của từng Release trong Kubernetes **Secret** (`sh.helm.release.v1.<tên>.v<revision>`, gắn nhãn `owner=helm`) ngay trong namespace của Release đó.
</details>

### Câu Hỏi 3: So với việc dùng `kubectl apply` trên các file YAML rời rạc, Helm giải quyết những bài toán thực tế nào khi triển khai ứng dụng ra nhiều môi trường?

<details>
<summary>Đáp án</summary>

Khi quản lý ứng dụng gồm nhiều tài nguyên (Deployment, Service, ConfigMap, Ingress...) trên nhiều môi trường (dev, staging, prod), Helm giải quyết 3 vấn đề cốt lõi:
1. **Rollback khi nâng cấp hỏng**: Theo dõi lịch sử từng lần cài đặt/nâng cấp qua **Revision**, giúp quay lại bản trước dễ dàng thay vì phải tự lưu giữ file YAML cũ thủ công.
2. **Gỡ cài đặt sạch sẽ**: Quản lý toàn bộ manifest của ứng dụng như một gói (**Chart**), đảm bảo khi gỡ sẽ xóa hết tài nguyên liên quan mà không bị sót.
3. **Theo dõi cấu hình đang chạy**: Lưu lại thông tin phiên bản và cấu hình đã triển khai của từng **Release** trong Kubernetes Secret ngay trong namespace tương ứng, không phải đoán xem cluster đang chạy bản nào.
</details>

### Câu Hỏi 4: Hãy phân biệt 4 thực thể cốt lõi trong Helm: Chart, Release, Revision và Repository?

<details>
<summary>Đáp án</summary>

- **Chart**: Gói (thư mục) đóng gói toàn bộ manifest Kubernetes của ứng dụng cùng cấu hình mặc định, có số phiên bản và có thể cài đặt, nâng cấp hoặc rollback như một khối.
- **Release**: Một thực thể (instance) cụ thể của Chart đang chạy trong cluster sau khi Helm hòa trộn Chart với cấu hình `values` (thường từ `values.yaml`). Cùng một Chart có thể cài nhiều lần thành các Release độc lập với tên riêng.
- **Revision**: Số phiên bản tăng dần (v1, v2, v3...) ghi lại lịch sử cấu hình của một Release qua mỗi lần cài đặt, nâng cấp hoặc rollback.
- **Repository**: Kho lưu trữ dùng để chia sẻ Chart thông qua HTTP (với file `index.yaml`) hoặc registry OCI.
</details>

### Câu Hỏi 5: Kiến trúc của Helm gồm những thành phần nào và vì sao Tiller bị loại bỏ hoàn toàn từ Helm 3?

<details>
<summary>Đáp án</summary>

Helm gồm hai phần phía client: **Helm CLI** (cho người dùng quản lý chart, repo, release) và **Helm library** (cung cấp logic độc lập tương tác trực tiếp với `kube-apiserver`).

Từ Helm 3, kiến trúc chuyển sang **client-only** và loại bỏ Tiller (thành phần server chạy trong cluster ở Helm 2) nhằm:
1. **Loại bỏ quyền operator phức tạp và lỗ hổng bảo mật**: Không còn thành phần trung gian nắm quyền cao trong cluster.
2. **Xác thực trực tiếp qua `kubeconfig` và Kubernetes RBAC**: Quyền hạn của Helm client được đánh giá dựa trên danh tính và phân quyền RBAC của chính người dùng (hoặc ServiceAccount).
3. **Lưu trữ theo từng Namespace**: Metadata của Release được lưu ngay trong namespace của Release đó thay vì tập trung ở namespace của Tiller.
</details>

### Câu Hỏi 6: Helm lưu trữ trạng thái Release ở đâu, dùng driver nào làm mặc định và biến môi trường `HELM_DRIVER` hỗ trợ những giá trị nào?

<details>
<summary>Đáp án</summary>

Helm không cần cơ sở dữ liệu riêng mà lưu trực tiếp thông tin Release trong cụm Kubernetes.
- **Driver mặc định**: Từ Helm 3 trở đi, **Secrets** là storage driver mặc định (thay thế ConfigMaps của Helm 2).
- **Tùy chọn qua `HELM_DRIVER`**: Có thể chọn `secret`, `configmap`, hoặc `sql` (chỉ hỗ trợ PostgreSQL).
- **Lưu ý vận hành**: Nếu thay đổi `HELM_DRIVER`, mọi lệnh Helm thực thi sau đó đều phải sử dụng cùng driver đó để đọc/ghi đúng nơi lưu trữ.
</details>

### Câu Hỏi 7: Tên Secret lưu metadata của Helm được đặt theo quy tắc nào, dữ liệu bên trong được mã hóa ra sao và làm thế nào để giải mã xem nội dung?

<details>
<summary>Đáp án</summary>

- **Quy tắc đặt tên**: Theo định dạng `<helm_storage_type>.<release_name>.v<release_version>` với hằng số loại lưu trữ là `sh.helm.release.v1` — ví dụ: `sh.helm.release.v1.my-app.v1`.
- **Nhãn nhận diện**: Secret được gắn nhãn `owner=helm`, có thể liệt kê trên toàn cluster bằng lệnh `kubectl get secret --all-namespaces -l "owner=helm"`.
- **Định dạng dữ liệu và cách giải mã**: Metadata release là một chuỗi JSON được nén **gzip** và mã hóa **base64** nằm ở trường `.data.release`. Để đọc nội dung, chạy:
  ```bash
  kubectl get secret sh.helm.release.v1.my-app.v1 -n default -o jsonpath='{.data.release}' | base64 -d | gzip -d | head -n 25
  ```
</details>

### Câu Hỏi 8: Liệt kê các lệnh CLI cơ bản để kiểm tra phiên bản Helm, xem danh sách Release và gỡ cài đặt hoàn toàn một Release?

<details>
<summary>Đáp án</summary>

- **Kiểm tra phiên bản Helm CLI**:
  - `helm version`: hiển thị đầy đủ thông tin phiên bản.
  - `helm version --short`: in chuỗi phiên bản rút gọn.
  - `helm version --template '{{.Version}}'`: trích xuất thuộc tính `.Version` qua Go template.
- **Xem danh sách Release**:
  - `helm list` (hoặc alias `helm ls`): liệt kê release trong namespace hiện tại.
  - `helm list --all-namespaces` (viết tắt `-A`): liệt kê release trên tất cả namespaces.
- **Gỡ cài đặt Release**:
  - `helm uninstall <tên-release> -n <namespace>`: mặc định xóa sạch toàn bộ tài nguyên Kubernetes của release và lịch sử Secret tương ứng.
</details>

### Câu Hỏi 9: Mốc phát hành Helm 4 và lộ trình kết thúc hỗ trợ (EOL) của Helm 3 là khi nào? Việc tiếp tục dùng Helm 3 sau EOL gây ra rủi ro gì?

<details>
<summary>Đáp án</summary>

- **Helm v4.0.0**: Phát hành chính thức ngày **12-11-2025** tại KubeCon + CloudNativeCon.
- **Lộ trình EOL của Helm 3**:
  - Kết thúc sửa lỗi (bug fixes): **09-09-2026** (bản feature cuối chỉ cập nhật client Kubernetes).
  - Kết thúc sửa bảo mật (security fixes): **10-02-2027** (sau mốc này không còn bản phát hành nào nữa).
- **Rủi ro**: Tiếp tục duy trì Helm 3 sau EOL khiến hệ thống đối mặt với các lỗ hổng CVE chưa được vá và nguy cơ không tương thích với API Kubernetes mới. Vì vậy cần lên kế hoạch nâng cấp các pipeline CI/CD lên Helm 4.
</details>

### Câu Hỏi 10: Chiến lược áp dụng tài nguyên (apply) giữa Helm 3 và Helm 4 khác nhau như thế nào, và thực hành tốt nhất để tránh lệch trạng thái là gì?

<details>
<summary>Đáp án</summary>

- **Helm 3**: Sử dụng **three-way strategic merge patch** (kết hợp 3 nguồn: manifest cũ, live state đang chạy trên cluster, và manifest mới). Dù giữ được các thay đổi out-of-band, việc patch phía client có thể phát sinh xung đột phức tạp.
- **Helm 4**: Mặc định chuyển sang **Server-Side Apply (SSA)** cho các bản cài đặt chart mới, giúp giải quyết xung đột trực tiếp trên `kube-apiserver`.
- **Thực hành tốt nhất**: Quản lý cấu hình nhất quán thông qua `values.yaml` và hạn chế sửa đổi trực tiếp tài nguyên trên cluster bằng `kubectl edit`.
</details>

### Câu Hỏi 11: Điều gì xảy ra nếu xóa nhầm Secret có nhãn `owner=helm` trong namespace, và cách phòng tránh tình huống này là gì?

<details>
<summary>Đáp án</summary>

- **Hiện tượng**: Lệnh `helm list` không còn hiển thị release đó nữa, nhưng các tài nguyên thực tế (Pod, Service...) vẫn tiếp tục chạy bình thường trên cluster vì `kube-apiserver` quản lý chúng độc lập với Secret của Helm.
- **Hệ quả**: Release bị rơi vào trạng thái **"mồ côi" (orphaned)** — không thể nâng cấp hay rollback qua Helm, và nếu chạy `helm install` lại sẽ thất bại do tài nguyên đã tồn tại sẵn trong namespace.
- **Cách phòng tránh**: Không gán nhãn `owner=helm` một cách tùy tiện và áp dụng chính sách RBAC nghiêm ngặt để bảo vệ các Secret do Helm quản lý khỏi bị xóa nhầm.
</details>

### Câu Hỏi 12: Tại sao một ServiceAccount trong pipeline CI/CD có đủ quyền tạo Pod và Service nhưng lệnh `helm install` hoặc `helm upgrade` vẫn bị từ chối?

<details>
<summary>Đáp án</summary>

Vì Helm hoạt động theo mô hình client-only (sử dụng danh tính từ `kubeconfig`/ServiceAccount qua RBAC) và bắt buộc phải ghi metadata trạng thái của mỗi revision vào Kubernetes Secret (`sh.helm.release.v1.<name>.v<rev>`) ngay trong namespace triển khai. Nếu ServiceAccount CI/CD thiếu quyền CRUD trên đối tượng `secrets` trong namespace đó, bước lưu trữ metadata release sẽ bị `kube-apiserver` từ chối. Do đó, cần cấp đầy đủ quyền với tài nguyên `secrets` trong namespace triển khai cho ServiceAccount CI/CD.
</details>
