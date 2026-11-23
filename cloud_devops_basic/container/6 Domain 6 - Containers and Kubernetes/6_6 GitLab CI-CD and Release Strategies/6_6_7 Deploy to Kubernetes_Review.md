# Ôn Tập: 6_6_7 Deploy to Kubernetes

### Câu Hỏi 1: GitLab Agent for Kubernetes (`agentk`) hoạt động như thế nào và giải quyết vấn đề bảo mật mạng nào khi triển khai từ CI/CD?

<details>
<summary>Đáp án</summary>

`agentk` là một thành phần nhẹ chạy trực tiếp dưới dạng Pod bên trong cụm Kubernetes. Thay vì chờ GitLab từ bên ngoài gọi vào, `agentk` chủ động mở kết nối đi ra (**outbound connection**) tới **GitLab Agent Server (KAS)** trên máy chủ GitLab để nhận yêu cầu và chuyển tiếp lệnh tới Kubernetes API server nội bộ.

Nhờ cơ chế kết nối đi ra này, bạn không cần mở public IP hay cấu hình mở cổng tường lửa (inbound port) cho Kubernetes API server ra internet chỉ để phục vụ pipeline CI/CD.
</details>

### Câu Hỏi 2: Quy trình cài đặt và cấu hình một GitLab Agent mới gồm những bước chính nào?

<details>
<summary>Đáp án</summary>

Quy trình gồm hai phần chính:
1. **Cấu hình bằng mã nguồn trên GitLab**: Tạo file cấu hình chuẩn đặt tại đường dẫn `.gitlab/agents/<agent-name>/config.yaml` trong một project quản lý agent (ví dụ để khai báo `ci_access`).
2. **Đăng ký và cài đặt vào cụm**: Trên giao diện GitLab tại **Operate > Kubernetes clusters**, bạn đăng ký agent theo đúng tên đã cấu hình để lấy registration token, sau đó dùng Helm với chart `gitlab/gitlab-agent` (kèm token đó) để cài đặt `agentk` vào cụm Kubernetes.
</details>

### Câu Hỏi 3: Khối `ci_access` trong file `config.yaml` của agent dùng để làm gì?

<details>
<summary>Đáp án</summary>

Khối `ci_access` đóng vai trò như danh sách cấp phép cho đường ống CI/CD. Trong đó, bạn chỉ định chính xác những `projects` hoặc `groups` nào trên GitLab được phép mượn kết nối của agent để triển khai ứng dụng vào cụm Kubernetes. Khi Runner gửi lệnh qua KAS, KAS sẽ kiểm tra xem project của job có khớp với cấu hình `ci_access` của agent hay không.
</details>

### Câu Hỏi 4: Trong job CI/CD sử dụng `ci_access`, GitLab cung cấp thông tin kết nối cụm qua biến nào và job cần chạy lệnh gì trước khi deploy?

<details>
<summary>Đáp án</summary>

Khi một job thuộc project được cấp phép bắt đầu chạy, GitLab tự động tạo một file cấu hình tạm và gắn đường dẫn vào biến môi trường `KUBECONFIG` bên trong job. File này chứa sẵn các **context** cho mọi agent mà project được phép sử dụng.

Trước khi chạy `kubectl` hay `helm`, script trong job phải chọn đúng context theo mẫu:
`kubectl config use-context <path/to/agent-project>:<agent-name>`

Lưu ý thực tế:
- Lỗi phổ biến là chỉ truyền `<agent-name>` mà quên `<path/to/agent-project>`.
- GitLab chỉ cung cấp file `$KUBECONFIG`, nên container image của job vẫn phải cài sẵn các CLI như `kubectl` hoặc `helm`.
</details>

### Câu Hỏi 5: Vì sao phương thức Certificate-based cluster integration bị GitLab deprecate, và phương án dự phòng tạm thời khi chưa cài được `agentk` là gì?

<details>
<summary>Đáp án</summary>

**Certificate-based cluster integration** (nhập trực tiếp URL của Kubernetes API server, chứng chỉ CA và ServiceAccount token vào giao diện GitLab) bị **deprecate** vì hai lý do:
- Phải lưu credential dài hạn bên ngoài cụm.
- Buộc Kubernetes API server phải mở kết nối để GitLab và Runner gọi thẳng vào, làm tăng bề mặt tấn công.

Trong tình huống khẩn cấp hoặc môi trường thử nghiệm đặc thù chưa cài được `agentk`, phương án dự phòng là tạo một biến CI/CD kiểu `File` tên `KUBECONFIG` chứa cấu hình của một `ServiceAccount` chỉ có quyền hẹp trong một namespace. Tuy nhiên, cách này kém an toàn hơn vì vẫn lưu credential tĩnh trong GitLab và Runner vẫn cần đường mạng truy cập trực tiếp tới Kubernetes API server.
</details>

### Câu Hỏi 6: Từ khóa `environment` trong `.gitlab-ci.yml` có tác dụng gì, và hai thuộc tính cơ bản nhất của nó là gì?

<details>
<summary>Đáp án</summary>

Từ khóa `environment` giúp GitLab nhận biết một job đang triển khai ứng dụng lên một môi trường đích cụ thể (như `dev`, `staging`, `production`).

Hai thuộc tính cơ bản nhất là:
- `name`: Tên định danh của môi trường.
- `url`: Địa chỉ web của ứng dụng sau khi deploy, hiển thị thành nút truy cập nhanh trên giao diện GitLab (chẳng hạn trên Merge Request hoặc trang Environments).

