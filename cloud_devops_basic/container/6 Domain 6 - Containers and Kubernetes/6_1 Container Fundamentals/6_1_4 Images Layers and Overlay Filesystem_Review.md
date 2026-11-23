# Ôn Tập: Images Layers and Overlay Filesystem

### Câu Hỏi 1: Một container image được cấu tạo từ những thành phần nào và tính "bất biến" (immutable) của nó hoạt động ra sao?

<details>
<summary>Đáp án</summary>

Một image gồm hai phần chính:
- **Các layer (lớp)**: Mỗi layer là một tập thay đổi filesystem (thêm, xóa hoặc sửa file). Layering dựa trên **content-addressable storage** và **union filesystem**, trong đó **manifest** của image nêu định danh theo nội dung của các layer sẽ được giải nén thành filesystem chạy được.
- **Metadata (image configuration / JSON config)**: Chứa thông tin cấu hình như tham số ứng dụng, biến môi trường, `User`, `WorkingDir`, `Entrypoint`, `Cmd`.

**Tính bất biến**: Cả image lẫn từng layer sau khi tạo xong đều không thể sửa được; nếu muốn thay đổi, bạn chỉ có thể tạo image mới hoặc thêm thay đổi lên trên. Bản thân JSON config cũng bất biến vì bất kỳ thay đổi nào trên nó đều làm đổi `ImageID` đã tính.
</details>

### Câu Hỏi 2: Metadata (image configuration) của image chứa các trường mặc định phổ biến nào, và các giá trị này có thể thay đổi khi chạy container không?

<details>
<summary>Đáp án</summary>

Metadata của image lưu các giá trị cấu hình mặc định cho process khi khởi chạy, gồm:
- `Entrypoint`: Lệnh chạy khi container khởi động.
- `Cmd`: Đối số mặc định truyền cho `Entrypoint`.
- `Env`: Các biến môi trường mặc định.
- `WorkingDir`: Thư mục làm việc mặc định của entrypoint process.
- `User`: Username hoặc UID mặc định cho process.

Tất cả các trường này đều là **giá trị mặc định**: bạn hoàn toàn có thể ghi đè chúng lúc tạo hoặc chạy container (ví dụ dùng cờ `--entrypoint`, `-w`, `-e`) mà **không làm thay đổi image gốc**.
</details>

### Câu Hỏi 3: Về mặt filesystem, sự khác biệt cốt lõi giữa một image và một container đang tồn tại là gì?

<details>
<summary>Đáp án</summary>

Image chỉ là dữ liệu **chỉ đọc (read-only)**, không tự chạy. Khi tạo/chạy container:
1. Một **union filesystem** được tạo để xếp chồng các layer của image thành một góc nhìn thống nhất.
2. Root directory của container được đặt vào thư mục hợp nhất đó bằng `chroot`.
3. Điểm khác biệt chính là container có thêm một **lớp ghi mỏng (writable layer)** ở trên cùng. Mọi thao tác ghi file mới, sửa file hoặc xóa file của container đều diễn ra tại lớp ghi này, còn các layer của image bên dưới không thay đổi.
</details>

### Câu Hỏi 4: Trong OverlayFS, bốn thành phần `lowerdir`, `upperdir`, `workdir` và `merged` có vai trò gì và tương ứng với thành phần nào của container?

<details>
<summary>Đáp án</summary>

Theo tài liệu Linux kernel và cách ánh xạ vào container:
- **`lowerdir`**: Thư mục chứa dữ liệu chỉ đọc; ánh xạ với **các layer chỉ đọc của image**.
- **`upperdir`**: Thư mục chứa mọi thay đổi ghi/sửa/xóa; ánh xạ với **lớp ghi (writable layer) của container**.
- **`workdir`**: Thư mục làm việc nội bộ của OverlayFS; bắt buộc phải **nằm trên cùng một filesystem với `upperdir`**.
- **`merged`**: Thư mục hợp nhất từ `lowerdir` và `upperdir` tại thời điểm mount; ánh xạ với **góc nhìn filesystem thống nhất mà container nhìn thấy** (root directory sau `chroot`).
</details>

### Câu Hỏi 5: Khi OverlayFS có nhiều `lowerdir`, thứ tự xếp chồng diễn ra như thế nào? Điều gì xảy ra nếu bỏ qua `upperdir` và `workdir` lúc mount?

<details>
<summary>Đáp án</summary>

- Khi có nhiều `lowerdir`, các thư mục được xếp chồng theo thứ tự **từ phải sang trái**.
- Nếu bỏ `upperdir` và `workdir` khi mount, OverlayFS sẽ hoạt động ở chế độ **chỉ đọc (read-only)**.
</details>

### Câu Hỏi 6: Cơ chế `copy_up` (Copy-on-Write) trong OverlayFS hoạt động ra sao khi container sửa một file hoặc đổi metadata của file có sẵn trong image?

<details>
<summary>Đáp án</summary>

