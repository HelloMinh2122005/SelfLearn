# Ôn Tập: 6_6_9 Versioning and Release Management (Quản Lý Phiên Bản & Phát Hành)

### Câu Hỏi 1: Trong vận hành Kubernetes, Versioning và Release Management giúp giải quyết ba câu hỏi cốt lõi nào?

<details>
<summary>Đáp án</summary>

Quản lý phiên bản (versioning) và phát hành (release management) giải quyết ba bài toán thực tế ngoài production bằng cách gắn định danh rõ ràng, bất biến từ mã nguồn, container image đến gói Helm chart:
1. Bản đang chạy ngoài production thực chất là mã nguồn nào.
2. Nâng cấp lần này có làm hỏng hệ thống đang gọi API hay không (tính tương thích ngược).
3. Khi gặp sự cố thì quay lại (rollback) đúng trạng thái cũ bằng cách nào.
</details>

### Câu Hỏi 2: Theo đặc tả SemVer 2.0.0, một số phiên bản chuẩn có cấu trúc như thế nào và cần tuân thủ quy tắc định dạng nào?

<details>
<summary>Đáp án</summary>

Theo đặc tả SemVer 2.0.0, một số phiên bản chuẩn có dạng `MAJOR.MINOR.PATCH` gồm ba số nguyên không âm tăng dần và **không có số `0` đứng đầu** (ví dụ viết `1.4.2`, không viết `01.04.02`).
</details>

### Câu Hỏi 3: Ba thành phần `MAJOR`, `MINOR`, `PATCH` trong SemVer mang ý nghĩa gì và giúp ích ra sao trong CI/CD?

<details>
<summary>Đáp án</summary>

- **MAJOR** (số đầu tiên): tăng khi có thay đổi API hoặc hành vi **không tương thích ngược** với phiên bản cũ, buộc người dùng hoặc dịch vụ khác phải chỉnh sửa mới chạy tiếp được.
- **MINOR** (số thứ hai): tăng khi bổ sung tính năng mới nhưng vẫn **tương thích ngược hoàn toàn** với các phiên bản cùng `MAJOR`.
- **PATCH** (số thứ ba): tăng khi chỉ sửa lỗi (bug fix) theo cách **tương thích ngược**, không thêm tính năng mới hay phá vỡ API.

Trong CI/CD, quy ước này giúp pipeline và người vận hành tự động đánh giá rủi ro nâng cấp: bản `PATCH` có thể triển khai nhanh để vá lỗi, còn bản `MAJOR` cần thông báo và kiểm thử kỹ hơn với các bên liên quan.
</details>

### Câu Hỏi 4: Trong SemVer 2.0.0, nhãn `pre-release` và `build metadata` được viết như thế nào và khác nhau ra sao khi so sánh phiên bản?

<details>
<summary>Đáp án</summary>

- **Pre-release**: gắn sau dấu gạch ngang `-` (ví dụ `1.2.0-rc.1`) để đánh dấu phiên bản thử nghiệm, chưa chính thức.
- **Build metadata**: gắn sau dấu cộng `+` (ví dụ `1.2.0+20261121`) để lưu thông tin bổ sung về bản build; phần này **được bỏ qua khi so sánh độ mới cũ** của phiên bản.
</details>

### Câu Hỏi 5: Một ứng dụng triển khai bằng Helm lên Kubernetes có ba lớp định danh phiên bản tách biệt nào và mỗi lớp nằm ở đâu?

<details>
<summary>Đáp án</summary>

Ba lớp định danh phiên bản tách biệt gồm:
1. **Image tag / Image digest**: nằm trên Container Registry và trong `values.yaml`, dùng để định danh gói container image chứa mã thực thi.
2. **Helm chart `version`**: nằm ở trường `version` trong `Chart.yaml`, biểu thị phiên bản của chính gói đóng gói Helm chart (templates, `values.yaml`).
3. **Helm chart `appVersion`**: nằm ở trường `appVersion` trong `Chart.yaml`, mô tả phiên bản của ứng dụng chạy bên trong các Pod do chart tạo ra.
</details>

### Câu Hỏi 6: Sự khác biệt về tính bất biến giữa Image Tag và Image Digest (`@sha256:...`) là gì, và tại sao môi trường production nên dùng Image Digest?

<details>
<summary>Đáp án</summary>

