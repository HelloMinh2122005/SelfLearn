# Ôn Tập: 6_6_11 Pipeline Optimization and Troubleshooting

### Câu Hỏi 1: Trạng thái `pending` của một job trong GitLab CI/CD có ý nghĩa là gì, và cấu hình `tags` không khớp có thể khiến job bị treo `pending` trong những trường hợp nào?

<details>
<summary>Đáp án</summary>

Trạng thái `pending` nghĩa là GitLab đã tạo job nhưng chưa có **Runner** nào nhận chạy job đó.

Liên quan đến `tags`, job sẽ bị treo `pending` trong hai trường hợp:
- Job khai báo `tags`, nhưng không có runner nào đang bật sở hữu đầy đủ toàn bộ danh sách tag mà job yêu cầu.
- Job không khai báo `tags`, nhưng mọi runner khả dụng đều đang tắt tùy chọn chạy job không gắn tag (`run_untagged: false`).
</details>

### Câu Hỏi 2: Ngoài sự cố lệch `tags`, những nguyên nhân nào từ phía Runner và file `config.toml` có thể làm job bị kẹt ở trạng thái `pending`?

<details>
<summary>Đáp án</summary>

Có ba nguyên nhân phổ biến khác từ phía Runner:
1. **Hết giới hạn chạy đồng thời (`concurrent`)**: Trong file `/etc/gitlab-runner/config.toml`, tham số `concurrent` quy định tổng số job chạy song song tối đa; khi đạt ngưỡng này, các job mới phải xếp hàng chờ ở trạng thái `pending`.
2. **Runner bị tạm dừng (`paused`)**: Runner đã bị quản trị viên tạm ngừng nhận job mới.
3. **Runner mất kết nối (`offline`)**: Runner gặp sự cố mạng hoặc dừng hoạt động nên không kết nối được tới GitLab server.
</details>

### Câu Hỏi 3: Khi một job đã chạy nhưng bị thất bại (Failed), bạn kiểm tra log ở đâu và làm thế nào để chạy lại nhanh job đó?

<details>
<summary>Đáp án</summary>

- **Kiểm tra log**: GitLab ghi lại đầu ra theo thời gian thực của các phần `before_script`, `script` và `after_script` ngay trong khung log của job đó để bạn chẩn đoán lỗi.
- **Chạy lại nhanh**: Bạn có thể nhấn nút **Retry** trên job bị lỗi để chạy lại riêng job đó mà không cần kích hoạt lại toàn bộ pipeline.
</details>

### Câu Hỏi 4: Vì sao đôi khi bạn push code lên GitLab nhưng không thấy pipeline mới nào được tạo, và làm thế nào để kiểm tra trước khi push?

<details>
<summary>Đáp án</summary>

Có hai nguyên nhân chính khiến pipeline không được khởi tạo:
1. **Lỗi cú pháp YAML**: YAML phụ thuộc chặt chẽ vào thụt lề bằng dấu cách (space); chỉ cần lệch cấp thụt lề, dùng phím Tab thay cho dấu cách, hoặc khai báo sai kiểu dữ liệu của từ khóa, GitLab sẽ từ chối tạo pipeline và báo lỗi cú pháp (ví dụ: `jobs:test-unit config contains unknown keys` hoặc `YAML syntax error: did not find expected key`).
2. **Điều kiện `rules` loại bỏ hết job**: Nếu mọi job trong pipeline đều có `rules` đánh giá không khớp (hoặc rơi vào `when: never`), pipeline sẽ không có job nào để chạy nên GitLab không khởi tạo pipeline đó.

**Cách kiểm tra trước khi push**: Dán cấu hình vào **CI Lint** hoặc dùng tab **Validate** trong **Pipeline Editor** (`Build > Pipeline editor > Validate`) để kiểm tra cú pháp, logic từ khóa và mô phỏng xem pipeline có được tạo hay không.
</details>

### Câu Hỏi 5: Tại sao một biến môi trường CI/CD (ví dụ `PROD_API_KEY`) hoạt động bình thường trên nhánh `main` nhưng lại bị rỗng khi chạy pipeline trên nhánh tính năng (`feat/*`)?

<details>
<summary>Đáp án</summary>

Nguyên nhân là do biến đó đang được bật tùy chọn **Protected**.

Biến CI/CD đánh dấu **Protected** chỉ được truyền vào các pipeline chạy trên **protected branches** (như `main`) hoặc **protected tags**. Trên các nhánh tính năng thông thường (`feat/*`), giá trị của biến này sẽ không được nạp vào job, dẫn đến bị rỗng. Vì vậy, không nên đánh dấu **Protected** cho các biến dùng cho môi trường dev/test mà lập trình viên cần chạy kiểm thử trên nhánh tính năng.
</details>

