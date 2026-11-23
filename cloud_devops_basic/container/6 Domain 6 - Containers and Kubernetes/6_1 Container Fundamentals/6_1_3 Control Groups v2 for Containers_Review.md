# Ôn Tập: 6_1_3 Control Groups v2 for Containers

### Câu Hỏi 1: Sự khác biệt cốt lõi giữa Linux Namespaces và cgroups đối với container là gì, và cấu trúc hierarchy của cgroup v2 khác cgroup v1 như thế nào?

<details>
<summary>Đáp án</summary>

- **Namespaces** quyết định một process **nhìn thấy gì** (cô lập góc nhìn hệ thống).
- **cgroups** quyết định một process **được dùng bao nhiêu** tài nguyên (bộ nhớ, CPU, số process).
- Điểm khác biệt về cấu trúc: **cgroup v2 chỉ có một hierarchy duy nhất**, khác với cgroup v1 (nhiều hierarchy). Khi bạn dùng các cờ giới hạn tài nguyên trong Docker hay đặt `resources.limits` trong Kubernetes, công cụ container cuối cùng đều sửa cài đặt cgroup trên máy chủ để kernel thực thi.
</details>

### Câu Hỏi 2: Để xác định một process của container thuộc cgroup nào trên máy chủ Linux dùng cgroup v2, ta đọc file nào và định dạng nội dung của file đó trông như thế nào?

<details>
<summary>Đáp án</summary>

Ta đọc file `/proc/<pid>/cgroup`, đây là file mô tả các control group mà process đó thuộc về.

Với **cgroup v2**, trường `hierarchy-ID` là `0` và danh sách controller rỗng, nên dòng trong file sẽ có dạng:
```text
0::<đường dẫn>
```
Thư mục cgroup thực tế của process là nơi hierarchy v2 được mount (thường là `/sys/fs/cgroup`) ghép với `<đường dẫn>` này.
</details>

### Câu Hỏi 3: Hãy nêu ý nghĩa của 4 thông số bộ nhớ trong cgroup v2: `memory.max`, `memory.current`, `memory.peak`, và `oom_kill` trong `memory.events`?

<details>
<summary>Đáp án</summary>

- `memory.max`: Giới hạn cứng bộ nhớ của cgroup (mặc định là `max`); đây là cơ chế chính để giới hạn bộ nhớ.
- `memory.current`: Tổng lượng bộ nhớ mà cgroup hiện tại và các cgroup con của nó đang sử dụng.
- `memory.peak`: Mức sử dụng bộ nhớ tối đa ghi nhận được kể từ khi tạo cgroup hoặc từ lần reset gần nhất.
- `memory.events` → `oom_kill`: Số lượng process thuộc cgroup đã bị OOM killer giết.
</details>

### Câu Hỏi 4: Điều gì xảy ra khi bộ nhớ của cgroup chạm `memory.max` và không thể giảm xuống? Trong Kubernetes, vì sao container cấp phát vượt `limits.memory` chưa chắc bị giết ngay lập tức?

<details>
<summary>Đáp án</summary>

- Khi bộ nhớ cgroup chạm `memory.max` và không giảm được, **OOM killer được gọi trong cgroup đó** để giết process.
- Trong **Kubernetes**, giới hạn `memory` được kernel thực thi bằng OOM kill, nhưng việc kill **chỉ xảy ra khi kernel phát hiện áp lực bộ nhớ (memory pressure)**. Do đó, một container cấp phát vượt giới hạn bộ nhớ chưa chắc bị giết ngay lập tức tại thời điểm vừa vượt.
</details>

### Câu Hỏi 5: Giải thích ý nghĩa và cấu trúc của `cpu.max` và `cpu.weight` trong cgroup v2. Flag `--cpus="1.5"` của Docker tương đương với các tham số nào?

<details>
<summary>Đáp án</summary>