- **Image Tag** (như `:1.2.0`, `:latest`, `:prod`) chỉ là một nhãn tham chiếu có thể bị push đè lên cùng tên tag đó trên registry.
- **Image Digest** (`@sha256:...`) là mã băm mật mã đại diện duy nhất cho nội dung manifest của image nên **bất biến tuyệt đối**, không thể bị thay đổi âm thầm.

Môi trường production nên chốt triển khai theo digest vì nếu dùng tag và ai đó (hoặc một job lỗi) ghi đè tag cũ, các node Kubernetes kéo lại image sẽ chạy hai phiên bản code khác nhau dưới cùng một tên tag.
</details>

### Câu Hỏi 7: Trong file `Chart.yaml` của Helm, trường `version` và `appVersion` khác nhau như thế nào về yêu cầu khai báo và định dạng?

<details>
<summary>Đáp án</summary>

- **`version`**: là trường **bắt buộc**, phải tuân theo chuẩn **SemVer 2**, và bất biến cho mỗi gói `.tgz` đẩy lên chart repository. Tên file gói sinh ra bởi `helm package` (ví dụ `hello-svc-0.4.0.tgz`) cũng đi theo trường `version` này.
- **`appVersion`**: là trường **tùy chọn**, chỉ mang tính mô tả thông tin phiên bản ứng dụng bên trong, **không bắt buộc** theo SemVer và nên đặt trong dấu ngoặc kép (ví dụ `"1.2.0"`) để bộ phân tích YAML không hiểu nhầm thành số thực.
</details>

### Câu Hỏi 8: Khi bạn chỉ chỉnh sửa file template Kubernetes trong Helm chart (ví dụ thêm `livenessProbe` hoặc chỉnh `resources`) mà mã nguồn ứng dụng không đổi, bạn cần cập nhật `Chart.yaml` như thế nào? Vì sao không nên ép `version` trùng `appVersion`?

<details>
<summary>Đáp án</summary>

Bạn chỉ cần tăng trường `version` của Helm chart (ví dụ từ `0.4.0` lên `0.4.1`) và **giữ nguyên** `appVersion` (ví dụ `"1.2.0"`), vì `version` và `appVersion` hoàn toàn độc lập với nhau.

Không nên ép hai trường này trùng nhau vì khi chỉ sửa template (như tăng `memory` request) mà không đổi code ứng dụng, bạn sẽ rơi vào thế kẹt: hoặc không đẩy được chart lên registry vì trùng số phiên bản cũ, hoặc phải tăng giả phiên bản ứng dụng dù code không hề thay đổi.
</details>

### Câu Hỏi 9: Biến môi trường `$CI_COMMIT_TAG` trong GitLab CI/CD hoạt động như thế nào khi chạy pipeline trên git tag so với trên branch hoặc merge request?

<details>
<summary>Đáp án</summary>

Khi pipeline được kích hoạt bởi thao tác push một git tag (ví dụ `git push origin v1.2.0`), GitLab tự động cung cấp biến môi trường định sẵn `CI_COMMIT_TAG` mang đúng tên tag đó. Ngược lại, biến này **không tồn tại (rỗng)** khi pipeline chạy trên nhánh (branch) hoặc merge request.
</details>

### Câu Hỏi 10: Tại sao cần cấu hình `rules` với regex (như `if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/`) cho job release, và điều gì xảy ra nếu quên lọc `$CI_COMMIT_TAG`?

<details>
<summary>Đáp án</summary>

- Việc kết hợp `rules: - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/` đảm bảo job phát hành chỉ chạy khi sự kiện xuất phát từ git tag khớp đúng định dạng SemVer có tiền tố `v`, tránh việc các tag thử nghiệm đặt tên tùy tiện vô tình phát hành ra production.
- Nếu **quên lọc `$CI_COMMIT_TAG`** trong `rules`, GitLab sẽ đưa job `release` vào chạy cả trên pipeline của nhánh `main` hoặc feature branch; khi đó biến `$CI_COMMIT_TAG` bị rỗng dẫn đến lệnh tạo release thất bại do thiếu `tag_name` hợp lệ.
</details>

### Câu Hỏi 11: Trong `.gitlab-ci.yml`, từ khóa `release` dùng để làm gì và một job khai báo `release:` cần đáp ứng những yêu cầu cấu hình nào?

<details>
<summary>Đáp án</summary>