### Câu Hỏi 6: Tùy chọn **Masked** của biến môi trường có tác dụng gì và giá trị biến cần đáp ứng những điều kiện nào để GitLab cho phép mask?

<details>
<summary>Đáp án</summary>

- **Tác dụng**: Tùy chọn **Masked** giúp che giấu giá trị bí mật (như token, mật khẩu) bằng chuỗi `[MASKED]` khi xuất hiện trong job log.
- **Điều kiện định dạng**: Giá trị biến phải dài tối thiểu **8 ký tự**, **không chứa khoảng trắng**, và chỉ gồm các ký tự hợp lệ theo quy chuẩn masking của GitLab. Nếu không thỏa mãn, GitLab sẽ báo lỗi không cho lưu hoặc không thể mask biến đó.
</details>

### Câu Hỏi 7: Khi dùng `CI_DEBUG_TRACE: "true"` để gỡ lỗi biến môi trường bị thiếu hoặc sai, bạn cần đặc biệt lưu ý rủi ro gì?

<details>
<summary>Đáp án</summary>

Khi bật `CI_DEBUG_TRACE: "true"`, runner sẽ in toàn bộ lệnh thực thi và mọi biến môi trường (bao gồm cả các giá trị nhạy cảm/secret nếu không được mask) ra job log. Điều này gây rủi ro lộ thông tin bí mật nếu log ở chế độ công khai hoặc nhiều người có quyền đọc. Do đó, chỉ nên bật tạm thời khi debug và **xóa biến này ngay sau khi gỡ lỗi xong**.
</details>

### Câu Hỏi 8: Từ khóa `needs` (DAG) cải thiện tốc độ pipeline như thế nào so với cách chờ theo `stage` truyền thống, và `artifacts: false` trong `needs` dùng để làm gì?

<details>
<summary>Đáp án</summary>

- **Tác dụng của `needs` (DAG)**: `needs` thiết lập đồ thị phụ thuộc có hướng không chu trình (DAG), cho phép một job chạy ngay khi các job tiền điều kiện mà nó chỉ định hoàn thành, thay vì phải ngồi chờ toàn bộ các job không liên quan trong stage trước kết thúc.
- **Tác dụng của `artifacts: false`**: Mặc định `needs` sẽ tải về artifacts của các job mà nó phụ thuộc. Nếu job sau không cần sử dụng các file đầu ra đó, bạn nên đặt `artifacts: false` trong mục `needs` để tiết kiệm thời gian truyền tải dữ liệu.
</details>

### Câu Hỏi 9: Cơ chế `cache:key:files` và `policy: pull` giúp tối ưu thời gian xử lý thư viện như thế nào?

<details>
<summary>Đáp án</summary>

- **`cache:key:files`**: Tạo khóa cache dựa trên giá trị băm (hash) của các file khai báo thư viện (như `pom.xml`, `package-lock.json`). Nhờ đó, hệ thống chỉ cần dựng lại cache khi các file phụ thuộc này thực sự thay đổi, còn lại có thể dùng lại cache cũ thay vì tải từ đầu.
- **`policy: pull`**: Các job chỉ cần đọc thư viện để chạy (như lint, test hoặc job build dùng lại cache có sẵn) nên đặt `policy: pull` để bỏ qua bước nén và tải cache ngược lên server ở cuối job, giúp rút ngắn thời gian chạy. Chỉ job chịu trách nhiệm cập nhật cache khi file khóa thay đổi mới cần dùng `policy: pull-push`.
</details>

### Câu Hỏi 10: Vì sao không được lạm dụng `cache` thay thế cho `artifacts` để truyền file biên dịch (như file `.jar`) sang các job ở stage sau?

<details>
<summary>Đáp án</summary>

Vì `cache` chỉ mang tính chất tăng tốc và **không được đảm bảo luôn tồn tại** (có thể bị mất hoặc chưa có khi job chạy trên một runner khác hoặc khi cache hết hạn). Mọi dữ liệu bắt buộc phải truyền giữa các job (như file `.jar` sau khi build để dùng cho deploy) đều phải dùng `artifacts`.
</details>

### Câu Hỏi 11: `rules:changes` giúp giảm thời gian chạy pipeline ra sao và có "cạm bẫy" gì cần tránh khi đẩy một nhánh mới lên GitLab?

<details>
<summary>Đáp án</summary>

