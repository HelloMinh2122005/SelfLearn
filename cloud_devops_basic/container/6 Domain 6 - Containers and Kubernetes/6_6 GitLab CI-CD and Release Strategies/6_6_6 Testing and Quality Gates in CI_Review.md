# Ôn Tập: 6_6_6 Testing and Quality Gates in CI

### Câu Hỏi 1: Mục tiêu cốt lõi của việc thiết lập Quality Gates (Cổng chất lượng) trong pipeline CI/CD là gì?

<details>
<summary>Đáp án</summary>

Mục tiêu của pipeline CI/CD không chỉ dừng ở việc biên dịch mã nguồn và đóng gói container image thành công. Trọng tâm cốt lõi của **Quality Gates** là thiết lập hệ thống kiểm soát tự động hóa đa tầng nhằm ngăn chặn sớm:
- Lỗi logic trong mã nguồn.
- Lỗ hổng bảo mật.
- Sai sót cấu hình hạ tầng trước khi triển khai vào môi trường vận hành thực tế.
</details>

### Câu Hỏi 2: Thuộc tính `artifacts:reports:junit` trong GitLab CI dùng để làm gì và hỗ trợ thu thập báo cáo cho dự án đa module như thế nào?

<details>
<summary>Đáp án</summary>

- **Mục đích**: `artifacts:reports:junit` là thuộc tính chuyên dụng của GitLab CI dùng để thu thập các tệp báo cáo kiểm thử XML định dạng chuẩn JUnit do framework kiểm thử (như Maven Surefire) sinh ra, giúp GitLab hiển thị bảng tóm tắt kết quả kiểm thử trực tiếp trên giao diện Merge Request (MR).
- **Hỗ trợ đa module / nhiều thư mục con**: Thuộc tính này hỗ trợ cú pháp wildcard để thu thập nhiều tệp báo cáo XML cùng lúc, ví dụ: `target/surefire-reports/TEST-*.xml`.
</details>

### Câu Hỏi 3: Khi cấu hình `artifacts:reports:junit`, tại sao cần thêm `when: always`? Nếu thiếu cấu hình này thì điều gì xảy ra?

<details>
<summary>Đáp án</summary>

- **Vấn đề nếu thiếu `artifacts:when: always`**: Mặc định khi bài test thất bại (job fail), GitLab sẽ không tải artifact lên, khiến tệp báo cáo XML không được nạp vào máy chủ và widget kiểm thử trên Merge Request bị mất đúng lúc cần xem lỗi nhất.
- **Cách khắc phục**: Luôn kết hợp đường dẫn tương đối wildcard với `artifacts:when: always` (ví dụ kèm `expire_in: 7 days`) để báo cáo XML luôn được thu thập ngay cả khi kiểm thử không đạt.
</details>

### Câu Hỏi 4: Code Coverage đo lường điều gì và từ khóa `coverage:` trong GitLab CI hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **Code Coverage (Độ bao phủ mã nguồn)**: Đo lường tỷ lệ phần trăm dòng mã nguồn được thực thi trong quá trình chạy kiểm thử tự động.
- **Cách hoạt động của `coverage:`**: Từ khóa `coverage:` trong cấu hình job cho phép khai báo biểu thức chính quy (regular expression) để trích xuất tỷ lệ phần trăm độ phủ trực tiếp từ log console của job và hiển thị huy hiệu độ phủ (Coverage Badge) trên Merge Request.
- **Ví dụ trong bài học**: Job Maven chạy `mvn clean test jacoco:report` và dùng `coverage: '/Total.*?([0-9]{1,3})%/'` để trích xuất con số phần trăm từ log.
</details>

### Câu Hỏi 5: Chiến lược bảo mật "Shift-Left" là gì và cách nhúng các template bảo mật có sẵn của GitLab vào pipeline như thế nào?

<details>
<summary>Đáp án</summary>

- **Chiến lược "Shift-Left"**: Là việc rà soát an ninh ngay từ sớm trong từng commit và Merge Request thay vì chờ đến giai đoạn vận hành trên môi trường production.
- **Cách nhúng template bảo mật**: GitLab tích hợp sẵn các template bảo mật tĩnh và cho phép nhúng vào `.gitlab-ci.yml` thông qua cú pháp:
  ```yaml
  include:
    - template: 'Jobs/<template-name>.gitlab-ci.yml'
  ```
  (Ví dụ: `Jobs/Secret-Detection.gitlab-ci.yml`, có thể kết hợp `rules: - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'` để kích hoạt trên MR).
