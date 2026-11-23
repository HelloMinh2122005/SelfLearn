# Ôn Tập: 6_5_9 Packaging and Distribution

### Câu Hỏi 1: Vì sao cần đóng gói chart thành file `.tgz` bằng `helm package` thay vì giữ nguyên dạng thư mục khi chia sẻ và triển khai?

<details>
<summary>Đáp án</summary>

Chart ở dạng thư mục chỉ phù hợp cho quá trình phát triển cục bộ. Để đồng nghiệp, hệ thống CI và cluster production có thể kéo **đúng cùng một bản** về cài đặt lặp lại được, chart cần được đóng gói thành một **chart archive** (`.tgz`) có gắn phiên bản và đẩy lên nơi lưu trữ (registry/repository) — tương tự như cách build và phân phối container image.
</details>

### Câu Hỏi 2: `helm package` tạo ra file theo quy ước tên nào, và các cờ `--version`, `--app-version`, `-u` (`--dependency-update`), `-d` (`--destination`), `--sign` có tác dụng gì?

<details>
<summary>Đáp án</summary>

`helm package [CHART_PATH]` tạo file archive có tên theo mẫu `<name>-<version>.tgz` (ví dụ `hello-svc-0.1.0.tgz`). Ý nghĩa các cờ chính:

- `--version <semver>`: Ghi đè/đặt `version` của chart trong archive (thường dùng trong CI từ git tag/pipeline).
- `--app-version <str>`: Ghi đè/đặt `appVersion` trong archive.
- `-u`, `--dependency-update`: Chạy cập nhật dependency từ `Chart.yaml` vào thư mục `charts/` trước khi đóng gói.
- `-d`, `--destination`: Chỉ định thư mục lưu file `.tgz` đầu ra (mặc định là thư mục hiện tại `.`).
- `--sign` (cùng `--key`, `--keyring`, `--passphrase-file`): Ký chart bằng PGP để tạo file provenance `.prov`.

*(Trước khi đóng gói, thường chạy `helm lint` để kiểm tra lỗi cơ bản của chart.)*
</details>

### Câu Hỏi 3: Phân biệt `version` và `appVersion` trong `Chart.yaml`. Khi sửa template của chart mà không thay đổi code ứng dụng, cần cập nhật trường nào?

<details>
<summary>Đáp án</summary>

- **`version`**: Là phiên bản của chính **Helm chart** (theo chuẩn SemVer 2). Giá trị này **bắt buộc phải tăng mỗi khi có bất kỳ thay đổi nào trong chart** (như sửa template, values mặc định hoặc dependency).
- **`appVersion`**: Là phiên bản của **ứng dụng** được chart triển khai.

Hai trường này độc lập với nhau: khi sửa template mà không đổi ứng dụng, bạn **tăng `version` và giữ nguyên `appVersion`**. Khi nâng cấp image ứng dụng, bạn đổi `appVersion` và thường cũng tăng `version` vì nội dung chart đã thay đổi.
</details>

### Câu Hỏi 4: Điều gì xảy ra nếu bạn sửa nội dung chart nhưng quên tăng `version` và đẩy lại lên registry?

<details>
<summary>Đáp án</summary>

Vì tag của chart trên OCI registry được suy ra trực tiếp từ `version`, việc đẩy lại cùng một `version` với nội dung mới sẽ dẫn đến một trong hai lỗi:
- **Registry từ chối ghi đè** tag đã tồn tại.
- Nếu registry cho phép ghi đè tag, các môi trường khác có thể **kéo nhầm bản cũ từ cache** hoặc chạy không nhất quán.

Giải pháp là luôn tăng `version` mỗi khi thay đổi chart (tốt nhất tự động hóa trong CI bằng `--version`) và ghim theo digest trên production.
</details>

### Câu Hỏi 5: So sánh cấu trúc và quy trình sử dụng giữa Chart Repository (HTTP) truyền thống và OCI Registry.

