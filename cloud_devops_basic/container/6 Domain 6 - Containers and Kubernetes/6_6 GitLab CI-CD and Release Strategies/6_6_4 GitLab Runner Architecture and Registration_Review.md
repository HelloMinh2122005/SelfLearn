# Ôn Tập: 6_6_4 GitLab Runner Architecture and Registration

### Câu Hỏi 1: Tại sao GitLab Server không trực tiếp chạy các lệnh biên dịch, kiểm thử trong pipeline mà phải tách biệt sang GitLab Runner?

<details>
<summary>Đáp án</summary>

Bản thân máy chủ giao diện web của GitLab đóng vai trò điều phối (Coordinator). Nếu máy chủ web trực tiếp chạy các tác vụ nặng như biên dịch, đóng gói hay kiểm thử từ mã nguồn tùy ý của người dùng, hệ thống sẽ nhanh chóng cạn kiệt tài nguyên và đối mặt với nguy cơ bảo mật nghiêm trọng.

Do đó, GitLab tách biệt phần điều phối khỏi phần thực thi bằng **GitLab Runner** — một ứng dụng mã nguồn mở độc lập viết bằng Go có nhiệm vụ nhận job từ GitLab Server, thực thi và gửi kết quả trả về.
</details>

---

### Câu Hỏi 2: GitLab Runner giao tiếp với GitLab Server theo cơ chế nào và tại sao cơ chế này không yêu cầu mở port inbound trên máy chủ runner?

<details>
<summary>Đáp án</summary>

GitLab Runner hoạt động theo mô hình kéo (**pull model / long polling**) thông qua HTTP/HTTPS API (`POST /api/v4/jobs/request`).

Chính tiến trình Runner Daemon là bên chủ động thiết lập kết nối chiều đi (outbound) định kỳ lên GitLab Server để hỏi xem có job mới hay không. Vì vậy, tường lửa và NAT tại mạng đặt runner không cần mở bất kỳ cổng chiều đến (inbound) nào từ ngoài Internet vào máy chủ runner.
</details>

---

### Câu Hỏi 3: Hãy mô tả các bước chính trong vòng đời thực thi một CI/CD job giữa GitLab Server, Runner Daemon và Docker Executor?

<details>
<summary>Đáp án</summary>

Luồng hoạt động diễn ra theo các bước sau:
1. Lập trình viên `git push` mã nguồn kèm file `.gitlab-ci.yml` lên GitLab Server.
2. GitLab Server phân tích pipeline và tạo các job ở trạng thái chờ chạy.
3. Runner Daemon định kỳ polling theo chu kỳ `check_interval` (`POST /api/v4/jobs/request` kèm authentication token) và nhận thông tin job cùng token tạm thời từ GitLab Server.
4. Runner Daemon yêu cầu Docker Executor chuẩn bị môi trường (`docker pull` image và `docker create` container).
5. Runner Daemon mount mã nguồn, thực thi các script (`before_script`, `script`) trong container và truyền streaming logs (`stdout`/`stderr`) trực tiếp về giao diện web của GitLab.
6. Khi script chạy xong (trả về exit code `0` hoặc khác `0`), Docker Executor dọn dẹp và xóa container, còn Runner Daemon cập nhật trạng thái job (`SUCCESS` hoặc `FAILED`) lên GitLab Server.
</details>

---

### Câu Hỏi 4: Trong hệ sinh thái GitLab, Runner được phân chia theo 3 phạm vi (Runner Scopes) nào và mục đích của từng loại là gì?

<details>
<summary>Đáp án</summary>

Runner được chia thành 3 phạm vi quản trị:
- **Instance Runner (Shared Runner)**: Do quản trị viên thiết lập, phục vụ chung cho tất cả các group và project trên toàn bộ GitLab instance.
- **Group Runner**: Gán ở cấp Group, tự động có sẵn để thực thi job cho mọi project và subgroup trực thuộc group đó.
- **Project Runner**: Tạo riêng và gắn cố định với một project cụ thể, giúp ngăn chặn rò rỉ môi trường hoặc mã nguồn giữa các dự án khác nhau.
</details>

---

### Câu Hỏi 5: Sự khác biệt giữa SaaS Runners và Self-managed Runners là gì?

<details>
<summary>Đáp án</summary>

- **SaaS Runners**: Là các runner do GitLab.com cung cấp sẵn, chạy trên hệ thống máy ảo tự động co giãn do GitLab quản lý.
- **Self-managed Runners**: Là các runner do người dùng tự cài đặt và tự quản lý tài nguyên trên máy chủ riêng hoặc cụm Kubernetes của mình.
</details>