</details>

### Câu Hỏi 6: Bốn công cụ quét bảo mật tích hợp của GitLab (Secret Detection, SAST, Dependency Scanning, Container Scanning) kiểm tra những gì và khác nhau thế nào về yêu cầu bản quyền?

<details>
<summary>Đáp án</summary>

1. **Secret Detection**: Rà quét mã nguồn và lịch sử commit git để phát hiện khóa bí mật hoặc mã API token bị rò rỉ. Hoạt động trên mọi gói bản quyền, kể cả **GitLab Free**.
2. **SAST (Static Application Security Testing)**: Phân tích mã nguồn tĩnh để tìm kiếm lỗ hổng an ninh lập trình. Khả năng quét cơ bản khả dụng trên **GitLab Free**, nhưng Vulnerability Report và widget bảo mật trên MR yêu cầu **GitLab Ultimate**.
3. **Dependency Scanning**: Rà soát các tệp khóa định nghĩa gói phụ thuộc (như `pom.xml`, `package-lock.json`) để phát hiện lỗ hổng đã công bố trong chuỗi cung ứng phần mềm. Yêu cầu **GitLab Ultimate** để quản lý tập trung.
4. **Container Scanning**: Phân tích container image sau khi build để phát hiện các mã lỗi CVE trong hệ điều hành cơ sở và thư viện hệ thống. Yêu cầu **GitLab Ultimate** để tích hợp bảng điều khiển.
</details>

### Câu Hỏi 7: Làm thế nào để thiết lập cổng chặn lỗ hổng container bằng Aqua Security Trivy trong GitLab CI (kể cả khi dùng GitLab Free)?

<details>
<summary>Đáp án</summary>

- Chạy Trivy như một job độc lập trong pipeline (ví dụ dùng image `aquasec/trivy:0.50.1` với `entrypoint: [""]`) và thực thi lệnh CLI `trivy image`.
- Kết hợp hai tham số quan trọng để biến Trivy thành Quality Gate chặn pipeline:
  - `--severity HIGH,CRITICAL`: Chỉ định mức độ lỗ hổng nghiêm trọng cần chặn.
  - `--exit-code 1`: Buộc Trivy trả về mã lỗi `1` và làm dừng pipeline ngay lập tức khi phát hiện lỗ hổng thuộc mức độ trên (không cần phụ thuộc tính năng chặn merge của GitLab Ultimate).
- Ví dụ lệnh: `trivy image --exit-code 1 --severity HIGH,CRITICAL $IMAGE_TAG`
</details>

### Câu Hỏi 8: Làm thế nào để kết xuất kết quả quét của Trivy sang định dạng báo cáo tương thích với GitLab?

<details>
<summary>Đáp án</summary>

- Sử dụng tham số `--format template --template '@/contrib/gitlab.tpl'` trong lệnh `trivy image` để xuất ra tệp JSON theo chuẩn của GitLab (ví dụ `-o gl-container-scanning-report.json`).
- Sau đó khai báo lưu tệp này vào thuộc tính `artifacts:reports:container_scanning` (thường đi kèm `when: always`) để GitLab tiếp nhận báo cáo.
</details>

### Câu Hỏi 9: Cạm bẫy nghẽn mạng nào thường gặp khi chạy Trivy trong nhiều pipeline và cách khắc phục ra sao?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Việc quét container image liên tục trong môi trường có nhiều pipeline chạy song song dễ chạm giới hạn tải cơ sở dữ liệu (DB) lỗ hổng của Trivy, gây nghẽn mạng hoặc lỗi tải DB.
- **Cách khắc phục**: Cấu hình `cache:` trong GitLab CI để lưu thư mục cache của Trivy (ví dụ thiết lập biến `TRIVY_CACHE_DIR: ".trivycache/"` và `cache: paths: [.trivycache/]`) hoặc dựng mirror cơ sở dữ liệu nội bộ.
</details>

### Câu Hỏi 10: Helm Quality Gate là gì và được đặt ở giai đoạn nào trong pipeline?

<details>
<summary>Đáp án</summary>

- **Helm Quality Gate** là bước kiểm định toàn diện cấu trúc Helm chart và manifest Kubernetes một cách **ngoại tuyến** (không cần kết nối tới cụm Kubernetes thực tế).
- Job này được tổ chức thành một job độc lập chạy **trước stage deployment** (ví dụ ở stage `validate-helm`), nhằm chặn sớm các sai sót cấu trúc chart, giá trị cấu hình hoặc schema Kubernetes trước khi đóng gói và triển khai.
</details>

