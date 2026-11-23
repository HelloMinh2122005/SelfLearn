# Ôn Tập: 6_6_3 Variables and Secrets Management

### Câu Hỏi 1: Nguyên tắc cốt lõi khi quản trị cấu hình và secret trong CI/CD là gì, và hệ thống biến của GitLab CI/CD gồm những trụ cột nào?

<details>
<summary>Đáp án</summary>

- **Nguyên tắc cốt lõi**: Phân tách hoàn toàn giữa mã nguồn logic và dữ liệu cấu hình hoặc thông tin bí mật. Không được lưu cứng mật khẩu, private key hoặc token truy cập vào kho mã nguồn vì tiềm ẩn nguy cơ bảo mật nghiêm trọng.
- **Ba trụ cột của hệ thống biến GitLab CI/CD**:
  1. **Biến định sẵn (Predefined Variables)** do hệ thống tự động cung cấp.
  2. **Biến cấu hình tùy chỉnh** ở cấp Project và Group với các cơ chế bảo vệ nghiêm ngặt (như Protected, Masked, File, Environment Scope).
  3. **Xác thực danh tính hiện đại qua chuẩn OpenID Connect (OIDC)** thông qua từ khóa `id_tokens`.
</details>

---

### Câu Hỏi 2: Các biến định sẵn (Predefined Variables) về ngữ cảnh commit và nhánh như `CI_COMMIT_SHA`, `CI_COMMIT_SHORT_SHA`, `CI_COMMIT_REF_SLUG`, `CI_COMMIT_TAG`, và `CI_DEFAULT_BRANCH` có ý nghĩa và công dụng gì?

<details>
<summary>Đáp án</summary>

Khi pipeline khởi chạy, GitLab Runner tự động nạp các biến định sẵn mà không cần khai báo trong file cấu hình:
- **`CI_COMMIT_SHA`**: Chứa mã hash SHA đầy đủ gồm 40 ký tự của commit kích hoạt pipeline.
- **`CI_COMMIT_SHORT_SHA`**: Chứa 8 ký tự đầu tiên của commit hash, rất phù hợp để làm tag định danh duy nhất cho container image.
- **`CI_COMMIT_REF_SLUG`**: Tên nhánh hoặc tag được rút gọn ở dạng chữ thường, tối đa 63 ký tự, chỉ gồm chữ, số và dấu gạch ngang (`-`), an toàn khi dùng làm tên DNS, URL hoặc tên tài nguyên container.
- **`CI_COMMIT_TAG`**: Tên của git tag kích hoạt pipeline; biến này **chỉ tồn tại** trong tag pipeline và hoàn toàn vắng mặt trong pipeline chạy trên nhánh thông thường.
- **`CI_DEFAULT_BRANCH`**: Tên nhánh mặc định của dự án (thường là `main` hoặc `master`), giúp thiết lập điều kiện rẽ nhánh logic tự động (ví dụ: chỉ deploy production khi chạy trên nhánh mặc định).
</details>

---

### Câu Hỏi 3: Các biến định sẵn liên quan đến Container Registry, xác thực và thư mục thực thi (`CI_REGISTRY`, `CI_REGISTRY_IMAGE`, `CI_REGISTRY_USER`, `CI_REGISTRY_PASSWORD`, `CI_JOB_TOKEN`, `CI_ENVIRONMENT_NAME`, `CI_PROJECT_DIR`) hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **`CI_REGISTRY` và `CI_REGISTRY_IMAGE`**: `CI_REGISTRY` là địa chỉ FQDN của GitLab Container Registry, còn `CI_REGISTRY_IMAGE` là đường dẫn gốc kho image của dự án hiện tại.
- **`CI_REGISTRY_USER` và `CI_REGISTRY_PASSWORD`**: Được cung cấp sẵn để đăng nhập vào registry (ví dụ dùng trong lệnh `docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"`).
- **`CI_JOB_TOKEN`**: Là token ngắn hạn sinh tự động cho từng job, có vòng đời gắn liền với thời gian thực thi của job; giá trị của token này được nạp mặc định vào `CI_REGISTRY_PASSWORD` để tương tác an toàn với API và Registry của GitLab.
- **`CI_ENVIRONMENT_NAME`**: Chứa tên môi trường đích được chỉ định trong job.
- **`CI_PROJECT_DIR`**: Đường dẫn tuyệt đối trên runner nơi mã nguồn repository được clone vào và job thực thi câu lệnh.
</details>

---

