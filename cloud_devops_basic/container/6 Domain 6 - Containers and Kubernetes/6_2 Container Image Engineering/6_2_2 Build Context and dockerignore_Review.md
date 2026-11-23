# Ôn Tập: 6_2_2 Build Context and dockerignore

### Câu Hỏi 1: Build context là gì và cách xác định build context khi chạy lệnh build như thế nào?

<details>
<summary>Đáp án</summary>

**Build context** là tập hợp các file mà quá trình build có thể truy cập được. Khi chạy lệnh build, đối số vị trí bạn truyền vào (ví dụ dấu `.` trong `podman build .`) chính là thứ xác định thư mục làm build context.
</details>

### Câu Hỏi 2: Lệnh `COPY` và `ADD` trong Dockerfile bị giới hạn như thế nào bởi build context?

<details>
<summary>Đáp án</summary>

Lệnh `COPY` và `ADD` chỉ có thể lấy được các file **nằm bên trong build context**. Những file nằm ngoài build context sẽ không thể được sao chép vào image bằng các lệnh này.
</details>

### Câu Hỏi 3: Vì sao kích thước của build context lại ảnh hưởng trực tiếp đến tốc độ build?

<details>
<summary>Đáp án</summary>

Toàn bộ tập file trong build context sẽ được gửi từ build client tới builder. Nếu build context quá lớn (chứa nhiều file không cần thiết), quá trình gửi tới builder sẽ chậm hơn — đặc biệt là khi builder nằm ở xa như trên hệ thống CI hoặc một daemon từ xa.
</details>

### Câu Hỏi 4: Build context liên quan như thế nào đến tính an toàn (bảo mật) của container image?

<details>
<summary>Đáp án</summary>

Mọi file nằm trong build context đều có khả năng lọt vào image thông qua lệnh `COPY . .`. Nếu các file nhạy cảm như `.env`, khóa SSH hoặc thư mục `.git` không được loại khỏi context, chúng có thể bị sao chép nhầm vào bên trong image.
</details>

### Câu Hỏi 5: File `.dockerignore` cần được đặt ở vị trí nào và nó phát huy tác dụng vào thời điểm nào trong quá trình build?

<details>
<summary>Đáp án</summary>

Build client tìm file `.dockerignore` ở **thư mục gốc của build context** (cùng cấp với thư mục bạn truyền cho lệnh build). Nếu tìm thấy, các file hoặc thư mục khớp với mẫu trong `.dockerignore` sẽ bị **loại khỏi context trước khi gửi tới builder**, giúp vừa tăng tốc gửi context vừa ngăn chúng bị `COPY` vào image.
</details>

### Câu Hỏi 6: Cú pháp khai báo các mẫu loại trừ bên trong file `.dockerignore` như thế nào?

<details>
<summary>Đáp án</summary>

File `.dockerignore` được viết dưới dạng danh sách các mẫu, **mỗi dòng một mẫu**, sử dụng cú pháp tương tự **file glob của shell Unix** (ví dụ: `target/`, `*.log`, `.env`).
</details>

### Câu Hỏi 7: Khi dự án có nhiều Dockerfile khác nhau và cần quy tắc loại trừ riêng cho từng file, ta cấu hình như thế nào và độ ưu tiên ra sao?

<details>
<summary>Đáp án</summary>

Bạn có thể tạo file ignore riêng cho từng Dockerfile bằng cách đặt file có tên `<tên Dockerfile>.dockerignore` nằm **cạnh Dockerfile tương ứng**. Nếu cả file ignore riêng này và file `.dockerignore` ở gốc context cùng tồn tại, **file ignore riêng cho Dockerfile sẽ được ưu tiên sử dụng**.
</details>

### Câu Hỏi 8: Podman/Buildah xử lý file ignore như thế nào so với Docker, và nếu dự án dùng cả Docker lẫn Podman thì nên tổ chức file thế nào?

<details>
<summary>Đáp án</summary>

- Podman/Buildah tìm kiếm file tên `.containerignore` **hoặc** `.dockerignore` ở thư mục gốc của context.
- Podman còn hỗ trợ cờ `podman build --ignorefile <đường dẫn>` để chỉ định một file ignore khác khi cần.
- **Thực tiễn**: Nếu dự án dùng cả Docker và Podman, chỉ cần giữ một file `.dockerignore` là đủ cho cả hai; chỉ dùng `--ignorefile` khi cần một cấu hình riêng biệt.
</details>

### Câu Hỏi 9: Trong một dự án Java Maven, những loại file/thư mục nào nên đưa vào `.dockerignore` và lý do là gì?

<details>
<summary>Đáp án</summary>

Một mẫu `.dockerignore` gợi ý cho dự án Java Maven bao gồm:
- `target/`: Bỏ thư mục build ở máy local để quá trình build trong container tự sinh ra kết quả sạch.
- `.git/`: Bỏ thư mục lịch sử Git.
- `.idea/`: Bỏ các file cấu hình của IDE.
- `*.log`: Bỏ các file log.
- `.env`: Bỏ file chứa thông tin bí mật để tránh lọt vào image.
</details>

### Câu Hỏi 10: Nêu một cạm bẫy phổ biến khi dùng `.dockerignore` và cách kiểm chứng trực tiếp rằng file đã bị loại khỏi context?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy đặt sai chỗ**: Đặt `.dockerignore` không đúng thư mục gốc của build context (không cùng cấp với đường dẫn truyền cho lệnh build) khiến build client không áp dụng các quy tắc loại trừ.
- **Cách kiểm chứng**: Dùng một `Dockerfile` có lệnh `COPY . /ctx` và `RUN ls -a /ctx`, sau đó build với cờ `--no-cache` (để đảm bảo lệnh `RUN` chạy lại và in ra kết quả mới) trước và sau khi thêm file cần chặn (như `.env`) vào `.dockerignore`. Khi có `.dockerignore`, file đó sẽ không còn xuất hiện trong danh sách file ở `/ctx`.
</details>
