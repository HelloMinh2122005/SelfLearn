# Ôn Tập: 6_3_2 kubectl and API Objects

### Câu Hỏi 1: Trong Kubernetes, mọi thực thể (như Pod, Service) được quản lý dưới dạng gì và công cụ nào dùng để tương tác với chúng?

<details>
<summary>Đáp án</summary>

Trong hệ sinh thái Kubernetes, mọi thực thể như `Pod` hay `Service` đều là các **đối tượng API (API objects)** do `kube-apiserver` quản lý. Người dùng và quản trị viên tương tác với các đối tượng API này thông qua công cụ dòng lệnh `kubectl`.
</details>

### Câu Hỏi 2: Một bản khai báo đối tượng Kubernetes chuẩn gồm 5 trường cấp cao nào? Nêu kiểu dữ liệu và vai trò của từng trường?

<details>
<summary>Đáp án</summary>

Mỗi tài nguyên khai báo với Kubernetes API đều chứa 5 trường cấp cao chuẩn hóa sau:

1. **`apiVersion`** (`String`): Xác định phiên bản của Kubernetes API được sử dụng để tạo đối tượng này (ví dụ: `v1`).
2. **`kind`** (`String`): Xác định kiểu đối tượng cụ thể cần tạo trong hệ thống (ví dụ: `Pod`).
3. **`metadata`** (`Object`): Chứa dữ liệu định danh duy nhất đối tượng, bao gồm tên (`name`), mã `UID`, và `namespace` tùy chọn (cùng các thông tin phụ trợ như `labels`).
4. **`spec`** (`Object`): Mô tả các đặc tính cấu hình mong muốn (**desired state**) do người dùng thiết lập khi tạo đối tượng (ví dụ: danh sách `containers`, `image`).
5. **`status`** (`Object`): Mô tả trạng thái thực tế hiện thời (**current state**) của đối tượng, được hệ thống Kubernetes cung cấp và cập nhật.
</details>

### Câu Hỏi 3: Sự khác biệt cốt lõi giữa trường `spec` và trường `status` trong một đối tượng Kubernetes là gì?

<details>
<summary>Đáp án</summary>

- **`spec` (Desired State)**: Là cấu hình mong muốn do **người dùng** khai báo và thiết lập khi tạo hoặc cập nhật đối tượng (tương tự kê khai cam kết trong biểu mẫu hồ sơ).
- **`status` (Current State)**: Là trạng thái thực tế đang diễn ra của đối tượng, do **hệ thống Kubernetes** cung cấp và tự động cập nhật (tương tự kết quả thực tế mà hệ thống ghi nhận lại).
</details>

### Câu Hỏi 4: Tệp `kubeconfig` lưu trữ những thành phần thông tin nào và `context` có vai trò gì?

<details>
<summary>Đáp án</summary>

Công cụ `kubectl` sử dụng tệp `kubeconfig` để điều hướng và xác thực truy cập cụm. Tệp `kubeconfig` tổ chức thông tin kết nối gồm:
- **`clusters`**: Thông tin các cụm Kubernetes (ví dụ: cụm Staging, cụm Production).
- **`users`**: Danh tính và thông tin xác thực/chứng thư số để truy cập cụm.
- **`contexts`**: Định nghĩa sự kết hợp giữa `cluster`, `user` và `namespace` mặc định.
- **`namespaces`**: Không gian tên mặc định gắn với context.

Vai trò của **`context`**: Cho phép kết hợp sẵn thông tin cụm, người dùng và namespace để chuyển đổi nhanh chóng, an toàn giữa nhiều cluster và namespace khác nhau mà không cần nhập lại thông tin kết nối.
</details>

### Câu Hỏi 5: Các lệnh `kubectl config` nào dùng để xem danh sách context, chuyển đổi context hiện thời và lọc danh sách user bằng jsonpath?

<details>
<summary>Đáp án</summary>