- **`cpu.max`**: Có dạng `$MAX $PERIOD` (mặc định `max 100000`). Nhóm được dùng tối đa `$MAX` thời gian CPU trong mỗi chu kỳ `$PERIOD`; giá trị `max` nghĩa là không giới hạn.
- **`cpu.weight`**: Dùng để **chia CPU theo tỉ lệ** cho các nhóm đang hoạt động khi có sự tranh chấp CPU; giá trị mặc định là `100`, nằm trong dải `[1, 10000]`.
- **Trong Docker**: `--cpus="1.5"` tương đương với `--cpu-period="100000"` và `--cpu-quota="150000"`.
</details>

### Câu Hỏi 6: So sánh điều gì xảy ra khi container vượt giới hạn CPU (`cpu.max`) với khi container vượt giới hạn bộ nhớ (`memory.max`)? Vì sao cạm bẫy CPU limit lại khó phát hiện hơn?

<details>
<summary>Đáp án</summary>

- **Vượt giới hạn bộ nhớ (`memory.max`)**: Khi không giảm được bộ nhớ, OOM killer được gọi trong cgroup và process bị giết đột ngột (thường thấy exit code `137`).
- **Vượt giới hạn CPU (`cpu.max`)**: Process chỉ bị **làm chậm (CPU throttling)** chứ **không bị kill**. Trong Kubernetes, giới hạn CPU cũng được thực thi bằng CPU throttling: khi chạm giới hạn, kernel sẽ hạn chế quyền truy cập CPU.
- **Lý do khó phát hiện**: Khi bị CPU throttling, ứng dụng chạy chậm đi và latency tăng lên, nhưng **không có sự kiện hay log nào báo lỗi** như OOM kill; người vận hành phải kiểm tra thống kê throttling của cgroup hoặc metric tương ứng.
</details>

### Câu Hỏi 7: File `pids.max` dùng để làm gì, giá trị mặc định là gì, và điều gì xảy ra khi tạo process mới vượt quá ngưỡng này? Podman cấu hình giới hạn này qua cờ nào?

<details>
<summary>Đáp án</summary>

- `pids.max` là **giới hạn cứng số lượng process** trong cgroup, mặc định là `max`.
- Khi việc tạo process mới vi phạm chính sách `pids.max`, lời gọi hệ thống `fork()` hoặc `clone()` sẽ thất bại và trả về lỗi `-EAGAIN`.
- Podman ánh xạ vào đây thông qua cờ `--pids-limit` (mặc định là `2048` nếu hệ thống hỗ trợ `pids` cgroup controller; giá trị `-1` nghĩa là không giới hạn).
</details>

### Câu Hỏi 8: Vì sao container bị kill bằng `SIGKILL` lại trả về exit code `137` còn `SIGTERM` trả về `143`? Tại sao không nên chỉ dựa vào mã thoát `137` để kết luận OOM kill?

<details>
<summary>Đáp án</summary>

- Shell (Bash) tính exit status theo công thức `128 + n` khi một lệnh bị kết thúc bởi signal `n`.
- `SIGKILL` là signal `9` (đặc biệt ở chỗ **không thể bị bắt, chặn hay bỏ qua**), nên exit code là `128 + 9 = 137`. `SIGTERM` là signal `15`, nên exit code là `128 + 15 = 143`.
- Không nên chỉ dựa vào mỗi exit code `137` để kết luận OOM kill (trong phạm vi ledger bài học, việc OOM killer dùng `SIGKILL` là hiểu biết chung chưa có trích dẫn riêng). Để xác nhận chắc chắn, cần kiểm tra bộ đếm `oom_kill` trong `memory.events` và trường `OOMKilled` trong lệnh `inspect`.
</details>

### Câu Hỏi 9: Các cấu hình giới hạn bộ nhớ, CPU và số process trong Podman, Docker và Kubernetes được ánh xạ tương ứng xuống các file cgroup v2 nào?

<details>
<summary>Đáp án</summary>

