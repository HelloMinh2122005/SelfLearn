# Ôn Tập: 6_6_1 GitLab CI/CD Fundamentals

### Câu Hỏi 1: Tệp cấu hình `.gitlab-ci.yml` được đặt ở đâu, và mô hình phân cấp ba tầng trong GitLab CI/CD gồm những thành phần nào?

<details>
<summary>Đáp án</summary>

Tệp cấu hình YAML `.gitlab-ci.yml` được đặt tại **thư mục gốc của kho mã nguồn** để điều khiển quy trình CI/CD.

Mô hình phân cấp ba tầng của GitLab CI/CD gồm: **Pipeline chứa các Stage, và mỗi Stage chứa một hoặc nhiều Job**:
- **Pipeline**: Đại diện cho toàn bộ quy trình CI/CD được khởi tạo cho một lần kích hoạt, quản lý chu trình từ tiếp nhận mã nguồn đến kiểm thử và phát hành.
- **Stage**: Xác định trình tự thực thi logic trong pipeline (ví dụ: biên dịch, kiểm thử, đóng gói, triển khai).
- **Job**: Đơn vị thực thi nhỏ nhất chạy các câu lệnh kịch bản trong môi trường biệt lập (container hoặc máy ảo), định nghĩa rõ hình ảnh hệ điều hành, lệnh kịch bản và tệp bàn giao.
</details>

### Câu Hỏi 2: Theo mặc định, thứ tự thực thi giữa các Stage khác nhau và giữa các Job trong cùng một Stage diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

- **Giữa các Stage**: Các stage được điều phối thực thi **nối tiếp (tuần tự)** theo thứ tự khai báo. Tất cả các job trong stage trước phải hoàn thành thành công thì các job thuộc stage kế tiếp mới được kích hoạt.
- **Giữa các Job trong cùng một Stage**: Theo mặc định, các job nằm trong cùng một stage sẽ được điều phối thực thi **song song** nếu hệ thống có đủ GitLab Runner đáp ứng.
</details>

### Câu Hỏi 3: GitLab Runner giao tiếp với GitLab Coordinator theo mô hình nào, và cơ chế này mang lại những ưu điểm vận hành gì?

<details>
<summary>Đáp án</summary>

GitLab tách biệt giữa máy chủ điều phối trung tâm (**GitLab Coordinator**) và máy chủ thực thi tác vụ (**GitLab Runner**). GitLab Runner là một ứng dụng độc lập hoạt động theo **cơ chế kéo (pull model)**: Runner liên tục thăm dò (**long polling**) qua HTTP (ví dụ `GET /jobs/request`) tới GitLab API để nhận job mà không yêu cầu GitLab server kết nối ngược lại.

Ưu điểm vận hành của cơ chế kéo:
1. **Bảo mật mạng**: Không yêu cầu mở cổng kết nối từ Internet vào máy chủ Runner; Runner chỉ cần chiều kết nối ra máy chủ GitLab (có thể đặt an toàn bên trong mạng nội bộ phía sau tường lửa).
2. **Khả năng co giãn**: Dễ dàng bổ sung thêm các Runner mới trong mạng nội bộ hoặc trên đám mây để tăng công suất xử lý mà không cần gán địa chỉ IP tĩnh cố định.
3. **Định tuyến linh hoạt**: Phân bổ tác vụ chính xác đến từng loại Runner dựa trên hệ thống nhãn nhận diện (`tags`).
</details>

### Câu Hỏi 4: Biến môi trường định sẵn `$CI_PIPELINE_SOURCE` cho biết thông tin gì và có những giá trị phổ biến nào? Khi đẩy một commit kèm git tag thì pipeline nhận nguồn gì?

<details>
<summary>Đáp án</summary>

Biến môi trường định sẵn `$CI_PIPELINE_SOURCE` chỉ định **phương thức/nguồn sự kiện đã kích hoạt pipeline**, gồm các giá trị:
- `push`: Đẩy commit mới lên nhánh hoặc đẩy git tag.
- `merge_request_event`: Tạo hoặc cập nhật mã nguồn trong Merge Request.
- `schedule`: Chạy tự động theo lịch hẹn giờ định kỳ.
- `web`: Kích hoạt thủ công từ giao diện đồ họa.
- `trigger`: Kích hoạt qua việc gọi API webhook bằng mã token.
- `parent_pipeline`: Kích hoạt từ một pipeline cha sang pipeline con.

