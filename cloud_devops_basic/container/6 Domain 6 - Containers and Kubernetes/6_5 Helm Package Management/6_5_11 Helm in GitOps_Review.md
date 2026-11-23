# Ôn Tập: 6_5_11 Helm in GitOps

### Câu Hỏi 1: GitOps là gì và mang lại lợi ích cốt lõi nào khi quản lý cấu hình Kubernetes?

<details>
<summary>Đáp án</summary>

**GitOps** là mô hình trong đó trạng thái mong muốn của cluster được khai báo trong **Git**, và một cơ chế tự động sẽ đảm bảo trạng thái thực tế của cluster luôn **khớp** với Git.

Vì mọi thay đổi (như sửa cấu hình, nâng cấp phiên bản) đều phải đi qua Git dưới dạng commit, Pull Request và review, đội ngũ có được lịch sử thay đổi rõ ràng, khả năng kiểm toán (audit) và có thể rollback nhanh bằng `git revert`.
</details>

### Câu Hỏi 2: Mô hình Push-based và Pull-based trong GitOps khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

Hai mô hình khác nhau ở 4 điểm chính:

- **Ai áp dụng thay đổi**: Với **Push-based**, pipeline CI chạy trực tiếp `helm upgrade --install` (hoặc `kubectl`) đẩy cấu hình tới cluster. Với **Pull-based**, một agent chạy bên trong cluster (như Argo CD hoặc Flux) chủ động kéo cấu hình từ Git/registry về để đồng bộ.
- **Thông tin truy cập cluster**: Push-based yêu cầu CI phải giữ kubeconfig/credential của cluster; còn Pull-based dùng quyền của agent bên trong cluster nên CI không cần quyền deploy vào cluster.
- **Phát hiện lệch trạng thái (drift)**: Push-based chỉ phát hiện lệch khi pipeline được chạy lại; Pull-based có agent liên tục so sánh trạng thái thật với Git và có thể tự động sửa lệch.
- **Nơi xem phản hồi**: Kết quả Push-based nằm trong log của pipeline CI, còn Pull-based nằm trực tiếp ở trạng thái của object trong cluster (`Application` của Argo CD hoặc `HelmRelease` của Flux).
</details>

### Câu Hỏi 3: Khi nào nên chọn mô hình Push-based và khi nào nên chọn Pull-based?

<details>
<summary>Đáp án</summary>

- **Chọn Push-based** khi hệ thống đơn giản, chỉ có một cluster, ít thành phần/service, đội nhỏ và đã có sẵn CI. Khi đó chỉ cần lệnh kiểu `helm upgrade --install --wait --rollback-on-failure` (trên Helm 4; với Helm 3 thay `--rollback-on-failure` bằng `--atomic`) trong pipeline là đủ.
- **Chọn Pull-based** (Argo CD hoặc Flux) khi vận hành nhiều môi trường hoặc nhiều cluster, cần khả năng audit chặt chẽ và cần cơ chế tự động phát hiện, sửa drift liên tục.
</details>

### Câu Hỏi 4: Trong Argo CD, Helm đóng vai trò gì và điều này tạo ra những hệ quả nào đối với vòng đời ứng dụng?

<details>
<summary>Đáp án</summary>

Theo tài liệu Argo CD, **Helm chỉ được dùng để render chart bằng `helm template`**; toàn bộ vòng đời ứng dụng do **Argo CD** xử lý, không phải Helm.

Hệ quả trực tiếp gồm:
- **Không có release Helm làm trung tâm**: Lịch sử và trạng thái nằm ở **Git** và **Argo CD** (`Application`, sync history), chứ không dùng `helm history` hay `helm rollback` để vận hành.
- **Mỗi thao tác đều là `sync`**: Argo CD không phân biệt đó là "install" hay "upgrade".
- **Cách rollback**: Muốn quay lại phiên bản trước, phải dùng cơ chế của Argo CD (sync về revision cũ) hoặc thực hiện `git revert` trên Git.
</details>

### Câu Hỏi 5: Argo CD xử lý Helm hooks như thế nào và cần tránh những cạm bẫy gì?

<details>
<summary>Đáp án</summary>

Argo CD ánh xạ các annotation hook của Helm sang hook tương ứng của Argo CD:
- `pre-install` và `pre-upgrade` → `PreSync`
- `post-*` → `PostSync`
- `hook-weight` → `sync-wave`