- **Liệt kê tất cả các context đã cấu hình** từ các tệp `kubeconfig`:
  ```bash
  kubectl config get-contexts
  ```
- **Chuyển đổi context hoạt động hiện thời** (ví dụ sang `kind-k8s-lab`):
  ```bash
  kubectl config use-context kind-k8s-lab
  ```
- **Xem và lọc các trường có cấu trúc** (ví dụ lọc danh sách `users`) thông qua cú pháp `jsonpath`:
  ```bash
  kubectl config view -o jsonpath='{.users[*].name}'
  ```
</details>

### Câu Hỏi 6: Sự khác biệt giữa cách quản lý tài nguyên kiểu khai báo (`kubectl apply`) và kiểu mệnh lệnh (`kubectl run`) là gì? Phương thức nào được khuyến nghị cho môi trường production?

<details>
<summary>Đáp án</summary>

- **Khai báo (Declarative) với `kubectl apply`**: Tạo và cập nhật tài nguyên thông qua tệp manifest YAML/JSON (`kubectl apply -f <đường-dẫn-tệp-hoặc-URL>`). Đây là **phương thức khuyến nghị cho môi trường production**.
- **Mệnh lệnh (Imperative) với `kubectl run`**: Khởi chạy trực tiếp một `Pod` từ container image được chỉ định qua dòng lệnh mà không cần viết manifest trước (phù hợp để tạo nhanh/thử nghiệm).
</details>

### Câu Hỏi 7: Trước khi áp dụng một tệp manifest bằng `kubectl apply -f`, làm thế nào để kiểm tra trước những thay đổi sẽ xảy ra trên cluster?

<details>
<summary>Đáp án</summary>

Sử dụng lệnh **`kubectl diff`**:
```bash
kubectl diff -f ./pod-standard.yaml
```
Lệnh này gửi cấu hình dự kiến trong tệp manifest lên `kube-apiserver` để đối chiếu với trạng thái đang hoạt động (**live state**) được lưu trong `etcd`, sau đó trả về kết quả khác biệt trước khi bạn quyết định thực hiện `kubectl apply -f`.
</details>

### Câu Hỏi 8: Khi dùng `kubectl run` để khởi chạy Pod, cờ `--restart` nhận những giá trị hợp lệ nào? Nêu ví dụ minh họa?

<details>
<summary>Đáp án</summary>

Lệnh `kubectl run` cho phép thiết lập chính sách khởi động lại của container (`restartPolicy`) thông qua cờ `--restart` với 3 giá trị hợp lệ:
- `Always`
- `OnFailure`
- `Never`

Ví dụ thực hành từ bài học:
```bash
# Khởi chạy Pod với restartPolicy là Never
kubectl run worker --image=busybox:1.36 --restart=Never

# Khởi chạy Pod với restartPolicy là Always
kubectl run web --image=nginx:1.27 --restart=Always
```
</details>

### Câu Hỏi 9: Mô tả luồng tương tác giữa `kubectl`, `kubeconfig`, `kube-apiserver` và `etcd` khi chuyển context, đối chiếu `diff` và áp dụng `apply`?

<details>
<summary>Đáp án</summary>

Luồng hoạt động diễn ra theo các bước tuần tự sau:
1. **Nạp ngữ cảnh**: Khi chạy `kubectl config use-context <tên-context>`, `kubectl` nạp thông tin Context (`Cluster`, `User`, `Namespace`) từ tệp `kubeconfig` để xác định endpoint của `kube-apiserver` và thông tin xác thực TLS.
2. **Đối chiếu thay đổi (`kubectl diff -f`)**: `kubectl` gửi `spec` dự kiến trong manifest tới `kube-apiserver`; `kube-apiserver` đọc trạng thái đối tượng đang chạy (`spec` và `status` hiện tại) từ `etcd` và trả về kết quả so sánh `diff`.
3. **Áp dụng cấu hình (`kubectl apply -f`)**: `kubectl` gửi yêu cầu cập nhật `desired spec` tới `kube-apiserver`; `kube-apiserver` ghi và lưu trữ trạng thái mới vào `etcd`, sau đó `etcd` xác nhận ghi thành công.
</details>