<details>
<summary>Đáp án</summary>

- **Chart Repository (HTTP)**:
  - **Cấu trúc**: Một máy chủ HTTP (GCS/S3, GitHub Pages, web server...) chứa file mục lục `index.yaml` cùng các file `.tgz` (và `.prov`).
  - **Quy trình**: Đóng gói bằng `helm package`, sinh/cập nhật mục lục bằng `helm repo index <thư_mục> --url <URL>`, upload lên HTTP server. Người dùng chạy `helm repo add <tên> <URL>`, `helm repo update` rồi `helm install <release> <tên>/<chart>`. (Cộng đồng có Artifact Hub để tìm chart công khai.)
- **OCI Registry**:
  - **Cấu trúc**: Dùng chung container registry với image, không cần file `index.yaml`.
  - **Quy trình**: Đẩy bằng `helm push <file.tgz> oci://<registry>/<path>`, cài đặt trực tiếp bằng `helm install <release> oci://<registry>/<path>/<chart> --version <X>` (hoặc theo digest).
</details>

### Câu Hỏi 6: Vì sao tài liệu Helm khuyến nghị dùng OCI Registry thay vì Chart Repository (HTTP)?

<details>
<summary>Đáp án</summary>

Tài liệu Helm khuyến nghị dùng OCI Registry vì 3 ưu điểm thực tế:
1. **Dùng chung hạ tầng với container image**: Tận dụng sẵn hệ thống xác thực, phân quyền RBAC, quét bảo mật (scanning), replication và mirror.
2. **Không cần dựng và duy trì `index.yaml`**: Loại bỏ bước tạo và đồng bộ file mục lục thủ công.
3. **Có digest bất biến**: Giúp đảm bảo tính toàn vẹn và triển khai tái lập được (reproducible).
</details>

### Câu Hỏi 7: Khi dùng `helm registry login`, cần lưu ý quy tắc nào về địa chỉ host (đặc biệt là breaking change ở Helm 4) và cách truyền token/mật khẩu an toàn?

<details>
<summary>Đáp án</summary>

- **Quy tắc địa chỉ host**: `helm registry login` **chỉ nhận tên miền** (có thể kèm cổng, ví dụ `ghcr.io` hoặc `localhost:5000`). **Không được** truyền scheme (`https://ghcr.io`) hay path (`ghcr.io/myrepo`). Tài liệu *Helm 4 Overview* ghi nhận việc chỉ nhận tên miền là một **breaking change** ở Helm 4 (các script cũ viết cho Helm 3 truyền URL đầy đủ cần được sửa lại).
- **Truyền mật khẩu/token an toàn**: Nên dùng cờ `--password-stdin` (ví dụ `echo "$REGISTRY_TOKEN" | helm registry login <host> -u "$USER" --password-stdin`) để tránh lộ token trong dòng lệnh và lịch sử shell. Sau khi xong có thể đăng xuất bằng `helm registry logout <host>`.
</details>

### Câu Hỏi 8: Đầu vào của lệnh `helm push` là gì, và tại sao tham chiếu đích `oci://...` khi đẩy chart không được chứa tên chart hay tag?

<details>
<summary>Đáp án</summary>

- **Đầu vào**: `helm push` chỉ đẩy được file **`.tgz` đã đóng gói trước** bằng `helm package` (không đẩy trực tiếp từ thư mục nguồn).
- **Tham chiếu đích**: Bắt buộc có tiền tố `oci://` nhưng **không được chứa tên chart lẫn tag** (ví dụ đúng: `helm push mychart-0.1.0.tgz oci://localhost:5000/helm-charts`). Lý do là `helm push` **tự động suy ra tên chart từ `name` và tag từ `version`** trong `Chart.yaml` để tạo thành `localhost:5000/helm-charts/mychart:0.1.0`.
</details>

### Câu Hỏi 9: Đường dẫn `oci://...` khi dùng `helm pull`, `helm show`, `helm install`, `helm upgrade` khác gì so với `helm push`?

