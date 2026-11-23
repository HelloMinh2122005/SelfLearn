# Ôn Tập: 6_5_7 Dependencies Subcharts and Library Charts

### Câu Hỏi 1: Mô hình Umbrella Chart giải quyết bài toán gì và cách khai báo `dependencies` trong Helm 3/4 khác gì so với Helm 2?

<details>
<summary>Đáp án</summary>

- **Bài toán giải quyết**: Khi quản lý nhiều microservices trên Kubernetes, cài đặt thủ công từng chart dễ gây trôi dạt cấu hình và khó đồng bộ giữa các môi trường. Mô hình **Umbrella Chart (Parent Chart)** gom các subchart thành một gói phát hành duy nhất để điều phối đồng bộ.
- **Cách khai báo**: Trong Helm 3 và Helm 4, các phụ thuộc được khai báo dưới trường `dependencies` ngay trong file `Chart.yaml`, thay thế hoàn toàn cho tệp `requirements.yaml` ở Helm 2.
- Lưu ý: Trường `name` trong mục dependency bắt buộc phải trùng khớp chính xác với trường `name` trong `Chart.yaml` của subchart đích.
</details>

### Câu Hỏi 2: Trong trường `version` của `dependencies`, ràng buộc SemVer `~1.2.3` và `^1.2.3` khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **`~1.2.3` (tilde)**: Chỉ chấp nhận các bản vá (patch) trong cùng phiên bản minor (`>= 1.2.3, < 1.3.0`).
- **`^1.2.3` (caret)**: Cho phép nâng cấp các tính năng tương thích ngược trong cùng phiên bản major (`>= 1.2.3, < 2.0.0`).
</details>

### Câu Hỏi 3: Trường `repository` hỗ trợ những định dạng nào, và vì sao cần tránh dùng `file://` cho chart phát hành production?

<details>
<summary>Đáp án</summary>

`repository` hỗ trợ 4 định dạng địa chỉ:
1. Địa chỉ HTTP/HTTPS URL của Helm repository.
2. Alias của repo dạng `@tên-repo`.
3. Đường dẫn thư mục nội bộ `file://...`.
4. Registry OCI dạng `oci://...`.

**Lưu ý thực tế**: Giao thức `file://` chỉ phù hợp khi lắp ráp nội bộ hoặc kiểm thử cục bộ; nếu đẩy chart lên kho lưu trữ từ xa, đường dẫn tương đối sẽ bị gãy. Do đó, chart phát hành production bắt buộc dùng kho lưu trữ chuẩn `https://` hoặc registry `oci://`.
</details>

### Câu Hỏi 4: Thuộc tính `alias` trong `dependencies` dùng để làm gì và ảnh hưởng thế nào đến cấu hình `values` của chart cha?

<details>
<summary>Đáp án</summary>

- **Công dụng**: `alias` cho phép định danh subchart bằng một tên gọi thay thế, giúp tái sử dụng cùng một chart nhiều lần với các cấu hình độc lập mà không bị xung đột tên.
- **Ảnh hưởng đến `values`**: Khóa để ghi đè cấu hình trong `values.yaml` của chart cha sẽ chuyển sang dùng tên `alias` thay vì tên gốc của subchart. Nếu đổi `alias` mà quên đổi khóa tương ứng trong `values.yaml` của cha, cấu hình sẽ không tới được subchart. Nên chạy `helm template` để kiểm tra lại manifest sau khi đặt hoặc đổi `alias`.
</details>

### Câu Hỏi 5: Thuộc tính `condition` hoạt động như thế nào để bật/tắt subchart?

<details>
<summary>Đáp án</summary>

- `condition` nhận một hoặc nhiều đường dẫn YAML (phân tách bằng dấu phẩy).
- Helm kiểm tra trong `values` của **chart cha trên cùng**: nếu đường dẫn tồn tại và trả về giá trị boolean (`true`/`false`), subchart sẽ được bật hoặc tắt theo giá trị đó.
- Nếu liệt kê nhiều đường dẫn, chỉ đường dẫn hợp lệ **đầu tiên** được phân giải.
- Thực tiễn khuyến nghị của Helm: mọi optional dependency nên gắn `condition` theo dạng `<subchart>.enabled`.
</details>

### Câu Hỏi 6: Thuộc tính `tags` hoạt động ra sao và có những ràng buộc vị trí nào khi khai báo trong `values`?

<details>
<summary>Đáp án</summary>

