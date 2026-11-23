# Ôn Tập: 6_6_8 Release Strategies and Rollback

### Câu Hỏi 1: Thách thức lớn nhất khi đưa phiên bản mới của một dịch vụ lên môi trường phục vụ người dùng thật là gì, và điều gì xảy ra nếu thực hiện sai cách?

<details>
<summary>Đáp án</summary>

Hai thách thức lớn nhất là **chuyển lưu lượng không gián đoạn** và **quay đầu an toàn (rollback)** khi có lỗi:
- Nếu tắt bản cũ rồi mới bật bản mới, người dùng đang truy cập sẽ bị mất kết nối.
- Nếu đẩy toàn bộ lưu lượng sang bản mới cùng lúc mà không có đường lui, chỉ một lỗi nhỏ cũng sẽ làm gián đoạn toàn bộ hệ thống.
</details>

### Câu Hỏi 2: Rolling Update trong Kubernetes `Deployment` hoạt động như thế nào và có ưu/nhược điểm gì về tài nguyên cũng như tốc độ rollback?

<details>
<summary>Đáp án</summary>

- **Cơ chế**: Đây là chiến lược mặc định của Kubernetes `Deployment` (`spec.strategy.type: RollingUpdate`). Kubernetes tạo một ReplicaSet mới và thay dần từng Pod cũ bằng Pod mới mà không cần tầng định tuyến riêng.
- **Tài nguyên thêm**: Thấp (chỉ cần thêm tài nguyên theo cấu hình `maxSurge`).
- **Tốc độ rollback**: Trung bình (do phải thay dần các Pod quay lại phiên bản trước).
</details>

### Câu Hỏi 3: Trong cấu hình `RollingUpdate`, hai tham số `maxUnavailable` và `maxSurge` kiểm soát điều gì, và dùng lệnh nào để theo dõi quá trình này?

<details>
<summary>Đáp án</summary>

- `maxUnavailable`: Quy định số lượng hoặc tỷ lệ Pod tối đa được phép vắng mặt (không sẵn sàng) trong quá trình cập nhật.
- `maxSurge`: Quy định số lượng hoặc tỷ lệ Pod tối đa được phép tạo thêm vượt quá số `replicas` mong muốn trong lúc thay thế.
- Để theo dõi tiến trình thay thế Pod cho tới khi tất cả replica mới sẵn sàng, dùng lệnh: `kubectl rollout status deployment/<tên-deployment>` (ví dụ: `kubectl rollout status deployment/hello-svc`).
</details>

### Câu Hỏi 4: Chiến lược Blue/Green vận hành ra sao, mang lại lợi thế gì khi rollback và cần lưu ý cạm bẫy chi phí nào trong thực tế?

<details>
<summary>Đáp án</summary>

- **Cơ chế**: Chạy song song hai phiên bản hoàn chỉnh (bản đang phục vụ và bản mới), sau đó chuyển toàn bộ 100% lưu lượng trong một thao tác duy nhất bằng cách đổi `selector` của Kubernetes `Service`, cập nhật đích trên router, hoặc chỉnh `weight` từ `100/0` sang `0/100` trên `HTTPRoute`.
- **Lợi thế rollback**: Cho phép quay lui gần như tức thì bằng cách trỏ lưu lượng ngược lại về bản cũ.
- **Cạm bẫy chi phí**: Đòi hỏi gấp đôi (~2x) tài nguyên tính toán trong lúc cả hai bản cùng chạy. Trong thực tế sản xuất, không nên giữ song song hai cụm tải lớn quá lâu mà cần thu hồi môi trường cũ sau khi kết thúc cửa sổ theo dõi ổn định.
</details>

### Câu Hỏi 5: Chiến lược Canary giải quyết bài toán gì so với Blue/Green, và trong Kubernetes Gateway API cần cấu hình `HTTPRoute` như thế nào để chia lưu lượng Canary?

<details>
<summary>Đáp án</summary>

- **Bài toán giải quyết**: Canary chuyển trước một tỷ lệ nhỏ lưu lượng thật (như 5%–10%) sang bản mới để kiểm tra lỗi trước khi tăng dần lên 100%. Cách này giúp giới hạn bán kính ảnh hưởng mà không cần nhân đôi hạ tầng (tài nguyên thêm ở mức thấp đến trung bình), đồng thời rollback nhanh bằng cách đưa trọng số về `0`.
- **Cấu hình Gateway API**: Trên `HTTPRoute`, bạn chia tỷ lệ lưu lượng qua trường `weight` ở mỗi mục trong `backendRefs`. Tỷ lệ lưu lượng đi vào từng backend bằng `weight` của backend đó chia cho tổng `weight` trong rule (ví dụ `weight: 90` cho v1 và `weight: 10` cho v2 sẽ chia 90%/10%).
- *(Nâng cao)*: Để tự động hóa việc tăng dần trọng số Canary theo metric lỗi/độ trễ và tự hủy (abort) khi vượt ngưỡng, có thể dùng các công cụ như **Argo Rollouts** hoặc **Flagger**.
</details>

### Câu Hỏi 6: Sự khác biệt giữa Deploy và Release là gì, và Feature Flag giúp tách biệt hai khái niệm này như thế nào?

<details>
<summary>Đáp án</summary>

- **Deploy**: Là hành động đưa code mới lên server/hạ tầng chạy.
- **Release**: Là hành động bật tính năng mới đó cho người dùng sử dụng.
- **Vai trò của Feature Flag**: Là công tắc điều khiển tại thời điểm chạy (runtime), giúp tách biệt deploy khỏi release. Nhờ đó, đội ngũ có thể bật/tắt tức thì hoặc mở dần tính năng theo tỷ lệ mà không cần build hay deploy lại ứng dụng.
</details>