### Câu Hỏi 4: Thuộc tính **Protected** của biến CI/CD hoạt động như thế nào và vì sao biến có thể bị rỗng khi chạy trên nhánh tính năng (feature branch)?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Biến được đánh dấu **Protected** trong **Settings > CI/CD > Variables** chỉ được GitLab Runner nạp vào môi trường thực thi của những pipeline chạy trên **nhánh được bảo vệ (protected branch)** hoặc **tag được bảo vệ (protected tag)**.
- **Mục đích**: Ngăn chặn rò rỉ secret sang các nhánh phát triển thông thường.
- **Nguyên nhân lỗi trên feature branch**: Khi pipeline chạy trên một nhánh không thuộc danh sách protected branches (ví dụ `feature/checkout-service`), runner sẽ từ chối nạp biến Protected, khiến giá trị biến bị rỗng và gây lỗi xác thực.
- **Cách xử lý**: Tùy chính sách bảo mật, có thể thêm nhánh vào danh sách protected branches, hoặc tối ưu hơn là tắt Protected cho biến môi trường trung gian (như staging) và dùng **Environment Scope** để cô lập phạm vi sử dụng.
</details>

---

### Câu Hỏi 5: Thuộc tính **Masked** hoạt động ra sao và giá trị của biến phải đáp ứng những điều kiện kỹ thuật nào để được masked?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Biến bật thuộc tính **Masked** sẽ được GitLab Runner tự động lọc và thay thế giá trị bằng chuỗi `[MASKED]` mỗi khi xuất hiện trong console log của job.
- **Điều kiện kỹ thuật bắt buộc để được Masked**:
  1. Giá trị biến phải nằm trên **một dòng đơn** (single line).
  2. **Không chứa bất kỳ khoảng trắng nào** (no spaces).
  3. Có độ dài **từ 8 ký tự trở lên**.
</details>

---

### Câu Hỏi 6: Tại sao một biến đã bật tính năng **Masked** vẫn có thể bị lộ ra console log trong thực tế?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: GitLab Runner chỉ thực hiện so khớp đúng **chuỗi thô nguyên bản** của biến để thay thế bằng `[MASKED]`.
- Nếu secret bị biến đổi trước khi in ra màn hình bằng các lệnh như `echo` hoặc `print` — chẳng hạn bị **mã hóa dạng base64** hoặc bị **cắt chuỗi con** — thì chuỗi đầu ra không còn khớp với giá trị gốc nữa, khiến runner không thể che chắn và secret bị lộ hoàn toàn trên log.
- **Thực tiễn tốt nhất**: Tuyệt đối không bao giờ dùng lệnh in trực tiếp các biến bí mật ra màn hình console log.
</details>

---

### Câu Hỏi 7: Kiểu biến **File** (File Type Variable) khác gì so với kiểu `Variable` thông thường và phù hợp với loại dữ liệu nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Khi cấu hình biến với **Type: File**, GitLab Runner không gán trực tiếp nội dung biến vào biến môi trường shell. Thay vào đó, runner tự động ghi nội dung đó ra một **file tạm trên ổ đĩa của runner** (ví dụ: `/builds/group/project.tmp/PROD_CERT`), rồi gán **đường dẫn tuyệt đối của file tạm đó** vào tên biến.
- **Trường hợp phù hợp**: Rất phù hợp cho các chứng chỉ số nhiều dòng (như SSL PEM) hoặc file cấu hình (như `$KUBECONFIG`). Trong `script`, các công cụ CLI có thể nhận trực tiếp đường dẫn qua biến (ví dụ `deploy-tool --cert-file "$SSL_CLIENT_CERT"`) mà không cần dùng lệnh thủ công `echo "$CERT" > cert.pem` vốn dễ lỗi xuống dòng và lộ dữ liệu.
</details>

---

### Câu Hỏi 8: **Environment Scope** dùng để làm gì và tại sao nên sử dụng kết hợp với biến dự án?

<details>
<summary>Đáp án</summary>

- **Chức năng**: **Environment Scope** giới hạn sự tồn tại của một biến chỉ trong các job có khai báo `environment` khớp chính xác với phạm vi được cấu hình hoặc khớp mẫu ký tự đại diện wildcard (ví dụ `staging`, `production`, `review/*`).
- **Lý do sử dụng**: Giúp phân tách rõ ràng các biến giữa môi trường kiểm thử/staging và môi trường production, đảm bảo biến đúng môi trường mới được nạp vào job, tránh việc chỉ phụ thuộc vào thuộc tính Protected vốn khiến các nhánh phát triển thông thường không truy cập được biến staging.
</details>

---

### Câu Hỏi 9: Quy tắc tổng quát và thứ tự ưu tiên phân giải biến (Variable Precedence Hierarchy) từ cao đến thấp trong GitLab CI/CD là gì?

<details>
<summary>Đáp án</summary>