<details>
<summary>Đáp án</summary>

Ngược lại với `helm push` (không ghi tên chart trong đích đến), khi **tải, xem hoặc cài đặt** bằng `helm pull`, `helm show`, `helm template`, `helm install` hoặc `helm upgrade`, đường dẫn `oci://` **phải chứa tên chart** và chọn phiên bản bằng `--version` (hoặc `@sha256:...`).

Ví dụ:
```bash
# Push: KHÔNG có tên chart
helm push mychart-0.1.0.tgz oci://localhost:5000/helm-charts

# Pull / Show / Install: CÓ tên chart + --version
helm pull oci://localhost:5000/helm-charts/mychart --version 0.1.0
helm show all oci://localhost:5000/helm-charts/mychart --version 0.1.0
helm install myrelease oci://localhost:5000/helm-charts/mychart --version 0.1.0
```
</details>

### Câu Hỏi 10: Cài đặt chart theo tag (`--version`) khác gì với cài theo digest (`@sha256:...`)? Vì sao môi trường production nên ghim theo digest?

<details>
<summary>Đáp án</summary>

- **Tag** (suy ra từ `version`): Là một nhãn có thể bị đẩy đè sang nội dung khác về sau, do đó không bảo đảm tuyệt đối cùng một artifact giữa các lần cài.
- **Digest** (`oci://.../<chart>@sha256:<digest>`): Là mã băm **bất biến** gắn với đúng nội dung của chart đó; mọi thay đổi trong nội dung đều làm đổi digest.

Môi trường production nên ghim theo digest để **đảm bảo triển khai tái lập được (reproducible)** và **bảo vệ chuỗi cung ứng (chống tráo chart)**. Ở Helm 4, nếu digest không khớp, chart sẽ **không được cài**. Bạn có thể xem digest của chart khi chạy `helm pull` (lệnh sẽ in ra `Digest: sha256:...`) hoặc từ output của `helm push`.
</details>

### Câu Hỏi 11: Khi làm việc thực tế với OCI Registry, cần lưu ý những điểm nào về tạo repository/namespace trước, file `.prov`, cờ `--plain-http` và registry cục bộ?

<details>
<summary>Đáp án</summary>

- **Repository/Namespace**: Một số registry yêu cầu tạo trước repository/namespace trước khi đẩy; nếu chưa có thì `helm push` sẽ báo lỗi.
- **File `.prov`**: Nếu có file provenance `.prov` nằm cạnh file `.tgz`, `helm push` sẽ tự động đẩy kèm nó như một layer bổ sung.
- **Cờ kết nối & `--plain-http`**: Với registry không TLS dùng để thử nghiệm, cần thêm cờ `--plain-http` ở các lệnh (`push`, `install`, `show`, `pull`, `registry login` trên Helm 4.3; cần kiểm tra `--help` tùy phiên bản). Ngoài ra còn có các cờ như `--insecure-skip-tls-verify`, `--ca-file`, `--cert-file`, `--key-file`.
- **Registry cục bộ**: Các registry chạy cục bộ không TLS (như Docker Registry hoặc `zot`) theo tài liệu Helm **chỉ nên dùng để kiểm thử**, tuyệt đối không dùng cho production.
</details>

### Câu Hỏi 12: Helm lưu trữ chart trong OCI Registry dưới dạng manifest với những `mediaType` nào, và làm sao khai báo một dependency từ OCI Registry trong `Chart.yaml`?

<details>
<summary>Đáp án</summary>

- **OCI Manifest MediaType**:
  - Config: `application/vnd.cncf.helm.config.v1+json`
  - Layer nội dung chart: `application/vnd.cncf.helm.chart.content.v1.tar+gzip`
  Nhờ sử dụng chuẩn OCI manifest với mediaType riêng này, mọi công cụ tuân thủ chuẩn OCI (quét bảo mật, mirror, replication) đều có thể làm việc được với Helm chart.
