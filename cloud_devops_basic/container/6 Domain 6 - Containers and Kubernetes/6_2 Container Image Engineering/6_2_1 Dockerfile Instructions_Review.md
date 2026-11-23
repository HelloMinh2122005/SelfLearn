# Ôn Tập: 6_2_1 Dockerfile Instructions

### Câu Hỏi 1: Vai trò của lệnh `FROM` và `RUN` trong Dockerfile là gì, và một Dockerfile hợp lệ bắt buộc phải bắt đầu bằng lệnh nào?

<details>
<summary>Đáp án</summary>

- Một Dockerfile hợp lệ bắt buộc phải bắt đầu bằng lệnh `FROM`.
- `FROM` khởi tạo một **build stage** mới và đặt base image cho stage đó.
- `RUN` thực thi lệnh để tạo ra một **layer mới** trên image hiện tại (mỗi lệnh thao tác lên filesystem đều tạo một layer).
</details>

### Câu Hỏi 2: Lệnh `COPY` và `ADD` giống và khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- Cả `COPY` và `ADD` đều dùng để chép file/thư mục từ `<src>` vào filesystem của image tại `<dest>` và giống nhau về chức năng cốt lõi, nhưng phục vụ mục đích hơi khác.
- `COPY` chép file/thư mục mới từ `<src>` (build context) vào image.
- `ADD` tương tự `COPY`, nhưng nguồn `<src>` ngoài build context còn có thể là **URL từ xa** hoặc **Git repository**.
</details>

### Câu Hỏi 3: Lệnh `WORKDIR` tác động tới những lệnh nào theo sau nó, và điều gì xảy ra nếu thư mục chỉ định chưa tồn tại?

<details>
<summary>Đáp án</summary>

`WORKDIR` đặt thư mục làm việc cho các lệnh `RUN`, `CMD`, `ENTRYPOINT`, `COPY` và `ADD` đứng sau nó trong Dockerfile. Nếu thư mục được chỉ định chưa tồn tại, `WORKDIR` sẽ tự động tạo thư mục đó.
</details>

### Câu Hỏi 4: Lệnh `USER` trong Dockerfile có tác dụng gì?

<details>
<summary>Đáp án</summary>

`USER` đặt user (hoặc UID) và tùy chọn group (hoặc GID) mặc định cho phần còn lại của build stage (ví dụ: `USER 10001`).
</details>

### Câu Hỏi 5: Lệnh `EXPOSE` có thực sự publish cổng của container ra bên ngoài không? Nếu không, làm sao để publish cổng lúc chạy container?

<details>
<summary>Đáp án</summary>

Không. `EXPOSE` chỉ cho Docker biết container lắng nghe cổng nào lúc chạy (mặc định là TCP) và đóng vai trò như tài liệu, **không** thực sự publish cổng. Để publish cổng lúc chạy container, bạn phải dùng cờ `-p` (hoặc dùng Service khi chạy trên Kubernetes).
</details>

### Câu Hỏi 6: Phân biệt sự khác nhau giữa `ENV` và `ARG` về mục đích sử dụng và sự tồn tại trong image đã build.

<details>
<summary>Đáp án</summary>

- `ENV`: Dùng để đặt biến môi trường cho mọi lệnh sau đó trong stage; giá trị của `ENV` **luôn được lưu** trong image đã build.
- `ARG`: Là biến truyền vào **lúc build** thông qua cờ `--build-arg <varname>=<value>`; giá trị của `ARG` **không** được lưu như `ENV` trong image đã build.
</details>

### Câu Hỏi 7: Vì sao không nên dùng `ARG` cho giá trị cần dùng lúc chạy container, và vì sao không được dùng `ENV` để chứa bí mật (secrets)?

<details>
<summary>Đáp án</summary>

- Không dùng `ARG` cho giá trị cần có lúc chạy vì `ARG` không được lưu trong cấu hình image như `ENV`.
- Không dùng `ENV` để chứa bí mật vì giá trị `ENV` luôn được lưu bên trong image đã build (có thể đọc được khi inspect image).
</details>

### Câu Hỏi 8: Quy tắc kết hợp `ENTRYPOINT` và `CMD` trong một Dockerfile là gì, và điều gì xảy ra nếu khai báo nhiều lệnh `CMD`?

<details>
<summary>Đáp án</summary>

- Một Dockerfile cần phải có **ít nhất một** trong hai lệnh `CMD` hoặc `ENTRYPOINT`.
- Một Dockerfile chỉ có **một `CMD` hiệu lực**: nếu liệt kê nhiều `CMD`, chỉ lệnh `CMD` cuối cùng có tác dụng.
</details>