### Câu Hỏi 10: Làm thế nào để tra cứu cấu trúc schema của một tài nguyên Kubernetes trực tiếp bằng CLI và giới hạn độ sâu hiển thị?

<details>
<summary>Đáp án</summary>

Sử dụng lệnh **`kubectl explain`** kết hợp với cờ `-R` (hoặc `--recursive`) để in toàn bộ cây trường con phân cấp của schema tài nguyên API, và cờ `--max-depth` để giới hạn độ sâu đệ quy:

```bash
# In toàn bộ cấu trúc cây trường đệ quy của Pod
kubectl explain pods --recursive

# Giới hạn độ sâu phân cấp của trường spec ở mức 2
kubectl explain pods.spec --recursive --max-depth=2
```
</details>

### Câu Hỏi 11: `Label` và `Label selector` là gì, và tại sao chúng giúp các đối tượng Kubernetes liên kết với nhau theo cơ chế ghép lỏng (loosely coupled)?

<details>
<summary>Đáp án</summary>

- **Label**: Là các cặp `key/value` được gắn vào đối tượng Kubernetes (như `Pod`) để tổ chức và truy vấn.
- **Label selector**: Là cơ chế gom nhóm cốt lõi giúp định danh một tập hợp các đối tượng có nhãn thỏa mãn điều kiện.

**Tính chất ghép lỏng (loosely coupled)**: `Label` cho phép ánh xạ cấu trúc tổ chức lên các đối tượng mà không yêu cầu client hoặc các đối tượng điều khiển phải lưu trữ danh sách cố định từng đối tượng con. Ví dụ, `ReplicaSet` dùng `selector` để quản lý các `Pod` có nhãn khớp, còn `Service` dùng `selector` để định tuyến traffic tới đúng nhóm `Pod` đó; nếu một `Pod` cũ được thay bằng `Pod` mới mang cùng nhãn thì `Service` và `ReplicaSet` tự động nhận diện mà không cần sửa lại liên kết cứng.
</details>

### Câu Hỏi 12: Bộ 3 nhãn chuẩn hóa khuyến nghị (`app.kubernetes.io/*`) trong bài học gồm những nhãn nào và ý nghĩa của từng nhãn?

<details>
<summary>Đáp án</summary>

Bộ nhãn khuyến nghị chuẩn hóa giúp các công cụ và con người truy vấn ứng dụng đồng nhất gồm:
- **`app.kubernetes.io/name`**: Ghi nhận tên của ứng dụng (ví dụ: `payment-app`).
- **`app.kubernetes.io/instance`**: Định danh bản thể cụ thể của ứng dụng (ví dụ: `payment-app-01`).
- **`app.kubernetes.io/version`**: Xác định phiên bản ngữ nghĩa (semantic version) hoặc release hash của ứng dụng (ví dụ: `"1.37.0"`).
</details>

### Câu Hỏi 13: Chuyện gì xảy ra nếu hai `ReplicaSet` khác nhau trong cùng một `namespace` có `spec.selector` trùng lặp? Cách phòng ngừa lỗi này là gì?

<details>
<summary>Đáp án</summary>

- **Hậu quả**: Xảy ra **xung đột quyền kiểm soát** giữa hai controller đối với tập `Pod` khớp selector. Một controller thấy dư `Pod` nên xóa bớt, trong khi controller kia thấy thiếu nên tạo mới, khiến các `Pod` bị **xóa và tạo lại liên tục**, gây mất ổn định hệ thống.
- **Cách phòng ngừa**: Luôn kết hợp các nhãn phân biệt như `app.kubernetes.io/instance` và `app.kubernetes.io/name` trong `labels` và `selector` để đảm bảo mỗi `ReplicaSet` trong cùng một namespace có `selector` là duy nhất.
</details>