---

### Câu Hỏi 6: Executor trong GitLab Runner là gì? Shell Executor hoạt động như thế nào và cần lưu ý gì về trạng thái cũng như khả năng cách ly của nó?

<details>
<summary>Đáp án</summary>

**Executor** là thành phần của Runner quyết định môi trường mà kịch bản của job sẽ thực sự chạy.

**Shell Executor** thực thi script trực tiếp trên hệ điều hành của máy host bằng tài khoản người dùng của runner daemon. Hai điểm quan trọng cần lưu ý:
- Hiện đang ở trạng thái **maintenance mode** (chỉ nhận các bản vá bảo mật nghiêm trọng — critical security updates).
- Chỉ cung cấp khả năng cách ly hạn chế (limited isolation) giữa các lần chạy job vì các job dùng chung môi trường trên máy host.
</details>

---

### Câu Hỏi 7: So sánh Shell Executor, Docker Executor và Kubernetes Executor theo các tiêu chí: mức độ cách ly, tốc độ khởi động, quản lý công cụ và khả năng mở rộng?

<details>
<summary>Đáp án</summary>

- **Mức độ cách ly**: Shell Executor ở mức thấp (dùng chung host); Docker Executor ở mức cao (mỗi job chạy trong một container mới độc lập và được dọn sạch sau khi xong); Kubernetes Executor ở mức rất cao (mỗi job chạy trong một Pod độc lập chứa container ứng dụng và các service container).
- **Tốc độ khởi động**: Shell Executor khởi động tức thì; Docker Executor khởi động nhanh; Kubernetes Executor phụ thuộc vào quá trình lập lịch của cluster (cluster scheduling).
- **Quản lý công cụ**: Shell Executor phải cài đặt công cụ thủ công trên máy host; Docker Executor và Kubernetes Executor đóng gói sẵn công cụ bên trong container image.
- **Khả năng mở rộng**: Shell Executor và Docker Executor bị giới hạn theo tài nguyên của máy host; Kubernetes Executor tự động mở rộng theo cluster.
</details>

---

### Câu Hỏi 8: Từ phiên bản GitLab 16.0, luồng đăng ký Runner mới (Runner Authentication Token Workflow) hoạt động khác gì so với luồng legacy registration token cũ?

<details>
<summary>Đáp án</summary>

Từ GitLab 16.0, GitLab tiến hành deprecate luồng `legacy registration token` cũ và chuyển sang luồng đăng ký mới:
- Người quản trị tạo runner trước ngay trong giao diện UI hoặc qua API để nhận một **runner authentication token** có tiền tố `glrt-`.
- Sau đó mới dùng token định danh này để đăng ký trên máy chủ chạy runner, thay vì dùng registration token dùng chung cũ để tự tạo cấu hình runner từ phía client.
</details>

---

### Câu Hỏi 9: Khi chạy lệnh `gitlab-runner register` theo luồng xác thực mới, những tham số nào vẫn truyền ở dòng lệnh cục bộ và những cờ nào đã bị loại bỏ?

<details>
<summary>Đáp án</summary>

Theo luồng xác thực mới, lệnh `gitlab-runner register` vẫn nhận các tham số cấu hình cục bộ như `--non-interactive`, `--url`, `--token` (với giá trị `glrt-...`), `--executor`, `--docker-image`, `--description`.

Lệnh này **loại bỏ** cờ `--registration-token` cũ và các cờ metadata như `--tag-list`, `--run-untagged` vì các thông tin metadata đó đã được chuyển lên cấu hình trực tiếp qua UI/API của GitLab.

Ví dụ lệnh đăng ký:
```bash
sudo gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com" \
  --token "glrt-t1_abcdef1234567890" \
  --executor "docker" \
  --docker-image "alpine:3.20" \
  --description "local-docker-runner"
```
</details>

---

### Câu Hỏi 10: Cơ chế định tuyến job bằng `tags` trong `.gitlab-ci.yml` hoạt động như thế nào? Nếu một Runner có nhiều tag hơn danh sách tag mà job yêu cầu thì Runner đó có nhận job không?

<details>
<summary>Đáp án</summary>

Từ khóa `tags` trong `.gitlab-ci.yml` chỉ định danh sách các tag mà job yêu cầu để chọn đúng runner thực thi. Mặc định, một runner có gắn tag sẽ nhận job nếu runner đó sở hữu **toàn bộ** các tag được khai báo trong job.