- **Lợi ích**: `rules:changes` kiểm tra danh sách file thay đổi để quyết định có chạy job hay không, giúp bỏ qua các job build/test không liên quan (ví dụ: chỉ sửa file trong `charts/` hoặc `README.md` thì không cần chạy job biên dịch/test Java).
- **Cạm bẫy trên nhánh mới**: Khi bạn tạo một nhánh mới tinh và push lần đầu ở dạng branch pipeline (chưa tạo Merge Request), hoặc khi đẩy tag, GitLab không có commit gốc trên nhánh đó để so sánh nên `rules:changes` mặc định luôn đánh giá là `true` và chạy toàn bộ job. Để khắc phục, hãy ưu tiên chạy trên **Merge Request pipeline** hoặc cấu hình thêm `compare_to`.
</details>

### Câu Hỏi 12: Làm thế nào để tự động hủy các pipeline cũ đang chạy dở khi có commit mới được đẩy lên cùng nhánh, nhưng vẫn bảo vệ được job quan trọng như `deploy-prod`?

<details>
<summary>Đáp án</summary>

- **Tự động hủy pipeline cũ**: Đặt `interruptible: true` cho các job (hoặc trong phần `default:`) kết hợp bật tùy chọn **Auto-cancel redundant pipelines** trong cài đặt project. Khi có commit mới trên cùng nhánh, GitLab sẽ tự động hủy pipeline cũ đang chờ hoặc đang chạy nếu các job đã chạy đều cho phép ngắt ngang (`interruptible: true`).
- **Bảo vệ job quan trọng**: Giá trị mặc định của `interruptible` là `false`. Với các job nhạy cảm như `deploy-prod`, bạn đặt `interruptible: false`; một khi job có `interruptible: false` đã bắt đầu chạy, GitLab sẽ không tự động hủy pipeline đó nữa.
</details>

### Câu Hỏi 13: Nên cấu hình `retry` và `timeout` như thế nào để vừa tăng khả năng tự phục hồi, vừa không gây lãng phí phút CI và nghẽn hàng đợi `pending`?

<details>
<summary>Đáp án</summary>

- **Giới hạn `retry` đúng lỗi**: Chỉ nên cấu hình `retry` (ví dụ `max: 2`) kèm điều kiện `when` cho các lỗi hạ tầng/hệ thống ngẫu nhiên như `runner_system_failure` hoặc `stuck_or_timeout_failure`. Tránh retry mù quáng khi job thất bại do lỗi logic/test code vì sẽ làm lãng phí phút CI và khiến hàng đợi `pending` bị nghẽn thêm.
- **Đặt `timeout`**: Luôn cấu hình `timeout` ở mức job (hoặc mức project) để ngắt sớm các job bị treo vô thời hạn, tránh cạn kiệt slot runner và hạn mức phút CI.
</details>

### Câu Hỏi 14: Ở quy mô Enterprise, khi nào nên chọn `include:`, `trigger: include` hay `trigger: project`, và cần lưu ý gì về `strategy: mirror` từ GitLab 18.2+?

<details>
<summary>Đáp án</summary>

Ba cơ chế khác nhau về số lượng pipeline được tạo và phạm vi repository:
1. **`include:`** (`local`, `project`, `remote`, `template`, `component`): Gộp các đoạn YAML bên ngoài vào **1 pipeline duy nhất** ngay lúc phân tích cấu hình, dùng chung `stages` và ngữ cảnh biến. Phù hợp để chia sẻ template/chuẩn CI chung giữa nhiều nhóm mà không sinh thêm pipeline phụ.
2. **`trigger: include` (Parent-Child Pipeline)**: Khởi tạo một **pipeline con độc lập** nằm trong **cùng repository** (tạo nhiều pipeline: 1 cha + các con). Thường kết hợp `rules:changes` cho kiến trúc **monorepo** có nhiều microservice để mỗi service chỉ chạy pipeline con riêng khi code service đó thay đổi.
3. **`trigger: project` (Multi-Project Pipeline)**: Kích hoạt một pipeline độc lập ở **project / repository khác** (có thể chỉ định `branch`). Phù hợp kiến trúc **multi-repo** (ví dụ repo App build xong kích hoạt repo GitOps hoặc E2E test), giúp giữ nguyên ranh giới phân quyền và biến bí mật riêng của từng project.

**Lưu ý về `strategy` (GitLab 18.2+)**: Khi dùng `trigger: include` hoặc `trigger: project`, từ GitLab 18.2+ nên dùng `strategy: mirror` để job cha chờ và phản ánh chính xác mọi trạng thái của pipeline con/downstream; tùy chọn `strategy: depend` ở các phiên bản cũ hơn trước 18.2 không còn được khuyến nghị vì trạng thái trigger job không phải lúc nào cũng khớp với pipeline con.
</details>