### Câu Hỏi 7: GitLab Feature Flags hoạt động dựa trên chuẩn nào và cần lưu ý những đánh đổi gì khi sử dụng Feature Flag lâu dài?

<details>
<summary>Đáp án</summary>

- **Chuẩn tích hợp**: GitLab Feature Flags tương thích với giao thức và SDK client của **Unleash**. Ứng dụng chỉ cần dùng Project ID và Instance ID để lấy trạng thái cờ qua API của GitLab mà không phải tự dựng server quản lý cờ riêng.
- **Đánh đổi / Cạm bẫy**: Feature Flag làm tăng số lượng nhánh điều kiện trong mã nguồn và tạo ra nợ kỹ thuật, dễ gây lỗi nếu bật nhầm. Vì vậy, cần gắn lịch dọn dẹp các cờ cũ ngay sau khi tính năng đã ổn định.
</details>

### Câu Hỏi 8: Nguyên tắc Promotion ("Build once, deploy many") yêu cầu dùng định danh gì cho container image, và tại sao không nên promote bằng tag `:latest`?

<details>
<summary>Đáp án</summary>

- **Định danh chuẩn**: Phải dùng **SHA-256 digest bất biến** (`@sha256:...`) cho cùng một container image đi xuyên suốt từ `dev` sang `staging` rồi `prod`, thay vì build lại image ở từng môi trường.
- **Lý do tránh tag thay đổi (như `:latest`)**: Tag có thể bị ghi đè giữa thời điểm deploy `dev` và `prod`, khiến bản chạy trên production không còn giống hệt bản đã kiểm thử trước đó.
</details>

### Câu Hỏi 9: Từ khóa `environment` trong `.gitlab-ci.yml` đóng vai trò gì trong quy trình phát hành và hỗ trợ rollback?

<details>
<summary>Đáp án</summary>

Từ khóa `environment` trong `.gitlab-ci.yml` giúp GitLab theo dõi toàn bộ lịch sử triển khai theo từng môi trường cụ thể (ví dụ `production`) trên giao diện trang **Environments**, đồng thời hỗ trợ thao tác **Re-deploy** hoặc quay lại phiên bản cũ trực tiếp thông qua pipeline.
</details>

### Câu Hỏi 10: Cơ chế hoạt động của lệnh `helm rollback <RELEASE> [REVISION]` là gì, và tại sao việc chạy lệnh này bằng tay lại gây ra cạm bẫy trên production?

<details>
<summary>Đáp án</summary>

- **Cơ chế của Helm**: Lệnh `helm rollback` khôi phục release về cấu hình cũ bằng cách **tạo một revision mới** mang manifest của revision trước đó, chứ không xóa các revision cũ trong lịch sử (`helm history`).
- **Cạm bẫy Configuration Drift**: Nếu chạy `helm rollback` bằng tay trực tiếp trên cluster mà không cập nhật lại kho Git, cấu hình đang chạy trên cluster sẽ bị lệch so với Git (configuration drift). Khi có commit mới kích hoạt pipeline CI/CD tiếp theo, pipeline sẽ đọc cấu hình cũ đang nằm trên nhánh chính và triển khai đè lại phiên bản bị lỗi.
</details>

### Câu Hỏi 11: Cách rollback chuẩn theo nguyên tắc Single Source of Truth (lấy Git làm nguồn sự thật duy nhất) là gì?

<details>
<summary>Đáp án</summary>

Sau khi cứu hỏa tạm thời (nếu cần), cách chuẩn để đảm bảo đồng bộ với Git là:
- Chạy lại pipeline triển khai với **image digest cũ** (chẳng hạn dùng tính năng Re-deploy bản cũ trên GitLab Environments), **hoặc**
- Thực hiện `git revert` commit cấu hình lỗi trong kho Git để pipeline CI/CD tự động triển khai lại phiên bản ổn định trước đó.
</details>

### Câu Hỏi 12: Tại sao Database Schema Migration thường là nguyên nhân khiến việc rollback ứng dụng bị thất bại?

<details>
<summary>Đáp án</summary>

Bởi vì khi bạn rollback ứng dụng (ví dụ bằng `helm rollback`), hệ thống chỉ đưa container/code quay lại phiên bản cũ chứ **không tự động quay lui trạng thái cơ sở dữ liệu**. Nếu bản mới đã thực hiện các thay đổi schema phá vỡ tương thích ngược—như xóa cột (`DROP COLUMN`) hoặc đổi kiểu dữ liệu—thì phiên bản ứng dụng cũ sau khi rollback sẽ không tìm thấy cột hoặc gặp sai kiểu dữ liệu, dẫn đến lỗi truy vấn SQL.
</details>

### Câu Hỏi 13: Mẫu thiết kế Expand and Contract giải quyết bài toán Database Schema Migration an toàn khi rollback như thế nào?

<details>
<summary>Đáp án</summary>

Mẫu **Expand and Contract** chia một thay đổi schema (như đổi tên hoặc thay thế cột) thành hai pha tách biệt qua các đợt phát hành khác nhau:
1. **Pha 1 — Expand (Mở rộng)**: Thêm cột/bảng mới nhưng vẫn giữ nguyên cột cũ, đồng thời đồng bộ/ghi song song dữ liệu ở cả cột cũ và cột mới. Nhờ đó, cả bản ứng dụng cũ (nếu phải rollback) lẫn bản mới đều chạy được mà không lỗi SQL.
2. **Pha 2 — Contract (Thu gọn)**: Chỉ thực hiện xóa cột cũ (`DROP COLUMN`) ở một đợt phát hành sau đó, khi bản ứng dụng mới đã chạy ổn định hoàn toàn và chắc chắn không còn nhu cầu rollback.
</details>