Những giới hạn và cạm bẫy cần nhớ:
- **Tương thích mức annotation, không đảm bảo cùng ngữ nghĩa**: Vì cả `pre-install` và `pre-upgrade` đều ánh xạ thành `PreSync`, chúng sẽ chạy cùng lúc mỗi lần sync. Do đó hook cần đảm bảo idempotent, kết hợp `sync-wave` và `before-hook-creation`.
- **Các hook không được hỗ trợ**: `pre-rollback`, `post-rollback`, và `test-success`/`test-failure` (`helm test`) **không được hỗ trợ**; manifest chứa các hook này sẽ bị **bỏ qua** khi render. Muốn chạy smoke test thì cần chuyển thành một bước pipeline sau sync hoặc dùng hook Argo CD rõ ràng.
- **Quy tắc ghi đè**: Nếu trong manifest định nghĩa **bất kỳ hook Argo CD nào**, thì **mọi Helm hook đều bị bỏ qua**.
</details>

### Câu Hỏi 6: Vì sao chart dùng hàm sinh giá trị ngẫu nhiên (như `randAlphaNum`) lại khiến ứng dụng Argo CD luôn `OutOfSync`, và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

Argo CD định kỳ chạy `helm template` để render lại manifest và so sánh với trạng thái đang chạy (live state) trên cluster. Khi template chứa hàm như `randAlphaNum`, mỗi lần render lại sinh ra một giá trị mới khác với giá trị đã apply trước đó trên cluster, nên Argo CD luôn đánh giá ứng dụng là **`OutOfSync`**.

**Cách khắc phục**: Cố định giá trị trong `values.yaml`, truyền giá trị cố định qua `argocd app set -p`, hoặc tách thành Secret quản lý bên ngoài chart.
</details>

### Câu Hỏi 7: Thứ tự ưu tiên values trong Argo CD hoạt động ra sao và cần lưu ý gì khi dùng `valueFiles` hoặc `releaseName`?

<details>
<summary>Đáp án</summary>

Thứ tự ưu tiên values **trong Argo CD** (từ cao xuống thấp) là:
`parameters` > `valuesObject` > `values` > `valueFiles` > `values.yaml` của chart.

*(Lưu ý: Đây là thứ tự ưu tiên của riêng Argo CD, không thay thế thứ tự ưu tiên của Helm CLI; khi debug giá trị render, nên chạy `helm template` cục bộ với cùng bộ values và đối chiếu manifest đã render trong UI/CLI của `Application`.)*

Các lưu ý cấu hình kèm theo:
- **`valueFiles` và nhiều repo**: Argo CD cho phép dùng nhiều file values, hỗ trợ `ignoreMissingValueFiles`, glob pattern; từ **Argo CD ≥ 2.6**, nếu file values nằm ở repo khác với chart thì có thể cấu hình nhiều `sources`.
- **`releaseName` và nhãn instance**: Mặc định `releaseName` bằng tên `Application`. Có thể ghi đè `releaseName`, nhưng Argo CD tự gắn nhãn `app.kubernetes.io/instance` bằng tên `Application` để theo dõi tài nguyên, nên việc đổi `releaseName` khác tên `Application` có thể gây lỗi với các chart dựa vào nhãn này.
</details>

### Câu Hỏi 8: Khi khai báo nguồn chart từ OCI registry, cú pháp `repoURL`/`url` trong Argo CD `Application` khác gì so với Flux `OCIRepository`?

<details>
<summary>Đáp án</summary>

- **Trong Argo CD `Application`**: Trường `spec.source.repoURL` cho OCI registry **không có tiền tố `oci://`** (ví dụ: `registry.example.com/team/charts` hoặc `registry-1.docker.io/bitnamicharts`).
- **Trong Flux `HelmRelease` (với `OCIRepository`)**: Trường `url` **có tiền tố `oci://`** (ví dụ: `oci://ghcr.io/stefanprodan/charts/podinfo`) và hỗ trợ chọn phiên bản qua `ref.semver`.
</details>

### Câu Hỏi 9: Flux Helm Controller khác Argo CD ở điểm cốt lõi nào về cách chạy Helm và nơi lưu lịch sử?

<details>
<summary>Đáp án</summary>