- **Bộ nhớ**: Podman `--memory`, Docker (cờ giới hạn bộ nhớ), Kubernetes `limits.memory` → ánh xạ xuống file `memory.max`.
- **CPU**: Podman `--cpus`, Docker `--cpus`, Kubernetes `limits.cpu` → ánh xạ xuống file `cpu.max`.
- **Số process**: Podman `--pids-limit` (và cờ tương tự ở Docker) → ánh xạ xuống file `pids.max`.
</details>

### Câu Hỏi 10: Viết các câu lệnh Podman thực hành để: (1) chạy container nền `limits-demo` từ image `docker.io/library/alpine` với `sleep 600` giới hạn 128 MB RAM, 0.5 CPU, 50 process; (2) kiểm tra trạng thái `OOMKilled`; và (3) dọn dẹp container đó?

<details>
<summary>Đáp án</summary>

*(Với Docker, có thể đổi `podman` thành `docker`.)*

```bash
# 1. Chạy container nền với giới hạn bộ nhớ, CPU và số process
podman run -d --name limits-demo --memory 128m --cpus 0.5 --pids-limit 50 \
  docker.io/library/alpine sleep 600

# 2. Kiểm tra riêng trạng thái OOMKilled bằng --format (có thể chạy podman inspect limits-demo để xem JSON đầy đủ)
podman inspect limits-demo --format '{{.State.OOMKilled}}'

# 3. Dọn dẹp container
podman rm -f limits-demo
```
</details>

### Câu Hỏi 11: Khi đã có `<PID>` của process container nhìn từ máy chủ (lấy qua `podman inspect`), làm thế nào để đọc trực tiếp các file `memory.max`, `cpu.max`, `pids.max` và `memory.events` của container đó?

<details>
<summary>Đáp án</summary>

1. Đọc `/proc/<PID>/cgroup` để tìm đường dẫn cgroup của process (dòng có dạng `0::<đường dẫn>`):
```bash
cat /proc/<PID>/cgroup
```
2. Ghép điểm mount của hierarchy cgroup v2 (thường là `/sys/fs/cgroup`, cần xác nhận trên máy đang dùng) với `<đường dẫn>` vừa tìm được để đọc trực tiếp các file:
```bash
cat /sys/fs/cgroup/<đường dẫn>/memory.max
cat /sys/fs/cgroup/<đường dẫn>/cpu.max
cat /sys/fs/cgroup/<đường dẫn>/pids.max
cat /sys/fs/cgroup/<đường dẫn>/memory.events
```
*(Lưu ý: truy cập file cgroup có thể cần quyền root.)*
</details>

### Câu Hỏi 12: Điều gì xảy ra nếu bạn chạy container mà quên không đặt các cờ giới hạn tài nguyên? Thực tiễn tốt nhất cần làm là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất**: Mặc định container **không có giới hạn tài nguyên**.
- **Thực tiễn tốt nhất**: Luôn chủ động đặt giới hạn với `--memory` / `--cpus` khi chạy bằng Docker/Podman (hoặc khai báo `resources` trong Kubernetes).
</details>

### Câu Hỏi 13: Khi chạy Podman ở chế độ rootless (người dùng không phải root), có những hạn chế nào liên quan đến việc áp dụng giới hạn bộ nhớ và CPU?

<details>
<summary>Đáp án</summary>

- Theo tài liệu Podman, các cờ `--memory` và `--cpus` **không được hỗ trợ trên hệ thống rootless dùng cgroups v1**.
- Ngay cả với cgroup v2, trên một số hệ thống, việc thay đổi giới hạn CPU có thể **không được phép đối với người dùng không phải root** (*"On some systems, changing the CPU limits may not be allowed for non-root users"*).
- **Thực tiễn**: Sử dụng cgroup v2 và tham khảo phần troubleshooting của Podman khi gặp lỗi phân quyền.
</details>
