# 04. Helm

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.
> **Phiên bản:** Helm 4 ra mắt 11/2025. Helm 3 vẫn phổ biến ở nhiều công ty. Khi một chi tiết khác nhau giữa hai bản, đáp án sẽ ghi rõ.

---

### 1. What is Helm and what problem does it solve?
<details><summary>Đáp án</summary>

Helm là **package manager cho Kubernetes**. Nó giải quyết ba vấn đề:
- **Template hóa**: một bộ manifest dùng cho nhiều môi trường hoặc nhiều service, chỉ khác `values`.
- **Đóng gói và phân phối**: chart có version, đẩy lên repository hoặc OCI registry.
- **Quản lý vòng đời release**: install, upgrade, **lịch sử revision**, **rollback**, uninstall như một đơn vị.
</details>

### 2. Define chart, release, revision and repository.
<details><summary>Đáp án</summary>

- **Chart**: gói chứa template và giá trị mặc định.
- **Release**: một **lần cài** chart vào cluster, có tên và namespace. Cùng một chart có thể cài nhiều release.
- **Revision**: mỗi lần install, upgrade hoặc rollback tạo ra một revision mới (1, 2, 3...).
- **Repository**: nơi lưu chart (repo HTTP có `index.yaml`, hoặc OCI registry).
</details>

### 3. Describe the structure of a chart.
<details><summary>Đáp án</summary>

```text
mychart/
├── Chart.yaml          # metadata: apiVersion v2, name, version, appVersion, dependencies
├── values.yaml         # giá trị mặc định
├── values.schema.json  # (tùy chọn) JSON Schema để kiểm tra values
├── charts/             # subchart / dependency đã tải về
├── crds/               # CRD (được xử lý đặc biệt)
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── _helpers.tpl    # template dùng chung; file bắt đầu bằng "_" không render ra manifest
│   ├── NOTES.txt       # hướng dẫn in ra sau khi cài
│   └── tests/          # Pod test cho helm test
└── Chart.lock          # khóa phiên bản dependency
```
</details>

### 4. What is the difference between `version` and `appVersion` in `Chart.yaml`?
<details><summary>Đáp án</summary>

- `version`: phiên bản của **chart**, bắt buộc theo **SemVer 2**. Tăng mỗi khi template hoặc giá trị mặc định thay đổi.
- `appVersion`: phiên bản của **ứng dụng** bên trong, chỉ mang tính thông tin. Thường được dùng làm tag image mặc định (`.Chart.AppVersion`).
- Hai version này độc lập: sửa chart không đổi app thì chỉ tăng `version`.
</details>

### 5. How does Helm 3/4 differ from Helm 2? Where is release state stored?
<details><summary>Đáp án</summary>

- Helm 2 có **Tiller** chạy trong cluster với quyền rất rộng. Helm 3 **bỏ Tiller**: client gọi thẳng API server bằng quyền của kubeconfig, nên dùng được RBAC.
- Thông tin release lưu dưới dạng **Secret** (type `helm.sh/release.v1`) trong **namespace của release**, mỗi revision một Secret (`sh.helm.release.v1.<name>.v<rev>`).
- Helm 3 dùng **three-way merge** khi upgrade.
- `Chart.yaml` dùng `apiVersion: v2`, dependency khai báo ngay trong `Chart.yaml` thay vì `requirements.yaml`.
</details>

### 6. Explain Helm's three-way strategic merge on upgrade.
<details><summary>Đáp án</summary>

Khi upgrade, Helm so sánh **ba** nguồn: manifest của **revision cũ**, **trạng thái thực tế** trong cluster, và manifest **mới**. Nhờ vậy, nếu ai đó sửa tay trong cluster (ví dụ `kubectl edit` đổi replicas) và chart mới đặt lại giá trị đó, Helm vẫn phát hiện và ghi đè đúng. Với cách so hai chiều (cũ và mới) như Helm 2, thay đổi tay sẽ bị bỏ sót.
</details>

### 7. What is the precedence order of values?
<details><summary>Đáp án</summary>