Khi một commit được đẩy kèm **git tag**, pipeline được khởi tạo với `$CI_PIPELINE_SOURCE` là `push`, đồng thời biến định sẵn `$CI_COMMIT_TAG` được thiết lập để lưu tên của tag đó.
</details>

### Câu Hỏi 5: Branch Pipeline và Merge Request Pipeline khác nhau như thế nào về ref thực thi và biến môi trường định sẵn?

<details>
<summary>Đáp án</summary>

- **Branch Pipeline**: Được kích hoạt khi đẩy commit lên nhánh Git thông thường, chạy trên ref của chính nhánh đó và **không chứa** các biến định sẵn dành riêng cho Merge Request.
- **Merge Request Pipeline**: Chạy trên ref `refs/merge-requests/:iid/head` và cung cấp các biến định sẵn đặc thù của Merge Request như `$CI_MERGE_REQUEST_IID` và `$CI_MERGE_REQUEST_TARGET_BRANCH_NAME`.
</details>

### Câu Hỏi 6: Hiện tượng pipeline kép (duplicate pipelines) xảy ra khi nào và gây ra hậu quả gì trong thực tế?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Khi đẩy commit lên một nhánh **đang mở Merge Request** mà không cấu hình quy tắc lọc sự kiện, GitLab sẽ tự động tạo đồng thời cả **Branch Pipeline** (từ sự kiện đẩy commit lên nhánh) lẫn **Merge Request Pipeline** (từ sự kiện cập nhật mã nguồn trong Merge Request) cho cùng một commit.
- **Hậu quả trong thực tế**: Tiêu hao gấp đôi hạn ngạch tính toán của hệ thống máy chạy (Runner) và làm kéo dài thời gian phản hồi kết quả kiểm thử.
</details>

### Câu Hỏi 7: Từ khóa `workflow:rules` có tác dụng gì, được đặt ở đâu trong `.gitlab-ci.yml`, và cấu hình như thế nào để ngăn chặn hoàn toàn duplicate pipelines?

<details>
<summary>Đáp án</summary>

Từ khóa `workflow:rules` được đặt ở **cấp độ cao nhất** (đầu tệp) của `.gitlab-ci.yml` để quyết định việc **toàn bộ pipeline có được tạo ra hay không** dựa trên sự kiện kích hoạt.

Để ngăn chặn hoàn toàn duplicate pipelines, `workflow:rules` cấu hình bỏ qua Branch Pipeline bằng `when: never` khi biến `$CI_OPEN_MERGE_REQUESTS` tồn tại trên nhánh có Merge Request đang mở, đồng thời cho phép chạy với `merge_request_event`, nhánh thường không có MR mở (`$CI_COMMIT_BRANCH`), hoặc tag (`$CI_COMMIT_TAG`):

```yaml
workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS'
      when: never
    - if: '$CI_COMMIT_BRANCH'
    - if: '$CI_COMMIT_TAG'
```
</details>

### Câu Hỏi 8: Khi đối chiếu từ Azure DevOps Pipelines sang GitLab CI/CD, các thành phần như tệp khai báo, tác vụ kịch bản, máy thực thi, định tuyến máy chạy và kho biến cấu hình tương ứng với nhau như thế nào?

<details>
<summary>Đáp án</summary>

Bảng ánh xạ tương đương giữa Azure DevOps Pipelines và GitLab CI/CD:
- **Cấu trúc giai đoạn**: `stages` tương ứng với `stages`.
- **Đơn vị thực thi**: `jobs` tương ứng với `jobs`.
- **Tác vụ kịch bản**: `steps` (script, task) tương ứng với `script`, `before_script`, `after_script`.
- **Máy thực thi job**: Self-hosted / Microsoft-hosted Agent tương ứng với **GitLab Runner** (Shared / Specific / Group).
- **Định tuyến máy chạy**: `pool: name` và `demands` tương ứng với **`tags`**.
- **Kho biến cấu hình**: Variable Groups (Library) tương ứng với **CI/CD Variables** (Project / Group level).
- **Tệp khai báo**: `azure-pipelines.yml` tương ứng với **`.gitlab-ci.yml`**.
</details>