Từ khóa `release` dùng để tự động tạo một đối tượng **GitLab Release** (lưu ở mục **Deploy › Releases**) gắn liền với git tag, hiển thị ghi chú phát hành và liên kết tải tài nguyên mỗi khi job chạy thành công.

Các yêu cầu cấu hình chính của một job có `release:`:
- **`tag_name`**: trường bắt buộc bên trong `release:` (thường gán bằng `$CI_COMMIT_TAG`).
- **`description`**: nội dung mô tả bản phát hành (chuỗi trực tiếp hoặc đường dẫn tới file markdown như `./RELEASE_NOTES.md`).
- **`assets: links:`** (tùy chọn): đính kèm liên kết tới container image hoặc gói Helm chart bằng `name`, `url` và tùy chọn `link_type` hoặc `filepath`.
- **Khối `script:` và `image`**: job vẫn **bắt buộc** có khối `script:` hợp lệ (dù chỉ là lệnh `echo`) và cần chạy trên image có công cụ CLI tạo release của GitLab (phổ biến là `registry.gitlab.com/gitlab-org/release-cli:latest`).
</details>

### Câu Hỏi 12: Quy ước Conventional Commits có định dạng như thế nào và ánh xạ sang SemVer (`PATCH`, `MINOR`, `MAJOR`) ra sao?

<details>
<summary>Đáp án</summary>

Conventional Commits yêu cầu thông điệp commit tuân theo mẫu `<type>[optional scope]: <description>` (ví dụ `feat(auth): add jwt login`). Quy ước này ánh xạ trực tiếp sang SemVer:
- **`fix:`** (sửa lỗi) → tăng **`PATCH`**.
- **`feat:`** (thêm tính năng mới) → tăng **`MINOR`**.
- **Breaking change** (thay đổi phá vỡ tương thích ngược, đánh dấu bằng dấu `!` ngay sau `type`/`scope` như `feat!: drop v1 endpoint` hoặc dòng `BREAKING CHANGE:` ở footer của commit) → tăng **`MAJOR`**.

Nếu một đợt phát hành có đồng thời `fix:`, `feat:` và `feat!:`, thay đổi phá vỡ tương thích ngược có mức ưu tiên cao nhất nên bắt buộc phải tăng `MAJOR` (và đặt `MINOR`, `PATCH` về `0`).
</details>

### Câu Hỏi 13: Lịch sử commit tuân thủ Conventional Commits hỗ trợ tự động hóa quá trình tạo Changelog và GitLab Release như thế nào?

<details>
<summary>Đáp án</summary>

Khi lịch sử commit theo chuẩn Conventional Commits, pipeline có thể dùng công cụ tự động (hoặc API sinh changelog tích hợp của GitLab, hay trích xuất `git log` giữa tag trước đó và `$CI_COMMIT_TAG`) để:
1. Gom nhóm các commit theo loại (`Features`, `Bug Fixes`, `Breaking Changes`).
2. Suy ra số phiên bản SemVer tiếp theo.
3. Xuất kết quả ra file markdown (như `CHANGELOG.md` hoặc `RELEASE_NOTES.md`) dưới dạng job artifact rồi truyền vào trường `release:description` của job `create_release`.
</details>

### Câu Hỏi 14: Vì sao tuyệt đối không được xóa và đẩy lại (force-push) một git tag đã phát hành, và tính năng Protected Tags trên GitLab giúp gì cho thực tiễn sản xuất?

<details>
<summary>Đáp án</summary>

- **Không xóa/force-push tag cũ**: Sửa đổi một git tag đã phát hành sẽ phá vỡ tính bất biến và làm lệch dữ liệu giữa GitLab Release, changelog và container image đang chạy. Nếu phát hiện lỗi sau khi đã phát hành (ví dụ `v1.2.0`), quy tắc chuẩn là giữ nguyên tag cũ, sửa lỗi và phát hành bản `PATCH` mới (`v1.2.1`).
- **Protected Tags**: Cho phép giới hạn quyền tạo hoặc xóa các tag khớp mẫu (ví dụ `v*`) chỉ dành cho vai trò phù hợp như Maintainer, giúp ngăn thao tác nhầm gây phát hành sản phẩm chưa kiểm duyệt và tránh lãng phí phút chạy CI runner cho các tag thử nghiệm.
</details>