Từ thấp tới cao, **cái sau ghi đè cái trước**:
1. `values.yaml` trong chart.
2. `values.yaml` của chart cha (với subchart).
3. File truyền bằng `-f/--values`. Nhiều file thì **file bên phải thắng**.
4. `--set`, `--set-string`, `--set-file`, `--set-json`.

Ví dụ: `helm upgrade --install api ./chart -f values.yaml -f values-prod.yaml --set image.tag=$CI_COMMIT_SHORT_SHA`.
</details>

### 8. `-f values.yaml` vs `--set`: when would you use each?
<details><summary>Đáp án</summary>

- `-f`: cấu hình **ổn định theo môi trường** (`values-dev.yaml`, `values-prod.yaml`), lưu trong Git, review được.
- `--set`: giá trị **động lúc deploy**, ví dụ tag image theo commit SHA.
- Tránh nhồi quá nhiều `--set` vì khó đọc và khó audit. Cú pháp với list hoặc ký tự đặc biệt dễ sai (dấu phẩy, dấu chấm trong key phải escape). Không truyền secret bằng `--set` vì có thể lộ trong log hoặc lịch sử shell.
</details>

### 9. What do `--reuse-values` and `--reset-values` do? What is the risk of `--reuse-values`?
<details><summary>Đáp án</summary>

- `--reuse-values`: lấy values của **release trước** rồi merge override mới vào.
- `--reset-values`: bỏ values cũ, chỉ dùng giá trị mặc định của chart cộng với override mới.
- Rủi ro của `--reuse-values`: **giá trị mặc định mới của chart bị bỏ qua**. Chart phiên bản mới thêm key mà values cũ không có thì có thể render lỗi hoặc thiếu cấu hình. Trong CI nên **luôn truyền đủ file values một cách tường minh** để mỗi lần deploy cho cùng kết quả (reproducible).
</details>

### 10. Explain `helm install`, `helm upgrade`, and `helm upgrade --install`.
<details><summary>Đáp án</summary>

- `install`: tạo release mới. Lỗi nếu tên release đã tồn tại.
- `upgrade`: nâng cấp release đã có. Lỗi nếu chưa tồn tại.
- `upgrade --install`: chưa có thì cài, có rồi thì nâng cấp. **Idempotent**, là lệnh chuẩn trong pipeline CI/CD.
- Hay đi kèm: `-n <ns> --create-namespace --wait --timeout 10m`.
</details>

### 11. What do `--wait` and `--timeout` do? Does Helm wait by default?
<details><summary>Đáp án</summary>

- Không có `--wait`, Helm báo **thành công ngay khi API server nhận manifest**, dù Pod có crash.
- `--wait`: chờ tới khi resource sẵn sàng (Pod Ready, Deployment đủ replica sẵn sàng, Service có IP, PVC đã bind...) trong thời gian `--timeout` (mặc định **5 phút**).
- Hết timeout thì release bị đánh dấu `failed`.
- Trong CI nên dùng `--wait` để pipeline phản ánh đúng trạng thái deploy.
</details>

### 12. What does `--atomic` (Helm 3) / `--rollback-on-failure` (Helm 4) do?
<details><summary>Đáp án</summary>

Nếu upgrade thất bại (bao gồm cả timeout khi chờ), Helm **tự rollback về revision trước** (với install thì tự gỡ release). Flag này tự bật `--wait`.
- **Helm 4 đổi tên** `--atomic` thành `--rollback-on-failure`. Tên cũ vẫn chạy nhưng in cảnh báo deprecated. Hãy kiểm tra bằng `helm upgrade --help` của đúng binary đang dùng.
- Ưu điểm: môi trường tự quay về trạng thái tốt. Nhược điểm: các Pod lỗi bị xóa nhanh nên khó điều tra. Có thể lưu lại `kubectl describe` và log trong bước `after_script` của CI.
</details>

### 13. How do you roll back a bad release and verify you're on the right version?
<details><summary>Đáp án</summary>

