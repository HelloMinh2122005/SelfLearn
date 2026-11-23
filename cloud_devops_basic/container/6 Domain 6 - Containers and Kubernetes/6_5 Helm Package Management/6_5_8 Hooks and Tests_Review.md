# Ôn Tập: 6_5_8 Hooks and Tests

### Câu Hỏi 1: Helm hook là gì, được khai báo như thế nào và có sử dụng được các đối tượng template của Helm không?

<details>
<summary>Đáp án</summary>

Helm hook là cơ chế cho phép người viết chart chèn các tác vụ vào những điểm xác định trong vòng đời của một release (ví dụ: sao lưu hoặc migrate database trước khi nâng cấp, dọn dẹp hoặc thông báo trước khi xóa release).

Về bản chất, hook chỉ là một manifest Kubernetes thông thường trong thư mục `templates/` nhưng được gắn thêm annotation đặc biệt `helm.sh/hook` (kèm tùy chọn `helm.sh/hook-weight` và `helm.sh/hook-delete-policy`). Vì là file template của Helm nên hook dùng được đầy đủ các đối tượng như `.Values`, `.Release`, `.Template`. Nếu một manifest không có annotation `helm.sh/hook`, resource đó là một phần thông thường của release.
</details>

### Câu Hỏi 2: Các giá trị `helm.sh/hook` phổ biến là gì và chúng chạy vào thời điểm nào? Hook `crd-install` có còn được sử dụng từ Helm 3 không?

<details>
<summary>Đáp án</summary>

Các giá trị `helm.sh/hook` có sẵn và thời điểm thực thi:
- `pre-install`: Sau khi render template, **trước khi** tạo bất kỳ resource nào của release.
- `post-install`: Sau khi **mọi** resource của release đã được nạp vào Kubernetes.
- `pre-upgrade`: Khi upgrade, sau khi render template và **trước khi** cập nhật bất kỳ resource nào.
- `post-upgrade`: Sau khi mọi resource của release đã được nâng cấp.
- `pre-rollback` / `post-rollback`: Trước / sau khi thực hiện rollback.
- `pre-delete` / `post-delete`: Khi xóa release, trước khi xóa / sau khi đã xóa hết resource.
- `test`: Khi người dùng chạy lệnh `helm test`.

Hook `crd-install` **đã bị gỡ bỏ từ Helm 3**, và được thay thế bằng thư mục `crds/` trong cấu trúc chart.
</details>

### Câu Hỏi 3: Một resource có thể gắn nhiều hook hoặc nhiều resource dùng chung một hook không? Chart cha có thể tắt hook của subchart không?

<details>
<summary>Đáp án</summary>

- Một resource **có thể gắn nhiều hook** bằng cách liệt kê phân tách bởi dấu phẩy, ví dụ: `"helm.sh/hook": post-install,post-upgrade`.
- **Nhiều resource có thể dùng chung một hook** (ví dụ cả một Secret và một ConfigMap đều gắn `pre-install`).
- Các hook khai báo bên trong **subchart vẫn được thực thi**, và chart cha **không có cách nào vô hiệu hóa** hook của subchart. Do đó trong thực tế cần đọc template của subchart trước khi thêm làm dependency hoặc chọn subchart cho phép cấu hình bật/tắt hook.
</details>

### Câu Hỏi 4: Khi chạy `helm install` cho một chart có `crds/`, hook `pre-install`, `post-install` và cờ `--wait`, thứ tự thực thi diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

Thứ tự thực thi theo tài liệu Helm:
1. Cài đặt các CRD nằm trong thư mục `crds/`.
2. Render template của chart.
3. Chuẩn bị chạy hook `pre-install`: sắp xếp các hook theo `weight` (từ âm đến dương), rồi theo `kind`, rồi theo tên; nạp resource có `weight` thấp nhất trước và **chờ hook ở trạng thái "Ready"** (các resource trong cùng hook chạy tuần tự theo weight).
4. Nạp các resource chính của release vào Kubernetes (vì có cờ `--wait` nên Helm sẽ chờ các resource của release Ready trước khi chuyển sang bước kế tiếp).
5. Chạy các hook `post-install` và chờ chúng Ready.
6. Trả kết quả về cho client.
</details>