Khác với Argo CD (chỉ dùng `helm template` để render), **Flux Helm Controller** quản lý release thông qua custom resource `HelmRelease` (`apiVersion: helm.toolkit.fluxcd.io/v2`) và **thực thi thật các hành động Helm** (`install`, `upgrade`, `test`, `uninstall`, `rollback`).

Do đó, nơi lưu trữ lịch sử của hai công cụ cũng khác nhau:
- **Flux**: Lịch sử và trạng thái được lưu trong `status` của `HelmRelease` **và** gắn với release Helm thật trong cluster (Helm release storage, số revision lưu giữ điều chỉnh qua `.spec.maxHistory`, mặc định là **5**).
- **Argo CD**: Lịch sử nằm ở **Git** và `Application` / sync history của Argo CD, không có release Helm thật trong cluster.
</details>

### Câu Hỏi 10: Custom resource `HelmRelease` của Flux cung cấp những tính năng vận hành chính nào?

<details>
<summary>Đáp án</summary>

Dựa trên tài liệu Flux (`helm.toolkit.fluxcd.io/v2`), `HelmRelease` hỗ trợ các cơ chế chính sau:

- **Nguồn chart linh hoạt**: Dùng `HelmChart` sinh ra từ `HelmRepository` hoặc `GitRepository`, hoặc khai báo trực tiếp `OCIRepository` (`oci://...` với `ref.semver`).
- **Tự động khắc phục khi lỗi (`remediation`)**: Cấu hình `install.remediation.retries` và `upgrade.remediation.retries` để thử lại hoặc rollback khi cài đặt/nâng cấp thất bại.
- **Chạy kiểm thử Helm (`test`)**: Bật `test.enable: true` để controller tự động chạy `helm test`.
- **Phát hiện và sửa lệch (`driftDetection`)**: Khi đặt `driftDetection.mode: enabled`, controller sẽ so sánh trạng thái trên cluster với trạng thái mong muốn và áp lại nếu phát hiện bị lệch.
- **Thứ tự phụ thuộc (`dependsOn`)**: Dùng `.spec.dependsOn` để chờ các `HelmRelease` khác đạt trạng thái Ready trước khi triển khai.
</details>

### Câu Hỏi 11: Làm thế nào để kiểm tra trạng thái ứng dụng trong Argo CD và Flux, và tại sao không được chạy `kubectl edit` hay `helm upgrade` thủ công trên cluster do GitOps quản lý?

<details>
<summary>Đáp án</summary>

**Cách kiểm tra trạng thái**:
- **Argo CD**: Dùng `argocd app get <tên-app>` để xem trạng thái tổng thể và `argocd app history <tên-app>` để xem lịch sử đồng bộ.
- **Flux**: Dùng `kubectl get helmrelease -A` để liệt kê và `kubectl describe helmrelease <tên> -n <namespace>` để xem mục `Status` (như `History`, `Last Attempted Release Action`).

**Quy tắc không chỉnh sửa tay**: Trên môi trường do GitOps quản lý, **Git là nguồn sự thật**. Nếu bạn chạy `kubectl edit` hoặc `helm upgrade` trực tiếp trên cluster, agent (Argo CD/Flux) sẽ phát hiện sai lệch (báo `OutOfSync`) hoặc tự động ghi đè lại cấu hình cũ (như `driftDetection` của Flux). Mọi thay đổi đều phải thực hiện bằng cách sửa file trong Git và đẩy qua commit/Pull Request.
</details>

### Câu Hỏi 12: Các kỹ năng Helm nền tảng (values theo môi trường, kiểm tra chart, OCI/image digest) đóng vai trò gì trong quy trình GitOps?

<details>
<summary>Đáp án</summary>

Các kỹ năng Helm cơ bản không biến mất khi chuyển sang GitOps mà được đặt đúng vị trí vào quy trình **CI + Git**:

- **`values-<env>.yaml`**: Cấu hình riêng cho từng môi trường được lưu trữ trong Git; muốn thay đổi cấu hình phải tạo Pull Request.
- **`values.schema.json`, `helm lint`, `helm template`**: Chạy tự động trong pipeline CI **trước khi merge PR** để phát hiện lỗi cú pháp hoặc sai schema trước khi GitOps agent kéo về cluster.
- **Chart OCI và image digest**: Chart đóng gói trên OCI registry (ghim digest) làm nguồn bất biến cho Argo CD/Flux; việc nâng cấp phiên bản ứng dụng thực hiện bằng PR cập nhật image tag/digest trong file values trên Git.
</details>