```bash
helm history api -n prod             # danh sách revision, trạng thái, chart version, app version
helm rollback api 7 -n prod --wait   # về revision 7; bỏ số revision thì về revision trước
helm status api -n prod
helm get values api -n prod --revision 7
kubectl get deploy api -n prod -o jsonpath='{..image}'
```
- Rollback **tạo revision mới** (ví dụ 9) có nội dung giống revision 7, không xóa lịch sử.
- Để chắc chắn về phiên bản: tag image theo commit SHA hoặc digest, và ghi build id hoặc commit vào annotation.
</details>

### 14. Helm says: `UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress`. What happened and how do you fix it?
<details><summary>Đáp án</summary>

Một lần chạy trước bị **ngắt giữa chừng** (job CI bị cancel, runner chết, timeout của CI ngắn hơn timeout của Helm), để lại release ở trạng thái `pending-install`, `pending-upgrade` hoặc `pending-rollback`.
- Kiểm tra bằng `helm history`.
- Cách xử lý thường dùng: `helm rollback <release> <revision-deployed-gần-nhất>`.
- Nếu là `pending-install` của lần cài đầu: `helm uninstall` rồi cài lại.
- Phòng ngừa:
  - Timeout của job CI phải lớn hơn timeout của Helm.
  - Dùng `resource_group` trong GitLab để không có hai job deploy cùng release chạy song song.
  - Không đặt `interruptible` cho job deploy.
</details>

### 15. How do you validate a chart before deploying it?
<details><summary>Đáp án</summary>

- `helm lint ./chart -f values-prod.yaml`: lỗi cú pháp và các vấn đề phổ biến.
- `helm template api ./chart -f values-prod.yaml`: render YAML **tại máy local**, không cần cluster. Có thể pipe sang `kubeconform` hoặc `kubectl apply --dry-run=server -f -`.
- `helm upgrade --install ... --dry-run`: mô phỏng. `--dry-run=server` cho phép kết nối cluster (để `lookup` hoạt động).
- `values.schema.json`: Helm kiểm tra values theo schema khi `install`, `upgrade`, `lint`, `template`.
- Plugin bên thứ ba `helm diff upgrade`: xem trước thay đổi so với release đang chạy.
</details>

### 16. Explain the built-in objects available in templates.
<details><summary>Đáp án</summary>

- `.Values`: values sau khi merge.
- `.Release`: `.Name`, `.Namespace`, `.Revision`, `.IsInstall`, `.IsUpgrade`, `.Service`.
- `.Chart`: nội dung `Chart.yaml` (`.Chart.Name`, `.Chart.Version`, `.Chart.AppVersion`).
- `.Capabilities`: phiên bản Kubernetes, các API version có sẵn.
- `.Template`: `.Name`, `.BasePath`.
- `.Files`: đọc file không phải template trong chart (`.Files.Get`, `.Files.Glob`).
</details>

### 17. Explain `include` vs `template`, and why `include` is preferred.
<details><summary>Đáp án</summary>

Cả hai đều gọi một named template đã `define`. **`template` là action**, không trả về giá trị nên **không pipe được**. **`include` là function** trả về chuỗi, nên pipe được sang `nindent`, `quote`:
```yaml
metadata:
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
```
</details>

### 18. Explain `range`, `with`, `if` and the `$` variable.
<details><summary>Đáp án</summary>

```yaml
{{- if .Values.ingress.enabled }}
...
{{- end }}

env:
{{- range $key, $val := .Values.env }}
  - name: {{ $key }}
    value: {{ $val | quote }}
{{- end }}

{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}
```
- `range` lặp qua list hoặc map.
- `with` **đổi scope** (`.` trỏ vào giá trị đó) và bỏ qua block nếu giá trị rỗng.
- Bên trong `range` hoặc `with`, `.` đã bị đổi nghĩa, nên muốn truy cập gốc phải dùng **`$`** (ví dụ `$.Release.Name`).
</details>

### 19. What are `default`, `required`, `quote`, `toYaml`, `nindent`, `tpl`?
<details><summary>Đáp án</summary>

