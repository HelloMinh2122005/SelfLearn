# Ôn Tập: 6_6_10 GitOps Concepts

### Câu Hỏi 1: GitOps là gì và phương pháp này giải quyết những hạn chế nào của mô hình triển khai CI/CD truyền thống?

<details>
<summary>Đáp án</summary>

**GitOps** là một phương pháp vận hành hạ tầng và ứng dụng hiện đại, trong đó **Git** đóng vai trò là **Nguồn Sự Thật Duy Nhất (Single Source of Truth)** cho toàn bộ trạng thái mong muốn của hệ thống.

Ở mô hình CI/CD truyền thống, pipeline chạy lệnh như `helm upgrade` hoặc `kubectl apply` từ bên ngoài để đẩy thay đổi vào Kubernetes cluster. Khi hệ thống mở rộng ra nhiều môi trường và nhiều cụm cluster, cách làm này gây ra hai vấn đề lớn:
- **Rủi ro bảo mật**: Phải trao quyền quản trị (quyền ghi) vào cluster cho máy chủ CI bên ngoài.
- **Lệch cấu hình**: Dễ phát sinh tình trạng cấu hình chạy thực tế trên cluster bị lệch so với Git khi có người sửa tay trực tiếp trên cluster.

GitOps giải quyết bằng cách đảo ngược luồng triển khai: một phần mềm chạy ngay bên trong cluster sẽ tự động kéo cấu hình từ Git và giữ cho cluster luôn khớp với Git.
</details>

### Câu Hỏi 2: Nhóm OpenGitOps (thuộc CNCF) định nghĩa 4 nguyên tắc cốt lõi bắt buộc nào cho GitOps?

<details>
<summary>Đáp án</summary>

4 nguyên tắc cốt lõi của **OpenGitOps** gồm:
1. **Declarative (Khai báo trạng thái mong muốn)**: Toàn bộ trạng thái mong muốn của hệ thống phải được biểu diễn dưới dạng khai báo (như các file YAML của Kubernetes) mô tả kết quả cuối cùng, thay vì viết chuỗi câu lệnh tuần tự từng bước.
2. **Versioned and Immutable (Có phiên bản và bất biến)**: Trạng thái mong muốn phải được lưu trong hệ thống quản lý phiên bản có lịch sử đầy đủ và bất biến (phổ biến nhất là Git), giúp truy vết mọi thay đổi và khôi phục phiên bản cũ dễ dàng.
3. **Pulled Automatically (Tự động kéo về)**: Các tác nhân phần mềm (`software agent`/`controller`) tự động kéo bản khai báo trạng thái mong muốn từ kho lưu trữ nguồn mà không cần công cụ bên ngoài đẩy vào.
4. **Continuously Reconciled (Liên tục hòa giải)**: Các tác nhân phần mềm liên tục quan sát trạng thái thực tế đang chạy và tự động điều chỉnh để đưa hệ thống về đúng trạng thái mong muốn đã khai báo.
</details>

### Câu Hỏi 3: Trong Kubernetes GitOps, hãy giải thích các thuật ngữ: Controller/Operator, Reconciliation và Configuration Drift?

<details>
<summary>Đáp án</summary>

- **Controller / Operator**: Là chương trình chạy ngầm ngay bên trong Kubernetes cluster, có nhiệm vụ theo dõi tài nguyên và tự động thực hiện hành động khi có thay đổi.
- **Reconciliation (Hòa giải)**: Là vòng lặp đối chiếu liên tục giữa trạng thái mong muốn và trạng thái thực tế. Nếu *Trạng thái mong muốn (trong Git) ≠ Trạng thái thực tế (trong Cluster)*, controller sẽ tự động sửa Cluster cho khớp với Git.
- **Configuration Drift (Độ lệch cấu hình)**: Là tình huống trạng thái đang chạy thực tế trên cluster bị khác với cấu hình lưu trong Git (ví dụ: kỹ sư chạy `kubectl edit` hoặc `kubectl scale` trực tiếp trên môi trường production để chữa cháy).
</details>

### Câu Hỏi 4: So sánh mô hình Push-based CI/CD và Pull-based GitOps (Argo CD / Flux CD) theo 4 tiêu chí: Bảo mật kết nối, Phát hiện độ lệch, Kiểm toán và Rollback?

<details>
<summary>Đáp án</summary>

| Tiêu chí | Push-based CI/CD | Pull-based GitOps (Argo CD / Flux) |
| :--- | :--- | :--- |
| **Hướng kết nối & Bảo mật** | CI server cần giữ thông tin xác thực có quyền ghi (kubeconfig / agent access) và truy cập được vào API server của cluster. | CI server không cần quyền ghi vào cluster production; cluster tự kết nối ra ngoài để đọc Git, giảm rủi ro nếu CI bị xâm nhập. |
| **Phát hiện độ lệch (Drift Detection)** | Không tự phát hiện nếu có người sửa tay trên cluster giữa hai lần chạy pipeline. | Controller kiểm tra liên tục; nếu có độ lệch cấu hình (drift), hệ thống tự động cảnh báo hoặc ghi đè lại theo Git. |
| **Khả năng kiểm toán (Auditability)** | Lịch sử thay đổi nằm rải rác giữa log pipeline CI và các thao tác tay trên cluster. | Mọi thay đổi hợp lệ đều nằm trong lịch sử commit của Git (ai sửa, sửa lúc nào, vì sao). |
| **Rollback (Quay lui)** | Chạy lại job pipeline cũ hoặc chạy lệnh `helm rollback` từ máy cá nhân/CI. | Dùng `git revert` trên kho cấu hình; controller tự kéo commit cũ và đưa cluster về trạng thái trước đó. |
</details>