- `tags` là danh sách nhãn gắn cho subchart trong `Chart.yaml` (ví dụ `tags: [front-end]`). Trong `values` của chart cha trên cùng, khóa `tags.<nhãn>: true/false` sẽ bật hoặc tắt đồng loạt mọi subchart mang nhãn đó.
- Một subchart có nhiều tag sẽ được **bật nếu bất kỳ tag nào của nó mang giá trị `true`**.
- **Ràng buộc vị trí**: Khóa `tags:` bắt buộc phải là **khóa cấp cao nhất (top-level key)** trong values của chart cha trên cùng; không hỗ trợ định dạng lồng nhau hay đặt bên trong `global`.
</details>

### Câu Hỏi 7: Khi cả `condition` và `tags` cùng xuất hiện thì quy tắc ưu tiên ra sao, và cách điều khiển nhanh qua CLI là gì?

<details>
<summary>Đáp án</summary>

- **Thứ tự ưu tiên**: `condition` luôn có mức ưu tiên cao hơn và **ghi đè `tags`**. Nếu không có đường dẫn `condition` hợp lệ nào trong values cha thì Helm mới xét tới `tags`; nếu không có cả hai thì mặc định chart được nạp.
- **Thao tác qua CLI**: Có thể truyền cờ `--set` trực tiếp khi chạy lệnh (ví dụ: `--set tags.front-end=true --set subchart2.enabled=false`).
</details>

### Câu Hỏi 8: Hai lệnh `helm dependency update` và `helm dependency build` khác nhau ở điểm nào?

<details>
<summary>Đáp án</summary>

- **`helm dependency update`**: Quét `Chart.yaml`, tải phiên bản **mới nhất** thỏa mãn ràng buộc SemVer về thư mục `charts/` dưới dạng file `.tgz`, đồng thời **sinh ra hoặc ghi đè** tệp `Chart.lock`.
- **`helm dependency build`**: Tái thiết lập chính xác các file `.tgz` trong `charts/` **dựa theo `Chart.lock`** mà không đàm phán lại phiên bản (không tự kéo bản mới hơn). Nếu chưa có `Chart.lock`, lệnh `build` sẽ tự động chuyển sang hành vi giống `update`.
</details>

### Câu Hỏi 9: `Chart.lock` lưu trữ thông tin gì và vì sao cần kết hợp commit `Chart.lock` với `helm dependency build` trong CI/CD?

<details>
<summary>Đáp án</summary>

- **`Chart.lock` lưu trữ**: Phiên bản cụ thể của từng dependency, repository của chúng và mã băm digest (`SHA-256`) của khai báo `dependencies` để đồng bộ với `Chart.yaml`.
- **Lý do dùng trong CI/CD**: Nếu chỉ commit `Chart.yaml` với dải phiên bản mở (như `~1.2.3`) và để CI chạy `helm dependency update` mỗi lần build, một bản vá mới phát hành trên repo có thể làm hai lần build cùng một commit cho ra kết quả khác nhau. Do đó, cần commit `Chart.lock` vào Git và để CI chạy `helm dependency build` nhằm tái lập bản dựng giống hệt nhau; chỉ chạy `update` khi chủ động muốn nâng cấp và kiểm soát diff.
</details>

### Câu Hỏi 10: Lệnh `helm dependency list` hiển thị những thông tin gì, và cờ `--dependency-update` (`-u`) của `helm package` dùng để làm gì?

<details>
<summary>Đáp án</summary>

- **`helm dependency list`**: Liệt kê các dependency đã khai báo trong chart gồm các cột `NAME`, `VERSION` (ràng buộc), `REPOSITORY` và `STATUS` (các trạng thái: `ok`, `missing`, hoặc `wrong version`).
- **`helm package <chart> --dependency-update` (viết tắt `-u`)**: Tự động kích hoạt cập nhật các gói phụ thuộc trước khi đóng gói chart thành file `.tgz`.
</details>

### Câu Hỏi 11: Subchart có thể tự truy cập values của chart cha không? Chart cha truyền cấu hình riêng xuống subchart bằng cách nào?

<details>
<summary>Đáp án</summary>

- **Không**. Subchart hoạt động độc lập và không bao giờ phụ thuộc tường minh vào chart cha, nên nó không thể tự đọc trực tiếp các giá trị nằm ở gốc `values` của chart cha.
- **Cách truyền từ cha xuống con**: Chart cha nhóm cấu hình dành cho subchart dưới một khóa trùng tên subchart (hoặc trùng `alias` đã khai báo). Trong phạm vi xử lý của subchart, `.Values` chỉ chứa phần dành riêng cho nó, nên template của subchart vẫn đọc bình thường qua `.Values.<khóa>` mà không cần sửa code.
</details>