- `default "x" .Values.a`: giá trị mặc định nếu `a` rỗng.
- `required "image.tag is required" .Values.image.tag`: dừng render kèm thông báo nếu thiếu.
- `quote`: bọc chuỗi trong dấu nháy, tránh YAML hiểu `true` hoặc `1.10` thành bool hoặc số.
- `toYaml`: chuyển object thành YAML. `nindent N` xuống dòng rồi thụt N khoảng trắng.
- `tpl`: render một **chuỗi** như template (cho phép values chứa `{{ }}`).
</details>

### 20. What does `{{-` and `-}}` mean?
<details><summary>Đáp án</summary>

Xóa khoảng trắng và xuống dòng ở **bên trái** (`{{-`) hoặc **bên phải** (`-}}`) của action. Dùng sai sẽ gây lỗi thụt lề YAML hoặc dính dòng. Đây là nguồn lỗi render phổ biến nhất. Luôn kiểm tra bằng `helm template`.
</details>

### 21. How do you force Pods to restart when a ConfigMap rendered by the chart changes?
<details><summary>Đáp án</summary>

Thêm checksum của ConfigMap vào annotation của **Pod template**:
```yaml
spec:
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
```
Nội dung ConfigMap đổi thì checksum đổi, Pod template đổi, và Deployment tự rolling update.
</details>

### 22. How do you manage dev/staging/prod with Helm?
<details><summary>Đáp án</summary>

- **Một chart** dùng cho mọi môi trường. Mỗi môi trường **một file values** (`values-dev.yaml`, `values-prod.yaml`) chỉ chứa phần khác biệt: replicas, resources, host của ingress, endpoint.
- Không copy chart cho từng môi trường.
- Secret không đặt trong values ở Git. Dùng External Secrets, Vault hoặc SOPS.
- Có thể dùng Helmfile, hoặc GitOps (Flux `HelmRelease`, Argo CD `Application`) để khai báo release cho từng cluster.
</details>

### 23. How do chart dependencies (subcharts) work? How do you override a subchart's values?
<details><summary>Đáp án</summary>

```yaml
# Chart.yaml
dependencies:
  - name: kafka
    version: "x.y.z"
    repository: "oci://registry.example.com/charts"
    condition: kafka.enabled
```
- `helm dependency update` tải chart vào `charts/` và ghi `Chart.lock`. `helm dependency build` tải lại theo lock.
- Override value của subchart: đặt dưới **key trùng tên subchart** (hoặc `alias`) trong values của chart cha:
```yaml
kafka:
  enabled: true
  replicaCount: 3
```
- Subchart **không đọc được** values của chart cha, trừ phần **`global`**.
</details>

### 24. What are `global` values?
<details><summary>Đáp án</summary>

Values đặt dưới `global:` có thể truy cập ở **chart cha và mọi subchart** qua `.Values.global.xxx`. Hay dùng cho registry chung, `imagePullSecrets`, tên môi trường.
</details>

### 25. What is a library chart?
<details><summary>Đáp án</summary>

Chart có `type: library` trong `Chart.yaml`. Nó **chỉ chứa named template**, không tự render ra resource và không cài trực tiếp được. Dùng để chia sẻ template chuẩn (Deployment, Service, labels, probe) cho **nhiều microservice**, tránh mỗi team viết một kiểu. Rất phù hợp với nền tảng có hàng chục service.
</details>

### 26. Explain Helm hooks. Give an example use case.
<details><summary>Đáp án</summary>

Hook là resource có annotation `helm.sh/hook`, chạy ở các thời điểm: `pre-install`, `post-install`, `pre-upgrade`, `post-upgrade`, `pre-rollback`, `post-rollback`, `pre-delete`, `post-delete`, `test`.
- Ví dụ: Job **migration DB** ở `pre-upgrade`. Job fail thì upgrade dừng.
- `helm.sh/hook-weight` sắp thứ tự, `helm.sh/hook-delete-policy` (`before-hook-creation` là mặc định, `hook-succeeded`, `hook-failed`) quyết định khi nào xóa.
- Resource hook **không được quản lý như một phần của release** (không bị xóa khi uninstall).
</details>

