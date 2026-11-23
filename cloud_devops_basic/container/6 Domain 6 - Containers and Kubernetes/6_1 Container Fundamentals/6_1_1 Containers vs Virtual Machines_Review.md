# Ôn Tập: 6_1_1 Containers vs Virtual Machines

### Câu Hỏi 1: Về bản chất kỹ thuật, container là gì và cần đặt câu hỏi tư duy nào khi container gặp hành vi bất thường?

<details>
<summary>Đáp án</summary>

Theo Docker, container là *"isolated processes for each of your app's components"*. Nói gọn lại, **container là một process bị cô lập, đi kèm các file cần thiết để chạy**.

Vì bản chất container là một process do hệ điều hành quản lý, khi container gặp hiện tượng bất thường (như bị kill, không nhận tín hiệu, hoặc mất file), điểm xuất phát đúng để điều tra là đặt câu hỏi: **"Process này đang bị kernel xử lý ra sao?"**
</details>

### Câu Hỏi 2: Hai đặc tính cốt lõi nào của container được nhấn mạnh trong bài học và ý nghĩa của từng đặc tính là gì?

<details>
<summary>Đáp án</summary>

Hai đặc tính quan trọng được nhấn mạnh là:
- **Isolated (Cô lập):** Container chạy tách biệt nên ít gây ảnh hưởng tới máy chủ (host) và các container khác đang chạy cùng máy.
- **Self-contained (Tự chứa):** Mỗi container đóng gói sẵn mọi thứ nó cần để chạy, không phụ thuộc vào các gói phần mềm cài sẵn trên máy chủ.
</details>

### Câu Hỏi 3: Máy ảo (VM) và Container khác nhau như thế nào về bản chất, kernel và chi phí hạ tầng?

<details>
<summary>Đáp án</summary>

| Tiêu chí | Máy ảo (VM) | Container |
| :--- | :--- | :--- |
| **Bản chất** | Cả một hệ điều hành hoàn chỉnh gồm kernel, driver phần cứng, chương trình và ứng dụng riêng. | Một process bị cô lập đi kèm các file nó cần để chạy. |
| **Kernel** | Mỗi VM sở hữu một kernel riêng. | Các container trên cùng máy chủ dùng chung một kernel của máy chủ. |
| **Chi phí & Mật độ** | Dựng cả một VM chỉ để cô lập một ứng dụng tốn rất nhiều chi phí (*a lot of overhead*). | Nhẹ hơn, chạy được nhiều ứng dụng hơn trên ít hạ tầng hơn. |
</details>

### Câu Hỏi 4: Việc container dùng chung kernel với máy chủ dẫn đến hệ quả gì về khả năng tương thích hệ điều hành so với VM?

<details>
<summary>Đáp án</summary>

Vì container không có kernel riêng mà dùng chung kernel của máy chủ, nên **container Linux bắt buộc phải chạy trên máy chủ có kernel Linux**. Khác với VM (vốn có thể chạy hệ điều hành với kernel riêng qua hypervisor), container không thể chạy một "kernel khác" tách biệt hoàn toàn với kernel của máy chủ.
</details>

### Câu Hỏi 5: Sự cô lập và giới hạn của container được tạo nên từ hai cơ chế Linux kernel nào, và vai trò của từng cơ chế là gì?

<details>
<summary>Đáp án</summary>

Container không phải một tính năng kernel đơn lẻ mà là sự kết hợp của hai cơ chế kernel:
- **Namespaces:** Kernel bao một tài nguyên toàn cục trong một lớp trừu tượng, khiến process bên trong namespace chỉ nhìn thấy *bản cô lập riêng* của tài nguyên đó (quyết định container "nhìn thấy gì").
- **cgroups v2 (Control Groups v2):** Dùng để giới hạn và kiểm soát tài nguyên mà container được phép sử dụng. Ví dụ: `memory.max` là giới hạn cứng và là cơ chế chính để giới hạn bộ nhớ của một cgroup.
</details>

### Câu Hỏi 6: Mặc định container có bị giới hạn tài nguyên không? Điều này gây ra cạm bẫy gì trong thực tế và cần cấu hình ra sao để phòng tránh?

<details>
<summary>Đáp án</summary>

- **Mặc định:** Container **không bị giới hạn tài nguyên**. Nó có thể sử dụng bao nhiêu tài nguyên tùy thuộc vào bộ lập lịch (scheduler) của kernel máy chủ.
- **Cạm bẫy thực tế:** Nếu không đặt giới hạn, một container có thể "ăn" hết RAM hoặc CPU của toàn bộ node, làm ảnh hưởng nghiêm trọng đến các container khác chạy chung máy.
- **Cách phòng tránh:** Phải đặt giới hạn tài nguyên một cách tường minh khi chạy container, chẳng hạn dùng cờ `--memory`, `--cpus` (trong Docker/Podman) hoặc cấu hình `resources.limits` (trong Kubernetes).
</details>

### Câu Hỏi 7: Trong ví dụ so sánh "nhà riêng vs căn hộ chung cư", các thành phần của chung cư tương ứng với những khái niệm kỹ thuật nào?

<details>
<summary>Đáp án</summary>