### Câu Hỏi 12: Cơ chế `.Values.global` giải quyết vấn đề gì và cần lưu ý điều gì khi khai báo?

<details>
<summary>Đáp án</summary>

- **Vai trò**: Khóa dành riêng `global` cung cấp một không gian dữ liệu chia sẻ chung mà **cả chart cha lẫn mọi subchart** đều có thể đọc trực tiếp bằng cùng một cú pháp `.Values.global.<khóa>`.
- **Lưu ý**: Giá trị global bắt buộc phải được **khai báo tường minh** bên dưới khóa `global:`; không thể dùng một value thông thường như thể nó là global.
</details>

### Câu Hỏi 13: Khi cần đẩy dữ liệu từ subchart ngược lên chart cha, Helm cung cấp cơ chế nào?

<details>
<summary>Đáp án</summary>

Helm cung cấp cơ chế **`exports` và `import-values`**:
- Subchart công bố các giá trị muốn chia sẻ bên dưới khóa `exports` trong `values.yaml` của nó.
- Chart cha liệt kê tên khóa cần nhập vào trường `import-values` trong phần khai báo dependency ở `Chart.yaml`. Dữ liệu sau đó sẽ xuất hiện trực tiếp trong cây `values` của chart cha.
- Ngoài ra, Helm còn hỗ trợ cú pháp ánh xạ `child`/`parent` để đưa những giá trị không nằm trong `exports` vào thẳng cây values của chart cha.
</details>

### Câu Hỏi 14: Library Chart là gì, điều gì xảy ra nếu chạy `helm install` lên nó, và nó có tự render thành Kubernetes manifest không?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Library chart là loại chart được khai báo `type: library` trong `Chart.yaml`, chuyên dùng để chứa các named template và hàm tiện ích dùng chung cho nhiều chart ứng dụng (giúp DRY hóa mã nguồn).
- **Cài đặt độc lập**: Không thể cài đặt trực tiếp. Chạy `helm install` trên library chart sẽ trả về lỗi: `Error: library charts are not installable`.
- **Render manifest**: Mọi template bên trong library chart **không tự render** thành Kubernetes manifest trừ khi được một chart ứng dụng gọi tường minh thông qua `include` hoặc `template`.
</details>

### Câu Hỏi 15: Quy trình tạo và sử dụng một Library Chart trong chart ứng dụng diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

- **Tạo library chart**:
  1. Khởi tạo khung bằng `helm create <tên-chart>`, sau đó sửa `type: application` thành `type: library` trong `Chart.yaml`.
  2. Dọn dẹp thư mục `templates/`, chỉ giữ lại các named template bọc trong khối `{{- define ... -}}` đặt trong các tệp bắt đầu bằng dấu gạch dưới (`_*.tpl`, `_*.yaml` — quy ước để không xuất ra manifest độc lập).
- **Tiêu thụ trong chart ứng dụng**:
  1. Khai báo library chart trong trường `dependencies` của `Chart.yaml` (qua repo hoặc `file://...` khi phát triển cục bộ).
  2. Chạy `helm dependency build` (hoặc `update`) để kéo gói thư viện về thư mục `charts/`.
  3. Gọi named template trong file manifest bằng cú pháp `{{- include "<tên-library>.<tên-template>" . -}}`. Dấu `.` dùng để truyền toàn bộ ngữ cảnh (context như `.Values`, `.Chart`, `.Release`) của chart ứng dụng vào library template.
</details>

### Câu Hỏi 16: Cạm bẫy lớn nhất khi dùng chung một Library Chart cho nhiều microservices là gì và cách phòng tránh ra sao?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Vì nhiều service cùng phụ thuộc vào một library chart, mọi thay đổi mang tính phá vỡ (breaking change) trong các named template dùng chung sẽ lan truyền trực tiếp tới tất cả microservice ngay khi chúng nâng phiên bản thư viện.
- **Cách phòng tránh**:
  - Tuân thủ nghiêm ngặt **SemVer** cho library chart và duy trì changelog chi tiết.
  - Ở các chart ứng dụng, ghim ràng buộc phiên bản an toàn dạng `~x.y.z` (kết hợp `Chart.lock`).
  - Kiểm thử kỹ bằng `helm template` trên các microservice trọng yếu trước khi phát hành rộng rãi.
</details>
