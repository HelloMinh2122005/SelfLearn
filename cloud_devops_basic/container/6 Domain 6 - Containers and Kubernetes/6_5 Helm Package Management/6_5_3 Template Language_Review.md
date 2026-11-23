# Ôn Tập: 6_5_3 Template Language

### Câu Hỏi 1: Ngôn ngữ template của Helm dựa trên nền tảng nào, sử dụng toán tử pipeline và cú pháp hàm ra sao?

<details>
<summary>Đáp án</summary>

- **Nền tảng**: Ngôn ngữ template của Helm dựa trên **Go template** chuẩn và được mở rộng thêm bằng thư viện hàm **Sprig**.
- **Pipeline (`|`)**: Dùng toán tử UNIX pipe `|` để xâu chuỗi tuần tự các lệnh biến đổi dữ liệu từ trái sang phải.
- **Cú pháp hàm**: Các hàm nhận tham số theo dạng chuẩn `functionName arg1 arg2`.
- **Ví dụ với hàm `quote`**: Hàm `quote` nhận dữ liệu đầu vào và bọc giá trị trong dấu ngoặc kép thông qua pipeline, ví dụ: `{{ .Values.image.tag | quote }}`.
</details>

### Câu Hỏi 2: Hãy nêu vai trò của 6 Built-in Objects (đối tượng tích hợp sẵn) mà Helm cung cấp khi bắt đầu render?

<details>
<summary>Đáp án</summary>

Helm tự động cung cấp 6 đối tượng ngữ cảnh toàn cục sau:

1. **`.Values`**: Chứa các giá trị truyền từ `values.yaml` và các cờ ghi đè (mặc định rỗng nếu không khai báo). Ví dụ: `{{ .Values.replicaCount }}`.
2. **`.Release`**: Chứa metadata của bản phát hành như `Release.Name`, `Release.Namespace`, `Release.IsUpgrade`, `Release.Revision`. Ví dụ: `{{ .Release.Namespace }}`.
3. **`.Chart`**: Chứa metadata từ tệp `Chart.yaml`, chẳng hạn trường `appVersion` được truy cập qua `{{ .Chart.AppVersion }}` (thường dùng cho nhãn `app.kubernetes.io/version`).
4. **`.Capabilities`**: Cung cấp thông tin về năng lực của cụm Kubernetes, bao gồm kiểm tra phiên bản API qua `Capabilities.APIVersions.Has` (ví dụ: `{{ .Capabilities.APIVersions.Has "apps/v1" }}`).
5. **`.Files`**: Cung cấp các hàm tiện ích để truy cập tệp tĩnh trong chart như `Files.Get`, `Files.GetBytes`, `Files.Glob`, `Files.Lines`, `Files.AsSecrets`, `Files.AsConfig` (ví dụ: `{{ .Files.Get "config.ini" }}`).
6. **`.Template`**: Chứa metadata của template đang chạy gồm tên tệp (`Template.Name`) và thư mục chứa (`Template.BasePath`).
</details>

### Câu Hỏi 3: Trong cấu trúc rẽ nhánh `if / else if / else / end`, những giá trị nào được pipeline đánh giá là `false`?

<details>
<summary>Đáp án</summary>

Trong Go template của Helm, một pipeline được đánh giá là `false` khi mang một trong các giá trị sau:
- Boolean `false`
- Số `0`
- Chuỗi rỗng `""`
- `nil`
- Collection rỗng (bao gồm map, slice, tuple, dict hoặc array rỗng)

Mọi giá trị khác ngoài các trường hợp trên đều được coi là `true`.
</details>

### Câu Hỏi 4: Chỉ thị `with` thay đổi dấu chấm `.` (scope) như thế nào và giúp phòng tránh lỗi nil-pointer ra sao?

<details>
<summary>Đáp án</summary>

- **Thay đổi scope**: Hành động `with` kiểm tra đối tượng chỉ định; nếu không rỗng/false, nó chuyển ngữ cảnh dấu chấm (`.`) trỏ trực tiếp vào đối tượng đó bên trong khối lệnh. Sau khi gặp `{{ end }}`, biến `.` được khôi phục lại về scope trước đó.
- **Phòng tránh lỗi nil-pointer**: Nếu cố truy cập trường lồng nhau khi đối tượng cha là `nil`, Helm sẽ ngắt quá trình render với lỗi nil-pointer. Việc bọc khối bằng `with` (hoặc kiểm tra điều kiện an toàn trước) đảm bảo khối bên trong chỉ chạy khi đối tượng cha tồn tại, giúp tránh lỗi này.
</details>

