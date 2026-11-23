# Ôn Tập: 6_6_10_1 Flux Installation and Bootstrap

### Câu Hỏi 1: Cơ chế bootstrap giải quyết bài toán gì so với việc chỉ cài đặt Flux bằng tay?

<details>
<summary>Đáp án</summary>

Trong mô hình pull-based GitOps, các ứng dụng nằm trong Git và được agent trong cluster kéo về. Tuy nhiên, nếu chỉ cài đặt Flux agent bằng tay trên một cluster trắng, bản thân cấu hình của agent lại nằm ngoài Git.

Cơ chế **bootstrap** giải quyết vấn đề này bằng cách vừa cài Flux lên cluster, vừa lưu manifest của chính Flux vào Git, giúp toàn bộ cluster (bao gồm cả Flux) có thể dựng lại hoàn toàn từ Git chỉ với một dòng lệnh.
</details>

### Câu Hỏi 2: Khi cài đặt Flux v2 mặc định, những tài nguyên và 4 controller cốt lõi nào được tạo trong cluster?

<details>
<summary>Đáp án</summary>

Flux v2 tạo namespace `flux-system`, cài các **CRD** (*Custom Resource Definition* như `GitRepository`, `Kustomization`, `HelmRelease`) và chạy 4 **controller** mặc định:
- `source-controller`: kéo mã nguồn từ Git, Helm hoặc OCI.
- `kustomize-controller`: áp các manifest Kustomize lên cluster.
- `helm-controller`: quản lý vòng đời Helm chart.
- `notification-controller`: xử lý sự kiện (events) và webhook.
</details>

### Câu Hỏi 3: Flux v2 có những controller tùy chọn nào không được cài mặc định, và làm sao để cài thêm chúng?

<details>
<summary>Đáp án</summary>

Có 3 controller tùy chọn không cài mặc định:
1. `image-reflector-controller`: quét metadata và tag image từ container registry.
2. `image-automation-controller`: tự động commit tag image mới về lại Git.
3. `source-watcher`: tổng hợp hoặc tách nguồn qua `ArtifactGenerator`.

Để cài thêm, bạn truyền tên các controller này vào cờ `--components-extra` (ví dụ: `--components-extra=image-reflector-controller,image-automation-controller`).
</details>

### Câu Hỏi 4: Trước khi cài Flux, cần chạy lệnh gì để kiểm tra tiền điều kiện và lệnh đó kiểm tra những yếu tố nào?

<details>
<summary>Đáp án</summary>

Chạy lệnh `flux check --pre` (lưu ý: lệnh này đang ở trạng thái *preview and under development*). Lệnh giúp kiểm tra:
- Kết nối tới Kubernetes cluster.
- Phiên bản Kubernetes trên cluster có đáp ứng mức tối thiểu hay không.
- Có phiên bản Flux CLI mới hơn đang phát hành hay không.
</details>

### Câu Hỏi 5: Sự khác biệt cốt lõi giữa `flux install` và `flux bootstrap` là gì? Vì sao tài liệu chính thức khuyến nghị dùng `flux bootstrap`?

<details>
<summary>Đáp án</summary>

- `flux install` chỉ áp manifest CRD, controller, RBAC và NetworkPolicy vào namespace `flux-system`. Nó **không** tạo `Secret` deploy-token, `GitRepository`, `Kustomization` gốc và **không** lưu cấu hình Flux vào Git.
- Hạn chế lớn nhất của `flux install` là **bản thân Flux không được Git quản lý**: mỗi lần muốn nâng cấp hoặc đổi cấu hình controller, bạn phải chạy tay `flux install` trên từng cluster.
- Ngược lại, `flux bootstrap` vừa cài đặt Flux vừa commit manifest của Flux vào Git để Flux tự quản lý và tự nâng cấp chính mình. Do đó, tài liệu chính thức khuyến nghị dùng `flux bootstrap` thay cho cài thủ công.
</details>

### Câu Hỏi 6: Để chạy `flux bootstrap gitlab` trên GitLab.com Free cần điều kiện xác thực gì? Nếu dùng Git server khác không có subcommand riêng thì làm thế nào?

<details>
<summary>Đáp án</summary>

- Khi chạy `flux bootstrap gitlab`, Flux CLI đọc biến môi trường `GITLAB_TOKEN` chứa GitLab **Personal Access Token (PAT)** có quyền `api` (tài liệu Flux yêu cầu PAT; Group/Project Access Token không có trên GitLab.com Free). Nếu project trên GitLab chưa tồn tại, lệnh sẽ tự động tạo mới project đó.
- Với các Git server khác không có subcommand riêng, dùng lệnh tổng quát `flux bootstrap git` kèm cờ `--url`.
</details>