Vì `lowerdir` là chỉ đọc, khi container thực hiện ghi (hoặc thay đổi metadata) lên một file đang nằm ở `lowerdir`:
1. OverlayFS sẽ thực hiện **`copy_up`**: sao chép file đó từ `lowerdir` lên `upperdir` trước.
2. Mọi thay đổi sau đó được ghi vào bản sao trên `upperdir`.
3. File gốc trong `lowerdir` vẫn giữ nguyên không đổi, còn trong `merged` người dùng/container sẽ thấy bản đã sửa ở `upperdir`.
</details>

### Câu Hỏi 7: Cơ chế `whiteout` hoạt động như thế nào khi container xóa một file vốn nằm ở `lowerdir`?

<details>
<summary>Đáp án</summary>

Container không thể xóa trực tiếp file trong `lowerdir` vì lớp này chỉ đọc. Thay vào đó:
1. OverlayFS tạo một mục **whiteout** tương ứng trong `upperdir` (theo tài liệu kernel, whiteout có thể là character device `0/0` hoặc file thường kích thước `0` có xattr `trusted.overlay.whiteout`).
2. Khi nhìn vào `merged`, thấy whiteout ở `upperdir`, file trùng tên ở `lowerdir` sẽ bị bỏ qua và bản thân whiteout cũng bị ẩn đi.
3. File gốc trong `lowerdir` hoàn toàn không bị xóa hay thay đổi.
</details>

### Câu Hỏi 8: Vì sao xóa một file lớn hoặc một secret ở lệnh `RUN` phía sau trong Dockerfile không làm image nhỏ đi và không loại bỏ được secret? Cần xử lý thế nào trong thực tế?

<details>
<summary>Đáp án</summary>

**Nguyên nhân**: Mỗi layer là bất biến. Lệnh xóa ở layer sau chỉ tạo **whiteout** ghi nhận trạng thái đã xóa ở layer trên, còn dữ liệu của file lớn hoặc secret vẫn tồn tại nguyên vẹn trong layer trước đó bên dưới.

**Thực tiễn khắc phục**:
- Tuyệt đối không đưa secret vào bất kỳ layer nào.
- Gộp các bước tải, giải nén và xóa file tạm trong **cùng một lệnh `RUN`** (để nó biến mất trước khi layer được tạo xong).
- Sử dụng **multi-stage build** hoặc **build secret** cho các bước cần dữ liệu nhạy cảm hay công cụ build.
</details>

### Câu Hỏi 9: Điều gì xảy ra với dữ liệu đã ghi trong container khi ta xóa container đó? Để lưu dữ liệu bền vững hoặc chia sẻ giữa các container thì nên làm gì?

<details>
<summary>Đáp án</summary>

- Khi xóa container (hoặc khi rolling update tạo lại container mới), **lớp ghi (`upperdir`) bị xóa cùng với container**, do đó toàn bộ dữ liệu đã ghi vào bên trong container sẽ mất hết; image gốc bên dưới không đổi.
- Những dữ liệu cần giữ lại lâu dài, ghi nhiều hoặc cần chia sẻ giữa nhiều container nên được lưu ở **volume** thay vì ghi vào lớp ghi của container.
</details>

### Câu Hỏi 10: Phân biệt `tag` và `digest` khi làm việc với container image. Trong trường hợp nào nên dùng `digest`?

<details>
<summary>Đáp án</summary>

- **`tag`**: Là cách đặt tên tiện lợi, dễ đọc (ví dụ `redis:7-alpine`). Tuy nhiên tag có thể thay đổi trỏ sang bản build mới hơn, nên nếu pull lại cùng một tag ở thời điểm khác có thể nhận về image mới hơn.
- **`digest`**: Là định danh theo nội dung (content-addressable). Khi cần **cố định chính xác tuyệt đối một image bất biến** (tránh thay đổi ngầm khi pull lại), bạn phải dùng **digest**.
</details>

### Câu Hỏi 11: Lưu ý quan trọng về storage driver trên Docker Engine từ phiên bản 29.0 trở lên là gì?

<details>
<summary>Đáp án</summary>

Tài liệu Docker mô tả các classic storage drivers (như `overlay2`), nhưng lưu ý rằng **từ Docker Engine 29.0 trở lên, cài đặt mới mặc định sử dụng containerd image store**, dùng **snapshotter** thay cho classic storage driver.

Dù khái niệm cốt lõi về layer vẫn đúng, các lệnh kiểm tra hoặc hành vi chi tiết trên máy có thể khác tùy phiên bản, vì vậy cần đối chiếu với phiên bản Docker bạn đang dùng (ví dụ qua `docker info`).
</details>

### Câu Hỏi 12: Làm thế nào một image tĩnh có thể chạy ra đúng một process (ví dụ `redis-server`), và trạng thái `created` khác gì so với sau khi `start`?

<details>
<summary>Đáp án</summary>