### Câu Hỏi 5: Tại sao thực tế sản xuất khuyến nghị tách thành 2 repository riêng (Application Repo và Environment/Config Repo) thay vì gộp chung vào 1 repo?

<details>
<summary>Đáp án</summary>

Việc tách thành 2 repository riêng biệt giải quyết hai vấn đề quan trọng:
1. **Tránh vòng lặp CI vô tận**: Nếu đặt manifest chung trong repo mã nguồn và để CI tự động commit tag image mới vào chính repo đó, commit mới sẽ lại kích hoạt một pipeline build mới lặp đi lặp lại.
2. **Tách bạch quyền hạn**: Phân tách rõ quyền phê duyệt mã nguồn ứng dụng với quyền thay đổi cấu hình môi trường vận hành.

Vai trò của từng repo:
- **Application Repository** (ví dụ `hello-svc-app`): Chứa mã nguồn (Java/Node/Go), `Dockerfile`, và pipeline CI để test, build container image, đẩy lên Container Registry, rồi mở Merge Request cập nhật tag/digest image mới sang Environment Repo.
- **Environment / Config Repository** (ví dụ `hello-svc-env`): Chứa các file Kubernetes manifest hoặc Helm values phân theo từng môi trường (`dev`, `staging`, `prod`) và đóng vai trò là Nguồn Sự Thật Duy Nhất mà GitOps controller theo dõi.
</details>

### Câu Hỏi 6: Trong kiến trúc 2 repository, quá trình thăng cấp (promote) một phiên bản đã kiểm chứng từ `dev` lên `staging` hoặc `prod` diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

Khi muốn **promote** một phiên bản đã kiểm chứng lên `staging` hoặc `prod`, nhóm vận hành **không cần build lại container image** từ mã nguồn. Họ chỉ cần cập nhật đúng **tag hoặc digest** của image đó vào thư mục hoặc nhánh tương ứng (`staging` hoặc `prod`) trong **Environment Repository** (thường thông qua Merge Request) để GitOps controller tự động kéo về và áp dụng.
</details>

### Câu Hỏi 7: Khi tích hợp GitLab với Flux CD và GitLab Agent for Kubernetes (`agentk`), vai trò của từng thành phần là gì?

<details>
<summary>Đáp án</summary>

Do GitLab đã ngừng hỗ trợ tính năng đồng bộ manifest tích hợp sẵn trong GitLab Agent và khuyến nghị dùng **Flux CD**, trách nhiệm của hai thành phần được phân chia rõ ràng như sau:
- **Flux CD** (gồm các controller như `source-controller`, `kustomize-controller`, `helm-controller` chạy trong cluster): Chịu trách nhiệm trực tiếp kéo manifest từ kho Git trên GitLab và liên tục hòa giải trạng thái vào Kubernetes cluster.
- **GitLab Agent for Kubernetes (`agentk`)**: Chạy trong cluster và duy trì kết nối chiều đi (outbound) an toàn tới GitLab Agent Server (`kas`) mà không cần mở cổng Kubernetes API server ra Internet, giúp GitLab hiển thị trạng thái tài nguyên và môi trường đồng bộ từ Flux ngay trên giao diện web GitLab.
</details>

### Câu Hỏi 8: Mô tả luồng hoạt động trọn vẹn của một thay đổi dịch vụ `hello-svc` qua mô hình 2 repository kết hợp Flux CD và GitLab Agent?

<details>
<summary>Đáp án</summary>

Luồng hoạt động diễn ra theo 6 bước chính:
1. Lập trình viên đẩy code mới vào **Application Repo** (`hello-svc-app`).
2. GitLab CI kiểm thử, build container image gắn tag SHA/digest và đẩy lên **Container Registry**.
3. Pipeline CI của `hello-svc-app` không chạm vào cluster, mà chỉ tạo một **Merge Request** cập nhật phiên bản image mới sang **Environment Repo** (`hello-svc-env`).
4. Sau khi Merge Request được duyệt và gộp vào nhánh chính của `hello-svc-env`, trạng thái mong muốn mới chính thức được ghi nhận trong Git.
5. Bên trong cluster, `source-controller` của Flux tự động kéo bản khai báo mới từ `hello-svc-env`, sau đó `kustomize-controller` đối chiếu và hòa giải cập nhật `Deployment: hello-svc`.
6. Song song đó, `agentk` đọc trạng thái tài nguyên trong cluster và gửi ra ngoài tới `kas` để đội ngũ phát triển theo dõi trực tiếp trên GitLab UI.
</details>

