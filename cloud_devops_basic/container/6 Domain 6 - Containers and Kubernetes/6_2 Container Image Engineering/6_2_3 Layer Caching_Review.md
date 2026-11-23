# Ôn Tập: 6_2_3 Layer Caching

### Câu Hỏi 1: Điều kiện nào quyết định một layer trong quá trình build image được dùng lại từ cache (cache hit)?

<details>
<summary>Đáp án</summary>

Một layer chỉ được dùng lại từ cache khi **câu lệnh tạo ra layer đó và tất cả các file mà nó phụ thuộc không thay đổi** kể từ lần build trước.
</details>

### Câu Hỏi 2: Điều gì xảy ra với các layer phía sau khi một layer ở giữa bị thay đổi và mất cache (cache miss)?

<details>
<summary>Đáp án</summary>

Khi một layer thay đổi, **mọi layer đứng sau nó đều bị ảnh hưởng và phải build lại từ đầu**, ngay cả khi bản thân các layer phía sau đó không có thay đổi nào về lệnh hay nội dung tạo ra.
</details>

### Câu Hỏi 3: Dựa vào quy tắc cache theo layer, nên sắp xếp thứ tự các lệnh trong Dockerfile như thế nào để tối ưu tốc độ build? Hãy lấy ví dụ với một service Java.

<details>
<summary>Đáp án</summary>

Nên đặt những phần **ít thay đổi lên trước** (cài đặt gói hệ thống, file khai báo dependency) và những phần **thường xuyên thay đổi xuống sau** (mã nguồn ứng dụng).

Với một service Java, thứ tự tối ưu là: `COPY pom.xml` → `RUN` tải dependency → `COPY src` → `RUN` build. Nhờ vậy, khi bạn sửa mã nguồn trong `src/`, các layer cài gói và tải dependency phía trên vẫn giữ được cache, chỉ phải build lại từ bước `COPY src` trở đi.
</details>

### Câu Hỏi 4: Vì sao việc đặt lệnh `COPY . .` trước bước tải dependency lại là một cạm bẫy phổ biến trong Dockerfile?

<details>
<summary>Đáp án</summary>

Vì `COPY . .` sao chép toàn bộ thư mục dự án (bao gồm cả mã nguồn). Chỉ cần sửa một file bất kỳ (ví dụ sửa code), layer `COPY . .` sẽ bị mất cache và **kéo theo mọi layer phía sau nó — bao gồm cả bước tải dependency — đều phải chạy lại**, dù danh sách dependency không hề thay đổi.
</details>

### Câu Hỏi 5: Giả sử Dockerfile có 4 lệnh theo thứ tự: (1) `FROM alpine:3.20`, (2) `RUN echo base-step`, (3) `COPY data.txt /data.txt`, (4) `RUN echo after-copy`. Sau khi build xong lần 1, bạn sửa nội dung `data.txt` rồi build lại lần 2. Bước nào giữ được cache và bước nào phải chạy lại?

<details>
<summary>Đáp án</summary>

- **Giữ được cache (cache hit)**: Bước (1) `FROM` và bước (2) `RUN echo base-step`, vì chúng nằm trước lệnh bị thay đổi và không phụ thuộc vào `data.txt`.
- **Phải chạy lại**: Bước (3) `COPY data.txt /data.txt` (do file phụ thuộc đã đổi) và bước (4) `RUN echo after-copy` (do đứng sau một layer đã mất cache).
</details>

### Câu Hỏi 6: `ARG` ảnh hưởng đến build cache như thế nào theo tài liệu Docker, và kết quả quan sát thực tế trên Podman 5.8.9 có điểm gì khác biệt?

<details>
<summary>Đáp án</summary>

- **Theo tài liệu Docker**: Nếu giá trị `ARG` khác với lần build trước, cache miss sẽ xảy ra ở **lần sử dụng đầu tiên** của `ARG` đó, chứ không phải tại dòng khai báo `ARG`.
- **Quan sát thực nghiệm ở lab 6_2_2 (Podman 5.8.9, dùng Buildah bên dưới)**: Khi một `ARG` chỉ được dùng trong `ENV`, nó **không** làm mất cache — hai lần build với giá trị `ARG` khác nhau vẫn cho ra **cùng image ID** (trái với mô tả của tài liệu Docker). Ngược lại, khi `ARG` được dùng trong một lệnh `RUN`, giá trị của nó mới trở thành một phần khóa cache của lệnh đó.
</details>

### Câu Hỏi 7: Từ sự khác biệt về hành vi cache của `ARG` giữa tài liệu Docker và thực tế trên Podman, người viết Dockerfile cần rút ra nguyên tắc thực hành nào?

<details>
<summary>Đáp án</summary>

1. Đặt `ARG` **càng gần cuối Dockerfile càng tốt**, để khi thay đổi giá trị (như cập nhật version) thì chỉ phải build lại vài layer cuối.
2. **Luôn tự kiểm tra hành vi cache trên đúng công cụ và phiên bản đang dùng** (ví dụ build thử với hai giá trị `--build-arg` khác nhau rồi so sánh image ID), không tin hoàn toàn vào tài liệu chung — đặc biệt khi dùng `ARG` để "đóng dấu phiên bản".
</details>

### Câu Hỏi 8: `RUN --mount=type=cache` dùng để làm gì, và cần tránh cạm bẫy nào khi sử dụng nó?

<details>
<summary>Đáp án</summary>

- **Công dụng**: `RUN --mount=type=cache` giúp một thư mục cache (ví dụ thư mục tải dependency của Maven hoặc Gradle) **tồn tại giữa các lần build** mà không làm mất instruction cache của layer.
- **Cạm bẫy cần tránh**: Không được xem cache mount là một phần logic bắt buộc của quá trình build. Phải luôn coi nó chỉ là **công cụ tối ưu hiệu năng**, nghĩa là lệnh build vẫn phải chạy đúng với bất kỳ trạng thái/nội dung nào của thư mục cache (không để kết quả build phụ thuộc vào nội dung cache).
</details>

### Câu Hỏi 9: Với lệnh `RUN` sử dụng bind mount, nếu bạn chỉ dùng lệnh `touch` để cập nhật thời điểm sửa file (`mtime`) mà không đổi nội dung file thì có làm mất cache không? Vì sao?

<details>
<summary>Đáp án</summary>

**Không** làm mất cache. Vì với `RUN` dùng bind mount, thời điểm sửa file (`mtime`) **không được tính vào checksum cache**, nên việc chỉ `touch` file không làm thay đổi khóa cache.
</details>

### Câu Hỏi 10: Vì sao các job trên CI thường bị mất build cache, và cách khắc phục trên Docker/BuildKit cũng như Podman/Buildah là gì (kèm lưu ý quan trọng của Podman)?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Runner CI thường là môi trường sạch, **không giữ lại cache cục bộ giữa các job**.
- **Cách khắc phục**: Export và import cache tường minh qua một **cache backend** (như remote repository/registry):
  - **Docker/BuildKit**: Dùng cờ `--cache-to` (đẩy cache ra ngoài) và `--cache-from` (nạp cache vào).
  - **Podman/Buildah**: Dùng `--cache-from` (chỉ định repository làm nguồn cache và cố kéo cache image thay vì chạy lại bước build) và `--cache-to` (chỉ định repository từ xa để lưu cache image).
- **Lưu ý quan trọng trên Podman/Buildah**: Phải truyền thêm cờ **`--layers`**, vì nếu không có `--layers` thì cờ `--cache-from` sẽ **bị bỏ qua** (một lỗi rất hay gặp khi chuyển pipeline từ Docker sang Podman/Buildah).
</details>
