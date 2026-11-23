# Ôn Tập: 6_5_4 Values and Precedence

### Câu Hỏi 1: Helm lấy dữ liệu values từ những nguồn nào và thứ tự ưu tiên giữa các nguồn đó ra sao?

<details>
<summary>Đáp án</summary>

Dữ liệu values cung cấp cho Helm chart đến từ **4 nguồn chính**, với thứ tự ưu tiên tăng dần theo độ cụ thể (nguồn đứng sau ghi đè nguồn đứng trước):

1. **Tệp `values.yaml` mặc định bên trong chart**: đóng vai trò giá trị cơ sở dự phòng (ưu tiên thấp nhất).
2. **Tệp `values.yaml` của chart cha (parent chart)**: áp dụng khi triển khai subchart, cho phép chart cha đè cấu hình của subchart hoặc cung cấp `global`.
3. **Các tệp values do người dùng chỉ định qua cờ `-f` (hoặc `--values`)**: ghi đè lên giá trị mặc định của chart và parent chart.
4. **Các tham số dòng lệnh qua họ cờ `--set`**: có quyền ưu tiên tuyệt đối, đè lên mọi tệp values.
</details>

---

### Câu Hỏi 2: Khi truyền nhiều cờ `-f` hoặc nhiều cờ `--set` trong cùng một lệnh `helm upgrade --install`, Helm giải quyết xung đột theo quy tắc nào?

<details>
<summary>Đáp án</summary>

Helm áp dụng quy tắc **ngoài cùng bên phải thắng** (Right-most File và Right-most Parameter):

- **Với nhiều tệp `-f` / `--values`**: tệp nằm ngoài cùng bên phải có quyền ưu tiên cao nhất và đè lên các tệp nằm bên trái nó.
- **Với nhiều cờ `--set`**: tham số nằm ngoài cùng bên phải giành quyền ưu tiên cao nhất.
- **Giữa `-f` và `--set`**: mọi `--set` luôn thắng mọi tệp `-f`, bất kể vị trí tương đối với `-f`.

**Ví dụ**: Trong lệnh `helm upgrade --install demo ./chart -f v-base.yaml -f v-prod.yaml --set replicaCount=5 --set replicaCount=3`, kết quả cuối cùng của `replicaCount` là **`3`** vì `--set` thắng mọi file và `--set replicaCount=3` nằm ngoài cùng bên phải.
</details>

---

### Câu Hỏi 3: Trong quy trình GitOps và triển khai đa môi trường, nên phân tách vai trò giữa cờ `-f` và `--set` như thế nào để tránh lệch cấu hình (config drift)?

<details>
<summary>Đáp án</summary>

- **Cờ `-f` / `--values` dùng cho cấu hình tĩnh**: các thông số hạ tầng cố định theo môi trường (như `replicaCount`, `resources.limits`, cấu hình probe) bắt buộc phải lưu trong các file values quản lý trên Git và nạp qua `-f`.
- **Cờ `--set` chỉ dùng cho giá trị động từ CI**: những thông số thay đổi tức thời theo từng lần build/deploy (như `image.tag`, commit SHA, digest).
- **Lý do**: Tuy `--set` có độ ưu tiên cao nhất, các tham số truyền qua CLI không được lưu vết trực tiếp trong kho mã nguồn Git, nên nếu lạm dụng cho cấu hình tĩnh sẽ gây mất kiểm soát GitOps và dẫn đến lệch cấu hình (config drift).
</details>

---

### Câu Hỏi 4: Cách tổ chức các file values đa môi trường theo chuẩn DRY hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