Không có phép màu nào—chỉ gồm 3 bước phối hợp:
1. **File chạy nằm sẵn trong image**: File thực thi (như `/usr/local/bin/redis-server`) là một file thường nằm trong các layer của image.
2. **Config của image chỉ định cách chạy**: `Entrypoint`, `Cmd`, `Env`, `WorkingDir`, `User` nói cho runtime biết chạy file nào và với thiết lập mặc định gì.
3. **OCI runtime thực thi bên trong rootfs**: Runtime cấp thấp (`runc`/`crun`) nhận rootfs (các layer ghép thành `lowerdir` + lớp ghi trống) và config, dựng cô lập (namespaces, cgroup, `chroot` vào rootfs) rồi `exec` lệnh.

**Khác biệt giữa `created` và `start`** (quan sát bằng `podman create` / `podman start`):
- Ở trạng thái **`state=created`**: Container đã có rootfs và lớp ghi trống, nhưng **chưa có process chạy (`pid=0`)**.
- Sau khi **`start`**: Process khởi chạy (mang **PID 1** bên trong container, và mang một PID khác cùng UID ánh xạ trên host nếu chạy rootless).
</details>

### Câu Hỏi 13: Trong ví dụ image Java (`eclipse-temurin:21-jre`), Java được lưu ở đâu trong image, làm sao process tìm thấy lệnh `java`, và vì sao sửa code ứng dụng không phải tạo lại layer Java?

<details>
<summary>Đáp án</summary>

- **Vị trí của Java**: Java chỉ là một **thư mục file thường nằm trong một layer** (trong ví dụ là layer ~166 MB chứa Java 21 tại `/opt/java/openjdk`). Bạn không cần cài Java lên máy host; engine sẽ tải các layer này về kho lưu trữ của nó.
- **Cách tìm thấy `java`**: Config của image thiết lập sẵn biến môi trường `JAVA_HOME=/opt/java/openjdk` và đưa `/opt/java/openjdk/bin` lên đầu `PATH`, giúp process tìm thấy `java` khi entrypoint gọi `java -jar ...`.
- **JRE vs JDK**: Image `21-jre` là **JRE** nên thư mục `bin` chỉ có các công cụ chạy (`java`, `keytool`,...) mà không có `javac` (JDK chỉ cần lúc build).
- **Vì sao không tạo lại layer Java**: Do các layer bất biến, image ứng dụng chỉ đặt một layer mỏng (~9 kB chứa file `.jar`) và `ENTRYPOINT` mới lên trên cùng. Khi đổi code ứng dụng, chỉ layer `.jar` nhỏ được tạo lại, còn layer Java 166 MB bên dưới được giữ nguyên.
</details>

### Câu Hỏi 14: Những lệnh nào giúp bạn quan sát từng layer của image và xem cấu hình mặc định (`Entrypoint`, `Cmd`, `Env`, `WorkingDir`, `User`) của image đó?

<details>
<summary>Đáp án</summary>

- **Xem các layer của image** (kèm kích thước và lệnh đã tạo từng layer):
  ```bash
  podman history <image>
  # hoặc kèm định dạng: podman history --format '{{.Size}}|{{.CreatedBy}}' <image>
  ```
- **Xem metadata / config mặc định của image**:
  ```bash
  podman image inspect <image> --format 'Entrypoint={{.Config.Entrypoint}} Cmd={{.Config.Cmd}} WorkingDir={{.Config.WorkingDir}} User={{.Config.User}}'
  # hoặc xem biến môi trường:
  podman image inspect <image> --format '{{range .Config.Env}}{{println .}}{{end}}'
  ```
*(Với Docker classic, thay `podman` bằng `docker`.)*
</details>

### Câu Hỏi 15: Khi tự dựng OverlayFS bằng tay trên Linux với `mount -t overlay`, ta cần chuẩn bị những thư mục nào và quan sát được gì sau khi sửa hoặc xóa file trong `merged`?

<details>
<summary>Đáp án</summary>

Cần chuẩn bị 4 thư mục (`lower`, `upper`, `work`, `merged`) với `upper` và `work` trên cùng filesystem, rồi mount bằng lệnh:
```bash
sudo mount -t overlay overlay \
  -olowerdir=/tmp/ov/lower,upperdir=/tmp/ov/upper,workdir=/tmp/ov/work /tmp/ov/merged
```

**Kết quả quan sát được**:
- Khi **sửa một file** có sẵn từ `lower` thông qua `merged`: cơ chế `copy_up` sao chép và lưu bản đã sửa vào `upper`, còn file trong `lower` giữ nguyên nội dung gốc.
- Khi **xóa một file** có sẵn từ `lower` thông qua `merged`: `merged` không còn thấy file đó nữa, `upper` xuất hiện một mục **whiteout**, còn file gốc trong `lower` vẫn nguyên vẹn.
- Sau khi kiểm tra xong, dùng `sudo umount /tmp/ov/merged` để gỡ mount.
</details>
