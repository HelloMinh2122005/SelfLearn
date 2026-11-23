# Ôn Tập: 6_1_5 Open Container Initiative Specifications

### Câu Hỏi 1: OCI là gì, ra mắt khi nào và `runC` (`runc`) đóng vai trò gì trong chuẩn này?

<details>
<summary>Đáp án</summary>

- **OCI (Open Container Initiative)** không phải là một phần mềm cụ thể mà là **bộ chuẩn kỹ thuật chung** giúp các công cụ container (như Docker, Podman, Kubernetes, registry...) hiểu được file và lệnh của nhau, tránh bị khóa vào một hãng duy nhất.
- OCI được **Docker, CoreOS và các bên khác** ra mắt vào ngày **22-06-2015**.
- Dự án **`runC`** đã được tặng cho OCI để làm nền tảng cho nỗ lực chuẩn hóa này, và **`runc`** là công cụ CLI dùng để tạo và chạy container theo OCI specification.
</details>

### Câu Hỏi 2: OCI hiện có ba đặc tả nào? Mỗi đặc tả quy định điều gì và đối tượng nào sử dụng chúng?

<details>
<summary>Đáp án</summary>

OCI gồm 3 đặc tả chính:
1. **Image Specification (`image-spec`)**: Định nghĩa định dạng của một container image (gồm manifest, image index tùy chọn, các layer và configuration). Đối tượng sử dụng là công cụ build, registry và runtime.
2. **Runtime Specification (`runtime-spec`)**: Định nghĩa cách chạy một "filesystem bundle" đã được giải nén trên đĩa. Đối tượng sử dụng là các OCI runtime như `runc`, `crun`.
3. **Distribution Specification (`distribution-spec`, v1.0 từ tháng 05-2020)**: Định nghĩa API chuẩn để phân phối (push/pull) image. Đối tượng sử dụng là các container registry (Docker Hub, GitLab, GHCR, Harbor...) và các client push/pull (Docker, Podman...).
</details>

### Câu Hỏi 3: Theo `image-spec`, một OCI Image bao gồm những thành phần nào và mục tiêu chính của đặc tả này là gì?

<details>
<summary>Đáp án</summary>

- Một OCI Image gồm 4 thành phần:
  1. **Image manifest**
  2. **Image index** (tùy chọn)
  3. Tập **filesystem layer**
  4. **Configuration**
- **Mục tiêu**: Giúp các công cụ dùng để build, vận chuyển và chuẩn bị chạy image có thể **tương thích lẫn nhau** (tương tự như chuẩn kích thước và cách đóng thùng container vận tải ISO).
</details>

### Câu Hỏi 4: Các thành phần bên trong một OCI Image tham chiếu lẫn nhau bằng cơ chế nào?

<details>
<summary>Đáp án</summary>

Các thành phần trong OCI Image tham chiếu nhau thông qua **Content Descriptor**. Mỗi Content Descriptor bao gồm 3 thông tin:
- **Loại nội dung** (media type)
- **`digest`** (định danh nội dung)
- **Kích thước byte**
</details>

### Câu Hỏi 5: `Image index` là gì và nó giải quyết vấn đề gì trong thực tế?

<details>
<summary>Đáp án</summary>

- **Image index** là một manifest cấp cao hơn, trỏ tới một danh sách các manifest khác; các manifest này thường khác nhau theo từng nền tảng (kiến trúc CPU / hệ điều hành).
- **Ý nghĩa thực tế**: Đây là cơ sở cho **image đa kiến trúc (multi-arch)**. Nếu chỉ dùng image đơn kiến trúc thì có thể không chạy được trên máy khác kiến trúc; khi cần chạy trên nhiều nền tảng, ta sử dụng `image index` để một tên/tag có thể trỏ đúng tới manifest phù hợp cho từng nền tảng.
</details>

### Câu Hỏi 6: Theo `runtime-spec`, luồng hoạt động tổng quát từ lúc kéo image đến khi có container process đang chạy diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

Luồng tổng quát gồm 3 bước chính:
1. Tải **OCI Image** (từ registry theo `distribution-spec`).
2. Công cụ cấp cao **giải nén (unpack)** image đó thành một **runtime filesystem bundle** trên đĩa (gồm `rootfs` và file cấu hình **`config.json`**).
3. Một **OCI Runtime** (như `runc`, `crun`) đọc `config.json` và chạy bundle đó để tạo ra **container process**.
</details>

### Câu Hỏi 7: Việc OCI tách biệt vai trò giữa công cụ cấp cao và runtime cấp thấp mang lại ý nghĩa gì?

<details>
<summary>Đáp án</summary>