### Câu Hỏi 5: Cơ chế "chặn" (blocking) và trạng thái "Ready" của Helm hook khác nhau như thế nào giữa `Job`/`Pod` và các loại resource (`kind`) khác?

<details>
<summary>Đáp án</summary>

Trạng thái "Ready" của hook phụ thuộc vào `kind` của resource:
- **Với `Job` hoặc `Pod`**: Helm **chặn** (client Helm tạm dừng) và chờ cho đến khi Job/Pod **chạy xong thành công**. Nếu Job/Pod hook thất bại thì **toàn bộ release cũng thất bại**.
- **Với các `kind` khác** (như ConfigMap, Secret...): được coi là Ready **ngay khi Kubernetes đánh dấu đã nạp** resource đó vào cluster.
</details>

### Câu Hỏi 6: Annotation `helm.sh/hook-weight` hoạt động ra sao (kiểu dữ liệu, giá trị mặc định, thứ tự sắp xếp)?

<details>
<summary>Đáp án</summary>

- **Kiểu dữ liệu và mặc định**: Giá trị của `helm.sh/hook-weight` phải viết dưới dạng **chuỗi** (ví dụ `"5"`, `"-5"`), không phải kiểu số nguyên. Nếu không khai báo, giá trị mặc định là `"0"`.
- **Thứ tự sắp xếp**: Helm sắp xếp các hook theo `weight` tăng dần (số âm chạy trước, số dương chạy sau). Nếu cùng `weight`, sẽ sắp xếp tiếp theo `kind`, rồi theo `name`.
- **Lưu ý phiên bản**: Từ Helm 3.2.0 trở đi, các hook có cùng `weight` được cài theo cùng thứ tự như resource thường (trước phiên bản 3.2.0 thứ tự này không được bảo đảm). Tài liệu Helm khuyến nghị nên **luôn đặt `hook-weight`** (đặt `"0"` nếu thứ tự không quan trọng).
</details>

### Câu Hỏi 7: `helm.sh/hook-delete-policy` gồm những giá trị nào, mặc định là gì, và nên chọn chính sách nào khi muốn giữ lại Job lỗi để debug?

<details>
<summary>Đáp án</summary>

`helm.sh/hook-delete-policy` hỗ trợ 3 giá trị (có thể kết hợp nhiều giá trị phân tách bằng dấu phẩy):
- `before-hook-creation`: Xóa resource hook **cũ trước khi** khởi chạy hook mới. Đây là **giá trị mặc định** nếu không khai báo annotation này.
- `hook-succeeded`: Xóa resource **sau khi hook chạy thành công**.
- `hook-failed`: Xóa resource **nếu hook chạy thất bại**.

Nếu muốn **giữ lại Job bị lỗi để điều tra/debug** nhưng vẫn đảm bảo gọn gàng khi thành công và không vướng ở lần chạy sau, hãy cấu hình: `before-hook-creation,hook-succeeded`. Khi đó Job thành công sẽ tự xóa ngay, Job thất bại được giữ lại để kiểm tra, và sẽ bị xóa trước lần chạy hook kế tiếp. Nếu không cần giữ Job lỗi để điều tra và muốn luôn sạch sau mỗi lần chạy, dùng cả ba: `before-hook-creation,hook-succeeded,hook-failed`.
</details>

### Câu Hỏi 8: Điều gì xảy ra nếu khai báo tường minh `helm.sh/hook-delete-policy` mà thiếu `before-hook-creation`? Làm sao để giảm rủi ro xung đột tên Job hook ở các lần upgrade sau?

<details>
<summary>Đáp án</summary>

Nếu khai báo tường minh `helm.sh/hook-delete-policy` mà **không** có `before-hook-creation` (ví dụ chỉ ghi `hook-succeeded`), thì resource hook từ lần chạy trước (chẳng hạn một Job bị lỗi được giữ lại) **sẽ không bị xóa trước khi** hook mới khởi chạy. Theo suy luận nêu trong bài, vì tên đối tượng Kubernetes phải duy nhất nên Job cũ cùng tên còn sót lại có thể gây lỗi `"already exists"` và làm chặn lần upgrade sau.