### Câu Hỏi 7: Ý nghĩa của các cờ lệnh chính trong `flux bootstrap gitlab` (`--owner`, `--repository`, `--branch`, `--path`, `--personal`, `--visibility`, `--hostname`, `--token-auth`, `--read-write-key`) là gì?

<details>
<summary>Đáp án</summary>

- `--owner`: user hoặc group/subgroup sở hữu repository.
- `--repository`: tên project GitLab chứa cấu hình GitOps.
- `--branch`: nhánh Git mà Flux theo dõi.
- `--path`: thư mục lưu manifest riêng của cluster (ví dụ `clusters/lab`).
- `--personal`: chỉ định repository thuộc tài khoản cá nhân.
- `--visibility`: đặt mức hiển thị repo khi tạo mới (mặc định là `private`, thay thế cho cờ `--private` đã deprecated).
- `--hostname`: domain cho GitLab tự host (*self-managed*).
- `--token-auth`: dùng HTTPS + PAT thay cho SSH deploy key.
- `--read-write-key`: cấp quyền ghi cho SSH deploy key.
</details>

### Câu Hỏi 8: Sau khi `flux bootstrap gitlab` hoàn tất, những tài nguyên nào được tạo ra đồng bộ ở phía Git và phía GitLab/Cluster?

<details>
<summary>Đáp án</summary>

1. **Trong Git** (tại `<path>/flux-system/`): commit 3 file gồm:
   - `gotk-components.yaml` (định nghĩa CRD và các controller).
   - `gotk-sync.yaml` (tài nguyên `GitRepository` và `Kustomization` tên `flux-system`).
   - `kustomization.yaml`.
2. **Trên GitLab & Cluster**:
   - Tạo SSH deploy key trên GitLab project (trừ khi dùng `--token-auth` để dùng trực tiếp PAT, hoặc `--deploy-token-auth` để tạo Project Deploy Token).
   - Lưu khóa/token vào Kubernetes `Secret` tên `flux-system` trong namespace `flux-system`.
   - Áp các controller cùng `GitRepository` và `Kustomization` `flux-system` lên cluster.
</details>

### Câu Hỏi 9: Tính idempotent của `flux bootstrap` hoạt động ra sao khi nâng cấp Flux, và vì sao không nên chạy đè `flux install` lên một cluster đã bootstrap?

<details>
<summary>Đáp án</summary>

- `flux bootstrap` có tính **idempotent**: khi muốn nâng cấp Flux, bạn nâng cấp `flux` CLI rồi chạy lại đúng lệnh `flux bootstrap gitlab` ban đầu. Lệnh sẽ cập nhật file `gotk-components.yaml` trong Git để Flux tự nâng cấp chính mình.
- Không nên chạy đè `flux install` lên cluster đã bootstrap vì `flux install` không cập nhật Git; sau đó controller có thể kéo file `gotk-components.yaml` phiên bản cũ trong Git về và ghi đè lại cluster.
</details>

### Câu Hỏi 10: Về bảo mật bootstrap, quyền mặc định của SSH deploy key là gì và khi thu hồi `GITLAB_TOKEN` thì Flux có tiếp tục đồng bộ được không?

<details>
<summary>Đáp án</summary>

- Mặc định, `flux bootstrap gitlab` tạo SSH deploy key **chỉ đọc** (*read-only*). Bạn chỉ thêm cờ `--read-write-key` khi dùng tính năng image automation cần Flux push commit ngược về Git.
- Ở chế độ SSH deploy key mặc định, `Secret` `flux-system` lưu SSH private key nên Flux vẫn đồng bộ Git bình thường sau khi bạn thu hồi `GITLAB_TOKEN` (còn `--token-auth` và `--deploy-token-auth` lưu token vào `Secret` để kéo qua HTTPS).
- Tuy nhiên, khi nâng cấp Flux CLI và cần chạy lại `flux bootstrap gitlab`, bạn vẫn phải cấp một `GITLAB_TOKEN` (PAT) hợp lệ mới để CLI gọi GitLab API.
</details>

### Câu Hỏi 11: Khi sử dụng file mã hóa SOPS với Flux, cần chuẩn bị gì trước lúc reconcile và trường hợp ngoại lệ là gì?

<details>
<summary>Đáp án</summary>

