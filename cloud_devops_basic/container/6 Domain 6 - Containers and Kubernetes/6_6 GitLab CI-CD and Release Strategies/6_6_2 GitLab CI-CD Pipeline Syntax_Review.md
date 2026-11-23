# Ôn Tập: 6_6_2 Cú Pháp Chi Tiết Pipeline GitLab CI-CD (.gitlab-ci.yml Syntax)

### Câu Hỏi 1: File `.gitlab-ci.yml` được đặt ở đâu trong kho lưu trữ, và từ khóa `default` có tác dụng gì?

<details>
<summary>Đáp án</summary>

File cấu hình `.gitlab-ci.yml` được đặt tại thư mục gốc (root) của kho lưu trữ git và đóng vai trò là điểm chỉ dẫn duy nhất cho GitLab Runner khi khởi tạo quy trình tự động hóa.

Từ khóa `default` dùng để định nghĩa các thông số mặc định được áp dụng tự động cho tất cả các job trong pipeline, bao gồm các cấu hình phổ biến như `image`, `before_script`, `after_script`, `retry`, `timeout`, và `artifacts`.
</details>

### Câu Hỏi 2: Từ khóa `stages` dùng để làm gì, và nếu không khai báo tường minh thì GitLab áp dụng những stage mặc định nào?

<details>
<summary>Đáp án</summary>

Từ khóa `stages` xác định thứ tự thực hiện tuần tự của các giai đoạn trong pipeline.

Khi không khai báo tường minh từ khóa `stages`, GitLab sẽ áp dụng danh sách stage mặc định gồm 5 giai đoạn theo thứ tự: `.pre`, `build`, `test`, `deploy`, và `.post`.
</details>

### Câu Hỏi 3: Khối `rules` được đánh giá theo nguyên tắc nào, và cần lưu ý bẫy thứ tự nào khi viết nhiều điều kiện trong `rules`?

<details>
<summary>Đáp án</summary>

Mảng `rules` trong mỗi job được đánh giá tuần tự từ trên xuống dưới (top-to-bottom) theo cơ chế **first match**: ngay khi gặp điều kiện đầu tiên thỏa mãn, trạng thái thực thi của job được xác định lập tức và toàn bộ các rule còn lại phía dưới sẽ bị bỏ qua.

**Bẫy thứ tự cần tránh:** Nếu đặt rule kiểm tra nhánh chung chung (ví dụ `$CI_COMMIT_BRANCH`) lên trước rule kiểm tra thay đổi tệp `changes`, biểu thức nhánh chung sẽ khớp trước và khiến điều kiện `changes` phía dưới không bao giờ được kiểm tra. Vì vậy, cần xếp các rule cụ thể, nghiêm ngặt (như `changes`, `exists`, tag) lên đầu và đặt các rule bao quát hoặc fallback `when: never` ở cuối mảng `rules`.
</details>

### Câu Hỏi 4: Trong khối `rules`, hai thuộc tính `changes` và `exists` khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- `changes`: Kiểm tra sự thay đổi của các tệp hoặc đường dẫn chỉ định thông qua biểu thức mẫu glob.
- `exists`: Kiểm tra sự hiện diện của tệp cụ thể trong repository.
</details>

### Câu Hỏi 5: Thuộc tính `when` bên trong khối `rules` hỗ trợ những giá trị nào và giá trị nào là mặc định?

<details>
<summary>Đáp án</summary>

Thuộc tính `when` bên trong `rules` quyết định cách thức job được kích hoạt, hỗ trợ 6 giá trị sau:
- `on_success` (mặc định)
- `manual`
- `always`
- `never`
- `on_failure`
- `delayed`
</details>

### Câu Hỏi 6: Từ khóa `needs` (mô hình DAG) khắc phục hạn chế nào của mô hình pipeline tuần tự theo `stage` truyền thống?

<details>
<summary>Đáp án</summary>

Trong mô hình phân tầng theo `stage` truyền thống, mọi job ở stage sau phải chờ toàn bộ các job ở stage trước hoàn tất (tạo thành vách ngăn chờ đồng bộ).

Từ khóa `needs` cho phép job thực thi theo mô hình Đồ thị có hướng không chu trình (DAG): job có thể chạy ngay khi các job phụ thuộc được liệt kê hoàn thành mà không cần chờ toàn bộ stage phía trước kết thúc, giúp rút ngắn đáng kể thời gian hoàn thành pipeline.
</details>