Để phòng tránh trong thực tế:
1. Luôn đưa `before-hook-creation` vào `helm.sh/hook-delete-policy`.
2. Đặt thêm `ttlSecondsAfterFinished` trên Job để Kubernetes tự dọn ngay cả khi Job lỗi.
3. Đưa `{{ .Release.Revision }}` vào tên Job (ví dụ `...-migrate-{{ .Release.Revision }}`) để mỗi revision tạo một tên Job riêng biệt, tránh va chạm tên.
</details>

### Câu Hỏi 9: Tại sao `helm uninstall` không xóa các resource do hook tạo ra? Có những cách nào để dọn dẹp hoặc chủ động giữ lại chúng?

<details>
<summary>Đáp án</summary>

Theo tài liệu Helm, tài nguyên do hook tạo ra **không được theo dõi và quản lý như một phần của release**. Sau khi Helm xác nhận hook đã Ready thì sẽ "bỏ mặc" resource đó. Hệ quả là lệnh `helm uninstall` **không xóa** các hook resource còn tồn tại trong cluster.

- **Cách dọn dẹp**:
  - Cấu hình `helm.sh/hook-delete-policy` (`before-hook-creation`, `hook-succeeded`, `hook-failed`).
  - Đặt trường `ttlSecondsAfterFinished` cho Kubernetes `Job` để cluster tự dọn sau khi Job kết thúc.
  - Dọn thủ công bằng `kubectl delete` (ví dụ lọc theo label `app.kubernetes.io/instance=<release>`).
- **Cách giữ lại vĩnh viễn**: Nếu có resource cần giữ mãi và không muốn bị xóa, gắn annotation `helm.sh/resource-policy: keep`.
</details>

### Câu Hỏi 10: Khi dùng Job `pre-upgrade` để migrate database, điều gì xảy ra nếu Job thất bại? Vì sao script migration phải đảm bảo tính tương thích ngược và idempotent?

<details>
<summary>Đáp án</summary>

- **Khi Job `pre-upgrade` thất bại**: Vì hook Job là thao tác chặn, Helm sẽ **dừng quá trình upgrade và đánh dấu release thất bại**. Do các resource của release **chưa bị cập nhật**, các Pod phiên bản cũ của ứng dụng **vẫn tiếp tục chạy và phục vụ traffic**.
- **Tính tương thích ngược (expand/contract)**: Trong lúc hook `pre-upgrade` chạy migration, phiên bản ứng dụng cũ vẫn đang phục vụ người dùng. Nếu migration xóa hoặc sửa phá vỡ cấu trúc (ví dụ xóa cột) ngay lập tức, ứng dụng cũ sẽ lỗi. Vì vậy phải áp dụng mẫu expand/contract: bước 1 chỉ thêm (tương thích cả bản cũ và bản mới), bước 2 (ở release sau khi bản cũ không còn chạy) mới dọn phần cũ.
- **Tính idempotent (lũy đẳng)**: Hook có thể chạy lại nhiều lần (do `backoffLimit` retry, chạy lại upgrade, hoặc Job gắn cả `pre-install,pre-upgrade`). Migration phải chạy lại nhiều lần mà không gây lỗi hay sai lệch dữ liệu (nên dùng công cụ có bảng theo dõi phiên bản như Flyway/Liquibase thay vì script SQL thô).
</details>

### Câu Hỏi 11: Cần kết hợp những cờ Helm và tham số Job Kubernetes nào để tự động rollback khi hook thất bại và tránh tình trạng hook làm treo pipeline?

<details>
<summary>Đáp án</summary>

- **Tự động rollback khi hook thất bại**: Khi hook thất bại làm release thất bại, kết hợp cờ `--wait` cùng với `--rollback-on-failure` (trên **Helm 4**) hoặc `--atomic` (trên **Helm 3**) để Helm tự động rollback release.
- **Tránh treo pipeline**: Vì Job/Pod hook làm client Helm tạm dừng chờ, cờ `--timeout` của Helm áp dụng cho các thao tác chờ phía Kubernetes (bao gồm chờ hook Job). Do đó cần:
  - Đặt `--timeout` hợp lý trên lệnh `helm upgrade` / `helm install`.
  - Cấu hình `activeDeadlineSeconds` và `backoffLimit` (cùng `restartPolicy: Never` hoặc `OnFailure`) trong `spec` của Job để giới hạn thời gian chạy và số lần thử lại.