### Câu Hỏi 14: `Namespace` trong Kubernetes dùng để làm gì và quy tắc đặt tên tài nguyên giữa các `namespace` được quy định như thế nào?

<details>
<summary>Đáp án</summary>

- **Mục đích**: `Namespace` cung cấp cơ chế **phân vùng cô lập** các nhóm tài nguyên bên trong một cluster Kubernetes duy nhất.
- **Quy tắc đặt tên**: Tên tài nguyên bắt buộc phải **duy nhất trong phạm vi cùng một namespace**, nhưng **có thể trùng nhau giữa các namespace khác nhau** (ví dụ: hai nhóm phát triển khác nhau đều có thể tạo Pod tên `app-backend` nếu đặt ở hai namespace khác nhau).
</details>

### Câu Hỏi 15: Sự khác biệt giữa tài nguyên `namespaced` và tài nguyên `cluster-scoped` (cấp cụm) là gì? Nêu ví dụ và lệnh `kubectl` để kiểm tra?

<details>
<summary>Đáp án</summary>

- **Tài nguyên `namespaced`**: Thuộc phạm vi của một `namespace` cụ thể (ví dụ: `Pod`, `ReplicaSet`, `Service`), tên chỉ cần duy nhất trong namespace đó.
- **Tài nguyên `cluster-scoped` (cấp cụm / cluster-wide)**: Không thuộc bất kỳ `namespace` nào (ví dụ: `Node`, `PersistentVolume`), tên phải duy nhất trên toàn cụm. Nếu cố gắng khai báo trường `namespace` cho tài nguyên cấp cụm, `kube-apiserver` sẽ từ chối hoặc bỏ qua trường này.
- **Lệnh kiểm tra**: Dùng lệnh sau để liệt kê toàn bộ các loại tài nguyên nằm trong phạm vi `namespace`:
  ```bash
  kubectl api-resources --namespaced=true
  ```
</details>

### Câu Hỏi 16: Viết các câu lệnh `kubectl get pods` để: (1) xem cột IP và Node, (2) xem Pod trên tất cả namespace, và (3) lọc Pod theo nhãn bằng toán tử `=` và `in`?

<details>
<summary>Đáp án</summary>

1. **Hiển thị thêm cột IP và Node**:
   ```bash
   kubectl get pods -o wide
   ```
2. **Truy vấn Pod trên tất cả các namespace**:
   ```bash
   kubectl get pods -A
   ```
3. **Lọc Pod theo nhãn (`-l`)**:
   ```bash
   # Lọc khớp chính xác một giá trị
   kubectl get pods -l 'app.kubernetes.io/name=payment-app'

   # Lọc theo tập hợp giá trị (set-based)
   kubectl get pods -l 'app.kubernetes.io/name in (payment-app, webapp)'
   ```
</details>

### Câu Hỏi 17: Vì sao việc sửa nóng cấu hình trên cluster bằng lệnh mệnh lệnh (imperative) trong khi hệ thống đang dùng quy trình khai báo (`kubectl apply -f`) lại gây ra sự cố? Cách phòng tránh là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân & Hậu quả**: Khi bạn sửa nóng trực tiếp trên cluster bằng lệnh mệnh lệnh thay vì cập nhật tệp manifest qua Git, cấu hình thực tế trên cluster bị lệch khỏi manifest. Sau đó, khi hệ thống hoặc kỹ sư chạy lại `kubectl apply -f`, các thay đổi sửa nóng trước đó sẽ bị **ghi đè**, gây mất ổn định ngoài dự kiến.
- **Cách phòng tránh**: Luôn quản lý tài nguyên nhất quán qua tệp manifest với `kubectl apply -f` và đối chiếu trước mọi thay đổi bằng `kubectl diff -f`.
</details>