Nhờ `runtime-spec`, việc **"chuẩn bị image"** được tách rời hoàn toàn khỏi việc **"tạo process container"**:
- **Công cụ cấp cao** (như Docker, Podman, containerd) lo các việc tổng hợp hơn như quản lý image, kéo/đẩy từ registry, mạng (network), volume và giải nén thành bundle.
- **Runtime cấp thấp** (như `runc`, `crun`) chỉ tập trung vào một việc là chạy filesystem bundle để tạo process container.

Sự phân chia rành mạch này giúp các hệ thống dễ thay thế hoặc kết hợp linh hoạt các lớp công cụ với nhau mà vẫn giữ nguyên tính tương thích.
</details>

### Câu Hỏi 8: Theo `distribution-spec`, client dùng những đường dẫn API chuẩn nào để liệt kê tag và lấy manifest của image?

<details>
<summary>Đáp án</summary>

Hai đường dẫn API chuẩn theo `distribution-spec` gồm:
- Liệt kê các tag: `/v2/<name>/tags/list`
- Lấy manifest: `/v2/<name>/manifests/<tag-or-digest>`

Trong đó, `<name>` là **namespace của repository**, còn `<tag-or-digest>` phải là **digest của manifest hoặc một tag**.

*Lưu ý thực hành*: Các lệnh `curl` minh họa gọi thẳng tới registry cục bộ (ví dụ `http://localhost:5000/v2/...`) chỉ thể hiện đường dẫn chuẩn; với các registry thực tế, mỗi hệ thống có thể yêu cầu xác thực/token và có những khác biệt riêng.
</details>

### Câu Hỏi 9: Vì sao một image được build bằng Docker vẫn chạy được trên Podman hoặc trên các runtime của Kubernetes (như containerd, CRI-O)?

<details>
<summary>Đáp án</summary>

Vì các công cụ này đều tuân thủ bộ ba đặc tả OCI:
- **`image-spec`** chuẩn hóa cách đóng gói image.
- **`distribution-spec`** chuẩn hóa giao thức push/pull với registry.
- **`runtime-spec`** chuẩn hóa cách chạy bundle để tạo container.

Thực tế, **Podman** khai báo làm việc trực tiếp với **OCI Containers và Container Images**, còn **CRI-O** (dùng cho Kubernetes) mô tả rõ khả năng kéo image từ registry tuân chuẩn và chạy mọi container tuân chuẩn OCI. Nhờ nói chung một "ngôn ngữ" OCI, image tạo ra từ công cụ này có thể chạy ở công cụ khác.
</details>

### Câu Hỏi 10: Khi hai công cụ container (ví dụ Docker và Podman/Kubernetes) xử lý khác nhau hoặc không tương thích với một tính năng như `HEALTHCHECK`, nguyên nhân là gì và nên xử lý thế nào?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Đó không phải lỗi của OCI mà là chuyện của **tính năng ngoài chuẩn**. OCI chỉ chuẩn hóa 3 phần: image, runtime và distribution. Những tính năng nằm ngoài 3 đặc tả này (như `HEALTHCHECK`) có thể không di chuyển được giữa các công cụ.
- **Thực tiễn sản xuất**: Chỉ dựa vào chuẩn OCI cho những phần cần tính tương thích đa công cụ; đối với các tính năng đặc thù ngoài chuẩn, cần kiểm tra trực tiếp tài liệu của từng công cụ mà bạn đang dùng.
</details>

### Câu Hỏi 11: Trong môi trường sản xuất, vì sao không nên coi `tag` là định danh cố định cho một image và giải pháp là gì?

<details>
<summary>Đáp án</summary>

- **Lý do**: Trong API distribution (`/v2/<name>/manifests/<tag-or-digest>`), **`tag` chỉ là tên gọi**, có thể trỏ tới nội dung khác theo thời gian; còn **`digest`** mới là **định danh nội dung** (content identifier) gắn liền với nội dung thực tế của image.
- **Thực tiễn**: Khi cần đảm bảo triển khai hoặc chạy đúng một phiên bản image cố định, hãy **ghim (pin) bằng `digest`** thay vì chỉ dựa vào `tag`.
</details>

### Câu Hỏi 12: Để kiểm tra thông tin các layer của một OCI image trên máy (ví dụ với Podman), ta có thể dùng lệnh gì?

<details>
<summary>Đáp án</summary>

Ta có thể dùng lệnh:

```bash
podman history docker.io/library/alpine
```

Lệnh này giúp in ra thông tin từng layer của image `alpine` theo góc nhìn thực tế trên máy cục bộ.
</details>
