# Ôn Tập: 6_6_5 Building and Pushing Container Images in CI

### Câu Hỏi 1: Ba phương pháp build container image phổ biến trong GitLab CI/CD là gì và điểm khác biệt cốt lõi về kiến trúc của chúng?

<details>
<summary>Đáp án</summary>

Có ba phương pháp tiếp cận chính để build image trong môi trường container runner:

1. **Docker-in-Docker (DinD)**: Khởi chạy một Docker daemon độc lập bên trong container dịch vụ phụ (`services: docker:dind`). Job container đóng vai trò là Docker client giao tiếp với daemon phụ này qua mạng nội bộ.
2. **Docker Socket Binding**: Gắn trực tiếp file socket `/var/run/docker.sock` từ máy chủ host vào job container qua volume mount để dùng chung Docker daemon của máy chủ host, không cần service phụ.
3. **Daemonless Build (Buildah / Rootless BuildKit)**: Loại bỏ hoàn toàn tiến trình daemon chạy ngầm; sử dụng công cụ CLI độc lập hoạt động trực tiếp trong Linux user namespace ở chế độ rootless để xây dựng và đẩy OCI image.
</details>

### Câu Hỏi 2: Tại sao Docker-in-Docker (DinD) yêu cầu bật `privileged = true` trong `config.toml` của GitLab Runner và điều này gây ra rủi ro gì?

<details>
<summary>Đáp án</summary>

Để Docker daemon con chạy bên trong container dịch vụ `docker:dind` có thể quản lý được overlay filesystem và cgroup, GitLab Runner bắt buộc phải bật cờ đặc quyền `privileged = true` trong file cấu hình `config.toml`.

Rủi ro bảo mật nghiêm trọng của chế độ này là `privileged = true` cấp toàn bộ quyền truy cập thiết bị máy chủ cho container. Nếu mã lệnh trong job bị chiếm quyền, kẻ tấn công có thể thực hiện thoát container (container breakout) để kiểm soát máy chủ host. Vì vậy, không nên bật `privileged = true` trên các Shared Runner dùng chung giữa nhiều dự án.
</details>

### Câu Hỏi 3: Từ phiên bản Docker 19.03, DinD yêu cầu cấu hình TLS như thế nào và lỗi gì xảy ra nếu quên khai báo `DOCKER_TLS_CERTDIR`?

<details>
<summary>Đáp án</summary>

Từ phiên bản Docker 19.03, DinD mặc định bật chứng chỉ bảo mật TLS với biến `DOCKER_TLS_CERTDIR="/certs"`, yêu cầu có volume chia sẻ thư mục chứng chỉ giữa job container và service `docker:dind`.

Nếu quên khai báo `DOCKER_TLS_CERTDIR: "/certs"`, Docker client bên trong job container sẽ cố gắng kết nối tới daemon qua cổng TCP 2375 không mã hóa và gặp lỗi mất kết nối với Docker daemon.
</details>

### Câu Hỏi 4: Vì sao phương pháp Docker Socket Binding (`/var/run/docker.sock`) lại có mức độ rủi ro bảo mật và vận hành rất cao?

<details>
<summary>Đáp án</summary>

Việc gắn `/var/run/docker.sock` vào job container khiến tiến trình trong job giao tiếp trực tiếp với Docker daemon của máy chủ host, trao toàn quyền điều khiển daemon tương đương quyền root trên máy chủ host.

Ngoài rủi ro an ninh nghiêm trọng, việc dùng chung Docker daemon của host giữa nhiều job chạy đồng thời còn dẫn đến tình trạng dùng chung cache dễ gây ô nhiễm và nguy cơ xung đột tên container hoặc cổng mạng. Do đó, phương pháp này chỉ nên dùng cho thử nghiệm cá nhân cục bộ.
</details>

### Câu Hỏi 5: Cơ chế hoạt động của Buildah là gì và tại sao nó là lựa chọn khuyến nghị cho CI/CD và Shared Runner?

<details>
<summary>Đáp án</summary>

Buildah là công cụ mã nguồn mở cho phép xây dựng và đẩy OCI container image độc lập mà không cần bất kỳ Docker daemon chạy ngầm nào (mô hình daemonless). Buildah hoạt động hoàn toàn trong user namespace của Linux ở chế độ rootless.

Nhờ cơ chế này, Buildah không đòi hỏi quyền root thực sự của máy chủ host hay cờ đặc quyền `privileged = true` trên GitLab Runner, mang lại mức độ cô lập an ninh rất cao và hỗ trợ cache linh hoạt từ OCI registry từ xa. Đây là giải pháp được khuyến nghị cho pipeline CI/CD, Kubernetes runner và Shared Runner.
</details>

### Câu Hỏi 6: Tình trạng bảo trì hiện tại của Kaniko ra sao và khuyến nghị cho các dự án CI/CD mới là gì?

<details>
<summary>Đáp án</summary>

Kaniko từng phổ biến để build image không cần daemon trên Kubernetes, nhưng vào năm 2025, kho mã nguồn chính thức `GoogleContainerTools/kaniko` đã được Google chuyển sang trạng thái lưu trữ (archive / read-only).

Khi bị archive, Kaniko không còn nhận được bản vá bảo mật hay tính năng mới từ đội ngũ phát triển gốc. Vì vậy, tài liệu CI/CD hiện đại khuyến nghị không khởi tạo dự án mới với Kaniko mà ưu tiên chuyển sang dùng Buildah hoặc rootless BuildKit để đảm bảo khả năng bảo trì lâu dài.
</details>