- **Quy tắc tổng quát**: Giá trị truyền vào tại thời điểm kích hoạt ghi đè cấu hình tĩnh, và phạm vi hẹp ghi đè phạm vi rộng.
- **Thứ tự ưu tiên từ cao nhất đến thấp nhất (1 → 6)**:
  1. Biến từ Trigger token, API request, hoặc chạy thủ công từ giao diện Web (ưu tiên cao nhất).
  2. Biến cấp **Project** (cấu hình trong Settings > CI/CD > Variables của dự án).
  3. Biến cấp **Group** (kế thừa từ các nhóm và phân nhóm cha).
  4. Biến cấp **Instance** (cấu hình toàn hệ thống do quản trị viên đặt).
  5. Biến định nghĩa ở cấp **job** trong file cấu hình pipeline (`.gitlab-ci.yml`).
  6. Biến định nghĩa ở cấp **root** trong file cấu hình pipeline (ưu tiên thấp nhất).
</details>

---

### Câu Hỏi 10: Cơ chế xác thực phi mật khẩu qua OIDC `id_tokens` hoạt động theo luồng nào và giải quyết được những nhược điểm gì của static secret?

<details>
<summary>Đáp án</summary>

- **Luồng hoạt động OIDC**:
  1. Runner yêu cầu GitLab Server (đóng vai trò OIDC Identity Provider) cấp token OIDC cho job thông qua khai báo `id_tokens`.
  2. GitLab cấp một **JSON Web Token (JWT)** có chữ ký số.
  3. Runner gửi JWT đó tới Cloud Provider (như AWS, GCP, Azure) hoặc Vault để đổi quyền truy cập tạm thời (ví dụ lệnh `aws sts assume-role-with-web-identity`).
  4. Cloud Provider xác thực chữ ký số, kiểm tra các claims trong JWT và cấp **temporary credentials ngắn hạn** cho runner thực thi lệnh deploy.
- **Lợi ích vượt trội so với Static Secrets**:
  - **Không lưu khóa tĩnh (Keyless)**: Loại bỏ rủi ro lộ khóa có hiệu lực vĩnh viễn qua log, artifact hay sao chép trái phép.
  - **Thời gian sống ngắn (Short-lived)**: Credentials chỉ có hiệu lực tạm thời trong phiên làm việc (ví dụ 900 giây / 15 phút), đồng thời xóa bỏ gánh nặng xoay vòng khóa (key rotation) định kỳ.
</details>

---

### Câu Hỏi 11: Trong xác thực OIDC `id_tokens`, các claim chuẩn và claim mở rộng của JWT đóng vai trò gì trong việc đảm bảo nguyên tắc Least Privilege?

<details>
<summary>Đáp án</summary>

- GitLab ký số JWT chứa các **claim chuẩn** như `iss`, `sub`, `aud` (ví dụ `aud: "sts.amazonaws.com"`) cùng các **claim mở rộng** như `project_path` và `ref_type`.
- Nhà cung cấp đám mây dựa vào các claim này để đối chiếu danh tính và cấp quyền chi tiết theo đúng nguyên tắc **Least Privilege** — ví dụ: chỉ cho phép job chạy từ nhánh chính (`main`) của đúng một `project_path` cụ thể được nhận quyền tạm thời để triển khai lên hạ tầng production, từ chối mọi nhánh hoặc dự án khác mà không cần lưu secret tĩnh nào.
</details>

---

### Câu Hỏi 12: Hai cạm bẫy bảo mật liên quan đến `CI_DEBUG_TRACE` và `artifacts: paths:` là gì và cách phòng tránh ra sao?

<details>
<summary>Đáp án</summary>

1. **Biến gỡ lỗi `CI_DEBUG_TRACE: "true"`**:
   - **Nguy cơ**: Kích hoạt chế độ shell execution trace, khiến runner in toàn bộ câu lệnh cùng giá trị các tham số đã phân giải ra job log, dẫn đến nguy cơ làm lộ các biến bảo mật trong môi trường chia sẻ.
   - **Cách phòng tránh**: Chỉ kích hoạt cờ gỡ lỗi này trong kho lưu trữ kiểm thử nội bộ và phải gỡ bỏ ngay sau khi khắc phục xong sự cố.
2. **Mục `artifacts: paths:`**:
   - **Nguy cơ**: Mọi file hoặc thư mục liệt kê trong `artifacts: paths:` đều được runner nén thành file zip và tải lên lưu trữ trên máy chủ GitLab; bất kỳ ai có quyền truy cập job đều có thể tải về và trích xuất các file nhạy cảm.
   - **Cách phòng tránh**: Tuyệt đối không đưa file cấu hình chứa mật mã/secret vào danh sách artifacts; chỉ xuất các gói nhị phân đã biên dịch hoặc mã nguồn tĩnh sạch.
</details>