Theo chuẩn DRY (Don't Repeat Yourself), cấu hình được tách làm hai lớp:

- **Lớp mặc định cơ sở (`values.yaml`)**: chứa toàn bộ cấu hình mặc định an toàn cho ứng dụng (ví dụ: `replicaCount`, `image`, `service`, `resources`, `livenessProbe`, `global`).
- **Lớp ghi đè theo môi trường (`values-dev.yaml`, `values-prod.yaml`)**: chỉ khai báo **những khóa cần thay đổi** so với mặc định (ví dụ `values-dev.yaml` chỉ cần hạ `replicaCount: 1` và giảm `resources.limits`; `values-prod.yaml` tăng `replicaCount: 5` và nâng `resources.limits`).

Khi triển khai, kết hợp cả hai file theo thứ tự từ chung đến riêng:
```bash
helm upgrade --install payment-dev ./payment-chart \
  -f ./payment-chart/values.yaml -f ./payment-chart/values-dev.yaml
```
Nhờ cơ chế hợp nhất của Helm, các khóa không được nhắc lại trong `values-dev.yaml` (như `service` hay `image.repository`) vẫn được giữ nguyên từ `values.yaml`.
</details>

---

### Câu Hỏi 5: Họ tham số `--set` gồm những cờ nào và khi nào cần dùng `--set-string` hoặc `--set-literal` thay cho `--set`?

<details>
<summary>Đáp án</summary>

Helm cung cấp 5 cờ trong họ `--set`:

| Cờ CLI | Công dụng | Ví dụ |
| :--- | :--- | :--- |
| `--set` | Gán cặp key-value trực tiếp trên CLI, phân tách bằng dấu phẩy | `--set replicaCount=3,image.tag=v1.2.0` |
| `--set-string` | Ép kiểu dữ liệu bắt buộc sang chuỗi (`String`) | `--set-string service.port="8080"` |
| `--set-file` | Nạp nội dung từ một file trên đĩa vào khóa chỉ định | `--set-file appConfig=./config.json` |
| `--set-json` | Truyền trực tiếp cấu trúc JSON (scalar, object, array) | `--set-json 'resources={"limits":{"cpu":"1"}}'` |
| `--set-literal` | Truyền chuỗi nguyên bản không qua bộ phân tích cú pháp (parser) | `--set-literal note="raw:text[value]"` |

**Lý do cần `--set-string` và `--set-literal`**: Cờ `--set` mặc định tự động diễn giải kiểu nguyên thủy, nên `--set config.port=8080` sẽ bị ép thành **số nguyên** thay vì chuỗi. Do đó, cần `--set-string` khi template hoặc schema yêu cầu kiểu chuỗi, và dùng `--set-literal` khi giá trị chuỗi chứa các ký tự đặc biệt mà parser của `--set` có thể hiểu nhầm.
</details>

---

### Câu Hỏi 6: Cơ chế Deep Map Coalescing xử lý việc ghi đè kiểu Map và kiểu List khác nhau như thế nào? Cần thiết kế cấu trúc values ra sao để tránh mất dữ liệu ngoài ý muốn?

<details>
<summary>Đáp án</summary>

- **Với kiểu Map (đối tượng lồng nhau)**: Helm thực hiện **Deep Map Coalescing** — gộp các khóa mặc định và khóa ghi đè thành một cây YAML duy nhất, giữ lại các khóa con không bị ghi đè.
- **Với kiểu List (danh sách)**: Helm **thay thế nguyên khối**, không merge từng phần tử. Nếu khai báo một danh sách trong `values-prod.yaml`, toàn bộ phần tử của danh sách tương ứng trong `values.yaml` sẽ bị mất.

**Cách thiết kế khuyến nghị**:
- Áp dụng nguyên tắc **Favor Flatness**: giữ cây values nông (shallow), ưu tiên độ phẳng thay vì lồng quá sâu.
- Khi có nhu cầu ghi đè hoặc tùy biến từng mục riêng lẻ giữa các môi trường, hãy dùng **map có key định danh** thay vì dùng list.
</details>

---

### Câu Hỏi 7: Làm thế nào để xóa hoàn toàn một khóa mặc định có sẵn trong `values.yaml` của chart mà không sửa mã nguồn chart?

<details>
<summary>Đáp án</summary>

Để loại bỏ một khóa mặc định khỏi kết quả hợp nhất, ta gán giá trị của khóa đó thành **`null`** thông qua file values ghi đè hoặc cờ `--set`. Khi gặp giá trị `null`, Helm sẽ gỡ bỏ hoàn toàn khóa đó khỏi cây values hợp nhất.

**Ví dụ** (xóa `livenessProbe.httpGet` mặc định để chuyển sang dùng `exec` probe):
- Trong `values-prod.yaml`:
  ```yaml
  livenessProbe:
    httpGet: null
    exec: { command: [/bin/sh, -c, /app/check-health.sh] }
  ```
- Hoặc trực tiếp trên CLI:
  ```bash
  helm upgrade --install payment-prod ./payment-chart --set livenessProbe.httpGet=null
  ```
</details>

---

### Câu Hỏi 8: Tệp `values.schema.json` kiểm thực dữ liệu ở thời điểm nào và cần kiểm tra ra sao trong CI để tránh lỗi triển khai?

<details>
<summary>Đáp án</summary>

- **Thời điểm kiểm thực**: JSON Schema (`values.schema.json`) kiểm thực trực tiếp lên đối tượng **`.Values` cuối cùng sau khi đã hợp nhất toàn bộ** các nguồn (chart mặc định, parent chart, `-f`, `--set`), không chỉ kiểm tra riêng tệp `values.yaml` thô.
- **Tình huống thực tế**: Một tệp `values.yaml` gốc có thể hợp lệ, nhưng khi nạp thêm `-f values-prod.yaml` hoặc `--set` (ví dụ truyền sai kiểu dữ liệu do `--set` tự ép kiểu) thì quá trình cài đặt sẽ bị dừng vì lỗi schema.
- **Thực tiễn kiểm tra**: Luôn chạy lệnh `helm template -f values-prod.yaml` (kèm đúng các file/cờ môi trường sẽ dùng) trong pipeline CI để xác thực schema trước khi triển khai thật.
</details>

---

### Câu Hỏi 9: Values được truyền và chia sẻ giữa Parent Chart và Subchart qua những cơ chế nào? Điểm khác biệt giữa cấu hình theo section subchart và `Values.global` là gì?

<details>
<summary>Đáp án</summary>

1. **Tính độc lập của Subchart**: Subchart luôn đứng độc lập (stand-alone), không đọc được values của chart cha và cũng không phụ thuộc tường minh vào cha; các subchart đặt trong thư mục `charts/` vẫn hoạt động mà không cần sửa đổi khi render dependency.
2. **Cha ghi đè cấu hình con (Section subchart)**: Chart cha truyền cấu hình xuống subchart bằng cách khai báo một section **trùng tên subchart** trong `values.yaml` của cha (ví dụ `backend.apiUrl`, `frontend.apiUrl`). Template bên trong subchart vẫn truy xuất qua scope cục bộ `.Values.<key>` (như `.Values.apiUrl`).
3. **Biến toàn cục (`Values.global`)**: Các giá trị đặt trong phân vùng `global` (bắt buộc khai báo tường minh) được chia sẻ và truy xuất xuyên suốt cả chart cha lẫn mọi subchart dưới cùng một đường dẫn `.Values.global.<key>`. Khác với section subchart (cha phải khai báo lặp lại cho từng subchart), `Values.global` chỉ cần khai báo một lần theo chuẩn DRY.
4. **Cơ chế `exports`**: Tệp `values.yaml` của subchart có thể khai báo trường `exports` ở cấp gốc để nạp trực tiếp giá trị ngược lên values của chart cha.
</details>

---

### Câu Hỏi 10: Làm thế nào để kiểm tra cấu hình thực tế và lịch sử values của một release đang chạy trên cluster bằng `helm get values`?

<details>
<summary>Đáp án</summary>

Helm lưu trữ thông tin cấu hình của mỗi release trong **Kubernetes Secret** và cung cấp lệnh `helm get values <RELEASE_NAME>` để truy xuất.

**1. Bước tra cứu trước khi chạy `helm get values`**:
- Dùng `helm list` (hoặc `helm ls`, kèm `-n <namespace>` hoặc `--all-namespaces` / `-A`) để biết chính xác tên release và namespace.
- Dùng `helm history <RELEASE_NAME> -n <namespace>` để xem danh sách các số revision có thật.
- Lưu ý: Nếu release nằm ở namespace khác namespace hiện tại, bắt buộc phải truyền thêm `-n <namespace>`.

**2. Các cờ quan trọng của `helm get values`**:
- **Không truyền `-a`**: chỉ hiển thị phần values do người dùng cung cấp (user-supplied values).
- **`-a` / `--all`**: kết xuất **toàn bộ giá trị đã tính toán** (all computed values) sau khi đã hợp nhất mọi nguồn.
- **`--revision <số>`**: xem lại cấu hình values tại một revision lịch sử cụ thể.
- **`-o` / `--output`**: chọn định dạng xuất gồm `table` (mặc định), `json`, hoặc `yaml`.

**Ví dụ thực tế**:
```bash
helm get values payment-prod -n prod -a -o yaml
helm get values payment-prod -n prod --revision 1 -o json
```
</details>