**Có** — runner vẫn có thể nhận job nếu nó có thêm các tag khác ngoài danh sách tag của job, miễn là tập tag của runner bao gồm đầy đủ mọi tag mà job yêu cầu. Ngược lại, nếu không có runner nào trực tuyến có đủ các tag đó, job sẽ bị giữ ở trạng thái chờ (pending).
</details>

---

### Câu Hỏi 11: File cấu hình chính của GitLab Runner nằm ở đâu, và hai tham số toàn cục `concurrent` cùng `check_interval` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

File cấu hình nằm tại `/etc/gitlab-runner/config.toml`. Hai tham số toàn cục quan trọng gồm:
- `concurrent`: Quy định số lượng job tối đa mà **toàn bộ** các runner khai báo trên máy chủ đó có thể thực thi đồng thời tại một thời điểm.
- `check_interval`: Xác định khoảng thời gian chờ (tính bằng giây) giữa các lần runner gửi request lên GitLab Server để kiểm tra xem có job mới hay không; giá trị mặc định là `3` giây.
</details>

---

### Câu Hỏi 12: Trong phần cấu hình `[runners.docker]` của file `config.toml`, các tham số `image`, `privileged` và `volumes` dùng để làm gì?

<details>
<summary>Đáp án</summary>

- `image`: Thiết lập Docker image mặc định sẽ được sử dụng nếu job trong `.gitlab-ci.yml` không tự khai báo `image`.
- `privileged`: Khi đặt `privileged = true`, container chạy job được cấp toàn bộ đặc quyền kernel của máy chủ host (mặc định an toàn là `false`).
- `volumes`: Cho phép mount các thư mục hoặc socket từ máy host vào bên trong container của job, ví dụ `"/cache"` để lưu cache hoặc `"/var/run/docker.sock:/var/run/docker.sock"`.
</details>

---

### Câu Hỏi 13: Làm thế nào để một self-managed runner cài trên máy cục bộ cho phép job CI tương tác với cụm Kubernetes `kind` đang chạy ở local?

<details>
<summary>Đáp án</summary>

Job CI chạy trên self-managed runner cục bộ có thể truy cập cụm `kind` thông qua file `kubeconfig` hoặc qua mạng nội bộ Docker kết nối tới API server của `kind`.

Cụ thể, ta lấy địa chỉ IP của container `kind-control-plane` trong mạng Docker (bằng `docker inspect`), trích xuất cấu hình `kubeconfig` (bằng `kubectl config view --raw --minify --flatten`), rồi thay thế địa chỉ `127.0.0.1:<port>` bằng `https://${KIND_IP}:6443` để container của job có thể gọi tới API server của cụm `kind` (ví dụ chạy `kubectl cluster-info` hay `kubectl get nodes -o wide`).
</details>

---

### Câu Hỏi 14: Tại sao việc cấu hình `privileged = true` trong Docker Executor lại tiềm ẩn rủi ro bảo mật nghiêm trọng và thực hành tốt nhất để hạn chế rủi ro này là gì?

<details>
<summary>Đáp án</summary>

Khi bật `privileged = true`, container của job có quyền truy cập root trên máy host, làm phát sinh nguy cơ thoát khỏi container (**container breakout**) và cho phép mã nguồn không tin cậy xâm nhập, chiếm quyền kiểm soát toàn bộ hệ điều hành máy chủ.

**Thực hành tốt nhất**: Chỉ kích hoạt chế độ đặc quyền trên các **Project Runner riêng biệt** phục vụ cho các dự án hạ tầng tin cậy, tuyệt đối tránh bật cho runner dùng chung với mã nguồn không tin cậy.
</details>

---

### Câu Hỏi 15: Trong vận hành thực tế, thiết lập `concurrent` quá cao hoặc sử dụng Shell Executor cho môi trường đa dự án gây ra những vấn đề gì?

<details>
<summary>Đáp án</summary>

- **Với `concurrent` quá mức**: Nếu giá trị `concurrent` vượt quá ngưỡng chịu tải của CPU và RAM trên máy chủ, hệ điều hành sẽ kích hoạt cơ chế dừng tiến trình đột ngột. Cần tính toán thông số đồng thời dựa trên dung lượng bộ nhớ tối đa mà một job biên dịch tiêu thụ.
- **Với Shell Executor trong môi trường đa dự án**: Vì Shell Executor không có ranh giới cách ly tiến trình và hệ thống tệp giữa các lần chạy job của các dự án khác nhau, nó dễ gây xung đột công cụ, rò rỉ môi trường hoặc dữ liệu. Do đó, cần ưu tiên dùng **Docker Executor** hoặc **Kubernetes Executor** để mỗi job có không gian làm việc độc lập và an toàn.
</details>