### 27. How does `helm test` work?
<details><summary>Đáp án</summary>

Trong `templates/tests/` đặt Pod hoặc Job có annotation `"helm.sh/hook": test`. Ví dụ Pod chạy `curl http://{{ include "x.fullname" . }}:8080/actuator/health`. `helm test <release>` chạy các Pod đó, exit code 0 là pass. Đây là cách đơn giản để làm **smoke test sau deploy** trong pipeline.
</details>

### 28. How does Helm handle CRDs?
<details><summary>Đáp án</summary>

CRD đặt trong thư mục `crds/` được cài khi **install**, nhưng Helm **không upgrade và không xóa** chúng, để tránh mất toàn bộ custom resource. Muốn nâng cấp CRD phải làm riêng (`kubectl apply` hoặc server-side apply), hoặc đặt CRD trong một chart riêng do bạn tự quản lý vòng đời.
</details>

### 29. What does the annotation `helm.sh/resource-policy: keep` do?
<details><summary>Đáp án</summary>

Resource có annotation này **không bị xóa** khi `helm uninstall` (hoặc khi upgrade mà resource không còn trong chart). Hay dùng cho PVC hoặc Secret quan trọng. Lưu ý: resource đó trở thành "mồ côi", nên cài lại release cùng tên có thể bị xung đột.
</details>

### 30. How do you publish and consume charts from an OCI registry such as GitLab?
<details><summary>Đáp án</summary>

```bash
helm package ./chart                                  # tạo chart-1.2.3.tgz
helm registry login registry.gitlab.com -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD
helm push chart-1.2.3.tgz oci://registry.gitlab.com/group/project/charts
helm upgrade --install api oci://registry.gitlab.com/group/project/charts/chart --version 1.2.3
```
OCI được hỗ trợ chính thức (GA) từ Helm 3.8. GitLab cũng có **Helm chart repository** trong Package Registry.
</details>

### 31. What information can you get with `helm get`?
<details><summary>Đáp án</summary>

- `helm get values <rel>`: values do người dùng truyền vào. Thêm `--all` để xem values cuối cùng sau merge.
- `helm get manifest <rel>`: YAML đã render và áp dụng.
- `helm get notes`, `helm get hooks`, `helm get all`.
- Thêm `--revision N` để xem revision cũ.
- Đây là các lệnh hàng đầu khi điều tra deploy sai cấu hình.
</details>

### 32. What is the `lookup` function and what is its limitation?
<details><summary>Đáp án</summary>

`lookup` đọc resource **đang có trong cluster** khi render, ví dụ giữ lại mật khẩu đã sinh ở lần cài trước. Hạn chế: khi chạy `helm template` hoặc `--dry-run` phía client, Helm **không kết nối cluster** nên `lookup` trả về rỗng. Logic dựa vào `lookup` vì thế khó test và không hoàn toàn khai báo (declarative). Với GitOps (Argo CD render bằng `helm template`) nó cũng không hoạt động như mong đợi.
</details>

### 33. Helm vs Kustomize: when would you choose each?
<details><summary>Đáp án</summary>

- **Helm**: template + package + vòng đời release (rollback, hooks). Phù hợp phân phối chart cho nhiều team và chart cho phần mềm bên thứ ba (Kafka, Prometheus).
- **Kustomize** (tích hợp sẵn `kubectl apply -k`): không dùng template, **patch** YAML gốc theo overlay cho từng môi trường. Dễ đọc, nhưng không có khái niệm release hay rollback.
- Có thể kết hợp: render bằng Helm rồi patch bằng Kustomize, hoặc Argo CD/Flux hỗ trợ cả hai.
</details>

### 34. Your chart deploys 20 microservices that share 90% of their manifests. How would you structure it?
<details><summary>Đáp án</summary>