### Câu Hỏi 9: Theo best practices, nên phối hợp `ENTRYPOINT` và `CMD` như thế nào? Khi chạy `podman run --rm demo:1 minh` với image có `ENTRYPOINT ["/bin/sh", "/app/hello.sh"]` và `CMD ["world"]`, tham số nào sẽ được dùng?

<details>
<summary>Đáp án</summary>

- Best practice là đặt **lệnh chính** của image ở `ENTRYPOINT` (khi dùng container như một chương trình) và dùng `CMD` làm cờ/tham số mặc định.
- `CMD` sẽ bị ghi đè khi chạy container với tham số khác. Trong ví dụ `podman run --rm demo:1 minh`, tham số `minh` sẽ thay thế `CMD` (`"world"`), còn `ENTRYPOINT` giữ nguyên (tức là thực thi `/bin/sh /app/hello.sh minh`).
</details>

### Câu Hỏi 10: Exec form có đặc điểm cú pháp gì, và vì sao biến môi trường như `$HOME` không được thay thế khi viết trực tiếp trong exec form?

<details>
<summary>Đáp án</summary>

- Exec form được parse như một **mảng JSON**, nên bắt buộc phải dùng **dấu nháy kép** (`"`), không dùng nháy đơn.
- Exec form **không tự gọi shell**, nên không có các xử lý của shell như thay thế biến (`$HOME`).
- Nếu cần thay thế biến, phải gọi shell tường minh (ví dụ `["/bin/sh", "-c", "..."]`) và dùng `exec` để ứng dụng vẫn nhận được signal.
</details>

### Câu Hỏi 11: Vì sao các service (chẳng hạn ứng dụng Java) nên dùng exec form thay vì shell form cho `ENTRYPOINT`?

<details>
<summary>Đáp án</summary>

Shell form chạy lệnh như một lệnh con của `/bin/sh -c`, mà shell này không chuyển signal tới tiến trình con. Vì vậy, executable không phải là PID 1 và không nhận được `SIGTERM` từ `docker stop`, dẫn đến phải chờ hết thời gian rồi bị `SIGKILL` (exit 137). Dùng exec form (ví dụ `ENTRYPOINT ["java", "-jar", "app.jar"]`) sẽ đưa lệnh chính trực tiếp thành PID 1 để nhận signal đúng cách.
</details>

### Câu Hỏi 12: Lệnh `HEALTHCHECK` trong Dockerfile dùng để làm gì, và Kubernetes xử lý việc kiểm tra sức khỏe container như thế nào?

<details>
<summary>Đáp án</summary>

`HEALTHCHECK` cho Docker biết cách kiểm tra xem container còn hoạt động hay không. Tuy nhiên, Kubernetes **không** dùng cơ chế `HEALTHCHECK` này mà quản lý sức khỏe container bằng **probe**.
</details>

### Câu Hỏi 13: Lệnh `podman build --format` hỗ trợ những giá trị nào (giá trị nào mặc định), và làm sao tự kiểm chứng `HEALTHCHECK` có được giữ lại trong image hay không?

<details>
<summary>Đáp án</summary>

`podman build --format` có hai giá trị là `oci` (image-spec v1.0, **mặc định**) và `docker` (version 2, schema 2). Để tự kiểm tra xem `HEALTHCHECK` có được giữ lại hay không, bạn có thể build image với cả `--format docker` và `--format oci`, rồi dùng `podman image inspect` để kiểm tra.
</details>

### Câu Hỏi 14: Lệnh `LABEL` dùng để làm gì, và 4 khóa nhãn OCI chuẩn (`org.opencontainers.image.*`) trong bài học biểu thị thông tin gì?

<details>
<summary>Đáp án</summary>

`LABEL` dùng để thêm metadata dạng key-value cho image, giúp truy vết một image về commit tạo ra nó trong pipeline CI/CD. Bốn khóa nhãn OCI chuẩn gồm:
- `org.opencontainers.image.source`: URL để lấy mã nguồn build image.
- `org.opencontainers.image.revision`: định danh revision của source control.
- `org.opencontainers.image.version`: phiên bản của phần mềm đóng gói.
- `org.opencontainers.image.created`: thời điểm build image, theo chuẩn RFC 3339.
</details>

### Câu Hỏi 15: Sau khi build image `demo:1`, làm sao quan sát `Entrypoint`, `Cmd`, `Env` và `Labels` của image đó, và kết quả với `ENV` vs `ARG` sẽ khác nhau thế nào?

<details>
<summary>Đáp án</summary>

Dùng lệnh `podman image inspect demo:1` (hoặc `docker image inspect`) để xem phần `Config` của image. Trong kết quả quan sát, biến khai báo bằng `ENV` (ví dụ `APP_ENV`) sẽ xuất hiện trong config của image, còn biến khai báo bằng `ARG` (ví dụ `GIT_SHA`) thì không.
</details>