### Câu Hỏi 9: Trong Flux v2, tài nguyên `GitRepository` và `Kustomization` dùng để làm gì? Các tham số `interval`, `prune: true`, và `spec.secretRef` có ý nghĩa ra sao?

<details>
<summary>Đáp án</summary>

- **`GitRepository` (`source.toolkit.fluxcd.io/v1`)**: Khai báo kho Git nguồn mà Flux cần theo dõi (URL, nhánh `ref.branch`, tần suất kiểm tra).
- **`Kustomization` (`kustomize.toolkit.fluxcd.io/v1`)**: Khai báo thư mục manifest (`path`) lấy từ `sourceRef` cần áp dụng vào cluster (có thể chỉ định `targetNamespace`).

Ý nghĩa các tham số quan trọng:
- **`interval`** (ví dụ `1m0s` ở `GitRepository`): Chu kỳ Flux tự động kiểm tra kho Git để phát hiện commit mới (hoặc chu kỳ hòa giải ở `Kustomization`).
- **`prune: true`** (ở `Kustomization`): Khi một file manifest bị xóa khỏi thư mục theo dõi trên Git, Flux sẽ tự động xóa tài nguyên tương ứng trên cluster để tránh để lại rác cấu hình.
- **`spec.secretRef`** (ở `GitRepository`): Tham chiếu tới một Kubernetes `Secret` chứa GitLab deploy token hoặc SSH key để Flux có thể xác thực và kéo dữ liệu từ kho Git ở chế độ riêng tư (`private`).
</details>

### Câu Hỏi 10: Làm thế nào để yêu cầu Flux kéo commit mới và hòa giải ngay lập tức bằng Flux CLI? Tại sao người mới thường ưu tiên bước tạo Merge Request sang Environment Repo?

<details>
<summary>Đáp án</summary>

Để kích hoạt Flux kéo ngay commit mới nhất từ nguồn và hòa giải `Kustomization` mà không phải chờ hết chu kỳ `interval`, ta dùng lệnh Flux CLI v2:
```bash
flux reconcile kustomization <tên-kustomization> --with-source
```
*(Ví dụ trong bài: `flux reconcile kustomization hello-svc-prod --with-source`)*.

Ngoài các cơ chế tự động nâng cao (như **Flux Image Automation** hay dùng **GitLab Webhook** kích hoạt **Flux Receiver**), cách để CI của App Repo mở **Merge Request** sang Environment Repo vẫn được ưu tiên cho người mới vì giữ được bước con người xem xét (`review`) trước khi thay đổi chạy lên môi trường `prod`, giúp kiểm soát và minh bạch hơn.
</details>

### Câu Hỏi 11: Tại sao không được lưu Kubernetes `Secret` dạng văn bản thuần (plaintext) trong Environment Repo, và các giải pháp thay thế an toàn là gì?

<details>
<summary>Đáp án</summary>

Vì Git có tính chất **bất biến** và lưu toàn bộ lịch sử thay đổi mãi mãi. Nếu commit một Kubernetes `Secret` chưa mã hóa lên Environment Repo, thông tin nhạy cảm/mật khẩu sẽ bị lộ trong toàn bộ lịch sử Git (kể cả khi bạn xóa ở commit sau).

**Giải pháp an toàn**:
- Chỉ lưu Secret đã được mã hóa lên Git bằng các công cụ như **Sealed Secrets** hoặc **Mozilla SOPS**.
- Hoặc dùng công cụ kéo secret động từ hệ thống quản lý secret bên ngoài vào cluster, như **External Secrets Operator**.
</details>

### Câu Hỏi 12: Khi vận hành thực tế, điều gì xảy ra nếu kỹ sư sửa tay trực tiếp trên cluster bằng `kubectl edit`, và cần cấp token cho Flux như thế nào để tránh rủi ro gián đoạn triển khai?

<details>
<summary>Đáp án</summary>

1. **Khi sửa tay trên cluster (`kubectl edit` / `kubectl scale`)**: Vì GitOps controller chạy vòng lặp hòa giải liên tục, mọi thay đổi sửa nóng trực tiếp bằng `kubectl` trên cluster sẽ bị controller tự động ghi đè lại theo đúng khai báo trong Git ở chu kỳ hòa giải tiếp theo.
   - *Cách xử lý đúng*: Luôn thực hiện thay đổi qua commit/Merge Request trên Environment Repo; chỉ tạm dừng đồng bộ bằng `flux suspend` trong tình huống khẩn cấp cần điều tra sự cố.

2. **Về cấp quyền token cho Flux**: Tránh dùng **Personal Access Token** cá nhân hoặc cấp quyền ghi quá rộng, vì nếu nhân viên nghỉ việc hoặc bị thu hồi tài khoản, toàn bộ luồng triển khai cluster sẽ ngừng hoạt động.
   - *Cách xử lý đúng*: Luôn sử dụng **Project/Group Deploy Token** của GitLab với quyền tối thiểu là chỉ đọc (`read_repository`) để lưu vào Kubernetes `Secret` mà Flux sử dụng.
</details>