</details>

### Câu Hỏi 12: Một bài test trong `helm test` được định nghĩa như thế nào, điều kiện đạt là gì, và các cờ hữu ích khi chạy `helm test` là gì?

<details>
<summary>Đáp án</summary>

- **Định nghĩa và điều kiện đạt**: Một `helm test` là một workload (thường là `Pod` hoặc `Job`) nằm trong `templates/` (ví dụ `helm create` sinh sẵn `templates/tests/test-connection.yaml` dùng `busybox` chạy `wget` kiểm tra Service) và bắt buộc có annotation `"helm.sh/hook": test` (phiên bản trước Helm 3 dùng `test-success`/`test-failure`; hiện `test-success` vẫn được chấp nhận để tương thích). Test được coi là **đạt** khi container thoát với **mã thoát `0`** (ví dụ Pod ở trạng thái `Phase: Succeeded`).
- **Cách chạy và các cờ hữu ích** (chạy trên release đã ở trạng thái `deployed`):
  - `helm test <RELEASE>`: Chạy toàn bộ test của release.
  - `--logs`: In log của Pod test sau khi chạy xong, trước khi dọn dẹp.
  - `--filter name=...`: Chỉ chạy test khớp theo tên được chỉ định.
  - `--timeout`: Thời gian chờ tối đa (mặc định là `5m0s`).
- **Nội dung nên kiểm thử**: Kiểm tra cấu hình từ `values.yaml` đã được đưa vào đúng chưa, kiểm tra luồng đăng nhập đúng/sai, và kiểm tra Service phản hồi/cân bằng tải.
</details>

### Câu Hỏi 13: Tại sao chạy `helm test` ngay sau `helm install` dễ gặp lỗi giả, và quy trình chuẩn trong CI cũng như cách kiểm tra hook khi chưa có cluster là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân lỗi giả**: Tài liệu Helm cảnh báo nếu chạy `helm test` ngay sau khi cài đặt, các Pod ứng dụng chính có thể chưa ở trạng thái Ready nên test gọi vào Service bị lỗi tạm thời dù chart cài đặt không sai.
- **Quy trình chuẩn trong CI**: Luôn dùng `helm upgrade --install <release> <chart> --wait` ở bước deploy để chờ toàn bộ workload sẵn sàng trước, sau đó mới chạy `helm test <release>` (và bản thân script test cũng nên có cơ chế retry ngắn).
- **Kiểm tra khi chưa có cluster**: Dùng `helm lint` để kiểm tra lỗi cú pháp/quy chuẩn chart, và dùng `helm template <release> <chart> --show-only templates/<file-hook>.yaml` để render trước manifest của hook và kiểm tra tên, annotation, giá trị truyền vào.
</details>

### Câu Hỏi 14: Khi triển khai Helm chart qua Argo CD, các Helm hook được xử lý thế nào và có những hạn chế/cảnh báo quan trọng nào?

<details>
<summary>Đáp án</summary>

Vì Argo CD chỉ dùng `helm template` để render chart rồi tự áp dụng lên cluster nên Helm không trực tiếp chạy hook; thay vào đó Argo CD ánh xạ một số annotation Helm hook sang cơ chế hook của Argo CD:
- `pre-install`, `pre-upgrade` ➔ `PreSync`
- `post-install`, `post-upgrade` ➔ `PostSync`
- `pre-delete` / `post-delete` ➔ `PreDelete` / `PostDelete`
- `helm.sh/hook-weight` ➔ `sync-wave`
- `pre-rollback`, `post-rollback`, `test` (`test-success`/`test-failure`) ➔ **Không hỗ trợ (bị bỏ qua)**.

**Các cảnh báo quan trọng từ tài liệu Argo CD**:
1. Đây chỉ là **tương thích ở mức annotation**, không bảo đảm ngữ nghĩa hoạt động giống hệt Helm.
2. Nếu bạn định nghĩa **bất kỳ hook Argo CD nào** (`argocd.argoproj.io/hook`), **mọi Helm hook sẽ bị bỏ qua**.
3. Argo CD không phân biệt "install" hay "upgrade" (mọi thao tác đều là `sync`), nên theo mặc định cả `pre-install` và `pre-upgrade` sẽ **chạy cùng lúc** khi sync.
</details>