Mọi lần triển khai có khai báo `environment` đều được ghi nhận tại **Operate > Environments**, hiển thị trạng thái hiện tại, lịch sử deploy và nút **Re-deploy** để chạy lại một bản triển khai cũ khi cần.
</details>

### Câu Hỏi 7: Các thuộc tính `deployment_tier`, `on_stop` và `auto_stop_in` trong khối `environment` dùng để làm gì?

<details>
<summary>Đáp án</summary>

- `deployment_tier`: Phân loại tầng môi trường chuẩn (`production`, `staging`, `testing`, `development`, `other`) tách biệt với tên tùy chỉnh ở `name` (ví dụ `name: prod-vn` nhưng `deployment_tier: production`).
- `on_stop`: Chỉ định tên job dọn dẹp sẽ chạy khi môi trường bị dừng (thủ công hoặc khi hết hạn), ví dụ `on_stop: stop_review`.
- `auto_stop_in`: Đặt khoảng thời gian tự động dừng môi trường tính từ lần triển khai thành công gần nhất (ví dụ `auto_stop_in: 1 week`).
</details>

### Câu Hỏi 8: Tính năng Protected environments giải quyết rủi ro gì cho môi trường `production`?

<details>
<summary>Đáp án</summary>

Nếu chỉ tách job deploy sang một stage riêng, bất kỳ lập trình viên nào có quyền kích hoạt pipeline trên nhánh đó vẫn có thể vô tình bấm chạy nhầm lên `production`. **Protected environments** cho phép khóa môi trường nhạy cảm này lại thông qua hai lớp kiểm soát:
1. Giới hạn chỉ định rõ những người dùng, nhóm hoặc vai trò nào được phép triển khai vào môi trường.
2. Hỗ trợ cơ chế **deployment approvals** (phê duyệt triển khai), yêu cầu đủ số lượng người có thẩm quyền bấm chấp thuận trước khi job deploy được phép thực thi.
</details>

### Câu Hỏi 9: Tại sao cần kết hợp `when: manual` trong `rules` với Protected environments khi triển khai lên `production`?

<details>
<summary>Đáp án</summary>

- Từ khóa `when: manual` trong khối `rules` (ví dụ chỉ xuất hiện khi có `$CI_COMMIT_TAG`) giúp biến job deploy thành một cổng chặn thủ công, tránh việc hệ thống tự động đẩy bản dựng lên `production` ngay khi pipeline chạy.
- Tuy nhiên, `when: manual` tự nó chưa giới hạn ai được quyền bấm nút chạy. Khi kết hợp với **Protected environments**, hệ thống vừa bắt buộc thao tác kích hoạt thủ công vừa kiểm soát chặt người được phép thực thi và yêu cầu đủ lượt phê duyệt hợp lệ.
</details>

### Câu Hỏi 10: Review Apps giải quyết vấn đề gì khi nhiều thành viên phát triển tính năng song song, và biến `$CI_COMMIT_REF_SLUG` đóng vai trò gì?

<details>
<summary>Đáp án</summary>

Khi nhiều thành viên phát triển song song mà dùng chung một môi trường `dev`, các bản dựng dễ ghi đè lẫn nhau trước khi code được review xong. **Review Apps** khắc phục bằng cách tự động dựng một môi trường xem trước riêng biệt cho từng Merge Request hoặc nhánh tính năng bằng tên môi trường động như `review/$CI_COMMIT_REF_SLUG`.

Biến `$CI_COMMIT_REF_SLUG` tự động chuyển tên nhánh (ví dụ `feat/Add-HealthCheck`) thành chuỗi chữ thường an toàn cho URL, tên namespace và tên Helm release (`feat-add-healthcheck`).
</details>

### Câu Hỏi 11: Job dọn dẹp Review App (`stop_review`) cần khai báo những gì để hoạt động đúng và tránh lãng phí tài nguyên cụm?

<details>
<summary>Đáp án</summary>

Nếu thiếu job dọn dẹp (`on_stop` và `auto_stop_in`), các namespace tạm thời của Review App sẽ tồn đọng sau khi Merge Request kết thúc và gây lãng phí tài nguyên cụm.

Để dọn dẹp đúng cách, job `stop_review` cần:
1. Khai báo trùng `environment: name` với job triển khai (`review/$CI_COMMIT_REF_SLUG`).
2. Đặt `action: stop` trong khối `environment` và `when: manual` trong `rules` để GitLab tự động gọi khi nhánh bị xóa, khi nhấn nút **Stop** hoặc khi hết thời gian `auto_stop_in`.
3. Nên đặt biến `GIT_STRATEGY: none` để Runner không cố clone lại mã nguồn từ một nhánh có thể đã bị xóa ngay sau khi Merge Request hoàn tất.
</details>

### Câu Hỏi 12: Cạm bẫy gì xảy ra nếu nhiều pipeline deploy chạy song song vào cùng một môi trường `production`, và cách phòng tránh trong `.gitlab-ci.yml` là gì?

<details>
<summary>Đáp án</summary>

Khi nhiều commit hoặc Git tag được đẩy sát nhau, hai pipeline có thể chạy job `deploy_prod` song song và đè lên nhau, gây xung đột Helm lock (lỗi `another operation is in progress`).

Cách phòng tránh là thêm thuộc tính `resource_group: production` vào job deploy để ép buộc tại một thời điểm chỉ có duy nhất một job được phép triển khai vào cùng một môi trường.
</details>