- **Library chart** chung (Deployment, Service, HPA, PDB, probe, labels chuẩn, securityContext). Mỗi service là một chart mỏng `include` từ library, với values riêng.
- Hoặc một **chart dùng chung** cho mọi service, mỗi service một release với values khác nhau.
- Phiên bản hóa library chart. Nâng library thì kiểm tra toàn bộ service bằng `helm template` + kubeconform trong CI.
- Umbrella chart (gom 20 service làm subchart) **khó deploy độc lập** từng service, nên chỉ dùng khi muốn phát hành cả nền tảng như một khối.
</details>

### 35. A colleague ran `kubectl edit` on a Helm-managed Deployment in production. What problems does this cause?
<details><summary>Đáp án</summary>

- **Drift**: Git và chart không còn phản ánh thực tế.
- Lần `helm upgrade` sau có thể ghi đè thay đổi đó (three-way merge sẽ đưa field về giá trị của chart nếu chart có quản lý field đó). Lỗi đã "vá tay" có thể quay lại.
- Rollback cũng không có thay đổi tay đó.
- Nguyên tắc: mọi thay đổi đi qua Git và pipeline. GitOps (Flux, Argo CD) tự phát hiện và sửa drift.
</details>

### 36. How do you name releases and why does the 53-character limit matter?
<details><summary>Đáp án</summary>

Tên release tối đa **53 ký tự** và phải theo chuẩn tên DNS. Tên release thường được ghép vào tên resource (`<release>-<chart>`), mà nhiều tên resource của Kubernetes giới hạn 63 ký tự. Helper chuẩn (`fullname`) cắt bớt bằng `trunc 63 | trimSuffix "-"`. Quy ước tên nên ổn định, ví dụ `<service>` trong namespace `<env>`, để pipeline luôn upgrade đúng release.
</details>

### 37. What are the main changes in Helm 4 that a CI pipeline maintainer should know?
<details><summary>Đáp án</summary>

Thay đổi có xác nhận từ tài liệu chính thức: một số flag **đổi tên**, ví dụ `--atomic` → `--rollback-on-failure` và `--force` → `--force-replace`. Tên cũ vẫn dùng được nhưng có cảnh báo. Helm 4 cũng có thay đổi về hệ thống plugin và hướng tới server-side apply.

**Cần đối chiếu** với trang [Helm 4 Overview](https://helm.sh/docs/overview/) và [changelog](https://helm.sh/docs/changelog/) trước khi nâng cấp. Trong pipeline nên **ghim phiên bản binary Helm** (image CI có tag cố định) để không bị đổi hành vi bất ngờ.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Helm Charts](https://helm.sh/docs/topics/charts/): cấu trúc chart, `Chart.yaml`, dependency, library chart, CRD.
- [Values Files](https://helm.sh/docs/chart_template_guide/values_files/): thứ tự ưu tiên của values.
- [Built-in Objects](https://helm.sh/docs/chart_template_guide/builtin_objects/): `.Release`, `.Chart`, `.Capabilities`.
- [Flow Control](https://helm.sh/docs/chart_template_guide/control_structures/): `if`, `with`, `range`, khoảng trắng.
- [Named Templates](https://helm.sh/docs/chart_template_guide/named_templates/): `define`, `include`, `template`.
- [Subcharts and Global Values](https://helm.sh/docs/chart_template_guide/subcharts_and_globals/): subchart và `global`.
- [Chart Hooks](https://helm.sh/docs/topics/charts_hooks/): hook, weight, delete policy.
- [Chart Tests](https://helm.sh/docs/topics/chart_tests/): `helm test`.
- [Chart Development Tips and Tricks](https://helm.sh/docs/howto/charts_tips_and_tricks/): checksum annotation, `resource-policy: keep`.
- [Use OCI-based registries](https://helm.sh/docs/topics/registries/): OCI registry.
- [helm upgrade](https://helm.sh/docs/helm/helm_upgrade/) và [helm rollback](https://helm.sh/docs/helm/helm_rollback/): tham chiếu lệnh.
- [Helm 4 Overview](https://helm.sh/docs/overview/) và [Helm 4 Changelog](https://helm.sh/docs/changelog/): thay đổi ở Helm 4.