### Câu Hỏi 7: Khi một job sử dụng `needs: [job_name]`, hành vi mặc định đối với artifacts là gì và làm sao để vô hiệu hóa nếu không cần tải artifacts?

<details>
<summary>Đáp án</summary>

Theo mặc định, một job sử dụng `needs: [job_name]` sẽ tự động tải artifacts từ các job được liệt kê.

Nếu không cần tải dữ liệu này, bạn có thể vô hiệu hóa bằng cách thiết lập `artifacts: false` bên trong object của job cần phụ thuộc.
</details>

### Câu Hỏi 8: Sự khác nhau giữa `needs` và `dependencies` là gì, và khai báo `dependencies: []` có tác dụng gì?

<details>
<summary>Đáp án</summary>

- `needs`: Điều khiển job chạy theo mô hình DAG (không phải chờ cả stage phía trước hoàn thành) và mặc định tự động tải artifacts từ các job phụ thuộc được liệt kê.
- `dependencies`: Không thay đổi thứ tự chạy theo stage mà chỉ xác định danh sách các job tiền nhiệm thuộc các stage trước để tải artifacts về không gian làm việc.

Khi thiết lập `dependencies: []`, GitLab Runner được chỉ thị bỏ qua hoàn toàn việc tải artifacts từ các stage trước về workspace của job hiện tại.
</details>

### Câu Hỏi 9: Hãy phân biệt mục đích sử dụng và nơi lưu trữ giữa `artifacts` và `cache`.

<details>
<summary>Đáp án</summary>

- **`artifacts` (Bàn giao thành phẩm)**: Dùng để lưu trữ và chuyển giao các tệp kết quả tạo ra sau khi build (như file `.jar`, thư mục `dist/`, báo cáo kiểm thử) giữa các stage khác nhau hoặc tải về máy cục bộ qua giao diện GitLab. Dữ liệu artifacts được tải lên **GitLab Coordinator**.
- **`cache` (Tăng tốc xử lý)**: Dùng để tăng tốc độ pipeline bằng cách tái sử dụng các tệp phụ thuộc của bên thứ ba (như `node_modules/`, `.m2/repository`) giữa các lần chạy pipeline trên **runner** hoặc lưu trữ tại **object storage**.
</details>

### Câu Hỏi 10: Vì sao không nên cấu hình thư mục kết quả build (như `dist/` hoặc `target/`) vào `cache` để bàn giao cho stage sau?

<details>
<summary>Đáp án</summary>

Vì `cache` không được thiết kế để đảm bảo tính sẵn sàng 100%. Nếu cache bị dọn dẹp (cache eviction) trên runner mới hoặc xảy ra cache miss, job ở stage sau sẽ bị lỗi do không tìm thấy file build.

**Thực tiễn đúng:** Luôn dùng `artifacts` cho bất kỳ tệp dữ liệu đầu ra nào cần chuyển giao giữa các job; chỉ dùng `cache` cho các thư viện phụ thuộc có thể tải lại được khi gặp cache miss.
</details>

### Câu Hỏi 11: Thời gian lưu trữ mặc định của `artifacts` là bao lâu, và cần cấu hình `expire_in` như thế nào trong môi trường sản xuất để tránh phình dung lượng?

<details>
<summary>Đáp án</summary>

Nếu không chỉ định `expire_in`, dữ liệu `artifacts` sẽ được lưu trữ trên GitLab Coordinator với thời hạn mặc định là **30 ngày**. Nếu build liên tục cho merge request hoặc nhánh phát triển mà quên `expire_in`, các tệp nén lớn sẽ tồn tại 30 ngày gây cạn kiệt dung lượng ổ cứng hoặc tăng chi phí object storage.

**Giải pháp:** Luôn thiết lập thời hạn ngắn như `expire_in: 1 day` hoặc `expire_in: 1 hour` cho các job kiểm thử và build tạm trên merge request; chỉ giữ artifacts lâu dài (ví dụ `1 month` hoặc `never`) cho các bản phát hành chính thức (Release Tags).
</details>

### Câu Hỏi 12: Từ khóa `cache` hỗ trợ những giá trị `policy` nào?