- **Nhà riêng = VM:** Có móng, điện nước và mái riêng; rất độc lập nhưng xây cả căn chỉ cho một người ở thì tốn kém.
- **Căn hộ chung cư = Container:** Nhiều căn trên cùng mảnh đất (mật độ cao, ít hạ tầng hơn).
  - **Móng và hệ thống điện nước dùng chung** = **Kernel** của máy chủ.
  - **Cửa khóa riêng từng căn** = **Namespaces** (cô lập tầm nhìn/không gian riêng).
  - **Đồng hồ điện nước giới hạn mức dùng** = **cgroups** (giới hạn tài nguyên).
  - **Căn hộ có tường bê tông dày / nhà riêng trong khu chung cư** = **RuntimeClass dùng ảo hóa phần cứng** (tăng cường cô lập cho nhu cầu bảo mật cao).
- **Rủi ro chung móng:** Nếu hỏng móng (lỗi ở tầng kernel) thì mọi căn hộ (mọi container) đều bị ảnh hưởng, trong khi nhà riêng (VM) không bị lan sang nhau.
</details>

### Câu Hỏi 8: Tại sao không nên coi container thông thường là ranh giới bảo mật tuyệt đối, và Kubernetes cung cấp giải pháp nào cho các workload đòi hỏi bảo mật cao?

<details>
<summary>Đáp án</summary>

- **Lý do bảo mật:** Các container trên cùng máy chủ dùng chung một kernel (tài liệu Docker chỉ nêu container "có ảnh hưởng tối thiểu" tới máy chủ). Về nguyên lý, ranh giới cô lập này yếu hơn VM: một lỗ hổng ở tầng kernel có thể ảnh hưởng đến nhiều container chạy trên cùng máy.
- **Giải pháp trong Kubernetes:** Đối với các workload cần mức đảm bảo bảo mật cao, Kubernetes cho phép chọn một container runtime sử dụng **ảo hóa phần cứng** cho từng Pod thông qua **RuntimeClass**. Ngoài ra còn có các lớp bảo mật bổ trợ khác như capabilities, seccomp, hoặc user namespace.
- **Sự đánh đổi:** Đạt được mức cô lập mạnh hơn nhưng phải chấp nhận **thêm overhead** về hiệu năng và tài nguyên.
</details>

### Câu Hỏi 9: Trên môi trường cloud thực tế, VM và Container thường được sử dụng cùng nhau như thế nào? Làm sao trả lời đúng câu hỏi "nên chọn VM hay Container"?

<details>
<summary>Đáp án</summary>

Không nên đối lập VM và container vì hai công nghệ này thường **chạy cùng nhau**. Trên cloud, hạ tầng được nhà cung cấp cấp phát thường là các **VM**; bên trong mỗi VM đó chạy một **container runtime**, và runtime này tiếp tục chạy nhiều ứng dụng container hóa (Container A, Container B...).

Vì vậy, câu trả lời đúng cho việc "chọn VM hay container" không phải là "cái nào hơn", mà là **tùy thuộc vào yêu cầu về mức độ cách ly, mật độ triển khai và cách thức vận hành**.
</details>

### Câu Hỏi 10: Làm thế nào để kiểm chứng bằng dòng lệnh rằng container dùng chung kernel với máy chủ? Nếu kết quả hai lần chạy lệnh khác nhau thì cần lưu ý điều gì?

<details>
<summary>Đáp án</summary>

Ta so sánh chuỗi kernel release của máy chủ và của môi trường bên trong container bằng lệnh `uname -r` (dùng `podman` hoặc thay bằng `docker`):

```bash
# 1. Xem kernel release của máy chủ
uname -r

# 2. Xem kernel release nhìn từ trong container (tự xóa container sau khi chạy)
podman run --rm docker.io/library/alpine uname -r
```

- **Kết quả mong đợi trên Linux gốc:** Hai chuỗi `uname -r` giống hệt nhau vì container dùng chung kernel với máy chủ.
- **Lưu ý nếu kết quả khác nhau:** Trường hợp công cụ container đang chạy bên dưới một lớp máy ảo (ví dụ chạy trên môi trường không phải Linux trực tiếp), hai chuỗi có thể khác nhau; khi quan sát thấy khác biệt, cần ghi nhận rõ nền tảng môi trường đang sử dụng thay vì suy đoán.
</details>

### Câu Hỏi 11: Làm thế nào để thực hành chứng minh rằng một container thực chất chỉ là một process trên máy chủ?

<details>
<summary>Đáp án</summary>

Có thể chạy một container giữ tiến trình `sleep 600` ở chế độ nền rồi đối chiếu danh sách process từ phía công cụ container và từ phía máy chủ:

```bash
# 1. Chạy container ở chế độ nền (-d) với tên "demo"
podman run -d --name demo docker.io/library/alpine sleep 600

# 2. Xem process của container dưới góc nhìn của Podman
podman top demo

# 3. Kiểm tra trực tiếp bảng process trên máy chủ
ps aux | grep "sleep 600"

# 4. Dọn dẹp container sau khi quan sát
podman rm -f demo
```

Khi chạy `ps aux | grep "sleep 600"` trên máy chủ, ta sẽ thấy tiến trình `sleep 600` xuất hiện như một process thật của hệ điều hành, chứng minh container bản chất là một process trên máy chủ.
</details>