- **Khai báo dependency từ OCI**: Trong `Chart.yaml`, trường `repository` của dependency trỏ đến đường dẫn `oci://` **không kèm tên chart** (ví dụ `repository: "oci://localhost:5000/myrepo"`).
</details>

### Câu Hỏi 13: GitLab hỗ trợ lưu trữ và phân phối Helm chart qua những cách nào? Tại sao plugin `helm-push` cũ lại đổi tên thành `helm cm-push`?

<details>
<summary>Đáp án</summary>

GitLab hỗ trợ 2 hướng:
1. **GitLab Package Registry kiểu Helm repository**: Phân phối chart theo **channel** (như `stable`, `devel`). Đẩy chart bằng `curl` (`POST` form `chart=@...tgz` tới endpoint API Helm của project) hoặc plugin `helm cm-push`; xác thực bằng Personal Access Token (scope `api`), Deploy Token (`read_package_registry`/`write_package_registry`) hoặc `CI_JOB_TOKEN` (với user `gitlab-ci-token` trong GitLab CI). Người dùng cài bằng `helm repo add` và `helm install`.
2. **GitLab Container Registry dùng như OCI Registry**: Tuân thủ OCI distribution spec, hỗ trợ lưu các gói OCI bao gồm Helm 3+ chart packages.

Plugin cũ `helm-push` (dùng cho ChartMuseum/HTTP repo) đã đổi tên thành **`helm cm-push`** từ v0.10.0 để tránh xung đột với lệnh `helm push` tích hợp sẵn của Helm.
</details>

### Câu Hỏi 14: Khi lưu và phân phối Helm chart trên Azure Container Registry (ACR), cần lưu ý những điểm gì về phiên bản Helm, lệnh cũ `az acr helm`, và cách xác thực?

<details>
<summary>Đáp án</summary>

- **Chuẩn OCI & phiên bản Helm**: ACR lưu chart dưới dạng **OCI artifact** (GA), yêu cầu Helm **≥ 3.8.0** (vì trước đó OCI còn ở trạng thái experimental).
- **Lệnh cũ đã bị gỡ**: Nhóm lệnh `az acr helm` (dùng cho kho Helm cũ trên ACR) **đã bị gỡ từ ngày 15-09-2025**; hiện tại bắt buộc chuyển sang dùng quy trình OCI (`helm registry login/push/install`). Tên chart nên dùng chữ thường và chữ-số.
- **Xác thực**: Dùng `helm registry login <acr>.azurecr.io` với một trong ba cách:
  1. **Service Principal** (vai trò `AcrPush`, hoặc `Container Registry Repository Writer` nếu registry bật ABAC).
  2. **Danh tính Microsoft Entra**: Lấy token qua `az acr login --name <acr> --expose-token` rồi đăng nhập với username cố định `00000000-0000-0000-0000-000000000000`.
  3. **Repository-scoped token**.
- **Kiểm tra trên ACR**: Dùng `az acr repository show` và `az acr manifest list-metadata` (sẽ thấy `configMediaType: application/vnd.cncf.helm.config.v1+json`).
</details>

### Câu Hỏi 15: Ngoài việc cài theo digest, Helm hỗ trợ những cơ chế nào để ký và đảm bảo tính toàn vẹn cho chart?

<details>
<summary>Đáp án</summary>

Helm hỗ trợ hai cơ chế ký xác thực ngoài digest:
1. **Provenance (PGP)**: Sử dụng `helm package --sign` để tạo file `.prov` chứa chữ ký PGP. Khi đẩy chart lên OCI registry, file `.prov` nằm cạnh `.tgz` sẽ được đẩy kèm và có thể xác minh sau đó (`helm verify` / `--verify`).
2. **Sigstore**: Sử dụng plugin `helm-sigstore` để ký trực tiếp chart OCI bằng cùng bộ công cụ ký container image, thay thế cho mô hình provenance GPG truyền thống.
</details>