<details>
<summary>Đáp án</summary>

`cache` hỗ trợ thiết lập `policy` với 3 giá trị:
- `pull`
- `push`
- `pull-push` (mặc định)

Theo luồng vòng đời của job, `pull` diễn ra khi khởi tạo job để tải và giải nén tệp phụ thuộc vào workspace, còn `push` diễn ra khi kết thúc job để đẩy cache mới lên nếu có thay đổi.
</details>

### Câu Hỏi 13: Khi muốn tái sử dụng cấu hình YAML giữa các job, `extends` và thẻ `!reference` khác nhau ở điểm nào?

<details>
<summary>Đáp án</summary>

- **`extends`**: Cho phép một job kế thừa **toàn bộ cấu hình** từ một template job ẩn (thường bắt đầu bằng dấu chấm `.`), hỗ trợ cơ chế merge cấu hình đệ quy và cho phép ghi đè các khóa trùng lặp.
- **`!reference`**: Là cú pháp thẻ tùy chỉnh của GitLab YAML cho phép **nhúng trực tiếp từng khối thuộc tính cụ thể** (chẳng hạn chỉ lấy mảng `before_script` hoặc `rules`) từ job khác mà không cần kế thừa toàn bộ cấu trúc của job đó.
</details>

### Câu Hỏi 14: Từ khóa `include` hỗ trợ những nguồn nào, và CI/CD Components & Catalog giải quyết bài toán gì?

<details>
<summary>Đáp án</summary>

Từ khóa `include` cho phép nhập và ghép nối các tệp cấu hình CI từ bên ngoài thông qua 5 từ khóa nguồn: `local`, `project`, `remote`, `template`, và `component`.

**CI/CD Components & Catalog** cho phép đóng gói các đoạn cấu hình CI/CD thành các module tái sử dụng có gắn nhãn phiên bản, phát hành lên CI/CD Catalog và nhúng trực tiếp vào pipeline thông qua cú pháp `include: component: 'gitlab.com/.../component-name@version'`.
</details>

### Câu Hỏi 15: Hai cấu hình `parallel:matrix` và `interruptible: true` mang lại lợi ích gì cho pipeline?

<details>
<summary>Đáp án</summary>

- **`parallel:matrix`**: Cho phép nhân bản một job thành nhiều job con chạy song song đồng thời với các tổ hợp biến số môi trường khác nhau trong ma trận thử nghiệm (ví dụ chạy kiểm thử đồng thời trên nhiều phiên bản trình duyệt và Node.js).
- **`interruptible: true`**: Cho phép hệ thống tự động hủy các job đang chạy trong pipeline cũ khi có commit mới được đẩy lên cùng nhánh hoặc merge request, giúp tiết kiệm tài nguyên runner.
</details>

### Câu Hỏi 16: `resource_group` giải quyết vấn đề gì khi triển khai (deploy) trong môi trường thực tế?

<details>
<summary>Đáp án</summary>

Khi nhiều pipeline chạy song song cùng kích hoạt job deploy vào một môi trường đích (ví dụ hai lập trình viên merge code vào nhánh chính cách nhau vài giây), hai tiến trình deploy có thể ghi đè cấu hình lẫn nhau gây xung đột (race condition), downtime hoặc trạng thái bất định.

Khai báo `resource_group` giúp giới hạn mức độ tương tranh thành 1 cho các job cùng chia sẻ một nhóm tài nguyên, ép các job deploy phải xếp hàng thực thi tuần tự và loại bỏ xung đột.
</details>

### Câu Hỏi 17: Hãy phân biệt Parent-Child Pipeline và Multi-Project Pipeline về từ khóa cấu hình và tình huống sử dụng.

<details>
<summary>Đáp án</summary>

- **Parent-Child Pipeline**: Sử dụng từ khóa `trigger: include` để khởi chạy một pipeline con độc lập nằm **trong cùng một repository**. Kiến trúc này tối ưu cho **monorepo** (ví dụ kết hợp với `rules: changes` để chỉ kích hoạt pipeline con của service bị thay đổi).
- **Multi-Project Pipeline**: Sử dụng từ khóa `trigger: project` kết hợp thuộc tính `branch` để kích hoạt một pipeline độc lập **trên một dự án GitLab khác**.
</details>