### Câu Hỏi 5: Khi sử dụng vòng lặp `range` hoặc khối `with`, làm thế nào để vẫn truy cập được các đối tượng ở Root Scope như `.Release.Name` hay `.Values.global`?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân mất Root Scope**: Cả `with` và `range` đều gán lại biến dấu chấm `.` (trong `with` là đối tượng chỉ định, còn trong `range` mỗi lần lặp biến `.` trỏ vào phần tử hiện tại của collection). Vì vậy, gọi `{{ .Release.Name }}` bên trong khối này sẽ bị rỗng hoặc gây lỗi nil-pointer.
- **Cách khắc phục**: Sử dụng biến gốc `$` (Root Scope). Ký hiệu `$` luôn ánh xạ tới root scope từ lúc bắt đầu chạy và không bao giờ thay đổi trong suốt quá trình thực thi. Do đó, bên trong `with` hoặc `range`, ta dùng `{{ $.Release.Name }}`, `{{ $.Release.Revision }}` hay `{{ $.Values.global }}`.
</details>

### Câu Hỏi 6: Named Template được khai báo bằng `define` như thế nào và vì sao nên dùng `include` thay vì `template` để gọi lại nó?

<details>
<summary>Đáp án</summary>

- **Khai báo với `define`**: `define` tạo một named template partial (thường đặt trong tệp `templates/_helpers.tpl`, ví dụ `define "mychart.labels"`) để viết phần dùng chung một lần và tái sử dụng. Bản thân `define` không tự sinh output ra manifest cho tới khi được gọi.
- **Ưu thế của `include` so với `template`**:
  - `template` là một action của Go template nên output của nó **không thể** truyền tiếp qua toán tử pipeline `|` để xử lý định dạng.
  - `include` là một **hàm** trả về chuỗi văn bản, cho phép pipe kết quả sang các hàm khác như `nindent` để căn chỉnh thụt lề YAML chính xác (ví dụ: `{{- include "mychart.labels" . | nindent 4 }}`).
- **Ý nghĩa của dấu `.` ở cuối `include`**: Là ngữ cảnh dữ liệu được truyền vào named template (thường truyền root context `.` để đoạn helper đọc được `.Chart`, `.Release`, `.Values`,...).
</details>

### Câu Hỏi 7: Hàm `toYaml` (và `toYamlPretty`) dùng để làm gì? Tại sao khi chèn vào manifest phải kết hợp với `nindent` thay vì `indent`?

<details>
<summary>Đáp án</summary>

- **Chức năng của `toYaml` và `toYamlPretty`**:
  - `toYaml` mã hóa cả một đối tượng nhiều tầng từ `values.yaml` (ví dụ `resources`) thành chuỗi YAML có thụt lề sẵn mà không cần viết thủ công từng trường.
  - `toYamlPretty` có cùng mục đích nhưng bổ sung thêm thụt lề cho phần tử danh sách.
- **Cạm bẫy `indent` vs `nindent`**:
  - Hàm `indent N` chỉ thụt lề mà **không** tự động chèn ký tự xuống dòng trước dòng đầu tiên, khiến dòng đầu tiên của đoạn YAML bị thụt sai cột và làm hỏng cấu trúc YAML.
  - Hàm `nindent N` tự động chèn một ký tự xuống dòng (`\n`) ở đầu chuỗi rồi mới thụt lề `N` khoảng trắng cho toàn bộ văn bản.
- **Thực tiễn chuẩn**: Luôn viết `{{- toYaml . | nindent 12 }}` (với số khoảng trắng phù hợp vị trí cột).
</details>

### Câu Hỏi 8: Hàm `default` có cú pháp như thế nào và cần lưu ý điều gì khi giá trị đầu vào là `0` hoặc `false`?

<details>
<summary>Đáp án</summary>