### Câu Hỏi 9: Trong cấu hình `.gitlab-ci.yml` mẫu, khối `default` với `image` và `tags` giúp trả lời hai câu hỏi lớn nào cho mỗi Job? Ngoài ra, làm thế nào để truyền tệp đầu ra giữa các stage và giới hạn job `deploy` chỉ chạy trên nhánh mặc định hoặc tag?

<details>
<summary>Đáp án</summary>

- **Khối `default` (`image` và `tags`)** thiết lập môi trường chạy mặc định cho toàn bộ các Job, trả lời 2 câu hỏi lớn:
  - **Ai làm?** (`tags`): Giao cho Runner có nhãn tương ứng (ví dụ `docker`) xử lý.
  - **Làm ở đâu?** (`image`): Mở một container chạy image chỉ định (ví dụ `alpine:latest`) để chạy lệnh.
- **Truyền tệp giữa các stage**: Khai báo `artifacts:` (với `paths:` và `expire_in:`) trong job ở stage trước (như `compile-app`) để bàn giao tệp đầu ra cho các job ở stage sau (như `unit-tests`).
- **Giới hạn job `deploy` chỉ chạy trên nhánh mặc định hoặc tag**: Sử dụng khối `rules:` ngay trong job đó để kiểm tra `$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH` và `$CI_COMMIT_TAG`.
</details>

### Câu Hỏi 10: Khi một Job trong GitLab CI/CD bị rơi vào trạng thái `pending` và không chịu khởi chạy, những nguyên nhân kỹ thuật nào cần kiểm tra?

<details>
<summary>Đáp án</summary>

Một job rơi vào trạng thái `pending` khi không có bất kỳ Runner khả dụng nào khớp với nhãn `tags` được yêu cầu hoặc tất cả Runner đều đã hết năng lực xử lý. Cụ thể có 3 nguyên nhân hàng đầu:
1. **Nhãn không khớp**: Trường `tags` của job yêu cầu nhãn định tuyến nhưng không có Runner nào đang trực tuyến mang nhãn đó.
2. **Quá tải năng lực**: Toàn bộ các Runner sẵn có đều đã đạt ngưỡng giới hạn xử lý đồng thời và đang bận chạy tác vụ khác.
3. **Quyền hạn dự án**: Runner riêng biệt chưa được kích hoạt/liên kết quyền phục vụ cho kho mã nguồn (dự án) hiện tại trong phần cài đặt quản trị.
</details>

### Câu Hỏi 11: Điều gì xảy ra mặc định khi một Job thất bại? Trong thực tế sản xuất, khi nào nên dùng `allow_failure: true` và khi nào không nên?

<details>
<summary>Đáp án</summary>

Mặc định, nếu một job thất bại mà không được gắn thuộc tính `allow_failure: true`, **toàn bộ stage chứa job đó bị đánh dấu thất bại và các stage tiếp theo trong pipeline sẽ bị dừng lại**.

Cách áp dụng trong thực tế sản xuất:
- **Nên thiết lập `allow_failure: true`**: Với các tác vụ kiểm tra phụ trợ không ảnh hưởng đến tính đúng đắn của bản dựng (như cảnh báo cú pháp, quét chính tả) để tránh làm gián đoạn chu trình phát hành.
- **Giữ nguyên mặc định (dừng ngay lập tức)**: Với các tác vụ kiểm thử hồi quy hoặc kiểm tra an ninh trọng yếu để bảo vệ chất lượng hệ thống.
</details>

### Câu Hỏi 12: Để tối thiểu hóa quyền hạn cho GitLab Runner trong môi trường sản xuất, cần áp dụng nguyên tắc thực hành nào?

<details>
<summary>Đáp án</summary>

Không phân quyền quản trị cao cho các Runner phục vụ nhánh kiểm thử của lập trình viên. Cần **tách bạch** rõ ràng giữa Runner dùng chung cho môi trường kiểm thử và Runner chuyên dụng có chứng chỉ triển khai cho môi trường sản xuất.
</details>