### Câu Hỏi 7: GitLab CI cung cấp những biến môi trường nào để xác thực với GitLab Container Registry, và tại sao nên dùng tùy chọn `--password-stdin` khi đăng nhập?

<details>
<summary>Đáp án</summary>

GitLab CI tự động cung cấp các biến định sẵn trong job để đăng nhập vào GitLab Container Registry tích hợp sẵn:
- `CI_REGISTRY`: Địa chỉ registry.
- `CI_REGISTRY_USER`: Tên người dùng xác thực.
- `CI_REGISTRY_PASSWORD`: Chứa token bảo mật `CI_JOB_TOKEN` có hiệu lực trong vòng đời của job.

Nên truyền mật khẩu qua standard input bằng `--password-stdin` (ví dụ `echo "$CI_REGISTRY_PASSWORD" | buildah login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"` hoặc với `docker login`) để tránh làm lộ thông tin mật khẩu/token trong danh sách tiến trình hệ thống.
</details>

### Câu Hỏi 8: Sự khác nhau giữa Image Tag và Image Digest là gì? Tại sao nên triển khai lên Production bằng Image Digest thay vì Tag như `latest` hay `v1.2.0`?

<details>
<summary>Đáp án</summary>

- **Image Tag (Mutable)**: Là con trỏ có thể thay đổi tham chiếu đến image manifest. Tag như `latest` hoặc `v1.0.0` có thể bị ghi đè sang một image khác qua các lần build.
- **Image Digest (Immutable)**: Là mã băm mật mã học SHA-256 (`@sha256:...`) đại diện duy nhất cho nội dung manifest và các layer; nếu nội dung image thay đổi dù chỉ một bit, mã digest sẽ thay đổi.

Nếu triển khai Production bằng tag, hệ thống dễ bị trôi phiên bản giữa các môi trường khi tag bị ghi đè trên registry. Đặc biệt khi gặp sự cố và rollback, Kubernetes có thể tiếp tục kéo phải image lỗi nếu tag cũ đã bị trỏ sang nội dung mới. Triển khai bằng Image Digest đảm bảo tính bất biến tuyệt đối ("Build Once, Deploy Many").
</details>

### Câu Hỏi 9: Chiến lược gắn nhãn (tagging) chuẩn mực trong GitLab CI cho nhánh phát triển và khi phát hành phiên bản là gì?

<details>
<summary>Đáp án</summary>

Chiến lược gắn nhãn chuẩn mực trong GitLab CI gồm 3 bước:
1. Mọi commit trên nhánh phát triển đều được gắn tag định danh ngắn từ biến `CI_COMMIT_SHORT_SHA` để phục vụ kiểm thử và truy vết mã nguồn.
2. Khi phát hành qua git tag, gắn bổ sung nhãn phiên bản SemVer lấy từ biến `CI_COMMIT_TAG`.
3. Job build sau khi đẩy image lên registry phải trích xuất mã SHA-256 digest để sử dụng cho việc triển khai chính thức.
</details>

### Câu Hỏi 10: Làm thế nào để trích xuất Image Digest sau khi push và truyền sang job deploy downstream trong GitLab CI? Cần lưu ý bảo mật gì với cơ chế này?

<details>
<summary>Đáp án</summary>

**Cách trích xuất và truyền Digest**:
- Khi dùng Buildah, thêm cờ `--digestfile digest.txt` vào lệnh `buildah push` để xuất chuỗi SHA-256 digest ra file (với DinD có thể dùng `docker inspect --format='{{index .RepoDigests 0}}' ... | cut -d'@' -f2`).
- Ghi giá trị digest dưới dạng key-value vào file `.env` (ví dụ `echo "IMAGE_DIGEST=$DIGEST" >> build.env`).
- Khai báo `artifacts:reports:dotenv: build.env` trong job build để GitLab CI tự động đọc các cặp key-value và nạp thành biến môi trường cho job downstream (như job deploy dùng `helm upgrade --set image.digest="$IMAGE_DIGEST"`).

**Lưu ý bảo mật**: File trong `artifacts:reports:dotenv` được lưu trữ như artifact thông thường và hiển thị cho người có quyền xem job. Vì vậy, chỉ ghi thông tin định danh không nhạy cảm như `IMAGE_DIGEST` hay `IMAGE_REF`; tuyệt đối không ghi mật khẩu cơ sở dữ liệu hay API token vào file này mà phải dùng GitLab CI Variables hoặc Vault.
</details>

### Câu Hỏi 11: Vì sao các job CI trên runner thường bị mất build cache cục bộ, và làm thế nào để tối ưu hóa build cache giữa các job độc lập mà không làm tràn ổ đĩa?

<details>
<summary>Đáp án</summary>

Các container runner có tính chất tạm thời (ephemeral), mọi dữ liệu cục bộ bên trong container sẽ bị xóa ngay sau khi job kết thúc (đặc biệt với DinD).

Để tối ưu hóa build cache giữa các job độc lập:
- Sử dụng tùy chọn `--cache-from` (ví dụ `--cache-from "$IMAGE_NAME:latest"` kết hợp `--layers` trong `buildah bud`) hoặc inline cache (`--build-arg BUILDKIT_INLINE_CACHE=1`) để tải các layer đã build trước đó từ container registry từ xa về làm bộ đệm.
- Tránh phụ thuộc hoàn toàn vào cache cục bộ trên self-managed runner mà không có cơ chế dọn dẹp vì tích tụ layer cũ sẽ gây lỗi hết dung lượng ổ đĩa; nên cấu hình dọn dẹp định kỳ cho máy chủ runner và ưu tiên cache phân tán từ container registry.
</details>