- **Cú pháp**: `default DEFAULT_VALUE GIVEN_VALUE` (giá trị mặc định đứng **trước**). Ví dụ: `replicas: {{ default 1 .Values.replicaCount }}`. Khi viết theo dạng pipeline thì giá trị kiểm tra đặt trước pipe: `{{ .Values.replicaCount | default 1 }}`.
- **Chức năng**: Cung cấp giá trị mặc định dự phòng nếu giá trị truyền vào bị bỏ trống hoặc rỗng.
- **Lưu ý quan trọng**: Theo quy tắc đánh giá `false` của Go template, số `0` và boolean `false` đều bị coi là rỗng/false. Vì vậy, nếu người dùng truyền `0` hoặc `false`, hàm `default` vẫn sẽ ghi đè bằng `DEFAULT_VALUE`.
</details>

### Câu Hỏi 9: Hàm `required` hoạt động ra sao và tiêu chí nào giúp phân biệt khi nào nên dùng `required` thay cho `default`?

<details>
<summary>Đáp án</summary>

- **Hoạt động của `required`**: Cú pháp `required "thông báo" .Bar`. Nếu giá trị truyền vào bị thiếu hoặc rỗng, hàm sẽ ngắt ngay quá trình render và trả về thông báo lỗi tùy biến thay vì tạo ra manifest dở dang. Ví dụ: `required "A valid image.tag is required!" .Values.image.tag`.
- **Tiêu chí lựa chọn**:
  - **Dùng `default`**: Khi tham số bị thiếu vẫn có một giá trị dự phòng hợp lý và an toàn (như `replicas` mặc định `1`, `containerPort` mặc định `8080`, `image.pullPolicy` mặc định `"IfNotPresent"`).
  - **Dùng `required`**: Khi tham số có tính sống còn và việc tự đoán giá trị mặc định sẽ gây nguy hiểm hoặc sai lệch (như `image.tag`), cần chặn đứng quá trình render kèm thông báo rõ ràng.
</details>

### Câu Hỏi 10: Hàm `tpl` giải quyết bài toán gì trong Helm template? Hãy nêu ví dụ cách sử dụng.

<details>
<summary>Đáp án</summary>

- **Bài toán**: Theo mặc định, nội dung trong `values.yaml` chỉ được xem là dữ liệu tĩnh và không được engine template render. Nếu người dùng muốn viết sẵn biểu thức `{{ ... }}` ngay bên trong giá trị của `values.yaml`, Helm sẽ không tự giải mã nó.
- **Vai trò của `tpl`**: Hàm `tpl` lượng giá một chuỗi văn bản như một template ngay bên trong template, theo cú pháp `tpl .Values.template .`.
- **Ví dụ minh họa**: Nếu `values.yaml` có `host: "{{ .Release.Name }}.example.com"` và trong file template gọi `{{ tpl .Values.host . }}`, khi tên release là `shop` thì kết quả render sẽ ra `shop.example.com`.
</details>

### Câu Hỏi 11: Hàm `lookup` dùng để làm gì, nhận những tham số nào và gặp cạm bẫy gì khi chạy trong quy trình GitOps hoặc `helm template` offline?

<details>
<summary>Đáp án</summary>

- **Chức năng & Cú pháp**: Hàm `lookup apiVersion, kind, namespace, name` dùng để truy vấn tài nguyên đang tồn tại trên cụm Kubernetes ngay trong lúc render (trả về resource hoặc resource list; nếu không tìm thấy sẽ trả về giá trị rỗng).
- **Cạm bẫy khi chạy offline / GitOps**: Khi render offline bằng `helm template` hoặc dry-run thông thường không kết nối cluster, `lookup` không liên hệ tới Kubernetes API Server và luôn **trả về rỗng**, có thể dẫn đến thiếu tài nguyên hoặc render sai khác so với khi cài đặt thật.
- **Cách xử lý & kiểm thử**:
  - Luôn cung cấp giá trị mặc định dự phòng khi sử dụng kết quả từ `lookup`.
  - Khi cần kiểm thử template có `lookup` với API Server thật, sử dụng cờ `--dry-run=server` (ví dụ: `helm template demo-app ./mychart --dry-run=server`).
</details>