- Nếu `Kustomization` khai báo `spec.decryption` sử dụng `secretRef` (ví dụ `sops-age` trong namespace `flux-system`), bạn bắt buộc phải tạo sẵn `Secret` chứa khóa giải mã trong cùng namespace **trước khi** quá trình reconcile diễn ra, nếu không Flux sẽ báo lỗi giải mã.
- Trường hợp ngoại lệ: nếu dùng xác thực **cloud KMS** thông qua `serviceAccountName` / IAM Role thì không cần tạo `Secret` này.
</details>

### Câu Hỏi 12: Trong cấu trúc repo đa môi trường theo mẫu `flux2-kustomize-helm-example`, các thư mục được tổ chức như thế nào và `spec.dependsOn` có tác dụng gì?

<details>
<summary>Đáp án</summary>

Cấu trúc repo tách riêng cấu hình theo từng cluster khỏi phần hạ tầng và ứng dụng dùng chung:
- `clusters/<tên-cluster>/`: chứa `flux-system/` và các `Kustomization` gốc trỏ ra ngoài (như `infrastructure.yaml`, `apps.yaml`).
- `infrastructure/`: chứa các thành phần hạ tầng chung (Gateway API controller, Strimzi, monitoring...).
- `apps/`: chứa manifest hoặc `HelmRelease` của ứng dụng.

Khai báo `spec.dependsOn` trên `Kustomization` của `apps` trỏ tới `infrastructure` giúp Flux đợi các thành phần hạ tầng đạt trạng thái `Ready` trước khi áp dụng ứng dụng.
</details>

### Câu Hỏi 13: Ngoài `flux bootstrap`, bài học đề cập hai lựa chọn cài đặt Flux nào trong doanh nghiệp và chúng khác gì nhau?

<details>
<summary>Đáp án</summary>

1. **Terraform / OpenTofu Provider (`fluxcd/flux`)**: dùng resource `flux_bootstrap_git` để gộp bước tạo cluster và bootstrap Flux vào cùng một pipeline IaC. Terraform tạo `Secret` `flux-system` và commit cấu hình vào Git khi `apply`; khi nâng cấp thì nâng provider rồi chạy `apply`.
2. **Flux Operator (`FluxInstance`)**: dự án của ControlPlane tại `controlplaneio-fluxcd/flux-operator` (không nằm trong repo `fluxcd/flux2`), thường cài bằng Helm hoặc Terraform trong production. Tài nguyên quản lý là `FluxInstance` (dùng `spec.sync.pullSecret` cho credential), nâng cấp bằng cách cập nhật Operator rồi đổi `spec.distribution.version`. Trang cài đặt Flux xem đây là **phương án thay thế** (*alternative*), trong khi `bootstrap` vẫn là quy trình được khuyến nghị.
</details>

### Câu Hỏi 14: Làm thế nào để thiết lập cô lập quyền (Multi-Tenancy) cho nhiều team dùng chung một Kubernetes cluster với Flux?

<details>
<summary>Đáp án</summary>

Thay vì để mọi team dùng chung quyền `cluster-admin`, bạn cần kết hợp hai biện pháp:
1. Gán `spec.serviceAccountName` trên từng `Kustomization` để Flux mạo danh ServiceAccount có quyền hạn hẹp của riêng team đó.
2. Bật cờ `--no-cross-namespace-refs=true` để chặn các tài nguyên tham chiếu chéo sang namespace khác.
</details>

### Câu Hỏi 15: Các lệnh vận hành Day-2 thiết yếu của Flux là gì? Cần lưu ý gì về trạng thái preview của lệnh và tác động của `flux uninstall`?

<details>
<summary>Đáp án</summary>

Các lệnh Day-2 thiết yếu gồm:
- **Xem trạng thái**: `flux get all -A` (đang ở trạng thái *preview and under development*; các lệnh ổn định tương ứng là `flux get sources git -A`, `flux get kustomizations -A`, `flux get helmreleases -A`).
- **Ép đồng bộ ngay**: `flux reconcile kustomization flux-system --with-source` (kéo commit mới và áp dụng ngay không đợi chu kỳ `interval`).
- **Tạm dừng / tiếp tục đồng bộ** (khi cần sửa tay khẩn cấp tránh bị Flux ghi đè): `flux suspend kustomization <tên>` và `flux resume kustomization <tên>`.
- **Xem log**: `flux logs --level=error --all-namespaces` (đang ở trạng thái *preview and under development*; cách ổn định là `kubectl logs -n flux-system`).
- **Gỡ cài đặt**: `flux uninstall --namespace=flux-system`. Lưu ý quan trọng: lệnh này gỡ các controller, CRD và namespace `flux-system`, **nhưng giữ nguyên toàn bộ workload/app mà Flux đã triển khai ở các namespace khác** trừ khi bạn xóa riêng.
</details>