### Câu Hỏi 11: Trình bày vai trò của từng thành phần trong chuỗi kiểm định Helm chart ngoại tuyến: `helm lint --strict`, `helm template`, `values.schema.json` và `kubeconform -strict`?

<details>
<summary>Đáp án</summary>

1. **`helm lint --strict`**: Kiểm tra cấu trúc thư mục chart, cú pháp `Chart.yaml` và quy ước Helm; cờ `--strict` chuyển đổi toàn bộ cảnh báo (warnings) thành lỗi làm thất bại pipeline.
2. **`values.schema.json`**: Tệp quy chuẩn đặt tại thư mục gốc của chart, sử dụng **JSON Schema Draft 7** để tự động kiểm tra kiểu dữ liệu và ràng buộc của `values.yaml` (ví dụ kiểu số nguyên, khoảng giá trị min/max, trường bắt buộc) khi chạy `helm lint` hoặc `helm template`.
3. **`helm template`**: Render toàn bộ template Go sang manifest YAML hoàn chỉnh (`helm template <release> <chart> -f <values>`) để phát hiện lỗi cú pháp và logic trong template trước khi gửi lên Kubernetes server.
4. **`kubeconform -strict`**: Nhận đầu ra YAML từ `helm template` (qua pipe `helm template ... | kubeconform -strict -summary`) để đối chiếu với OpenAPI schema chính thức của Kubernetes, chặn các trường bị sai chính tả hoặc tài nguyên không hợp lệ.
</details>

### Câu Hỏi 12: Tại sao chỉ chạy `helm lint --strict` hoặc chỉ chạy `helm template` là chưa đủ để đảm bảo manifest Kubernetes an toàn trước khi deploy?

<details>
<summary>Đáp án</summary>

- **`helm lint --strict`** chỉ kiểm tra cấu trúc thư mục chart và `Chart.yaml`, không thẩm định toàn bộ manifest sau khi render logic hay sự tương thích với Kubernetes OpenAPI schema.
- **`helm template`** chỉ render các tệp template thành chuỗi văn bản YAML thuần túy; nó không kiểm tra xem các trường (fields) trong manifest có đúng với đặc tả của Kubernetes API hay không.
- Vì vậy cần kết hợp đủ các lớp: `helm lint --strict` + `values.schema.json` (kiểm soát kiểu dữ liệu `values.yaml`) + đưa output của `helm template` qua `kubeconform -strict` (thẩm định với Kubernetes OpenAPI schema).
</details>

### Câu Hỏi 13: Từ khóa `allow_failure: true` trong GitLab CI có tác dụng gì và cần tránh cạm bẫy nào khi dùng cho các job bảo mật?

<details>
<summary>Đáp án</summary>

- **Tác dụng**: `allow_failure: true` cho phép một job kiểm tra an ninh hoặc chất lượng được thực thi và hiển thị cảnh báo nếu có lỗi, nhưng **không làm ngừng toàn bộ pipeline**.
- **Cạm bẫy cần tránh**: Nếu lạm dụng đặt `allow_failure: true` trên mọi job bảo mật, các cảnh báo dễ bị phớt lờ và lỗ hổng mức `CRITICAL` vẫn có thể lọt vào production.
- **Thực tiễn tốt nhất**: Chỉ cân nhắc `allow_failure: true` ở mức cảnh báo thấp; bắt buộc dừng pipeline đối với lỗ hổng `HIGH` và `CRITICAL` (ví dụ bằng `trivy image --exit-code 1 --severity HIGH,CRITICAL`).
</details>

### Câu Hỏi 14: Từ khóa `needs:` trong GitLab CI giúp tối ưu luồng chạy của các Quality Gates như thế nào?

<details>
<summary>Đáp án</summary>

- Mặc định trong GitLab CI, các job ở stage sau phải chờ toàn bộ các job ở stage trước hoàn thành.
- Từ khóa `needs:` cho phép các job kiểm thử hoặc quét bảo mật chạy song song theo mô hình **DAG (Directed Acyclic Graph)** ngay khi job mà nó phụ thuộc hoàn thành, giúp rút ngắn thời gian chờ mà vẫn đảm bảo đúng thứ tự phụ thuộc.
</details>