### Câu Hỏi 12: Cú pháp Whitespace Chomping `{{-` và `-}}` hoạt động như thế nào và vì sao lỗi `{{-3 }}` thường xảy ra?

<details>
<summary>Đáp án</summary>

- **Tác dụng của `{{-` (chomp trái)**: Xóa sạch toàn bộ khoảng trắng nằm ở bên trái của thẻ template.
- **Tác dụng của `-}}` (chomp phải)**: Tiêu thụ toàn bộ khoảng trắng và cả ký tự xuống dòng nằm ở bên phải của thẻ template. Điều này giúp tránh để lại các dòng trống hoặc khoảng trắng thừa do `if`, `range`, `with`, `end` gây ra làm lệch lề YAML.
- **Lỗi thiếu dấu cách (`{{-3 }}`)**: Giữa dấu gạch nối `-` và biểu thức hoặc câu lệnh **bắt buộc phải có khoảng trắng**.
  - `{{- 3 }}` (có dấu cách): xóa khoảng trắng bên trái và in ra `3`.
  - `{{-3 }}` (thiếu dấu cách): engine hiểu `-3` là số âm nên in ra `-3` và không thực hiện chomp trái.
</details>

### Câu Hỏi 13: Hãy chỉ ra các lỗi trong đoạn template sau và cách sửa đúng theo quy chuẩn của bài học:
```yaml
{{- with .Values.resources }}
resources:
  {{ toYaml . | indent 12 }}
{{- end }}
{{- with .Values.ingress }}
metadata:
  name: {{ .Release.Name }}-ingress
{{-3 }}
```

<details>
<summary>Đáp án</summary>

Đoạn mã có 3 lỗi sau:

1. **Lỗi thụt lề YAML khi dùng `toYaml` với `indent` (ở dòng `{{ toYaml . | indent 12 }}`)**:
   - `indent 12` không chèn ký tự xuống dòng trước dòng đầu tiên nên làm dòng đầu thụt sai cột và hỏng cấu trúc YAML.
   - **Cách sửa**: Dùng `{{- toYaml . | nindent 12 }}` để xuống dòng trước khi thụt lề 12 khoảng trắng.

2. **Lỗi mất Root Scope trong `with` (ở dòng `name: {{ .Release.Name }}-ingress`)**:
   - Chỉ thị `with .Values.ingress` đã chuyển dấu chấm `.` sang `.Values.ingress`, khiến `.Release.Name` bị rỗng hoặc gây lỗi nil-pointer.
   - **Cách sửa**: Dùng `$` để trỏ về root scope: `name: {{ $.Release.Name }}-ingress`.

3. **Lỗi cú pháp Whitespace Chomping thiếu dấu cách (ở dòng `{{-3 }}`)**:
   - Thiếu khoảng trắng sau dấu `-` khiến engine hiểu là số âm `-3` thay vì chomp khoảng trắng trái (đồng thời thiếu lệnh đóng khối `{{- end }}` cho khối `with`).
   - **Cách sửa**: Đóng khối bằng `{{- end }}` (hoặc viết `{{- 3 }}` nếu mục đích là chomp trái và in số `3`).
</details>

### Câu Hỏi 14: Ba lệnh kiểm thử sau trong Helm CLI khác nhau như thế nào về mục đích sử dụng?
1. `helm template demo-app ./mychart --dry-run=client`
2. `helm template demo-app ./mychart --dry-run=server`
3. `helm template demo-app ./mychart --set image.tag=""`

<details>
<summary>Đáp án</summary>

1. **`helm template demo-app ./mychart --dry-run=client`**: Render template hoàn toàn offline ở phía client, không kết nối tới Kubernetes cluster (lưu ý hàm `lookup` sẽ trả về rỗng trong chế độ này).
2. **`helm template demo-app ./mychart --dry-run=server`**: Render và kiểm tra trực tiếp với Kubernetes API Server; bắt buộc dùng khi muốn kiểm thử template có gọi hàm `lookup` để truy vấn tài nguyên thực tế trên cluster.
3. **`helm template demo-app ./mychart --set image.tag=""`**: Ghi đè `image.tag` thành chuỗi rỗng để kiểm thử xem hàm `required` trong template có chặn đứng quá trình render và trả về thông báo lỗi như kỳ vọng hay không.
</details>
